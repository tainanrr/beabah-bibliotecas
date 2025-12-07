import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Plus, Pencil, Trash2, Palette, Book as BookIcon, Filter, Settings2, CheckCircle2, XCircle, AlertCircle, Hash, Library, FileText, Tag, ArrowUp, ArrowDown, ArrowUpDown, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import * as XLSX from 'xlsx';

type Library = Tables<'libraries'>;

// --- SUB-COMPONENTE: CONFIGURAÇÃO DE CORES (Embutido para facilitar) ---
function ColorConfigModal({ isOpen, onClose, libraryId }: { isOpen: boolean; onClose: () => void; libraryId?: string }) {
  const { toast } = useToast();
  const [colors, setColors] = useState<any[]>([]);
  const [newCat, setNewCat] = useState("");
  const [newColor, setNewColor] = useState("#000000");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && libraryId) fetchColors();
  }, [isOpen, libraryId]);

  const fetchColors = async () => {
    const { data } = await (supabase as any)
      .from("library_colors")
      .select("*")
      .eq("library_id", libraryId)
      .order("category_name");
    setColors(data || []);
  };

  const handleAdd = async () => {
    if (!newCat) return;
    setLoading(true);
    const { error } = await (supabase as any).from("library_colors").insert({
      library_id: libraryId,
      category_name: newCat,
      color_hex: newColor
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setNewCat("");
      fetchColors();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await (supabase as any).from("library_colors").delete().eq("id", id);
    fetchColors();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Configuração de Cores
          </DialogTitle>
          <DialogDescription>
            Configure categorias e cores locais para organização do acervo
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2 items-end bg-slate-50 p-3 rounded-md">
            <div className="flex-1 space-y-1">
              <Label>Nome (Ex: Terror)</Label>
              <Input value={newCat} onChange={e => setNewCat(e.target.value)} />
            </div>
            <div className="w-16 space-y-1">
              <Label>Cor</Label>
              <Input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-10 p-1 cursor-pointer" />
            </div>
            <Button onClick={handleAdd} disabled={loading} size="icon"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="border rounded-md max-h-[300px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colors.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.category_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: c.color_hex }} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- COMPONENTE PRINCIPAL: INVENTORY ---
export default function Inventory() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [copies, setCopies] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [libraryColors, setLibraryColors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [processFilter, setProcessFilter] = useState<string>("todos");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'tombo', direction: 'desc' });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isColorConfigOpen, setIsColorConfigOpen] = useState(false);
  const [editingCopy, setEditingCopy] = useState<any>(null);
  const [selectedLibraryForColors, setSelectedLibraryForColors] = useState<string>("");

  const [formData, setFormData] = useState({
    book_id: "",
    library_id: "",
    status: "disponivel",
    code: "",
    cutter: "",
    process_stamped: false,
    process_indexed: false,
    process_taped: false,
    local_categories: [] as string[]
  });

  useEffect(() => {
    if (user) {
      fetchCopies();
      fetchBooksList();
      if (user.role === 'admin_rede') {
        fetchLibraries();
        fetchLibraryColors(); // Admin busca todas as cores
      } else {
        fetchLibraryColors();
      }
    }
  }, [user, isColorConfigOpen]);

  // Se for bibliotecário, definir automaticamente a biblioteca
  useEffect(() => {
    if (user?.role === 'bibliotecario' && user.library_id) {
      setFormData(prev => ({ ...prev, library_id: user.library_id || "" }));
      if (!selectedLibraryForColors) {
        setSelectedLibraryForColors(user.library_id);
      }
    }
  }, [user, selectedLibraryForColors]);

  const fetchLibraries = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('libraries')
        .select('id, name')
        .order('name');
      if (!error) setLibraries(data || []);
    } catch (error) {
      console.error('Erro ao carregar bibliotecas:', error);
    }
  };

  const fetchCopies = async () => {
    setLoading(true);
    let query = (supabase as any)
      .from('copies')
      .select('*, books(title, author, cover_url, cutter), libraries(name)')
      .order('tombo', { ascending: false });

    if (user?.role === 'bibliotecario' && user.library_id) {
      query = query.eq('library_id', user.library_id);
    }

    const { data, error } = await query;
    if (!error) setCopies(data || []);
    setLoading(false);
  };

  const fetchBooksList = async () => {
    const { data } = await (supabase as any).from('books').select('id, title, author').order('title');
    setBooks(data || []);
  };

  const fetchLibraryColors = async () => {
    if (user?.role === 'admin_rede') {
      // Admin busca TODAS as cores de todas as bibliotecas
      const { data } = await (supabase as any)
        .from('library_colors')
        .select('*')
        .order('library_id, category_name');
      setLibraryColors(data || []);
    } else if (user?.library_id) {
      // Bibliotecário busca apenas as cores da sua biblioteca
      const { data } = await (supabase as any)
        .from('library_colors')
        .select('*')
        .eq('library_id', user.library_id);
      setLibraryColors(data || []);
    }
  };

  const handleSave = async () => {
    if (!formData.book_id) {
      return toast({ title: "Erro", description: "Selecione a Obra", variant: "destructive" });
    }

    // CORREÇÃO CRÍTICA: Validar library_id
    let libraryId: string | null = null;
    
    if (user?.role === 'bibliotecario' && user.library_id) {
      libraryId = user.library_id;
    } else if (user?.role === 'admin_rede') {
      libraryId = formData.library_id || null;
      if (!libraryId) {
        return toast({ 
          title: "Erro", 
          description: "Selecione a Biblioteca de Destino", 
          variant: "destructive" 
        });
      }
    } else {
      libraryId = editingCopy?.library_id || null;
    }

    if (!libraryId) {
      return toast({ 
        title: "Erro", 
        description: "Biblioteca não identificada", 
        variant: "destructive" 
      });
    }

    const payload = {
      book_id: formData.book_id,
      library_id: libraryId,
      status: formData.status,
      code: formData.code || null, // Código de barras opcional
      process_stamped: formData.process_stamped,
      process_indexed: formData.process_indexed,
      process_taped: formData.process_taped,
      local_categories: formData.local_categories
    };

    let error;
    if (editingCopy) {
      const { error: err } = await (supabase as any)
        .from('copies')
        .update(payload)
        .eq('id', editingCopy.id);
      error = err;
    } else {
      const { error: err } = await (supabase as any)
        .from('copies')
        .insert(payload);
      error = err;
    }

    // Atualizar Cutter na tabela books se foi alterado
    if (!error && formData.cutter.trim() && formData.book_id) {
      const currentBook = books.find(b => b.id === formData.book_id);
      const currentCutter = (currentBook as any)?.cutter || '';
      
      // Só atualiza se o cutter foi alterado
      if (formData.cutter.trim() !== currentCutter) {
        const { error: cutterError } = await (supabase as any)
          .from('books')
          .update({ cutter: formData.cutter.trim() })
          .eq('id', formData.book_id);
        
        if (cutterError) {
          console.error('Erro ao atualizar cutter:', cutterError);
          // Não bloqueia o salvamento se o cutter falhar
        }
      }
    }

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Salvo", description: editingCopy ? "Item atualizado." : "Item cadastrado." });
      setIsEditOpen(false);
      fetchCopies();
      fetchBooksList(); // Recarregar lista de livros para atualizar cutter
    }
  };

  const toggleProcess = async (copyId: string, field: string, currentValue: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('copies')
        .update({ [field]: !currentValue })
        .eq('id', copyId);

      if (error) throw error;

      toast({ 
        title: "Atualizado", 
        description: "Status de processamento alterado.",
        duration: 2000
      });
      
      fetchCopies();
    } catch (error: any) {
      console.error('Erro ao atualizar processamento:', error);
      toast({ 
        title: "Erro", 
        description: error?.message || "Não foi possível atualizar.", 
        variant: "destructive" 
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza? Esta ação remove o item do tombo.")) return;
    const { error } = await (supabase as any).from('copies').delete().eq('id', id);
    if (!error) {
      toast({ title: "Excluído", description: "Item removido." });
      fetchCopies();
    } else {
      toast({ title: "Erro ao excluir", description: "Verifique se há empréstimos vinculados.", variant: "destructive" });
    }
  };

  const openEdit = (copy: any) => {
    setEditingCopy(copy);
    setFormData({
      book_id: copy.book_id || "",
      library_id: copy.library_id || "",
      status: copy.status || "disponivel",
      code: copy.code || "",
      cutter: copy.books?.cutter || "",
      process_stamped: copy.process_stamped || false,
      process_indexed: copy.process_indexed || false,
      process_taped: copy.process_taped || false,
      local_categories: copy.local_categories || []
    });
    setIsEditOpen(true);
    
    // Para admin_rede, as cores já estão carregadas (todas)
    // Para bibliotecário, carregar cores se necessário
    if (user?.role === 'bibliotecario' && copy.library_id) {
      setSelectedLibraryForColors(copy.library_id);
      setTimeout(() => {
        fetchLibraryColors();
      }, 100);
    } else if (user?.role === 'admin_rede' && copy.library_id) {
      // Admin já tem todas as cores, apenas definir a biblioteca selecionada para o modal de cores
      setSelectedLibraryForColors(copy.library_id);
    }
  };

  const openNew = () => {
    setEditingCopy(null);
    setFormData({
      book_id: "",
      library_id: user?.role === 'bibliotecario' ? (user.library_id || "") : "",
      status: "disponivel",
      code: "",
      cutter: "",
      process_stamped: false,
      process_indexed: false,
      process_taped: false,
      local_categories: []
    });
    setIsEditOpen(true);
  };

  const toggleCategory = (catName: string) => {
    const current = formData.local_categories || [];
    if (current.includes(catName)) {
      setFormData({ ...formData, local_categories: current.filter(c => c !== catName) });
    } else {
      if (current.length >= 3) {
        toast({ title: "Limite", description: "Máximo de 3 cores.", variant: "destructive" });
        return;
      }
      setFormData({ ...formData, local_categories: [...current, catName] });
    }
  };

  const handleLibraryChangeForColors = (libraryId: string) => {
    setSelectedLibraryForColors(libraryId);
    setTimeout(() => {
      fetchLibraryColors();
    }, 100);
  };

  const getStatusBadge = (status: string | null | undefined) => {
    const statusValue = status || 'disponivel';
    
    switch (statusValue) {
      case 'disponivel':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">
            Disponível
          </Badge>
        );
      case 'emprestado':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300">
            Emprestado
          </Badge>
        );
      case 'manutencao':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300">
            Manutenção
          </Badge>
        );
      case 'extraviado':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300">
            Extraviado
          </Badge>
        );
      default:
        // Capitalizar primeira letra para status desconhecidos
        const capitalized = statusValue.charAt(0).toUpperCase() + statusValue.slice(1);
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            {capitalized}
          </Badge>
        );
    }
  };

  // Função auxiliar para contar itens por filtro de processamento
  const getProcessCount = (filterType: string) => {
    switch (filterType) {
      case 'pendente_geral':
        return copies.filter(c => 
          !c.process_stamped || !c.process_indexed || !c.process_taped
        ).length;
      case 'falta_carimbo':
        return copies.filter(c => !c.process_stamped).length;
      case 'falta_index':
        return copies.filter(c => !c.process_indexed).length;
      case 'falta_fita':
        return copies.filter(c => !c.process_taped).length;
      case 'prontos':
        return copies.filter(c => 
          c.process_stamped && c.process_indexed && c.process_taped
        ).length;
      default:
        return 0;
    }
  };

  // Função auxiliar para contar itens por filtro de status
  const getStatusCount = (filterType: string) => {
    switch (filterType) {
      case 'disponivel':
        return copies.filter(c => c.status === 'disponivel').length;
      case 'emprestado':
        return copies.filter(c => c.status === 'emprestado').length;
      case 'problemas':
        return copies.filter(c => 
          c.status === 'manutencao' || c.status === 'extraviado'
        ).length;
      default:
        return 0;
    }
  };

  const filteredCopies = copies.filter(c => {
    // Filtro de busca (título, tombo ou código)
    const matchesSearch = 
      c.books?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tombo?.toString().includes(searchTerm) ||
      c.code?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Filtro de status
    if (statusFilter !== 'todos') {
      if (statusFilter === 'problemas') {
        if (c.status !== 'manutencao' && c.status !== 'extraviado') {
          return false;
        }
      } else {
        if (c.status !== statusFilter) {
          return false;
        }
      }
    }

    // Filtro de processamento
    if (processFilter !== 'todos') {
      switch (processFilter) {
        case 'pendente_geral':
          if (c.process_stamped && c.process_indexed && c.process_taped) {
            return false;
          }
          break;
        case 'falta_carimbo':
          if (c.process_stamped) {
            return false;
          }
          break;
        case 'falta_index':
          if (c.process_indexed) {
            return false;
          }
          break;
        case 'falta_fita':
          if (c.process_taped) {
            return false;
          }
          break;
        case 'prontos':
          if (!c.process_stamped || !c.process_indexed || !c.process_taped) {
            return false;
          }
          break;
      }
    }

    return true;
  });

  // Função para obter valor aninhado (ex: 'books.title', 'libraries.name')
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  };

  // Função de ordenação
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Aplicar ordenação aos dados filtrados
  const sortedAndFilteredCopies = [...filteredCopies].sort((a, b) => {
    if (!sortConfig) return 0;

    let aValue = getNestedValue(a, sortConfig.key);
    let bValue = getNestedValue(b, sortConfig.key);

    // CORREÇÃO: Ordenação numérica para tombo
    if (sortConfig.key === 'tombo') {
      const aNum = Number(aValue) || 0;
      const bNum = Number(bValue) || 0;
      if (sortConfig.direction === 'asc') {
        return aNum - bNum;
      } else {
        return bNum - aNum;
      }
    }

    // Tratamento para valores nulos/undefined
    if (aValue == null) aValue = '';
    if (bValue == null) bValue = '';

    // Converter para string para comparação (outros campos)
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();

    if (sortConfig.direction === 'asc') {
      return aStr > bStr ? 1 : aStr < bStr ? -1 : 0;
    } else {
      return aStr < bStr ? 1 : aStr > bStr ? -1 : 0;
    }
  });

  // Componente para ícone de ordenação
  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground opacity-50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5 ml-1 text-primary" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1 text-primary" />;
  };

  const handleExportExcel = () => {
    try {
      const exportData = sortedAndFilteredCopies.map((copy) => ({
        'Nr. Tombo': copy.tombo || '-',
        'Biblioteca': copy.libraries?.name || '-',
        'Obra': copy.books?.title || '-',
        'Autor': copy.books?.author || '-',
        'Cutter': copy.books?.cutter || '-',
        'Carimbado': copy.process_stamped ? 'Sim' : 'Não',
        'Indexado': copy.process_indexed ? 'Sim' : 'Não',
        'Lombada': copy.process_taped ? 'Sim' : 'Não',
        'Categorias Locais': (copy.local_categories || []).join(', ') || '-',
        'Status': copy.status || '-',
        'Código': copy.code || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Acervo Local');

      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      const fileName = `acervo_local_${day}${month}${year}.xlsx`;

      XLSX.writeFile(wb, fileName);

      toast({
        title: 'Exportação realizada',
        description: `Arquivo ${fileName} gerado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível gerar o arquivo Excel.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 p-8 fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Acervo Local</h1>
          <p className="text-muted-foreground">Gestão de exemplares físicos (Tombos).</p>
        </div>
        <div className="flex gap-2">
          {user?.role === 'admin_rede' ? (
            <Select value={selectedLibraryForColors} onValueChange={handleLibraryChangeForColors}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione biblioteca para cores" />
              </SelectTrigger>
              <SelectContent>
                {libraries.map(lib => (
                  <SelectItem key={lib.id} value={lib.id}>{lib.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Button 
            variant="secondary" 
            onClick={() => {
              if (user?.role === 'admin_rede' && !selectedLibraryForColors) {
                toast({ 
                  title: "Atenção", 
                  description: "Selecione uma biblioteca primeiro", 
                  variant: "destructive" 
                });
                return;
              }
              setIsColorConfigOpen(true);
            }}
            disabled={user?.role === 'admin_rede' && !selectedLibraryForColors}
          >
            <Palette className="mr-2 h-4 w-4" /> Configurar Cores
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar Excel
          </Button>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Novo Item
          </Button>
        </div>
      </div>

      {/* Barra de Ferramentas */}
      <Card className="bg-muted/40 border-0 shadow-sm">
        <CardContent className="p-5 space-y-4">
          {/* Busca */}
          <div className="flex items-center gap-2 max-w-lg bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por Título, Tombo ou Código..." 
              className="border-none focus-visible:ring-0 bg-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtros Rápidos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t">
            {/* Grupo 1: Processamento Técnico */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Processamento Técnico</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={processFilter === 'todos' ? 'default' : 'outline'}
                onClick={() => setProcessFilter('todos')}
              >
                Todos
              </Button>
              <Button
                size="sm"
                variant={processFilter === 'pendente_geral' ? 'default' : 'outline'}
                onClick={() => setProcessFilter('pendente_geral')}
              >
                <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                Pendentes ({getProcessCount('pendente_geral')})
              </Button>
              <Button
                size="sm"
                variant={processFilter === 'falta_carimbo' ? 'default' : 'outline'}
                onClick={() => setProcessFilter('falta_carimbo')}
              >
                Falta Carimbo ({getProcessCount('falta_carimbo')})
              </Button>
              <Button
                size="sm"
                variant={processFilter === 'falta_index' ? 'default' : 'outline'}
                onClick={() => setProcessFilter('falta_index')}
              >
                Falta Index ({getProcessCount('falta_index')})
              </Button>
              <Button
                size="sm"
                variant={processFilter === 'falta_fita' ? 'default' : 'outline'}
                onClick={() => setProcessFilter('falta_fita')}
              >
                Falta Lombada ({getProcessCount('falta_fita')})
              </Button>
              <Button
                size="sm"
                variant={processFilter === 'prontos' ? 'default' : 'outline'}
                onClick={() => setProcessFilter('prontos')}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Prontos ({getProcessCount('prontos')})
              </Button>
              </div>
            </div>

            {/* Grupo 2: Situação no Acervo */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Situação no Acervo</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={statusFilter === 'todos' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('todos')}
              >
                Todas Situações
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'disponivel' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('disponivel')}
              >
                Disponíveis ({getStatusCount('disponivel')})
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'emprestado' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('emprestado')}
              >
                Emprestados ({getStatusCount('emprestado')})
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'problemas' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('problemas')}
              >
                <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                Problemas ({getStatusCount('problemas')})
              </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Capa</TableHead>
                  <TableHead 
                    className="font-semibold cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('tombo')}
                  >
                    <div className="flex items-center">
                      Nr. Tombo
                      <SortIcon columnKey="tombo" />
                    </div>
                  </TableHead>
                  {user?.role === 'admin_rede' && (
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('libraries.name')}
                    >
                      <div className="flex items-center">
                        Biblioteca
                        <SortIcon columnKey="libraries.name" />
                      </div>
                    </TableHead>
                  )}
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('books.title')}
                  >
                    <div className="flex items-center">
                      Obra
                      <SortIcon columnKey="books.title" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('books.cutter')}
                  >
                    <div className="flex items-center">
                      Cutter
                      <SortIcon columnKey="books.cutter" />
                    </div>
                  </TableHead>
                  <TableHead>Processamento</TableHead>
                  <TableHead>Cores</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      <SortIcon columnKey="status" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={user?.role === 'admin_rede' ? 9 : 8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">Carregando...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCopies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={user?.role === 'admin_rede' ? 9 : 8} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <BookIcon className="h-12 w-12 text-muted-foreground/30" />
                        <p className="text-sm font-medium">Nenhum item encontrado</p>
                        <p className="text-xs">Tente ajustar os filtros ou a busca</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAndFilteredCopies.map((copy) => (
                    <TableRow key={copy.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        {copy.books?.cover_url ? (
                          <img 
                            src={copy.books.cover_url} 
                            className="h-10 w-8 object-cover rounded" 
                            alt={copy.books.title}
                          />
                        ) : (
                          <BookIcon className="h-10 w-8 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-semibold text-blue-600">
                          #{copy.tombo || "N/A"}
                        </span>
                      </TableCell>
                  {user?.role === 'admin_rede' && (
                    <TableCell>
                      <span className="text-sm">{copy.libraries?.name || "N/A"}</span>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="font-medium line-clamp-1">{copy.books?.title || "Sem título"}</div>
                    <div className="text-xs text-muted-foreground">{copy.books?.author || ""}</div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">{copy.books?.cutter || "-"}</span>
                  </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant={copy.process_stamped ? "default" : "outline"}
                                  className={cn(
                                    "cursor-pointer transition-colors",
                                    copy.process_stamped
                                      ? "bg-green-600 hover:bg-green-700"
                                      : "hover:bg-muted"
                                  )}
                                  onClick={() => toggleProcess(copy.id, 'process_stamped', copy.process_stamped || false)}
                                >
                                  C
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Clique para {copy.process_stamped ? 'desmarcar' : 'marcar'} como Carimbado</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant={copy.process_indexed ? "default" : "outline"}
                                  className={cn(
                                    "cursor-pointer transition-colors",
                                    copy.process_indexed
                                      ? "bg-green-600 hover:bg-green-700"
                                      : "hover:bg-muted"
                                  )}
                                  onClick={() => toggleProcess(copy.id, 'process_indexed', copy.process_indexed || false)}
                                >
                                  I
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Clique para {copy.process_indexed ? 'desmarcar' : 'marcar'} como Indexado/Validado</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant={copy.process_taped ? "default" : "outline"}
                                  className={cn(
                                    "cursor-pointer transition-colors",
                                    copy.process_taped
                                      ? "bg-green-600 hover:bg-green-700"
                                      : "hover:bg-muted"
                                  )}
                                  onClick={() => toggleProcess(copy.id, 'process_taped', copy.process_taped || false)}
                                >
                                  L
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Clique para {copy.process_taped ? 'desmarcar' : 'marcar'} como Lombada Colada</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {(copy.local_categories || []).map((cat: string) => {
                        // CORREÇÃO: Filtrar por nome da categoria E library_id do exemplar
                        const colorDef = libraryColors.find(
                          lc => lc.category_name === cat && lc.library_id === copy.library_id
                        );
                        return (
                          <div 
                            key={cat} 
                            className="w-4 h-4 rounded-full border border-gray-300" 
                            style={{ backgroundColor: colorDef?.color_hex || '#ccc' }} 
                            title={`${cat}${colorDef ? '' : ' (cor não configurada)'}`} 
                          />
                        );
                      })}
                      {(!copy.local_categories || copy.local_categories.length === 0) && (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(copy.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(copy)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(copy.id)} className="hover:text-red-600" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Processamento Técnico</DialogTitle>
            <DialogDescription>
              {editingCopy ? "Editar item do acervo" : "Cadastrar novo item no acervo"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Obra *</Label>
                <Select 
                  value={formData.book_id} 
                  onValueChange={(val) => {
                    const selectedBook = books.find(b => b.id === val);
                    setFormData({
                      ...formData, 
                      book_id: val,
                      cutter: (selectedBook as any)?.cutter || ""
                    });
                  }} 
                  disabled={!!editingCopy}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a obra..." />
                  </SelectTrigger>
                  <SelectContent>
                    {books.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Código Cutter</Label>
                <Input 
                  value={formData.cutter} 
                  onChange={(e) => setFormData({...formData, cutter: e.target.value})}
                  placeholder="Ex: A123"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Código de classificação da obra
                </p>
              </div>

              {/* CORREÇÃO CRÍTICA: Select de Biblioteca para Admin */}
              {user?.role === 'admin_rede' && (
                <div className="space-y-2">
                  <Label>Biblioteca de Destino *</Label>
                  <Select 
                    value={formData.library_id} 
                    onValueChange={(val) => {
                      // Limpar categorias ao trocar de biblioteca
                      setFormData({
                        ...formData, 
                        library_id: val,
                        local_categories: [] // Limpar categorias da biblioteca anterior
                      });
                      setSelectedLibraryForColors(val);
                      // Não precisa recarregar cores, pois já temos todas carregadas
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a biblioteca..." />
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
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="extraviado">Extraviado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Código de Barras (Opcional)</Label>
                <Input 
                  value={formData.code} 
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="Código de barras do exemplar"
                />
                <p className="text-xs text-muted-foreground">
                  O Tombo será gerado automaticamente pelo sistema
                </p>
              </div>

              <div className="p-4 border rounded bg-slate-50 space-y-3">
                <Label className="text-base font-semibold">Checklist de Processamento Físico</Label>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.process_stamped} 
                    onCheckedChange={(c) => setFormData({...formData, process_stamped: !!c})} 
                  />
                  <span className="text-sm">1. Carimbado</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.process_indexed} 
                    onCheckedChange={(c) => setFormData({...formData, process_indexed: !!c})} 
                  />
                  <span className="text-sm">2. Indexado/Validado</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.process_taped} 
                    onCheckedChange={(c) => setFormData({...formData, process_taped: !!c})} 
                  />
                  <span className="text-sm">3. Lombada Colada</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cores / Categorias Locais</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Selecione até 3 categorias para organização local do acervo
              </p>
              <div className="border rounded p-2 h-[300px] overflow-y-auto">
                {(() => {
                  // Determinar library_id para filtrar cores
                  const libraryIdToFilter = user?.role === 'admin_rede' 
                    ? formData.library_id 
                    : user?.library_id;
                  
                  // Se for admin_rede e não tiver biblioteca selecionada
                  if (user?.role === 'admin_rede' && !formData.library_id) {
                    return (
                      <p className="text-xs text-muted-foreground p-2 text-center">
                        Selecione a biblioteca acima para ver as categorias.
                      </p>
                    );
                  }
                  
                  // Filtrar cores pela biblioteca selecionada
                  const filteredColors = libraryColors.filter(
                    lc => lc.library_id === libraryIdToFilter
                  );
                  
                  if (filteredColors.length === 0) {
                    return (
                      <p className="text-xs text-muted-foreground p-2">
                        Nenhuma cor configurada para esta biblioteca. Use o botão 'Configurar Cores' para criar categorias.
                      </p>
                    );
                  }
                  
                  return filteredColors.map(lc => {
                    const isSel = formData.local_categories?.includes(lc.category_name);
                    return (
                      <div 
                        key={lc.id} 
                        onClick={() => toggleCategory(lc.category_name)} 
                        className={`flex justify-between items-center p-2 rounded cursor-pointer border mb-1 transition-colors ${
                          isSel ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-sm font-medium">{lc.category_name}</span>
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" style={{backgroundColor: lc.color_hex}}/>
                      </div>
                    );
                  });
                })()}
              </div>
              {formData.local_categories.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                  <strong>Selecionadas ({formData.local_categories.length}/3):</strong> {formData.local_categories.join(", ")}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ColorConfigModal 
        isOpen={isColorConfigOpen} 
        onClose={() => { 
          setIsColorConfigOpen(false); 
          fetchLibraryColors(); 
        }} 
        libraryId={user?.role === 'admin_rede' ? selectedLibraryForColors : user?.library_id} 
      />
    </div>
  );
}
