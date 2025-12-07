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
import { Loader2, Save, Trash2, UserPlus, Settings as SettingsIcon, Building2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

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

  // --- ESTADOS DE REGRAS (Por Biblioteca) ---
  const [targetLibConfig, setTargetLibConfig] = useState<any>(null);
  const [selectedLibIdToEdit, setSelectedLibIdToEdit] = useState<string>("");

  // CARREGAR DADOS INICIAIS
  useEffect(() => {
    fetchUsers();
    fetchLibraries();
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
    
    // Inserir na tabela users_profile
    const { error } = await (supabase as any).from("users_profile").insert({
      name: newUser.name,
      email: newUser.email,
      password: newUser.password, 
      role: roleToUse,
      library_id: libraryIdToUse,
      active: true
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Usuário criado!" });
      setNewUser({ name: "", email: "", role: "bibliotecario", password: "" });
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

    // Atualizar na tabela users_profile
    const { error } = await (supabase as any)
      .from("users_profile")
      .update(updateData)
      .eq("id", editingUser.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Usuário atualizado com sucesso!" });
      setIsEditOpen(false);
      setEditingUser(null);
      setEditForm({ name: "", email: "", password: "" });
      fetchUsers(); // Recarrega a lista
    }

    setLoading(false);
  };

  // --- AÇÕES DE USUÁRIO (DELETAR) ---
  const handleDeleteUser = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return;
    
    const { error } = await (supabase as any).from("users_profile").delete().eq("id", id);
    
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      fetchUsers();
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