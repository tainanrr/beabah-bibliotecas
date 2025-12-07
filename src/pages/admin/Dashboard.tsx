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
  mockLibraries,
  mockBooks,
  mockCopies,
  mockUsers,
  mockLoans,
  getActiveLoans,
  getOverdueLoans,
} from '@/data/mockData';
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

const loansPerMonth = [
  { month: 'Jul', emprestimos: 145 },
  { month: 'Ago', emprestimos: 162 },
  { month: 'Set', emprestimos: 189 },
  { month: 'Out', emprestimos: 176 },
  { month: 'Nov', emprestimos: 198 },
  { month: 'Dez', emprestimos: 142 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalCulturalAudience, setTotalCulturalAudience] = useState(0);
  const [totalCulturalEvents, setTotalCulturalEvents] = useState(0);
  const [audienceByCategoryChartData, setAudienceByCategoryChartData] = useState<Array<{ category: string; audience: number }>>([]);

  const activeLibraries = mockLibraries.filter(l => l.active).length;
  const totalBooks = mockBooks.length;
  const totalCopies = mockCopies.length;
  const totalReaders = mockUsers.filter(u => u.role === 'leitor').length;
  const activeLoans = getActiveLoans().length;
  const overdueLoans = getOverdueLoans().length;

  const isBibliotecario = user?.role === 'bibliotecario';

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Buscar eventos realizados
      let eventsQuery = (supabase as any)
        .from('events')
        .select('actual_audience, category')
        .eq('status', 'realizado');

      if (isBibliotecario && user?.library_id) {
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
    } catch (error) {
      console.error('Erro ao carregar dados de eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da rede estadual de bibliotecas
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
          title="Bibliotecas Ativas"
          value={activeLibraries}
          description={`${mockLibraries.length} cadastradas`}
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
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Chart - Empréstimos */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolução de Empréstimos
            </CardTitle>
            <CardDescription>
              Últimos 6 meses da rede estadual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
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
              {getOverdueLoans().slice(0, 5).map((loan) => {
                const daysOverdue = Math.ceil(
                  (new Date().getTime() - new Date(loan.due_date).getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{loan.user?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {loan.copy?.book?.title}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {daysOverdue} dias
                    </Badge>
                  </div>
                );
              })}
              {getOverdueLoans().length === 0 && (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  <p className="text-sm">Nenhum empréstimo em atraso</p>
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

      {/* Libraries Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Bibliotecas da Rede</CardTitle>
          <CardDescription>
            Status atual das unidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Biblioteca
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Cidade
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Exemplares
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Empréstimos Ativos
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockLibraries.map((library) => {
                  const libraryCopies = mockCopies.filter(c => c.library_id === library.id).length;
                  const libraryLoans = mockLoans.filter(
                    l => l.library_id === library.id && l.status === 'aberto'
                  ).length;
                  return (
                    <tr
                      key={library.id}
                      className="table-row-interactive border-b border-border last:border-0"
                    >
                      <td className="py-4">
                        <p className="font-medium">{library.name}</p>
                        <p className="text-xs text-muted-foreground">{library.address}</p>
                      </td>
                      <td className="py-4 text-sm">{library.city}</td>
                      <td className="py-4 text-sm">{libraryCopies}</td>
                      <td className="py-4 text-sm">{libraryLoans}</td>
                      <td className="py-4">
                        <Badge variant={library.active ? 'success' : 'manutencao'}>
                          {library.active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
