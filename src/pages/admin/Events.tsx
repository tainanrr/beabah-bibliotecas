import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Calendar,
  BookOpen,
  Users,
  Sparkles,
  FileText,
  Building2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  Download,
  Eye,
  BookMarked,
  Stamp,
  Tag,
  FileSpreadsheet,
  Send,
  BarChart3,
  ChevronsUpDown,
  RefreshCw,
  Globe,
  Image,
  Upload,
  Link,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

// Constantes
const LITERARY_GENRES = [
  'Poesia',
  'Conto infantil',
  'Romance Juvenil',
  'Romance',
  'Contos',
  'Literaturas afirmativas (negra, indígena, LGBTQIAP+, marginal)',
  'Outro',
];

const CULTURAL_ACTION_TYPES = [
  { id: 'saraus', label: 'Saraus' },
  { id: 'encontro_escritor', label: 'Encontro com escritor' },
  { id: 'cortejo_literario', label: 'Cortejo Literário' },
  { id: 'clube_leitura', label: 'Clube de leitura' },
  { id: 'oficina_escrita', label: 'Oficina de escrita' },
  { id: 'oficina_musica', label: 'Oficina de música' },
  { id: 'oficina_artesanato', label: 'Oficina de artesanato' },
  { id: 'oficina_teatro', label: 'Oficina de teatro' },
  { id: 'oficina_danca', label: 'Oficina de dança' },
  { id: 'piquenique', label: 'Piquenique' },
  { id: 'trilha', label: 'Trilha' },
  { id: 'horta_comunitaria', label: 'Horta comunitária' },
  { id: 'exibicao_filmes', label: 'Exibição de filmes' },
  { id: 'espetaculo_danca', label: 'Espetáculo de Dança' },
  { id: 'festa_tematica', label: 'Festa temática' },
  { id: 'encontro_tematico', label: 'Encontro temático' },
  { id: 'roda_memoria', label: 'Roda de memória' },
  { id: 'reforco_escolar', label: 'Reforço escolar' },
  { id: 'mediacao_leitura', label: 'Mediação de leitura' },
  { id: 'outro', label: 'Outro' },
];

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEK_DAYS_FULL = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Definições de turnos
const SHIFTS = [
  { name: 'morning', label: 'Manhã', icon: '🌅', color: 'amber', startTime: '08:00', endTime: '12:00' },
  { name: 'afternoon', label: 'Tarde', icon: '☀️', color: 'orange', startTime: '13:00', endTime: '18:00' },
  { name: 'evening', label: 'Noite', icon: '🌙', color: 'indigo', startTime: '18:00', endTime: '22:00' },
] as const;

type ShiftName = 'morning' | 'afternoon' | 'evening' | 'full_day';

// Tipos
type Library = {
  id: string;
  name: string;
  city?: string;
};

type OpeningLog = {
  id?: string;
  library_id: string;
  date: string;
  shift_name: ShiftName;
  opened: boolean;
  opening_time?: string;
  closing_time?: string;
  notes?: string;
  staff_names?: string;
};

type Holiday = {
  id?: string;
  name: string;
  date: string;
  recurring: boolean;
  national: boolean;
  library_id?: string | null;
  active: boolean;
};

type ExpectedSchedule = {
  id?: string;
  library_id: string;
  day_of_week: number;
  shift_name: ShiftName;
  is_open: boolean;
  custom_start_time?: string;
  custom_end_time?: string;
  notes?: string;
};

type ReadingMediation = {
  id?: string;
  library_id: string;
  date: string;
  mediation_type: 'presencial_biblioteca' | 'presencial_externo' | 'virtual';
  location?: string;
  audience_count: number;
  virtual_views: number;
  literary_genres: string[];
  post_mediation_notes?: string;
  description?: string;
  library?: Library;
  show_in_homepage?: boolean;
};

type CulturalAction = {
  id?: string;
  library_id: string;
  date: string;
  end_date?: string;
  title: string;
  action_type: string;
  location: string;
  location_lat?: number;
  location_lng?: number;
  expected_audience: number;
  actual_audience: number | null;
  status: 'agendado' | 'realizado' | 'cancelado';
  description?: string;
  frequency?: string;
  library?: Library;
  show_in_homepage?: boolean;
  banner_url?: string;
};

type TechnicalProcessing = {
  id?: string;
  library_id: string;
  date: string;
  books_purchased: number;
  books_donated: number;
  books_cataloged: number;
  books_classified: number;
  books_indexed: number;
  books_stamped: number;
  books_consulted: number;
  reading_bags_distributed: number;
  other_donations?: string;
  notes?: string;
};

