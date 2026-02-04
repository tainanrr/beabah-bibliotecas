import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Search, User, Edit, Ban, CheckCircle, FileSpreadsheet, IdCard, Download, Share2, Trash2, Unlock, Pencil, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import * as XLSX from 'xlsx';
// @ts-ignore
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

type UserProfile = Tables<'users_profile'>;
type Library = Tables<'libraries'>;
type Loan = Tables<'loans'>;

export default function Readers() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [readers, setReaders] = useState<UserProfile[]>([]);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>('');
  const [registrationDate, setRegistrationDate] = useState<string>(() => {
    // Inicializar com a data de hoje no formato YYYY-MM-DD
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  // Estados para edição
  const [editingReader, setEditingReader] = useState<UserProfile | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    created_at: '',
    library_id: '',
    birth_date: '',
    phone: '',
    address_street: '',
    address_neighborhood: '',
    address_city: '',
    ethnicity: '',
    gender: '',
    education_level: '',
    interests: '',
    favorite_genres: '',
    suggestions: '',
  });

  // Estados para Carteirinha Digital
  const [selectedCardReader, setSelectedCardReader] = useState<UserProfile | null>(null);
  const [isCardOpen, setIsCardOpen] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadReaders();
    loadLibraries();
    loadLoans();
  }, [user]);

  // Se for bibliotecário, definir automaticamente a biblioteca ao abrir o dialog
  useEffect(() => {
    if (user?.role === 'bibliotecario' && user.library_id && !selectedLibraryId) {
      setSelectedLibraryId(user.library_id);
    }
  }, [user, dialogOpen, selectedLibraryId]);

  const loadReaders = async () => {
    try {
      setLoading(true);
      // Bibliotecários podem ver TODOS os leitores para fazer empréstimos entre bibliotecas
      const { data, error } = await supabase
        .from('users_profile')
        .select('*, libraries(name)')
        .eq('role', 'leitor')
        .order('name');

      if (error) {
        console.error('Erro ao carregar leitores:', error);
        console.error('Detalhes do erro:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      console.log('Leitores carregados:', data);
      setReaders(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar leitores:', error);
      const errorMsg = error?.message || error?.details || 'Não foi possível carregar os leitores.';
      
      if (error?.message?.includes('Could not find the table')) {
        toast({
          title: 'Tabela não encontrada',
          description: 'A tabela "users_profile" não existe no banco de dados. Verifique o Supabase Dashboard e crie a tabela se necessário.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao carregar',
          description: errorMsg,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLibraries = async () => {
    try {
      const { data, error } = await supabase
        .from('libraries')
        .select('*')
        .or('active.eq.true,active.is.null')
        .order('name');

      if (error) {
        console.error('Erro ao carregar bibliotecas:', error);
        throw error;
      }

      console.log('Bibliotecas carregadas:', data);
      setLibraries(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar bibliotecas:', error);
      toast({
        title: 'Aviso',
        description: 'Não foi possível carregar as bibliotecas.',
        variant: 'destructive',
      });
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

  const filteredReaders = readers.filter((reader) => {
    const matchesSearch =
      reader.name?.toLowerCase().includes(search.toLowerCase()) ||
      (reader.email && reader.email.toLowerCase().includes(search.toLowerCase()));
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'active') return matchesSearch && reader.active && !reader.blocked_until;
    if (statusFilter === 'blocked') return matchesSearch && reader.blocked_until;
    if (statusFilter === 'inactive') return matchesSearch && !reader.active;
    
    return matchesSearch;
  });

  const handleSave = async () => {
    const name = nameInputRef.current?.value.trim();
    const email = emailInputRef.current?.value.trim();

    if (!name || !email) {
      toast({
        title: 'Erro',
        description: 'Nome e e-mail são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (!lgpdConsent) {
      toast({
        title: 'Consentimento LGPD obrigatório',
        description: 'O leitor deve aceitar os termos de uso de dados.',
        variant: 'destructive',
      });
      return;
    }

    // Forçar library_id do usuário se for bibliotecário
    let libraryIdToUse: string;
    if (user?.role === 'bibliotecario' && user.library_id) {
      libraryIdToUse = user.library_id;
    } else {
      libraryIdToUse = selectedLibraryId;
    }

    if (!libraryIdToUse) {
      toast({
        title: 'Erro',
        description: 'Biblioteca de origem é obrigatória.',
        variant: 'destructive',
      });
      return;
    }

    if (libraries.length === 0) {
      toast({
        title: 'Erro',
        description: 'Nenhuma biblioteca disponível. Por favor, cadastre uma biblioteca primeiro.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Dados a serem inseridos:', {
        name,
        email,
        role: 'leitor',
        library_id: libraryIdToUse,
        lgpd_consent: true,
        active: true,
      });

      // Converter a data selecionada para formato ISO com horário fixo
      const createdAt = registrationDate ? `${registrationDate}T12:00:00` : new Date().toISOString();

      const { data, error } = await supabase
        .from('users_profile')
        .insert({
          name,
          email,
          role: 'leitor',
          library_id: libraryIdToUse,
          lgpd_consent: true,
          active: true,
          created_at: createdAt,
        })
        .select();

      if (error) {
        console.error('Erro do Supabase:', error);
        console.error('Detalhes do erro:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      console.log('Leitor criado com sucesso:', data);

      toast({
        title: 'Leitor cadastrado',
        description: 'O cadastro foi realizado com sucesso.',
      });

      setDialogOpen(false);
      setLgpdConsent(false);
      setSelectedLibraryId('');
      
      // Resetar data de cadastro para hoje
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setRegistrationDate(`${year}-${month}-${day}`);

      // Limpar campos do formulário
      if (nameInputRef.current) nameInputRef.current.value = '';
      if (emailInputRef.current) emailInputRef.current.value = '';

      // Recarregar lista
      await loadReaders();
      await loadLoans();
    } catch (error: any) {
      console.error('Erro ao salvar leitor:', error);
      const errorMessage = error?.message || error?.details || 'Não foi possível salvar o leitor.';
      
      if (error?.message?.includes('Could not find the table')) {
        toast({
          title: 'Tabela não encontrada',
          description: 'A tabela "users_profile" não existe no banco de dados. Verifique o Supabase Dashboard e crie a tabela se necessário.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  // Função para formatar data ISO para YYYY-MM-DD
  const formatDateToInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  // Função para abrir o modal de edição
  const handleEditReader = (reader: UserProfile) => {
    setEditingReader(reader);
    
    // Formatar a data created_at de ISO para YYYY-MM-DD
    let formattedDate = '';
    if (reader.created_at) {
      formattedDate = formatDateToInput(reader.created_at);
    } else {
      // Se não tiver data, usar hoje
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
    }
    
    setEditForm({
      name: reader.name || '',
      email: reader.email || '',
      created_at: formattedDate,
      library_id: reader.library_id || '',
      birth_date: formatDateToInput((reader as any).birth_date),
      phone: (reader as any).phone || '',
      address_street: (reader as any).address_street || '',
      address_neighborhood: (reader as any).address_neighborhood || '',
      address_city: (reader as any).address_city || '',
      ethnicity: (reader as any).ethnicity || '',
      gender: (reader as any).gender || '',
      education_level: (reader as any).education_level || '',
      interests: (reader as any).interests || '',
      favorite_genres: (reader as any).favorite_genres || '',
      suggestions: (reader as any).suggestions || '',
    });
    
    setIsEditOpen(true);
  };

  // Função para atualizar o leitor
  const handleUpdateReader = async () => {
    if (!editingReader) return;

    const name = editForm.name.trim();

    if (!name) {
      toast({
        title: 'Erro',
        description: 'Nome é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Converter a data para formato ISO com horário fixo
      const createdAt = editForm.created_at ? `${editForm.created_at}T12:00:00` : new Date().toISOString();

      const { error } = await (supabase as any)
        .from('users_profile')
        .update({
          name,
          email: editForm.email.trim() || null,
          created_at: createdAt,
          library_id: editForm.library_id || null,
          birth_date: editForm.birth_date || null,
          phone: editForm.phone.trim() || null,
          address_street: editForm.address_street.trim() || null,
          address_neighborhood: editForm.address_neighborhood.trim() || null,
          address_city: editForm.address_city.trim() || null,
          ethnicity: editForm.ethnicity.trim() || null,
          gender: editForm.gender.trim() || null,
          education_level: editForm.education_level.trim() || null,
          interests: editForm.interests.trim() || null,
          favorite_genres: editForm.favorite_genres.trim() || null,
          suggestions: editForm.suggestions.trim() || null,
        })
        .eq('id', editingReader.id);

      if (error) {
        console.error('Erro ao atualizar leitor:', error);
        throw error;
      }

      toast({
        title: 'Leitor atualizado',
        description: 'Os dados do leitor foram atualizados com sucesso.',
      });

      setIsEditOpen(false);
      setEditingReader(null);
      setEditForm({ 
        name: '', email: '', created_at: '', library_id: '',
        birth_date: '', phone: '', address_street: '', address_neighborhood: '',
        address_city: '', ethnicity: '', gender: '', education_level: '',
        interests: '', favorite_genres: '', suggestions: ''
      });

      // Recarregar lista
      await loadReaders();
    } catch (error: any) {
      console.error('Erro ao atualizar leitor:', error);
      const errorMessage = error?.message || error?.details || 'Não foi possível atualizar o leitor.';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Função para formatar data em PT-BR (dd/mm/aaaa)
  const formatDatePTBR = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '-';
    }
  };

  // Função para gerar e baixar a carteirinha
  const handleDownloadCard = async () => {
    if (!selectedCardReader) {
      toast({
        title: 'Erro',
        description: 'Nenhum leitor selecionado.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Aguardar um pouco para garantir que o elemento está renderizado
      await new Promise(resolve => setTimeout(resolve, 300));

      const cardElement = document.getElementById('digital-card');
      if (!cardElement) {
        toast({
          title: 'Erro',
          description: 'Elemento da carteirinha não encontrado. Aguarde um momento e tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      // Capturar a imagem usando html2canvas
      const canvas = await html2canvas(cardElement, {
        backgroundColor: '#3b82f6', // Cor de fundo do gradiente
        scale: 2, // Maior qualidade
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Converter para blob e criar link de download
      canvas.toBlob((blob) => {
        if (!blob) {
          toast({
            title: 'Erro',
            description: 'Não foi possível gerar o arquivo.',
            variant: 'destructive',
          });
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Nome do arquivo: carteirinha_[nome_leitor].png
        const sanitizedName = selectedCardReader.name.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `carteirinha_${sanitizedName}.png`;
        link.download = fileName;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);

        toast({
          title: 'Download realizado',
          description: `Carteirinha salva como ${fileName}`,
        });
      }, 'image/png');
    } catch (error) {
      console.error('Erro ao gerar carteirinha:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar a carteirinha. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Função para bloquear/desbloquear leitor
  const handleToggleBlock = async (reader: UserProfile) => {
    const isBlocked = reader.blocked_until && new Date(reader.blocked_until) > new Date();
    
    if (isBlocked) {
      // Desbloquear
      if (!confirm(`Deseja desbloquear o leitor "${reader.name}"?`)) {
        return;
      }

      try {
        const { error } = await supabase
          .from('users_profile')
          .update({ blocked_until: null })
          .eq('id', reader.id);

        if (error) throw error;

        toast({
          title: 'Leitor desbloqueado',
          description: `O leitor "${reader.name}" foi desbloqueado com sucesso.`,
        });

        await loadReaders();
      } catch (error: any) {
        console.error('Erro ao desbloquear leitor:', error);
        toast({
          title: 'Erro',
          description: error?.message || 'Não foi possível desbloquear o leitor.',
          variant: 'destructive',
        });
      }
    } else {
      // Bloquear - pedir data de desbloqueio
      const blockDays = prompt(
        `Por quantos dias deseja bloquear o leitor "${reader.name}"?\n\nDigite o número de dias (ou deixe vazio para bloquear indefinidamente):`
      );

      if (blockDays === null) return; // Usuário cancelou

      try {
        let blockedUntil: string | null = null;
        
        if (blockDays && blockDays.trim() !== '') {
          const days = parseInt(blockDays);
          if (isNaN(days) || days < 0) {
            toast({
              title: 'Erro',
              description: 'Por favor, digite um número válido de dias.',
              variant: 'destructive',
            });
            return;
          }
          const blockDate = new Date();
          blockDate.setDate(blockDate.getDate() + days);
          blockedUntil = blockDate.toISOString();
        } else {
          // Bloqueio indefinido (data muito futura)
          const farFuture = new Date();
          farFuture.setFullYear(farFuture.getFullYear() + 100);
          blockedUntil = farFuture.toISOString();
        }

        const { error } = await supabase
          .from('users_profile')
          .update({ blocked_until: blockedUntil })
          .eq('id', reader.id);

        if (error) throw error;

        toast({
          title: 'Leitor bloqueado',
          description: `O leitor "${reader.name}" foi bloqueado com sucesso.`,
        });

        await loadReaders();
      } catch (error: any) {
        console.error('Erro ao bloquear leitor:', error);
        toast({
          title: 'Erro',
          description: error?.message || 'Não foi possível bloquear o leitor.',
          variant: 'destructive',
        });
      }
    }
  };

  // Função para excluir leitor
  const handleDeleteReader = async (reader: UserProfile) => {
    // Verificar se o leitor tem empréstimos ativos
    const activeLoans = loans.filter((l) => l.user_id === reader.id && l.status === 'aberto');
    
    if (activeLoans.length > 0) {
      toast({
        title: 'Não é possível excluir',
        description: `O leitor possui ${activeLoans.length} empréstimo(s) ativo(s). Finalize os empréstimos antes de excluir.`,
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o leitor "${reader.name}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users_profile')
        .delete()
        .eq('id', reader.id);

      if (error) throw error;

      toast({
        title: 'Leitor excluído',
        description: `O leitor "${reader.name}" foi excluído com sucesso.`,
      });

      await loadReaders();
    } catch (error: any) {
      console.error('Erro ao excluir leitor:', error);
      
      // Verificar se é erro de foreign key
      if (error?.message?.includes('foreign key') || error?.code === '23503') {
        toast({
          title: 'Não é possível excluir',
          description: 'Este leitor possui registros vinculados (empréstimos, reservas, etc.) e não pode ser excluído.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro',
          description: error?.message || 'Não foi possível excluir o leitor.',
          variant: 'destructive',
        });
      }
    }
  };

  // Função para exportar para Excel
  const handleExportExcel = () => {
    try {
      // Preparar dados para exportação
      const exportData = filteredReaders.map((reader) => {
        const library = libraries.find((l) => l.id === reader.library_id);
        const activeLoans = loans.filter((l) => l.user_id === reader.id).length;
        const isBlocked =
          reader.blocked_until &&
          new Date(reader.blocked_until) > new Date();

        return {
          'Nome': reader.name,
          'E-mail': reader.email || '-',
          'Biblioteca': library?.name || '-',
          'Data Cadastro': formatDatePTBR(reader.created_at),
          'Empréstimos Ativos': activeLoans,
          'LGPD': reader.lgpd_consent ? 'Sim' : 'Não',
          'Status': isBlocked
            ? 'Bloqueado'
            : reader.active ?? true
            ? 'Ativo'
            : 'Inativo',
        };
      });

      // Criar workbook e worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Leitores');

      // Gerar nome do arquivo com data atual
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      const fileName = `leitores_biblioteca_${day}${month}${year}.xlsx`;

      // Fazer download
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
    <div className="space-y-4 md:space-y-6 p-4 md:p-0 fade-in">
      {/* Page Header Responsivo */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Cadastro de Leitores</h1>
          <p className="text-sm text-muted-foreground">Gerencie os usuários da biblioteca</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog 
          open={dialogOpen} 
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              // Resetar formulário ao fechar
              if (nameInputRef.current) nameInputRef.current.value = '';
              if (emailInputRef.current) emailInputRef.current.value = '';
              setSelectedLibraryId('');
              setLgpdConsent(false);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="gov">
              <Plus className="mr-2 h-4 w-4" />
              Novo Leitor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar Leitor</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo usuário
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name" 
                  ref={nameInputRef}
                  placeholder="Nome do leitor" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  ref={emailInputRef}
                  type="email" 
                  placeholder="email@exemplo.com" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationDate">Data de Cadastro</Label>
                <Input 
                  id="registrationDate" 
                  type="date" 
                  value={registrationDate}
                  onChange={(e) => setRegistrationDate(e.target.value)}
                />
              </div>
              {user?.role === 'admin_rede' ? (
                <div className="space-y-2">
                  <Label>Biblioteca Vinculada</Label>
                  <Select value={selectedLibraryId} onValueChange={setSelectedLibraryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {libraries.length === 0 ? (
                        <SelectItem value="" disabled>
                          Nenhuma biblioteca disponível
                        </SelectItem>
                      ) : (
                        libraries.map((lib) => (
                          <SelectItem key={lib.id} value={lib.id}>
                            {lib.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {libraries.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Cadastre uma biblioteca primeiro
                    </p>
                  )}
                </div>
              ) : (
                user?.role === 'bibliotecario' && user.library_id && (
                  <div className="space-y-2">
                    <Label>Biblioteca Vinculada</Label>
                    <Input 
                      value={libraries.find(l => l.id === user.library_id)?.name || 'Biblioteca'} 
                      disabled 
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      O leitor será vinculado à sua biblioteca
                    </p>
                  </div>
                )
              )}
              
              {/* LGPD Consent */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <h4 className="font-medium text-sm">Termo de Consentimento LGPD</h4>
                <p className="text-xs text-muted-foreground">
                  Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), 
                  autorizo a coleta, armazenamento e tratamento dos meus dados pessoais para 
                  fins de cadastro e utilização dos serviços da biblioteca.
                </p>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lgpd"
                    checked={lgpdConsent}
                    onCheckedChange={(checked) => setLgpdConsent(checked as boolean)}
                  />
                  <Label
                    htmlFor="lgpd"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Li e aceito os termos de uso de dados
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="gov" onClick={handleSave}>
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          <Button variant="outline" onClick={handleExportExcel} className="w-full sm:w-auto">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Modal de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Leitor</DialogTitle>
            <DialogDescription>
              Atualize os dados do leitor
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Dados Básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome Completo *</Label>
                <Input 
                  id="edit-name" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Nome do leitor" 
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-birth_date">Data de Nascimento</Label>
                <Input 
                  id="edit-birth_date" 
                  type="date" 
                  value={editForm.birth_date}
                  onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input 
                  id="edit-phone" 
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="(51) 99999-9999" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-created_at">Data de Cadastro</Label>
                <Input 
                  id="edit-created_at" 
                  type="date" 
                  value={editForm.created_at}
                  onChange={(e) => setEditForm({ ...editForm, created_at: e.target.value })}
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium text-sm mb-3">Endereço</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-address_street">Rua e Número</Label>
                  <Input 
                    id="edit-address_street" 
                    value={editForm.address_street}
                    onChange={(e) => setEditForm({ ...editForm, address_street: e.target.value })}
                    placeholder="Rua, número" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address_neighborhood">Bairro</Label>
                  <Input 
                    id="edit-address_neighborhood" 
                    value={editForm.address_neighborhood}
                    onChange={(e) => setEditForm({ ...editForm, address_neighborhood: e.target.value })}
                    placeholder="Bairro" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-address_city">Cidade/UF</Label>
                  <Input 
                    id="edit-address_city" 
                    value={editForm.address_city}
                    onChange={(e) => setEditForm({ ...editForm, address_city: e.target.value })}
                    placeholder="Cidade-RS" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-library_id">Biblioteca Principal</Label>
                  <Select 
                    value={editForm.library_id} 
                    onValueChange={(value) => setEditForm({ ...editForm, library_id: value })}
                  >
                    <SelectTrigger id="edit-library_id">
                      <SelectValue placeholder="Selecione a biblioteca" />
                    </SelectTrigger>
                    <SelectContent>
                      {libraries.map((lib) => (
                        <SelectItem key={lib.id} value={lib.id}>
                          {lib.name} - {lib.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Dados Demográficos */}
            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium text-sm mb-3">Dados Demográficos</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-gender">Gênero</Label>
                  <Input 
                    id="edit-gender" 
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    placeholder="Ex: Mulheres cis, Homens cis" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ethnicity">Etnia/Raça</Label>
                  <Input 
                    id="edit-ethnicity" 
                    value={editForm.ethnicity}
                    onChange={(e) => setEditForm({ ...editForm, ethnicity: e.target.value })}
                    placeholder="Ex: Branca, Parda, Preta" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-education_level">Escolaridade</Label>
                  <Input 
                    id="edit-education_level" 
                    value={editForm.education_level}
                    onChange={(e) => setEditForm({ ...editForm, education_level: e.target.value })}
                    placeholder="Ex: Ensino Médio" 
                  />
                </div>
              </div>
            </div>

            {/* Preferências de Leitura */}
            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium text-sm mb-3">Preferências de Leitura</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-interests">Interesses na Biblioteca</Label>
                  <Input 
                    id="edit-interests" 
                    value={editForm.interests}
                    onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
                    placeholder="Ex: Levar livro, Participar de eventos" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-favorite_genres">Gêneros Favoritos</Label>
                  <Input 
                    id="edit-favorite_genres" 
                    value={editForm.favorite_genres}
                    onChange={(e) => setEditForm({ ...editForm, favorite_genres: e.target.value })}
                    placeholder="Ex: Terror, Romance, Poesia" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-suggestions">Sugestões/Observações</Label>
                  <Input 
                    id="edit-suggestions" 
                    value={editForm.suggestions}
                    onChange={(e) => setEditForm({ ...editForm, suggestions: e.target.value })}
                    placeholder="Sugestões de livros ou observações" 
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button variant="gov" onClick={handleUpdateReader}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4 md:pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="blocked">Bloqueados</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Readers List */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Leitores Cadastrados</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {filteredReaders.length} leitor(es)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredReaders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum leitor encontrado</div>
          ) : (
            <>
              {/* MOBILE: Cards */}
              <div className="md:hidden space-y-3">
                {filteredReaders.map((reader) => {
                  const library = libraries.find((l) => l.id === reader.library_id);
                  const activeLoans = loans.filter((l) => l.user_id === reader.id).length;
                  const isBlocked = reader.blocked_until && new Date(reader.blocked_until) > new Date();
                  
                  return (
                    <div key={reader.id} className="bg-white border rounded-lg p-3 shadow-sm">
                      {/* Header com Status e Ações */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2">
                          {isBlocked ? (
                            <Badge variant="destructive" className="text-xs">Bloqueado</Badge>
                          ) : reader.active ?? true ? (
                            <Badge variant="success" className="text-xs">Ativo</Badge>
                          ) : (
                            <Badge variant="manutencao" className="text-xs">Inativo</Badge>
                          )}
                          <Badge variant={activeLoans >= 3 ? 'warning' : 'outline'} className="text-xs">
                            {activeLoans}/3
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          {(user?.role === 'admin_rede' || user?.library_id === reader.library_id) && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEditReader(reader)} className="h-8 px-2">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 px-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleToggleBlock(reader)}>
                                    {isBlocked ? 'Desbloquear' : 'Bloquear'}
                                  </DropdownMenuItem>
                                  {user?.role === 'admin_rede' && (
                                    <DropdownMenuItem onClick={() => handleDeleteReader(reader)} className="text-red-600">
                                      <Trash2 className="h-4 w-4 mr-2" />Excluir
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Info Principal */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm shrink-0">
                          {reader.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm truncate">{reader.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{reader.email || 'Sem e-mail'}</p>
                        </div>
                      </div>
                      
                      {/* Detalhes */}
                      <div className="flex justify-between items-center mt-2 text-[10px] text-muted-foreground">
                        <span>📍 {library?.name || '-'}</span>
                        <span>{formatDatePTBR(reader.created_at)}</span>
                        {reader.lgpd_consent && <CheckCircle className="h-3 w-3 text-success" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP: Tabela */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Leitor</TableHead>
                      <TableHead>Biblioteca</TableHead>
                      <TableHead>Data Cadastro</TableHead>
                      <TableHead>Empréstimos</TableHead>
                      <TableHead>LGPD</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReaders.map((reader) => {
                      const library = libraries.find((l) => l.id === reader.library_id);
                      const activeLoans = loans.filter((l) => l.user_id === reader.id).length;
                      const isBlocked = reader.blocked_until && new Date(reader.blocked_until) > new Date();

                      return (
                        <TableRow key={reader.id} className="table-row-interactive">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                                {reader.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                              </div>
                              <div>
                                <p className="font-medium">{reader.name}</p>
                                <p className="text-xs text-muted-foreground">{reader.email || 'Sem e-mail'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{library?.name || '-'}</TableCell>
                          <TableCell>{formatDatePTBR(reader.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant={activeLoans >= 3 ? 'warning' : activeLoans > 0 ? 'outline' : 'manutencao'}>
                              {activeLoans} / 3
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {reader.lgpd_consent ? (
                              <CheckCircle className="h-5 w-5 text-success" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isBlocked ? (
                              <Badge variant="destructive">Bloqueado</Badge>
                            ) : reader.active ?? true ? (
                              <Badge variant="success">Ativo</Badge>
                            ) : (
                              <Badge variant="manutencao">Inativo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                          {user?.role === 'admin_rede' || 
                           (user?.role === 'bibliotecario' && reader.library_id === user.library_id) ? (
                            <div className="flex justify-end gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon-sm"
                                      onClick={() => {
                                        console.log("Abrindo modal para:", reader);
                                        setSelectedCardReader(reader);
                                        setIsCardOpen(true);
                                      }}
                                    >
                                      <IdCard className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Gerar Carteirinha Digital</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon-sm"
                                      onClick={() => handleEditReader(reader)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar Leitor</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      className={isBlocked ? "text-green-600 hover:text-green-700" : "text-warning hover:text-warning"}
                                      onClick={() => handleToggleBlock(reader)}
                                    >
                                      {isBlocked ? (
                                        <Unlock className="h-4 w-4" />
                                      ) : (
                                        <Ban className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{isBlocked ? 'Desbloquear Leitor' : 'Bloquear Leitor'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => handleDeleteReader(reader)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Excluir Leitor</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Carteirinha Digital */}
      <Dialog open={isCardOpen} onOpenChange={setIsCardOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Carteirinha Digital</DialogTitle>
            <DialogDescription>
              Visualize e baixe a carteirinha do leitor
            </DialogDescription>
          </DialogHeader>
          
          {selectedCardReader ? (
            <div className="space-y-4">
              {/* Carteirinha Visual - Layout Simplificado */}
              <div className="flex justify-center">
                <div
                  id="digital-card"
                  className="w-[300px] h-[480px] bg-blue-600 text-white rounded-lg shadow-xl overflow-hidden relative flex flex-col"
                >
                  {/* Parte Superior - Dados do Leitor */}
                  <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 bg-blue-700">
                    {/* Nome do Leitor */}
                    <h2 className="text-2xl font-bold mb-4 text-center">
                      {selectedCardReader.name || 'Leitor'}
                    </h2>

                    {/* Tipo */}
                    <Badge variant="outline" className="bg-white/20 text-white border-white/50 mb-4">
                      Leitor
                    </Badge>

                    {/* Biblioteca */}
                    <p className="text-sm text-blue-100 text-center">
                      {(selectedCardReader as any).libraries?.name || 'Rede de Bibliotecas Comunitárias'}
                    </p>
                  </div>

                  {/* Parte Inferior - QR Code */}
                  <div className="bg-white p-6 flex flex-col items-center justify-center">
                    {selectedCardReader?.id ? (
                      <div className="bg-white p-2 rounded">
                        <QRCode 
                          value={selectedCardReader.id}
                          size={100}
                          level="M"
                        />
                      </div>
                    ) : (
                      <div className="w-[100px] h-[100px] bg-gray-200 flex items-center justify-center rounded">
                        <p className="text-xs text-gray-500">Carregando código...</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-700 font-mono font-semibold mt-3">
                      ID: {selectedCardReader?.id ? selectedCardReader.id.substring(0, 8).toUpperCase() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownloadCard}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Imagem
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (navigator.share && selectedCardReader) {
                      navigator.share({
                        title: `Carteirinha - ${selectedCardReader.name}`,
                        text: `Carteirinha Digital de ${selectedCardReader.name}`,
                      }).catch(() => {
                        toast({
                          title: 'Compartilhamento',
                          description: 'Use o botão de download para salvar a imagem.',
                        });
                      });
                    } else {
                      toast({
                        title: 'Compartilhamento',
                        description: 'Use o botão de download para salvar a imagem e compartilhar.',
                      });
                    }
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>Carregando carteirinha...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
