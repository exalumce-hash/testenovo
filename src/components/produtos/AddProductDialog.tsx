// @ts-nocheck - Temporary fix until Supabase types are regenerated
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AddProductDialogProps {
  onProductAdded: () => void;
}

export default function AddProductDialog({ onProductAdded }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    descricao: "",
    categoria: "",
    peso: "",
    unidade: "UN",
    custo: "",
    preco: "",
    preco_por_kg: "",
    estoque: "0",
    estoque_minimo: "10",
  });

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
    
    // Calcular preço se temos preco_por_kg e peso
    let precoFinal = formData.preco;
    if (formData.preco_por_kg && formData.peso) {
      const precoKg = parseFloat(formData.preco_por_kg);
      const peso = parseFloat(formData.peso);
      if (!isNaN(precoKg) && !isNaN(peso)) {
        precoFinal = (peso * precoKg * 6).toString();
      }
    }

    if (!precoFinal || isNaN(parseFloat(precoFinal))) {
      toast({
        title: "Erro de validação",
        description: "Preço é obrigatório. Informe o preço ou peso + preço por kg.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('produtos').insert({
        codigo: formData.codigo,
        nome: formData.nome || formData.codigo,
        descricao: formData.descricao || null,
        categoria: formData.categoria || null,
        peso: formData.peso && !isNaN(parseFloat(formData.peso)) ? parseFloat(formData.peso) : 0,
        unidade: formData.unidade,
        custo: formData.custo && !isNaN(parseFloat(formData.custo)) ? parseFloat(formData.custo) : 0,
        preco: parseFloat(precoFinal),
        preco_por_kg: formData.preco_por_kg && !isNaN(parseFloat(formData.preco_por_kg)) ? parseFloat(formData.preco_por_kg) : 0,
        estoque: parseInt(formData.estoque) || 0,
        estoque_minimo: parseInt(formData.estoque_minimo) || 0,
        imagem_url: imagePreview || null,
        ativo: true,
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Produto adicionado com sucesso.",
      });

      setOpen(false);
      setFormData({
        codigo: "",
        nome: "",
        descricao: "",
        categoria: "",
        peso: "",
        unidade: "UN",
        custo: "",
        preco: "",
        preco_por_kg: "",
        estoque: "0",
        estoque_minimo: "10",
      });
      setImageFile(null);
      setImagePreview(null);
      onProductAdded();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
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
              <Label htmlFor="unidade">Unidade</Label>
              <Input
                id="unidade"
                value={formData.unidade}
                onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Produto *</Label>
            <Input
              id="nome"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
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
          </div>

          <div className="border rounded-lg p-4 bg-accent/5 space-y-4">
            <h3 className="font-semibold text-sm">Preços</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custo">Custo</Label>
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
                <Label htmlFor="preco_por_kg">Preço por Kg/m *</Label>
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
            {formData.preco_por_kg && formData.peso && (
              <div className="text-sm bg-primary/10 p-3 rounded">
                <strong>Preço Calculado:</strong> R$ {(parseFloat(formData.peso) * parseFloat(formData.preco_por_kg) * 6).toFixed(2)}
                <p className="text-xs text-muted-foreground mt-1">Fórmula: peso x preço/kg x 6</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="preco">Preço Manual (opcional)</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                min="0"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                placeholder="Deixe vazio para calcular automaticamente"
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-4">Estoque Inicial</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estoque">Quantidade Inicial</Label>
                <Input
                  id="estoque"
                  type="number"
                  step="1"
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
                  step="1"
                  min="0"
                  value={formData.estoque_minimo}
                  onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Produto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
