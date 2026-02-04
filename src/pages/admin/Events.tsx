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

type ShiftName = 'morning' | 'afternoon' | 'evening';

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
  day_notes?: string;
  staff_names?: string;
  was_expected?: boolean;
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
  valid_from?: string;
  valid_until?: string;
  notes?: string;
};

type LibraryClosure = {
  id?: string;
  library_id: string;
  name: string;
  closure_type: 'recess' | 'vacation' | 'maintenance' | 'other';
  start_date: string;
  end_date: string;
  reason?: string;
  active: boolean;
};

// Tipo para registro de abertura por turno no dialog
type ShiftOpeningStatus = {
  shift_name: ShiftName;
  opened: boolean | null; // null = não respondido
  opening_time: string;
  closing_time: string;
  notes: string;
  staff_names: string;
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
  
  // Estados para recessos/fechamentos
  const [closures, setClosures] = useState<LibraryClosure[]>([]);
  const [closureDialogOpen, setClosureDialogOpen] = useState(false);
  const [currentClosure, setCurrentClosure] = useState<Partial<LibraryClosure>>({});
  const [editingClosureId, setEditingClosureId] = useState<string | null>(null);
  const [closuresConfigOpen, setClosuresConfigOpen] = useState(false);
  
  // Estados para edição de múltiplos turnos de uma vez
  const [dayOpeningData, setDayOpeningData] = useState<{
    date: Date;
    dayNotes: string;
    shifts: ShiftOpeningStatus[];
  } | null>(null);
  
  // Estados para períodos de agenda
  const [schedulePeriodsDialogOpen, setSchedulePeriodsDialogOpen] = useState(false);
  const [currentSchedulePeriod, setCurrentSchedulePeriod] = useState<{
    valid_from?: string;
    valid_until?: string;
  } | null>(null);

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
      
      // Normalizar datas - converter strings vazias para null
      const normalizedData = (data || []).map((item: any) => ({
        ...item,
        valid_from: item.valid_from || null,
        valid_until: item.valid_until || null,
      }));
      
      console.log('Agenda carregada:', normalizedData);
      setExpectedSchedule(normalizedData);
    } catch (error) {
      console.error('Erro ao carregar agenda prevista:', error);
    }
  }, [effectiveLibraryId]);

  // Carregar recessos/fechamentos
  const loadClosures = useCallback(async () => {
    try {
      let query = (supabase as any)
        .from('library_closures')
        .select('*')
        .eq('active', true);
      
      if (effectiveLibraryId) {
        query = query.eq('library_id', effectiveLibraryId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setClosures(data || []);
    } catch (error) {
      console.error('Erro ao carregar recessos:', error);
    }
  }, [effectiveLibraryId]);

  // Verificar se uma data está em período de recesso/fechamento
  const isInClosure = useCallback((date: Date, libraryId?: string) => {
    const dateStr = formatDateKey(date);
    const libId = libraryId || effectiveLibraryId;
    
    return closures.find(c => {
      if (c.library_id !== libId) return false;
      return dateStr >= c.start_date && dateStr <= c.end_date;
    });
  }, [closures, effectiveLibraryId]);

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
    const dateStr = formatDateKey(date);
    const libId = libraryId || effectiveLibraryId;
    
    // Verificar se está em recesso/fechamento
    const closure = isInClosure(date, libId);
    if (closure) {
      return { expected: false, reason: `${closure.name}`, isClosure: true, closureType: closure.closure_type };
    }
    
    // Verificar se é feriado
    const holiday = isHoliday(date);
    if (holiday && (holiday.national || holiday.library_id === libId || !holiday.library_id)) {
      return { expected: false, reason: `Feriado: ${holiday.name}`, isHoliday: true };
    }
    
    // Verificar na agenda prevista considerando o período de validade
    const schedule = expectedSchedule.find(s => {
      if (s.library_id !== libId) return false;
      if (s.day_of_week !== dayOfWeek) return false;
      if (s.shift_name !== shiftName) return false;
      
      // Verificar período de validade
      if (s.valid_from && dateStr < s.valid_from) return false;
      if (s.valid_until && dateStr > s.valid_until) return false;
      
      return true;
    });
    
    if (!schedule) {
      return { expected: false, reason: 'Não programado', customTime: null };
    }
    
    return { 
      expected: schedule.is_open, 
      reason: schedule.is_open ? 'Programado para abrir' : 'Programado para fechar',
      customTime: schedule.custom_start_time && schedule.custom_end_time 
        ? { start: schedule.custom_start_time, end: schedule.custom_end_time }
        : null
    };
  }, [effectiveLibraryId, expectedSchedule, isHoliday, isInClosure]);

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
            l.shift_name === shift.name
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
        // Ignorar registros antigos sem shift_name ou com 'full_day'
        if (!log.shift_name || log.shift_name === 'full_day') {
          return;
        }
        logsMap[log.date].push({
          ...log,
          shift_name: log.shift_name
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
    loadClosures();
  }, [loadExpectedSchedule, loadClosures]);

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
    
    const dateKey = formatDateKey(date);
    const existingLogs = openingLogs[dateKey] || [];
    
    // Carregar dados existentes de todos os turnos
    const shiftsData: ShiftOpeningStatus[] = SHIFTS.map(shift => {
      const existingLog = existingLogs.find(l => 
        l.library_id === effectiveLibraryId && l.shift_name === shift.name
      );
      const expected = getExpectedOpening(date, shift.name, effectiveLibraryId);
      const customTime = expected.customTime;
      
      return {
        shift_name: shift.name,
        opened: existingLog ? existingLog.opened : null,
        opening_time: existingLog?.opening_time || customTime?.start || shift.startTime,
        closing_time: existingLog?.closing_time || customTime?.end || shift.endTime,
        notes: existingLog?.notes || '',
        staff_names: existingLog?.staff_names || '',
      };
    });
    
    // Buscar observações do dia (de qualquer log existente)
    const dayNotes = existingLogs.find(l => l.day_notes)?.day_notes || '';
    
    setSelectedDate(date);
    setCalendarLibraryId(effectiveLibraryId);
    setDayOpeningData({
      date,
      dayNotes,
      shifts: shiftsData,
    });
    
    // Se um turno específico foi clicado, destacá-lo
    if (shiftName) {
      setSelectedShift(shiftName);
    }
    
    setOpeningDialogOpen(true);
  };

  // Handler para clicar em um dia específico (abre dialog com opções de turno)
  const handleDayClickWithShifts = (date: Date) => {
    if (isAllLibraries) {
      handleAdminDayClick(date);
      return;
    }
    
    handleDayClick(date);
  };

  const handleSaveOpeningLog = async () => {
    const libraryToUse = isAdmin ? calendarLibraryId : effectiveLibraryId;
    
    if (!libraryToUse || !dayOpeningData?.date) {
      toast({
        title: 'Erro',
        description: 'Selecione uma biblioteca.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const dateKey = formatDateKey(dayOpeningData.date);
      
      // Separar turnos para salvar (marcados) e para deletar (desmarcados)
      const turnosParaSalvar = dayOpeningData.shifts.filter(s => s.opened !== null);
      const turnosParaDeletar = dayOpeningData.shifts.filter(s => s.opened === null);
      
      let salvos = 0;
      let deletados = 0;
      
      // Deletar turnos que foram desmarcados
      for (const shift of turnosParaDeletar) {
        const { error, count } = await (supabase as any)
          .from('library_opening_log')
          .delete()
          .eq('library_id', libraryToUse)
          .eq('date', dateKey)
          .eq('shift_name', shift.shift_name);
        
        if (error) {
          console.warn('Erro ao deletar turno:', error);
        } else if (count && count > 0) {
          deletados++;
        }
      }
      
      // Salvar turnos que foram respondidos
      for (const shift of turnosParaSalvar) {
        const expected = getExpectedOpening(dayOpeningData.date, shift.shift_name, libraryToUse);
        
        const { error } = await (supabase as any)
          .from('library_opening_log')
          .upsert({
            library_id: libraryToUse,
            date: dateKey,
            shift_name: shift.shift_name,
            opened: shift.opened,
            opening_time: shift.opening_time,
            closing_time: shift.closing_time,
            notes: shift.notes || null,
            day_notes: dayOpeningData.dayNotes || null,
            staff_names: shift.staff_names || null,
            was_expected: expected.expected,
            created_by: user?.id,
          }, { onConflict: 'library_id,date,shift_name' });
        
        if (error) throw error;
        salvos++;
      }

      // Mensagem de sucesso
      const mensagens = [];
      if (salvos > 0) mensagens.push(`${salvos} turno(s) salvo(s)`);
      if (deletados > 0) mensagens.push(`${deletados} turno(s) removido(s)`);
      
      toast({
        title: 'Sucesso',
        description: mensagens.length > 0 ? mensagens.join(', ') : 'Registro atualizado.',
      });

      setOpeningDialogOpen(false);
      setDayOpeningData(null);
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
    // Buscar apenas registros do turno específico (ignorar 'full_day' antigo)
    const log = logsForDate.find(l => 
      l.library_id === effectiveLibraryId && 
      l.shift_name === shiftName
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
                      const closure = isInClosure(date);
                      
                      // Cores baseadas no status
                      let bgColor = 'bg-gray-100 dark:bg-gray-800'; // Não esperado/padrão
                      let textColor = 'text-gray-400';
                      let icon = null;
                      let extraClass = '';
                      
                      // Só mostrar cores especiais se tiver log OU se for dia passado/hoje
                      if (status.hasLog) {
                        // Tem registro - mostrar resultado
                        if (status.isOpen === true) {
                          // ABRIU
                          if (!expected.expected) {
                            // Abriu em dia NÃO esperado - destaque especial!
                            bgColor = 'bg-cyan-100 dark:bg-cyan-900/40';
                            textColor = 'text-cyan-700 dark:text-cyan-400';
                            icon = <Sparkles className="h-2.5 w-2.5" />;
                            extraClass = 'ring-1 ring-cyan-400';
                          } else {
                            // Abriu em dia esperado - verde
                            bgColor = 'bg-green-100 dark:bg-green-900/40';
                            textColor = 'text-green-700 dark:text-green-400';
                            icon = <Check className="h-2.5 w-2.5" />;
                          }
                        } else if (status.isOpen === false) {
                          // NÃO ABRIU
                          if (expected.expected) {
                            // Não abriu em dia esperado - vermelho
                            bgColor = 'bg-red-100 dark:bg-red-900/40';
                            textColor = 'text-red-700 dark:text-red-400';
                            icon = <X className="h-2.5 w-2.5" />;
                          } else {
                            // Não abriu em dia não esperado - cinza
                            bgColor = 'bg-gray-200 dark:bg-gray-700';
                            textColor = 'text-gray-500';
                            icon = <X className="h-2.5 w-2.5" />;
                          }
                        }
                      } else if (expected.expected) {
                        // Não tem registro mas era esperado
                        if (isPast || isToday) {
                          // Dia passado/hoje sem resposta - pendente (âmbar)
                          bgColor = 'bg-amber-100 dark:bg-amber-900/40';
                          textColor = 'text-amber-700 dark:text-amber-400';
                          icon = <Clock className="h-2.5 w-2.5" />;
                        } else {
                          // Dia futuro esperado - azul claro
                          bgColor = 'bg-blue-50 dark:bg-blue-900/20';
                          textColor = 'text-blue-600 dark:text-blue-400';
                        }
                      }
                      // Se não era esperado e não tem log - mantém cinza padrão
                      
                      const isClickable = !closure || status.hasLog;
                      
                      return (
                        <button
                          key={shift.name}
                          onClick={() => handleDayClick(date, shift.name)}
                          className={cn(
                            "w-full flex items-center justify-between rounded px-1 py-0.5 transition-all",
                            bgColor, textColor, extraClass,
                            isClickable && "hover:opacity-80 cursor-pointer",
                            !isClickable && "opacity-40 cursor-default",
                            holiday && !status.hasLog && "opacity-30"
                          )}
                          title={`${shift.label}: ${expected.expected ? 'Esperado abrir' : expected.reason}${status.hasLog ? (status.isOpen ? ' - ABRIU' : ' - FECHOU') : ''}${!expected.expected && status.isOpen ? ' ⭐ EXTRA!' : ''}`}
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
          
          // Para modo "todas as bibliotecas", mostrar estatísticas baseadas nos turnos previstos
          if (isAllLibraries) {
            const dayOfWeek = date.getDay();
            
            // Calcular turnos previstos e realizados para cada biblioteca
            let totalExpected = 0;
            let totalOpened = 0;
            let totalClosed = 0;
            let totalPending = 0;
            
            libraries.forEach(lib => {
              const libSchedule = expectedSchedule.filter(s => s.library_id === lib.id && s.is_open);
              const libClosures = closures.filter(c => c.library_id === lib.id);
              
              // Verificar se está em recesso
              const inClosure = libClosures.some(c => dateKey >= c.start_date && dateKey <= c.end_date);
              if (inClosure) return;
              
              SHIFTS.forEach(shift => {
                const isExpected = libSchedule.some(s => 
                  s.day_of_week === dayOfWeek && s.shift_name === shift.name
                );
                
                if (isExpected) {
                  totalExpected++;
                  const log = logsForDate.find(l => l.library_id === lib.id && l.shift_name === shift.name);
                  
                  if (log) {
                    if (log.opened) {
                      totalOpened++;
                    } else {
                      totalClosed++;
                    }
                  } else if (isPast || isToday) {
                    totalPending++;
                  }
                }
              });
            });
            
            const hasActivity = totalExpected > 0;
            const complianceRate = totalExpected > 0 ? Math.round((totalOpened / totalExpected) * 100) : 0;
            
            // Definir cor de fundo baseada na taxa de cumprimento
            let bgClass = "bg-card hover:bg-muted/50";
            if (hasActivity && (isPast || isToday)) {
              if (complianceRate >= 80) bgClass = "bg-green-50 dark:bg-green-900/20";
              else if (complianceRate >= 50) bgClass = "bg-amber-50 dark:bg-amber-900/20";
              else if (complianceRate > 0) bgClass = "bg-red-50 dark:bg-red-900/20";
              else bgClass = "bg-slate-100 dark:bg-slate-800/50";
            }
            
            return (
              <button
                key={dateKey}
                onClick={() => handleAdminDayClick(date)}
                className={cn(
                  "h-16 md:h-[72px] rounded p-0.5 text-xs font-medium transition-all flex flex-col items-center justify-start",
                  "hover:ring-1 hover:ring-primary/50 focus:outline-none focus:ring-1 focus:ring-primary",
                  isToday && "ring-2 ring-primary",
                  holiday && "bg-purple-50 dark:bg-purple-900/20",
                  !holiday && bgClass
                )}
                title={`${totalOpened}/${totalExpected} turnos abertos (${complianceRate}%)`}
              >
                <span className="text-[11px] font-semibold">{date.getDate()}</span>
                {holiday && <span className="text-[7px]">🎉</span>}
                {hasActivity && (isPast || isToday) && !holiday && (
                  <div className="flex flex-col items-center gap-0.5 mt-0.5">
                    {/* Taxa de abertura */}
                    <span className={cn(
                      "text-[9px] font-bold",
                      complianceRate >= 80 ? "text-green-600" : 
                      complianceRate >= 50 ? "text-amber-600" : "text-red-600"
                    )}>
                      {complianceRate}%
                    </span>
                    {/* Detalhes */}
                    <div className="flex items-center gap-[2px]">
                      {totalOpened > 0 && (
                        <span className="text-[7px] bg-green-500 text-white rounded px-[2px]">{totalOpened}</span>
                      )}
                      {totalClosed > 0 && (
                        <span className="text-[7px] bg-red-500 text-white rounded px-[2px]">{totalClosed}</span>
                      )}
                      {totalPending > 0 && (
                        <span className="text-[7px] bg-gray-400 text-white rounded px-[2px]">{totalPending}</span>
                      )}
                    </div>
                    {/* Total esperado */}
                    <span className="text-[7px] text-muted-foreground">/{totalExpected}</span>
                  </div>
                )}
                {hasActivity && !isPast && !isToday && !holiday && (
                  <span className="text-[8px] text-blue-500 mt-1">{totalExpected} prev.</span>
                )}
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
          {/* Card de Estatísticas - Visão Admin (Todas as Bibliotecas) */}
          {isAllLibraries && (
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200">
              <CardContent className="pt-4">
                {(() => {
                  // Calcular estatísticas agregadas de todas as bibliotecas
                  const days = getDaysInMonth(currentDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  let totalExpected = 0;
                  let totalAnswered = 0;
                  let totalOpened = 0;
                  let totalClosed = 0;
                  
                  const libraryData: Array<{
                    id: string;
                    name: string;
                    expected: number;
                    opened: number;
                    closed: number;
                    pending: number;
                    rate: number;
                  }> = [];
                  
                  libraries.forEach(lib => {
                    let libExpected = 0;
                    let libOpened = 0;
                    let libClosed = 0;
                    
                    const libSchedule = expectedSchedule.filter(s => s.library_id === lib.id && s.is_open);
                    const libClosures = closures.filter(c => c.library_id === lib.id);
                    
                    days.forEach(date => {
                      if (!date || date > today) return;
                      
                      const dateKey = formatDateKey(date);
                      const dayOfWeek = date.getDay();
                      const inClosure = libClosures.some(c => dateKey >= c.start_date && dateKey <= c.end_date);
                      
                      if (inClosure) return;
                      
                      SHIFTS.forEach(shift => {
                        const isExpected = libSchedule.some(s => 
                          s.day_of_week === dayOfWeek && s.shift_name === shift.name
                        );
                        
                        if (isExpected) {
                          libExpected++;
                          totalExpected++;
                          
                          const logs = openingLogs[dateKey] || [];
                          const log = logs.find(l => l.library_id === lib.id && l.shift_name === shift.name);
                          
                          if (log) {
                            totalAnswered++;
                            if (log.opened) {
                              libOpened++;
                              totalOpened++;
                            } else {
                              libClosed++;
                              totalClosed++;
                            }
                          }
                        }
                      });
                    });
                    
                    if (libExpected > 0) {
                      libraryData.push({
                        id: lib.id,
                        name: lib.name,
                        expected: libExpected,
                        opened: libOpened,
                        closed: libClosed,
                        pending: libExpected - libOpened - libClosed,
                        rate: Math.round((libOpened / libExpected) * 100),
                      });
                    }
                  });
                  
                  // Ordenar por taxa de abertura (menor primeiro para destacar problemas)
                  libraryData.sort((a, b) => a.rate - b.rate);
                  
                  const overallRate = totalExpected > 0 ? Math.round((totalOpened / totalExpected) * 100) : 0;
                  const pendingTotal = totalExpected - totalAnswered;
                  
                  return (
                    <div className="space-y-4">
                      {/* Resumo Geral */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
                          <div className="text-2xl font-bold text-indigo-600">{overallRate}%</div>
                          <div className="text-xs text-muted-foreground">Taxa Geral</div>
                        </div>
                        <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
                          <div className="text-2xl font-bold text-green-600">{totalOpened}</div>
                          <div className="text-xs text-muted-foreground">Turnos Abertos</div>
                        </div>
                        <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
                          <div className="text-2xl font-bold text-red-600">{totalClosed}</div>
                          <div className="text-xs text-muted-foreground">Turnos Fechados</div>
                        </div>
                        <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
                          <div className="text-2xl font-bold text-amber-600">{pendingTotal}</div>
                          <div className="text-xs text-muted-foreground">Sem Resposta</div>
                        </div>
                        <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
                          <div className="text-2xl font-bold text-blue-600">{totalExpected}</div>
                          <div className="text-xs text-muted-foreground">Total Esperado</div>
                        </div>
                      </div>
                      
                      {/* Grid de Bibliotecas - 3 por linha */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {libraryData.map((lib) => (
                          <button
                            key={lib.id}
                            onClick={() => setSelectedLibraryId(lib.id)}
                            className={cn(
                              "p-2 rounded-lg border flex items-center justify-between gap-1 text-left transition-all hover:border-primary",
                              lib.pending > 0 
                                ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs truncate" title={lib.name}>
                                {lib.name}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <span className="text-green-600">{lib.opened}✓</span>
                                {lib.closed > 0 && <span className="text-red-600">{lib.closed}✗</span>}
                                <span>/{lib.expected}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Badge 
                                variant={lib.rate >= 80 ? "default" : lib.rate >= 50 ? "secondary" : "destructive"}
                                className="text-[9px] px-1 h-5"
                              >
                                {lib.rate}%
                              </Badge>
                              {lib.pending > 0 ? (
                                <Badge variant="outline" className="text-[9px] px-1 h-5 text-amber-600 border-amber-400">
                                  {lib.pending}
                                </Badge>
                              ) : (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
          
          {/* Card de Estatísticas de Disponibilidade - Biblioteca específica */}
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
                      <span className="text-[9px] font-bold text-green-600">%</span>
                      <span>Taxa de abertura</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] bg-green-500 text-white rounded px-1 py-0.5">N</span>
                      <span>Turnos abertos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] bg-red-500 text-white rounded px-1 py-0.5">N</span>
                      <span>Fechados (previsto)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] bg-gray-400 text-white rounded px-1 py-0.5">N</span>
                      <span>Pendentes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-muted-foreground">/N</span>
                      <span>Total previsto</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-green-50 dark:bg-green-900/20 border border-green-200" />
                      <span>≥80%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200" />
                      <span>50-79%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-200" />
                      <span>&lt;50%</span>
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
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-cyan-100 dark:bg-cyan-900/40 ring-1 ring-cyan-400" />
                      <span>Abriu extra! ⭐</span>
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

      {/* Dialog: Registro de Abertura por Turno */}
      <Dialog open={openingDialogOpen} onOpenChange={(open) => {
        setOpeningDialogOpen(open);
        if (!open) setDayOpeningData(null);
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Registro de {selectedDate?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </DialogTitle>
            <DialogDescription>
              {(() => {
                if (!selectedDate) return 'Informe se a biblioteca abriu em cada turno';
                const holiday = isHoliday(selectedDate);
                const closure = isInClosure(selectedDate);
                if (holiday) return `🎉 Feriado: ${holiday.name} - Registre mesmo assim se a biblioteca abriu`;
                if (closure) return `📅 ${closure.name} - Registre mesmo assim se a biblioteca abriu`;
                return 'Informe se a biblioteca abriu em cada turno';
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Seletor de Biblioteca (apenas para admin) */}
            {isAdmin && (
              <div className="space-y-2">
                <Label>Biblioteca *</Label>
                <Select value={calendarLibraryId} onValueChange={(value) => {
                  setCalendarLibraryId(value);
                  // Recarregar dados dos turnos para a nova biblioteca
                  if (selectedDate) {
                    const dateKey = formatDateKey(selectedDate);
                    const existingLogs = openingLogs[dateKey] || [];
                    const shiftsData: ShiftOpeningStatus[] = SHIFTS.map(shift => {
                      const existingLog = existingLogs.find(l => l.library_id === value && l.shift_name === shift.name);
                      return {
                        shift_name: shift.name,
                        opened: existingLog ? existingLog.opened : null,
                        opening_time: existingLog?.opening_time || shift.startTime,
                        closing_time: existingLog?.closing_time || shift.endTime,
                        notes: existingLog?.notes || '',
                        staff_names: existingLog?.staff_names || '',
                      };
                    });
                    setDayOpeningData(prev => prev ? { ...prev, shifts: shiftsData } : null);
                  }
                }}>
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
            
            {/* Turnos do dia */}
            {dayOpeningData && (
              <div className="space-y-4">
                {SHIFTS.map((shift, index) => {
                  const shiftData = dayOpeningData.shifts.find(s => s.shift_name === shift.name);
                  const expected = selectedDate 
                    ? getExpectedOpening(selectedDate, shift.name, calendarLibraryId || effectiveLibraryId)
                    : { expected: false, reason: '' };
                  
                  const isAnswered = shiftData?.opened !== null;
                  const isOpen = shiftData?.opened === true;
                  const isClosed = shiftData?.opened === false;
                  
                  return (
                    <div 
                      key={shift.name}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all",
                        isOpen && "border-green-500 bg-green-50 dark:bg-green-900/20",
                        isClosed && "border-red-500 bg-red-50 dark:bg-red-900/20",
                        !isAnswered && expected.expected && "border-blue-300 bg-blue-50 dark:bg-blue-900/10",
                        !isAnswered && !expected.expected && "border-muted bg-muted/30"
                      )}
                    >
                      {/* Cabeçalho do turno */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{shift.icon}</span>
                          <div>
                            <span className="font-semibold">{shift.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({shiftData?.opening_time || shift.startTime} - {shiftData?.closing_time || shift.endTime})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {expected.expected ? (
                            <Badge variant="secondary" className="text-[10px]">Programado</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">{expected.reason || 'Não programado'}</Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Botões de resposta */}
                      <div className="flex items-center gap-2 mb-3">
                        <Button
                          type="button"
                          variant={isOpen ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "flex-1",
                            isOpen && "bg-green-600 hover:bg-green-700"
                          )}
                          onClick={() => {
                            // Toggle: se já está marcado como true, desmarca (null)
                            const newValue = isOpen ? null : true;
                            const updatedShifts = dayOpeningData.shifts.map(s => 
                              s.shift_name === shift.name ? { ...s, opened: newValue } : s
                            );
                            setDayOpeningData({ ...dayOpeningData, shifts: updatedShifts });
                          }}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Abriu
                        </Button>
                        <Button
                          type="button"
                          variant={isClosed ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "flex-1",
                            isClosed && "bg-red-600 hover:bg-red-700"
                          )}
                          onClick={() => {
                            // Toggle: se já está marcado como false, desmarca (null)
                            const newValue = isClosed ? null : false;
                            const updatedShifts = dayOpeningData.shifts.map(s => 
                              s.shift_name === shift.name ? { ...s, opened: newValue } : s
                            );
                            setDayOpeningData({ ...dayOpeningData, shifts: updatedShifts });
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Não abriu
                        </Button>
                      </div>
                      
                      {/* Detalhes quando abriu */}
                      {isOpen && (
                        <div className="space-y-3 pt-3 border-t">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Horário Abertura</Label>
                              <Input
                                type="time"
                                value={shiftData?.opening_time || shift.startTime}
                                onChange={(e) => {
                                  const updatedShifts = dayOpeningData.shifts.map(s => 
                                    s.shift_name === shift.name ? { ...s, opening_time: e.target.value } : s
                                  );
                                  setDayOpeningData({ ...dayOpeningData, shifts: updatedShifts });
                                }}
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Horário Fechamento</Label>
                              <Input
                                type="time"
                                value={shiftData?.closing_time || shift.endTime}
                                onChange={(e) => {
                                  const updatedShifts = dayOpeningData.shifts.map(s => 
                                    s.shift_name === shift.name ? { ...s, closing_time: e.target.value } : s
                                  );
                                  setDayOpeningData({ ...dayOpeningData, shifts: updatedShifts });
                                }}
                                className="h-8"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Equipe</Label>
                            <Input
                              placeholder="Ex: Maria, João..."
                              value={shiftData?.staff_names || ''}
                              onChange={(e) => {
                                const updatedShifts = dayOpeningData.shifts.map(s => 
                                  s.shift_name === shift.name ? { ...s, staff_names: e.target.value } : s
                                );
                                setDayOpeningData({ ...dayOpeningData, shifts: updatedShifts });
                              }}
                              className="h-8"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Observações do turno (sempre visível se respondido) */}
                      {isAnswered && (
                        <div className="space-y-1 pt-3">
                          <Label className="text-xs">Observações do turno</Label>
                          <Input
                            placeholder={isClosed ? "Motivo do fechamento..." : "Observações..."}
                            value={shiftData?.notes || ''}
                            onChange={(e) => {
                              const updatedShifts = dayOpeningData.shifts.map(s => 
                                s.shift_name === shift.name ? { ...s, notes: e.target.value } : s
                              );
                              setDayOpeningData({ ...dayOpeningData, shifts: updatedShifts });
                            }}
                            className="h-8"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                
                <Separator />
                
                {/* Observações do dia todo */}
                <div className="space-y-2">
                  <Label>Observações gerais do dia</Label>
                  <Textarea
                    placeholder="Anotações gerais sobre este dia (opcional)"
                    value={dayOpeningData.dayNotes || ''}
                    onChange={(e) => setDayOpeningData({ ...dayOpeningData, dayNotes: e.target.value })}
                    rows={2}
                  />
                </div>
                
                {/* Botões de ação rápida */}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updatedShifts = dayOpeningData.shifts.map(s => {
                        const expected = selectedDate ? getExpectedOpening(selectedDate, s.shift_name) : { expected: false };
                        return expected.expected ? { ...s, opened: true } : s;
                      });
                      setDayOpeningData({ ...dayOpeningData, shifts: updatedShifts });
                    }}
                    className="text-xs"
                  >
                    ✅ Marcar esperados como abertos
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updatedShifts = dayOpeningData.shifts.map(s => {
                        const expected = selectedDate ? getExpectedOpening(selectedDate, s.shift_name) : { expected: false };
                        return expected.expected ? { ...s, opened: false } : s;
                      });
                      setDayOpeningData({ ...dayOpeningData, shifts: updatedShifts });
                    }}
                    className="text-xs"
                  >
                    ❌ Marcar esperados como fechados
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setOpeningDialogOpen(false);
              setDayOpeningData(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveOpeningLog} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Registro'}
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
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Configurar Agenda de Abertura
            </DialogTitle>
            <DialogDescription>
              Defina os dias, turnos e horários em que a biblioteca deve abrir
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
                    setCurrentSchedulePeriod(null); // Resetar período ao trocar biblioteca
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

            {/* Lista de Períodos Cadastrados */}
            {(() => {
              const libId = editingScheduleLibraryId || effectiveLibraryId;
              
              // Agrupar schedules por período
              const periods = expectedSchedule
                .filter(s => s.library_id === libId)
                .reduce((acc: { key: string; valid_from: string | null; valid_until: string | null; count: number }[], s) => {
                  const key = `${s.valid_from || 'null'}_${s.valid_until || 'null'}`;
                  const existing = acc.find(p => p.key === key);
                  if (existing) {
                    existing.count++;
                  } else {
                    acc.push({ 
                      key, 
                      valid_from: s.valid_from || null, 
                      valid_until: s.valid_until || null,
                      count: 1 
                    });
                  }
                  return acc;
                }, []);
              
              // Ordenar: permanente primeiro, depois por data
              periods.sort((a, b) => {
                if (!a.valid_from && !a.valid_until) return -1;
                if (!b.valid_from && !b.valid_until) return 1;
                return (a.valid_from || '').localeCompare(b.valid_from || '');
              });

              const selectedPeriodKey = currentSchedulePeriod 
                ? `${currentSchedulePeriod.valid_from || 'null'}_${currentSchedulePeriod.valid_until || 'null'}`
                : 'null_null';

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">📅 Períodos de Agenda</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentSchedulePeriod({ 
                        valid_from: new Date().toISOString().split('T')[0], 
                        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      })}
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Novo Período
                    </Button>
                  </div>
                  
                  {/* Cards de períodos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {/* Período Permanente (sempre disponível) */}
                    <button
                      onClick={() => setCurrentSchedulePeriod(null)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-left transition-all",
                        selectedPeriodKey === 'null_null'
                          ? "border-primary bg-primary/10"
                          : "border-muted hover:border-primary/50"
                      )}
                    >
                      <div className="font-medium text-sm">📆 Agenda Permanente</div>
                      <div className="text-xs text-muted-foreground">Válida sempre (padrão)</div>
                      {periods.find(p => !p.valid_from && !p.valid_until) && (
                        <Badge variant="secondary" className="mt-1 text-[10px]">
                          {periods.find(p => !p.valid_from && !p.valid_until)?.count || 0} turnos configurados
                        </Badge>
                      )}
                    </button>
                    
                    {/* Períodos específicos cadastrados */}
                    {periods.filter(p => p.valid_from || p.valid_until).map(period => (
                      <button
                        key={period.key}
                        onClick={() => setCurrentSchedulePeriod({ 
                          valid_from: period.valid_from || '', 
                          valid_until: period.valid_until || '' 
                        })}
                        className={cn(
                          "p-3 rounded-lg border-2 text-left transition-all relative group",
                          selectedPeriodKey === period.key
                            ? "border-primary bg-primary/10"
                            : "border-muted hover:border-primary/50"
                        )}
                      >
                        <div className="font-medium text-sm">📅 Período Específico</div>
                        <div className="text-xs text-muted-foreground">
                          {period.valid_from ? new Date(period.valid_from + 'T00:00:00').toLocaleDateString('pt-BR') : '...'}
                          {' → '}
                          {period.valid_until ? new Date(period.valid_until + 'T00:00:00').toLocaleDateString('pt-BR') : '...'}
                        </div>
                        <Badge variant="secondary" className="mt-1 text-[10px]">
                          {period.count} turnos configurados
                        </Badge>
                        {/* Botão deletar período */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm('Deletar este período e todas suas configurações?')) return;
                            try {
                              let query = (supabase as any)
                                .from('library_expected_schedule')
                                .delete()
                                .eq('library_id', libId);
                              
                              if (period.valid_from) {
                                query = query.eq('valid_from', period.valid_from);
                              } else {
                                query = query.is('valid_from', null);
                              }
                              if (period.valid_until) {
                                query = query.eq('valid_until', period.valid_until);
                              } else {
                                query = query.is('valid_until', null);
                              }
                              
                              const { error } = await query;
                              if (error) throw error;
                              
                              toast({ title: 'Período removido' });
                              loadExpectedSchedule();
                              setCurrentSchedulePeriod(null);
                            } catch (error: any) {
                              toast({ title: 'Erro', description: error?.message, variant: 'destructive' });
                            }
                          }}
                        >
                          <X className="h-3 w-3 text-red-500" />
                        </Button>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Edição do período selecionado (se for novo período) */}
            {currentSchedulePeriod && (currentSchedulePeriod.valid_from || currentSchedulePeriod.valid_until) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
                <Label className="text-amber-800 dark:text-amber-300 font-medium mb-2 block">
                  ✏️ Editando Período
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Data Início</Label>
                    <Input
                      type="date"
                      value={currentSchedulePeriod.valid_from || ''}
                      onChange={(e) => setCurrentSchedulePeriod({ ...currentSchedulePeriod, valid_from: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data Fim</Label>
                    <Input
                      type="date"
                      value={currentSchedulePeriod.valid_until || ''}
                      onChange={(e) => setCurrentSchedulePeriod({ ...currentSchedulePeriod, valid_until: e.target.value })}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Configure os turnos abaixo para este período específico.
                </p>
              </div>
            )}

            {/* Tabela de configuração por dia/turno com horários */}
            {(editingScheduleLibraryId || effectiveLibraryId) && (
              <div className="border rounded-lg overflow-x-auto">
                <div className="bg-muted/30 px-3 py-2 border-b">
                  <span className="text-sm font-medium">
                    {currentSchedulePeriod && (currentSchedulePeriod.valid_from || currentSchedulePeriod.valid_until)
                      ? `📅 Configuração para: ${currentSchedulePeriod.valid_from ? new Date(currentSchedulePeriod.valid_from + 'T00:00:00').toLocaleDateString('pt-BR') : '...'} → ${currentSchedulePeriod.valid_until ? new Date(currentSchedulePeriod.valid_until + 'T00:00:00').toLocaleDateString('pt-BR') : '...'}`
                      : '📆 Configuração da Agenda Permanente'
                    }
                  </span>
                </div>
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium w-28">Dia</th>
                      {SHIFTS.map(shift => (
                        <th key={shift.name} className="text-center p-2 font-medium">
                          <span className="flex flex-col items-center gap-0.5">
                            <span>{shift.icon} {shift.label}</span>
                            <span className="text-[10px] text-muted-foreground font-normal">
                              Padrão: {shift.startTime}-{shift.endTime}
                            </span>
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
                          <td className="p-2 font-medium text-xs">{dayName}</td>
                          {SHIFTS.map(shift => {
                            // Normalizar datas para comparação
                            const targetValidFrom = currentSchedulePeriod?.valid_from || null;
                            const targetValidUntil = currentSchedulePeriod?.valid_until || null;
                            
                            const schedule = expectedSchedule.find(
                              s => {
                                if (s.library_id !== libId) return false;
                                if (s.day_of_week !== dayIndex) return false;
                                if (s.shift_name !== shift.name) return false;
                                
                                // Comparar datas considerando NULL
                                const sValidFrom = s.valid_from || null;
                                const sValidUntil = s.valid_until || null;
                                
                                if (targetValidFrom === null && targetValidUntil === null) {
                                  // Sem período definido - buscar registros sem período
                                  return sValidFrom === null && sValidUntil === null;
                                }
                                
                                return sValidFrom === targetValidFrom && sValidUntil === targetValidUntil;
                              }
                            );
                            const isOpen = schedule?.is_open ?? false;
                            
                            return (
                              <td key={shift.name} className="p-2">
                                <div className="flex flex-col items-center gap-1">
                                  <Checkbox
                                    checked={isOpen}
                                    onCheckedChange={async (checked) => {
                                      try {
                                        if (schedule?.id) {
                                          // Registro existe - atualizar
                                          const { error } = await (supabase as any)
                                            .from('library_expected_schedule')
                                            .update({ is_open: checked })
                                            .eq('id', schedule.id);
                                          if (error) throw error;
                                        } else {
                                          // Registro não existe - primeiro deletar qualquer duplicata, depois inserir
                                          let deleteQuery = (supabase as any)
                                            .from('library_expected_schedule')
                                            .delete()
                                            .eq('library_id', libId)
                                            .eq('day_of_week', dayIndex)
                                            .eq('shift_name', shift.name);
                                          
                                          if (targetValidFrom) {
                                            deleteQuery = deleteQuery.eq('valid_from', targetValidFrom);
                                          } else {
                                            deleteQuery = deleteQuery.is('valid_from', null);
                                          }
                                          if (targetValidUntil) {
                                            deleteQuery = deleteQuery.eq('valid_until', targetValidUntil);
                                          } else {
                                            deleteQuery = deleteQuery.is('valid_until', null);
                                          }
                                          
                                          await deleteQuery;
                                          
                                          // Inserir novo registro
                                          const insertData: any = {
                                            library_id: libId,
                                            day_of_week: dayIndex,
                                            shift_name: shift.name,
                                            is_open: checked,
                                            created_by: user?.id,
                                          };
                                          
                                          if (targetValidFrom) insertData.valid_from = targetValidFrom;
                                          if (targetValidUntil) insertData.valid_until = targetValidUntil;
                                          
                                          const { error } = await (supabase as any)
                                            .from('library_expected_schedule')
                                            .insert(insertData);
                                          if (error) throw error;
                                        }
                                        
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
                                  {isOpen && (
                                    <div className="flex gap-1">
                                      <Input
                                        type="time"
                                        value={schedule?.custom_start_time || shift.startTime}
                                        onChange={async (e) => {
                                          if (!schedule?.id) return;
                                          try {
                                            const { error } = await (supabase as any)
                                              .from('library_expected_schedule')
                                              .update({ custom_start_time: e.target.value })
                                              .eq('id', schedule.id);
                                            if (error) throw error;
                                            loadExpectedSchedule();
                                          } catch (error: any) {
                                            toast({ title: 'Erro', description: error?.message, variant: 'destructive' });
                                          }
                                        }}
                                        className="h-6 w-20 text-[10px] p-1"
                                      />
                                      <Input
                                        type="time"
                                        value={schedule?.custom_end_time || shift.endTime}
                                        onChange={async (e) => {
                                          if (!schedule?.id) return;
                                          try {
                                            const { error } = await (supabase as any)
                                              .from('library_expected_schedule')
                                              .update({ custom_end_time: e.target.value })
                                              .eq('id', schedule.id);
                                            if (error) throw error;
                                            loadExpectedSchedule();
                                          } catch (error: any) {
                                            toast({ title: 'Erro', description: error?.message, variant: 'destructive' });
                                          }
                                        }}
                                        className="h-6 w-20 text-[10px] p-1"
                                      />
                                    </div>
                                  )}
                                </div>
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

            {/* Gerenciar Recessos */}
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-purple-800 dark:text-purple-300 font-medium">
                    🏖️ Recessos e Férias
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cadastre períodos em que a biblioteca não abrirá
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClosuresConfigOpen(true)}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Gerenciar
                </Button>
              </div>
              {closures.length > 0 && (
                <div className="mt-2 space-y-1">
                  {closures.slice(0, 3).map(c => (
                    <div key={c.id} className="text-xs flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {c.closure_type === 'recess' ? '📅' : c.closure_type === 'vacation' ? '🏖️' : '🔧'}
                      </Badge>
                      <span>{c.name}</span>
                      <span className="text-muted-foreground">
                        ({new Date(c.start_date + 'T00:00:00').toLocaleDateString('pt-BR')} - {new Date(c.end_date + 'T00:00:00').toLocaleDateString('pt-BR')})
                      </span>
                    </div>
                  ))}
                  {closures.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{closures.length - 3} mais...</span>
                  )}
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-300">💡 Dica</p>
              <p className="text-muted-foreground mt-1">
                Use a <strong>Agenda Permanente</strong> para configurações que valem sempre. 
                Crie <strong>Períodos Específicos</strong> para épocas com horários diferentes (férias, verão, etc).
                O período mais específico terá prioridade.
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

      {/* Dialog: Gerenciar Recessos */}
      <Dialog open={closuresConfigOpen} onOpenChange={setClosuresConfigOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Gerenciar Recessos e Férias
            </DialogTitle>
            <DialogDescription>
              Cadastre períodos em que a biblioteca não abrirá
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Botão para adicionar recesso */}
            <div className="flex justify-end">
              <Button 
                onClick={() => {
                  setCurrentClosure({
                    name: '',
                    closure_type: 'recess',
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: new Date().toISOString().split('T')[0],
                    library_id: editingScheduleLibraryId || effectiveLibraryId,
                    active: true,
                  });
                  setEditingClosureId(null);
                  setClosureDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Recesso
              </Button>
            </div>

            {/* Lista de recessos */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Recessos Cadastrados</h4>
              {closures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum recesso cadastrado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {closures
                    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                    .map(closure => (
                      <div 
                        key={closure.id} 
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {closure.closure_type === 'recess' ? '📅' : 
                             closure.closure_type === 'vacation' ? '🏖️' : 
                             closure.closure_type === 'maintenance' ? '🔧' : '📋'}
                          </span>
                          <div>
                            <p className="font-medium">{closure.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {new Date(closure.start_date + 'T00:00:00').toLocaleDateString('pt-BR')} até{' '}
                                {new Date(closure.end_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </span>
                              <Badge variant="secondary" className="text-[10px]">
                                {closure.closure_type === 'recess' ? 'Recesso' : 
                                 closure.closure_type === 'vacation' ? 'Férias' : 
                                 closure.closure_type === 'maintenance' ? 'Manutenção' : 'Outro'}
                              </Badge>
                            </div>
                            {closure.reason && (
                              <p className="text-xs text-muted-foreground mt-1">{closure.reason}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setCurrentClosure(closure);
                              setEditingClosureId(closure.id || null);
                              setClosureDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={async () => {
                              if (!confirm('Tem certeza que deseja excluir este recesso?')) return;
                              try {
                                const { error } = await (supabase as any)
                                  .from('library_closures')
                                  .delete()
                                  .eq('id', closure.id);
                                if (error) throw error;
                                toast({ title: 'Sucesso', description: 'Recesso excluído.' });
                                loadClosures();
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
            <Button variant="outline" onClick={() => setClosuresConfigOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Adicionar/Editar Recesso */}
      <Dialog open={closureDialogOpen} onOpenChange={setClosureDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingClosureId ? 'Editar Recesso' : 'Novo Recesso'}
            </DialogTitle>
            <DialogDescription>
              Configure o período de fechamento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: Recesso de Fim de Ano, Férias de Julho..."
                value={currentClosure.name || ''}
                onChange={(e) => setCurrentClosure({ ...currentClosure, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select 
                value={currentClosure.closure_type || 'recess'} 
                onValueChange={(value) => setCurrentClosure({ ...currentClosure, closure_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recess">📅 Recesso</SelectItem>
                  <SelectItem value="vacation">🏖️ Férias</SelectItem>
                  <SelectItem value="maintenance">🔧 Manutenção</SelectItem>
                  <SelectItem value="other">📋 Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início *</Label>
                <Input
                  type="date"
                  value={currentClosure.start_date || ''}
                  onChange={(e) => setCurrentClosure({ ...currentClosure, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim *</Label>
                <Input
                  type="date"
                  value={currentClosure.end_date || ''}
                  onChange={(e) => setCurrentClosure({ ...currentClosure, end_date: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea
                placeholder="Ex: Reformas na biblioteca, Férias coletivas..."
                value={currentClosure.reason || ''}
                onChange={(e) => setCurrentClosure({ ...currentClosure, reason: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClosureDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={async () => {
                if (!currentClosure.name || !currentClosure.start_date || !currentClosure.end_date) {
                  toast({
                    title: 'Campos obrigatórios',
                    description: 'Preencha o nome e as datas.',
                    variant: 'destructive',
                  });
                  return;
                }
                
                try {
                  setLoading(true);
                  
                  const libId = currentClosure.library_id || editingScheduleLibraryId || effectiveLibraryId;
                  
                  const data = {
                    library_id: libId,
                    name: currentClosure.name,
                    closure_type: currentClosure.closure_type || 'recess',
                    start_date: currentClosure.start_date,
                    end_date: currentClosure.end_date,
                    reason: currentClosure.reason || null,
                    active: true,
                    created_by: user?.id,
                  };
                  
                  let error;
                  if (editingClosureId) {
                    const result = await (supabase as any)
                      .from('library_closures')
                      .update(data)
                      .eq('id', editingClosureId);
                    error = result.error;
                  } else {
                    const result = await (supabase as any)
                      .from('library_closures')
                      .insert(data);
                    error = result.error;
                  }
                  
                  if (error) throw error;
                  
                  toast({
                    title: 'Sucesso',
                    description: editingClosureId ? 'Recesso atualizado.' : 'Recesso cadastrado.',
                  });
                  
                  setClosureDialogOpen(false);
                  setCurrentClosure({});
                  setEditingClosureId(null);
                  loadClosures();
                  
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
