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
  });
  
  const nameInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const latitudeInputRef = useRef<HTMLInputElement>(null);
  const longitudeInputRef = useRef<HTMLInputElement>(null);
  const imageUrlInputRef = useRef<HTMLInputElement>(null);
  const loanDaysInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadLibraries();
    loadCopies();
    loadLoans();
  }, [user]);

  const loadLibraries = async () => {
    try {
      setLoading(true);
      
      let query = (supabase as any)
        .from('libraries')
        .select('id, name, city, address, active, created_at, phone, description, latitude, longitude, image_url');

      // Filtrar baseado no role do usuário
      if (user?.role === 'bibliotecario' && user.library_id) {
        // Bibliotecário vê apenas sua biblioteca
        query = query.eq('id', user.library_id);
      }
      // Se for admin_rede, não adiciona filtro (vê todas)

      const { data, error } = await query.order('name');

      if (error) throw error;

      setLibraries((data || []) as Library[]);
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
      const { data, error } = await supabase
        .from('copies')
        .select('*');

      if (error) throw error;

      setCopies(data || []);
    } catch (error) {
      console.error('Erro ao carregar exemplares:', error);
    }
  };

  const loadLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('status', 'aberto');

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
      const { error } = await supabase
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
          loan_days,
          active: active ?? true,
        });

      if (error) throw error;

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
    });
    setIsEditOpen(true);
  };

  // Função para atualizar a biblioteca
  const handleUpdate = async () => {
    if (!editingLib) return;

    const name = editForm.name.trim();
    const city = editForm.city.trim();
    const address = editForm.address.trim() || null;
    const phone = editForm.phone.trim() || null;
    const description = editForm.description.trim() || null;
    const latitude = editForm.latitude ? parseFloat(editForm.latitude) : null;
    const longitude = editForm.longitude ? parseFloat(editForm.longitude) : null;
    const image_url = editForm.image_url.trim() || null;

    if (!name || !city) {
      toast({
        title: 'Erro',
        description: 'Nome e cidade são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
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
        })
        .eq('id', editingLib.id);

      if (error) throw error;

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

    try {
      const { error } = await (supabase as any)
        .from('libraries')
        .delete()
        .eq('id', libraryId);

      if (error) throw error;

      toast({
        title: 'Biblioteca excluída',
        description: 'A biblioteca foi removida com sucesso.',
      });

      // Recarregar lista
      await loadLibraries();
    } catch (error: any) {
      console.error('Erro ao excluir biblioteca:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível excluir a biblioteca.',
        variant: 'destructive',
      });
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
                          {user?.role === 'admin_rede' && (
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon-sm"
                                onClick={() => handleEdit(library)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(library.id, library.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
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
