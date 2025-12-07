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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Plus, Calendar, CheckCircle2, FileSpreadsheet, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import * as XLSX from 'xlsx';
import type { Tables } from '@/integrations/supabase/types';

// Tipo para Evento (assumindo estrutura da tabela events)
type Event = {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  expected_audience: number;
  actual_audience: number | null;
  status: 'agendado' | 'realizado' | 'cancelado';
  banner_url: string | null;
  library_id: string;
  created_at: string;
  updated_at: string;
};

type Library = Tables<'libraries'>;

const categories = ['Oficina', 'Sarau', 'Leitura', 'Outros'];

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [evaluateDialogOpen, setEvaluateDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Refs para o formulário de novo evento
  const titleInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const categorySelectRef = useRef<HTMLButtonElement>(null);
  const expectedAudienceInputRef = useRef<HTMLInputElement>(null);
  const bannerUrlInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>('');

  // Ref para o formulário de avaliação
  const actualAudienceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadEvents();
    if (user?.role === 'admin_rede') {
      loadLibraries();
    }
  }, [user]);

  // Se for bibliotecário, definir automaticamente a biblioteca ao abrir o dialog
  useEffect(() => {
    if (user?.role === 'bibliotecario' && user.library_id && !selectedLibraryId) {
      setSelectedLibraryId(user.library_id);
    }
  }, [user, selectedLibraryId]);

  // Preencher formulário quando o modal abrir e houver um evento sendo editado
  useEffect(() => {
    if (dialogOpen && editingEvent && editingId) {
      // Aguardar um tick para garantir que o DOM está renderizado
      const timer = setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.value = editingEvent.title || '';
        }
        if (dateInputRef.current) {
          dateInputRef.current.value = formatDateForInput(editingEvent.date);
        }
        if (locationInputRef.current) {
          locationInputRef.current.value = editingEvent.location || '';
        }
        if (expectedAudienceInputRef.current) {
          expectedAudienceInputRef.current.value = editingEvent.expected_audience?.toString() || '';
        }
        if (bannerUrlInputRef.current) {
          bannerUrlInputRef.current.value = editingEvent.banner_url || '';
        }
        setSelectedCategory(editingEvent.category || '');
        if (user?.role === 'admin_rede') {
          setSelectedLibraryId(editingEvent.library_id || '');
        }
      }, 10);

      return () => clearTimeout(timer);
    }
  }, [dialogOpen, editingEvent, editingId, user]);

  const loadLibraries = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('libraries')
        .select('id, name')
        .order('name');

      if (error) throw error;

      setLibraries((data || []) as Library[]);
    } catch (error: any) {
      console.error('Erro ao carregar bibliotecas:', error);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      let query = (supabase as any)
        .from('events')
        .select('*');

      // Filtrar por library_id se for bibliotecário
      if (user?.role === 'bibliotecario' && user.library_id) {
        query = query.eq('library_id', user.library_id);
      }

      const { data, error } = await query
        .order('date', { ascending: false });

      if (error) throw error;

      setEvents((data || []) as Event[]);
    } catch (error: any) {
      console.error('Erro ao carregar eventos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os eventos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para formatar data ISO para datetime-local
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      // Usar toISOString e slice para garantir formato correto YYYY-MM-DDTHH:mm
      return date.toISOString().slice(0, 16);
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '';
    }
  };

  const handleEdit = (event: Event) => {
    // 1. Receber o objeto event completo como parâmetro ✓
    // 2. Atualizar o estado do formulário com os dados do evento
    setEditingEvent(event);
    setEditingId(event.id);
    
    // 3. TRATAMENTO ESPECIAL DE DATA - já formatado na função formatDateForInput
    // 4. Definir o ID de edição ✓
    // 5. Abrir o modal
    setDialogOpen(true);
    
    // Os campos serão preenchidos pelo useEffect quando o modal abrir
  };

  const handleDelete = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir o evento "${eventTitle}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Evento excluído com sucesso.',
      });

      loadEvents();
    } catch (error: any) {
      console.error('Erro ao excluir evento:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível excluir o evento.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateEvent = async () => {
    try {
      const title = titleInputRef.current?.value;
      const date = dateInputRef.current?.value;
      const location = locationInputRef.current?.value;
      const expectedAudience = expectedAudienceInputRef.current?.value;
      const bannerUrl = bannerUrlInputRef.current?.value;

      if (!title || !date || !location || !selectedCategory || !expectedAudience) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha todos os campos obrigatórios.',
          variant: 'destructive',
        });
        return;
      }

      // Determinar library_id
      let libraryId: string | null = null;
      
      if (user?.role === 'bibliotecario' && user.library_id) {
        libraryId = user.library_id;
      } else if (user?.role === 'admin_rede') {
        libraryId = selectedLibraryId || null;
      }

      if (!libraryId) {
        toast({
          title: 'Erro',
          description: 'Selecione uma biblioteca.',
          variant: 'destructive',
        });
        return;
      }

      const eventData = {
        title,
        date: new Date(date).toISOString(),
        location,
        category: selectedCategory,
        expected_audience: parseInt(expectedAudience),
        banner_url: bannerUrl || null,
        library_id: libraryId,
      };

      let error;
      
      // Se estiver editando, fazer UPDATE
      if (editingId) {
        const result = await (supabase as any)
          .from('events')
          .update(eventData)
          .eq('id', editingId);
        error = result.error;
      } else {
        // Se não estiver editando, fazer INSERT
        const result = await (supabase as any)
          .from('events')
          .insert({
            ...eventData,
            actual_audience: null,
            status: 'agendado',
          });
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: editingId ? 'Evento atualizado com sucesso.' : 'Evento cadastrado com sucesso.',
      });

      setDialogOpen(false);
      setEditingId(null);
      
      // Resetar formulário
      if (titleInputRef.current) titleInputRef.current.value = '';
      if (dateInputRef.current) dateInputRef.current.value = '';
      if (locationInputRef.current) locationInputRef.current.value = '';
      if (expectedAudienceInputRef.current) expectedAudienceInputRef.current.value = '';
      if (bannerUrlInputRef.current) bannerUrlInputRef.current.value = '';
      setSelectedCategory('');
      if (user?.role === 'admin_rede') {
        setSelectedLibraryId('');
      }

      loadEvents();
    } catch (error: any) {
      console.error('Erro ao salvar evento:', error);
      toast({
        title: 'Erro',
        description: error?.message || (editingId ? 'Não foi possível atualizar o evento.' : 'Não foi possível cadastrar o evento.'),
        variant: 'destructive',
      });
    }
  };

  const handleEvaluateEvent = async () => {
    if (!selectedEvent) return;

    try {
      const actualAudience = actualAudienceInputRef.current?.value;

      if (!actualAudience) {
        toast({
          title: 'Campo obrigatório',
          description: 'Informe o público real.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await (supabase as any)
        .from('events')
        .update({
          actual_audience: parseInt(actualAudience),
          status: 'realizado',
        })
        .eq('id', selectedEvent.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Evento concluído e avaliado com sucesso.',
      });

      setEvaluateDialogOpen(false);
      setSelectedEvent(null);
      if (actualAudienceInputRef.current) actualAudienceInputRef.current.value = '';

      loadEvents();
    } catch (error: any) {
      console.error('Erro ao avaliar evento:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível concluir o evento.',
        variant: 'destructive',
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'agendado':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Agendado</Badge>;
      case 'realizado':
        return <Badge className="bg-green-500 hover:bg-green-600">Realizado</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-500 hover:bg-red-600">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getAudienceDisplay = (event: Event) => {
    const actual = event.actual_audience ?? 0;
    const expected = event.expected_audience;
    const percentage = expected > 0 ? Math.round((actual / expected) * 100) : 0;

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span>{actual} / {expected}</span>
          <span className="text-muted-foreground">({percentage}%)</span>
        </div>
        <Progress value={Math.min(percentage, 100)} className="h-2" />
      </div>
    );
  };

  const handleExportExcel = () => {
    try {
      const exportData = events.map((event) => {
        const actual = event.actual_audience ?? 0;
        const expected = event.expected_audience;
        const percentage = expected > 0 ? Math.round((actual / expected) * 100) : 0;

        return {
          'Data': formatDateTime(event.date),
          'Título': event.title,
          'Categoria': event.category,
          'Status': event.status === 'agendado' ? 'Agendado' : event.status === 'realizado' ? 'Realizado' : 'Cancelado',
          'Local': event.location,
          'Público Esperado': event.expected_audience,
          'Público Real': event.actual_audience ?? 0,
          'Percentual': `${percentage}%`,
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Eventos');

      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      const fileName = `eventos_culturais_${day}${month}${year}.xlsx`;

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

  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Eventos e Ações Culturais</h1>
          <p className="text-muted-foreground">
            Gerencie eventos e ações culturais da biblioteca
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                // Resetar formulário e editingId ao fechar
                setEditingId(null);
                setEditingEvent(null);
                if (titleInputRef.current) titleInputRef.current.value = '';
                if (dateInputRef.current) dateInputRef.current.value = '';
                if (locationInputRef.current) locationInputRef.current.value = '';
                if (expectedAudienceInputRef.current) expectedAudienceInputRef.current.value = '';
                if (bannerUrlInputRef.current) bannerUrlInputRef.current.value = '';
                setSelectedCategory('');
                if (user?.role === 'admin_rede') {
                  setSelectedLibraryId('');
                }
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="gov">
                <Plus className="mr-2 h-4 w-4" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Evento' : 'Cadastrar Novo Evento'}</DialogTitle>
                <DialogDescription>
                  {editingId ? 'Atualize os dados do evento cultural' : 'Preencha os dados do evento cultural'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    ref={titleInputRef}
                    placeholder="Nome do evento"
                  />
                </div>
                {user?.role === 'admin_rede' && (
                  <div className="space-y-2">
                    <Label htmlFor="library">Biblioteca *</Label>
                    <Select value={selectedLibraryId} onValueChange={setSelectedLibraryId}>
                      <SelectTrigger id="library">
                        <SelectValue placeholder="Selecione a biblioteca" />
                      </SelectTrigger>
                      <SelectContent>
                        {libraries.map((lib) => (
                          <SelectItem key={lib.id} value={lib.id}>
                            {lib.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="date">Data e Hora *</Label>
                  <Input
                    id="date"
                    ref={dateInputRef}
                    type="datetime-local"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Local *</Label>
                  <Input
                    id="location"
                    ref={locationInputRef}
                    placeholder="Local do evento"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedAudience">Público Esperado *</Label>
                  <Input
                    id="expectedAudience"
                    ref={expectedAudienceInputRef}
                    type="number"
                    placeholder="Quantidade de pessoas esperadas"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bannerUrl">Banner URL</Label>
                  <Input
                    id="bannerUrl"
                    ref={bannerUrlInputRef}
                    placeholder="URL da imagem do banner (opcional)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="gov" onClick={handleCreateEvent}>
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos Cadastrados</CardTitle>
          <CardDescription>
            Lista de eventos e ações culturais ordenados por data (mais recentes primeiro)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Carregando eventos...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Nenhum evento cadastrado.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Público (Real/Meta)</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        {formatDateTime(event.date)}
                      </TableCell>
                      <TableCell>{event.title}</TableCell>
                      <TableCell>{event.category}</TableCell>
                      <TableCell>{getStatusBadge(event.status)}</TableCell>
                      <TableCell className="w-[200px]">
                        {getAudienceDisplay(event)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(event)}
                            className="h-8 w-8 p-0"
                            title="Editar evento"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(event.id, event.title)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Excluir evento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {event.status === 'agendado' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEvent(event);
                                setEvaluateDialogOpen(true);
                              }}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Concluir/Avaliar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evaluate Event Dialog */}
      <Dialog
        open={evaluateDialogOpen}
        onOpenChange={(open) => {
          setEvaluateDialogOpen(open);
          if (!open) {
            setSelectedEvent(null);
            if (actualAudienceInputRef.current) actualAudienceInputRef.current.value = '';
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Concluir e Avaliar Evento</DialogTitle>
            <DialogDescription>
              Informe o público real do evento "{selectedEvent?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="actualAudience">Público Real *</Label>
              <Input
                id="actualAudience"
                ref={actualAudienceInputRef}
                type="number"
                placeholder="Quantas pessoas participaram?"
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvaluateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="gov" onClick={handleEvaluateEvent}>
              Concluir Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

