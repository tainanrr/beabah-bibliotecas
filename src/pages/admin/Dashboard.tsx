import { useState, useEffect, useCallback } from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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

  const isBibliotecario = user?.role === 'bibliotecario';
  const isAdmin = user?.role === 'admin_rede';
  const libraryId = user?.library_id;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

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
