// @ts-nocheck - Temporary fix until Supabase types are regenerated
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Plus, Package, Trash2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Produto {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  estoque: number;
}

interface KitComponente {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  estoque_disponivel: number;
}

export default function AddKitDialog({ onKitAdded }: { onKitAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [precoTotal, setPrecoTotal] = useState("");
  const [loading, setLoading] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [componentes, setComponentes] = useState<KitComponente[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidadeComponente, setQuantidadeComponente] = useState(1);

  useEffect(() => {
    if (open) {
      fetchProdutos();
    }
  }, [open]);

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, codigo, nome, descricao, estoque')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setProdutos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar produtos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const adicionarComponente = () => {
    if (!produtoSelecionado || quantidadeComponente <= 0) {
      toast({
        title: "Dados inválidos",
        description: "Selecione um produto e quantidade válida",
        variant: "destructive",
      });
      return;
    }

    const produto = produtos.find(p => p.id === produtoSelecionado);
    if (!produto) return;

    const jaAdicionado = componentes.find(c => c.produto_id === produtoSelecionado);
    if (jaAdicionado) {
      toast({
        title: "Produto já adicionado",
        description: "Remova o componente existente antes de adicionar novamente",
        variant: "destructive",
      });
      return;
    }

    setComponentes([...componentes, {
      produto_id: produto.id,
      produto_nome: produto.nome || produto.descricao,
      quantidade: quantidadeComponente,
      estoque_disponivel: produto.estoque,
    }]);

    setProdutoSelecionado("");
    setQuantidadeComponente(1);
  };

  const removerComponente = (produto_id: string) => {
    setComponentes(componentes.filter(c => c.produto_id !== produto_id));
  };

  const calcularEstoqueDisponivel = () => {
    if (componentes.length === 0) return 0;
    return Math.min(...componentes.map(c => Math.floor(c.estoque_disponivel / c.quantidade)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!codigo || !nome || !precoTotal) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha código, nome e preço do kit.",
        variant: "destructive",
      });
      return;
    }

    if (componentes.length === 0) {
      toast({
        title: "Adicione componentes",
        description: "O kit precisa ter pelo menos um componente.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: kitData, error: kitError } = await supabase
        .from('kits')
        .insert({
          codigo,
          nome,
          descricao: descricao || null,
          preco_total: parseFloat(precoTotal),
          ativo: true,
        })
        .select()
        .single();

      if (kitError) throw kitError;

      const kitItens = componentes.map(c => ({
        kit_id: kitData.id,
        produto_id: c.produto_id,
        quantidade: c.quantidade,
      }));

      const { error: itensError } = await supabase
        .from('kit_itens')
        .insert(kitItens);

      if (itensError) throw itensError;

      toast({
        title: "Kit criado com sucesso!",
        description: `Kit ${codigo} criado. Estoque disponível: ${calcularEstoqueDisponivel()} unidades`,
      });

      setOpen(false);
      resetForm();
      onKitAdded();
    } catch (error: any) {
      toast({
        title: "Erro ao criar kit",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCodigo("");
    setNome("");
    setDescricao("");
    setPrecoTotal("");
    setComponentes([]);
    setProdutoSelecionado("");
    setQuantidadeComponente(1);
  };

  const estoqueDisponivel = calcularEstoqueDisponivel();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Kit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Criar Kit de Produtos
            </DialogTitle>
            <DialogDescription>
              Agrupe múltiplos produtos em um kit. O estoque será calculado automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="KIT-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco">Preço Total *</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  value={precoTotal}
                  onChange={(e) => setPrecoTotal(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Kit *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Kit Completo de Perfis"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição do kit..."
                rows={2}
              />
            </div>

            <div className="border rounded-lg p-4 space-y-4 bg-accent/5">
              <h3 className="font-semibold">Componentes do Kit</h3>

              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-7">
                  <Label>Produto</Label>
                  <Select value={produtoSelecionado} onValueChange={setProdutoSelecionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.codigo} - {p.nome || p.descricao} (Estoque: {p.estoque})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-3">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantidadeComponente}
                    onChange={(e) => setQuantidadeComponente(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="col-span-2 flex items-end">
                  <Button type="button" onClick={adicionarComponente} className="w-full">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {componentes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Componentes Adicionados:</h4>
                  {componentes.map((comp) => (
                    <div key={comp.produto_id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <div>
                        <p className="font-medium">{comp.produto_nome}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantidade: {comp.quantidade} | Estoque: {comp.estoque_disponivel}
                          {comp.quantidade > comp.estoque_disponivel && (
                            <span className="text-destructive ml-2">⚠ Insuficiente</span>
                          )}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removerComponente(comp.produto_id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {componentes.length > 0 && (
              <Alert variant={estoqueDisponivel > 0 ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Estoque Disponível do Kit:</strong> {estoqueDisponivel} unidades
                  <p className="text-xs mt-1">
                    Baseado na disponibilidade dos componentes
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Kit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