export default function Events() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('calendario');
  const [loading, setLoading] = useState(false);
  
  // Estado de bibliotecas
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>('all');
  
  // Estado do calendário
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openingLogs, setOpeningLogs] = useState<Record<string, OpeningLog[]>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [openingDialogOpen, setOpeningDialogOpen] = useState(false);
  const [currentOpeningLog, setCurrentOpeningLog] = useState<Partial<OpeningLog>>({});
  const [calendarLibraryId, setCalendarLibraryId] = useState<string>('');
  
  // Estado das mediações
  const [mediations, setMediations] = useState<ReadingMediation[]>([]);
  const [mediationDialogOpen, setMediationDialogOpen] = useState(false);
  const [currentMediation, setCurrentMediation] = useState<Partial<ReadingMediation>>({});
  const [editingMediationId, setEditingMediationId] = useState<string | null>(null);
  const [mediationLibraryId, setMediationLibraryId] = useState<string>('');
  
  // Estado das ações culturais
  const [culturalActions, setCulturalActions] = useState<CulturalAction[]>([]);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<Partial<CulturalAction>>({});
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [actionTypeOpen, setActionTypeOpen] = useState(false);
  const [actionLibraryId, setActionLibraryId] = useState<string>('');
  
  // Estados para upload de imagem de capa do evento
  const [bannerInputMode, setBannerInputMode] = useState<'url' | 'upload'>('url');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  
  // Estado do processamento técnico
  const [technicalData, setTechnicalData] = useState<TechnicalProcessing | null>(null);
  const [technicalDialogOpen, setTechnicalDialogOpen] = useState(false);
  const [allTechnicalData, setAllTechnicalData] = useState<TechnicalProcessing[]>([]);
  
  // Estado dos resumos mensais
  const [monthlyStats, setMonthlyStats] = useState({
    daysOpened: 0,
    totalMediations: 0,
    mediationAudience: 0,
    totalCulturalActions: 0,
    culturalAudience: 0,
    totalLoans: 0,
    newReaders: 0,
  });
  
  // Estados para sistema de turnos
  const [calendarViewMode, setCalendarViewMode] = useState<'simple' | 'shifts'>('shifts');
  const [selectedShift, setSelectedShift] = useState<ShiftName>('morning');
  
  // Estados para feriados
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [currentHoliday, setCurrentHoliday] = useState<Partial<Holiday>>({});
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [holidaysConfigOpen, setHolidaysConfigOpen] = useState(false);
  
  // Estados para agenda prevista
  const [expectedSchedule, setExpectedSchedule] = useState<ExpectedSchedule[]>([]);
  const [scheduleConfigOpen, setScheduleConfigOpen] = useState(false);
  const [editingScheduleLibraryId, setEditingScheduleLibraryId] = useState<string>('');
  
  // Estados para estatísticas de disponibilidade
  const [availabilityStats, setAvailabilityStats] = useState({
    expectedShifts: 0,
    actualShifts: 0,
    complianceRate: 0,
  });

  const isAdmin = user?.role === 'admin_rede';
  const isBibliotecario = user?.role === 'bibliotecario';
  
  // Determinar library_id a usar - Para admin, "all" significa todas
  const effectiveLibraryId = isBibliotecario && user?.library_id 
    ? user.library_id 
    : (selectedLibraryId === 'all' ? '' : selectedLibraryId);
  
  // Verificar se está no modo "todas as bibliotecas"
  const isAllLibraries = isAdmin && (selectedLibraryId === 'all' || selectedLibraryId === '');

  // Carregar bibliotecas
  const loadLibraries = useCallback(async () => {
    try {
      let query = (supabase as any)
        .from('libraries')
        .select('id, name, city')
        .eq('active', true)
        .order('name');
      
      if (isBibliotecario && user?.library_id) {
        query = query.eq('id', user.library_id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setLibraries(data || []);
      
      // Se for bibliotecário, selecionar automaticamente sua biblioteca
      if (isBibliotecario && user?.library_id) {
        setSelectedLibraryId(user.library_id);
      }
      // Se for admin, NÃO selecionar nenhuma biblioteca por padrão
      // selectedLibraryId já inicia como '' (vazio)
      
    } catch (error) {
      console.error('Erro ao carregar bibliotecas:', error);
    }
  }, [isBibliotecario, user?.library_id]);

  // Helpers de calendário
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Dias vazios antes do primeiro dia do mês
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Carregar feriados
  const loadHolidays = useCallback(async () => {
    try {
      const year = currentDate.getFullYear();
      
      const { data, error } = await (supabase as any)
        .from('holidays')
        .select('*')
        .eq('active', true)
        .or(`date.gte.${year}-01-01,recurring.eq.true`);
      
      if (error) throw error;
      setHolidays(data || []);
    } catch (error) {
      console.error('Erro ao carregar feriados:', error);
    }
  }, [currentDate]);

  // Carregar agenda prevista
  const loadExpectedSchedule = useCallback(async () => {
    try {
      let query = (supabase as any)
        .from('library_expected_schedule')
        .select('*');
      
      if (effectiveLibraryId) {
        query = query.eq('library_id', effectiveLibraryId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setExpectedSchedule(data || []);
    } catch (error) {
      console.error('Erro ao carregar agenda prevista:', error);
    }
  }, [effectiveLibraryId]);

  // Verificar se uma data é feriado
  const isHoliday = useCallback((date: Date) => {
    const dateStr = formatDateKey(date);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return holidays.find(h => {
      if (h.recurring) {
        // Para feriados recorrentes, comparar apenas mês e dia
        const holidayDate = new Date(h.date);
        return holidayDate.getMonth() + 1 === month && holidayDate.getDate() === day;
      }
      return h.date === dateStr;
    });
  }, [holidays]);

  // Verificar se a biblioteca deveria abrir em um dia/turno específico
  const getExpectedOpening = useCallback((date: Date, shiftName: ShiftName, libraryId?: string) => {
    const dayOfWeek = date.getDay();
    const libId = libraryId || effectiveLibraryId;
    
    // Verificar se é feriado
    const holiday = isHoliday(date);
    if (holiday && (holiday.national || holiday.library_id === libId || !holiday.library_id)) {
      return { expected: false, reason: `Feriado: ${holiday.name}` };
    }
    
    // Verificar na agenda prevista
    const schedule = expectedSchedule.find(
      s => s.library_id === libId && s.day_of_week === dayOfWeek && s.shift_name === shiftName
    );
    
    if (!schedule) {
      return { expected: false, reason: 'Não programado' };
    }
    
    return { expected: schedule.is_open, reason: schedule.is_open ? 'Programado para abrir' : 'Programado para fechar' };
  }, [effectiveLibraryId, expectedSchedule, isHoliday]);

  // Calcular estatísticas de disponibilidade
  const calculateAvailabilityStats = useCallback(() => {
    if (!effectiveLibraryId || isAllLibraries) {
      setAvailabilityStats({ expectedShifts: 0, actualShifts: 0, complianceRate: 0 });
      return;
    }
    
    const days = getDaysInMonth(currentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let expectedShifts = 0;
    let actualShifts = 0;
    
    days.forEach(date => {
      if (!date || date > today) return;
      
      SHIFTS.forEach(shift => {
        const expected = getExpectedOpening(date, shift.name, effectiveLibraryId);
        if (expected.expected) {
          expectedShifts++;
          
          const dateKey = formatDateKey(date);
          const logsForDate = openingLogs[dateKey] || [];
          const log = logsForDate.find(l => 
            l.library_id === effectiveLibraryId && 
            (l.shift_name === shift.name || l.shift_name === 'full_day')
          );
          
          if (log?.opened) {
            actualShifts++;
          }
        }
      });
    });
    
    const complianceRate = expectedShifts > 0 ? Math.round((actualShifts / expectedShifts) * 100) : 0;
    setAvailabilityStats({ expectedShifts, actualShifts, complianceRate });
  }, [effectiveLibraryId, isAllLibraries, currentDate, openingLogs, getExpectedOpening]);

  // Carregar dados de abertura
  const loadOpeningLogs = useCallback(async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      let query = (supabase as any)
        .from('library_opening_log')
        .select('*, libraries(name)')
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0]);
      
      // Se não for "todas as bibliotecas", filtrar por biblioteca específica
      if (effectiveLibraryId) {
        query = query.eq('library_id', effectiveLibraryId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Agrupar por data para visualização consolidada
      const logsMap: Record<string, OpeningLog[]> = {};
      (data || []).forEach((log: any) => {
        if (!logsMap[log.date]) {
          logsMap[log.date] = [];
        }
        logsMap[log.date].push({
          ...log,
          shift_name: log.shift_name || 'full_day'
        });
      });
      
      setOpeningLogs(logsMap);
      
      // Calcular turnos abertos (não apenas dias)
      let totalOpenedShifts = 0;
      Object.values(logsMap).forEach(logs => {
        totalOpenedShifts += logs.filter(log => log.opened).length;
      });
      
      setMonthlyStats(prev => ({ ...prev, daysOpened: totalOpenedShifts }));
      
    } catch (error) {
      console.error('Erro ao carregar logs de abertura:', error);
    }
  }, [effectiveLibraryId, currentDate]);

  const loadMediations = useCallback(async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      let query = (supabase as any)
        .from('reading_mediations')
        .select('*, libraries(id, name)')
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('date', { ascending: false });
      
      // Se não for "todas as bibliotecas", filtrar
      if (effectiveLibraryId) {
        query = query.eq('library_id', effectiveLibraryId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Mapear dados com biblioteca
      const mediationsWithLibrary = (data || []).map((m: any) => ({
        ...m,
        library: m.libraries
      }));
      
      setMediations(mediationsWithLibrary);
      
      // Calcular totais
      const totalMediations = mediationsWithLibrary.length;
      const totalAudience = mediationsWithLibrary.reduce((sum: number, m: ReadingMediation) => 
        sum + (m.audience_count || 0) + (m.virtual_views || 0), 0);
      
      setMonthlyStats(prev => ({ 
        ...prev, 
        totalMediations,
        mediationAudience: totalAudience 
      }));
      
    } catch (error) {
      console.error('Erro ao carregar mediações:', error);
    }
  }, [effectiveLibraryId, currentDate]);

  const loadCulturalActions = useCallback(async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      let query = (supabase as any)
        .from('events')
        .select('*, libraries(id, name)')
        .gte('date', startOfMonth.toISOString())
        .lte('date', endOfMonth.toISOString())
        .order('date', { ascending: false });
      
      // Se não for "todas as bibliotecas", filtrar
      if (effectiveLibraryId) {
        query = query.eq('library_id', effectiveLibraryId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Mapear dados com biblioteca
      const actionsWithLibrary = (data || []).map((a: any) => ({
        ...a,
        library: a.libraries
      }));
      
      setCulturalActions(actionsWithLibrary);
      
      // Calcular totais
      const totalActions = actionsWithLibrary.filter((a: CulturalAction) => a.status === 'realizado').length;
      const totalAudience = actionsWithLibrary.reduce((sum: number, a: CulturalAction) => 
        sum + (a.actual_audience || 0), 0);
      
      setMonthlyStats(prev => ({ 
        ...prev, 
        totalCulturalActions: totalActions,
        culturalAudience: totalAudience 
      }));
      
    } catch (error) {
      console.error('Erro ao carregar ações culturais:', error);
    }
  }, [effectiveLibraryId, currentDate]);

  const loadTechnicalData = useCallback(async () => {
    try {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
      
      let query = (supabase as any)
        .from('technical_processing')
        .select('*, libraries(name)')
        .eq('date', monthKey);
      
      if (effectiveLibraryId) {
        query = query.eq('library_id', effectiveLibraryId);
        const { data, error } = await query.single();
        if (error && error.code !== 'PGRST116') throw error;
        setTechnicalData(data || null);
        } else {
        // Todas as bibliotecas - buscar todos e agregar
        const { data, error } = await query;
        if (error && error.code !== 'PGRST116') throw error;
        
        setAllTechnicalData(data || []);
        
        // Agregar dados
        if (data && data.length > 0) {
          const aggregated: TechnicalProcessing = {
            library_id: '',
            date: monthKey,
            books_purchased: data.reduce((sum: number, d: any) => sum + (d.books_purchased || 0), 0),
            books_donated: data.reduce((sum: number, d: any) => sum + (d.books_donated || 0), 0),
            books_cataloged: data.reduce((sum: number, d: any) => sum + (d.books_cataloged || 0), 0),
            books_classified: data.reduce((sum: number, d: any) => sum + (d.books_classified || 0), 0),
            books_indexed: data.reduce((sum: number, d: any) => sum + (d.books_indexed || 0), 0),
            books_stamped: data.reduce((sum: number, d: any) => sum + (d.books_stamped || 0), 0),
            books_consulted: data.reduce((sum: number, d: any) => sum + (d.books_consulted || 0), 0),
            reading_bags_distributed: data.reduce((sum: number, d: any) => sum + (d.reading_bags_distributed || 0), 0),
          };
          setTechnicalData(aggregated);
        } else {
          setTechnicalData(null);
        }
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados técnicos:', error);
    }
  }, [effectiveLibraryId, currentDate]);

  const loadMonthlyLoans = useCallback(async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      let query = (supabase as any)
        .from('loans')
        .select('id', { count: 'exact', head: true })
        .gte('loan_date', startOfMonth.toISOString())
        .lte('loan_date', endOfMonth.toISOString());
      
      if (effectiveLibraryId) {
        query = query.eq('library_id', effectiveLibraryId);
      }
      
      const { count, error } = await query;

      if (error) throw error;

      setMonthlyStats(prev => ({ ...prev, totalLoans: count || 0 }));
      
    } catch (error) {
      console.error('Erro ao carregar empréstimos:', error);
    }
  }, [effectiveLibraryId, currentDate]);

  const loadNewReaders = useCallback(async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      let query = (supabase as any)
        .from('users_profile')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'leitor')
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString());
      
      if (effectiveLibraryId) {
        query = query.eq('library_id', effectiveLibraryId);
      }
      
      const { count, error } = await query;
      
      if (error) throw error;
      
      setMonthlyStats(prev => ({ ...prev, newReaders: count || 0 }));
      
    } catch (error) {
      console.error('Erro ao carregar novos leitores:', error);
    }
  }, [effectiveLibraryId, currentDate]);

  // Função para calcular dados técnicos automaticamente
  const calculateTechnicalData = useCallback(async () => {
    if (!effectiveLibraryId) {
      toast({
        title: 'Erro',
        description: 'Selecione uma biblioteca específica para calcular.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Buscar empréstimos do mês (total de empréstimos = circulação)
      const { count: loansCount } = await (supabase as any)
        .from('loans')
        .select('id', { count: 'exact', head: true })
        .eq('library_id', effectiveLibraryId)
        .gte('loan_date', startOfMonth.toISOString())
        .lte('loan_date', endOfMonth.toISOString());
      
      // Buscar exemplares criados no mês (catalogados)
      const { data: copiesData } = await (supabase as any)
        .from('copies')
        .select('id, process_stamped, process_indexed, process_taped, created_at')
        .eq('library_id', effectiveLibraryId)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString());
      
      const copies = copiesData || [];
      const cataloged = copies.length;
      const stamped = copies.filter((c: any) => c.process_stamped).length;
      const indexed = copies.filter((c: any) => c.process_indexed).length;
      const classified = copies.filter((c: any) => c.process_taped).length;
      
      // Buscar consultas locais do mês
      const { count: consultationsCount } = await (supabase as any)
        .from('local_consultations')
        .select('id', { count: 'exact', head: true })
        .eq('library_id', effectiveLibraryId)
        .gte('consultation_date', startOfMonth.toISOString())
        .lte('consultation_date', endOfMonth.toISOString());
      
      // Manter os dados manuais que não podem ser calculados automaticamente
      const manualData = technicalData || {};
      
      const newTechnicalData: TechnicalProcessing = {
        library_id: effectiveLibraryId,
        date: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`,
        books_purchased: (manualData as any).books_purchased || 0,
        books_donated: (manualData as any).books_donated || 0,
        books_cataloged: cataloged,
        books_classified: classified,
        books_indexed: indexed,
        books_stamped: stamped,
        books_consulted: consultationsCount || 0,
        reading_bags_distributed: (manualData as any).reading_bags_distributed || 0,
        other_donations: (manualData as any).other_donations || '',
        notes: (manualData as any).notes || '',
      };
      
      setTechnicalData(newTechnicalData);
      
      toast({
        title: 'Dados atualizados',
        description: `Catalogados: ${cataloged}, Carimbados: ${stamped}, Indexados: ${indexed}, Classificados: ${classified}, Consultados: ${consultationsCount || 0}`,
      });
      
    } catch (error) {
      console.error('Erro ao calcular dados técnicos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível calcular os dados automaticamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [effectiveLibraryId, currentDate, technicalData]);

  // Effects
  useEffect(() => {
    loadLibraries();
  }, [loadLibraries]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  useEffect(() => {
    loadExpectedSchedule();
  }, [loadExpectedSchedule]);

  useEffect(() => {
    loadOpeningLogs();
    loadMediations();
    loadCulturalActions();
    loadTechnicalData();
    loadMonthlyLoans();
    loadNewReaders();
  }, [effectiveLibraryId, loadOpeningLogs, loadMediations, loadCulturalActions, loadTechnicalData, loadMonthlyLoans, loadNewReaders]);

  useEffect(() => {
    calculateAvailabilityStats();
  }, [calculateAvailabilityStats]);

  // Handlers de abertura
  const handleDayClick = (date: Date, shiftName?: ShiftName) => {
    // Para registrar abertura, precisa de uma biblioteca específica
    if (isAllLibraries) {
      toast({
        title: 'Atenção',
        description: 'Selecione uma biblioteca específica para registrar abertura.',
        variant: 'destructive',
      });
      return;
    }
    
    const shift = shiftName || selectedShift;
    setSelectedDate(date);
    const dateKey = formatDateKey(date);
    const existingLogs = openingLogs[dateKey] || [];
    const existingLog = existingLogs.find(l => 
      l.library_id === effectiveLibraryId && 
      (l.shift_name === shift || l.shift_name === 'full_day')
    );
    
    // Obter horários do turno
    const shiftDef = SHIFTS.find(s => s.name === shift);
    
    setCalendarLibraryId(effectiveLibraryId);
    setSelectedShift(shift as ShiftName);
    setCurrentOpeningLog({
      library_id: effectiveLibraryId,
      date: dateKey,
      shift_name: shift,
      opened: existingLog?.opened ?? true,
      opening_time: existingLog?.opening_time || shiftDef?.startTime || '09:00',
      closing_time: existingLog?.closing_time || shiftDef?.endTime || '17:00',
      notes: existingLog?.notes || '',
      staff_names: existingLog?.staff_names || '',
      ...existingLog,
      shift_name: shift, // Garantir que o shift seja o selecionado
    });
    
    setOpeningDialogOpen(true);
  };

  // Handler para clicar em um dia específico (abre dialog com opções de turno)
  const handleDayClickWithShifts = (date: Date) => {
    if (isAllLibraries) {
      handleAdminDayClick(date);
      return;
    }
    
    if (calendarViewMode === 'simple') {
      handleDayClick(date, 'full_day' as ShiftName);
    } else {
      // No modo de turnos, mostrar opções de turno
      setSelectedDate(date);
      setOpeningDialogOpen(true);
    }
  };

  const handleSaveOpeningLog = async () => {
    const libraryToUse = isAdmin ? calendarLibraryId : effectiveLibraryId;
    
    if (!libraryToUse || !currentOpeningLog.date) {
      toast({
        title: 'Erro',
        description: 'Selecione uma biblioteca.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const shiftToSave = currentOpeningLog.shift_name || selectedShift || 'full_day';
      
      const { error } = await (supabase as any)
        .from('library_opening_log')
        .upsert({
          library_id: libraryToUse,
          date: currentOpeningLog.date,
          shift_name: shiftToSave,
          opened: currentOpeningLog.opened,
          opening_time: currentOpeningLog.opening_time,
          closing_time: currentOpeningLog.closing_time,
          notes: currentOpeningLog.notes,
          staff_names: currentOpeningLog.staff_names,
          created_by: user?.id,
        }, { onConflict: 'library_id,date,shift_name' });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Registro de abertura salvo.',
      });

      setOpeningDialogOpen(false);
      loadOpeningLogs();
      
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível salvar.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers de mediação
  const handleSaveMediation = async () => {
    if (!currentMediation.date || !currentMediation.mediation_type) {
        toast({
          title: 'Campos obrigatórios',
        description: 'Preencha a data e o tipo de mediação.',
          variant: 'destructive',
        });
        return;
      }

    const libraryToUse = isAdmin ? mediationLibraryId : effectiveLibraryId;
    
    if (!libraryToUse) {
        toast({
          title: 'Erro',
        description: 'Selecione uma biblioteca.',
          variant: 'destructive',
        });
        return;
      }

    try {
      setLoading(true);
      
      const data = {
        library_id: libraryToUse,
        date: currentMediation.date,
        mediation_type: currentMediation.mediation_type,
        location: currentMediation.location || null,
        audience_count: currentMediation.audience_count || 0,
        virtual_views: currentMediation.virtual_views || 0,
        literary_genres: currentMediation.literary_genres || [],
        post_mediation_notes: currentMediation.post_mediation_notes || null,
        description: currentMediation.description || null,
        show_in_homepage: currentMediation.show_in_homepage ?? false,
        created_by: user?.id,
      };

      let error;
      
      if (editingMediationId) {
        const result = await (supabase as any)
          .from('reading_mediations')
          .update(data)
          .eq('id', editingMediationId);
        error = result.error;
      } else {
        const result = await (supabase as any)
          .from('reading_mediations')
          .insert(data);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: editingMediationId ? 'Mediação atualizada.' : 'Mediação registrada.',
      });
      
      setMediationDialogOpen(false);
      setCurrentMediation({});
      setEditingMediationId(null);
      setMediationLibraryId('');
      loadMediations();
      
    } catch (error: any) {
      console.error('Erro ao salvar mediação:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível salvar a mediação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditMediation = (mediation: ReadingMediation) => {
    setCurrentMediation(mediation);
    setEditingMediationId(mediation.id || null);
    setMediationLibraryId(mediation.library_id);
    setMediationDialogOpen(true);
  };

  const handleDeleteMediation = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mediação?')) return;
    
    try {
      const { error } = await (supabase as any)
        .from('reading_mediations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({ title: 'Sucesso', description: 'Mediação excluída.' });
      loadMediations();
    } catch (error: any) {
      toast({ title: 'Erro', description: error?.message, variant: 'destructive' });
    }
  };

  // Handlers de ação cultural
  const handleSaveAction = async () => {
    if (!currentAction.title || !currentAction.date || !currentAction.action_type) {
        toast({
        title: 'Campos obrigatórios',
        description: 'Preencha título, data e tipo da ação.',
          variant: 'destructive',
        });
        return;
      }

    const libraryToUse = isAdmin ? actionLibraryId : effectiveLibraryId;
    
    if (!libraryToUse) {
      toast({
        title: 'Erro',
        description: 'Selecione uma biblioteca.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const data = {
        library_id: libraryToUse,
        title: currentAction.title,
        date: new Date(currentAction.date).toISOString(),
        end_date: currentAction.end_date ? new Date(currentAction.end_date).toISOString() : null,
        location: currentAction.location || '',
        location_lat: currentAction.location_lat || null,
        location_lng: currentAction.location_lng || null,
        category: currentAction.action_type,
        action_type: currentAction.action_type,
        expected_audience: currentAction.expected_audience || 0,
        actual_audience: currentAction.actual_audience || null,
        status: currentAction.status || 'agendado',
        description: currentAction.description || null,
        frequency: currentAction.frequency || null,
        show_in_homepage: currentAction.show_in_homepage ?? true,
        banner_url: currentAction.banner_url || null,
      };
      
      let error;
      
      if (editingActionId) {
        const result = await (supabase as any)
        .from('events')
          .update(data)
          .eq('id', editingActionId);
        error = result.error;
      } else {
        const result = await (supabase as any)
          .from('events')
          .insert(data);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: editingActionId ? 'Ação atualizada.' : 'Ação registrada.',
      });
      
      setActionDialogOpen(false);
      setCurrentAction({});
      setEditingActionId(null);
      setActionLibraryId('');
      loadCulturalActions();
      
    } catch (error: any) {
      console.error('Erro ao salvar ação:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível salvar a ação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditAction = (action: CulturalAction) => {
    setCurrentAction({
      ...action,
      date: action.date ? new Date(action.date).toISOString().slice(0, 16) : '',
      end_date: action.end_date ? new Date(action.end_date).toISOString().slice(0, 16) : '',
    });
    setEditingActionId(action.id || null);
    setActionLibraryId(action.library_id);
    setBannerPreview(action.banner_url || '');
    setBannerInputMode('url');
    setActionDialogOpen(true);
  };

  // Função para fazer upload da imagem de capa do evento para o Supabase Storage
  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Use apenas imagens JPG, PNG, WebP ou GIF.',
        variant: 'destructive'
      });
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 5MB.',
        variant: 'destructive'
      });
      return;
    }

    setUploadingBanner(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `event-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `event-banners/${fileName}`;

      // Tentar fazer upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('books')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.warn('Upload falhou, usando base64:', error.message);
        
        // Converter para Base64 como fallback
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setCurrentAction(prev => ({ ...prev, banner_url: base64 }));
          setBannerPreview(base64);
          toast({ 
            title: 'Imagem processada', 
            description: 'Imagem salva localmente. Configure o Storage do Supabase para URLs permanentes.' 
          });
        };
        reader.readAsDataURL(file);
        return;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('books')
        .getPublicUrl(filePath);

      setCurrentAction(prev => ({ ...prev, banner_url: publicUrl }));
      setBannerPreview(publicUrl);
      
      toast({ title: 'Upload concluído!', description: 'Imagem enviada com sucesso.' });
    } catch (err: any) {
      console.error('Erro no upload:', err);
      toast({ 
        title: 'Erro no upload', 
        description: err.message || 'Não foi possível fazer o upload.', 
        variant: 'destructive' 
      });
    } finally {
      setUploadingBanner(false);
    }
  };

  // Função para remover a imagem de capa do evento
  const handleRemoveBanner = () => {
    setCurrentAction(prev => ({ ...prev, banner_url: '' }));
    setBannerPreview('');
  };

  const handleDeleteAction = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ação?')) return;
    
    try {
      const { error } = await (supabase as any)
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({ title: 'Sucesso', description: 'Ação excluída.' });
      loadCulturalActions();
    } catch (error: any) {
      toast({ title: 'Erro', description: error?.message, variant: 'destructive' });
    }
  };

  const handleConcludeAction = async (action: CulturalAction) => {
    const audience = prompt('Informe o público real da ação:');
    if (audience === null) return;
    
    try {
      const { error } = await (supabase as any)
        .from('events')
        .update({
          status: 'realizado',
          actual_audience: parseInt(audience) || 0,
        })
        .eq('id', action.id);
      
      if (error) throw error;
      
      toast({ title: 'Sucesso', description: 'Ação concluída.' });
      loadCulturalActions();
    } catch (error: any) {
      toast({ title: 'Erro', description: error?.message, variant: 'destructive' });
    }
  };

  // Handler de processamento técnico
  const handleSaveTechnical = async () => {
    if (!effectiveLibraryId) {
      toast({
        title: 'Erro',
        description: 'Selecione uma biblioteca específica para salvar.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
      
      const data = {
        library_id: effectiveLibraryId,
        date: monthKey,
        books_purchased: technicalData?.books_purchased || 0,
        books_donated: technicalData?.books_donated || 0,
        books_cataloged: technicalData?.books_cataloged || 0,
        books_classified: technicalData?.books_classified || 0,
        books_indexed: technicalData?.books_indexed || 0,
        books_stamped: technicalData?.books_stamped || 0,
        books_consulted: technicalData?.books_consulted || 0,
        reading_bags_distributed: technicalData?.reading_bags_distributed || 0,
        other_donations: technicalData?.other_donations || null,
        notes: technicalData?.notes || null,
        created_by: user?.id,
      };
      
      const { error } = await (supabase as any)
        .from('technical_processing')
        .upsert(data, { onConflict: 'library_id,date' });
      
      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: 'Dados técnicos salvos.',
      });
      
      setTechnicalDialogOpen(false);
      loadTechnicalData();
      
    } catch (error: any) {
      console.error('Erro ao salvar dados técnicos:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível salvar.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Exportar relatório mensal
  const handleExportMonthlyReport = () => {
    try {
      const month = MONTH_NAMES[currentDate.getMonth()];
      const year = currentDate.getFullYear();
      const libraryName = isAllLibraries 
        ? 'todas_bibliotecas' 
        : libraries.find(l => l.id === effectiveLibraryId)?.name || 'biblioteca';
      
      // Preparar dados das mediações
      const mediationsData = mediations.map(m => ({
        'Biblioteca': (m as any).library?.name || '-',
        'Data': m.date,
        'Tipo': m.mediation_type === 'presencial_biblioteca' ? 'Presencial na Biblioteca' :
               m.mediation_type === 'presencial_externo' ? 'Presencial Externo' : 'Virtual',
        'Local': m.mediation_type === 'presencial_biblioteca' ? 'Na Biblioteca' : (m.location || '-'),
        'Público': m.audience_count,
        'Visualizações': m.virtual_views,
        'Gêneros': (m.literary_genres || []).join(', '),
        'Descrição': m.description || '-',
        'Pós-mediação': m.post_mediation_notes || '-',
      }));
      
      // Preparar dados das ações
      const actionsData = culturalActions.map(a => ({
        'Biblioteca': (a as any).library?.name || '-',
        'Data': new Date(a.date).toLocaleDateString('pt-BR'),
        'Título': a.title,
        'Tipo': CULTURAL_ACTION_TYPES.find(t => t.id === a.action_type)?.label || a.action_type,
        'Status': a.status,
        'Público Esperado': a.expected_audience,
        'Público Real': a.actual_audience || 0,
      }));
      
      // Preparar resumo
      const summaryData = [{
        'Biblioteca': isAllLibraries ? 'Todas as Bibliotecas' : libraryName,
        'Mês/Ano': `${month}/${year}`,
        'Dias Abertos': monthlyStats.daysOpened,
        'Total Mediações': monthlyStats.totalMediations,
        'Público Mediações': monthlyStats.mediationAudience,
        'Total Ações Culturais': monthlyStats.totalCulturalActions,
        'Público Ações': monthlyStats.culturalAudience,
        'Total Empréstimos': monthlyStats.totalLoans,
        'Novos Leitores': monthlyStats.newReaders,
        'Livros Comprados': technicalData?.books_purchased || 0,
        'Livros Doados': technicalData?.books_donated || 0,
        'Livros Catalogados': technicalData?.books_cataloged || 0,
        'Livros Classificados': technicalData?.books_classified || 0,
        'Livros Indexados': technicalData?.books_indexed || 0,
        'Livros Carimbados': technicalData?.books_stamped || 0,
        'Livros Consultados': technicalData?.books_consulted || 0,
        'Malas de Leitura': technicalData?.reading_bags_distributed || 0,
      }];
      
      const wb = XLSX.utils.book_new();
      
      const wsResumo = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
      
      if (mediationsData.length > 0) {
        const wsMediacoes = XLSX.utils.json_to_sheet(mediationsData);
        XLSX.utils.book_append_sheet(wb, wsMediacoes, 'Mediações');
      }
      
      if (actionsData.length > 0) {
        const wsAcoes = XLSX.utils.json_to_sheet(actionsData);
        XLSX.utils.book_append_sheet(wb, wsAcoes, 'Ações Culturais');
      }
      
      const fileName = `monitoramento_beabah_${libraryName.toLowerCase().replace(/\s+/g, '_')}_${month.toLowerCase()}_${year}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: 'Relatório exportado',
        description: `Arquivo ${fileName} gerado com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o relatório.',
        variant: 'destructive',
      });
    }
  };

  // Estado para dialog de detalhes do dia (admin)
  const [dayDetailDialogOpen, setDayDetailDialogOpen] = useState(false);
  const [selectedDayForDetail, setSelectedDayForDetail] = useState<Date | null>(null);

  // Handler para admin clicar no dia
  const handleAdminDayClick = (date: Date) => {
    setSelectedDayForDetail(date);
    setDayDetailDialogOpen(true);
  };

  // Obter detalhes do dia para admin
  const getDayDetails = () => {
    if (!selectedDayForDetail) return { opened: [], closed: [], noResponse: [] };
    
    const dateKey = formatDateKey(selectedDayForDetail);
    const logsForDate = openingLogs[dateKey] || [];
    
    const opened: Library[] = [];
    const closed: Library[] = [];
    const noResponse: Library[] = [];
    
    libraries.forEach(lib => {
      const log = logsForDate.find(l => l.library_id === lib.id);
      if (!log) {
        noResponse.push(lib);
      } else if (log.opened) {
        opened.push(lib);
      } else {
        closed.push(lib);
      }
    });
    
    return { opened, closed, noResponse };
  };

  // Obter status de um turno específico para uma data
  const getShiftStatus = (date: Date, shiftName: ShiftName) => {
    const dateKey = formatDateKey(date);
    const logsForDate = openingLogs[dateKey] || [];
    const log = logsForDate.find(l => 
      l.library_id === effectiveLibraryId && 
      (l.shift_name === shiftName || l.shift_name === 'full_day')
    );
    
    const expected = getExpectedOpening(date, shiftName);
    const holiday = isHoliday(date);
    
    return {
      log,
      hasLog: !!log,
      isOpen: log?.opened,
      expected: expected.expected,
      expectedReason: expected.reason,
      isHoliday: !!holiday,
      holidayName: holiday?.name,
    };
  };

  // Render do calendário
  const renderCalendar = () => {
    const days = getDaysInMonth(currentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Modo com turnos
    if (calendarViewMode === 'shifts' && !isAllLibraries && effectiveLibraryId) {
      return (
        <div className="space-y-4">
          {/* Cabeçalho dos dias */}
          <div className="grid grid-cols-7 gap-1">
            {WEEK_DAYS.map(day => (
              <div key={day} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* Grid do calendário com turnos */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="min-h-[80px]" />;
              }
              
              const dateKey = formatDateKey(date);
              const isToday = date.getTime() === today.getTime();
              const isPast = date < today;
              const isFuture = date > today;
              const holiday = isHoliday(date);
              
              return (
                <div
                  key={dateKey}
                  className={cn(
                    "min-h-[80px] rounded-lg border p-1 text-xs transition-all",
                    isToday && "ring-2 ring-primary border-primary",
                    holiday && "bg-purple-50 dark:bg-purple-900/20 border-purple-200",
                    !holiday && !isToday && "bg-card hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-[11px] font-bold",
                      isToday ? "text-primary" : "text-muted-foreground"
                    )}>
                      {date.getDate()}
                    </span>
                    {holiday && (
                      <span className="text-[8px] bg-purple-500 text-white rounded px-1" title={holiday.name}>
                        🎉
                      </span>
                    )}
                  </div>
                  
                  {/* Turnos do dia */}
                  <div className="space-y-0.5">
                    {SHIFTS.map(shift => {
                      const status = getShiftStatus(date, shift.name);
                      const expected = getExpectedOpening(date, shift.name, effectiveLibraryId);
                      
                      // Cores baseadas no status
                      let bgColor = 'bg-gray-100 dark:bg-gray-800'; // Não esperado
                      let textColor = 'text-gray-400';
                      let icon = null;
                      
                      if (expected.expected) {
                        if (status.hasLog) {
                          if (status.isOpen) {
                            bgColor = 'bg-green-100 dark:bg-green-900/40';
                            textColor = 'text-green-700 dark:text-green-400';
                            icon = <Check className="h-2.5 w-2.5" />;
                          } else {
                            bgColor = 'bg-red-100 dark:bg-red-900/40';
                            textColor = 'text-red-700 dark:text-red-400';
                            icon = <X className="h-2.5 w-2.5" />;
                          }
                        } else if (isPast) {
                          bgColor = 'bg-amber-100 dark:bg-amber-900/40';
                          textColor = 'text-amber-700 dark:text-amber-400';
                          icon = <Clock className="h-2.5 w-2.5" />;
                        } else {
                          bgColor = 'bg-blue-50 dark:bg-blue-900/20';
                          textColor = 'text-blue-600 dark:text-blue-400';
                        }
                      }
                      
                      return (
                        <button
                          key={shift.name}
                          onClick={() => handleDayClick(date, shift.name)}
                          disabled={holiday && !status.hasLog}
                          className={cn(
                            "w-full flex items-center justify-between rounded px-1 py-0.5 transition-all",
                            bgColor, textColor,
                            expected.expected && "hover:opacity-80 cursor-pointer",
                            !expected.expected && "opacity-50 cursor-default",
                            holiday && "opacity-30"
                          )}
                          title={`${shift.label}: ${expected.expected ? 'Esperado abrir' : expected.reason}${status.hasLog ? (status.isOpen ? ' - ABRIU' : ' - FECHOU') : ''}`}
                        >
                          <span className="text-[9px] truncate">{shift.icon}</span>
                          {icon}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Modo simples (original) ou todas as bibliotecas
    return (
      <div className="grid grid-cols-7 gap-0.5">
        {WEEK_DAYS.map(day => (
          <div key={day} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-12 md:h-14" />;
          }
          
          const dateKey = formatDateKey(date);
          const logsForDate = openingLogs[dateKey] || [];
          const isToday = date.getTime() === today.getTime();
          const isPast = date < today;
          const holiday = isHoliday(date);
          
          // Para modo "todas as bibliotecas", mostrar quantas abriram/fecharam/sem resposta
          if (isAllLibraries) {
            const openedCount = logsForDate.filter(l => l.opened).length;
            const closedCount = logsForDate.filter(l => !l.opened).length;
            const noResponseCount = libraries.length - logsForDate.length;
            const hasLogs = logsForDate.length > 0;
            
            return (
              <button
                key={dateKey}
                onClick={() => handleAdminDayClick(date)}
                className={cn(
                  "h-12 md:h-14 rounded p-0.5 text-xs font-medium transition-all flex flex-col items-center justify-start",
                  "hover:ring-1 hover:ring-primary/50 focus:outline-none focus:ring-1 focus:ring-primary",
                  isToday && "ring-1 ring-primary bg-primary/10",
                  holiday && "bg-purple-50 dark:bg-purple-900/20",
                  !isToday && !holiday && hasLogs && "bg-slate-50 dark:bg-slate-800/50",
                  !isToday && !holiday && !hasLogs && isPast && "bg-muted/30 text-muted-foreground",
                  !isToday && !holiday && !hasLogs && !isPast && "bg-card hover:bg-muted/50"
                )}
              >
                <span className="text-[11px] font-semibold">{date.getDate()}</span>
                {holiday && <span className="text-[8px]">🎉</span>}
                <div className="flex flex-wrap justify-center gap-[2px] mt-0.5">
                  {openedCount > 0 && (
                    <span className="text-[8px] bg-green-500 text-white rounded px-[3px] leading-tight">{openedCount}</span>
                  )}
                  {closedCount > 0 && (
                    <span className="text-[8px] bg-red-500 text-white rounded px-[3px] leading-tight">{closedCount}</span>
                  )}
                  {noResponseCount > 0 && isPast && (
                    <span className="text-[8px] bg-gray-400 text-white rounded px-[3px] leading-tight">{noResponseCount}</span>
                  )}
                </div>
              </button>
            );
          }
          
          // Para biblioteca específica (modo simples)
          const log = logsForDate.find(l => l.library_id === effectiveLibraryId);
          const hasLog = !!log;
          const isOpen = log?.opened;
          
          return (
            <button
              key={dateKey}
              onClick={() => handleDayClickWithShifts(date)}
              className={cn(
                "h-12 md:h-14 rounded p-0.5 text-xs font-medium transition-all flex flex-col items-center justify-start",
                "hover:ring-1 hover:ring-primary/50 focus:outline-none focus:ring-1 focus:ring-primary",
                isToday && "ring-1 ring-primary",
                holiday && "bg-purple-50 dark:bg-purple-900/20",
                hasLog && isOpen && !holiday && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                hasLog && !isOpen && !holiday && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                !hasLog && !holiday && isPast && "bg-muted/30 text-muted-foreground",
                !hasLog && !holiday && !isPast && "bg-card hover:bg-muted/50"
              )}
            >
              <span className="text-[11px] font-semibold">{date.getDate()}</span>
              {holiday && <span className="text-[8px]" title={holiday.name}>🎉</span>}
              {hasLog && !holiday && (
                <span className="mt-0.5">
                  {isOpen ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <X className="h-3 w-3 text-red-600" />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const getMediationTypeLabel = (type: string) => {
    switch (type) {
      case 'presencial_biblioteca': return 'Presencial na Biblioteca';
      case 'presencial_externo': return 'Presencial Externo';
      case 'virtual': return 'Virtual';
      default: return type;
    }
  };

  const getActionTypeLabel = (typeId: string) => {
    return CULTURAL_ACTION_TYPES.find(t => t.id === typeId)?.label || typeId;
  };

  const getMediationLocation = (mediation: ReadingMediation) => {
    if (mediation.mediation_type === 'presencial_biblioteca') {
      return 'Na Biblioteca';
    }
    return mediation.location || '-';
  };

  return (
    <div className="space-y-6 p-4 md:p-0 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Monitoramento Beabah!
          </h1>
          <p className="text-sm text-muted-foreground">
            Registre as atividades da biblioteca para o relatório mensal
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Seletor de Biblioteca (apenas para admin) */}
          {isAdmin && libraries.length > 0 && (
            <Select value={selectedLibraryId} onValueChange={setSelectedLibraryId}>
              <SelectTrigger className="w-full sm:w-[250px]">
                {selectedLibraryId && selectedLibraryId !== 'all' ? (
                  <Building2 className="h-4 w-4 mr-2" />
                ) : (
                  <Globe className="h-4 w-4 mr-2" />
                )}
                <SelectValue placeholder="Todas as bibliotecas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Todas as bibliotecas
                  </span>
                </SelectItem>
                {libraries.map(lib => (
                  <SelectItem key={lib.id} value={lib.id}>
                    {lib.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="default" onClick={handleExportMonthlyReport} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Mostrar biblioteca selecionada ou modo agregado */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isAllLibraries ? (
          <>
            <Globe className="h-4 w-4" />
            <span className="font-medium text-primary">Visualizando dados de todas as bibliotecas ({libraries.length})</span>
          </>
        ) : effectiveLibraryId ? (
          <>
            <Building2 className="h-4 w-4" />
            <span>
              {libraries.find(l => l.id === effectiveLibraryId)?.name || 'Biblioteca'}
              {libraries.find(l => l.id === effectiveLibraryId)?.city && 
                ` - ${libraries.find(l => l.id === effectiveLibraryId)?.city}`
              }
            </span>
          </>
        ) : null}
      </div>

      {/* Resumo do Mês */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Resumo de {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            {isAllLibraries && <Badge variant="secondary" className="ml-2">Agregado</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{monthlyStats.daysOpened}</div>
              <div className="text-xs text-muted-foreground">Dias Abertos</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{monthlyStats.totalMediations}</div>
              <div className="text-xs text-muted-foreground">Mediações</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{monthlyStats.mediationAudience}</div>
              <div className="text-xs text-muted-foreground">Público Mediações</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{monthlyStats.totalCulturalActions}</div>
              <div className="text-xs text-muted-foreground">Ações Culturais</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="text-2xl font-bold text-pink-600">{monthlyStats.culturalAudience}</div>
              <div className="text-xs text-muted-foreground">Público Ações</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="text-2xl font-bold text-teal-600">{monthlyStats.totalLoans}</div>
              <div className="text-xs text-muted-foreground">Empréstimos</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{monthlyStats.newReaders}</div>
              <div className="text-xs text-muted-foreground">Novos Leitores</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{technicalData?.books_cataloged || 0}</div>
              <div className="text-xs text-muted-foreground">Catalogados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="calendario" className="flex flex-col md:flex-row items-center gap-1 py-2">
            <Calendar className="h-4 w-4" />
            <span className="text-xs md:text-sm">Calendário</span>
          </TabsTrigger>
          <TabsTrigger value="mediacoes" className="flex flex-col md:flex-row items-center gap-1 py-2">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs md:text-sm">Mediações</span>
          </TabsTrigger>
          <TabsTrigger value="acoes" className="flex flex-col md:flex-row items-center gap-1 py-2">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs md:text-sm">Ações</span>
          </TabsTrigger>
          <TabsTrigger value="tecnico" className="flex flex-col md:flex-row items-center gap-1 py-2">
            <BookMarked className="h-4 w-4" />
            <span className="text-xs md:text-sm">Técnico</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Calendário de Abertura */}
        <TabsContent value="calendario" className="space-y-4">
          {/* Card de Estatísticas de Disponibilidade */}
          {!isAllLibraries && effectiveLibraryId && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{availabilityStats.complianceRate}%</div>
                      <div className="text-xs text-muted-foreground">Taxa de Abertura</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold text-green-600">{availabilityStats.actualShifts}</div>
                      <div className="text-xs text-muted-foreground">Turnos Realizados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold text-blue-600">{availabilityStats.expectedShifts}</div>
                      <div className="text-xs text-muted-foreground">Turnos Esperados</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setEditingScheduleLibraryId(effectiveLibraryId);
                        setScheduleConfigOpen(true);
                      }}
                      className="gap-1"
                    >
                      <Calendar className="h-3 w-3" />
                      Configurar Agenda
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setHolidaysConfigOpen(true)}
                      className="gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      Feriados
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Registro de Abertura por Turno</CardTitle>
                  <CardDescription>
                    {isAllLibraries 
                      ? 'Clique em um dia para ver detalhes de cada biblioteca'
                      : 'Registre a abertura da biblioteca por turno (manhã, tarde, noite)'
                    }
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Seletor de modo de visualização */}
                  {!isAllLibraries && effectiveLibraryId && (
                    <div className="flex items-center bg-muted rounded-lg p-0.5">
                      <Button
                        variant={calendarViewMode === 'shifts' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setCalendarViewMode('shifts')}
                        className="h-7 text-xs"
                      >
                        Por Turno
                      </Button>
                      <Button
                        variant={calendarViewMode === 'simple' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setCalendarViewMode('simple')}
                        className="h-7 text-xs"
                      >
                        Simples
                      </Button>
                    </div>
                  )}
                  
                  {/* Navegação do mês */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-medium min-w-[130px] text-center text-sm">
                      {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <Button variant="outline" size="icon" onClick={goToNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderCalendar()}
              
              {/* Legenda */}
              <div className="flex items-center gap-3 mt-4 text-xs flex-wrap border-t pt-4">
                {isAllLibraries ? (
                  <>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] bg-green-500 text-white rounded px-1 py-0.5">N</span>
                      <span>Abertas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] bg-red-500 text-white rounded px-1 py-0.5">N</span>
                      <span>Fechadas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] bg-gray-400 text-white rounded px-1 py-0.5">N</span>
                      <span>Sem resposta</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px]">🎉</span>
                      <span>Feriado</span>
                    </div>
                  </>
                ) : calendarViewMode === 'shifts' ? (
                  <>
                    <div className="font-medium text-muted-foreground">Turnos:</div>
                    {SHIFTS.map(shift => (
                      <div key={shift.name} className="flex items-center gap-1">
                        <span>{shift.icon}</span>
                        <span>{shift.label}</span>
                      </div>
                    ))}
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/40" />
                      <span>Abriu</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/40" />
                      <span>Fechou</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/40" />
                      <span>Pendente</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-blue-50 dark:bg-blue-900/20" />
                      <span>Esperado</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800 opacity-50" />
                      <span>Não programado</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30" />
                      <span>Aberto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30" />
                      <span>Fechado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-muted/50" />
                      <span>Não registrado</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">🎉</span>
                      <span>Feriado</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Mediações de Leitura */}
        <TabsContent value="mediacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Mediações de Leitura</CardTitle>
                  <CardDescription>
                    Registre todas as mediações de leitura do mês
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setCurrentMediation({
                      date: new Date().toISOString().split('T')[0],
                      mediation_type: 'presencial_biblioteca',
                      audience_count: 0,
                      virtual_views: 0,
                      literary_genres: [],
                      show_in_homepage: false,
                    });
                    setMediationLibraryId(effectiveLibraryId);
                    setEditingMediationId(null);
                    setMediationDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nova Mediação
              </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mediations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma mediação registrada neste mês.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mediations.map((mediation) => (
                    <div
                      key={mediation.id}
                      className="flex flex-col gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={mediation.mediation_type === 'virtual' ? 'secondary' : 'default'}>
                              {getMediationTypeLabel(mediation.mediation_type)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(mediation.date).toLocaleDateString('pt-BR')}
                            </span>
                            {isAllLibraries && mediation.library && (
                              <Badge variant="outline" className="text-xs">
                                {mediation.library.name}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {getMediationLocation(mediation)}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {mediation.audience_count} pessoas
                            </span>
                            {mediation.virtual_views > 0 && (
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {mediation.virtual_views} views
                              </span>
                            )}
                          </div>
                          {mediation.literary_genres && mediation.literary_genres.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {mediation.literary_genres.map((genre, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {genre}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditMediation(mediation)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteMediation(mediation.id!)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Descrição e Pós-mediação */}
                      {(mediation.description || mediation.post_mediation_notes) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
                          {mediation.description && (
                            <div className="text-sm">
                              <span className="font-medium text-muted-foreground">Descrição:</span>
                              <p className="mt-1">{mediation.description}</p>
                            </div>
                          )}
                          {mediation.post_mediation_notes && (
                            <div className="text-sm">
                              <span className="font-medium text-muted-foreground">Pós-mediação:</span>
                              <p className="mt-1">{mediation.post_mediation_notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Ações Culturais */}
        <TabsContent value="acoes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Ações Culturais</CardTitle>
                  <CardDescription>
                    Eventos, oficinas, saraus e outras ações culturais
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setCurrentAction({
                      date: new Date().toISOString().slice(0, 16),
                      status: 'agendado',
                      expected_audience: 0,
                      show_in_homepage: true,
                    });
                    setEditingActionId(null);
                    setActionLibraryId(effectiveLibraryId);
                    setBannerPreview('');
                    setBannerInputMode('url');
                    setActionDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nova Ação
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {culturalActions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma ação cultural registrada neste mês.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {culturalActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{action.title}</span>
                          <Badge
                            variant={
                              action.status === 'realizado' ? 'default' :
                              action.status === 'cancelado' ? 'destructive' : 'secondary'
                            }
                          >
                            {action.status}
                          </Badge>
                          {isAllLibraries && action.library && (
                            <Badge variant="outline" className="text-xs">
                              {action.library.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(action.date).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {action.location || '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant="outline">{getActionTypeLabel(action.action_type || (action as any).category)}</Badge>
                          <span>
                            Público: {action.actual_audience ?? '-'} / {action.expected_audience}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {action.status === 'agendado' && (
                          <Button variant="outline" size="sm" onClick={() => handleConcludeAction(action)}>
                            <Check className="h-4 w-4 mr-1" />
                            Concluir
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleEditAction(action)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAction(action.id!)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Processamento Técnico */}
        <TabsContent value="tecnico" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Processamento Técnico do Acervo</CardTitle>
                  <CardDescription>
                    {isAllLibraries 
                      ? 'Dados agregados de todas as bibliotecas. Selecione uma biblioteca específica para editar.'
                      : 'Dados referentes ao processamento técnico do mês'
                    }
                  </CardDescription>
                </div>
                {!isAllLibraries && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={calculateTechnicalData}
                      disabled={loading || !effectiveLibraryId}
                      className="gap-2"
                    >
                      <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                      Calcular Auto
                    </Button>
                    <Button
                      onClick={() => {
                        if (!technicalData) {
                          setTechnicalData({
                            library_id: effectiveLibraryId || '',
                            date: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`,
                            books_purchased: 0,
                            books_donated: 0,
                            books_cataloged: 0,
                            books_classified: 0,
                            books_indexed: 0,
                            books_stamped: 0,
                            books_consulted: 0,
                            reading_bags_distributed: 0,
                          });
                        }
                        setTechnicalDialogOpen(true);
                      }}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar Dados
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Aquisição</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comprados:</span>
                      <span className="font-medium">{technicalData?.books_purchased || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Doados:</span>
                      <span className="font-medium">{technicalData?.books_donated || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                  <div className="flex items-center gap-2 mb-2">
                    <BookMarked className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Catalogação</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Catalogados:</span>
                      <span className="font-medium">{technicalData?.books_cataloged || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Classificados:</span>
                      <span className="font-medium">{technicalData?.books_classified || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Indexação</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Indexados:</span>
                      <span className="font-medium">{technicalData?.books_indexed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Carimbados:</span>
                      <span className="font-medium">{technicalData?.books_stamped || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Circulação</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Consultados:</span>
                      <span className="font-medium">{technicalData?.books_consulted || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Malas:</span>
                      <span className="font-medium">{technicalData?.reading_bags_distributed || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {!isAdmin && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <p><strong>Nota:</strong> Use "Calcular Auto" para preencher automaticamente os campos com base nos dados do sistema. Apenas o campo <strong>Malas</strong> deve ser preenchido manualmente.</p>
                </div>
              )}
              
              {technicalData?.other_donations && (
                <div className="mt-4 p-4 rounded-lg border bg-muted/50">
                  <div className="text-sm font-medium mb-1">Outras doações recebidas:</div>
                  <div className="text-sm text-muted-foreground">{technicalData.other_donations}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Registro de Abertura */}
      <Dialog open={openingDialogOpen} onOpenChange={setOpeningDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Registro de {selectedDate?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </DialogTitle>
            <DialogDescription>
              Informe se a biblioteca abriu neste turno
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Seletor de Biblioteca (apenas para admin quando não há biblioteca selecionada) */}
            {isAdmin && (
              <div className="space-y-2">
                <Label>Biblioteca *</Label>
                <Select value={calendarLibraryId} onValueChange={setCalendarLibraryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a biblioteca" />
                  </SelectTrigger>
                  <SelectContent>
                    {libraries.map(lib => (
                      <SelectItem key={lib.id} value={lib.id}>
                        {lib.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Seletor de Turno */}
            <div className="space-y-2">
              <Label>Turno</Label>
              <div className="grid grid-cols-3 gap-2">
                {SHIFTS.map(shift => {
                  const isSelected = currentOpeningLog.shift_name === shift.name;
                  const expected = selectedDate ? getExpectedOpening(selectedDate, shift.name, calendarLibraryId || effectiveLibraryId) : { expected: false };
                  
                  return (
                    <button
                      key={shift.name}
                      type="button"
                      onClick={() => {
                        setSelectedShift(shift.name);
                        setCurrentOpeningLog({ 
                          ...currentOpeningLog, 
                          shift_name: shift.name,
                          opening_time: shift.startTime,
                          closing_time: shift.endTime,
                        });
                      }}
                      className={cn(
                        "p-3 rounded-lg border-2 text-center transition-all",
                        isSelected ? "border-primary bg-primary/10" : "border-muted hover:border-primary/50",
                        expected.expected && !isSelected && "bg-blue-50 dark:bg-blue-900/20"
                      )}
                    >
                      <span className="text-2xl block">{shift.icon}</span>
                      <span className="text-sm font-medium block mt-1">{shift.label}</span>
                      <span className="text-[10px] text-muted-foreground block">
                        {shift.startTime} - {shift.endTime}
                      </span>
                      {expected.expected && (
                        <Badge variant="secondary" className="mt-1 text-[9px]">
                          Esperado
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
              <Checkbox
                id="opened"
                checked={currentOpeningLog.opened}
                onCheckedChange={(checked) => 
                  setCurrentOpeningLog({ ...currentOpeningLog, opened: checked as boolean })
                }
              />
              <Label htmlFor="opened" className="text-base font-medium cursor-pointer">
                A biblioteca abriu neste turno
              </Label>
            </div>
            
            {currentOpeningLog.opened && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Horário de Abertura</Label>
                    <Input
                      type="time"
                      value={currentOpeningLog.opening_time || ''}
                      onChange={(e) => 
                        setCurrentOpeningLog({ ...currentOpeningLog, opening_time: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário de Fechamento</Label>
                    <Input
                      type="time"
                      value={currentOpeningLog.closing_time || ''}
                      onChange={(e) => 
                        setCurrentOpeningLog({ ...currentOpeningLog, closing_time: e.target.value })
                      }
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Equipe que atuou</Label>
                  <Input
                    placeholder="Ex: Maria (mediadora), João (voluntário)"
                    value={currentOpeningLog.staff_names || ''}
                    onChange={(e) => 
                      setCurrentOpeningLog({ ...currentOpeningLog, staff_names: e.target.value })
                    }
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Anotações sobre o turno (opcional)"
                value={currentOpeningLog.notes || ''}
                onChange={(e) => 
                  setCurrentOpeningLog({ ...currentOpeningLog, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpeningDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveOpeningLog} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Mediação de Leitura */}
      <Dialog open={mediationDialogOpen} onOpenChange={setMediationDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMediationId ? 'Editar Mediação' : 'Nova Mediação de Leitura'}
            </DialogTitle>
            <DialogDescription>
              Registre os detalhes da mediação de leitura
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Seletor de Biblioteca (apenas para admin) */}
            {isAdmin && (
                <div className="space-y-2">
                <Label>Biblioteca *</Label>
                <Select value={mediationLibraryId} onValueChange={setMediationLibraryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a biblioteca" />
                    </SelectTrigger>
                    <SelectContent>
                    {libraries.map(lib => (
                      <SelectItem key={lib.id} value={lib.id}>
                        {lib.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label>Data *</Label>
                  <Input
                  type="date"
                  value={currentMediation.date || ''}
                  onChange={(e) => 
                    setCurrentMediation({ ...currentMediation, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={currentMediation.mediation_type || ''}
                  onValueChange={(value) => 
                    setCurrentMediation({ ...currentMediation, mediation_type: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial_biblioteca">Presencial na Biblioteca</SelectItem>
                    <SelectItem value="presencial_externo">Presencial Externo</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {currentMediation.mediation_type === 'presencial_externo' && (
              <div className="space-y-2">
                <Label>Local</Label>
                <Input
                  placeholder="Ex: Praça do bairro, Escola Municipal..."
                  value={currentMediation.location || ''}
                  onChange={(e) => 
                    setCurrentMediation({ ...currentMediation, location: e.target.value })
                  }
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Público Presencial</Label>
                <Input
                    type="number"
                  min="0"
                  value={currentMediation.audience_count || 0}
                  onChange={(e) => 
                    setCurrentMediation({ ...currentMediation, audience_count: parseInt(e.target.value) || 0 })
                  }
                  />
                </div>
              {currentMediation.mediation_type === 'virtual' && (
                <div className="space-y-2">
                  <Label>Visualizações</Label>
                  <Input
                    type="number"
                    min="0"
                    value={currentMediation.virtual_views || 0}
                    onChange={(e) => 
                      setCurrentMediation({ ...currentMediation, virtual_views: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Gêneros Literários Utilizados</Label>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                {LITERARY_GENRES.map((genre) => (
                  <div key={genre} className="flex items-center space-x-2">
                    <Checkbox
                      id={genre}
                      checked={(currentMediation.literary_genres || []).includes(genre)}
                      onCheckedChange={(checked) => {
                        const genres = currentMediation.literary_genres || [];
                        if (checked) {
                          setCurrentMediation({ ...currentMediation, literary_genres: [...genres, genre] });
                        } else {
                          setCurrentMediation({ ...currentMediation, literary_genres: genres.filter(g => g !== genre) });
                        }
                      }}
                    />
                    <Label htmlFor={genre} className="text-sm font-normal cursor-pointer">
                      {genre}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Descrição da Mediação</Label>
              <Textarea
                placeholder="Descreva brevemente a mediação realizada..."
                value={currentMediation.description || ''}
                onChange={(e) => 
                  setCurrentMediation({ ...currentMediation, description: e.target.value })
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label>Estratégia de Pós-mediação</Label>
              <Textarea
                placeholder="Descreva a estratégia utilizada no processo de pós-mediação (opcional)"
                value={currentMediation.post_mediation_notes || ''}
                onChange={(e) => 
                  setCurrentMediation({ ...currentMediation, post_mediation_notes: e.target.value })
                }
                  />
                </div>
            
            <div className="flex items-center space-x-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <Checkbox
                id="show_in_homepage_mediation"
                checked={currentMediation.show_in_homepage ?? false}
                onCheckedChange={(checked) => 
                  setCurrentMediation({ ...currentMediation, show_in_homepage: checked as boolean })
                }
              />
              <Label htmlFor="show_in_homepage_mediation" className="text-sm font-medium cursor-pointer">
                Exibir na Agenda Cultural da página principal
              </Label>
            </div>
              </div>
              <DialogFooter>
            <Button variant="outline" onClick={() => setMediationDialogOpen(false)}>
                  Cancelar
                </Button>
            <Button onClick={handleSaveMediation} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

      {/* Dialog: Ação Cultural */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingActionId ? 'Editar Ação Cultural' : 'Nova Ação Cultural'}
            </DialogTitle>
            <DialogDescription>
              Registre os detalhes da ação cultural
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isAdmin && (
              <div className="space-y-2">
                <Label>Biblioteca *</Label>
                <Select value={actionLibraryId} onValueChange={setActionLibraryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a biblioteca" />
                  </SelectTrigger>
                  <SelectContent>
                    {libraries.map(lib => (
                      <SelectItem key={lib.id} value={lib.id}>{lib.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Nome da ação/evento"
                value={currentAction.title || ''}
                onChange={(e) => setCurrentAction({ ...currentAction, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início *</Label>
                <Input
                  type="datetime-local"
                  value={currentAction.date || ''}
                  onChange={(e) => setCurrentAction({ ...currentAction, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Término</Label>
                <Input
                  type="datetime-local"
                  value={currentAction.end_date || ''}
                  onChange={(e) => setCurrentAction({ ...currentAction, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Popover open={actionTypeOpen} onOpenChange={setActionTypeOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={actionTypeOpen} className="w-full justify-between">
                    {currentAction.action_type ? getActionTypeLabel(currentAction.action_type) : "Selecione o tipo..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar tipo..." />
                    <CommandList>
                      <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                      <CommandGroup>
                        {CULTURAL_ACTION_TYPES.map((type) => (
                          <CommandItem
                            key={type.id}
                            value={type.label}
                            onSelect={() => {
                              setCurrentAction({ ...currentAction, action_type: type.id });
                              setActionTypeOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", currentAction.action_type === type.id ? "opacity-100" : "opacity-0")} />
                            {type.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
                      
            <div className="space-y-2">
              <Label>Local do Evento</Label>
              <Input
                placeholder="Ex: Praça da Matriz, Centro, Porto Alegre - RS"
                value={currentAction.location || ''}
                onChange={(e) => setCurrentAction({ ...currentAction, location: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Digite o endereço completo (rua, número, bairro, cidade) para que os participantes possam encontrar facilmente
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Imagem de Capa</Label>
                <div className="flex gap-1 p-0.5 bg-slate-100 rounded-md">
                  <Button
                    type="button"
                    size="sm"
                    variant={bannerInputMode === 'url' ? 'default' : 'ghost'}
                    onClick={() => setBannerInputMode('url')}
                    className="h-7 text-xs"
                  >
                    <Link className="h-3 w-3 mr-1" />
                    URL
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={bannerInputMode === 'upload' ? 'default' : 'ghost'}
                    onClick={() => setBannerInputMode('upload')}
                    className="h-7 text-xs"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Upload
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-4">
                {/* Preview da capa */}
                <div className="flex-shrink-0">
                  {bannerPreview || currentAction.banner_url ? (
                    <div className="relative group">
                      <img 
                        src={bannerPreview || currentAction.banner_url} 
                        alt="Preview da capa"
                        className="h-24 w-32 object-cover rounded-md border shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleRemoveBanner}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-24 w-32 bg-slate-200 rounded-md border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                      <Image className="h-8 w-8 mb-1" />
                      <span className="text-[10px] text-center px-1">Sem capa</span>
                    </div>
                  )}
                </div>
                
                {/* Inputs de capa */}
                <div className="flex-1 space-y-2">
                  {bannerInputMode === 'url' ? (
                    <>
                      <Label className="text-xs text-muted-foreground">URL da imagem</Label>
                      <Input 
                        value={currentAction.banner_url || ''} 
                        onChange={e => {
                          setCurrentAction({...currentAction, banner_url: e.target.value});
                          setBannerPreview(e.target.value);
                        }}
                        placeholder="https://exemplo.com/imagem.jpg"
                        className="bg-white"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Cole a URL de uma imagem existente na internet.
                      </p>
                    </>
                  ) : (
                    <>
                      <Label className="text-xs text-muted-foreground">Enviar arquivo de imagem</Label>
                      <div className="relative">
                        <Input 
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleBannerUpload}
                          disabled={uploadingBanner}
                          className="bg-white cursor-pointer"
                        />
                        {uploadingBanner && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-md">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm">Enviando...</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Formatos aceitos: JPG, PNG, WebP, GIF. Tamanho máximo: 5MB.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
                      
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Público Esperado</Label>
                <Input
                  type="number"
                  min="0"
                  value={currentAction.expected_audience || 0}
                  onChange={(e) => setCurrentAction({ ...currentAction, expected_audience: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select value={currentAction.frequency || ''} onValueChange={(value) => setCurrentAction({ ...currentAction, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1x_semana">1 vez na semana</SelectItem>
                    <SelectItem value="2x_semana">2 vezes na semana</SelectItem>
                    <SelectItem value="1x_mes">1 vez no mês</SelectItem>
                    <SelectItem value="2x_mes">2 vezes no mês</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descreva brevemente a ação cultural..."
                value={currentAction.description || ''}
                onChange={(e) => setCurrentAction({ ...currentAction, description: e.target.value })}
              />
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-lime-50 dark:bg-lime-900/20 rounded-lg border border-lime-200 dark:border-lime-800">
              <Checkbox
                id="show_in_homepage_action"
                checked={currentAction.show_in_homepage ?? true}
                onCheckedChange={(checked) => setCurrentAction({ ...currentAction, show_in_homepage: checked as boolean })}
              />
              <Label htmlFor="show_in_homepage_action" className="text-sm font-medium cursor-pointer">
                Exibir na Agenda Cultural da página principal
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveAction} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Processamento Técnico */}
      <Dialog open={technicalDialogOpen} onOpenChange={setTechnicalDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Processamento Técnico - {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </DialogTitle>
            <DialogDescription>
              Informe os dados de processamento técnico do acervo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Separator />
            <h4 className="font-medium">Aquisição de Acervo (Manual)</h4>
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Livros comprados</Label>
              <Input
                type="number"
                min="0"
                  value={technicalData?.books_purchased || 0}
                  onChange={(e) => 
                    setTechnicalData({ ...technicalData!, books_purchased: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Livros doados</Label>
                <Input
                  type="number"
                  min="0"
                  value={technicalData?.books_donated || 0}
                  onChange={(e) => 
                    setTechnicalData({ ...technicalData!, books_donated: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            
            <Separator />
            <h4 className="font-medium">Processamento Técnico (Calculado automaticamente)</h4>
            <p className="text-xs text-muted-foreground">Esses valores são calculados com base nos exemplares cadastrados no Acervo.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Livros catalogados</Label>
                <Input
                  type="number"
                  min="0"
                  value={technicalData?.books_cataloged || 0}
                  onChange={(e) => 
                    setTechnicalData({ ...technicalData!, books_cataloged: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Livros classificados</Label>
                <Input
                  type="number"
                  min="0"
                  value={technicalData?.books_classified || 0}
                  onChange={(e) => 
                    setTechnicalData({ ...technicalData!, books_classified: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Livros indexados</Label>
                <Input
                  type="number"
                  min="0"
                  value={technicalData?.books_indexed || 0}
                  onChange={(e) => 
                    setTechnicalData({ ...technicalData!, books_indexed: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Livros carimbados</Label>
                <Input
                  type="number"
                  min="0"
                  value={technicalData?.books_stamped || 0}
                  onChange={(e) => 
                    setTechnicalData({ ...technicalData!, books_stamped: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            
            <Separator />
            <h4 className="font-medium">Circulação (Manual)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Livros consultados</Label>
                <Input
                  type="number"
                  min="0"
                  value={technicalData?.books_consulted || 0}
                  onChange={(e) => 
                    setTechnicalData({ ...technicalData!, books_consulted: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Malas de leitura</Label>
                <Input
                  type="number"
                  min="0"
                  value={technicalData?.reading_bags_distributed || 0}
                  onChange={(e) => 
                    setTechnicalData({ ...technicalData!, reading_bags_distributed: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Outras doações recebidas</Label>
              <Textarea
                placeholder="Ex: material de escritório, lanche, valor em dinheiro..."
                value={technicalData?.other_donations || ''}
                onChange={(e) => 
                  setTechnicalData({ ...technicalData!, other_donations: e.target.value })
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Notas adicionais sobre o processamento técnico..."
                value={technicalData?.notes || ''}
                onChange={(e) => 
                  setTechnicalData({ ...technicalData!, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTechnicalDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTechnical} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes do Dia (Admin) */}
      <Dialog open={dayDetailDialogOpen} onOpenChange={setDayDetailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {selectedDayForDetail?.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
              })}
            </DialogTitle>
            <DialogDescription>
              Situação das bibliotecas neste dia
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(() => {
              const details = getDayDetails();
              return (
                <>
                  {/* Abertas */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="font-medium text-green-700">Abertas ({details.opened.length})</span>
                    </div>
                    {details.opened.length > 0 ? (
                      <div className="pl-5 space-y-1">
                        {details.opened.map(lib => (
                          <div key={lib.id} className="text-sm text-muted-foreground flex items-center gap-1">
                            <Check className="h-3 w-3 text-green-500" />
                            {lib.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="pl-5 text-sm text-muted-foreground italic">Nenhuma biblioteca aberta</p>
                    )}
                  </div>

                  {/* Fechadas */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="font-medium text-red-700">Fechadas ({details.closed.length})</span>
                    </div>
                    {details.closed.length > 0 ? (
                      <div className="pl-5 space-y-1">
                        {details.closed.map(lib => (
                          <div key={lib.id} className="text-sm text-muted-foreground flex items-center gap-1">
                            <X className="h-3 w-3 text-red-500" />
                            {lib.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="pl-5 text-sm text-muted-foreground italic">Nenhuma biblioteca fechada</p>
                    )}
                  </div>

                  {/* Sem Resposta */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400" />
                      <span className="font-medium text-gray-600">Sem resposta ({details.noResponse.length})</span>
                    </div>
                    {details.noResponse.length > 0 ? (
                      <div className="pl-5 space-y-1">
                        {details.noResponse.map(lib => (
                          <div key={lib.id} className="text-sm text-muted-foreground flex items-center gap-1">
                            <span className="w-3 h-3 text-center text-[10px] text-gray-400">?</span>
                            {lib.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="pl-5 text-sm text-muted-foreground italic">Todas as bibliotecas responderam</p>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDayDetailDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Configuração de Agenda Prevista */}
      <Dialog open={scheduleConfigOpen} onOpenChange={setScheduleConfigOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Configurar Agenda de Abertura
            </DialogTitle>
            <DialogDescription>
              Defina os dias e turnos em que a biblioteca deve abrir
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Seletor de Biblioteca (apenas para admin) */}
            {isAdmin && (
              <div className="space-y-2">
                <Label>Biblioteca</Label>
                <Select 
                  value={editingScheduleLibraryId} 
                  onValueChange={(value) => {
                    setEditingScheduleLibraryId(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a biblioteca" />
                  </SelectTrigger>
                  <SelectContent>
                    {libraries.map(lib => (
                      <SelectItem key={lib.id} value={lib.id}>
                        {lib.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Tabela de configuração por dia/turno */}
            {(editingScheduleLibraryId || effectiveLibraryId) && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Dia da Semana</th>
                      {SHIFTS.map(shift => (
                        <th key={shift.name} className="text-center p-3 font-medium">
                          <span className="flex flex-col items-center gap-1">
                            <span>{shift.icon}</span>
                            <span className="text-xs">{shift.label}</span>
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {WEEK_DAYS_FULL.map((dayName, dayIndex) => {
                      const libId = editingScheduleLibraryId || effectiveLibraryId;
                      
                      return (
                        <tr key={dayIndex} className="border-t">
                          <td className="p-3 font-medium">{dayName}</td>
                          {SHIFTS.map(shift => {
                            const schedule = expectedSchedule.find(
                              s => s.library_id === libId && 
                                   s.day_of_week === dayIndex && 
                                   s.shift_name === shift.name
                            );
                            const isOpen = schedule?.is_open ?? false;
                            
                            return (
                              <td key={shift.name} className="text-center p-3">
                                <Checkbox
                                  checked={isOpen}
                                  onCheckedChange={async (checked) => {
                                    try {
                                      const { error } = await (supabase as any)
                                        .from('library_expected_schedule')
                                        .upsert({
                                          library_id: libId,
                                          day_of_week: dayIndex,
                                          shift_name: shift.name,
                                          is_open: checked,
                                          created_by: user?.id,
                                        }, { onConflict: 'library_id,day_of_week,shift_name' });
                                      
                                      if (error) throw error;
                                      loadExpectedSchedule();
                                    } catch (error: any) {
                                      toast({
                                        title: 'Erro',
                                        description: error?.message || 'Não foi possível salvar.',
                                        variant: 'destructive',
                                      });
                                    }
                                  }}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-300">💡 Dica</p>
              <p className="text-muted-foreground mt-1">
                Marque os turnos em que a biblioteca deveria abrir. Isso será usado para calcular 
                a taxa de disponibilidade e identificar dias não preenchidos.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleConfigOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Configuração de Feriados */}
      <Dialog open={holidaysConfigOpen} onOpenChange={setHolidaysConfigOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Gerenciar Feriados
            </DialogTitle>
            <DialogDescription>
              Configure feriados nacionais e locais para sua biblioteca
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Botão para adicionar feriado */}
            <div className="flex justify-end">
              <Button 
                onClick={() => {
                  setCurrentHoliday({
                    name: '',
                    date: new Date().toISOString().split('T')[0],
                    recurring: false,
                    national: false,
                    library_id: effectiveLibraryId || null,
                    active: true,
                  });
                  setEditingHolidayId(null);
                  setHolidayDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Feriado
              </Button>
            </div>

            {/* Lista de feriados */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Feriados Cadastrados</h4>
              {holidays.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum feriado cadastrado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {holidays
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map(holiday => (
                      <div 
                        key={holiday.id} 
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🎉</span>
                          <div>
                            <p className="font-medium">{holiday.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {new Date(holiday.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'long',
                                })}
                              </span>
                              {holiday.recurring && (
                                <Badge variant="secondary" className="text-[10px]">Anual</Badge>
                              )}
                              {holiday.national && (
                                <Badge variant="outline" className="text-[10px]">Nacional</Badge>
                              )}
                              {holiday.library_id && (
                                <Badge variant="outline" className="text-[10px]">
                                  {libraries.find(l => l.id === holiday.library_id)?.name || 'Local'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setCurrentHoliday(holiday);
                              setEditingHolidayId(holiday.id || null);
                              setHolidayDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={async () => {
                              if (!confirm('Tem certeza que deseja excluir este feriado?')) return;
                              try {
                                const { error } = await (supabase as any)
                                  .from('holidays')
                                  .delete()
                                  .eq('id', holiday.id);
                                if (error) throw error;
                                toast({ title: 'Sucesso', description: 'Feriado excluído.' });
                                loadHolidays();
                              } catch (error: any) {
                                toast({ title: 'Erro', description: error?.message, variant: 'destructive' });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHolidaysConfigOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Adicionar/Editar Feriado */}
      <Dialog open={holidayDialogOpen} onOpenChange={setHolidayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingHolidayId ? 'Editar Feriado' : 'Novo Feriado'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes do feriado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Feriado *</Label>
              <Input
                placeholder="Ex: Carnaval, Dia da Independência..."
                value={currentHoliday.name || ''}
                onChange={(e) => setCurrentHoliday({ ...currentHoliday, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input
                type="date"
                value={currentHoliday.date || ''}
                onChange={(e) => setCurrentHoliday({ ...currentHoliday, date: e.target.value })}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={currentHoliday.recurring || false}
                onCheckedChange={(checked) => 
                  setCurrentHoliday({ ...currentHoliday, recurring: checked as boolean })
                }
              />
              <Label htmlFor="recurring" className="text-sm cursor-pointer">
                Feriado anual (repete todo ano na mesma data)
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="national"
                checked={currentHoliday.national || false}
                onCheckedChange={(checked) => 
                  setCurrentHoliday({ ...currentHoliday, national: checked as boolean })
                }
              />
              <Label htmlFor="national" className="text-sm cursor-pointer">
                Feriado nacional (aplica a todas as bibliotecas)
              </Label>
            </div>
            
            {!currentHoliday.national && isAdmin && (
              <div className="space-y-2">
                <Label>Biblioteca Específica</Label>
                <Select 
                  value={currentHoliday.library_id || 'all'} 
                  onValueChange={(value) => 
                    setCurrentHoliday({ ...currentHoliday, library_id: value === 'all' ? null : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a biblioteca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as bibliotecas</SelectItem>
                    {libraries.map(lib => (
                      <SelectItem key={lib.id} value={lib.id}>
                        {lib.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Deixe em "Todas as bibliotecas" para aplicar a toda a rede
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHolidayDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={async () => {
                if (!currentHoliday.name || !currentHoliday.date) {
                  toast({
                    title: 'Campos obrigatórios',
                    description: 'Preencha o nome e a data do feriado.',
                    variant: 'destructive',
                  });
                  return;
                }
                
                try {
                  setLoading(true);
                  
                  const data = {
                    name: currentHoliday.name,
                    date: currentHoliday.date,
                    recurring: currentHoliday.recurring || false,
                    national: currentHoliday.national || false,
                    library_id: currentHoliday.national ? null : (currentHoliday.library_id || null),
                    active: true,
                    created_by: user?.id,
                  };
                  
                  let error;
                  if (editingHolidayId) {
                    const result = await (supabase as any)
                      .from('holidays')
                      .update(data)
                      .eq('id', editingHolidayId);
                    error = result.error;
                  } else {
                    const result = await (supabase as any)
                      .from('holidays')
                      .insert(data);
                    error = result.error;
                  }
                  
                  if (error) throw error;
                  
                  toast({
                    title: 'Sucesso',
                    description: editingHolidayId ? 'Feriado atualizado.' : 'Feriado cadastrado.',
                  });
                  
                  setHolidayDialogOpen(false);
                  setCurrentHoliday({});
                  setEditingHolidayId(null);
                  loadHolidays();
                  
                } catch (error: any) {
                  toast({
                    title: 'Erro',
                    description: error?.message || 'Não foi possível salvar.',
                    variant: 'destructive',
                  });
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
