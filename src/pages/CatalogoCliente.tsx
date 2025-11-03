// @ts-nocheck - Temporary fix until Supabase types are regenerated
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Package, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  codigo: string;
  descricao: string;
  tipo: string | null;
  cor: string | null;
  preco_venda: number;
  peso: number | null;
  foto_url: string | null;
  estoque: Array<{ quantidade: number }>;
}

interface CartItem {
  produto_id: string;
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  peso?: number;
}

export default function CatalogoCliente() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    loadCart();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, codigo, descricao, tipo, cor, preco_venda, peso, foto_url, estoque(quantidade)')
        .order('descricao', { ascending: true });

      if (error) throw error;
      
      const productsWithEstoque = (data || []).map(p => ({
        ...p,
        estoque: Array.isArray(p.estoque) ? p.estoque : [p.estoque]
      }));
      
      setProducts(productsWithEstoque as Product[]);
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

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const addToCart = (product: Product) => {
    const estoque = product.estoque[0]?.quantidade || 0;
    if (estoque <= 0) {
      toast({
        title: "Produto sem estoque",
        description: "Este produto não está disponível no momento",
        variant: "destructive",
      });
      return;
    }

    const existingItem = cart.find(item => item.produto_id === product.id);
    let newCart: CartItem[];

    if (existingItem) {
      if (existingItem.quantidade >= estoque) {
        toast({
          title: "Quantidade máxima",
          description: `Só temos ${estoque} unidades disponíveis`,
          variant: "destructive",
        });
        return;
      }
      newCart = cart.map(item =>
        item.produto_id === product.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      );
    } else {
      newCart = [...cart, {
        produto_id: product.id,
        descricao: product.descricao,
        quantidade: 1,
        preco_unitario: product.preco_venda,
        peso: product.peso || 0,
      }];
    }

    saveCart(newCart);
    toast({
      title: "Produto adicionado",
      description: `${product.descricao} foi adicionado ao carrinho`,
    });
  };

  const filteredProducts = products.filter((product) =>
    product.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartTotal = cart.reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0);
  const cartItems = cart.reduce((sum, item) => sum + item.quantidade, 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-8 text-muted-foreground">
          Carregando catálogo...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 animate-fade-in">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Catálogo de Produtos</h2>
              <p className="text-muted-foreground">Descubra nossas melhores ofertas</p>
            </div>
            {cartItems > 0 && (
              <Button onClick={() => navigate('/carrinho')} size="lg" className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:scale-105 transition-all duration-200 relative">
                <ShoppingCart className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Carrinho</span> ({cartItems})
                <span className="hidden md:inline ml-2">- R$ {cartTotal.toFixed(2)}</span>
                <span className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">{cartItems}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl text-lg shadow-sm"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const estoque = product.estoque[0]?.quantidade || 0;
              const inCart = cart.find(item => item.produto_id === product.id);

              return (
                <Card key={product.id} className="group overflow-hidden border-0 shadow-lg hover-lift bg-white">
                  <div className="aspect-square bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center relative overflow-hidden">
                    {product.foto_url ? (
                      <img
                        src={product.foto_url}
                        alt={product.descricao}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <Package className="h-20 w-20 text-primary/20" />
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
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cód: {product.codigo}</p>
                      <h3 className="font-bold text-foreground text-lg line-clamp-2 min-h-[3.5rem]">{product.descricao}</h3>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      {product.tipo && (
                        <Badge className="bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-0">{product.tipo}</Badge>
                      )}
                      {product.cor && (
                        <Badge variant="outline" className="border-primary/30 text-primary">{product.cor}</Badge>
                      )}
                    </div>

                    <div className="border-t border-border/50 pt-3 mt-2">
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Preço por kg</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            R$ {product.preco_venda.toFixed(2)}
                          </p>
                          {product.peso && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {product.peso} kg por unidade
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => addToCart(product)}
                        disabled={estoque <= 0}
                        className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:shadow-xl hover:scale-105 transition-all duration-200 text-base font-semibold"
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        {inCart ? `No carrinho (${inCart.quantidade})` : 'Adicionar ao Carrinho'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <Package className="h-24 w-24 mx-auto mb-4 text-muted-foreground/20" />
            <h3 className="text-xl font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground">Tente ajustar sua busca</p>
          </div>
        )}
      </div>
    </div>
  );
}