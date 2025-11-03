// @ts-nocheck - Temporary fix until Supabase types are regenerated
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, ExternalLink, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Configuracao {
  id: string;
  nome_empresa: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  logo_url: string | null;
}

export default function Configuracoes() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Configuracao>({
    id: '',
    nome_empresa: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    logo_url: '',
  });

  const catalogoUrl = `${window.location.origin}/catalogo-publico`;

  const copiarLink = () => {
    navigator.clipboard.writeText(catalogoUrl);
    toast({
      title: "Link copiado!",
      description: "O link do catálogo foi copiado para a área de transferência",
    });
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setConfig(data);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      toast({
        title: "Sem permissão",
        description: "Apenas administradores podem alterar as configurações",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('configuracoes')
        .update({
          nome_empresa: config.nome_empresa,
          cnpj: config.cnpj,
          telefone: config.telefone,
          email: config.email,
          endereco: config.endereco,
          logo_url: config.logo_url,
        })
        .eq('id', config.id);

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-8 text-muted-foreground">
          Carregando configurações...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Configurações</h2>
        <p className="text-muted-foreground">Gerencie as informações da empresa</p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            Link do Catálogo Público
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Compartilhe este link com seus clientes para fazer pedidos</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={catalogoUrl}
                readOnly
                className="font-mono text-sm bg-muted"
              />
              <Button onClick={copiarLink} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
              <Button onClick={() => window.open(catalogoUrl, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir
              </Button>
            </div>
          </div>
          
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Badge className="mt-0.5">Dica</Badge>
            <p className="text-sm text-muted-foreground">
              Seus clientes podem acessar este link para visualizar produtos, adicionar ao carrinho e fazer pedidos diretamente pelo catálogo.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
              <Input
                id="nome_empresa"
                value={config.nome_empresa}
                onChange={(e) => setConfig({ ...config, nome_empresa: e.target.value })}
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={config.cnpj || ''}
                onChange={(e) => setConfig({ ...config, cnpj: e.target.value })}
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={config.telefone || ''}
                onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={config.email || ''}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={config.endereco || ''}
                onChange={(e) => setConfig({ ...config, endereco: e.target.value })}
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="logo_url">URL da Logo</Label>
              <Input
                id="logo_url"
                type="url"
                value={config.logo_url || ''}
                onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                disabled={!isAdmin}
                placeholder="https://exemplo.com/logo.png"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}