import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, MapPin, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import * as XLSX from 'xlsx';
import { logCreate, logUpdate, logDelete, logError } from '@/utils/audit';

type Library = Tables<'libraries'>;
type Copy = Tables<'copies'>;
type Loan = Tables<'loans'>;

export default function Libraries() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [copies, setCopies] = useState<Copy[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(true);
  
  // Estados para edição
  const [editingLib, setEditingLib] = useState<Library | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    city: '',
    address: '',
    phone: '',
    description: '',
    latitude: '',
    longitude: '',
    image_url: '',
    instagram: '',
  });
  
  const nameInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const latitudeInputRef = useRef<HTMLInputElement>(null);
  const longitudeInputRef = useRef<HTMLInputElement>(null);
  const imageUrlInputRef = useRef<HTMLInputElement>(null);
  const instagramInputRef = useRef<HTMLInputElement>(null);
  const loanDaysInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadLibraries();
    loadCopies();
    loadLoans();
  }, [user]);

  const loadLibraries = async () => {
    try {
      setLoading(true);
      
      // DEBUG: Log do usuário e library_id
      console.log('[Libraries] User:', user);
      console.log('[Libraries] role:', user?.role);
      console.log('[Libraries] library_id:', user?.library_id);
      
      let query = (supabase as any)
        .from('libraries')
        .select('id, name, city, address, active, created_at, phone, description, latitude, longitude, image_url, instagram');

      // Filtrar baseado no role do usuário
      if (user?.role === 'bibliotecario' && user.library_id) {
        // Bibliotecário vê apenas sua biblioteca
        console.log('[Libraries] Aplicando filtro de library_id:', user.library_id);
        query = query.eq('id', user.library_id);
      } else {
        console.log('[Libraries] NÃO aplicando filtro - role:', user?.role, 'library_id:', user?.library_id);
      }
      // Se for admin_rede, não adiciona filtro (vê todas)

      const { data, error } = await query.order('name');

      if (error) throw error;

      // DEBUG: Log dos dados retornados
      console.log('[Libraries] Bibliotecas retornadas (antes do filtro):', data?.length);
      if (data && data.length > 0) {
        const libraryIds = data.map((lib: any) => lib.id);
        console.log('[Libraries] Library IDs encontrados:', libraryIds);
      }

      // Se for bibliotecário, filtrar novamente no cliente para garantir (segurança extra)
      let filteredData = data || [];
      if (user?.role === 'bibliotecario' && user.library_id) {
        filteredData = (data || []).filter((lib: any) => lib.id === user.library_id);
        console.log('[Libraries] Bibliotecas após filtro no cliente:', filteredData.length);
      }

      setLibraries((filteredData || []) as Library[]);
    } catch (error) {
      console.error('Erro ao carregar bibliotecas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as bibliotecas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCopies = async () => {
    try {
      let query = supabase
        .from('copies')
        .select('*');

      // Se for bibliotecário, filtrar apenas exemplares da sua biblioteca
      if (user?.role === 'bibliotecario' && user.library_id) {
        query = query.eq('library_id', user.library_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setCopies(data || []);
    } catch (error) {
      console.error('Erro ao carregar exemplares:', error);
    }
  };

  const loadLoans = async () => {
    try {
      let query = supabase
        .from('loans')
        .select('*')
        .eq('status', 'aberto');

      // Se for bibliotecário, filtrar apenas empréstimos da sua biblioteca
      if (user?.role === 'bibliotecario' && user.library_id) {
        query = query.eq('library_id', user.library_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLoans(data || []);
    } catch (error) {
      console.error('Erro ao carregar empréstimos:', error);
    }
  };

  const filteredLibraries = libraries.filter(
    (lib) =>
      lib.name.toLowerCase().includes(search.toLowerCase()) ||
      lib.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    const name = nameInputRef.current?.value.trim();
    const city = cityInputRef.current?.value.trim();
    const address = addressInputRef.current?.value.trim() || null;
    const phone = phoneInputRef.current?.value.trim() || null;
    const description = descriptionInputRef.current?.value.trim() || null;
    const latitude = latitudeInputRef.current?.value ? parseFloat(latitudeInputRef.current.value) : null;
    const longitude = longitudeInputRef.current?.value ? parseFloat(longitudeInputRef.current.value) : null;
    const image_url = imageUrlInputRef.current?.value.trim() || null;
    const instagram = instagramInputRef.current?.value.trim() || null;
    const loan_days = loanDaysInputRef.current?.value ? parseInt(loanDaysInputRef.current.value) : 14;

    if (!name || !city) {
      toast({
        title: 'Erro',
        description: 'Nome e cidade são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: newLibrary, error } = await supabase
        .from('libraries')
        .insert({
          name,
          city,
          address,
          phone,
          description,
          latitude,
          longitude,
          image_url,
          instagram,
          loan_days,
          active: active ?? true,
        })
        .select()
        .single();

      if (error) throw error;

      // Log de auditoria
      await logCreate(
        'LIBRARY_CREATE',
        'library',
        newLibrary.id,
        name,
        {
          name,
          city,
          address,
          phone,
          description,
          latitude,
          longitude,
          image_url,
          instagram,
          loan_days,
          active: active ?? true,
        },
        user?.id,
        user?.library_id
      );

      toast({
        title: 'Biblioteca salva',
        description: 'Os dados foram atualizados com sucesso.',
      });
      
      setDialogOpen(false);
      
      // Limpar campos do formulário
      if (nameInputRef.current) nameInputRef.current.value = '';
      if (cityInputRef.current) cityInputRef.current.value = '';
      if (addressInputRef.current) addressInputRef.current.value = '';
      if (phoneInputRef.current) phoneInputRef.current.value = '';
      if (descriptionInputRef.current) descriptionInputRef.current.value = '';
      if (latitudeInputRef.current) latitudeInputRef.current.value = '';
      if (longitudeInputRef.current) longitudeInputRef.current.value = '';
      if (imageUrlInputRef.current) imageUrlInputRef.current.value = '';
      if (instagramInputRef.current) instagramInputRef.current.value = '';
      if (loanDaysInputRef.current) loanDaysInputRef.current.value = '14';
      setActive(true);
      
      // Recarregar lista e dados relacionados
      await loadLibraries();
      await loadCopies();
      await loadLoans();
    } catch (error) {
      console.error('Erro ao salvar biblioteca:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a biblioteca.',
        variant: 'destructive',
      });
    }
  };

  // Função para exportar para Excel
  const handleExport = () => {
    try {
      const exportData = libraries.map((lib: any) => ({
        'Nome': lib.name,
        'Cidade': lib.city || '-',
        'Endereço': lib.address || '-',
        'Telefone': lib.phone || '-',
        'Descrição': lib.description || '-',
        'Latitude': lib.latitude || '-',
        'Longitude': lib.longitude || '-',
        'URL Imagem': lib.image_url || '-',
        'Ativa': lib.active ? 'Sim' : 'Não',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bibliotecas');

      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const fileName = `bibliotecas_${dateStr}.xlsx`;

      XLSX.writeFile(wb, fileName);

      toast({
        title: 'Exportação realizada',
        description: `Arquivo ${fileName} gerado com sucesso.`,
      });
    } catch (error: any) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível gerar o arquivo Excel.',
        variant: 'destructive',
      });
    }
  };

  // Função para abrir o modal de edição
  const handleEdit = (library: Library) => {
    setEditingLib(library);
    setEditForm({
      name: library.name || '',
      city: library.city || '',
      address: (library as any).address || '',
      phone: (library as any).phone || '',
      description: (library as any).description || '',
      latitude: (library as any).latitude?.toString() || '',
      longitude: (library as any).longitude?.toString() || '',
      image_url: (library as any).image_url || '',
      instagram: (library as any).instagram || '',
    });
    setIsEditOpen(true);
  };

  // Função para atualizar a biblioteca
  const handleUpdate = async () => {
    if (!editingLib) return;

    // Verificar se bibliotecário está tentando editar sua própria biblioteca
    if (user?.role === 'bibliotecario' && user.library_id !== editingLib.id) {
      toast({
        title: 'Acesso Negado',
        description: 'Você só pode editar sua própria biblioteca.',
        variant: 'destructive',
      });
      return;
    }

    const name = editForm.name.trim();
    const city = editForm.city.trim();
    const address = editForm.address.trim() || null;
    const phone = editForm.phone.trim() || null;
    const description = editForm.description.trim() || null;
    const latitude = editForm.latitude ? parseFloat(editForm.latitude) : null;
    const longitude = editForm.longitude ? parseFloat(editForm.longitude) : null;
    const image_url = editForm.image_url.trim() || null;
    const instagram = editForm.instagram.trim() || null;

    if (!name || !city) {
      toast({
        title: 'Erro',
        description: 'Nome e cidade são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Buscar valores antigos para auditoria
      const { data: oldLibrary } = await (supabase as any)
        .from('libraries')
        .select('*')
        .eq('id', editingLib.id)
        .single();

      const { error } = await (supabase as any)
        .from('libraries')
        .update({
          name,
          city,
          address,
          phone,
          description,
          latitude,
          longitude,
          image_url,
          instagram,
        })
        .eq('id', editingLib.id);

      if (error) throw error;

      // Log de auditoria
      if (oldLibrary) {
        await logUpdate(
          'LIBRARY_UPDATE',
          'library',
          editingLib.id,
          name,
          oldLibrary,
          {
            name,
            city,
            address,
            phone,
            description,
            latitude,
            longitude,
            image_url,
            instagram,
          },
          user?.id,
          user?.library_id
        );
      }

      toast({
        title: 'Biblioteca atualizada',
        description: 'Os dados foram atualizados com sucesso.',
      });

      setIsEditOpen(false);
      setEditingLib(null);
      setEditForm({ 
        name: '',
        city: '',
        address: '',
        phone: '',
        description: '',
        latitude: '',
        longitude: '',
        image_url: '',
        instagram: '',
      });

      // Recarregar lista
      await loadLibraries();
    } catch (error: any) {
      console.error('Erro ao atualizar biblioteca:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível atualizar a biblioteca.',
        variant: 'destructive',
      });
    }
  };

  // Função para excluir biblioteca
  const handleDelete = async (libraryId: string, libraryName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a biblioteca "${libraryName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setLoading(true);

    try {
      // 1. Verificar se há empréstimos ativos (status = 'aberto')
      const { count: activeLoansCount, error: activeLoansError } = await (supabase as any)
        .from('loans')
        .select('id', { count: 'exact' })
        .eq('library_id', libraryId)
        .eq('status', 'aberto');

      if (activeLoansError) throw activeLoansError;

      if (activeLoansCount && activeLoansCount > 0) {
        toast({
          title: 'Erro ao excluir',
          description: `Esta biblioteca possui ${activeLoansCount} empréstimo(s) ativo(s). Finalize ou cancele todos os empréstimos antes de excluir a biblioteca.`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // 2. Atualizar empréstimos históricos (status != 'aberto') para NULL
      const { error: updateLoansError } = await (supabase as any)
        .from('loans')
        .update({ library_id: null })
        .eq('library_id', libraryId);

      if (updateLoansError) {
        console.warn('Aviso ao atualizar empréstimos:', updateLoansError);
        // Continuar mesmo se houver erro, pois pode não haver empréstimos históricos
      }

      // 3. Atualizar exemplares (copies) para NULL ou excluir
      // Vamos atualizar para NULL para manter o histórico
      const { error: updateCopiesError } = await (supabase as any)
        .from('copies')
        .update({ library_id: null })
        .eq('library_id', libraryId);

      if (updateCopiesError) {
        console.warn('Aviso ao atualizar exemplares:', updateCopiesError);
      }

      // 4. Atualizar usuários vinculados (bibliotecários) para NULL
      const { error: updateUsersError } = await (supabase as any)
        .from('users_profile')
        .update({ library_id: null })
        .eq('library_id', libraryId);

      if (updateUsersError) {
        console.warn('Aviso ao atualizar usuários:', updateUsersError);
      }

      // 5. Verificar e atualizar eventos se existir a tabela
      try {
        const { error: updateEventsError } = await (supabase as any)
          .from('events')
          .update({ library_id: null })
          .eq('library_id', libraryId);

        if (updateEventsError && !updateEventsError.message.includes('relation') && !updateEventsError.message.includes('does not exist')) {
          console.warn('Aviso ao atualizar eventos:', updateEventsError);
        }
      } catch (eventsError: any) {
        // Ignorar se a tabela não existir
        if (!eventsError.message?.includes('relation') && !eventsError.message?.includes('does not exist')) {
          console.warn('Aviso ao atualizar eventos:', eventsError);
        }
      }

      // 6. Buscar dados da biblioteca antes de excluir (para auditoria)
      const { data: libraryData } = await (supabase as any)
        .from('libraries')
        .select('*')
        .eq('id', libraryId)
        .single();

      // 7. Agora pode excluir a biblioteca
      const { error } = await (supabase as any)
        .from('libraries')
        .delete()
        .eq('id', libraryId);

      if (error) throw error;

      // Log de auditoria
      if (libraryData) {
        await logDelete(
          'LIBRARY_DELETE',
          'library',
          libraryId,
          libraryName,
          {
            ...libraryData,
            dependencies_updated: {
              loans: 'updated_to_null',
              copies: 'updated_to_null',
              users: 'updated_to_null',
            },
          },
          user?.id,
          user?.library_id
        );
      }

      toast({
        title: 'Biblioteca excluída',
        description: 'A biblioteca foi removida com sucesso. Empréstimos históricos, exemplares e usuários foram atualizados.',
      });

      // Recarregar lista
      await loadLibraries();
    } catch (error: any) {
      console.error('Erro ao excluir biblioteca:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível excluir a biblioteca. Verifique as dependências.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Gestão de Bibliotecas</h1>
          <p className="text-muted-foreground">
            Gerencie as unidades da rede estadual
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          {user?.role === 'admin_rede' && (
          <Dialog 
            open={dialogOpen} 
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                // Resetar formulário ao fechar
                if (nameInputRef.current) nameInputRef.current.value = '';
                if (cityInputRef.current) cityInputRef.current.value = '';
                if (addressInputRef.current) addressInputRef.current.value = '';
                if (phoneInputRef.current) phoneInputRef.current.value = '';
                if (descriptionInputRef.current) descriptionInputRef.current.value = '';
                if (latitudeInputRef.current) latitudeInputRef.current.value = '';
                if (longitudeInputRef.current) longitudeInputRef.current.value = '';
                if (imageUrlInputRef.current) imageUrlInputRef.current.value = '';
                if (loanDaysInputRef.current) loanDaysInputRef.current.value = '14';
                setActive(true);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="gov">
                <Plus className="mr-2 h-4 w-4" />
                Nova Biblioteca
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Biblioteca</DialogTitle>
              <DialogDescription>
                Cadastre uma nova unidade na rede estadual
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Biblioteca</Label>
                <Input 
                  id="name" 
                  ref={nameInputRef}
                  placeholder="Ex: Biblioteca Central" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input 
                    id="city" 
                    ref={cityInputRef}
                    placeholder="São Paulo" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loan_days">Dias de Empréstimo</Label>
                  <Input 
                    id="loan_days" 
                    ref={loanDaysInputRef}
                    type="number" 
                    defaultValue={14} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input 
                  id="address" 
                  ref={addressInputRef}
                  placeholder="Rua, número, bairro" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone" 
                  ref={phoneInputRef}
                  type="text"
                  placeholder="(00) 0000-0000" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  ref={descriptionInputRef}
                  placeholder="Descrição da biblioteca, horários de funcionamento, etc." 
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input 
                    id="latitude" 
                    ref={latitudeInputRef}
                    type="number"
                    step="any"
                    placeholder="-23.5505" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input 
                    id="longitude" 
                    ref={longitudeInputRef}
                    type="number"
                    step="any"
                    placeholder="-46.6333" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">URL da Imagem</Label>
                <Input 
                  id="image_url" 
                  ref={imageUrlInputRef}
                  type="text"
                  placeholder="https://exemplo.com/imagem.jpg" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input 
                  id="instagram" 
                  ref={instagramInputRef}
                  type="url"
                  placeholder="https://www.instagram.com/perfil/" 
                />
                <p className="text-xs text-muted-foreground">
                  URL completa do perfil do Instagram da biblioteca
                </p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label>Biblioteca Ativa</Label>
                  <p className="text-sm text-muted-foreground">
                    Disponível para operação
                  </p>
                </div>
                <Switch 
                  checked={active}
                  onCheckedChange={setActive}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="gov" onClick={handleSave}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          )}
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Libraries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bibliotecas Cadastradas</CardTitle>
          <CardDescription>
            {filteredLibraries.length} unidade(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Biblioteca</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Exemplares</TableHead>
                  <TableHead>Empréstimos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Carregando bibliotecas...
                    </TableCell>
                  </TableRow>
                ) : filteredLibraries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma biblioteca encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLibraries.map((library) => {
                    const libraryCopies = copies.filter(
                      (c) => c.library_id === library.id
                    ).length;
                    const libraryLoans = loans.filter(
                      (l) => l.library_id === library.id
                    ).length;
                    return (
                      <TableRow key={library.id} className="table-row-interactive">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{library.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {library.city}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{library.city}</TableCell>
                        <TableCell>
                          {(library as any).phone || '-'}
                        </TableCell>
                        <TableCell>{libraryCopies}</TableCell>
                        <TableCell>{libraryLoans}</TableCell>
                        <TableCell>
                          <Badge variant={library.active ?? true ? 'success' : 'manutencao'}>
                            {library.active ?? true ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* Botão de editar - disponível para admin e bibliotecário (sua própria biblioteca) */}
                            {(user?.role === 'admin_rede' || (user?.role === 'bibliotecario' && user?.library_id === library.id)) && (
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => handleEdit(library)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {/* Botão de excluir - apenas para admin */}
                            {user?.role === 'admin_rede' && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(library.id, library.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Biblioteca</DialogTitle>
            <DialogDescription>
              Atualize os dados da biblioteca
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome da Biblioteca</Label>
              <Input 
                id="edit-name" 
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Ex: Biblioteca Central" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-city">Cidade</Label>
              <Input 
                id="edit-city" 
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                placeholder="São Paulo" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Endereço Completo</Label>
              <Input 
                id="edit-address" 
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="Rua, número, bairro" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input 
                id="edit-phone" 
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="(00) 0000-0000" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea 
                id="edit-description" 
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Descrição da biblioteca, horários de funcionamento, etc." 
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-latitude">Latitude</Label>
                <Input 
                  id="edit-latitude" 
                  type="number"
                  step="any"
                  value={editForm.latitude}
                  onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                  placeholder="-23.5505" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-longitude">Longitude</Label>
                <Input 
                  id="edit-longitude" 
                  type="number"
                  step="any"
                  value={editForm.longitude}
                  onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                  placeholder="-46.6333" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image_url">URL da Imagem</Label>
              <Input 
                id="edit-image_url" 
                type="text"
                value={editForm.image_url}
                onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-instagram">Instagram</Label>
              <Input 
                id="edit-instagram" 
                type="url"
                value={editForm.instagram}
                onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                placeholder="https://www.instagram.com/perfil/" 
              />
              <p className="text-xs text-muted-foreground">
                URL completa do perfil do Instagram da biblioteca
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button variant="gov" onClick={handleUpdate}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
