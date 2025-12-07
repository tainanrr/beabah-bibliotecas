import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, Upload, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, login } = useAuth(); // Usamos login para atualizar a sessão se precisar
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "", // Nova senha
    avatar_url: ""
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    // Busca dados atualizados do banco
    const { data } = await (supabase as any)
      .from("users_profile")
      .select("*")
      .eq("id", user?.id)
      .single();
    
    if (data) {
      setFormData({
        name: data.name || "",
        email: data.email || "",
        password: "", // Senha vem vazia por segurança
        avatar_url: data.avatar_url || ""
      });
    }
  };

  // --- LÓGICA DE UPLOAD DE IMAGEM ---
  const handleAvatarUpload = async (event: any) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Selecione uma imagem.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}-${Math.random()}.${fileExt}`;

      // 1. Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Pegar a URL pública
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
      toast({ title: "Imagem carregada", description: "Clique em Salvar Alterações para confirmar." });

    } catch (error: any) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // --- SALVAR TUDO ---
  const handleSave = async () => {
    setLoading(true);
    const updates: any = {
      name: formData.name,
      email: formData.email,
      avatar_url: formData.avatar_url,
    };

    // Só atualiza senha se o usuário digitou algo
    if (formData.password) {
      updates.password = formData.password;
    }

    const { error } = await (supabase as any)
      .from("users_profile")
      .update(updates)
      .eq("id", user?.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Perfil atualizado! A página será recarregada." });
      // Pequeno hack para atualizar o avatar no menu imediatamente
      setTimeout(() => window.location.reload(), 1500);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Meu Perfil</h1>

      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        
        {/* COLUNA DA FOTO */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Foto de Perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32 border-4 border-slate-100">
              <AvatarImage src={formData.avatar_url} objectFit="cover" />
              <AvatarFallback className="text-4xl bg-primary text-white">
                {formData.name?.charAt(0) || <User />}
              </AvatarFallback>
            </Avatar>
            
            <div className="w-full">
              <Label htmlFor="avatar-upload" className="cursor-pointer w-full">
                <div className="flex items-center justify-center gap-2 w-full p-2 bg-slate-100 hover:bg-slate-200 rounded-md text-sm font-medium transition">
                  {uploading ? <Loader2 className="animate-spin h-4 w-4"/> : <Upload className="h-4 w-4"/>}
                  {uploading ? "Enviando..." : "Alterar Foto"}
                </div>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* COLUNA DOS DADOS */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Atualize seus dados de acesso ao sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>E-mail de Acesso</Label>
              <Input 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label>Alterar Senha</Label>
              <Input 
                type="password" 
                placeholder="Deixe em branco para manter a atual" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleSave} disabled={loading || uploading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Alterações
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}