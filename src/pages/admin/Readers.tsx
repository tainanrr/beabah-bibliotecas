import { useState, useEffect } from 'react';
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
import { Plus, Search, User, Edit, Ban, CheckCircle, FileSpreadsheet, IdCard, Download, Share2, Trash2, Unlock, Pencil, MoreHorizontal, X, Settings } from 'lucide-react';
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

// Tipo para opções customizáveis
type CustomOption = {
  id: string;
  name: string;
  is_default: boolean;
};

// Opções para os campos de seleção
const ETHNICITY_OPTIONS = [
  'Preta',
  'Parda',
  'Branca',
  'Amarela',
  'Indígena',
  'Outro',
];

const GENDER_OPTIONS = [
  'Mulheres cis',
  'Mulheres trans',
  'Homens cis',
  'Homens trans',
  'Não-binárie',
];

const EDUCATION_OPTIONS = [
  'Sem escolaridade',
  'Educação Infantil',
  'Ensino Fundamental (1º ao 5º ano)',
  'Ensino Fundamental (6º ao 9º ano)',
  'Ensino Médio',
  'Ensino Superior',
  'Pós-graduação Especialização',
  'Mestrado',
  'Doutorado',
];

// Opções padrão (fallback caso não carregue do banco)
const DEFAULT_INTERESTS_OPTIONS = [
  'Leitura na biblioteca',
  'Levar livro',
  'Participar de eventos',
  'Voluntariado',
  'Outro',
];

