// @ts-nocheck - Temporary fix until Supabase types are regenerated
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Package, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AddKitDialog from "@/components/produtos/AddKitDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface KitItem {
  id: string;
  kit_id: string;
  produto_id: string;
  quantidade: number;
  produtos: {
    codigo: string;
    nome: string;
    descricao: string;
    preco: number;
  };
}

interface Kit {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  preco_total: number;
  ativo: boolean;
  created_at: string;
  kit_itens: KitItem[];
}

export default function Kits() {
  const [searchTerm, setSearchTerm] = useState("");
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [kitToDelete, setKitToDelete] = useState<string | null>(null);

  const fetchKits = async () => {
    try {
      const { data, error } = await supabase
        .from('kits')
        .select(`
          *,
          kit_itens (
            id,
            kit_id,
            produto_id,
            quantidade,
            produtos (
              codigo,
              nome,
              descricao,
              preco
            )
          )
        `)
        .order('created_at', { ascending: false });

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

  const handleDeleteKit = async () => {
    if (!kitToDelete) return;

    try {
      const { error } = await supabase
        .from('kits')
        .delete()
        .eq('id', kitToDelete);

      if (error) throw error;

      toast({
        title: "Kit excluído",
        description: "Kit excluído com sucesso",
      });

      fetchKits();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir kit",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setKitToDelete(null);
    }
  };

  const toggleKitStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('kits')
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Kit ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`,
      });

      fetchKits();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredKits = kits.filter((kit) =>
    kit.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kit.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kit.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Kits de Produtos
          </h2>
          <p className="text-muted-foreground text-lg">
            Gerencie os kits compostos por múltiplos produtos
          </p>
        </div>
        <AddKitDialog onKitAdded={fetchKits} />
      </div>

      <Card className="border-0 shadow-lg">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-accent to-primary"></div>
        <CardHeader className="bg-gradient-to-br from-white to-blue-50/30">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            Lista de Kits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar kits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredKits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum kit encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Preço Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKits.map((kit) => (
                  <TableRow key={kit.id}>
                    <TableCell className="font-medium">{kit.codigo}</TableCell>
                    <TableCell>{kit.nome}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {kit.descricao || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {kit.kit_itens?.map((item) => (
                          <div key={item.id} className="text-muted-foreground">
                            {item.quantidade}x {item.produtos?.nome || item.produtos?.descricao}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>R$ {kit.preco_total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={kit.ativo ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => toggleKitStatus(kit.id, kit.ativo)}
                      >
                        {kit.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setKitToDelete(kit.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!kitToDelete} onOpenChange={() => setKitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este kit? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteKit}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
