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
  user_id?: string | null;
  library_id?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  entity_name?: string | null;
  details?: any; // JSONB
  old_values?: any; // JSONB
  new_values?: any; // JSONB
  status?: string;
  error_message?: string | null;
  created_at: string;
  libraries?: {
    name: string;
  } | null;
  users_profile?: {
    name: string;
    email: string;
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
      // DEBUG: Log do usuário e library_id
      console.log("[Audit] User:", user);
      console.log("[Audit] role:", user?.role);
      console.log("[Audit] library_id:", user?.library_id);
      
      // Primeiro, tentar buscar os logs básicos
      let query = supabase
        .from("audit_logs")
        .select("*");

      // Se não for admin_rede, filtrar por library_id
      if (user?.role !== 'admin_rede' && user?.library_id) {
        console.log("[Audit] Aplicando filtro de library_id:", user.library_id);
        query = query.eq('library_id', user.library_id);
      } else {
        console.log("[Audit] NÃO aplicando filtro - role:", user?.role, 'library_id:', user?.library_id);
      }

      // Aplicar ordenação e limite
      const { data: logsData, error: logsError } = await query
        .order("created_at", { ascending: false })
        .limit(100);

      if (logsError) {
        console.error("Erro ao buscar logs:", logsError);
        
        // Verificar se a tabela não existe
        if (logsError.message?.includes('relation') || logsError.message?.includes('does not exist')) {
          throw new Error('A tabela "audit_logs" não existe no banco de dados. Execute o script SQL "improve_audit_system.sql" primeiro.');
        }
        
        throw logsError;
      }

      if (!logsData || logsData.length === 0) {
        setLogs([]);
        setLoading(false);
        return;
      }

      // Buscar informações adicionais (biblioteca e usuário) separadamente
      const enrichedLogs = await Promise.all(
        logsData.map(async (log: any) => {
          const enrichedLog: LogItem = { ...log };

          // Buscar biblioteca se houver library_id
          if (log.library_id) {
            try {
              const { data: libraryData } = await supabase
                .from("libraries")
                .select("name")
                .eq("id", log.library_id)
                .single();
              
              if (libraryData) {
                enrichedLog.libraries = { name: libraryData.name };
              }
            } catch (err) {
              console.warn("Erro ao buscar biblioteca:", err);
            }
          }

          // Buscar usuário se houver user_id
          if (log.user_id) {
            try {
              const { data: userData } = await supabase
                .from("users_profile")
                .select("name, email")
                .eq("id", log.user_id)
                .single();
              
              if (userData) {
                enrichedLog.users_profile = {
                  name: userData.name,
                  email: userData.email,
                };
              }
            } catch (err) {
              console.warn("Erro ao buscar usuário:", err);
            }
          }

          return enrichedLog;
        })
      );

      console.log("Logs encontrados:", enrichedLogs);
      setLogs(enrichedLogs);
      
    } catch (err: any) {
      console.error("Erro ao buscar logs:", err);
      setError(err.message || "Erro desconhecido ao conectar com Supabase");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
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

  // Função para formatar detalhes JSON
  const formatDetails = (details: any): string => {
    try {
      if (!details) return '-';
      if (typeof details === 'string') {
        try {
          const parsed = JSON.parse(details);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return details;
        }
      }
      if (typeof details === 'object') {
        return JSON.stringify(details, null, 2);
      }
      return String(details);
    } catch (err) {
      console.error('Erro ao formatar detalhes:', err);
      return '-';
    }
  };

  // Função para exportar para Excel
  const handleExport = () => {
    try {
      const exportData = logs.map((log) => {
        let detailsObj = {};
        let oldValuesObj = {};
        let newValuesObj = {};
        
        try {
          detailsObj = typeof log.details === 'string' ? JSON.parse(log.details || '{}') : (log.details || {});
        } catch (err) {
          console.warn('Erro ao parsear details:', err);
        }
        
        try {
          oldValuesObj = typeof log.old_values === 'string' ? JSON.parse(log.old_values || '{}') : (log.old_values || {});
        } catch (err) {
          console.warn('Erro ao parsear old_values:', err);
        }
        
        try {
          newValuesObj = typeof log.new_values === 'string' ? JSON.parse(log.new_values || '{}') : (log.new_values || {});
        } catch (err) {
          console.warn('Erro ao parsear new_values:', err);
        }
        
        return {
          'Data/Hora': formatDate(log.created_at),
          'Usuário': log.users_profile?.name || '-',
          'Email': log.users_profile?.email || '-',
          'Biblioteca': log.libraries?.name || '-',
          'Ação': log.action || '-',
          'Tipo Entidade': log.entity_type || '-',
          'ID Entidade': log.entity_id || '-',
          'Nome Entidade': log.entity_name || '-',
          'Status': log.status || 'success',
          'Mensagem Erro': log.error_message || '-',
          'Detalhes': JSON.stringify(detailsObj, null, 2),
          'Valores Antigos': Object.keys(oldValuesObj).length > 0 ? JSON.stringify(oldValuesObj, null, 2) : '-',
          'Valores Novos': Object.keys(newValuesObj).length > 0 ? JSON.stringify(newValuesObj, null, 2) : '-',
        };
      });

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

  // Verificar se o usuário está autenticado
  if (!user) {
    return (
      <div className="space-y-6 p-4 md:p-8 animate-in fade-in">
        <div className="p-4 bg-yellow-50 text-yellow-600 rounded-md flex items-center gap-2 border border-yellow-200">
          <AlertCircle className="h-5 w-5" />
          <span>Você precisa estar autenticado para acessar esta página.</span>
        </div>
      </div>
    );
  }

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
                  <TableHead>Usuário</TableHead>
                  <TableHead>Biblioteca</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Carregando dados...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Nenhum registro de auditoria encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    let detailsObj = {};
                    try {
                      detailsObj = typeof log.details === 'string' ? JSON.parse(log.details || '{}') : (log.details || {});
                    } catch (err) {
                      console.warn('Erro ao parsear details:', err);
                      detailsObj = {};
                    }
                    const hasChanges = log.old_values || log.new_values;
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium whitespace-nowrap text-xs">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{log.users_profile?.name || '-'}</p>
                            <p className="text-xs text-muted-foreground">{log.users_profile?.email || ''}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.libraries?.name || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getBadgeColor(log.action)} className="text-xs">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {log.entity_type || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs font-medium">{log.entity_name || '-'}</p>
                            {log.entity_id && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {log.entity_id.substring(0, 8)}...
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={log.status === 'error' ? 'destructive' : log.status === 'warning' ? 'outline' : 'default'}
                            className="text-xs"
                          >
                            {log.status || 'success'}
                          </Badge>
                          {log.error_message && (
                            <p className="text-xs text-red-600 mt-1">{log.error_message}</p>
                          )}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="text-xs">
                            {Object.keys(detailsObj).length > 0 ? (
                              <details className="cursor-pointer">
                                <summary className="text-primary hover:underline">
                                  Ver detalhes
                                </summary>
                                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                                  {formatDetails(detailsObj)}
                                </pre>
                              </details>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                            {hasChanges && (
                              <details className="cursor-pointer mt-1">
                                <summary className="text-primary hover:underline text-xs">
                                  Ver alterações
                                </summary>
                                <div className="mt-2 space-y-1 text-xs">
                                  {log.old_values && (
                                    <div>
                                      <p className="font-semibold text-red-600">Antes:</p>
                                      <pre className="p-1 bg-red-50 rounded text-xs overflow-auto max-h-20">
                                        {formatDetails(log.old_values)}
                                      </pre>
                                    </div>
                                  )}
                                  {log.new_values && (
                                    <div>
                                      <p className="font-semibold text-green-600">Depois:</p>
                                      <pre className="p-1 bg-green-50 rounded text-xs overflow-auto max-h-20">
                                        {formatDetails(log.new_values)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </details>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}