const DEFAULT_FAVORITE_GENRES_OPTIONS = [
  'Contos tradicionais',
  'Contos contemporâneos',
  'Poesia',
  'Novelas / Romances / Ficção',
  'Terror / Suspense',
  'Livros de HQ',
  'Crônica',
  'Teatro',
  'Literatura fantástica',
  'Informativo',
  'Romance espírita',
  'Livro imagem',
  'Literatura negra / Africana / Afro-brasileira',
  'Literatura indígena',
  'Literatura marginal e / ou periférica',
  'Outro',
];

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
  
  // Estados para o formulário de novo leitor
  const [newReaderForm, setNewReaderForm] = useState({
    name: '',
    email: '',
    birth_date: '',
    phone: '',
    address_street: '',
    address_neighborhood: '',
    address_city: '',
    ethnicity: '',
    gender: '',
    education_level: '',
    interests: [] as string[],
    favorite_genres: [] as string[],
    suggestions: '',
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
    interests: [] as string[],
    favorite_genres: [] as string[],
    suggestions: '',
  });

  // Estados para Carteirinha Digital
  const [selectedCardReader, setSelectedCardReader] = useState<UserProfile | null>(null);
  const [isCardOpen, setIsCardOpen] = useState(false);

  // Estados para opções dinâmicas (carregadas do banco de dados)
  const [interestsOptions, setInterestsOptions] = useState<string[]>(DEFAULT_INTERESTS_OPTIONS);
  const [favoriteGenresOptions, setFavoriteGenresOptions] = useState<string[]>(DEFAULT_FAVORITE_GENRES_OPTIONS);
  
  // Estados para opções completas (com id e is_default)
  const [interestsFullOptions, setInterestsFullOptions] = useState<CustomOption[]>([]);
  const [genresFullOptions, setGenresFullOptions] = useState<CustomOption[]>([]);
  
  // Estados para adicionar novas opções
  const [newInterestInput, setNewInterestInput] = useState('');
  const [newGenreInput, setNewGenreInput] = useState('');
  
  // Estados para gerenciamento de opções (editar/excluir)
  const [isManageInterestsOpen, setIsManageInterestsOpen] = useState(false);
  const [isManageGenresOpen, setIsManageGenresOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<CustomOption | null>(null);
  const [editOptionInput, setEditOptionInput] = useState('');

  useEffect(() => {
    loadReaders();
    loadLibraries();
    loadLoans();
    loadInterestOptions();
    loadGenreOptions();
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

  // Carregar opções de interesses do banco de dados
  const loadInterestOptions = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('reader_interest_options')
        .select('id, name, is_default')
        .eq('active', true)
        .order('name');

      if (error) {
        console.log('Usando opções padrão de interesses (tabela pode não existir):', error.message);
        setInterestsOptions(DEFAULT_INTERESTS_OPTIONS);
        setInterestsFullOptions([]);
        return;
      }

      if (data && data.length > 0) {
        const options = data.map((item: CustomOption) => item.name);
        setInterestsOptions(options);
        setInterestsFullOptions(data);
      } else {
        setInterestsOptions(DEFAULT_INTERESTS_OPTIONS);
        setInterestsFullOptions([]);
      }
    } catch (error) {
      console.error('Erro ao carregar opções de interesses:', error);
      setInterestsOptions(DEFAULT_INTERESTS_OPTIONS);
      setInterestsFullOptions([]);
    }
  };

  // Carregar opções de gêneros literários do banco de dados
  const loadGenreOptions = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('reader_genre_options')
        .select('id, name, is_default')
        .eq('active', true)
        .order('name');

      if (error) {
        console.log('Usando opções padrão de gêneros (tabela pode não existir):', error.message);
        setFavoriteGenresOptions(DEFAULT_FAVORITE_GENRES_OPTIONS);
        setGenresFullOptions([]);
        return;
      }

      if (data && data.length > 0) {
        const options = data.map((item: CustomOption) => item.name);
        setFavoriteGenresOptions(options);
        setGenresFullOptions(data);
      } else {
        setFavoriteGenresOptions(DEFAULT_FAVORITE_GENRES_OPTIONS);
        setGenresFullOptions([]);
      }
    } catch (error) {
      console.error('Erro ao carregar opções de gêneros:', error);
      setFavoriteGenresOptions(DEFAULT_FAVORITE_GENRES_OPTIONS);
      setGenresFullOptions([]);
    }
  };

  // Adicionar nova opção de interesse
  const handleAddInterest = async () => {
    const newInterest = newInterestInput.trim();
    
    if (!newInterest) {
      toast({
        title: 'Erro',
        description: 'Digite o nome do novo interesse.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se já existe
    if (interestsOptions.some(opt => opt.toLowerCase() === newInterest.toLowerCase())) {
      toast({
        title: 'Aviso',
        description: 'Esse interesse já existe na lista.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('reader_interest_options')
        .insert({
          name: newInterest,
          is_default: false,
          active: true,
          created_by: user?.id || null,
        });

      if (error) {
        // Se a tabela não existir, adicionar apenas localmente
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          setInterestsOptions(prev => [...prev, newInterest].sort());
          toast({
            title: 'Interesse adicionado',
            description: `"${newInterest}" foi adicionado à lista localmente.`,
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Interesse adicionado',
          description: `"${newInterest}" foi adicionado e está disponível para todos os leitores.`,
        });
        await loadInterestOptions();
      }
      
      setNewInterestInput('');
    } catch (error: any) {
      console.error('Erro ao adicionar interesse:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível adicionar o interesse.',
        variant: 'destructive',
      });
    }
  };

  // Adicionar nova opção de gênero literário
  const handleAddGenre = async () => {
    const newGenre = newGenreInput.trim();
    
    if (!newGenre) {
      toast({
        title: 'Erro',
        description: 'Digite o nome do novo gênero literário.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se já existe
    if (favoriteGenresOptions.some(opt => opt.toLowerCase() === newGenre.toLowerCase())) {
      toast({
        title: 'Aviso',
        description: 'Esse gênero literário já existe na lista.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('reader_genre_options')
        .insert({
          name: newGenre,
          is_default: false,
          active: true,
          created_by: user?.id || null,
        });

      if (error) {
        // Se a tabela não existir, adicionar apenas localmente
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          setFavoriteGenresOptions(prev => [...prev, newGenre].sort());
          toast({
            title: 'Gênero adicionado',
            description: `"${newGenre}" foi adicionado à lista localmente.`,
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Gênero adicionado',
          description: `"${newGenre}" foi adicionado e está disponível para todos os leitores.`,
        });
        await loadGenreOptions();
      }
      
      setNewGenreInput('');
    } catch (error: any) {
      console.error('Erro ao adicionar gênero:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível adicionar o gênero literário.',
        variant: 'destructive',
      });
    }
  };

  // Editar opção de interesse
  const handleEditInterest = async (option: CustomOption) => {
    const newName = editOptionInput.trim();
    
    if (!newName) {
      toast({
        title: 'Erro',
        description: 'Digite o novo nome do interesse.',
        variant: 'destructive',
      });
      return;
    }

    if (newName === option.name) {
      setEditingOption(null);
      setEditOptionInput('');
      return;
    }

    // Verificar se já existe outro com o mesmo nome
    if (interestsOptions.some(opt => opt.toLowerCase() === newName.toLowerCase() && opt !== option.name)) {
      toast({
        title: 'Aviso',
        description: 'Já existe um interesse com esse nome.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('reader_interest_options')
        .update({ name: newName })
        .eq('id', option.id);

      if (error) throw error;

      toast({
        title: 'Interesse atualizado',
        description: `"${option.name}" foi alterado para "${newName}".`,
      });
      
      await loadInterestOptions();
      setEditingOption(null);
      setEditOptionInput('');
    } catch (error: any) {
      console.error('Erro ao editar interesse:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível editar o interesse.',
        variant: 'destructive',
      });
    }
  };

  // Excluir opção de interesse
  const handleDeleteInterest = async (option: CustomOption) => {
    if (option.is_default) {
      toast({
        title: 'Não permitido',
        description: 'Não é possível excluir opções padrão do sistema.',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Deseja realmente excluir o interesse "${option.name}"?`)) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('reader_interest_options')
        .update({ active: false })
        .eq('id', option.id);

      if (error) throw error;

      toast({
        title: 'Interesse excluído',
        description: `"${option.name}" foi removido da lista.`,
      });
      
      await loadInterestOptions();
    } catch (error: any) {
      console.error('Erro ao excluir interesse:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível excluir o interesse.',
        variant: 'destructive',
      });
    }
  };

  // Editar opção de gênero literário
  const handleEditGenre = async (option: CustomOption) => {
    const newName = editOptionInput.trim();
    
    if (!newName) {
      toast({
        title: 'Erro',
        description: 'Digite o novo nome do gênero literário.',
        variant: 'destructive',
      });
      return;
    }

    if (newName === option.name) {
      setEditingOption(null);
      setEditOptionInput('');
      return;
    }

    // Verificar se já existe outro com o mesmo nome
    if (favoriteGenresOptions.some(opt => opt.toLowerCase() === newName.toLowerCase() && opt !== option.name)) {
      toast({
        title: 'Aviso',
        description: 'Já existe um gênero literário com esse nome.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('reader_genre_options')
        .update({ name: newName })
        .eq('id', option.id);

      if (error) throw error;

      toast({
        title: 'Gênero atualizado',
        description: `"${option.name}" foi alterado para "${newName}".`,
      });
      
      await loadGenreOptions();
      setEditingOption(null);
      setEditOptionInput('');
    } catch (error: any) {
      console.error('Erro ao editar gênero:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível editar o gênero literário.',
        variant: 'destructive',
      });
    }
  };

  // Excluir opção de gênero literário
  const handleDeleteGenre = async (option: CustomOption) => {
    if (option.is_default) {
      toast({
        title: 'Não permitido',
        description: 'Não é possível excluir opções padrão do sistema.',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Deseja realmente excluir o gênero literário "${option.name}"?`)) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('reader_genre_options')
        .update({ active: false })
        .eq('id', option.id);

      if (error) throw error;

      toast({
        title: 'Gênero excluído',
        description: `"${option.name}" foi removido da lista.`,
      });
      
      await loadGenreOptions();
    } catch (error: any) {
      console.error('Erro ao excluir gênero:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível excluir o gênero literário.',
        variant: 'destructive',
      });
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

  const resetNewReaderForm = () => {
    setNewReaderForm({
      name: '',
      email: '',
      birth_date: '',
      phone: '',
      address_street: '',
      address_neighborhood: '',
      address_city: '',
      ethnicity: '',
      gender: '',
      education_level: '',
      interests: [],
      favorite_genres: [],
      suggestions: '',
    });
    setLgpdConsent(false);
    setSelectedLibraryId('');
    // Resetar data de cadastro para hoje
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setRegistrationDate(`${year}-${month}-${day}`);
  };

  const handleSave = async () => {
    const name = newReaderForm.name.trim();
    const email = newReaderForm.email.trim();

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
      // Converter a data selecionada para formato ISO com horário fixo
      const createdAt = registrationDate ? `${registrationDate}T12:00:00` : new Date().toISOString();

      const insertData = {
        name,
        email,
        role: 'leitor',
        library_id: libraryIdToUse,
        lgpd_consent: true,
        active: true,
        created_at: createdAt,
        birth_date: newReaderForm.birth_date || null,
        phone: newReaderForm.phone.trim() || null,
        address_street: newReaderForm.address_street.trim() || null,
        address_neighborhood: newReaderForm.address_neighborhood.trim() || null,
        address_city: newReaderForm.address_city.trim() || null,
        ethnicity: newReaderForm.ethnicity || null,
        gender: newReaderForm.gender || null,
        education_level: newReaderForm.education_level || null,
        interests: newReaderForm.interests.length > 0 ? newReaderForm.interests.join(', ') : null,
        favorite_genres: newReaderForm.favorite_genres.length > 0 ? newReaderForm.favorite_genres.join(', ') : null,
        suggestions: newReaderForm.suggestions.trim() || null,
      };

      console.log('Dados a serem inseridos:', insertData);

      const { data, error } = await (supabase as any)
        .from('users_profile')
        .insert(insertData)
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
      resetNewReaderForm();

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

  // Função para converter string separada por vírgula em array
  const parseStringToArray = (value: string | null | undefined): string[] => {
    if (!value) return [];
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
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
      interests: parseStringToArray((reader as any).interests),
      favorite_genres: parseStringToArray((reader as any).favorite_genres),
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
          ethnicity: editForm.ethnicity || null,
          gender: editForm.gender || null,
          education_level: editForm.education_level || null,
          interests: editForm.interests.length > 0 ? editForm.interests.join(', ') : null,
          favorite_genres: editForm.favorite_genres.length > 0 ? editForm.favorite_genres.join(', ') : null,
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
        interests: [], favorite_genres: [], suggestions: ''
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
              resetNewReaderForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="gov">
              <Plus className="mr-2 h-4 w-4" />
              Novo Leitor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Leitor</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo usuário
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Dados Básicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-name">Nome Completo *</Label>
                  <Input 
                    id="new-name" 
                    value={newReaderForm.name}
                    onChange={(e) => setNewReaderForm({ ...newReaderForm, name: e.target.value })}
                    placeholder="Nome do leitor" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">E-mail *</Label>
                  <Input 
                    id="new-email" 
                    type="email"
                    value={newReaderForm.email}
                    onChange={(e) => setNewReaderForm({ ...newReaderForm, email: e.target.value })}
                    placeholder="email@exemplo.com" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-birth_date">Data de Nascimento</Label>
                  <Input 
                    id="new-birth_date" 
                    type="date" 
                    value={newReaderForm.birth_date}
                    onChange={(e) => setNewReaderForm({ ...newReaderForm, birth_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-phone">Telefone</Label>
                  <Input 
                    id="new-phone" 
                    value={newReaderForm.phone}
                    onChange={(e) => setNewReaderForm({ ...newReaderForm, phone: e.target.value })}
                    placeholder="(51) 99999-9999" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-registrationDate">Data de Cadastro</Label>
                  <Input 
                    id="new-registrationDate" 
                    type="date" 
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Biblioteca */}
              {user?.role === 'admin_rede' ? (
                <div className="space-y-2">
                  <Label>Biblioteca Vinculada *</Label>
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

              {/* Endereço */}
              <div className="border-t pt-4 mt-2">
                <h4 className="font-medium text-sm mb-3">Endereço</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="new-address_street">Rua e Número</Label>
                    <Input 
                      id="new-address_street" 
                      value={newReaderForm.address_street}
                      onChange={(e) => setNewReaderForm({ ...newReaderForm, address_street: e.target.value })}
                      placeholder="Rua, número" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-address_neighborhood">Bairro</Label>
                    <Input 
                      id="new-address_neighborhood" 
                      value={newReaderForm.address_neighborhood}
                      onChange={(e) => setNewReaderForm({ ...newReaderForm, address_neighborhood: e.target.value })}
                      placeholder="Bairro" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 mt-3">
                  <div className="space-y-2">
                    <Label htmlFor="new-address_city">Cidade/UF</Label>
                    <Input 
                      id="new-address_city" 
                      value={newReaderForm.address_city}
                      onChange={(e) => setNewReaderForm({ ...newReaderForm, address_city: e.target.value })}
                      placeholder="Cidade-RS" 
                    />
                  </div>
                </div>
              </div>

              {/* Dados Demográficos */}
              <div className="border-t pt-4 mt-2">
                <h4 className="font-medium text-sm mb-3">Dados Demográficos</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-ethnicity">Etnia/Raça</Label>
                    <Select 
                      value={newReaderForm.ethnicity} 
                      onValueChange={(value) => setNewReaderForm({ ...newReaderForm, ethnicity: value })}
                    >
                      <SelectTrigger id="new-ethnicity">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ETHNICITY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-gender">Gênero</Label>
                    <Select 
                      value={newReaderForm.gender} 
                      onValueChange={(value) => setNewReaderForm({ ...newReaderForm, gender: value })}
                    >
                      <SelectTrigger id="new-gender">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-education_level">Escolaridade</Label>
                    <Select 
                      value={newReaderForm.education_level} 
                      onValueChange={(value) => setNewReaderForm({ ...newReaderForm, education_level: value })}
                    >
                      <SelectTrigger id="new-education_level">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {EDUCATION_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Interesses */}
              <div className="border-t pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">Interesses na Biblioteca</h4>
                  {interestsFullOptions.length > 0 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsManageInterestsOpen(true)}
                      className="text-xs h-7"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Gerenciar
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {interestsOptions.map((interest) => (
                    <div key={interest} className="flex items-center space-x-2">
                      <Checkbox
                        id={`new-interest-${interest}`}
                        checked={newReaderForm.interests.includes(interest)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewReaderForm({ 
                              ...newReaderForm, 
                              interests: [...newReaderForm.interests, interest] 
                            });
                          } else {
                            setNewReaderForm({ 
                              ...newReaderForm, 
                              interests: newReaderForm.interests.filter(i => i !== interest) 
                            });
                          }
                        }}
                      />
                      <Label 
                        htmlFor={`new-interest-${interest}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {interest}
                      </Label>
                    </div>
                  ))}
                </div>
                {/* Adicionar novo interesse */}
                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Adicionar novo interesse..."
                    value={newInterestInput}
                    onChange={(e) => setNewInterestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInterest();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddInterest}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Gêneros Literários Favoritos */}
              <div className="border-t pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">Gêneros Literários Favoritos</h4>
                  {genresFullOptions.length > 0 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsManageGenresOpen(true)}
                      className="text-xs h-7"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Gerenciar
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {favoriteGenresOptions.map((genre) => (
                    <div key={genre} className="flex items-center space-x-2">
                      <Checkbox
                        id={`new-genre-${genre}`}
                        checked={newReaderForm.favorite_genres.includes(genre)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewReaderForm({ 
                              ...newReaderForm, 
                              favorite_genres: [...newReaderForm.favorite_genres, genre] 
                            });
                          } else {
                            setNewReaderForm({ 
                              ...newReaderForm, 
                              favorite_genres: newReaderForm.favorite_genres.filter(g => g !== genre) 
                            });
                          }
                        }}
                      />
                      <Label 
                        htmlFor={`new-genre-${genre}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {genre}
                      </Label>
                    </div>
                  ))}
                </div>
                {/* Adicionar novo gênero */}
                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Adicionar novo gênero literário..."
                    value={newGenreInput}
                    onChange={(e) => setNewGenreInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddGenre();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddGenre}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Sugestões */}
              <div className="border-t pt-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="new-suggestions">Sugestões/Observações</Label>
                  <Input 
                    id="new-suggestions" 
                    value={newReaderForm.suggestions}
                    onChange={(e) => setNewReaderForm({ ...newReaderForm, suggestions: e.target.value })}
                    placeholder="Sugestões de livros ou observações" 
                  />
                </div>
              </div>
              
              {/* LGPD Consent */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 mt-2">
                <h4 className="font-medium text-sm">Termo de Consentimento LGPD *</h4>
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
                  <Label htmlFor="edit-ethnicity">Etnia/Raça</Label>
                  <Select 
                    value={editForm.ethnicity} 
                    onValueChange={(value) => setEditForm({ ...editForm, ethnicity: value })}
                  >
                    <SelectTrigger id="edit-ethnicity">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ETHNICITY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-gender">Gênero</Label>
                  <Select 
                    value={editForm.gender} 
                    onValueChange={(value) => setEditForm({ ...editForm, gender: value })}
                  >
                    <SelectTrigger id="edit-gender">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-education_level">Escolaridade</Label>
                  <Select 
                    value={editForm.education_level} 
                    onValueChange={(value) => setEditForm({ ...editForm, education_level: value })}
                  >
                    <SelectTrigger id="edit-education_level">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EDUCATION_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Interesses */}
            <div className="border-t pt-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">Interesses na Biblioteca</h4>
                {interestsFullOptions.length > 0 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsManageInterestsOpen(true)}
                    className="text-xs h-7"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Gerenciar
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {interestsOptions.map((interest) => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-interest-${interest}`}
                      checked={editForm.interests.includes(interest)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditForm({ 
                            ...editForm, 
                            interests: [...editForm.interests, interest] 
                          });
                        } else {
                          setEditForm({ 
                            ...editForm, 
                            interests: editForm.interests.filter(i => i !== interest) 
                          });
                        }
                      }}
                    />
                    <Label 
                      htmlFor={`edit-interest-${interest}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {interest}
                    </Label>
                  </div>
                ))}
              </div>
              {/* Adicionar novo interesse */}
              <div className="flex gap-2 mt-3">
                <Input
                  placeholder="Adicionar novo interesse..."
                  value={newInterestInput}
                  onChange={(e) => setNewInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInterest();
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleAddInterest}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Gêneros Literários Favoritos */}
            <div className="border-t pt-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">Gêneros Literários Favoritos</h4>
                {genresFullOptions.length > 0 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsManageGenresOpen(true)}
                    className="text-xs h-7"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Gerenciar
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {favoriteGenresOptions.map((genre) => (
                  <div key={genre} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-genre-${genre}`}
                      checked={editForm.favorite_genres.includes(genre)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditForm({ 
                            ...editForm, 
                            favorite_genres: [...editForm.favorite_genres, genre] 
                          });
                        } else {
                          setEditForm({ 
                            ...editForm, 
                            favorite_genres: editForm.favorite_genres.filter(g => g !== genre) 
                          });
                        }
                      }}
                    />
                    <Label 
                      htmlFor={`edit-genre-${genre}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {genre}
                    </Label>
                  </div>
                ))}
              </div>
              {/* Adicionar novo gênero */}
              <div className="flex gap-2 mt-3">
                <Input
                  placeholder="Adicionar novo gênero literário..."
                  value={newGenreInput}
                  onChange={(e) => setNewGenreInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGenre();
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleAddGenre}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Sugestões */}
            <div className="border-t pt-4 mt-2">
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
                  const maxItems = (library as any)?.max_items || 3;
                  
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
                          <Badge variant={activeLoans >= maxItems ? 'warning' : 'outline'} className="text-xs">
                            {activeLoans}/{maxItems}
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
                      const maxItems = (library as any)?.max_items || 3;

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
                            <Badge variant={activeLoans >= maxItems ? 'warning' : activeLoans > 0 ? 'outline' : 'manutencao'}>
                              {activeLoans} / {maxItems}
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

      {/* Modal de Gerenciamento de Interesses */}
      <Dialog open={isManageInterestsOpen} onOpenChange={(open) => {
        setIsManageInterestsOpen(open);
        if (!open) {
          setEditingOption(null);
          setEditOptionInput('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Interesses</DialogTitle>
            <DialogDescription>
              Edite ou exclua opções de interesses na biblioteca
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto py-4">
            {interestsFullOptions.map((option) => (
              <div 
                key={option.id} 
                className={`flex items-center justify-between p-2 rounded-lg border ${
                  option.is_default ? 'bg-muted/50' : 'bg-background'
                }`}
              >
                {editingOption?.id === option.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editOptionInput}
                      onChange={(e) => setEditOptionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleEditInterest(option);
                        }
                        if (e.key === 'Escape') {
                          setEditingOption(null);
                          setEditOptionInput('');
                        }
                      }}
                      className="flex-1 h-8"
                      autoFocus
                    />
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleEditInterest(option)}
                      className="h-8 px-2"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setEditingOption(null);
                        setEditOptionInput('');
                      }}
                      className="h-8 px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{option.name}</span>
                      {option.is_default && (
                        <Badge variant="secondary" className="text-[10px] h-5">Padrão</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!option.is_default && (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setEditingOption(option);
                              setEditOptionInput(option.name);
                            }}
                            className="h-8 px-2"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDeleteInterest(option)}
                            className="h-8 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
            {interestsFullOptions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma opção cadastrada no banco de dados.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageInterestsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Gerenciamento de Gêneros Literários */}
      <Dialog open={isManageGenresOpen} onOpenChange={(open) => {
        setIsManageGenresOpen(open);
        if (!open) {
          setEditingOption(null);
          setEditOptionInput('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Gêneros Literários</DialogTitle>
            <DialogDescription>
              Edite ou exclua opções de gêneros literários favoritos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto py-4">
            {genresFullOptions.map((option) => (
              <div 
                key={option.id} 
                className={`flex items-center justify-between p-2 rounded-lg border ${
                  option.is_default ? 'bg-muted/50' : 'bg-background'
                }`}
              >
                {editingOption?.id === option.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editOptionInput}
                      onChange={(e) => setEditOptionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleEditGenre(option);
                        }
                        if (e.key === 'Escape') {
                          setEditingOption(null);
                          setEditOptionInput('');
                        }
                      }}
                      className="flex-1 h-8"
                      autoFocus
                    />
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleEditGenre(option)}
                      className="h-8 px-2"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setEditingOption(null);
                        setEditOptionInput('');
                      }}
                      className="h-8 px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{option.name}</span>
                      {option.is_default && (
                        <Badge variant="secondary" className="text-[10px] h-5">Padrão</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!option.is_default && (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setEditingOption(option);
                              setEditOptionInput(option.name);
                            }}
                            className="h-8 px-2"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDeleteGenre(option)}
                            className="h-8 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
            {genresFullOptions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma opção cadastrada no banco de dados.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageGenresOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
