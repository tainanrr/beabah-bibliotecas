import { useState, useEffect } from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  BookOpen,
  Users,
  ArrowLeftRight,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalCulturalAudience, setTotalCulturalAudience] = useState(0);
  const [totalCulturalEvents, setTotalCulturalEvents] = useState(0);
  const [audienceByCategoryChartData, setAudienceByCategoryChartData] = useState<Array<{ category: string; audience: number }>>([]);

  const [activeLibraries, setActiveLibraries] = useState(0);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalCopies, setTotalCopies] = useState(0);
  const [totalReaders, setTotalReaders] = useState(0);
  const [activeLoans, setActiveLoans] = useState(0);
  const [overdueLoans, setOverdueLoans] = useState(0);
  const [loansPerMonth, setLoansPerMonth] = useState<Array<{ month: string; emprestimos: number }>>([]);

  const isBibliotecario = user?.role === 'bibliotecario';

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const isBibliotecario = user?.role === 'bibliotecario';
      
      // DEBUG: Log do usuário e library_id
      console.log('[Dashboard] User:', user);
      console.log('[Dashboard] isBibliotecario:', isBibliotecario);
      console.log('[Dashboard] library_id:', user?.library_id);
      
      // Buscar eventos realizados
      let eventsQuery = (supabase as any)
        .from('events')
        .select('actual_audience, category')
        .eq('status', 'realizado');

      if (isBibliotecario && user?.library_id) {
        console.log('[Dashboard] Aplicando filtro de library_id nos eventos:', user.library_id);
        eventsQuery = eventsQuery.eq('library_id', user.library_id);
      }

      const { data: eventsData, error: eventsError } = await eventsQuery;

      if (!eventsError && eventsData) {
        // Calcular total de público
        const totalAudience = eventsData.reduce((sum: number, event: any) => sum + (event.actual_audience || 0), 0);
        setTotalCulturalAudience(totalAudience);
        setTotalCulturalEvents(eventsData.length);

        // Agrupar por categoria
        const audienceMap = new Map<string, number>();
        eventsData.forEach((event: any) => {
          if (event.category && event.actual_audience) {
            audienceMap.set(event.category, (audienceMap.get(event.category) || 0) + event.actual_audience);
          }
        });
        const chartData = Array.from(audienceMap.entries())
          .map(([category, audience]) => ({ category, audience }))
          .sort((a, b) => b.audience - a.audience); // Ordenar por público descendente
        setAudienceByCategoryChartData(chartData);
      }

      // Buscar bibliotecas ativas
      let librariesQuery = (supabase as any)
        .from('libraries')
        .select('id, active')
        .or('active.eq.true,active.is.null');

      if (isBibliotecario && user?.library_id) {
        librariesQuery = librariesQuery.eq('id', user.library_id);
      }

      const { data: librariesData, error: librariesError } = await librariesQuery;
      if (!librariesError) {
        setActiveLibraries(librariesData?.length || 0);
      }

      // Buscar total de livros (títulos únicos) - não filtra por biblioteca pois são globais
      try {
        const { count: booksCount, error: booksError } = await (supabase as any)
          .from('books')
          .select('*', { count: 'exact', head: true });
        if (!booksError) {
          setTotalBooks(booksCount || 0);
        }
      } catch (error) {
        console.error('Erro ao buscar livros:', error);
      }

      // Buscar total de exemplares
      try {
        let copiesQuery = (supabase as any)
          .from('copies')
          .select('*', { count: 'exact', head: true });

        if (isBibliotecario && user?.library_id) {
          copiesQuery = copiesQuery.eq('library_id', user.library_id);
        }

        const { count: copiesCount, error: copiesError } = await copiesQuery;
        if (!copiesError) {
          setTotalCopies(copiesCount || 0);
        }
      } catch (error) {
        console.error('Erro ao buscar exemplares:', error);
      }

      // Buscar total de leitores
      try {
        let readersQuery = (supabase as any)
          .from('users_profile')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'leitor');

        if (isBibliotecario && user?.library_id) {
          readersQuery = readersQuery.eq('library_id', user.library_id);
        }

        const { count: readersCount, error: readersError } = await readersQuery;
        if (!readersError) {
          setTotalReaders(readersCount || 0);
        }
      } catch (error) {
        console.error('Erro ao buscar leitores:', error);
      }

      // Buscar empréstimos ativos
      try {
        let activeLoansQuery = (supabase as any)
          .from('loans')
          .select('id, due_date')
          .eq('status', 'aberto');

        if (isBibliotecario && user?.library_id) {
          activeLoansQuery = activeLoansQuery.eq('library_id', user.library_id);
        }

        const { data: loansData, error: loansError } = await activeLoansQuery;
        if (!loansError && loansData) {
          const activeCount = loansData.length || 0;
          setActiveLoans(activeCount);

          // Contar empréstimos em atraso
          const today = new Date();
          const overdueCount = loansData.filter((loan: any) => {
            if (!loan.due_date) return false;
            return new Date(loan.due_date) < today;
          }).length || 0;
          setOverdueLoans(overdueCount);
        }
      } catch (error) {
        console.error('Erro ao buscar empréstimos:', error);
      }

      // Buscar dados para o gráfico de evolução de empréstimos (últimos 6 meses)
      try {
        // Calcular data de 6 meses atrás
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        sixMonthsAgo.setDate(1); // Primeiro dia do mês
        sixMonthsAgo.setHours(0, 0, 0, 0);

        let loansHistoryQuery = (supabase as any)
          .from('loans')
          .select('loan_date')
          .gte('loan_date', sixMonthsAgo.toISOString());

        if (isBibliotecario && user?.library_id) {
          loansHistoryQuery = loansHistoryQuery.eq('library_id', user.library_id);
        }

        const { data: loansHistoryData, error: loansHistoryError } = await loansHistoryQuery;

        if (!loansHistoryError && loansHistoryData) {
          // Agrupar empréstimos por mês
          const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          const monthCounts: { [key: string]: number } = {};
          
          // Inicializar os últimos 6 meses com 0
          for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthCounts[key] = 0;
          }

          // Contar empréstimos por mês
          loansHistoryData.forEach((loan: any) => {
            if (loan.loan_date) {
              const loanDate = new Date(loan.loan_date);
              const key = `${loanDate.getFullYear()}-${String(loanDate.getMonth() + 1).padStart(2, '0')}`;
              if (monthCounts.hasOwnProperty(key)) {
                monthCounts[key]++;
              }
            }
          });

          // Converter para o formato do gráfico
          const chartData = Object.entries(monthCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, count]) => {
              const [year, month] = key.split('-');
              return {
                month: monthNames[parseInt(month) - 1],
                emprestimos: count
              };
            });

          setLoansPerMonth(chartData);
        }
      } catch (error) {
        console.error('Erro ao buscar histórico de empréstimos:', error);
      }

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0 fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral {isBibliotecario ? 'da sua biblioteca' : 'da rede'}
        </p>
      </div>

      {/* KPIs - 2 colunas em mobile */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <KPICard
          title="Bibliotecas Ativas"
          value={activeLibraries}
          description={isBibliotecario ? 'Sua biblioteca' : `${activeLibraries} cadastradas`}
          icon={Building2}
          variant="primary"
        />
        <KPICard
          title="Acervo Total"
          value={totalCopies.toLocaleString('pt-BR')}
          description={`${totalBooks} títulos únicos`}
          icon={BookOpen}
          variant="default"
        />
        <KPICard
          title="Leitores Cadastrados"
          value={totalReaders}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          variant="success"
        />
        <KPICard
          title="Empréstimos Ativos"
          value={activeLoans}
          description={overdueLoans > 0 ? `${overdueLoans} em atraso` : 'Nenhum em atraso'}
          icon={ArrowLeftRight}
          variant={overdueLoans > 0 ? 'warning' : 'default'}
        />
        <KPICard
          title="Público Cultural"
          value={loading ? '...' : totalCulturalAudience.toLocaleString('pt-BR')}
          description="Pessoas impactadas em eventos"
          icon={Sparkles}
          variant="primary"
        />
        <KPICard
          title="Ações Realizadas"
          value={loading ? '...' : totalCulturalEvents}
          description="Eventos concluídos"
          icon={Calendar}
          variant="success"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-7">
        {/* Chart - Empréstimos */}
        <Card className="lg:col-span-4">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              Evolução de Empréstimos
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="h-[200px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loansPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="emprestimos"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Loans */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Empréstimos em Atraso
            </CardTitle>
            <CardDescription>
              Requer atenção imediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  <p className="text-sm">Carregando...</p>
                </div>
              ) : overdueLoans === 0 ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  <p className="text-sm">Nenhum empréstimo em atraso</p>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {overdueLoans} empréstimo(s) em atraso
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Público por Categoria */}
      {audienceByCategoryChartData.length > 0 && (
        <Card className="lg:col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Público por Categoria
            </CardTitle>
            <CardDescription>
              Total de participantes por tipo de evento realizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                <p className="text-sm">Carregando gráfico...</p>
              </div>
            ) : audienceByCategoryChartData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                <p className="text-sm">Nenhum dado de público por categoria disponível</p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={audienceByCategoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="category"
                      className="text-xs fill-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      className="text-xs fill-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => `${value} pessoas`}
                    />
                    <Bar
                      dataKey="audience"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
