import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, RefreshCw, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "@/hooks/use-toast";

// Definição do Tipo
type LogItem = {
  id: string;
  action: string;
  details: string;
  created_at: string;
  libraries?: {
    name: string;
  } | null;
};

export default function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função que busca os dados
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Buscando logs...");
      
      // Preparar query base com join para trazer o nome da biblioteca
      let query = (supabase as any)
        .from("audit_logs")
        .select("*, libraries(name)");

      // Se não for admin_rede, filtrar por library_id
      if (user?.role !== 'admin_rede' && user?.library_id) {
        query = query.eq('library_id', user.library_id);
      }

      // Aplicar ordenação e limite
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      console.log("Logs encontrados:", data);
      
      // AQUI TAMBÉM: Forçamos o tipo (as LogItem[]) para garantir que ele aceite os dados
      setLogs((data as LogItem[]) || []);
      
    } catch (err: any) {
      console.error("Erro ao buscar logs:", err);
      setError(err.message || "Erro desconhecido ao conectar com Supabase");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  // Função para formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Função para definir cores
  const getBadgeColor = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    const act = action?.toUpperCase() || "";
    if (act.includes("EMPRESTIMO") || act.includes("NOVO")) return "default";
    if (act.includes("DEVOLUCAO")) return "secondary";
    if (act.includes("ERRO")) return "destructive";
    return "outline";
  };

  // Função para exportar para Excel
  const handleExport = () => {
    try {
      const exportData = logs.map((log) => ({
        'Data/Hora': formatDate(log.created_at),
        'Biblioteca': log.libraries?.name || '-',
        'Ação': log.action || '-',
        'Detalhes': log.details || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Auditoria');

      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const fileName = `auditoria_${dateStr}.xlsx`;

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
    <div className="space-y-6 p-4 md:p-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Auditoria & Logs</h2>
          <p className="text-muted-foreground">
            Registro de segurança de todas as operações críticas.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="p-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 flex items-center gap-2"
          > 
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button 
            onClick={fetchLogs}
            className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md flex items-center gap-2 border border-red-200">
          <AlertCircle className="h-5 w-5" />
          <span>Erro: {error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Últimas Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Biblioteca</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Carregando dados...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Nenhum registro de auditoria encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        {log.libraries?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.details || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}