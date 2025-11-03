// @ts-nocheck - Temporary fix until Supabase types are regenerated
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AddKitDialog from "@/components/produtos/AddKitDialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface ComponenteKit {
  produto_codigo: string;
  produto_nome: string;
  quantidade_necessaria: number;
  estoque_disponivel: number;
  kits_possiveis: number;
}

interface Kit {
  kit_id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  preco_total: number;
  ativo: boolean;
  estoque_disponivel: number;
  componentes: ComponenteKit[];
}

export default function KitsMontados() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedKits, setExpandedKits] = useState<Set<string>>(new Set());

  const fetchKits = async () => {
    try {
      const { data, error } = await supabase
        .from('kits_estoque_disponivel')
        .select('*')
        .order('nome');

      if (error) throw error;
      setKits(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar kits",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKits();
  }, []);

  const toggleKit = (kitId: string) => {
    const newExpanded = new Set(expandedKits);
    if (newExpanded.has(kitId)) {
      newExpanded.delete(kitId);
    } else {
      newExpanded.add(kitId);
    }
    setExpandedKits(newExpanded);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Kits Pré-Montados
          </h2>
          <p className="text-muted-foreground text-lg">
            Gerencie kits de produtos com controle automático de estoque
          </p>
        </div>
        <AddKitDialog onKitAdded={fetchKits} />
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Como funciona o estoque de kits</AlertTitle>
        <AlertDescription>
          O estoque de cada kit é calculado automaticamente baseado na disponibilidade de seus componentes.
          Quando um kit é vendido, o estoque de todos os seus componentes é debitado automaticamente.
        </AlertDescription>
      </Alert>

      <Card className="border-0 shadow-lg">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-accent to-primary"></div>
        <CardHeader className="bg-gradient-to-br from-white to-blue-50/30">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            Kits Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : kits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum kit cadastrado ainda</p>
              <p className="text-sm mt-2">Clique em "Novo Kit" para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {kits.map((kit) => (
                <Card key={kit.kit_id} className="overflow-hidden">
                  <Collapsible open={expandedKits.has(kit.kit_id)}>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <h3 className="text-lg font-semibold">{kit.nome}</h3>
                            <Badge
                              variant={kit.estoque_disponivel > 0 ? "default" : "destructive"}
                              className="text-sm"
                            >
                              {kit.estoque_disponivel} {kit.estoque_disponivel === 1 ? 'kit disponível' : 'kits disponíveis'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {kit.codigo} • {kit.descricao || 'Sem descrição'}
                          </p>
                          <p className="text-sm font-medium text-primary mt-1">
                            R$ {kit.preco_total.toFixed(2)}
                          </p>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKit(kit.kit_id)}
                          >
                            Ver componentes
                            <ChevronDown
                              className={`ml-2 h-4 w-4 transition-transform ${
                                expandedKits.has(kit.kit_id) ? 'rotate-180' : ''
                              }`}
                            />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>

                    <CollapsibleContent>
                      <div className="border-t bg-accent/5 p-4">
                        <h4 className="text-sm font-semibold mb-3">Componentes do Kit:</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Código</TableHead>
                              <TableHead>Produto</TableHead>
                              <TableHead className="text-right">Qtd Necessária</TableHead>
                              <TableHead className="text-right">Estoque</TableHead>
                              <TableHead className="text-right">Kits Possíveis</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {kit.componentes && kit.componentes.map((comp, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">
                                  {comp.produto_codigo}
                                </TableCell>
                                <TableCell>{comp.produto_nome}</TableCell>
                                <TableCell className="text-right">
                                  {comp.quantidade_necessaria}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge
                                    variant={
                                      comp.estoque_disponivel >= comp.quantidade_necessaria
                                        ? "default"
                                        : "destructive"
                                    }
                                  >
                                    {comp.estoque_disponivel}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {comp.kits_possiveis}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                          <p className="text-sm">
                            <strong>Limitação:</strong> O componente com menor disponibilidade limita
                            a quantidade de kits que podem ser montados.
                          </p>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
