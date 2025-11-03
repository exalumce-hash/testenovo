// @ts-nocheck - Temporary fix until Supabase types are regenerated
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Download, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { gerarPDFOrcamento, downloadPDF } from "@/utils/pdfGenerator";

interface Cliente {
  id: string;
  nome: string;
  cpf_cnpj: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
}

interface Produto {
  id: string;
  descricao: string;
  nome: string;
  preco: number;
  peso: number | null;
  estoque: number;
}

interface Kit {
  id: string;
  codigo: string;
  nome: string;
  preco_total: number;
  estoque_disponivel: number;
}

interface ItemOrcamento {
  produto_id?: string;
  kit_id?: string;
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  peso: number | null;
  desconto: number;
  tipo: 'produto' | 'kit';
}

export default function AddOrcamentoDialog({ onOrcamentoAdded }: { onOrcamentoAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [tipoItem, setTipoItem] = useState<'produto' | 'kit'>('produto');
  const [itemSelecionado, setItemSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [desconto, setDesconto] = useState(0);

  useEffect(() => {
    if (open) {
      fetchClientes();
      fetchProdutos();
      fetchKits();
    }
  }, [open]);

  const fetchClientes = async () => {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('nome');
    if (data) setClientes(data);
  };

  const fetchProdutos = async () => {
    const { data } = await supabase
      .from('produtos')
      .select('id, codigo, nome, descricao, preco, peso, estoque')
      .eq('ativo', true)
      .order('nome');
    if (data) {
      setProdutos(data as Produto[]);
    }
  };

  const fetchKits = async () => {
    const { data } = await supabase
      .from('kits_estoque_disponivel')
      .select('kit_id, codigo, nome, preco_total, estoque_disponivel')
      .order('nome');
    if (data) {
      setKits(data.map(k => ({
        id: k.kit_id,
        codigo: k.codigo,
        nome: k.nome,
        preco_total: k.preco_total,
        estoque_disponivel: k.estoque_disponivel
      })));
    }
  };

  const addItem = () => {
    if (!itemSelecionado || quantidade <= 0) return;

    if (tipoItem === 'produto') {
      const produto = produtos.find(p => p.id === itemSelecionado);
      if (!produto) return;

      if (quantidade > produto.estoque) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${produto.estoque} unidades disponíveis`,
          variant: "destructive",
        });
        return;
      }

      const itemExistente = itens.find(i => i.produto_id === itemSelecionado);
      if (itemExistente) {
        toast({
          title: "Item já adicionado",
          description: "Remova o item existente antes de adicionar novamente",
          variant: "destructive",
        });
        return;
      }

      setItens([...itens, {
        produto_id: produto.id,
        descricao: produto.descricao || produto.nome,
        quantidade,
        preco_unitario: produto.preco,
        peso: produto.peso,
        desconto: desconto,
        tipo: 'produto'
      }]);
    } else {
      const kit = kits.find(k => k.id === itemSelecionado);
      if (!kit) return;

      if (quantidade > kit.estoque_disponivel) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${kit.estoque_disponivel} kits disponíveis`,
          variant: "destructive",
        });
        return;
      }

      const itemExistente = itens.find(i => i.kit_id === itemSelecionado);
      if (itemExistente) {
        toast({
          title: "Kit já adicionado",
          description: "Remova o item existente antes de adicionar novamente",
          variant: "destructive",
        });
        return;
      }

      setItens([...itens, {
        kit_id: kit.id,
        descricao: kit.nome,
        quantidade,
        preco_unitario: kit.preco_total,
        peso: null,
        desconto: desconto,
        tipo: 'kit'
      }]);
    }

    setItemSelecionado("");
    setQuantidade(1);
    setDesconto(0);
  };

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleSubmit = async (gerarPDF: boolean = false) => {
    if (!clienteId || itens.length === 0) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um cliente e adicione produtos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Gerar número do orçamento
      const { data: numeroOrcamento } = await supabase.rpc('gerar_numero_orcamento');

      // Criar orçamento
      const valorTotal = itens.reduce((sum, item) => {
        const subtotal = item.quantidade * item.preco_unitario;
        return sum + (subtotal - (subtotal * item.desconto / 100));
      }, 0);
      
      const { data: orcamento, error: orcError } = await supabase
        .from('orcamentos')
        .insert({
          numero: numeroOrcamento,
          cliente_id: clienteId,
          valor_total: valorTotal,
          observacoes: observacoes || null,
          status: 'pendente',
        })
        .select()
        .single();

      if (orcError) throw orcError;

      // Adicionar itens
      const orcamentoItens = itens.map(item => {
        const subtotal = item.quantidade * item.preco_unitario;
        const valorDesconto = subtotal * item.desconto / 100;
        return {
          orcamento_id: orcamento.id,
          produto_id: item.produto_id || null,
          kit_id: item.kit_id || null,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          desconto: item.desconto,
          peso: item.peso,
          subtotal: subtotal - valorDesconto,
        };
      });

      const { error: itensError } = await supabase
        .from('orcamento_itens')
        .insert(orcamentoItens);

      if (itensError) throw itensError;

      toast({
        title: "Orçamento criado!",
        description: `Orçamento ${numeroOrcamento} criado com sucesso`,
      });

      // Gerar PDF se solicitado
      if (gerarPDF) {
        await gerarEBaixarPDF(orcamento.id, numeroOrcamento);
      }

      setOpen(false);
      resetForm();
      onOrcamentoAdded();
    } catch (error: any) {
      toast({
        title: "Erro ao criar orçamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const gerarEBaixarPDF = async (orcamentoId: string, numeroOrcamento: string) => {
    try {
      // Buscar dados completos
      const { data: config } = await supabase
        .from('configuracoes')
        .select('*')
        .limit(1)
        .single();

      const { data: cliente } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .single();

      if (!config || !cliente) throw new Error('Dados não encontrados');

      const dataAtual = new Date().toLocaleDateString('pt-BR');
      const dataValidade = new Date();
      dataValidade.setDate(dataValidade.getDate() + 7);

      const dadosOrcamento = {
        numero: numeroOrcamento,
        data: dataAtual,
        validade: dataValidade.toLocaleDateString('pt-BR'),
        cliente,
        itens: itens.map(item => {
          const subtotal = item.quantidade * item.preco_unitario;
          const valorDesconto = subtotal * item.desconto / 100;
          return {
            descricao: item.descricao,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            desconto: item.desconto,
            subtotal: subtotal - valorDesconto,
            peso: item.peso || undefined,
          };
        }),
        valor_total: itens.reduce((sum, item) => {
          const subtotal = item.quantidade * item.preco_unitario;
          return sum + (subtotal - (subtotal * item.desconto / 100));
        }, 0),
        observacoes,
      };

      const pdfBlob = await gerarPDFOrcamento(dadosOrcamento, config);
      downloadPDF(pdfBlob, `orcamento_${numeroOrcamento}.pdf`);
    } catch (error: any) {
      toast({
        title: "Erro ao gerar PDF",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setClienteId("");
    setObservacoes("");
    setItens([]);
    setItemSelecionado("");
    setQuantidade(1);
    setDesconto(0);
  };

  const valorTotal = itens.reduce((sum, item) => {
    const subtotal = item.quantidade * item.preco_unitario;
    return sum + (subtotal - (subtotal * item.desconto / 100));
  }, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Orçamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Orçamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map(cliente => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome} - {cliente.cpf_cnpj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border border-border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Adicionar Itens ao Orçamento</h3>

            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={tipoItem} onValueChange={(value: 'produto' | 'kit') => {
                  setTipoItem(value);
                  setItemSelecionado("");
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produto">Produto</SelectItem>
                    <SelectItem value="kit">Kit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>{tipoItem === 'produto' ? 'Produto' : 'Kit'}</Label>
                {tipoItem === 'produto' ? (
                  <Select value={itemSelecionado} onValueChange={setItemSelecionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.map(produto => (
                        <SelectItem key={produto.id} value={produto.id}>
                          {produto.nome || produto.descricao} - R$ {produto.preco.toFixed(2)} (Estoque: {produto.estoque})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={itemSelecionado} onValueChange={setItemSelecionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um kit" />
                    </SelectTrigger>
                    <SelectContent>
                      {kits.map(kit => (
                        <SelectItem key={kit.id} value={kit.id}>
                          {kit.nome} - R$ {kit.preco_total.toFixed(2)} (Disponível: {kit.estoque_disponivel})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label>Desconto (%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={desconto}
                    onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                  />
                  <Button onClick={addItem} type="button">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {itens.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Itens do Orçamento:</h4>
                <div className="space-y-2">
                  {itens.map((item, index) => (
                    <div key={item.produto_id} className="grid grid-cols-12 gap-2 items-center p-3 bg-secondary rounded-lg">
                      <div className="col-span-4">
                        <p className="font-medium">{item.descricao}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantidade}
                          onChange={(e) => {
                            const newItens = [...itens];
                            newItens[index].quantidade = parseInt(e.target.value) || 1;
                            setItens(newItens);
                          }}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Preço Unit.</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.preco_unitario}
                          onChange={(e) => {
                            const newItens = [...itens];
                            newItens[index].preco_unitario = parseFloat(e.target.value) || 0;
                            setItens(newItens);
                          }}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Desc. (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.desconto}
                          onChange={(e) => {
                            const newItens = [...itens];
                            newItens[index].desconto = parseFloat(e.target.value) || 0;
                            setItens(newItens);
                          }}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <p className="text-xs text-muted-foreground">Subtotal</p>
                        <p className="font-semibold">
                          R$ {((item.quantidade * item.preco_unitario) - ((item.quantidade * item.preco_unitario) * item.desconto / 100)).toFixed(2)}
                        </p>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => removeItem(index)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xl font-bold text-right">
                    Total: R$ {valorTotal.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre o orçamento..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={loading}>
              Salvar
            </Button>
            <Button onClick={() => handleSubmit(true)} disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Salvar e Gerar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}