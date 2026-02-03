import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Save, Trash2, UserPlus, Settings as SettingsIcon, Building2, Edit2, X, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { logCreate, logUpdate, logDelete, logError } from '@/utils/audit';

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // --- ESTADOS DE USUÁRIOS ---
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "bibliotecario", password: "" });
  const [libraries, setLibraries] = useState<any[]>([]);
  const [selectedLibForUser, setSelectedLibForUser] = useState("");
  
  // --- ESTADOS DE EDIÇÃO ---
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", password: "" });
  const [selectedLibIdForEdit, setSelectedLibIdForEdit] = useState<string>("");

  // --- ESTADOS DE REGRAS (Por Biblioteca) ---
  const [targetLibConfig, setTargetLibConfig] = useState<any>(null);
  const [selectedLibIdToEdit, setSelectedLibIdToEdit] = useState<string>("");

  // --- ESTADOS DE APARÊNCIA ---
  const [appearanceConfig, setAppearanceConfig] = useState({
    network_logo: "",
    favicon: "",
    cover_image: "",
    primary_color: "#1e293b", // slate-900
    secondary_color: "#1e40af", // blue-800
    accent_color: "#84cc16", // lime-500
    tertiary_color: "#a855f7", // purple-500
  });
  const [libraryAppearance, setLibraryAppearance] = useState({
    logo: "",
    image: "",
  });

  // CARREGAR DADOS INICIAIS
  useEffect(() => {
    fetchUsers();
    fetchLibraries();
    fetchAppearanceConfig();
    if (user?.library_id) {
      fetchLibraryAppearance();
    }
  }, [user]);

  // Se for bibliotecário, definir automaticamente a biblioteca dele
  useEffect(() => {
    if (user?.role === 'bibliotecario' && user.library_id && !selectedLibIdToEdit) {
      setSelectedLibIdToEdit(user.library_id);
    }
  }, [user, selectedLibIdToEdit]);

  const fetchUsers = async () => {
    // Preparar query base
    let query = (supabase as any)
      .from("users_profile")
      .select("*, libraries(name)")
      .in("role", ["admin_rede", "bibliotecario"]);

    // Se não for admin_rede, filtrar por library_id
    if (user?.role !== 'admin_rede' && user?.library_id) {
      query = query.eq('library_id', user.library_id);
    }

    const { data } = await query.order("created_at", { ascending: false });
    setUsers(data || []);
  };

  const fetchLibraries = async () => {
    // Busca bibliotecas ordenadas por nome
    const { data } = await (supabase as any)
      .from("libraries")
      .select("*")
      .order("name");
    setLibraries(data || []);
  };

  // --- BUSCAR CONFIG DA BIBLIOTECA SELECIONADA ---
  const fetchLibraryConfig = async (libId: string) => {
    if (!libId) return;
    const { data } = await (supabase as any)
      .from("libraries")
      .select("*")
      .eq("id", libId)
      .single();
      
    if (data) {
      setTargetLibConfig(data);
    }
  };

  // Quando o usuário muda o select de "Biblioteca para Configurar", carrega os dados dela
  useEffect(() => {
    if (selectedLibIdToEdit) {
      fetchLibraryConfig(selectedLibIdToEdit);
    }
  }, [selectedLibIdToEdit]);

  // --- AÇÕES DE USUÁRIO (CRIAR) ---
  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    // BACKEND SAFETY: Forçar valores baseados no usuário logado
    let roleToUse = newUser.role;
    let libraryIdToUse: string | null = null;

    // Se não for admin_rede, forçar role para 'bibliotecario' e library_id do usuário
    if (user?.role !== 'admin_rede') {
      roleToUse = 'bibliotecario'; // Forçar role
      libraryIdToUse = user?.library_id || null; // Forçar library_id do criador
    } else {
      // Admin pode escolher role e biblioteca
      libraryIdToUse = newUser.role === 'bibliotecario' ? selectedLibForUser : null;
    }
    
    // Normalizar email (trim e lowercase)
    const normalizedEmail = newUser.email.trim().toLowerCase();
    
    // Inserir na tabela users_profile
    const { data: newUserData, error } = await (supabase as any)
      .from("users_profile")
      .insert({
        name: newUser.name.trim(),
        email: normalizedEmail,
        password: newUser.password.trim(), 
        role: roleToUse,
        library_id: libraryIdToUse,
        active: true
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar usuário:", error);
      
      // Log de erro
      await logError(
        'USER_CREATE',
        'user',
        error.message || 'Erro ao criar usuário',
        {
          email: normalizedEmail,
          role: roleToUse,
          library_id: libraryIdToUse,
        },
        user?.id,
        user?.library_id
      );
      
      toast({ 
        title: "Erro", 
        description: error.message || "Erro ao criar usuário. Verifique se o email já não está cadastrado.", 
        variant: "destructive" 
      });
    } else {
      // Log de auditoria
      if (newUserData) {
        await logCreate(
          'USER_CREATE',
          'user',
          newUserData.id,
          newUser.name.trim(),
          {
            name: newUser.name.trim(),
            email: normalizedEmail,
            role: roleToUse,
            library_id: libraryIdToUse,
            active: true,
          },
          user?.id,
          user?.library_id
        );
      }
      
      toast({ title: "Sucesso", description: "Usuário criado com sucesso!" });
      setNewUser({ name: "", email: "", role: "bibliotecario", password: "" });
      setSelectedLibForUser("");
      fetchUsers(); // Recarrega a lista
    }
    setLoading(false);
  };

  // --- AÇÕES DE USUÁRIO (EDITAR) ---
  const handleEditUser = (userToEdit: any) => {
    setEditingUser(userToEdit);
    setEditForm({
      name: userToEdit.name || "",
      email: userToEdit.email || "",
      password: "",
    });
    // Inicializar a biblioteca selecionada com a biblioteca atual do usuário
    setSelectedLibIdForEdit(userToEdit.library_id || "");
    setIsEditOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (!editForm.name || !editForm.email) {
      toast({ title: "Erro", description: "Nome e e-mail são obrigatórios.", variant: "destructive" });
      return;
    }

    setLoading(true);

    // Preparar dados para atualização
    const updateData: any = {
      name: editForm.name,
      email: editForm.email,
    };

    // Só atualizar senha se o campo não estiver vazio
    if (editForm.password.trim() !== "") {
      updateData.password = editForm.password;
    }

    // Se for admin_rede, permitir alterar a biblioteca vinculada
    if (user?.role === 'admin_rede') {
      // Se o usuário editado for bibliotecário, atualizar a biblioteca
      if (editingUser.role === 'bibliotecario') {
        updateData.library_id = selectedLibIdForEdit || null;
      } else if (editingUser.role === 'admin_rede') {
        // Admin rede não tem biblioteca vinculada
        updateData.library_id = null;
      }
    }

    // Buscar valores antigos para auditoria
    const { data: oldUserData } = await (supabase as any)
      .from("users_profile")
      .select('*')
      .eq("id", editingUser.id)
      .single();

    // Atualizar na tabela users_profile
    const { error } = await (supabase as any)
      .from("users_profile")
      .update(updateData)
      .eq("id", editingUser.id);

    if (error) {
      await logError(
        'USER_UPDATE',
        'user',
        error.message || 'Erro ao atualizar usuário',
        {
          user_id: editingUser.id,
          user_name: editingUser.name,
        },
        user?.id,
        user?.library_id
      );
      
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      // Log de auditoria
      if (oldUserData) {
        await logUpdate(
          'USER_UPDATE',
          'user',
          editingUser.id,
          editForm.name,
          oldUserData,
          {
            ...oldUserData,
            ...updateData,
          },
          user?.id,
          user?.library_id
        );
      }
      
      toast({ title: "Sucesso", description: "Usuário atualizado com sucesso!" });
      setIsEditOpen(false);
      setEditingUser(null);
      setEditForm({ name: "", email: "", password: "" });
      setSelectedLibIdForEdit("");
      fetchUsers(); // Recarrega a lista
    }

    setLoading(false);
  };

  // --- AÇÕES DE USUÁRIO (DELETAR) ---
  const handleDeleteUser = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.")) return;
    
    setLoading(true);
    
    try {
      // Verificar se há empréstimos associados a este usuário
      const { data: loansCreated, error: loansCreatedError } = await (supabase as any)
        .from("loans")
        .select("id")
        .eq("created_by", id)
        .limit(1);

      const { data: loansReturned, error: loansReturnedError } = await (supabase as any)
        .from("loans")
        .select("id")
        .eq("returned_by", id)
        .limit(1);

      // Se houver empréstimos associados, atualizar para remover a referência
      if ((loansCreated && loansCreated.length > 0) || (loansReturned && loansReturned.length > 0)) {
        // Atualizar created_by para NULL onde o usuário é o criador
        if (loansCreated && loansCreated.length > 0) {
          const { error: updateCreatedError } = await (supabase as any)
            .from("loans")
            .update({ created_by: null })
            .eq("created_by", id);

          if (updateCreatedError) {
            throw new Error(`Erro ao atualizar empréstimos criados: ${updateCreatedError.message}`);
          }
        }

        // Atualizar returned_by para NULL onde o usuário é quem devolveu
        if (loansReturned && loansReturned.length > 0) {
          const { error: updateReturnedError } = await (supabase as any)
            .from("loans")
            .update({ returned_by: null })
            .eq("returned_by", id);

          if (updateReturnedError) {
            throw new Error(`Erro ao atualizar empréstimos devolvidos: ${updateReturnedError.message}`);
          }
        }
      }

      // Verificar se há empréstimos onde o usuário é o leitor (user_id)
      const { data: loansAsReader, error: loansAsReaderError } = await (supabase as any)
        .from("loans")
        .select("id")
        .eq("user_id", id)
        .limit(1);

      if (loansAsReader && loansAsReader.length > 0) {
        toast({ 
          title: "Erro", 
          description: "Não é possível excluir este usuário pois ele possui empréstimos registrados como leitor. Desative o usuário ao invés de excluí-lo.", 
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }

      // Agora pode excluir o usuário
      const { error } = await (supabase as any)
        .from("users_profile")
        .delete()
        .eq("id", id);
      
      if (error) {
        throw new Error(error.message);
      }

      toast({ 
        title: "Sucesso", 
        description: "Usuário excluído com sucesso!" 
      });
      fetchUsers();
    } catch (error: any) {
      console.error("Erro ao excluir usuário:", error);
      toast({ 
        title: "Erro", 
        description: error.message || "Erro ao excluir usuário. Verifique se não há dependências.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÕES DE APARÊNCIA ---
  const fetchAppearanceConfig = async () => {
    try {
      // Buscar configurações globais
      const { data, error } = await (supabase as any)
        .from('appearance_config')
        .select('*')
        .eq('id', 'global')
        .single();

      if (data && !error) {
        console.log('Configurações carregadas do banco:', data);
        setAppearanceConfig({
          network_logo: data.network_logo || "",
          favicon: data.favicon || "",
          cover_image: data.cover_image || "",
          primary_color: data.primary_color || "#1e293b",
          secondary_color: data.secondary_color || "#1e40af",
          accent_color: data.accent_color || "#84cc16",
          tertiary_color: data.tertiary_color || "#a855f7",
        });
      } else if (error) {
        console.log('Erro ao carregar do banco, usando localStorage:', error);
        // Fallback para localStorage
        const saved = localStorage.getItem('beabah_appearance_config');
        if (saved) {
          const config = JSON.parse(saved);
          setAppearanceConfig({
            network_logo: config.network_logo || "",
            favicon: config.favicon || "",
            cover_image: config.cover_image || "",
            primary_color: config.primary_color || "#1e293b",
            secondary_color: config.secondary_color || "#1e40af",
            accent_color: config.accent_color || "#84cc16",
            tertiary_color: config.tertiary_color || "#a855f7",
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      // Fallback para localStorage
      const saved = localStorage.getItem('beabah_appearance_config');
      if (saved) {
        const config = JSON.parse(saved);
        setAppearanceConfig({
          network_logo: config.network_logo || "",
          favicon: config.favicon || "",
          cover_image: config.cover_image || "",
          primary_color: config.primary_color || "#1e293b",
          secondary_color: config.secondary_color || "#1e40af",
          accent_color: config.accent_color || "#84cc16",
          tertiary_color: config.tertiary_color || "#a855f7",
        });
      }
    }
  };

  const fetchLibraryAppearance = async () => {
    if (!user?.library_id) return;
    
    try {
      const { data } = await (supabase as any)
        .from('libraries')
        .select('image_url')
        .eq('id', user.library_id)
        .single();

      if (data) {
        setLibraryAppearance({
          logo: data.image_url || "",
          image: data.image_url || "",
        });
      }
    } catch (error) {
      console.error('Erro ao carregar aparência da biblioteca:', error);
    }
  };



  const handleSaveAppearanceConfig = async () => {
    if (user?.role !== 'admin_rede') {
      toast({ 
        title: "Acesso Negado", 
        description: "Apenas administradores podem alterar configurações globais.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    
    try {
      const configData = {
        id: 'global',
        network_logo: appearanceConfig.network_logo || null,
        favicon: appearanceConfig.favicon || null,
        cover_image: appearanceConfig.cover_image || null,
        primary_color: appearanceConfig.primary_color || '#1e293b',
        secondary_color: appearanceConfig.secondary_color || '#1e40af',
        accent_color: appearanceConfig.accent_color || '#84cc16',
        tertiary_color: appearanceConfig.tertiary_color || '#a855f7',
        updated_at: new Date().toISOString()
      };

      // Usar upsert que é mais simples e funciona melhor
      const { data: savedData, error } = await (supabase as any)
        .from('appearance_config')
        .upsert(configData, {
          onConflict: 'id'
        })
        .select()
        .single();

      let success = false;

      if (error) {
        console.error('Erro ao salvar configurações:', error);
        console.error('Detalhes do erro:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      } else if (savedData) {
        success = true;
        console.log('Configurações salvas com sucesso:', savedData);
      }

      if (error || !success) {
        console.error('Erro ao salvar configurações:', error);
        // Se a tabela não existir ou houver erro de permissão, salvar em localStorage
        localStorage.setItem('beabah_appearance_config', JSON.stringify(appearanceConfig));
        toast({ 
          title: "Aviso", 
          description: `Erro ao salvar no banco: ${error?.message || 'Erro desconhecido'}. Verifique se o RLS está desabilitado ou as políticas estão corretas.`,
          variant: "default"
        });
      } else {
        // Sucesso - também salvar no localStorage como backup
        localStorage.setItem('beabah_appearance_config', JSON.stringify(appearanceConfig));
        toast({ title: "Sucesso", description: "Configurações de aparência salvas!" });
        
        // Recarregar as configurações para garantir que está atualizado
        await fetchAppearanceConfig();
        
        // Atualizar favicon se existir
        if (appearanceConfig.favicon) {
          // Função para criar favicon arredondado
          const createRoundedFavicon = (imageUrl: string) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const size = 64; // Tamanho do canvas (maior = melhor qualidade)
              canvas.width = size;
              canvas.height = size;
              const ctx = canvas.getContext('2d');
              
              if (ctx) {
                // Criar clipping path circular
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
                ctx.clip();
                
                // Desenhar a imagem
                ctx.drawImage(img, 0, 0, size, size);
                
                // Converter para data URL e atualizar favicon
                const dataUrl = canvas.toDataURL('image/png');
                
                // Remover todos os links de favicon existentes
                const existingLinks = document.querySelectorAll("link[rel*='icon']");
                existingLinks.forEach(link => link.remove());

                // Criar novo link de favicon
                const link = document.createElement('link');
                link.rel = 'icon';
                link.type = 'image/png';
                link.href = dataUrl;
                document.getElementsByTagName('head')[0].appendChild(link);
              }
            };
            img.onerror = () => {
              // Fallback: usar imagem original se falhar
              const existingLinks = document.querySelectorAll("link[rel*='icon']");
              existingLinks.forEach(link => link.remove());
              const link = document.createElement('link');
              link.rel = 'icon';
              link.type = 'image/x-icon';
              link.href = imageUrl;
              document.getElementsByTagName('head')[0].appendChild(link);
            };
            img.src = imageUrl;
          };
          
          createRoundedFavicon(appearanceConfig.favicon);
        }
      }
    } catch (error: any) {
      console.error('Erro inesperado:', error);
      // Fallback para localStorage
      localStorage.setItem('beabah_appearance_config', JSON.stringify(appearanceConfig));
      toast({ 
        title: "Erro", 
        description: `Erro inesperado: ${error.message}. Configurações salvas localmente.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLibraryAppearance = async () => {
    if (!user?.library_id) {
      toast({ 
        title: "Erro", 
        description: "Biblioteca não identificada.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await (supabase as any)
        .from('libraries')
        .update({ 
          image_url: libraryAppearance.logo || libraryAppearance.image,
        })
        .eq('id', user.library_id);

      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Sucesso", description: "Aparência da biblioteca atualizada!" });
        await fetchLibraryAppearance();
      }
    } catch (error: any) {
      toast({ 
        title: "Erro", 
        description: error.message || "Erro ao salvar configurações.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  // --- AÇÕES DE CONFIGURAÇÃO (SALVAR REGRAS LOCAIS) ---
  const handleSaveLibConfig = async () => {
    if (!targetLibConfig) return;
    
    // Segurança: Se não for admin, garantir que só pode editar sua própria biblioteca
    if (user?.role === 'bibliotecario' && user.library_id !== targetLibConfig.id) {
      toast({ 
        title: "Acesso Negado", 
        description: "Você só pode editar as configurações da sua própria biblioteca.", 
        variant: "destructive" 
      });
      return;
    }
    
    setLoading(true);
    
    // Atualiza as colunas loan_days e max_items na tabela libraries
    const { error } = await (supabase as any)
      .from("libraries")
      .update({ 
        loan_days: targetLibConfig.loan_days, 
        max_items: targetLibConfig.max_items 
      })
      .eq("id", targetLibConfig.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Regras Atualizadas", description: `Configuração da ${targetLibConfig.name} salva.` });
    }
    setLoading(false);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in">
      {/* CABEÇALHO */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg text-primary">
          <SettingsIcon size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Gestão de acessos e regras operacionais.</p>
        </div>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger value="rules" className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            Regras da Biblioteca (Autonomia)
          </TabsTrigger>
          <TabsTrigger value="team" className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            Gestão de Equipe (Acessos)
          </TabsTrigger>
          <TabsTrigger value="appearance" className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            <Palette className="h-4 w-4 mr-2" />
            Aparência
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: REGRAS LOCAIS */}
        <TabsContent value="rules" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {user?.role === 'bibliotecario' ? 'Configurações da Minha Unidade' : 'Parâmetros de Empréstimo'}
              </CardTitle>
              <CardDescription>
                {user?.role === 'bibliotecario' 
                  ? 'Defina os prazos e limites da sua biblioteca.' 
                  : 'Defina os prazos e limites específicos desta unidade.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* SELEÇÃO DA BIBLIOTECA - Só mostra se for admin */}
              {user?.role === 'admin_rede' && (
                <div className="space-y-2">
                  <Label>Selecione a Biblioteca para Configurar</Label>
                  <Select onValueChange={setSelectedLibIdToEdit} value={selectedLibIdToEdit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha a unidade..." />
                    </SelectTrigger>
                    <SelectContent>
                      {libraries.map((lib) => (
                        <SelectItem key={lib.id} value={lib.id}>{lib.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* FORMULÁRIO DE EDIÇÃO (SÓ APARECE SE SELECIONAR UMA BIBLIOTECA) */}
              {targetLibConfig && (
                <div className="grid gap-4 md:grid-cols-2 p-4 border rounded-md bg-slate-50 mt-4 animate-in slide-in-from-top-2">
                  <div className="col-span-2 pb-2 border-b mb-2">
                    <h3 className="font-semibold text-primary">Editando: {targetLibConfig.name}</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Prazo de Empréstimo (Dias)</Label>
                    <Input 
                      type="number" 
                      value={targetLibConfig.loan_days || 14} 
                      onChange={(e) => setTargetLibConfig({...targetLibConfig, loan_days: e.target.value})} 
                    />
                    <p className="text-xs text-muted-foreground">Ex: 7, 14 ou 21 dias.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Limite de Itens por Leitor</Label>
                    <Input 
                      type="number" 
                      value={targetLibConfig.max_items || 3} 
                      onChange={(e) => setTargetLibConfig({...targetLibConfig, max_items: e.target.value})} 
                    />
                    <p className="text-xs text-muted-foreground">Máximo de livros simultâneos.</p>
                  </div>

                  <div className="col-span-2 pt-4">
                    <Button onClick={handleSaveLibConfig} disabled={loading} className="w-full md:w-auto">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Salvar Regras da Unidade
                    </Button>
                  </div>
                </div>
              )}
              
              {!selectedLibIdToEdit && user?.role === 'admin_rede' && (
                <div className="text-center py-8 text-muted-foreground bg-slate-50 rounded border border-dashed">
                  Selecione uma biblioteca acima para editar suas regras.
                </div>
              )}

            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2: EQUIPE */}
        <TabsContent value="team" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cadastrar Novo Usuário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <Select onValueChange={(v) => setNewUser({...newUser, role: v})} defaultValue="bibliotecario">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bibliotecario">Bibliotecário</SelectItem>
                      {user?.role === 'admin_rede' && (
                        <SelectItem value="admin_rede">Admin Rede</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {newUser.role === 'bibliotecario' && (
                  <div className="space-y-2 md:col-span-2">
                    {user?.role === 'admin_rede' ? (
                      <>
                        <Label>Vincular à Biblioteca</Label>
                        <Select onValueChange={setSelectedLibForUser}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            {libraries.map((lib) => (
                              <SelectItem key={lib.id} value={lib.id}>{lib.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    ) : (
                      <>
                        <Label>Biblioteca</Label>
                        <div className="p-3 bg-muted rounded-md border">
                          <p className="text-sm font-medium">
                            Vinculando à biblioteca: {libraries.find(l => l.id === user?.library_id)?.name || 'Sua biblioteca'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            O novo usuário será automaticamente vinculado à sua biblioteca.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <Button onClick={handleCreateUser} disabled={loading} className="md:col-span-2 mt-2">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Criar Usuário
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
             <CardHeader><CardTitle>Usuários Existentes</CardTitle></CardHeader>
             <CardContent>
               <Table>
                 <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Função</TableHead><TableHead>Biblioteca</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
                 <TableBody>
                   {users.map((u) => (
                     <TableRow key={u.id}>
                       <TableCell className="font-medium">{u.name}</TableCell>
                       <TableCell>
                        <Badge variant={u.role === 'admin_rede' ? 'default' : 'secondary'}>
                          {u.role === 'admin_rede' ? 'Admin Rede' : 'Bibliotecário'}
                        </Badge>
                       </TableCell>
                       <TableCell>{u.libraries?.name || '-'}</TableCell>
                       <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleEditUser(u)}
                            className="text-primary hover:text-primary"
                          >
                            <Edit2 className="w-4 h-4"/>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteUser(u.id)} 
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4"/>
                          </Button>
                        </div>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 3: APARÊNCIA */}
        <TabsContent value="appearance" className="mt-6 space-y-6">
          {user?.role === 'admin_rede' ? (
            /* CONFIGURAÇÕES GLOBAIS - APENAS ADMIN */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Aparência da Rede
                </CardTitle>
                <CardDescription>
                  Personalize a aparência global do site. Essas configurações afetam toda a rede.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo da Rede */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">URL do Logo da Rede</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      URL da imagem do logo que aparece no cabeçalho do site
                    </p>
                  </div>
                  <div className="flex items-start gap-4">
                    {appearanceConfig.network_logo && (
                      <div className="relative">
                        <img 
                          src={appearanceConfig.network_logo} 
                          alt="Logo da Rede" 
                          className="h-20 w-20 object-cover border-2 border-border rounded-full p-1 bg-white"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => setAppearanceConfig(prev => ({ ...prev, network_logo: "" }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="url"
                        placeholder="https://exemplo.com/logo.png"
                        value={appearanceConfig.network_logo}
                        onChange={(e) => setAppearanceConfig(prev => ({ ...prev, network_logo: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Favicon */}
                <div className="space-y-4 border-t pt-6">
                  <div>
                    <Label className="text-base font-semibold">URL do Ícone da Página (Favicon)</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      URL do ícone que aparece na aba do navegador (recomendado: 32x32 ou 64x64 pixels)
                    </p>
                  </div>
                  <div className="flex items-start gap-4">
                    {appearanceConfig.favicon && (
                      <div className="relative">
                        <img 
                          src={appearanceConfig.favicon} 
                          alt="Favicon" 
                          className="h-16 w-16 object-cover border-2 border-border rounded-full p-1 bg-white"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => setAppearanceConfig(prev => ({ ...prev, favicon: "" }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="url"
                        placeholder="https://exemplo.com/favicon.ico"
                        value={appearanceConfig.favicon}
                        onChange={(e) => setAppearanceConfig(prev => ({ ...prev, favicon: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Imagem de Capa */}
                <div className="space-y-4 border-t pt-6">
                  <div>
                    <Label className="text-base font-semibold">URL da Imagem de Capa da Página Inicial</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      URL da imagem de fundo da seção hero da página inicial (recomendado: 1920x600 pixels)
                    </p>
                  </div>
                  <div className="space-y-4">
                    {appearanceConfig.cover_image && (
                      <div className="relative w-full">
                        <img 
                          src={appearanceConfig.cover_image} 
                          alt="Imagem de Capa" 
                          className="w-full h-64 object-cover rounded-lg border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => setAppearanceConfig(prev => ({ ...prev, cover_image: "" }))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <Input
                      type="url"
                      placeholder="https://exemplo.com/capa.jpg"
                      value={appearanceConfig.cover_image}
                      onChange={(e) => setAppearanceConfig(prev => ({ ...prev, cover_image: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Cores */}
                <div className="space-y-4 border-t pt-6">
                  <div>
                    <Label className="text-base font-semibold">Cores do Tema</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Personalize as cores principais do site
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary-color">Cor Primária</Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="primary-color"
                          type="color"
                          value={appearanceConfig.primary_color}
                          onChange={(e) => setAppearanceConfig(prev => ({ ...prev, primary_color: e.target.value }))}
                          className="h-10 w-20 rounded border cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={appearanceConfig.primary_color}
                          onChange={(e) => setAppearanceConfig(prev => ({ ...prev, primary_color: e.target.value }))}
                          placeholder="#1e293b"
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Cor principal (fundo escuro)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondary-color">Cor Secundária</Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="secondary-color"
                          type="color"
                          value={appearanceConfig.secondary_color}
                          onChange={(e) => setAppearanceConfig(prev => ({ ...prev, secondary_color: e.target.value }))}
                          className="h-10 w-20 rounded border cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={appearanceConfig.secondary_color}
                          onChange={(e) => setAppearanceConfig(prev => ({ ...prev, secondary_color: e.target.value }))}
                          placeholder="#1e40af"
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Cor secundária (azul)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accent-color">Cor de Destaque</Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="accent-color"
                          type="color"
                          value={appearanceConfig.accent_color}
                          onChange={(e) => setAppearanceConfig(prev => ({ ...prev, accent_color: e.target.value }))}
                          className="h-10 w-20 rounded border cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={appearanceConfig.accent_color}
                          onChange={(e) => setAppearanceConfig(prev => ({ ...prev, accent_color: e.target.value }))}
                          placeholder="#84cc16"
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Cor de destaque (verde limão)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tertiary-color">Cor Terciária</Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="tertiary-color"
                          type="color"
                          value={appearanceConfig.tertiary_color}
                          onChange={(e) => setAppearanceConfig(prev => ({ ...prev, tertiary_color: e.target.value }))}
                          className="h-10 w-20 rounded border cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={appearanceConfig.tertiary_color}
                          onChange={(e) => setAppearanceConfig(prev => ({ ...prev, tertiary_color: e.target.value }))}
                          placeholder="#a855f7"
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Cor terciária (roxo)</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={handleSaveAppearanceConfig} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Configurações de Aparência
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* CONFIGURAÇÕES DA BIBLIOTECA - BIBLIOTECÁRIO */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Aparência da Minha Biblioteca
                </CardTitle>
                <CardDescription>
                  Personalize a aparência da sua biblioteca no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo da Biblioteca */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">URL do Logo da Biblioteca</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      URL da imagem do logo que representa sua biblioteca
                    </p>
                  </div>
                  <div className="flex items-start gap-4">
                    {libraryAppearance.logo && (
                      <div className="relative">
                        <img 
                          src={libraryAppearance.logo} 
                          alt="Logo da Biblioteca" 
                          className="h-20 w-20 object-cover border-2 border-border rounded-full p-1 bg-white"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => setLibraryAppearance(prev => ({ ...prev, logo: "" }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="url"
                        placeholder="https://exemplo.com/logo-biblioteca.png"
                        value={libraryAppearance.logo}
                        onChange={(e) => setLibraryAppearance(prev => ({ ...prev, logo: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Imagem da Biblioteca */}
                <div className="space-y-4 border-t pt-6">
                  <div>
                    <Label className="text-base font-semibold">URL da Imagem da Biblioteca</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      URL da imagem que representa sua biblioteca (usada em cards e perfis)
                    </p>
                  </div>
                  <div className="space-y-4">
                    {libraryAppearance.image && (
                      <div className="relative w-full">
                        <img 
                          src={libraryAppearance.image} 
                          alt="Imagem da Biblioteca" 
                          className="w-full h-64 object-cover rounded-lg border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => setLibraryAppearance(prev => ({ ...prev, image: "" }))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <Input
                      type="url"
                      placeholder="https://exemplo.com/imagem-biblioteca.jpg"
                      value={libraryAppearance.image}
                      onChange={(e) => setLibraryAppearance(prev => ({ ...prev, image: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={handleSaveLibraryAppearance} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* DIALOG DE EDIÇÃO DE USUÁRIO */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário. Deixe a senha em branco para manter a atual.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nova Senha</Label>
              <Input
                id="edit-password"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Deixe em branco para manter a senha atual"
              />
              <p className="text-xs text-muted-foreground">
                Preencha apenas se desejar alterar a senha.
              </p>
            </div>
            {user?.role === 'admin_rede' && editingUser?.role === 'bibliotecario' && (
              <div className="space-y-2">
                <Label htmlFor="edit-library">Biblioteca Vinculada</Label>
                <Select 
                  value={selectedLibIdForEdit} 
                  onValueChange={setSelectedLibIdForEdit}
                >
                  <SelectTrigger id="edit-library">
                    <SelectValue placeholder="Selecione uma biblioteca..." />
                  </SelectTrigger>
                  <SelectContent>
                    {libraries.map((lib) => (
                      <SelectItem key={lib.id} value={lib.id}>
                        {lib.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecione a biblioteca à qual este bibliotecário está vinculado.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}