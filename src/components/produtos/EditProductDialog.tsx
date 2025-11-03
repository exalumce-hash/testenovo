// @ts-nocheck - Temporary fix until Supabase types are regenerated
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  peso: number | null;
  unidade: string | null;
  custo: number | null;
  preco: number | null;
  preco_por_kg: number | null;
  imagem_url: string | null;
  estoque: number | null;
  estoque_minimo: number | null;
  ativo: boolean | null;
}

interface EditProductDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated: () => void;
}

export default function EditProductDialog({ product, open, onOpenChange, onProductUpdated }: EditProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product.imagem_url);

  const [formData, setFormData] = useState({
    codigo: product.codigo,
    nome: product.nome || "",
    descricao: product.descricao || "",
    categoria: product.categoria || "",
    peso: product.peso?.toString() || "",
    unidade: product.unidade || "UN",
    custo: product.custo?.toString() || "",
    preco: product.preco?.toString() || "",
    preco_por_kg: product.preco_por_kg?.toString() || "",
    estoque: product.estoque?.toString() || "0",
    estoque_minimo: product.estoque_minimo?.toString() || "0",
  });

  useEffect(() => {
    setFormData({
      codigo: product.codigo,
      nome: product.nome || "",
      descricao: product.descricao || "",
      categoria: product.categoria || "",
      peso: product.peso?.toString() || "",
      unidade: product.unidade || "UN",
      custo: product.custo?.toString() || "",
      preco: product.preco?.toString() || "",
      preco_por_kg: product.preco_por_kg?.toString() || "",
      estoque: product.estoque?.toString() || "0",
      estoque_minimo: product.estoque_minimo?.toString() || "0",
    });
    setImagePreview(product.imagem_url);
  }, [product]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.preco || isNaN(parseFloat(formData.preco))) {
      toast({
        title: "Erro de validação",
        description: "Preço é obrigatório e deve ser um número válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('produtos').update({
        codigo: formData.codigo,
        nome: formData.nome,
        descricao: formData.descricao || null,
        categoria: formData.categoria || null,
        peso: formData.peso && !isNaN(parseFloat(formData.peso)) ? parseFloat(formData.peso) : null,
        unidade: formData.unidade || 'UN',
        custo: formData.custo && !isNaN(parseFloat(formData.custo)) ? parseFloat(formData.custo) : null,
        preco: parseFloat(formData.preco),
        preco_por_kg: formData.preco_por_kg && !isNaN(parseFloat(formData.preco_por_kg)) ? parseFloat(formData.preco_por_kg) : null,
        estoque: formData.estoque && !isNaN(parseInt(formData.estoque)) ? parseInt(formData.estoque) : 0,
        estoque_minimo: formData.estoque_minimo && !isNaN(parseInt(formData.estoque_minimo)) ? parseInt(formData.estoque_minimo) : 0,
        imagem_url: imagePreview || null,
      }).eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Produto atualizado com sucesso.",
      });

      onOpenChange(false);
      setImageFile(null);
      onProductUpdated();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Foto do Produto</Label>
            {imagePreview ? (
              <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <Label htmlFor="image-upload" className="cursor-pointer text-sm text-muted-foreground">
                  Clique para fazer upload da foto
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                required
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Input
                id="unidade"
                value={formData.unidade}
                onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                placeholder="UN, KG, M"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="peso">Peso por Unidade (kg)</Label>
              <Input
                id="peso"
                type="number"
                step="0.001"
                min="0"
                value={formData.peso}
                onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                placeholder="0.000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preco_por_kg">Preço por Kg</Label>
              <Input
                id="preco_por_kg"
                type="number"
                step="0.01"
                min="0"
                value={formData.preco_por_kg}
                onChange={(e) => setFormData({ ...formData, preco_por_kg: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="custo">Preço de Custo</Label>
              <Input
                id="custo"
                type="number"
                step="0.01"
                min="0"
                value={formData.custo}
                onChange={(e) => setFormData({ ...formData, custo: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preco">Preço de Venda *</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estoque">Estoque</Label>
              <Input
                id="estoque"
                type="number"
                min="0"
                value={formData.estoque}
                onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
              <Input
                id="estoque_minimo"
                type="number"
                min="0"
                value={formData.estoque_minimo}
                onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
