import { useState, useEffect } from 'react';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeftRight,
  BookOpen,
  User,
  Check,
  ChevronsUpDown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Download,
  RotateCw,
  MessageCircle,
  Eye,
  Trash2,
  Pencil,
  X,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logLoan, logError } from '@/utils/audit';
import { useAuth } from '@/context/AuthContext';
import { cn, normalizeText } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';
import * as XLSX from 'xlsx';

type Loan = Tables<'loans'>;
type Copy = Tables<'copies'>;
type UserProfile = Tables<'users_profile'>;
type Book = Tables<'books'>;
type Library = Tables<'libraries'>;

type LoanWithRelations = Loan & {
  copy?: Copy & { book?: Book };
  user?: UserProfile;
  renovations_count?: number;
  last_notification_sent?: string | null;
};

export default function Circulation() {
  const { user } = useAuth();
  const [selectedReader, setSelectedReader] = useState<string | null>(null);
  const [selectedCopy, setSelectedCopy] = useState<string | null>(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [returnCode, setReturnCode] = useState('');
  const [readers, setReaders] = useState<UserProfile[]>([]);
  const [availableCopies, setAvailableCopies] = useState<Array<Copy & { book?: Book; library?: Library }>>([]);
  const [activeLoans, setActiveLoans] = useState<LoanWithRelations[]>([]);
  const [historyLoans, setHistoryLoans] = useState<LoanWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [historySearch, setHistorySearch] = useState('');
  
  // Estado para histórico de consultas locais
  const [localConsultations, setLocalConsultations] = useState<any[]>([]);
  const [consultationsLoading, setConsultationsLoading] = useState(false);
  
  // Estado para configuração da biblioteca atual (limite de empréstimos)
  const [libraryMaxItems, setLibraryMaxItems] = useState<number>(3);
  
  // Estado para Consulta Local
  const [consultationQuantity, setConsultationQuantity] = useState<number>(1);
  const [consultationReaderId, setConsultationReaderId] = useState<string | null>(null);
  const [consultationReaderOpen, setConsultationReaderOpen] = useState(false);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [consultationLibraryId, setConsultationLibraryId] = useState<string>('');
  const [consultationLibraries, setConsultationLibraries] = useState<Library[]>([]);

  useEffect(() => {
    loadReaders();
    loadAvailableCopies();
    loadActiveLoans();
    loadHistoryLoans('');
    loadConsultationLibraries();
    loadLocalConsultations();
  }, [user]);

  // Setar biblioteca padrão para consulta local
  useEffect(() => {
    if (user?.role === 'bibliotecario' && user.library_id) {
      setConsultationLibraryId(user.library_id);
    }
  }, [user]);

  const loadConsultationLibraries = async () => {
    try {
      const { data, error } = await supabase
        .from('libraries')
        .select('id, name')
        .eq('active', true)
        .order('name');
      
      if (!error && data) {
        setConsultationLibraries(data);
      }
    } catch (error) {
      console.error('Erro ao carregar bibliotecas:', error);
    }
  };
  
  // Carregar configuração de limite da biblioteca do usuário
  const loadLibraryConfig = async () => {
    if (!user?.library_id) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('libraries')
        .select('max_items')
        .eq('id', user.library_id)
        .single();
      
      if (!error && data && data.max_items) {
        setLibraryMaxItems(data.max_items);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração da biblioteca:', error);
    }
  };
  
  // Carregar config da biblioteca quando o usuário estiver disponível
  useEffect(() => {
    if (user?.library_id) {
      loadLibraryConfig();
    }
  }, [user?.library_id]);

  const loadLocalConsultations = async () => {
    try {
      setConsultationsLoading(true);
      
      let query = supabase
        .from('local_consultations')
        .select(`
          id,
          consultation_date,
          notes,
          library_id,
          user_id,
          created_by,
          created_at,
          libraries(name),
          users_profile:user_id(name, email),
          created_by_user:created_by(name, email)
        `)
        .order('consultation_date', { ascending: false })
        .limit(50);
      
      // Filtrar por biblioteca se for bibliotecário
      if (user?.role === 'bibliotecario' && user.library_id) {
        query = query.eq('library_id', user.library_id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao carregar consultas:', error);
        return;
      }
      
      setLocalConsultations(data || []);
    } catch (error) {
      console.error('Erro ao carregar consultas locais:', error);
    } finally {
      setConsultationsLoading(false);
    }
  };

  // Função para deletar consulta local
  const handleDeleteConsultation = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta consulta?')) return;
    
    try {
      const { error } = await supabase
        .from('local_consultations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Consulta excluída',
        description: 'O registro foi removido com sucesso.',
      });
      
      loadLocalConsultations();
    } catch (error: any) {
      console.error('Erro ao excluir consulta:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível excluir a consulta.',
        variant: 'destructive',
      });
    }
  };

  // Estado para edição de consulta
  const [editingConsultation, setEditingConsultation] = useState<any>(null);
  const [editConsultationNotes, setEditConsultationNotes] = useState('');

  // Função para iniciar edição
  const handleEditConsultation = (consultation: any) => {
    setEditingConsultation(consultation);
    setEditConsultationNotes(consultation.notes || '');
  };

  // Função para salvar edição
  const handleSaveConsultationEdit = async () => {
    if (!editingConsultation) return;
    
    try {
      const { error } = await supabase
        .from('local_consultations')
        .update({ notes: editConsultationNotes || null })
        .eq('id', editingConsultation.id);
      
      if (error) throw error;
      
      toast({
        title: 'Consulta atualizada',
        description: 'As observações foram salvas.',
      });
      
      setEditingConsultation(null);
      setEditConsultationNotes('');
      loadLocalConsultations();
    } catch (error: any) {
      console.error('Erro ao atualizar consulta:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível atualizar a consulta.',
        variant: 'destructive',
      });
    }
  };

  // Recarregar histórico quando a busca mudar (com debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadHistoryLoans(historySearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [historySearch, user]);

  const loadReaders = async () => {
    try {
      // Bibliotecários podem ver TODOS os leitores para fazer empréstimos entre bibliotecas
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('role', 'leitor')
        .order('name');

      if (error) {
        console.error('Erro ao carregar leitores:', error);
        throw error;
      }
      
      console.log('Leitores carregados:', data);
      setReaders(data || []);
    } catch (error) {
      console.error('Erro ao carregar leitores:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os leitores.',
        variant: 'destructive',
      });
    }
  };

  const loadAvailableCopies = async () => {
    try {
      let query = supabase
        .from('copies')
        .select('*')
        .eq('status', 'disponivel');

      // Filtrar OBRIGATORIAMENTE por library_id do usuário logado
      if (user?.role === 'bibliotecario' && user.library_id) {
        query = query.eq('library_id', user.library_id);
      }
      // Se for admin_rede, não adiciona filtro (pode ver todas)

      const { data, error } = await query.order('code');

      if (error) throw error;

      // Buscar dados relacionados
      const copiesWithRelations: Array<Copy & { book?: Book; library?: Library; tombo?: string }> = await Promise.all(
        (data || []).map(async (copy) => {
          const [bookResult, libraryResult] = await Promise.all([
            supabase.from('books').select('*').eq('id', copy.book_id).single(),
            supabase.from('libraries').select('*').eq('id', copy.library_id).single(),
          ]);

          const result: Copy & { book?: Book; library?: Library; tombo?: string } = {
            id: copy.id,
            book_id: copy.book_id,
            code: copy.code,
            library_id: copy.library_id,
            status: copy.status,
            tombo: copy.tombo,
            book: bookResult.data || undefined,
            library: libraryResult.data || undefined,
          };
          return result;
        })
      );

      setAvailableCopies(copiesWithRelations);
    } catch (error) {
      console.error('Erro ao carregar exemplares:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveLoans = async () => {
    try {
      // DEBUG: Log do usuário e library_id
      console.log('[Circulation] User:', user);
      console.log('[Circulation] library_id:', user?.library_id);
      console.log('[Circulation] role:', user?.role);
      
      // Query otimizada: seleciona apenas campos necessários com joins
      let query = (supabase as any)
        .from('loans')
        .select(`
          id,
          loan_date,
          due_date,
          status,
          copy_id,
          user_id,
          library_id,
          renovations_count,
          last_notification_sent,
          copies!inner(
            code,
            book_id,
            books!inner(
              title
            )
          ),
          users_profile!inner(
            name
          )
        `)
        .eq('status', 'aberto');

      // Filtrar empréstimos por library_id do usuário logado
      if (user?.role === 'bibliotecario' && user.library_id) {
        console.log('[Circulation] Aplicando filtro de library_id:', user.library_id);
        query = query.eq('library_id', user.library_id);
      } else {
        console.log('[Circulation] NÃO aplicando filtro - role:', user?.role, 'library_id:', user?.library_id);
      }
      // Se for admin_rede, não adiciona filtro (pode ver todas)

      const { data, error } = await query.order('due_date');

      if (error) {
        console.error('Erro na query otimizada, usando fallback:', error);
        // Fallback para query simples se a otimizada falhar
        throw error;
      }

      // DEBUG: Log dos dados retornados
      console.log('[Circulation] Empréstimos retornados (antes do filtro):', data?.length);
      if (data && data.length > 0) {
        const libraryIds = [...new Set(data.map((loan: any) => loan.library_id))];
        console.log('[Circulation] Library IDs encontrados nos empréstimos:', libraryIds);
      }

      // Se for bibliotecário, filtrar novamente no cliente para garantir (segurança extra)
      let filteredData = data || [];
      if (user?.role === 'bibliotecario' && user.library_id) {
        filteredData = (data || []).filter((loan: any) => loan.library_id === user.library_id);
        console.log('[Circulation] Empréstimos após filtro no cliente:', filteredData.length);
      }

      // Processar dados otimizados
      const loansWithRelations: LoanWithRelations[] = filteredData.map((loan: any) => {
        const copyData = loan.copies;
        const bookData = copyData?.books;
        const userData = loan.users_profile;

        return {
          id: loan.id,
          loan_date: loan.loan_date,
          due_date: loan.due_date,
          status: loan.status,
          copy_id: loan.copy_id,
          user_id: loan.user_id,
          library_id: loan.library_id || '',
          created_at: loan.created_at || new Date().toISOString(),
          return_date: loan.return_date || null,
          renovations_count: loan.renovations_count || 0,
          last_notification_sent: loan.last_notification_sent || null,
          copy: copyData ? {
            id: loan.copy_id,
            code: copyData.code,
            book_id: copyData.book_id,
            book: bookData ? {
              id: copyData.book_id,
              title: bookData.title,
            } : undefined,
          } : undefined,
          user: userData ? {
            id: loan.user_id,
            name: userData.name,
          } : undefined,
        } as LoanWithRelations;
      });

      setActiveLoans(loansWithRelations);
    } catch (error) {
      console.error('Erro ao carregar empréstimos:', error);
      // Em caso de erro, tentar carregar sem joins (fallback)
      try {
        let fallbackQuery = (supabase as any)
          .from('loans')
          .select('id, loan_date, due_date, status, copy_id, user_id, library_id, renovations_count, created_at, return_date, last_notification_sent')
          .eq('status', 'aberto');

        if (user?.role === 'bibliotecario' && user.library_id) {
          fallbackQuery = fallbackQuery.eq('library_id', user.library_id);
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery.order('due_date');
        
        if (!fallbackError && fallbackData) {
          // Buscar dados relacionados de forma otimizada (apenas o necessário)
          const loansWithRelations: LoanWithRelations[] = await Promise.all(
            (fallbackData || []).map(async (loan) => {
              const [copyResult, userResult] = await Promise.all([
                supabase.from('copies').select('code, book_id').eq('id', loan.copy_id).single(),
                supabase.from('users_profile').select('name').eq('id', loan.user_id).single(),
              ]);

              let copy: (Copy & { book?: Book }) | undefined = undefined;
              if (copyResult.data) {
                const bookResult = await supabase
                  .from('books')
                  .select('title')
                  .eq('id', copyResult.data.book_id)
                  .single();
                
                copy = {
                  id: loan.copy_id,
                  code: copyResult.data.code,
                  book_id: copyResult.data.book_id,
                  book: bookResult.data ? {
                    id: copyResult.data.book_id,
                    title: bookResult.data.title,
                  } : undefined,
                } as Copy & { book?: Book };
              }

              return {
                ...loan,
                last_notification_sent: loan.last_notification_sent || null,
                copy: copy,
                user: userResult.data ? {
                  id: loan.user_id,
                  name: userResult.data.name,
                } : undefined,
              } as LoanWithRelations;
            })
          );

          setActiveLoans(loansWithRelations);
        }
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
      }
    }
  };

  const loadHistoryLoans = async (searchTerm: string = '') => {
    try {
      // DEBUG: Log do usuário e library_id
      console.log('[Circulation - History] User:', user);
      console.log('[Circulation - History] library_id:', user?.library_id);
      console.log('[Circulation - History] role:', user?.role);
      
      // Query otimizada com joins para trazer os nomes dos staff
      let query = (supabase as any)
        .from('loans')
        .select(`
          id,
          loan_date,
          due_date,
          return_date,
          status,
          copy_id,
          user_id,
          library_id,
          renovations_count,
          created_at,
          created_by,
          returned_by,
          copies!inner(
            code,
            book_id,
            books!inner(
              title
            )
          ),
          users_profile!loans_user_id_fkey(
            name
          ),
          created_by_staff:users_profile!loans_created_by_fkey(
            name
          ),
          returned_by_staff:users_profile!loans_returned_by_fkey(
            name
          ),
          libraries!loans_library_id_fkey(
            name
          )
        `);
      
      // Filtrar empréstimos por library_id do usuário logado
      if (user?.role === 'bibliotecario' && user.library_id) {
        console.log('[Circulation - History] Aplicando filtro de library_id:', user.library_id);
        query = query.eq('library_id', user.library_id);
      } else {
        console.log('[Circulation - History] NÃO aplicando filtro - role:', user?.role, 'library_id:', user?.library_id);
      }

      // Aplicar filtro de busca se houver
      if (searchTerm.trim()) {
        // Buscar por nome do leitor ou título do livro
        // Como o Supabase não suporta busca direta em joins, vamos fazer uma busca mais ampla
        // e filtrar no cliente, ou usar uma abordagem diferente
        // Por enquanto, vamos buscar todos e filtrar depois, ou fazer queries separadas
        
        // Buscar IDs de leitores que correspondem à busca
        // Bibliotecários podem buscar leitores de qualquer biblioteca
        const { data: readersData } = await supabase
          .from('users_profile')
          .select('id')
          .ilike('name', `%${searchTerm}%`)
          .eq('role', 'leitor');

        // Buscar IDs de livros que correspondem à busca
        const { data: booksData } = await supabase
          .from('books')
          .select('id')
          .ilike('title', `%${searchTerm}%`);

        const readerIds = readersData?.map(r => r.id) || [];
        const bookIds = booksData?.map(b => b.id) || [];

        // Buscar IDs de cópias que correspondem aos livros
        let copyIds: string[] = [];
        if (bookIds.length > 0) {
          let copiesQuery = supabase
            .from('copies')
            .select('id')
            .in('book_id', bookIds);

          // Se for bibliotecário, filtrar apenas cópias da sua biblioteca
          if (user?.role === 'bibliotecario' && user.library_id) {
            copiesQuery = copiesQuery.eq('library_id', user.library_id);
          }

          const { data: copiesData } = await copiesQuery;
          copyIds = copiesData?.map(c => c.id) || [];
        }

        // Aplicar filtros: se encontrar leitores ou cópias, filtrar por eles
        if (readerIds.length > 0 || copyIds.length > 0) {
          // Se temos ambos, fazer duas queries e combinar
          if (readerIds.length > 0 && copyIds.length > 0) {
            let userQuery = (supabase as any)
              .from('loans')
              .select(`
                id,
                loan_date,
                due_date,
                return_date,
                status,
                copy_id,
                user_id,
                library_id,
                renovations_count,
                created_at,
                created_by,
                returned_by,
                copies!inner(
                  code,
                  book_id,
                  books!inner(
                    title
                  )
                ),
                users_profile!loans_user_id_fkey(
                  name
                )
              `)
              .in('user_id', readerIds);
            
            if (user?.role === 'bibliotecario' && user.library_id) {
              userQuery = userQuery.eq('library_id', user.library_id);
            }

            let copyQuery = (supabase as any)
              .from('loans')
              .select(`
                id,
                loan_date,
                due_date,
                return_date,
                status,
                copy_id,
                user_id,
                library_id,
                renovations_count,
                created_at,
                created_by,
                returned_by,
                copies!inner(
                  code,
                  book_id,
                  books!inner(
                    title
                  )
                ),
                users_profile!loans_user_id_fkey(
                  name
                )
              `)
              .in('copy_id', copyIds);
            
            if (user?.role === 'bibliotecario' && user.library_id) {
              copyQuery = copyQuery.eq('library_id', user.library_id);
            }

            const [userResults, copyResults] = await Promise.all([
              userQuery.order('created_at', { ascending: false }),
              copyQuery.order('created_at', { ascending: false })
            ]);
            
            // Combinar e remover duplicatas
            const combinedData = [
              ...(userResults.data || []),
              ...(copyResults.data || [])
            ];
            const uniqueData = combinedData.filter((loan: any, index: number, self: any[]) =>
              index === self.findIndex((l: any) => l.id === loan.id)
            );
            
            // Processar os dados combinados (mesmo processamento do código principal)
            const loansWithRelations: LoanWithRelations[] = uniqueData.map((loan: any) => {
              const copyData = loan.copies;
              const bookData = copyData?.books;
              const userData = loan.users_profile;
              const libraryData = loan.libraries;
              
              return {
                id: loan.id,
                loan_date: loan.loan_date,
                due_date: loan.due_date,
                return_date: loan.return_date,
                status: loan.status,
                copy_id: loan.copy_id,
                user_id: loan.user_id,
                library_id: loan.library_id || '',
                created_at: loan.created_at || new Date().toISOString(),
                renovations_count: loan.renovations_count || 0,
                copy: copyData ? {
                  id: loan.copy_id,
                  code: copyData.code,
                  book_id: copyData.book_id,
                  book: bookData ? {
                    id: copyData.book_id,
                    title: bookData.title,
                  } : undefined,
                } : undefined,
                user: userData ? {
                  id: loan.user_id,
                  name: userData.name,
                } : undefined,
                library: libraryData ? {
                  name: libraryData.name,
                } : undefined,
              } as LoanWithRelations & { library?: { name: string } };
            });
            
            setHistoryLoans(loansWithRelations);
            return;
          } else if (readerIds.length > 0) {
            query = query.in('user_id', readerIds);
          } else if (copyIds.length > 0) {
            query = query.in('copy_id', copyIds);
          }
        } else {
          // Se não encontrou nada, retornar array vazio
          setHistoryLoans([]);
          return;
        }
      }

      // Se não houver busca, limitar a 20 registros
      if (!searchTerm.trim()) {
        query = query.limit(20);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      // DEBUG: Log dos dados retornados
      console.log('[Circulation - History] Empréstimos retornados (antes do filtro):', data?.length);
      if (data && data.length > 0) {
        const libraryIds = [...new Set(data.map((loan: any) => loan.library_id))];
        console.log('[Circulation - History] Library IDs encontrados nos empréstimos:', libraryIds);
      }

      // Se for bibliotecário, filtrar novamente no cliente para garantir (segurança extra)
      let filteredData = data || [];
      if (user?.role === 'bibliotecario' && user.library_id) {
        filteredData = (data || []).filter((loan: any) => loan.library_id === user.library_id);
        console.log('[Circulation - History] Empréstimos após filtro no cliente:', filteredData.length);
      }

      if (error) {
        console.error('Erro na query otimizada, usando fallback:', error);
        // Fallback: buscar sem joins se a query otimizada falhar
        let fallbackQuery = supabase
          .from('loans')
          .select('*');

        if (user?.role === 'bibliotecario' && user.library_id) {
          fallbackQuery = fallbackQuery.eq('library_id', user.library_id);
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery
          .order('created_at', { ascending: false })
          .limit(20);

        if (fallbackError) throw fallbackError;

        // Buscar dados relacionados manualmente
        const loansWithRelations: LoanWithRelations[] = await Promise.all(
          (fallbackData || []).map(async (loan: any) => {
            const [copyResult, userResult, createdByResult, returnedByResult, libraryResult] = await Promise.all([
              supabase.from('copies').select('*').eq('id', loan.copy_id).single(),
              supabase.from('users_profile').select('name').eq('id', loan.user_id).single(),
              loan.created_by ? supabase.from('users_profile').select('name').eq('id', loan.created_by).single() : Promise.resolve({ data: null }),
              loan.returned_by ? supabase.from('users_profile').select('name').eq('id', loan.returned_by).single() : Promise.resolve({ data: null }),
              loan.library_id ? supabase.from('libraries').select('name').eq('id', loan.library_id).single() : Promise.resolve({ data: null }),
            ]);

          let copy: (Copy & { book?: Book }) | undefined = undefined;
          if (copyResult.data) {
            const bookResult = await supabase
              .from('books')
              .select('*')
              .eq('id', copyResult.data.book_id)
              .single();
            
            copy = {
              id: copyResult.data.id,
              book_id: copyResult.data.book_id,
              code: copyResult.data.code,
              library_id: copyResult.data.library_id,
              status: copyResult.data.status,
              book: bookResult.data || undefined,
            };
          }

            return {
              ...loan,
              copy: copy,
              user: userResult.data ? {
                id: loan.user_id,
                name: userResult.data.name,
              } : undefined,
              createdBy: createdByResult.data ? {
                id: loan.created_by,
                name: createdByResult.data.name,
              } : undefined,
              returnedBy: returnedByResult.data ? {
                id: loan.returned_by,
                name: returnedByResult.data.name,
              } : undefined,
              library: libraryResult.data ? {
                name: libraryResult.data.name,
              } : undefined,
            } as LoanWithRelations & { createdBy?: UserProfile; returnedBy?: UserProfile; library?: { name: string } };
          })
        );

        setHistoryLoans(loansWithRelations);
        return;
      }

      // Processar dados da query otimizada com joins (usar filteredData se existir)
      const loansWithRelations: LoanWithRelations[] = (filteredData || []).map((loan: any) => {
        const copyData = loan.copies;
        const bookData = copyData?.books;
        const userData = loan.users_profile;
        const createdByData = loan.created_by_staff;
        const returnedByData = loan.returned_by_staff;
        const libraryData = loan.libraries;

        return {
          ...loan,
          copy: copyData ? {
            id: loan.copy_id,
            code: copyData.code,
            book_id: copyData.book_id,
            book: bookData ? {
              id: copyData.book_id,
              title: bookData.title,
            } : undefined,
          } : undefined,
          user: userData ? {
            id: loan.user_id,
            name: userData.name,
          } : undefined,
          createdBy: createdByData ? {
            id: loan.created_by,
            name: createdByData.name,
          } : undefined,
          returnedBy: returnedByData ? {
            id: loan.returned_by,
            name: returnedByData.name,
          } : undefined,
          library: libraryData ? {
            name: libraryData.name,
          } : undefined,
        } as LoanWithRelations & { createdBy?: UserProfile; returnedBy?: UserProfile; library?: { name: string } };
      });

      setHistoryLoans(loansWithRelations);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const selectedReaderData = readers.find((r) => r.id === selectedReader);
  const selectedCopyData = availableCopies.find((c) => c.id === selectedCopy);

  const checkEligibility = () => {
    if (!selectedReaderData) return { eligible: false, reasons: ['Selecione um leitor'] };
    
    const reasons: string[] = [];
    
    if (!selectedReaderData.active) {
      reasons.push('Leitor está inativo');
    }
    
    if (selectedReaderData.blocked_until && new Date(selectedReaderData.blocked_until) > new Date()) {
      reasons.push('Leitor está bloqueado');
    }
    
    const userLoans = activeLoans.filter((l) => l.user_id === selectedReaderData.id);
    if (userLoans.length >= libraryMaxItems) {
      reasons.push(`Limite de ${libraryMaxItems} empréstimos atingido`);
    }
    
    return {
      eligible: reasons.length === 0,
      reasons,
    };
  };

  const eligibility = checkEligibility();

  // Função para obter o ID do usuário autenticado
  const getCurrentUserId = async (): Promise<string | null> => {
    try {
      // Primeiro, tenta obter da sessão do Supabase Auth
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!sessionError && session?.user?.email) {
        // Se houver sessão, busca o usuário correspondente na tabela users_profile
        const { data: userProfile, error: profileError } = await supabase
          .from('users_profile')
          .select('id')
          .eq('email', session.user.email)
          .in('role', ['admin_rede', 'bibliotecario'])
          .single();
        
        if (!profileError && userProfile?.id) {
          return userProfile.id;
        }
      }

      // Se não houver sessão do Supabase Auth, tenta usar getUser() como fallback
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!userError && user?.email) {
        const { data: userProfile, error: profileError } = await supabase
          .from('users_profile')
          .select('id')
          .eq('email', user.email)
          .in('role', ['admin_rede', 'bibliotecario'])
          .single();
        
        if (!profileError && userProfile?.id) {
          return userProfile.id;
        }
      }

      // Se não houver autenticação configurada, busca um usuário admin/bibliotecário ativo
      // NOTA: Esta é uma solução temporária. Configure a autenticação adequadamente.
      const { data: defaultUsers, error: defaultError } = await supabase
        .from('users_profile')
        .select('id')
        .in('role', ['admin_rede', 'bibliotecario'])
        .eq('active', true)
        .limit(1);

      if (!defaultError && defaultUsers && defaultUsers.length > 0) {
        console.warn('Usando usuário padrão para auditoria. Configure a autenticação para usar o usuário correto.');
        return defaultUsers[0].id;
      }

      console.error('Nenhum usuário encontrado para auditoria');
      return null;
    } catch (error) {
      console.error('Erro ao obter usuário autenticado:', error);
      return null;
    }
  };

  const handleLoan = async () => {
    if (!eligibility.eligible || !selectedCopyData || !selectedReaderData) {
      toast({
        title: 'Erro ao realizar empréstimo',
        description: eligibility.reasons[0] || 'Selecione um exemplar',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se o exemplar já está emprestado
    if (selectedCopyData.status !== 'disponivel') {
      toast({
        title: 'Erro',
        description: 'Este exemplar já está emprestado.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Verificar se o leitor ainda existe na lista carregada
      const readerInList = readers.find(r => r.id === selectedReaderData.id);
      if (!readerInList) {
        throw new Error('Leitor selecionado não está mais disponível. Por favor, recarregue a página e selecione novamente.');
      }

      // Validar que os IDs existem no banco antes de inserir
      const [userCheck, copyCheck] = await Promise.all([
        supabase.from('users_profile').select('id, name, email').eq('id', readerInList.id).single(),
        supabase.from('copies').select('id').eq('id', selectedCopyData.id).single(),
      ]);

      if (userCheck.error || !userCheck.data) {
        console.error('Leitor não encontrado:', {
          id_procurado: readerInList.id,
          nome: readerInList.name,
          email: readerInList.email,
          erro: userCheck.error,
        });
        throw new Error(`Leitor não encontrado no banco de dados. Por favor, verifique se o leitor "${readerInList.name}" existe na página de Leitores.`);
      }

      console.log('Leitor encontrado no banco:', userCheck.data);
      console.log('ID do leitor validado:', userCheck.data.id);
      console.log('Tipo do ID:', typeof userCheck.data.id);

      if (copyCheck.error || !copyCheck.data) {
        throw new Error(`Exemplar não encontrado no banco de dados. ID: ${selectedCopyData.id}`);
      }

      // Usar o ID do leitor validado (garantir que é string)
      const userIdToUse = String(userCheck.data.id).trim();
      
      // Verificar novamente que o ID não está vazio
      if (!userIdToUse || userIdToUse === 'undefined' || userIdToUse === 'null') {
        throw new Error('ID do leitor inválido. Por favor, selecione o leitor novamente.');
      }

      console.log('ID final que será usado:', userIdToUse);

      // Obter o ID do usuário autenticado (bibliotecário/admin que está fazendo o empréstimo)
      if (!user?.id) {
        throw new Error('Não foi possível identificar o usuário autenticado. Por favor, faça login novamente.');
      }
      const currentUserId = user.id;

      // Garantir que o library_id seja o do usuário logado (não o do exemplar)
      let libraryIdToUse: string;
      if (user?.role === 'bibliotecario' && user.library_id) {
        libraryIdToUse = user.library_id;
      } else {
        // Se for admin_rede, pode usar o library_id do exemplar
        libraryIdToUse = selectedCopyData.library_id;
      }

      // Buscar loan_days da biblioteca do usuário (usar 14 como fallback se não houver valor)
      const { data: userLibraryData, error: userLibraryError } = await supabase
        .from('libraries')
        .select('loan_days')
        .eq('id', libraryIdToUse)
        .single();
      
      // Usar loan_days da biblioteca ou 14 como padrão
      const loanDays = (userLibraryData && !userLibraryError && (userLibraryData as any).loan_days) 
        ? Number((userLibraryData as any).loan_days) 
        : 14;
      
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + loanDays);

      console.log('Dados do empréstimo:', {
        user_id: userIdToUse,
        user_name: readerInList.name,
        user_email: readerInList.email,
        copy_id: selectedCopyData.id,
        library_id: libraryIdToUse,
        loan_days: loanDays,
        loan_date: today.toISOString(),
        due_date: dueDate.toISOString(),
        status: 'aberto',
        created_by: currentUserId,
      });

      // PARTE A: INSERT na tabela loans
      const loanInsertData = {
        user_id: userIdToUse,
        copy_id: selectedCopyData.id,
        library_id: libraryIdToUse,
        loan_date: today.toISOString(),
        due_date: dueDate.toISOString(),
        status: 'aberto',
        created_by: currentUserId,
      };

      console.log('Tentando inserir empréstimo com dados:', loanInsertData);

      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .insert(loanInsertData)
        .select();

      if (loanError) {
        console.error('Erro ao inserir empréstimo:', loanError);
        console.error('Detalhes completos do erro:', {
          message: loanError.message,
          details: loanError.details,
          hint: loanError.hint,
          code: loanError.code,
        });
        console.error('Dados que tentaram ser inseridos:', loanInsertData);
        throw loanError;
      }

      console.log('Empréstimo criado:', loanData);

      // PARTE A: UPDATE na tabela copies
      const { error: copyError } = await supabase
        .from('copies')
        .update({ status: 'emprestado' })
        .eq('id', selectedCopyData.id);

      if (copyError) throw copyError;

      // Log de auditoria
      if (loanData && loanData[0]) {
        await logLoan(
          'LOAN_CREATE',
          loanData[0].id,
          selectedCopyData.book?.title || 'Livro desconhecido',
          selectedReaderData.name,
          {
            copy_id: selectedCopyData.id,
            copy_code: selectedCopyData.code,
            loan_date: today.toISOString(),
            due_date: dueDate.toISOString(),
            loan_days: loanDays, // Usar loanDays (variável) como valor
            library_id: libraryIdToUse,
          },
          currentUserId,
          libraryIdToUse
        );
      }

      toast({
        title: 'Empréstimo realizado!',
        description: `"${selectedCopyData.book?.title}" emprestado para ${selectedReaderData.name}`,
      });

      setSelectedReader(null);
      setSelectedCopy(null);

      // Recarregar dados
      await loadAvailableCopies();
      await loadActiveLoans();
      await loadHistoryLoans(historySearch);
    } catch (error: any) {
      console.error('Erro ao realizar empréstimo:', error);
      console.error('Detalhes do erro:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      });

      let errorMessage = 'Não foi possível realizar o empréstimo.';
      
      if (error?.message?.includes('foreign key constraint')) {
        if (error?.message?.includes('user_id')) {
          errorMessage = 'O leitor selecionado não existe no banco de dados. Por favor, selecione outro leitor.';
        } else if (error?.message?.includes('copy_id')) {
          errorMessage = 'O exemplar selecionado não existe no banco de dados.';
        } else if (error?.message?.includes('library_id')) {
          errorMessage = 'A biblioteca não existe no banco de dados.';
        } else {
          errorMessage = 'Erro de integridade: um dos dados referenciados não existe.';
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleRenew = async (loan: LoanWithRelations) => {
    console.log('[handleRenew] Iniciando renovação...', { loanId: loan.id, loan });
    
    try {
      // Verificar se o loan tem os dados necessários
      if (!loan.id) {
        console.error('[handleRenew] Erro: loan.id não encontrado', loan);
        toast({
          title: 'Erro',
          description: 'Dados do empréstimo incompletos. Por favor, recarregue a página.',
          variant: 'destructive',
        });
        return;
      }

      // Verificar limite de renovações
      const currentRenovations = (loan.renovations_count || 0);
      console.log('[handleRenew] Renovações atuais:', currentRenovations);
      
      if (currentRenovations >= 2) {
        toast({
          title: 'Limite de renovações atingido',
          description: 'Este empréstimo já foi renovado 2 vezes. Não é possível renovar novamente.',
          variant: 'destructive',
        });
        return;
      }

      // Verificar se due_date existe
      if (!loan.due_date) {
        console.error('[handleRenew] Erro: loan.due_date não encontrado', loan);
        toast({
          title: 'Erro',
          description: 'Data de devolução não encontrada. Por favor, recarregue a página.',
          variant: 'destructive',
        });
        return;
      }

      // Buscar configuração da biblioteca (loan_days)
      let loanDays = 14; // Padrão
      if (loan.library_id) {
        const { data: libraryData, error: libraryError } = await (supabase as any)
          .from('libraries')
          .select('loan_days')
          .eq('id', loan.library_id)
          .single();

        if (!libraryError && libraryData?.loan_days) {
          loanDays = libraryData.loan_days;
        }
      }

      console.log('[handleRenew] Loan days:', loanDays);

      // Calcular nova data de devolução
      const currentDueDate = new Date(loan.due_date);
      const newDueDate = new Date(currentDueDate);
      newDueDate.setDate(newDueDate.getDate() + loanDays);

      console.log('[handleRenew] Nova data de devolução:', newDueDate.toISOString());

      // Atualizar no Supabase
      const { error: updateError } = await (supabase as any)
        .from('loans')
        .update({
          due_date: newDueDate.toISOString(),
          renovations_count: currentRenovations + 1,
        })
        .eq('id', loan.id);

      if (updateError) {
        console.error('[handleRenew] Erro no update:', updateError);
        throw updateError;
      }

      console.log('[handleRenew] Update bem-sucedido. Recarregando listas...');

      // Log de auditoria
      await logLoan(
        'LOAN_RENEW',
        loan.id,
        loan.copy?.book?.title || 'Livro desconhecido',
        loan.user?.name || 'Leitor desconhecido',
        {
          copy_id: loan.copy_id,
          copy_code: loan.copy?.code,
          old_due_date: loan.due_date,
          new_due_date: newDueDate.toISOString(),
          renovations_count: currentRenovations + 1,
          loan_days: loanDays, // Usar loanDays (variável) como valor
        },
        user?.id,
        loan.library_id
      );

      // Recarregar listas IMEDIATAMENTE após sucesso (antes do toast) usando Promise.all
      await Promise.all([
        loadActiveLoans(),
        loadHistoryLoans(historySearch),
        loadAvailableCopies()
      ]);

      console.log('[handleRenew] Listas recarregadas com sucesso');

      toast({
        title: 'Empréstimo renovado!',
        description: `Nova data de devolução: ${newDueDate.toLocaleDateString('pt-BR')} (+${loanDays} dias)`,
      });
    } catch (error: any) {
      console.error('[handleRenew] Erro ao renovar empréstimo:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível renovar o empréstimo.',
        variant: 'destructive',
      });
    }
  };

  // Função para devolver a partir de um loan específico (usada na tabela de histórico)
  const handleReturnFromLoan = async (loan: LoanWithRelations) => {
    console.log('[handleReturnFromLoan] Iniciando devolução...', { loanId: loan.id, loan });
    
    // Verificar se o loan tem os dados necessários
    if (!loan.id) {
      console.error('[handleReturnFromLoan] Erro: loan.id não encontrado', loan);
      toast({
        title: 'Erro',
        description: 'Dados do empréstimo incompletos. Por favor, recarregue a página.',
        variant: 'destructive',
      });
      return;
    }

    if (!loan.copy_id) {
      console.error('[handleReturnFromLoan] Erro: loan.copy_id não encontrado', loan);
      toast({
        title: 'Erro',
        description: 'Não foi possível identificar o exemplar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (!user?.id) {
        throw new Error('Não foi possível identificar o usuário autenticado. Por favor, faça login novamente.');
      }
      const currentUserId = user.id;

      console.log('[handleReturnFromLoan] Usuário autenticado:', currentUserId);

      const today = new Date().toISOString();
      const isOverdue = loan.due_date ? new Date(loan.due_date) < new Date() : false;

      console.log('[handleReturnFromLoan] Atualizando empréstimo...', {
        loanId: loan.id,
        status: 'devolvido',
        return_date: today,
        returned_by: currentUserId
      });

      // UPDATE na tabela loans
      const { error: updateLoanError } = await supabase
        .from('loans')
        .update({
          status: 'devolvido',
          return_date: today,
          returned_by: currentUserId,
        })
        .eq('id', loan.id);

      if (updateLoanError) {
        console.error('[handleReturnFromLoan] Erro no update do loan:', updateLoanError);
        throw updateLoanError;
      }

      console.log('[handleReturnFromLoan] Loan atualizado. Atualizando cópia...', {
        copyId: loan.copy_id
      });

      // UPDATE na tabela copies
      const { error: updateCopyError } = await supabase
        .from('copies')
        .update({ status: 'disponivel' })
        .eq('id', loan.copy_id);

      if (updateCopyError) {
        console.error('[handleReturnFromLoan] Erro no update da cópia:', updateCopyError);
        throw updateCopyError;
      }

      const daysOverdue = isOverdue && loan.due_date
        ? Math.ceil((new Date().getTime() - new Date(loan.due_date).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Log de auditoria
      await logLoan(
        'LOAN_RETURN',
        loan.id,
        loan.copy?.book?.title || 'Livro desconhecido',
        loan.user?.name || 'Leitor desconhecido',
        {
          copy_id: loan.copy_id,
          copy_code: loan.copy?.code,
          loan_date: loan.loan_date,
          due_date: loan.due_date,
          return_date: today,
          days_overdue: daysOverdue,
          was_overdue: isOverdue,
          renovations_count: loan.renovations_count || 0,
        },
        currentUserId,
        loan.library_id
      );

      console.log('[handleReturnFromLoan] Updates bem-sucedidos. Recarregando listas...');

      // Recarregar dados IMEDIATAMENTE após sucesso (antes do toast) usando Promise.all
      await Promise.all([
        loadAvailableCopies(),
        loadActiveLoans(),
        loadHistoryLoans(historySearch)
      ]);

      console.log('[handleReturnFromLoan] Listas recarregadas com sucesso');

      toast({
        title: 'Devolução registrada!',
        description: isOverdue
          ? `Exemplar devolvido com ${daysOverdue} dias de atraso`
          : 'Exemplar devolvido dentro do prazo',
        variant: isOverdue ? 'destructive' : 'default',
      });
    } catch (error: any) {
      console.error('[handleReturnFromLoan] Erro ao registrar devolução:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível registrar a devolução.',
        variant: 'destructive',
      });
    }
  };

  const handleNotify = async (loan: LoanWithRelations) => {
    try {
      // Verificar se já foi notificado hoje
      if (loan.last_notification_sent) {
        const lastNotificationDate = new Date(loan.last_notification_sent);
        const today = new Date();
        
        // Comparar apenas a data (sem hora)
        const isSameDay = 
          lastNotificationDate.getDate() === today.getDate() &&
          lastNotificationDate.getMonth() === today.getMonth() &&
          lastNotificationDate.getFullYear() === today.getFullYear();
        
        if (isSameDay) {
          const formattedDate = lastNotificationDate.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          
          toast({
            title: 'Já notificado hoje',
            description: `Último aviso enviado em ${formattedDate}`,
            variant: 'default',
          });
          return;
        }
      }

      // Buscar nome da biblioteca
      let libraryName = 'Biblioteca';
      if (loan.library_id) {
        const { data: libraryData } = await supabase
          .from('libraries')
          .select('name')
          .eq('id', loan.library_id)
          .single();
        
        if (libraryData?.name) {
          libraryName = libraryData.name;
        }
      }

      // Atualizar last_notification_sent no banco
      const { error: updateError } = await (supabase as any)
        .from('loans')
        .update({ last_notification_sent: new Date().toISOString() })
        .eq('id', loan.id);

      if (updateError) {
        throw updateError;
      }

      // Preparar mensagem do WhatsApp
      const readerName = loan.user?.name || 'Leitor';
      const bookTitle = loan.copy?.book?.title || 'Livro';
      const dueDate = loan.due_date 
        ? new Date(loan.due_date).toLocaleDateString('pt-BR')
        : 'Data não informada';
      
      const message = `Olá ${readerName}, aqui é da ${libraryName}. O livro "${bookTitle}" vence em ${dueDate}.`;
      const encodedMessage = encodeURIComponent(message);
      
      // Abrir WhatsApp (sem número específico - usuário terá que adicionar manualmente)
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');

      // Recarregar lista para atualizar o status
      await loadActiveLoans();

      toast({
        title: 'Notificação enviada',
        description: `WhatsApp aberto para ${readerName}`,
      });
    } catch (error: any) {
      console.error('Erro ao enviar notificação:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível enviar a notificação.',
        variant: 'destructive',
      });
    }
  };

  // Função para registrar Consulta Local
  const handleLocalConsultation = async () => {
    if (!consultationQuantity || consultationQuantity < 1) {
      toast({
        title: 'Erro',
        description: 'Informe a quantidade de livros consultados.',
        variant: 'destructive',
      });
      return;
    }

    // Determinar library_id a usar
    const libraryIdToUse = user?.role === 'bibliotecario' && user.library_id 
      ? user.library_id 
      : consultationLibraryId;

    if (!libraryIdToUse) {
      toast({
        title: 'Erro',
        description: 'Selecione uma biblioteca para registrar a consulta.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Criar registros para cada consulta
      const consultations = [];
      for (let i = 0; i < consultationQuantity; i++) {
        consultations.push({
          library_id: libraryIdToUse,
          user_id: consultationReaderId || null,
          notes: consultationNotes || null,
          created_by: user?.id,
        });
      }

      const { error } = await supabase
        .from('local_consultations')
        .insert(consultations);

      if (error) throw error;

      const readerName = consultationReaderId 
        ? readers.find(r => r.id === consultationReaderId)?.name 
        : null;

      toast({
        title: 'Consultas registradas!',
        description: `${consultationQuantity} livro(s) consultado(s) localmente${readerName ? ` por ${readerName}` : ''}.`,
      });

      // Limpar campos
      setConsultationQuantity(1);
      setConsultationReaderId(null);
      setConsultationNotes('');
      
      // Recarregar lista de consultas
      loadLocalConsultations();

    } catch (error: any) {
      console.error('Erro ao registrar consulta local:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível registrar a consulta.',
        variant: 'destructive',
      });
    }
  };

  const handleReturn = async () => {
    if (!returnCode) {
      toast({
        title: 'Erro',
        description: 'Digite o código do exemplar',
        variant: 'destructive',
      });
      return;
    }

    // Buscar o exemplar pelo código
    const { data: copyData, error: copyError } = await supabase
      .from('copies')
      .select('*')
      .eq('code', returnCode.trim())
      .single();

    if (copyError || !copyData) {
      toast({
        title: 'Exemplar não encontrado',
        description: 'Verifique o código informado',
        variant: 'destructive',
      });
      return;
    }

    // Buscar o empréstimo ativo para este exemplar
    const { data: loanData, error: loanError } = await supabase
      .from('loans')
      .select('*')
      .eq('copy_id', copyData.id)
      .eq('status', 'aberto')
      .single();

    if (loanError || !loanData) {
      toast({
        title: 'Empréstimo não encontrado',
        description: 'Este exemplar não possui empréstimo ativo',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Obter o ID do usuário autenticado (bibliotecário/admin que está fazendo a devolução)
      if (!user?.id) {
        throw new Error('Não foi possível identificar o usuário autenticado. Por favor, faça login novamente.');
      }
      const currentUserId = user.id;

      // CAPTURAR DADOS ANTES DE LIMPAR O ESTADO: Buscar livro e leitor
      const [bookResult, readerResult] = await Promise.all([
        supabase.from('books').select('title').eq('id', copyData.book_id).single(),
        supabase.from('users_profile').select('name').eq('id', loanData.user_id).single(),
      ]);

      const bookTitle = bookResult.data?.title || 'Livro não encontrado';
      const readerName = readerResult.data?.name || 'Leitor não encontrado';

      const today = new Date().toISOString();
      const isOverdue = new Date(loanData.due_date) < new Date();

      // UPDATE na tabela loans
      const { error: updateLoanError } = await supabase
        .from('loans')
        .update({
          status: 'devolvido',
          return_date: today,
          returned_by: currentUserId,
        })
        .eq('id', loanData.id);

      if (updateLoanError) throw updateLoanError;

      // UPDATE na tabela copies
      const { error: updateCopyError } = await supabase
        .from('copies')
        .update({ status: 'disponivel' })
        .eq('id', copyData.id);

      if (updateCopyError) throw updateCopyError;

      // Limpar o código ANTES de recarregar
      const codeToClear = returnCode;
      setReturnCode('');

      // Recarregar dados IMEDIATAMENTE após sucesso (antes do toast)
      await Promise.all([
        loadAvailableCopies(),
        loadActiveLoans(),
        loadHistoryLoans(historySearch)
      ]);

      // Toast detalhado com informações capturadas
      toast({
        title: 'Devolução Confirmada',
        description: `'${bookTitle}' entregue por ${readerName}. Status: Disponível.`,
      });
    } catch (error: any) {
      console.error('Erro ao registrar devolução:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível registrar a devolução.',
        variant: 'destructive',
      });
    }
  };

  const handleFastRenew = async () => {
    if (!returnCode) {
      toast({
        title: 'Erro',
        description: 'Digite o código do exemplar',
        variant: 'destructive',
      });
      return;
    }

    // Buscar o exemplar pelo código
    const { data: copyData, error: copyError } = await supabase
      .from('copies')
      .select('*')
      .eq('code', returnCode.trim())
      .single();

    if (copyError || !copyData) {
      toast({
        title: 'Exemplar não encontrado',
        description: 'Verifique o código informado',
        variant: 'destructive',
      });
      return;
    }

    // Buscar o empréstimo ativo para este exemplar
    const { data: loanData, error: loanError } = await supabase
      .from('loans')
      .select('*')
      .eq('copy_id', copyData.id)
      .eq('status', 'aberto')
      .single();

    if (loanError || !loanData) {
      toast({
        title: 'Empréstimo não encontrado',
        description: 'Este exemplar não possui empréstimo ativo',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Verificar limite de renovações
      const currentRenovations = ((loanData as any).renovations_count || 0);
      if (currentRenovations >= 2) {
        toast({
          title: 'Limite de renovações atingido',
          description: 'Este empréstimo já foi renovado 2 vezes. Não é possível renovar novamente.',
          variant: 'destructive',
        });
        return;
      }

      // Buscar configuração da biblioteca (loan_days)
      let loanDays = 14; // Padrão
      if (loanData.library_id) {
        const { data: libraryData, error: libraryError } = await (supabase as any)
          .from('libraries')
          .select('loan_days')
          .eq('id', loanData.library_id)
          .single();

        if (!libraryError && libraryData?.loan_days) {
          loanDays = libraryData.loan_days;
        }
      }

      // CAPTURAR DADOS ANTES DE LIMPAR O ESTADO: Buscar livro e leitor
      const [bookResult, readerResult] = await Promise.all([
        supabase.from('books').select('title').eq('id', copyData.book_id).single(),
        supabase.from('users_profile').select('name').eq('id', loanData.user_id).single(),
      ]);

      const bookTitle = bookResult.data?.title || 'Livro não encontrado';
      const readerName = readerResult.data?.name || 'Leitor não encontrado';

      // Calcular nova data de devolução
      const currentDueDate = new Date(loanData.due_date);
      const newDueDate = new Date(currentDueDate);
      newDueDate.setDate(newDueDate.getDate() + loanDays);

      // Atualizar no Supabase
      const { error: updateError } = await (supabase as any)
        .from('loans')
        .update({
          due_date: newDueDate.toISOString(),
          renovations_count: currentRenovations + 1,
        })
        .eq('id', loanData.id);

      if (updateError) throw updateError;

      // Limpar o código ANTES de recarregar
      setReturnCode('');

      // Recarregar dados IMEDIATAMENTE após sucesso (antes do toast)
      await Promise.all([
        loadActiveLoans(),
        loadHistoryLoans(historySearch),
        loadAvailableCopies()
      ]);

      // Toast detalhado com informações capturadas
      toast({
        title: 'Renovado',
        description: `'${bookTitle}' para ${readerName}. Nova data: ${newDueDate.toLocaleDateString('pt-BR')}.`,
      });
    } catch (error: any) {
      console.error('Erro ao renovar empréstimo:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível renovar o empréstimo.',
        variant: 'destructive',
      });
    }
  };

  // Função para exportar TODO o histórico (não usa estado da tela)
  const handleExportAll = async () => {
    // Mostrar toast de início
    toast({
      title: 'Gerando relatório...',
      description: 'Buscando dados do histórico completo. Isso pode levar alguns instantes.',
    });

    try {
      // Buscar TODOS os empréstimos do histórico (sem limite)
      let query = supabase
        .from('loans')
        .select('*');

      // Filtrar por library_id do usuário logado
      if (user?.role === 'bibliotecario' && user.library_id) {
        query = query.eq('library_id', user.library_id);
      }

      // Buscar todos os empréstimos ordenados por data mais recente
      const { data: allLoans, error } = await query
        .order('loan_date', { ascending: false });

      if (error) throw error;

      // Buscar dados relacionados para todos os empréstimos
      const loansWithRelations = await Promise.all(
        (allLoans || []).map(async (loan) => {
          const [copyResult, userResult, libraryResult] = await Promise.all([
            supabase.from('copies').select('*').eq('id', loan.copy_id).single(),
            supabase.from('users_profile').select('*').eq('id', loan.user_id).single(),
            loan.library_id ? supabase.from('libraries').select('name').eq('id', loan.library_id).single() : Promise.resolve({ data: null }),
          ]);

          let copy: (Copy & { book?: Book }) | undefined = undefined;
          if (copyResult.data) {
            const bookResult = await supabase
              .from('books')
              .select('*')
              .eq('id', copyResult.data.book_id)
              .single();
            
            copy = {
              id: copyResult.data.id,
              book_id: copyResult.data.book_id,
              code: copyResult.data.code,
              library_id: copyResult.data.library_id,
              status: copyResult.data.status,
              book: bookResult.data || undefined,
            };
          }

          return {
            ...loan,
            copy: copy,
            user: userResult.data || undefined,
            library: libraryResult.data || undefined,
          };
        })
      );

      // Preparar dados para exportação
      const exportData = loansWithRelations.map((loan) => {
        const loanDate = loan.loan_date ? new Date(loan.loan_date).toLocaleDateString('pt-BR') : '-';
        const returnDate = loan.return_date ? new Date(loan.return_date).toLocaleDateString('pt-BR') : '-';
        const dueDate = loan.due_date ? new Date(loan.due_date).toLocaleDateString('pt-BR') : '-';
        const status = loan.status === 'aberto' ? 'Em Aberto' : loan.status === 'devolvido' ? 'Devolvido' : loan.status || '-';
        const libraryName = (loan as any).library?.name || '-';
        const renovationsCount = loan.renovations_count || 0;
        
        return {
          'Biblioteca': libraryName,
          'Título Livro': loan.copy?.book?.title || '-',
          'Código Exemplar': loan.copy?.code || '-',
          'Nome Leitor': loan.user?.name || '-',
          'Data Empréstimo': loanDate,
          'Data Previsão': dueDate,
          'Data Devolução': returnDate,
          'Status': status,
          'Renovações': renovationsCount,
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Histórico Completo');

      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const fileName = `circulacao_historico_${dateStr}.xlsx`;

      XLSX.writeFile(wb, fileName);

      toast({
        title: 'Sucesso',
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
          <h1 className="text-2xl md:text-3xl font-bold">Balcão de Circulação</h1>
          <p className="text-sm text-muted-foreground">Empréstimos e devoluções</p>
        </div>
        <Button variant="outline" onClick={handleExportAll} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Split Layout - empilhado em mobile */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* New Loan */}
        <Card>
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <ArrowLeftRight className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              Novo Empréstimo
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Selecione leitor e exemplar
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-2 space-y-4 md:space-y-6">
            {/* Reader Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs md:text-sm">Leitor</Label>
              <Popover open={readerOpen} onOpenChange={setReaderOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={readerOpen}
                    className="w-full justify-between h-10 md:h-11 text-sm"
                  >
                    {selectedReaderData ? (
                      <span className="flex items-center gap-2 truncate">
                        <User className="h-4 w-4 shrink-0" />
                        <span className="truncate">{selectedReaderData.name}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Buscar leitor...</span>
                    )}
                    <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-2rem)] md:w-[400px] p-0" align="start">
                  <Command
                    filter={(value, search) => {
                      if (!search) return 1;
                      const searchNormalized = normalizeText(search.trim());
                      const valueNormalized = normalizeText(value);
                      return valueNormalized.includes(searchNormalized) ? 1 : 0;
                    }}
                  >
                    <CommandInput placeholder="Buscar por nome ou email..." />
                    <CommandList>
                      <CommandEmpty>Nenhum leitor encontrado.</CommandEmpty>
                      <CommandGroup>
                        {readers.map((reader) => (
                          <CommandItem
                            key={reader.id}
                            value={`${reader.name} ${reader.email || ''}`}
                            onSelect={() => {
                              setSelectedReader(reader.id);
                              setReaderOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedReader === reader.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div>
                              <p>{reader.name}</p>
                              <p className="text-xs text-muted-foreground">{reader.email}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Eligibility Check */}
            {selectedReaderData && (() => {
              const readerActiveLoans = activeLoans.filter((l) => l.user_id === selectedReaderData.id);
              const loansCount = readerActiveLoans.length;
              // Aviso quando chega a mais da metade do limite ou a 2 livros do limite (o que for menor)
              const warningThreshold = Math.max(Math.floor(libraryMaxItems * 0.5), libraryMaxItems - 2);
              const hasWarning = loansCount >= warningThreshold && loansCount > 0;
              
              return (
                <div
                  className={cn(
                    'rounded-lg border p-4',
                    eligibility.eligible
                      ? 'border-success/20 bg-success/5'
                      : 'border-destructive/20 bg-destructive/5'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {eligibility.eligible ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                    <span
                      className={cn(
                        'font-medium',
                        eligibility.eligible ? 'text-success' : 'text-destructive'
                      )}
                    >
                      {eligibility.eligible ? 'Apto para empréstimo' : 'Não elegível'}
                    </span>
                  </div>
                  
                  {/* Indicador de livros em aberto */}
                  <div className={cn(
                    'mt-3 flex items-center gap-2 text-sm',
                    hasWarning ? 'text-amber-600' : 'text-muted-foreground'
                  )}>
                    {hasWarning && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    <BookOpen className="h-4 w-4" />
                    <span>
                      {loansCount === 0 
                        ? 'Nenhum livro em aberto' 
                        : loansCount === 1 
                          ? '1 livro em aberto' 
                          : `${loansCount} livros em aberto`}
                    </span>
                    {loansCount > 0 && (
                      <span className={cn(
                        'ml-1 px-1.5 py-0.5 rounded text-xs font-medium',
                        hasWarning 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {loansCount}/{libraryMaxItems}
                      </span>
                    )}
                  </div>
                  
                  {!eligibility.eligible && (
                    <ul className="mt-2 space-y-1 text-sm text-destructive">
                      {eligibility.reasons.map((reason, i) => (
                        <li key={i}>• {reason}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })()}

            {/* Copy Selection */}
            <div className="space-y-2">
              <Label>Exemplar</Label>
              <Popover open={copyOpen} onOpenChange={setCopyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={copyOpen}
                    className="w-full justify-between"
                    disabled={!eligibility.eligible}
                  >
                    {selectedCopyData ? (
                      <span className="flex items-center gap-2 text-left">
                        <BookOpen className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 truncate">
                          <span className="font-medium">{selectedCopyData.book?.title}</span>
                          {(selectedCopyData as any).tombo && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                              #{(selectedCopyData as any).tombo}
                            </span>
                          )}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Buscar por título, autor ou Nº tombo...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[450px] p-0" align="start">
                  <Command
                    filter={(value, search) => {
                      // Filtro customizado que busca em qualquer parte do valor, ignorando acentos
                      if (!search) return 1;
                      const searchNormalized = normalizeText(search.trim());
                      const valueNormalized = normalizeText(value);
                      // Busca por cada palavra do termo de pesquisa
                      const searchWords = searchNormalized.split(/\s+/);
                      const matchesAll = searchWords.every(word => valueNormalized.includes(word));
                      return matchesAll ? 1 : 0;
                    }}
                  >
                    <CommandInput placeholder="Buscar por título, autor, código ou Nº tombo..." />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>Nenhum exemplar encontrado com esse termo.</CommandEmpty>
                      <CommandGroup heading={`Exemplares Disponíveis (${availableCopies.length})`}>
                        {availableCopies.map((copy) => {
                          // Construir valor de busca sem undefined
                          const searchValue = [
                            copy.book?.title || '',
                            copy.book?.author || '',
                            copy.code || '',
                            (copy as any).tombo || '',
                            copy.book?.isbn || ''
                          ].filter(Boolean).join(' ').toLowerCase();
                          
                          return (
                            <CommandItem
                              key={copy.id}
                              value={searchValue}
                              onSelect={() => {
                                setSelectedCopy(copy.id);
                                setCopyOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4 flex-shrink-0',
                                  selectedCopy === copy.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate">{copy.book?.title || 'Livro não encontrado'}</p>
                                  {(copy as any).tombo && (
                                    <span className="flex-shrink-0 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                                      #{(copy as any).tombo}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {copy.book?.author && <span>{copy.book.author} • </span>}
                                  {copy.code && <span>Cód: {copy.code} • </span>}
                                  {copy.library?.name || 'Biblioteca'}
                                </p>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Summary Card */}
            {selectedReaderData && selectedCopyData && eligibility.eligible && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <h4 className="font-medium">Resumo do Empréstimo</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Leitor:</div>
                  <div className="font-medium">{selectedReaderData.name}</div>
                  <div className="text-muted-foreground">Livro:</div>
                  <div className="font-medium">{selectedCopyData.book?.title}</div>
                  <div className="text-muted-foreground">Autor:</div>
                  <div>{selectedCopyData.book?.author}</div>
                  <div className="text-muted-foreground">Nº Tombo:</div>
                  <div className="font-mono font-medium text-blue-700">
                    {(selectedCopyData as any).tombo ? `#${(selectedCopyData as any).tombo}` : '-'}
                  </div>
                  <div className="text-muted-foreground">Prazo:</div>
                  <div>14 dias</div>
                </div>
              </div>
            )}

            <Button
              variant="gov"
              className="w-full"
              onClick={handleLoan}
              disabled={!eligibility.eligible || !selectedCopyData}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirmar Empréstimo
            </Button>
          </CardContent>
        </Card>

        {/* Returns */}
        <Card>
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <RotateCcw className="h-4 w-4 md:h-5 md:w-5 text-success" />
              Devolução Rápida
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Código ou tombo do exemplar
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-2 space-y-4 md:space-y-6">
            <div className="space-y-1.5">
              <Label className="text-xs md:text-sm">Código do Exemplar</Label>
              <Input
                placeholder="Ex: 1-0001-1 ou B123"
                value={returnCode}
                onChange={(e) => setReturnCode(e.target.value)}
                className="text-base font-mono h-10 md:h-11"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && returnCode) {
                    handleReturn();
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="w-full h-10 text-sm" 
                onClick={handleFastRenew}
              >
                <RotateCw className="mr-1.5 h-4 w-4" />
                Renovar
              </Button>
              <Button 
                variant="default" 
                className="w-full h-10 text-sm bg-green-600 hover:bg-green-700" 
                onClick={handleReturn}
              >
                <Check className="mr-1.5 h-4 w-4" />
                Devolver
              </Button>
            </div>

            {/* Active Loans List */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Em Aberto
              </h4>
              <div className="max-h-[200px] md:max-h-[300px] space-y-2 overflow-y-auto">
                {activeLoans.slice(0, 10).map((loan) => {
                  const isOverdue = loan.due_date ? new Date(loan.due_date) < new Date() : false;
                  const renovationsCount = (loan.renovations_count || 0);
                  const canRenew = renovationsCount < 2;
                  const loanDays = 14; // Será calculado dinamicamente na função handleRenew
                  
                  return (
                    <div
                      key={loan.id}
                      className={cn(
                        'flex items-center justify-between rounded-lg border p-3',
                        isOverdue ? 'border-destructive/20 bg-destructive/5' : 'border-border'
                      )}
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">
                          {loan.copy?.book?.title || 'Livro não encontrado'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {loan.user?.name || 'Leitor não encontrado'} • {loan.copy?.code || 'Código não encontrado'}
                        </p>
                        {renovationsCount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Renovações: {renovationsCount}/2
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <Badge variant={isOverdue ? 'destructive' : 'outline'} className="shrink-0">
                          {isOverdue ? 'Atrasado' : loan.due_date ? new Date(loan.due_date).toLocaleDateString('pt-BR') : '-'}
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleNotify(loan);
                                }}
                                disabled={(() => {
                                  if (!loan.last_notification_sent) return false;
                                  const lastNotificationDate = new Date(loan.last_notification_sent);
                                  const today = new Date();
                                  return (
                                    lastNotificationDate.getDate() === today.getDate() &&
                                    lastNotificationDate.getMonth() === today.getMonth() &&
                                    lastNotificationDate.getFullYear() === today.getFullYear()
                                  );
                                })()}
                                className={cn(
                                  "h-8 w-8",
                                  (() => {
                                    if (!loan.last_notification_sent) return '';
                                    const lastNotificationDate = new Date(loan.last_notification_sent);
                                    const today = new Date();
                                    const isToday = (
                                      lastNotificationDate.getDate() === today.getDate() &&
                                      lastNotificationDate.getMonth() === today.getMonth() &&
                                      lastNotificationDate.getFullYear() === today.getFullYear()
                                    );
                                    return isToday ? 'opacity-50 cursor-not-allowed' : '';
                                  })()
                                )}
                              >
                                <MessageCircle className={cn(
                                  "h-4 w-4",
                                  (() => {
                                    if (!loan.last_notification_sent) return 'text-green-600';
                                    const lastNotificationDate = new Date(loan.last_notification_sent);
                                    const today = new Date();
                                    const isToday = (
                                      lastNotificationDate.getDate() === today.getDate() &&
                                      lastNotificationDate.getMonth() === today.getMonth() &&
                                      lastNotificationDate.getFullYear() === today.getFullYear()
                                    );
                                    return isToday ? 'text-muted-foreground' : 'text-green-600';
                                  })()
                                )} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {(() => {
                                if (!loan.last_notification_sent) {
                                  return <p>Notificar via WhatsApp</p>;
                                }
                                const lastNotificationDate = new Date(loan.last_notification_sent);
                                const formattedDate = lastNotificationDate.toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                });
                                const today = new Date();
                                const isToday = (
                                  lastNotificationDate.getDate() === today.getDate() &&
                                  lastNotificationDate.getMonth() === today.getMonth() &&
                                  lastNotificationDate.getFullYear() === today.getFullYear()
                                );
                                return isToday 
                                  ? <p>Último aviso: {formattedDate}</p>
                                  : <p>Notificar via WhatsApp (último: {formattedDate})</p>;
                              })()}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('[Button] Renovar clicado (lista ativos) para loan:', loan.id);
                                  handleRenew(loan);
                                }}
                                disabled={!canRenew}
                                className="h-8 w-8"
                              >
                                <RotateCw className={cn(
                                  "h-4 w-4",
                                  !canRenew && "opacity-50"
                                )} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {canRenew ? (
                                <p>Renovar (+{loanDays} dias)</p>
                              ) : (
                                <p>Limite de renovações atingido</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('[Button] Devolver clicado (lista ativos) para loan:', loan.id);
                                  handleReturnFromLoan(loan);
                                }}
                                className="h-8 w-8"
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Devolver</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consulta Local - Card separado */}
      <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
        <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg text-blue-700">
            <Eye className="h-4 w-4 md:h-5 md:w-5" />
            Consulta Local
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Registre quando alguém consulta livros sem levá-los
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-2 space-y-4">
          {/* Seletor de Biblioteca para Admin */}
          {user?.role === 'admin_rede' && (
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Biblioteca *</Label>
              <select
                value={consultationLibraryId}
                onChange={(e) => setConsultationLibraryId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Selecione a biblioteca...</option>
                {consultationLibraries.map(lib => (
                  <option key={lib.id} value={lib.id}>{lib.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="grid gap-4 md:grid-cols-3">
            {/* Quantidade de Livros */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Quantidade de Livros *</Label>
              <Input
                type="number"
                min="1"
                value={consultationQuantity}
                onChange={(e) => setConsultationQuantity(parseInt(e.target.value) || 1)}
                className="h-10"
                placeholder="1"
              />
            </div>

            {/* Leitor (opcional) */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Leitor (opcional)</Label>
              <Popover open={consultationReaderOpen} onOpenChange={setConsultationReaderOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={consultationReaderOpen}
                    className="w-full justify-between h-10"
                  >
                    {consultationReaderId ? (
                      <span className="flex items-center gap-2 text-left truncate">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {readers.find(r => r.id === consultationReaderId)?.name || 'Leitor não encontrado'}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Selecionar leitor...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command
                    filter={(value, search) => {
                      if (!search) return 1;
                      if (value === '__none__') return 1; // Sempre mostrar opção "Nenhum"
                      const searchNormalized = normalizeText(search.trim());
                      const valueNormalized = normalizeText(value);
                      return valueNormalized.includes(searchNormalized) ? 1 : 0;
                    }}
                  >
                    <CommandInput placeholder="Buscar leitor..." />
                    <CommandList>
                      <CommandEmpty>Nenhum leitor encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="__none__"
                          onSelect={() => {
                            setConsultationReaderId(null);
                            setConsultationReaderOpen(false);
                          }}
                          className="cursor-pointer text-muted-foreground"
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4 flex-shrink-0',
                              consultationReaderId === null ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <span>Nenhum (anônimo)</span>
                        </CommandItem>
                        {readers.slice(0, 20).map((reader) => (
                          <CommandItem
                            key={reader.id}
                            value={`${reader.name} ${reader.email || ''}`}
                            onSelect={() => {
                              setConsultationReaderId(reader.id);
                              setConsultationReaderOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4 flex-shrink-0',
                                consultationReaderId === reader.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">{reader.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{reader.email}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Observações (opcional)</Label>
              <Input
                placeholder="Ex: Pesquisa escolar..."
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
          
          <Button 
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700" 
            onClick={handleLocalConsultation}
            disabled={
              !consultationQuantity || 
              consultationQuantity < 1 || 
              (user?.role === 'admin_rede' && !consultationLibraryId)
            }
          >
            <Eye className="mr-2 h-4 w-4" />
            Registrar {consultationQuantity > 1 ? `${consultationQuantity} Consultas` : 'Consulta'}
          </Button>
          
          <p className="text-xs text-muted-foreground mt-2">
            💡 As consultas locais são contabilizadas no monitoramento mensal como "Livros Consultados".
          </p>
        </CardContent>
      </Card>

      {/* Histórico de Empréstimos/Devoluções */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Calendar className="h-5 w-5 text-primary" />
            Histórico de Empréstimos/Devoluções
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {historySearch.trim() 
              ? `Resultados: "${historySearch}"`
              : 'Últimos 20 registros'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          {/* Busca */}
          <div className="mb-4">
            <Input
              placeholder="Buscar por leitor ou livro..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : historyLoans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {historySearch.trim() ? 'Nenhum registro encontrado' : 'Sem registros'}
            </div>
          ) : (
            <>
              {/* MOBILE: Cards */}
              <div className="md:hidden space-y-3">
                {historyLoans.map((loan) => {
                  const formatDateTime = (dateString: string | null | undefined) => {
                    if (!dateString) return '-';
                    const date = new Date(dateString);
                    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                  };
                  const loanDate = formatDateTime(loan.created_at);
                  const returnDate = loan.return_date ? new Date(loan.return_date).toLocaleDateString('pt-BR') : '-';
                  const isOverdue = loan.status === 'aberto' && loan.due_date && new Date(loan.due_date) < new Date();
                  const renovationsCount = loan.renovations_count || 0;
                  const loanWithStaff = loan as LoanWithRelations & { library?: { name: string } };
                  
                  return (
                    <div key={loan.id} className={cn("bg-white border rounded-lg p-3 shadow-sm", isOverdue && "border-red-300 bg-red-50")}>
                      {/* Header com Status e Ações */}
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={loan.status === 'aberto' ? (isOverdue ? 'destructive' : 'default') : 'secondary'} className="text-xs">
                          {loan.status === 'aberto' ? (isOverdue ? 'Atrasado' : 'Aberto') : 'Devolvido'}
                        </Badge>
                        {loan.status === 'aberto' && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleRenew(loan)} className="h-7 px-2">
                              <RotateCw className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleReturnFromLoan(loan)} className="h-7 px-2 text-green-600">
                              <Check className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Info Principal */}
                      <h3 className="font-medium text-sm line-clamp-1">{loan.copy?.book?.title || '-'}</h3>
                      <p className="text-xs text-muted-foreground">{loan.user?.name || '-'}</p>
                      
                      {/* Detalhes em grid */}
                      <div className="grid grid-cols-2 gap-1 mt-2 text-[10px]">
                        <div><span className="text-muted-foreground">Saída:</span> {loanDate}</div>
                        <div><span className="text-muted-foreground">Previsão:</span> <span className={cn(isOverdue && "text-red-600 font-bold")}>{loan.due_date ? formatDateTime(loan.due_date) : '-'}</span></div>
                        {loan.status === 'devolvido' && <div><span className="text-muted-foreground">Devolvido:</span> {returnDate}</div>}
                        <div><span className="text-muted-foreground">Renov.:</span> {renovationsCount}/2</div>
                      </div>
                      {loanWithStaff.library?.name && (
                        <p className="text-[10px] text-muted-foreground mt-1">📍 {loanWithStaff.library.name}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP: Tabela */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Biblioteca</TableHead>
                      <TableHead>Livro</TableHead>
                      <TableHead>Nº Tombo</TableHead>
                      <TableHead>Leitor</TableHead>
                      <TableHead>Data Saída</TableHead>
                      <TableHead>Previsão</TableHead>
                      <TableHead>Data Devolução</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Renovações</TableHead>
                      <TableHead>Quem fez (Staff)</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {historyLoans.map((loan) => {
                    // Formatar created_at com data e hora: dd/MM/yyyy HH:mm
                    const formatDateTime = (dateString: string | null | undefined) => {
                      if (!dateString) return '-';
                      const date = new Date(dateString);
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const year = date.getFullYear();
                      const hours = String(date.getHours()).padStart(2, '0');
                      const minutes = String(date.getMinutes()).padStart(2, '0');
                      return `${day}/${month}/${year} ${hours}:${minutes}`;
                    };
                    
                    const loanDate = formatDateTime(loan.created_at);
                    const returnDate = loan.return_date ? new Date(loan.return_date).toLocaleDateString('pt-BR') : '-';
                    const status = loan.status === 'aberto' ? 'Em Aberto' : loan.status === 'devolvido' ? 'Devolvido' : loan.status || '-';
                    const renovationsCount = loan.renovations_count || 0;
                    const canRenew = renovationsCount < 2 && loan.status === 'aberto';
                    
                    // Calcular se está atrasado para a coluna "Previsão"
                    const isOverdue = loan.status === 'aberto' && loan.due_date && new Date(loan.due_date) < new Date();
                    const dueDateFormatted = loan.due_date ? new Date(loan.due_date).toLocaleDateString('pt-BR') : '-';
                    
                    // Determinar quem fez a operação
                    let staffName = '-';
                    const loanWithStaff = loan as LoanWithRelations & { createdBy?: UserProfile; returnedBy?: UserProfile; library?: { name: string } };
                    if (loan.status === 'devolvido' && loanWithStaff.returnedBy) {
                      staffName = loanWithStaff.returnedBy.name || '-';
                    } else if (loanWithStaff.createdBy) {
                      staffName = loanWithStaff.createdBy.name || '-';
                    }

                    // Buscar nome da biblioteca
                    const libraryName = loanWithStaff.library?.name || '-';

                    return (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <span className="text-sm font-medium">{libraryName}</span>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{loan.copy?.book?.title || '-'}</p>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{loan.copy?.code || '-'}</span>
                        </TableCell>
                        <TableCell>{loan.user?.name || '-'}</TableCell>
                        <TableCell>{loanDate}</TableCell>
                        <TableCell>
                          <span className={cn(
                            isOverdue && "text-red-600 font-bold",
                            loan.status === 'devolvido' && "text-muted-foreground"
                          )}>
                            {dueDateFormatted}
                          </span>
                        </TableCell>
                        <TableCell>{returnDate}</TableCell>
                        <TableCell>
                          <Badge variant={loan.status === 'aberto' ? 'default' : 'secondary'}>
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {renovationsCount} / 2
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {staffName}
                        </TableCell>
                        <TableCell>
                          {loan.status === 'aberto' ? (
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('[Button] Devolver clicado para loan:', loan.id);
                                        handleReturnFromLoan(loan);
                                      }}
                                      className="h-8 w-8"
                                    >
                                      <Check className="h-4 w-4 text-success" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Devolver</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('[Button] Renovar clicado para loan:', loan.id);
                                        handleRenew(loan);
                                      }}
                                      disabled={!canRenew}
                                      className="h-8 w-8"
                                    >
                                      <RotateCw className={cn(
                                        "h-4 w-4",
                                        !canRenew && "opacity-50"
                                      )} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {canRenew ? (
                                      <p>Renovar</p>
                                    ) : (
                                      <p>Limite de renovações atingido</p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Concluído
                            </Badge>
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
          {!historySearch.trim() && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Exibindo os 20 últimos registros. Use 'Exportar' para ver o histórico completo.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Consultas Locais */}
      <Card className="border-blue-200">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-blue-700">
            <Eye className="h-5 w-5" />
            Histórico de Consultas Locais
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Últimas 50 consultas locais registradas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          {consultationsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : localConsultations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma consulta local registrada.
            </div>
          ) : (
            <>
              {/* MOBILE: Cards */}
              <div className="md:hidden space-y-3">
                {localConsultations.map((consultation) => {
                  const consultDate = consultation.consultation_date 
                    ? new Date(consultation.consultation_date).toLocaleDateString('pt-BR')
                    : new Date(consultation.created_at).toLocaleDateString('pt-BR');
                  const consultTime = consultation.consultation_date 
                    ? new Date(consultation.consultation_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : new Date(consultation.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div key={consultation.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                          Consulta Local
                        </Badge>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{consultDate} {consultTime}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleEditConsultation(consultation)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteConsultation(consultation.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {consultation.users_profile && (
                        <p className="text-sm font-medium">📖 Leitor: {consultation.users_profile.name}</p>
                      )}
                      {!consultation.users_profile && (
                        <p className="text-sm text-muted-foreground italic">📖 Leitor: Anônimo</p>
                      )}
                      
                      {user?.role === 'admin_rede' && consultation.libraries && (
                        <p className="text-xs text-muted-foreground">🏛️ {consultation.libraries.name}</p>
                      )}
                      
                      {consultation.created_by_user && (
                        <p className="text-xs text-muted-foreground mt-1">👤 Registrado por: {consultation.created_by_user.name}</p>
                      )}
                      
                      {consultation.notes && (
                        <p className="text-xs text-muted-foreground mt-1">📝 {consultation.notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP: Tabela */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Data/Hora</TableHead>
                      {user?.role === 'admin_rede' && <TableHead>Biblioteca</TableHead>}
                      <TableHead>Leitor</TableHead>
                      <TableHead>Registrado por</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="w-[100px] text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {localConsultations.map((consultation) => {
                      const consultDate = consultation.consultation_date 
                        ? new Date(consultation.consultation_date).toLocaleDateString('pt-BR')
                        : new Date(consultation.created_at).toLocaleDateString('pt-BR');
                      const consultTime = consultation.consultation_date 
                        ? new Date(consultation.consultation_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : new Date(consultation.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <TableRow key={consultation.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{consultDate}</span>
                              <span className="text-xs text-muted-foreground">{consultTime}</span>
                            </div>
                          </TableCell>
                          {user?.role === 'admin_rede' && (
                            <TableCell>{consultation.libraries?.name || '-'}</TableCell>
                          )}
                          <TableCell>
                            {consultation.users_profile ? (
                              <div>
                                <span className="font-medium">{consultation.users_profile.name}</span>
                                <span className="text-xs text-muted-foreground block">{consultation.users_profile.email}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">Anônimo</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {consultation.created_by_user ? (
                              <div>
                                <span className="font-medium text-sm">{consultation.created_by_user.name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {consultation.notes || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditConsultation(consultation)}
                                title="Editar observações"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteConsultation(consultation.id)}
                                title="Excluir consulta"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

      {/* Dialog de Edição de Consulta */}
      <Dialog open={!!editingConsultation} onOpenChange={(open) => !open && setEditingConsultation(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Consulta Local
            </DialogTitle>
            <DialogDescription>
              Atualize as observações da consulta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Observações</label>
              <Input
                placeholder="Observações sobre a consulta..."
                value={editConsultationNotes}
                onChange={(e) => setEditConsultationNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditingConsultation(null)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveConsultationEdit}>
              <Check className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

