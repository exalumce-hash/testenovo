import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, Package, Filter, X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Produto {
  id: string;
  codigo: string;
  descricao: string;
  preco_venda: number;
  tipo: string | null;
  liga: string | null;
  cor: string | null;
  foto_url: string | null;
  peso: number | null;
  unidade: string;
  estoque?: { quantidade: number };
}

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

export default function CatalogoPublico() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroLiga, setFiltroLiga] = useState<string>("todos");
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*, estoque(quantidade)')
        .order('descricao');

      if (error) throw error;
      setProdutos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar produtos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const adicionarAoCarrinho = (produto: Produto) => {
    const itemExistente = carrinho.find(item => item.produto.id === produto.id);
    
    if (itemExistente) {
      setCarrinho(carrinho.map(item =>
        item.produto.id === produto.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      setCarrinho([...carrinho, { produto, quantidade: 1 }]);
    }

    toast({
      title: "Produto adicionado!",
      description: `${produto.descricao} foi adicionado ao carrinho`,
    });
  };

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho(carrinho.filter(item => item.produto.id !== produtoId));
  };

  const atualizarQuantidade = (produtoId: string, quantidade: number) => {
    if (quantidade < 1) {
      removerDoCarrinho(produtoId);
      return;
    }
    
    setCarrinho(carrinho.map(item =>
      item.produto.id === produtoId
        ? { ...item, quantidade }
        : item
    ));
  };

  const produtosFiltrados = produtos.filter(produto => {
    const matchSearch = produto.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       produto.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filtroTipo === "todos" || produto.tipo === filtroTipo;
    const matchLiga = filtroLiga === "todos" || produto.liga === filtroLiga;
    
    return matchSearch && matchTipo && matchLiga;
  });

  const tipos = [...new Set(produtos.map(p => p.tipo).filter(Boolean))];
  const ligas = [...new Set(produtos.map(p => p.liga).filter(Boolean))];

  const totalCarrinho = carrinho.reduce((total, item) => 
    total + (item.produto.preco_venda * item.quantidade), 0
  );

  const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);

  const finalizarPedido = () => {
    const mensagem = `Olá! Gostaria de fazer um pedido:\n\n${carrinho.map(item =>
      `${item.quantidade}x ${item.produto.descricao} - R$ ${item.produto.preco_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/kg`
    ).join('\n')}\n\nTotal: R$ ${totalCarrinho.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Package className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Catálogo Exalum</h1>
                <p className="text-sm text-muted-foreground">Qualidade em alumínio para seu negócio</p>
              </div>
            </div>

            <Sheet open={carrinhoAberto} onOpenChange={setCarrinhoAberto}>
              <SheetTrigger asChild>
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:scale-105 transition-all duration-200 relative h-12 px-6">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Carrinho</span>
                  {totalItens > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 bg-destructive animate-pulse">
                      {totalItens}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Meu Carrinho
                  </SheetTitle>
                  <SheetDescription>
                    {totalItens} {totalItens === 1 ? 'item' : 'itens'} no carrinho
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-8 space-y-4">
                  {carrinho.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p>Seu carrinho está vazio</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {carrinho.map(item => (
                          <Card key={item.produto.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm">{item.produto.descricao}</h4>
                                  <p className="text-xs text-muted-foreground">{item.produto.codigo}</p>
                                  <p className="text-sm font-bold text-primary mt-1">
                                    R$ {item.produto.preco_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/kg
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => atualizarQuantidade(item.produto.id, item.quantidade - 1)}
                                  >
                                    -
                                  </Button>
                                  <span className="w-8 text-center font-medium">{item.quantidade}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => atualizarQuantidade(item.produto.id, item.quantidade + 1)}
                                  >
                                    +
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removerDoCarrinho(item.produto.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="border-t pt-4 space-y-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-primary">
                            R$ {totalCarrinho.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        
                        <Button size="lg" className="w-full" onClick={finalizarPedido}>
                          <Send className="h-5 w-5 mr-2" />
                          Enviar Pedido via WhatsApp
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border-0 shadow-lg p-6 space-y-4">
          <div className="flex items-center gap-2 text-base font-bold">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <span>Filtrar Produtos</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg"
              />
            </div>

            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="h-12 border-2 border-border/50 focus:ring-4 focus:ring-primary/10">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {tipos.map(tipo => (
                  <SelectItem key={tipo} value={tipo!}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroLiga} onValueChange={setFiltroLiga}>
              <SelectTrigger className="h-12 border-2 border-border/50 focus:ring-4 focus:ring-primary/10">
                <SelectValue placeholder="Liga" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as ligas</SelectItem>
                {ligas.map(liga => (
                  <SelectItem key={liga} value={liga!}>{liga}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 pb-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando produtos...</p>
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
            {produtosFiltrados.map(produto => {
              const estoque = produto.estoque?.quantidade || 0;
              
              return (
                <Card key={produto.id} className="group hover-lift overflow-hidden border-0 shadow-lg bg-white">
                  <div className="aspect-square bg-gradient-to-br from-slate-100 to-blue-50 relative overflow-hidden">
                    {produto.foto_url ? (
                      <img
                        src={produto.foto_url}
                        alt={produto.descricao}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-24 w-24 text-primary/20" />
                      </div>
                    )}

                    {estoque > 0 && (
                      <Badge className="absolute top-3 right-3 bg-success shadow-lg">
                        {estoque} disponível
                      </Badge>
                    )}
                    {estoque === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Badge variant="destructive" className="text-lg px-4 py-2">Sem Estoque</Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-5 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cód: {produto.codigo}</p>
                      <h3 className="font-bold line-clamp-2 min-h-[3rem] text-lg">{produto.descricao}</h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {produto.tipo && (
                        <Badge className="bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-0 text-xs">
                          {produto.tipo}
                        </Badge>
                      )}
                      {produto.liga && (
                        <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                          {produto.liga}
                        </Badge>
                      )}
                    </div>

                    <div className="border-t border-border/50 pt-3 mt-2">
                      {produto.peso && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {produto.peso}kg por unidade
                        </p>
                      )}

                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">Preço por kg</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          R$ {produto.preco_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <Button
                        className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:shadow-xl hover:scale-105 transition-all duration-200 text-base font-semibold"
                        onClick={() => adicionarAoCarrinho(produto)}
                        disabled={estoque === 0}
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        {estoque === 0 ? 'Sem Estoque' : 'Adicionar ao Carrinho'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
