import { useState, useEffect, useCallback } from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import {
  Building2,
  BookOpen,
  Users,
  ArrowLeftRight,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Sparkles,
  BookMarked,
  Eye,
  FileText,
  Check,
  Clock,
  Target,
  Download,
  X,
  ChevronRight,
  Sunrise,
  Sun,
  Moon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEK_DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const SHIFTS = [
  { name: 'morning', label: 'Manhã', Icon: Sunrise, startTime: '08:00', endTime: '12:00' },
  { name: 'afternoon', label: 'Tarde', Icon: Sun, startTime: '13:00', endTime: '18:00' },
  { name: 'evening', label: 'Noite', Icon: Moon, startTime: '18:00', endTime: '22:00' },
] as const;

type ShiftName = 'morning' | 'afternoon' | 'evening';
type ExpectedSchedule = {
  dayOfWeek: number;
  shift: ShiftName;
  isExpected: boolean;
};
type OpeningStatus = {
  date: string;
  shift: ShiftName;
  opened: boolean | null;
  isExpected?: boolean;
  isInClosure?: boolean;
  id?: string;
};

type Closure = {
  id: string;
  start_date: string;
  end_date: string;
  name: string;
};

type LibraryStats = {
  id: string;
  name: string;
  totalExpected: number;
  totalAnswered: number;
  totalOpened: number;
  totalClosed: number;
  pendingCount: number;
  openingRate: number;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Estados principais
  const [activeLibraries, setActiveLibraries] = useState(0);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalCopies, setTotalCopies] = useState(0);
  const [totalReaders, setTotalReaders] = useState(0);
  const [activeLoans, setActiveLoans] = useState(0);
  const [overdueLoans, setOverdueLoans] = useState(0);
  
  // Estados do monitoramento Beabah!
  const [daysOpened, setDaysOpened] = useState(0);
  const [totalMediations, setTotalMediations] = useState(0);
  const [mediationAudience, setMediationAudience] = useState(0);
  const [totalCulturalActions, setTotalCulturalActions] = useState(0);
  const [culturalAudience, setCulturalAudience] = useState(0);
  const [booksCataloged, setBooksCataloged] = useState(0);
  const [booksConsulted, setBooksConsulted] = useState(0);
  const [newReadersThisMonth, setNewReadersThisMonth] = useState(0);
  
  // Estados para gráficos
  const [loansPerMonth, setLoansPerMonth] = useState<Array<{ month: string; emprestimos: number }>>([]);
  const [audienceByCategoryChartData, setAudienceByCategoryChartData] = useState<Array<{ category: string; audience: number }>>([]);
  const [mediationsByType, setMediationsByType] = useState<Array<{ name: string; value: number }>>([]);
  const [monthlyProgress, setMonthlyProgress] = useState<Array<{ month: string; mediations: number; actions: number; loans: number }>>([]);
  
  // Estados para atalho de registro de abertura (bibliotecário)
  const [weekOpenings, setWeekOpenings] = useState<OpeningStatus[]>([]);
  const [expectedSchedule, setExpectedSchedule] = useState<ExpectedSchedule[]>([]);
  const [closures, setClosures] = useState<Closure[]>([]);
  const [savingOpening, setSavingOpening] = useState<string | null>(null);
  
  // Estados para visão admin (todas as bibliotecas)
  const [allLibraries, setAllLibraries] = useState<Array<{ id: string; name: string }>>([]);
  const [libraryStats, setLibraryStats] = useState<LibraryStats[]>([]);
  const [loadingAdminStats, setLoadingAdminStats] = useState(false);

  const isBibliotecario = user?.role === 'bibliotecario';
  const isAdmin = user?.role === 'admin_rede';
  const libraryId = user?.library_id;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Gerar datas das últimas 2 semanas
  const getTwoWeeksDates = useCallback(() => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Começa do domingo da semana anterior
    const startOfLastWeek = new Date(today);
    startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
    
    // 14 dias (semana anterior + semana atual)
    for (let i = 0; i < 14; i++) {
      const date = new Date(startOfLastWeek);
      date.setDate(startOfLastWeek.getDate() + i);
      if (date <= today) {
        dates.push(date);
      }
    }
    
    return dates;
  }, []);

  // Carregar registros de abertura das últimas 2 semanas
  const loadWeekOpenings = useCallback(async () => {
    if (!libraryId) return;
    
    try {
      const dates = getTwoWeeksDates();
      if (dates.length === 0) return;
      
      const startDate = dates[0].toISOString().split('T')[0];
      const endDate = dates[dates.length - 1].toISOString().split('T')[0];
      
      // Carregar registros de abertura
      const { data, error } = await (supabase as any)
        .from('library_opening_log')
        .select('*')
        .eq('library_id', libraryId)
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      
      // Carregar agenda esperada
      const { data: scheduleData, error: scheduleError } = await (supabase as any)
        .from('library_expected_schedule')
        .select('*')
        .eq('library_id', libraryId);
      
      if (scheduleError) {
        console.warn('Erro ao carregar agenda esperada:', scheduleError);
      }
      
      // Carregar recessos/closures
      const { data: closuresData, error: closuresError } = await (supabase as any)
        .from('library_closures')
        .select('*')
        .eq('library_id', libraryId)
        .eq('active', true);
      
      if (closuresError) {
        console.warn('Erro ao carregar recessos:', closuresError);
      }
      
      const loadedClosures: Closure[] = closuresData || [];
      setClosures(loadedClosures);
      
      // Função para verificar se uma data está em período de recesso
      const isDateInClosure = (dateStr: string): boolean => {
        return loadedClosures.some(c => 
          dateStr >= c.start_date && dateStr <= c.end_date
        );
      };
      
      // Mapear agenda esperada
      const schedule: ExpectedSchedule[] = (scheduleData || []).map((s: any) => ({
        dayOfWeek: s.day_of_week,
        shift: s.shift_name as ShiftName,
        isExpected: s.is_open,
      }));
      setExpectedSchedule(schedule);
      
      // Criar estrutura para todos os dias/turnos
      const openings: OpeningStatus[] = [];
      
      dates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();
        const inClosure = isDateInClosure(dateStr);
        
        SHIFTS.forEach(shift => {
          const existing = (data || []).find((d: any) => 
            d.date === dateStr && d.shift_name === shift.name
          );
          
          // Verificar se é um turno planejado
          const expectedEntry = schedule.find((s: ExpectedSchedule) => 
            s.dayOfWeek === dayOfWeek && s.shift === shift.name
          );
          const isExpected = expectedEntry?.isExpected ?? false;
          
          openings.push({
            date: dateStr,
            shift: shift.name,
            opened: existing ? existing.opened : null,
            id: existing?.id,
            isExpected,
            isInClosure: inClosure,
          });
        });
      });
      
      setWeekOpenings(openings);
    } catch (error) {
      console.error('Erro ao carregar registros de abertura:', error);
    }
  }, [libraryId, getTwoWeeksDates]);

  // Carregar estatísticas de todas as bibliotecas (para admin)
  const loadAdminStats = useCallback(async () => {
    if (!isAdmin) return;
    
    setLoadingAdminStats(true);
    try {
      const dates = getTwoWeeksDates();
      if (dates.length === 0) return;
      
      const startDate = dates[0].toISOString().split('T')[0];
      const endDate = dates[dates.length - 1].toISOString().split('T')[0];
      
      // Carregar todas as bibliotecas ativas
      const { data: libraries, error: libError } = await (supabase as any)
        .from('libraries')
        .select('id, name')
        .or('active.eq.true,active.is.null')
        .order('name');
      
      if (libError) throw libError;
      setAllLibraries(libraries || []);
      
      // Carregar registros de abertura de todas as bibliotecas
      const { data: openingLogs, error: logsError } = await (supabase as any)
        .from('library_opening_log')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (logsError) throw logsError;
      
      // Carregar agendas esperadas de todas as bibliotecas
      const { data: schedules, error: schedError } = await (supabase as any)
        .from('library_expected_schedule')
        .select('*');
      
      if (schedError) throw schedError;
      
      // Carregar recessos de todas as bibliotecas
      const { data: allClosures, error: closuresError } = await (supabase as any)
        .from('library_closures')
        .select('*')
        .eq('active', true);
      
      if (closuresError) throw closuresError;
      
      // Calcular estatísticas por biblioteca
      const stats: LibraryStats[] = (libraries || []).map((lib: { id: string; name: string }) => {
        const libSchedules = (schedules || []).filter((s: any) => s.library_id === lib.id && s.is_open);
        const libClosures = (allClosures || []).filter((c: any) => c.library_id === lib.id);
        const libLogs = (openingLogs || []).filter((l: any) => l.library_id === lib.id);
        
        let totalExpected = 0;
        let totalAnswered = 0;
        let totalOpened = 0;
        let totalClosed = 0;
        
        dates.forEach(date => {
          const dateStr = date.toISOString().split('T')[0];
          const dayOfWeek = date.getDay();
          
          // Verificar se está em recesso
          const inClosure = libClosures.some((c: any) => 
            dateStr >= c.start_date && dateStr <= c.end_date
          );
          
          if (inClosure) return;
          
          SHIFTS.forEach(shift => {
            // Verificar se é esperado
            const expected = libSchedules.find((s: any) => 
              s.day_of_week === dayOfWeek && s.shift_name === shift.name
            );
            
            if (expected) {
              totalExpected++;
              
              const log = libLogs.find((l: any) => 
                l.date === dateStr && l.shift_name === shift.name
              );
              
              if (log) {
                totalAnswered++;
                if (log.opened) {
                  totalOpened++;
                } else {
                  totalClosed++;
                }
              }
            }
          });
        });
        
        return {
          id: lib.id,
          name: lib.name,
          totalExpected,
          totalAnswered,
          totalOpened,
          totalClosed,
          pendingCount: totalExpected - totalAnswered,
          openingRate: totalExpected > 0 ? Math.round((totalOpened / totalExpected) * 100) : 0,
        };
      });
      
      // Ordenar por pendências (maior primeiro)
      stats.sort((a, b) => b.pendingCount - a.pendingCount);
      setLibraryStats(stats);
      
    } catch (error) {
      console.error('Erro ao carregar estatísticas admin:', error);
    } finally {
      setLoadingAdminStats(false);
    }
  }, [isAdmin, getTwoWeeksDates]);

  // Salvar registro de abertura
  const saveOpeningStatus = async (dateStr: string, shiftName: ShiftName, opened: boolean) => {
    if (!libraryId) return;
    
    const key = `${dateStr}-${shiftName}`;
    setSavingOpening(key);
    
    try {
      const shift = SHIFTS.find(s => s.name === shiftName);
      
      const { error } = await (supabase as any)
        .from('library_opening_log')
        .upsert({
          library_id: libraryId,
          date: dateStr,
          shift_name: shiftName,
          opened,
          opening_time: opened ? shift?.startTime : null,
          closing_time: opened ? shift?.endTime : null,
          created_by: user?.id,
        }, { onConflict: 'library_id,date,shift_name' });
      
      if (error) throw error;
      
      // Atualizar estado local
      setWeekOpenings(prev => prev.map(o => 
        o.date === dateStr && o.shift === shiftName 
          ? { ...o, opened } 
          : o
      ));
      
      toast({
        title: opened ? '✅ Turno aberto' : '❌ Turno fechado',
        description: `${new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })} - ${shift?.label}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível salvar.',
        variant: 'destructive',
      });
    } finally {
      setSavingOpening(null);
    }
  };

  // Carregar dados principais
  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Buscar bibliotecas ativas
      let librariesQuery = (supabase as any)
        .from('libraries')
        .select('id, active')
        .or('active.eq.true,active.is.null');

      if (isBibliotecario && libraryId) {
        librariesQuery = librariesQuery.eq('id', libraryId);
      }

      const { data: librariesData, error: librariesError } = await librariesQuery;
      if (!librariesError) {
        setActiveLibraries(librariesData?.length || 0);
      }

      // Buscar total de livros
      const { count: booksCount } = await (supabase as any)
          .from('books')
          .select('*', { count: 'exact', head: true });
          setTotalBooks(booksCount || 0);

      // Buscar total de exemplares
        let copiesQuery = (supabase as any)
          .from('copies')
          .select('*', { count: 'exact', head: true });

      if (isBibliotecario && libraryId) {
        copiesQuery = copiesQuery.eq('library_id', libraryId);
        }

      const { count: copiesCount } = await copiesQuery;
          setTotalCopies(copiesCount || 0);

      // Buscar total de leitores
        let readersQuery = (supabase as any)
          .from('users_profile')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'leitor');

      if (isBibliotecario && libraryId) {
        readersQuery = readersQuery.eq('library_id', libraryId);
        }

      const { count: readersCount } = await readersQuery;
          setTotalReaders(readersCount || 0);

      // Buscar empréstimos ativos
        let activeLoansQuery = (supabase as any)
          .from('loans')
          .select('id, due_date')
          .eq('status', 'aberto');

      if (isBibliotecario && libraryId) {
        activeLoansQuery = activeLoansQuery.eq('library_id', libraryId);
        }

      const { data: loansData } = await activeLoansQuery;
      if (loansData) {
        setActiveLoans(loansData.length || 0);
          const today = new Date();
        const overdueCount = loansData.filter((loan: any) => 
          loan.due_date && new Date(loan.due_date) < today
        ).length || 0;
          setOverdueLoans(overdueCount);
        }

      // Carregar dados do mês atual para o monitoramento
      await loadMonthlyMonitoringData();
      await loadChartsData();

      } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isBibliotecario, libraryId]);

  // Carregar dados de monitoramento do mês atual
  const loadMonthlyMonitoringData = useCallback(async () => {
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    try {
      // Dias abertos
      let openingQuery = (supabase as any)
        .from('library_opening_log')
        .select('*')
        .eq('opened', true)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0]);

      if (isBibliotecario && libraryId) {
        openingQuery = openingQuery.eq('library_id', libraryId);
      }

      const { data: openingData } = await openingQuery;
      setDaysOpened(openingData?.length || 0);

      // Mediações de leitura
      let mediationsQuery = (supabase as any)
        .from('reading_mediations')
        .select('*')
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0]);

      if (isBibliotecario && libraryId) {
        mediationsQuery = mediationsQuery.eq('library_id', libraryId);
      }

      const { data: mediationsData } = await mediationsQuery;
      if (mediationsData) {
        setTotalMediations(mediationsData.length);
        const totalAudience = mediationsData.reduce((sum: number, m: any) => 
          sum + (m.audience_count || 0) + (m.virtual_views || 0), 0);
        setMediationAudience(totalAudience);

        // Agrupar por tipo
        const typeCount: Record<string, number> = {};
        mediationsData.forEach((m: any) => {
          typeCount[m.mediation_type] = (typeCount[m.mediation_type] || 0) + 1;
        });
        setMediationsByType([
          { name: 'Presencial Biblioteca', value: typeCount['presencial_biblioteca'] || 0 },
          { name: 'Presencial Externo', value: typeCount['presencial_externo'] || 0 },
          { name: 'Virtual', value: typeCount['virtual'] || 0 },
        ].filter(t => t.value > 0));
      }

      // Ações culturais
      let actionsQuery = (supabase as any)
        .from('events')
        .select('*')
        .eq('status', 'realizado')
        .gte('date', startOfMonth.toISOString())
        .lte('date', endOfMonth.toISOString());

      if (isBibliotecario && libraryId) {
        actionsQuery = actionsQuery.eq('library_id', libraryId);
      }

      const { data: actionsData } = await actionsQuery;
      if (actionsData) {
        setTotalCulturalActions(actionsData.length);
        const totalAudience = actionsData.reduce((sum: number, a: any) => 
          sum + (a.actual_audience || 0), 0);
        setCulturalAudience(totalAudience);

        // Público por categoria
        const audienceMap = new Map<string, number>();
        actionsData.forEach((event: any) => {
          if (event.category && event.actual_audience) {
            audienceMap.set(event.category, (audienceMap.get(event.category) || 0) + event.actual_audience);
          }
        });
        const chartData = Array.from(audienceMap.entries())
          .map(([category, audience]) => ({ category, audience }))
          .sort((a, b) => b.audience - a.audience);
        setAudienceByCategoryChartData(chartData);
      }

      // Processamento técnico
      const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      let techQuery = (supabase as any)
        .from('technical_processing')
        .select('*')
        .eq('date', monthKey);

      if (isBibliotecario && libraryId) {
        techQuery = techQuery.eq('library_id', libraryId);
      }

      const { data: techData } = await techQuery;
      if (techData && techData.length > 0) {
        const total = techData.reduce((sum: number, t: any) => sum + (t.books_cataloged || 0), 0);
        setBooksCataloged(total);
        const consulted = techData.reduce((sum: number, t: any) => sum + (t.books_consulted || 0), 0);
        setBooksConsulted(consulted);
      }

      // Novos leitores do mês
      let newReadersQuery = (supabase as any)
        .from('users_profile')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'leitor')
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString());

      if (isBibliotecario && libraryId) {
        newReadersQuery = newReadersQuery.eq('library_id', libraryId);
      }

      const { count: newReadersCount } = await newReadersQuery;
      setNewReadersThisMonth(newReadersCount || 0);

    } catch (error) {
      console.error('Erro ao carregar dados de monitoramento:', error);
    }
  }, [currentYear, currentMonth, isBibliotecario, libraryId]);

  // Carregar dados para gráficos
  const loadChartsData = useCallback(async () => {
    try {
      // Evolução de empréstimos (últimos 6 meses)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setDate(1);

        let loansHistoryQuery = (supabase as any)
          .from('loans')
          .select('loan_date')
          .gte('loan_date', sixMonthsAgo.toISOString());

      if (isBibliotecario && libraryId) {
        loansHistoryQuery = loansHistoryQuery.eq('library_id', libraryId);
        }

      const { data: loansHistoryData } = await loansHistoryQuery;

      if (loansHistoryData) {
          const monthCounts: { [key: string]: number } = {};
          
          for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthCounts[key] = 0;
          }

          loansHistoryData.forEach((loan: any) => {
            if (loan.loan_date) {
              const loanDate = new Date(loan.loan_date);
              const key = `${loanDate.getFullYear()}-${String(loanDate.getMonth() + 1).padStart(2, '0')}`;
              if (monthCounts.hasOwnProperty(key)) {
                monthCounts[key]++;
              }
            }
          });

          const chartData = Object.entries(monthCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, count]) => {
            const [, month] = key.split('-');
              return {
              month: MONTH_NAMES[parseInt(month) - 1],
                emprestimos: count
              };
            });

          setLoansPerMonth(chartData);
        }

      // Evolução mensal (mediações, ações, empréstimos)
      const progressData: Array<{ month: string; mediations: number; actions: number; loans: number }> = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        let mediationCount = 0;
        let actionCount = 0;
        let loanCount = 0;

        // Mediações do mês
        let medQuery = (supabase as any)
          .from('reading_mediations')
          .select('id', { count: 'exact', head: true })
          .gte('date', startOfMonth.toISOString().split('T')[0])
          .lte('date', endOfMonth.toISOString().split('T')[0]);

        if (isBibliotecario && libraryId) {
          medQuery = medQuery.eq('library_id', libraryId);
        }

        const { count: medCount } = await medQuery;
        mediationCount = medCount || 0;

        // Ações do mês
        let actQuery = (supabase as any)
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'realizado')
          .gte('date', startOfMonth.toISOString())
          .lte('date', endOfMonth.toISOString());

        if (isBibliotecario && libraryId) {
          actQuery = actQuery.eq('library_id', libraryId);
        }

        const { count: actCount } = await actQuery;
        actionCount = actCount || 0;

        // Empréstimos do mês
        let loanQuery = (supabase as any)
          .from('loans')
          .select('id', { count: 'exact', head: true })
          .gte('loan_date', startOfMonth.toISOString())
          .lte('loan_date', endOfMonth.toISOString());

        if (isBibliotecario && libraryId) {
          loanQuery = loanQuery.eq('library_id', libraryId);
      }

        const { count: loanCountResult } = await loanQuery;
        loanCount = loanCountResult || 0;

        progressData.push({
          month: MONTH_NAMES[date.getMonth()],
          mediations: mediationCount,
          actions: actionCount,
          loans: loanCount,
        });
      }

      setMonthlyProgress(progressData);

    } catch (error) {
      console.error('Erro ao carregar dados dos gráficos:', error);
    }
  }, [isBibliotecario, libraryId]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  useEffect(() => {
    if (isBibliotecario && libraryId) {
      loadWeekOpenings();
    }
  }, [isBibliotecario, libraryId, loadWeekOpenings]);

  useEffect(() => {
    if (isAdmin) {
      loadAdminStats();
    }
  }, [isAdmin, loadAdminStats]);

  return (
    <div className="space-y-6 p-4 md:p-0 fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
        <p className="text-sm text-muted-foreground">
            Visão geral {isBibliotecario ? 'da sua biblioteca' : 'da rede'} - {MONTH_NAMES[currentMonth]} {currentYear}
        </p>
        </div>
        <Link to="/admin/eventos">
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Monitoramento Beabah!
          </Button>
        </Link>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <KPICard
          title="Bibliotecas"
          value={activeLibraries}
          description={isBibliotecario ? 'Sua biblioteca' : 'Ativas na rede'}
          icon={Building2}
          variant="primary"
        />
        <KPICard
          title="Acervo"
          value={totalCopies.toLocaleString('pt-BR')}
          description={`${totalBooks} títulos`}
          icon={BookOpen}
          variant="default"
        />
        <KPICard
          title="Leitores"
          value={totalReaders}
          description={newReadersThisMonth > 0 ? `+${newReadersThisMonth} este mês` : 'Cadastrados'}
          icon={Users}
          variant="success"
        />
        <KPICard
          title="Empréstimos"
          value={activeLoans}
          description={overdueLoans > 0 ? `${overdueLoans} em atraso` : 'Ativos'}
          icon={ArrowLeftRight}
          variant={overdueLoans > 0 ? 'warning' : 'default'}
        />
        <KPICard
          title="Dias Abertos"
          value={daysOpened}
          description="Este mês"
          icon={Calendar}
          variant="primary"
        />
        <KPICard
          title="Livros Catalogados"
          value={booksCataloged}
          description="Este mês"
          icon={BookMarked}
          variant="success"
        />
      </div>

      {/* Resumo do Monitoramento Beabah! */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Monitoramento Beabah! - {MONTH_NAMES[currentMonth]}
          </CardTitle>
          <CardDescription>
            Resumo das atividades para o relatório mensal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{daysOpened}</div>
              <div className="text-xs text-muted-foreground">Dias Abertos</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{totalMediations}</div>
              <div className="text-xs text-muted-foreground">Mediações</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">{mediationAudience}</div>
              <div className="text-xs text-muted-foreground">Público Mediações</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">{totalCulturalActions}</div>
              <div className="text-xs text-muted-foreground">Ações Culturais</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
              <div className="text-2xl font-bold text-pink-600">{culturalAudience}</div>
              <div className="text-xs text-muted-foreground">Público Ações</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
              <div className="text-2xl font-bold text-teal-600">{booksConsulted}</div>
              <div className="text-xs text-muted-foreground">Consultados</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
              <div className="text-2xl font-bold text-indigo-600">{newReadersThisMonth}</div>
              <div className="text-xs text-muted-foreground">Novos Leitores</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
              <div className="text-2xl font-bold text-amber-600">{booksCataloged}</div>
              <div className="text-xs text-muted-foreground">Catalogados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visão Admin - Resumo de Abertura de Todas as Bibliotecas */}
      {isAdmin && (
        <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-indigo-950/30 dark:to-slate-900/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Status de Abertura da Rede
                </CardTitle>
                <CardDescription>
                  Acompanhamento das últimas duas semanas ({allLibraries.length} bibliotecas)
                </CardDescription>
              </div>
              <Link to="/admin/eventos">
                <Button variant="outline" size="sm" className="gap-1">
                  Ver detalhes
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAdminStats ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : (
              <div className="space-y-4">
                {/* Resumo Geral */}
                {(() => {
                  const totals = libraryStats.reduce((acc, lib) => ({
                    expected: acc.expected + lib.totalExpected,
                    answered: acc.answered + lib.totalAnswered,
                    opened: acc.opened + lib.totalOpened,
                    closed: acc.closed + lib.totalClosed,
                    pending: acc.pending + lib.pendingCount,
                  }), { expected: 0, answered: 0, opened: 0, closed: 0, pending: 0 });
                  
                  const overallRate = totals.expected > 0 
                    ? Math.round((totals.opened / totals.expected) * 100) 
                    : 0;
                  
                  const librariesWithPending = libraryStats.filter(l => l.pendingCount > 0).length;
                  const librariesComplete = libraryStats.filter(l => l.pendingCount === 0 && l.totalExpected > 0).length;
                  
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center border">
                        <div className="text-2xl font-bold text-indigo-600">{overallRate}%</div>
                        <div className="text-xs text-muted-foreground">Taxa de Abertura</div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center border">
                        <div className="text-2xl font-bold text-green-600">{totals.opened}</div>
                        <div className="text-xs text-muted-foreground">Turnos Abertos</div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center border">
                        <div className="text-2xl font-bold text-red-600">{totals.closed}</div>
                        <div className="text-xs text-muted-foreground">Turnos Fechados</div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center border">
                        <div className="text-2xl font-bold text-amber-600">{totals.pending}</div>
                        <div className="text-xs text-muted-foreground">Pendentes</div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center border">
                        <div className="text-2xl font-bold text-emerald-600">{librariesComplete}</div>
                        <div className="text-xs text-muted-foreground">Bibs. em dia</div>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Grid de Bibliotecas - 3 por linha */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {libraryStats.map((lib) => (
                    <div 
                      key={lib.id} 
                      className={`p-2 rounded-lg border flex items-center justify-between gap-1 ${
                        lib.pendingCount > 0 
                          ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs truncate" title={lib.name}>
                          {lib.name}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span className="text-green-600">{lib.totalOpened}✓</span>
                          {lib.totalClosed > 0 && <span className="text-red-600">{lib.totalClosed}✗</span>}
                          <span>/{lib.totalExpected}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Badge 
                          variant={lib.openingRate >= 80 ? "default" : lib.openingRate >= 50 ? "secondary" : "destructive"}
                          className="text-[9px] px-1 h-5"
                        >
                          {lib.openingRate}%
                        </Badge>
                        {lib.pendingCount > 0 ? (
                          <Badge variant="outline" className="text-[9px] px-1 h-5 text-amber-600 border-amber-400">
                            {lib.pendingCount}
                          </Badge>
                        ) : (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        )}
                      </div>
                    </div>
                  ))}
                  {libraryStats.length === 0 && (
                    <div className="col-span-3 text-center p-4 text-muted-foreground">
                      Nenhuma biblioteca com agenda configurada
                    </div>
                  )}
                </div>
                
                {/* Legenda */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-500" /> Abriu
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-500" /> Fechou
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-amber-400" /> Pendente
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-green-600" /> Em dia
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Registro Rápido de Abertura - Apenas para bibliotecários */}
      {isBibliotecario && libraryId && (
        <Card className="border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  Registro de Abertura
                </CardTitle>
                <CardDescription>
                  Marque se a biblioteca abriu em cada turno das últimas duas semanas
                </CardDescription>
              </div>
              <Link to="/admin/eventos">
                <Button variant="outline" size="sm" className="gap-1">
                  Calendário completo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              const dates = getTwoWeeksDates();
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              // Agrupar por semana
              const lastWeekStart = new Date(today);
              lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
              
              const thisWeekStart = new Date(today);
              thisWeekStart.setDate(today.getDate() - today.getDay());
              
              const lastWeekDates = dates.filter(d => d >= lastWeekStart && d < thisWeekStart);
              const thisWeekDates = dates.filter(d => d >= thisWeekStart);
              
              const renderWeek = (weekDates: Date[], weekLabel: string) => (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">{weekLabel}</h4>
                  <div className="grid grid-cols-7 gap-1">
                    {WEEK_DAYS_SHORT.map((day, idx) => {
                      const date = weekDates.find(d => d.getDay() === idx);
                      
                      if (!date) {
                        return <div key={idx} className="text-center py-2 text-xs text-muted-foreground">{day}</div>;
                      }
                      
                      const dateStr = date.toISOString().split('T')[0];
                      const isToday = date.getTime() === today.getTime();
                      
                      return (
                        <div 
                          key={dateStr}
                          className={`text-center rounded-lg p-1 ${isToday ? 'ring-2 ring-primary bg-primary/10' : 'bg-white/70 dark:bg-black/20'}`}
                        >
                          <div className="text-[10px] font-medium text-muted-foreground">{day}</div>
                          <div className="text-xs font-bold">{date.getDate()}</div>
                          <div className="mt-1 space-y-0.5">
                            {SHIFTS.map(shift => {
                              const opening = weekOpenings.find(o => o.date === dateStr && o.shift === shift.name);
                              const isLoading = savingOpening === `${dateStr}-${shift.name}`;
                              const isOpen = opening?.opened;
                              const isClosed = opening?.opened === false;
                              const isExpected = opening?.isExpected ?? false;
                              const isInClosure = opening?.isInClosure ?? false;
                              const ShiftIcon = shift.Icon;
                              
                              // Se está em recesso, mostrar diferente
                              if (isInClosure) {
                                return (
                                  <div 
                                    key={shift.name}
                                    className="flex items-center justify-center gap-0.5 px-0.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-700 opacity-60"
                                    title={`${shift.label}: Recesso/Férias`}
                                  >
                                    <span className="text-[9px] text-purple-600 dark:text-purple-400">🏖️</span>
                                  </div>
                                );
                              }
                              
                              return (
                                <div 
                                  key={shift.name}
                                  className={`flex items-center justify-center gap-0.5 px-0.5 py-0.5 rounded ${
                                    isExpected 
                                      ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800' 
                                      : ''
                                  }`}
                                  title={isExpected ? 'Turno planejado' : 'Turno não planejado'}
                                >
                                  <button
                                    onClick={() => saveOpeningStatus(dateStr, shift.name, true)}
                                    disabled={isLoading}
                                    className={`w-5 h-5 rounded text-[10px] flex items-center justify-center transition-all ${
                                      isOpen 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-900/30'
                                    }`}
                                    title={`${shift.label}: Abriu${isExpected ? ' (Planejado)' : ''}`}
                                  >
                                    {isLoading ? '...' : <ShiftIcon className="h-3 w-3" />}
                                  </button>
                                  <button
                                    onClick={() => saveOpeningStatus(dateStr, shift.name, false)}
                                    disabled={isLoading}
                                    className={`w-5 h-5 rounded text-[10px] flex items-center justify-center transition-all ${
                                      isClosed 
                                        ? 'bg-red-500 text-white' 
                                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30'
                                    }`}
                                    title={`${shift.label}: Fechou${isExpected ? ' (Planejado)' : ''}`}
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
              
              // Contar apenas turnos que são esperados e não estão em recesso
              const relevantOpenings = weekOpenings.filter(o => o.isExpected && !o.isInClosure);
              const pendingCount = relevantOpenings.filter(o => o.opened === null).length;
              const answeredCount = relevantOpenings.filter(o => o.opened !== null).length;
              const totalCount = relevantOpenings.length;
              
              return (
                <div className="space-y-4">
                  {/* Progress */}
                  <div className="flex items-center gap-4">
                    <Progress value={(answeredCount / totalCount) * 100} className="flex-1" />
                    <span className="text-sm font-medium whitespace-nowrap">
                      {answeredCount}/{totalCount} turnos
                    </span>
                    {pendingCount > 0 && (
                      <Badge variant="secondary" className="text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700">
                        {pendingCount} pendentes
                      </Badge>
                    )}
                  </div>
                  
                  {/* Semanas */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {lastWeekDates.length > 0 && renderWeek(lastWeekDates, 'Semana Anterior')}
                    {thisWeekDates.length > 0 && renderWeek(thisWeekDates, 'Esta Semana')}
                  </div>
                  
                  {/* Legenda */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-2 border-t">
                    <span className="font-medium">Turnos:</span>
                    {SHIFTS.map(s => {
                      const IconComponent = s.Icon;
                      return (
                        <span key={s.name} className="flex items-center gap-1">
                          <IconComponent className="h-3 w-3" /> {s.label}
                        </span>
                      );
                    })}
                    <span className="mx-2 border-l pl-3 flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-green-500" /> Abriu
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-red-500" /> Fechou
                    </span>
                    <span className="flex items-center gap-1 border-l pl-3">
                      <span className="w-4 h-4 rounded border-2 border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-700" /> Planejado
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-4 h-4 rounded border-2 border-purple-300 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-700 flex items-center justify-center text-[8px]">🏖️</span> Recesso
                    </span>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Evolução de Empréstimos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolução de Empréstimos
            </CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loansPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
                  <YAxis className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="emprestimos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Progresso Mensal
            </CardTitle>
            <CardDescription>Mediações, Ações e Empréstimos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyProgress}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
                  <YAxis className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="mediations" name="Mediações" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="actions" name="Ações" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="loans" name="Empréstimos" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos secundários */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tipo de Mediações */}
        {mediationsByType.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-primary" />
                Mediações por Tipo
              </CardTitle>
              <CardDescription>Distribuição do mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mediationsByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {mediationsByType.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Público por Categoria */}
      {audienceByCategoryChartData.length > 0 && (
          <Card className="lg:col-span-2">
          <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Público por Categoria
            </CardTitle>
              <CardDescription>Participantes em ações culturais</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={audienceByCategoryChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
                    <YAxis dataKey="category" type="category" className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value} pessoas`, 'Público']}
                    />
                    <Bar dataKey="audience" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Alertas */}
      {overdueLoans > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-warning">
              <AlertTriangle className="h-5 w-5" />
              Empréstimos em Atraso
            </CardTitle>
            <CardDescription>
              Requer atenção imediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-warning">{overdueLoans}</p>
                <p className="text-sm text-muted-foreground">empréstimos precisam ser devolvidos</p>
              </div>
              <Link to="/admin/circulacao">
                <Button variant="outline" className="gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  Ver Circulação
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
