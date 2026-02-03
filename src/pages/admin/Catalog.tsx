import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Search, Plus, Pencil, Eye, Loader2, Book as BookIcon, Download, Trash2, Check, ChevronsUpDown, Settings, Globe, Upload, FileText, AlertCircle, CheckCircle2, XCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { logCreate, logUpdate, logDelete } from '@/utils/audit';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Catalog() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estados de Dados
  const [books, setBooks] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<{name: string, count: number}[]>([]);
  const [openCountry, setOpenCountry] = useState(false);
  
  // Lista de países com siglas de 3 dígitos em português
  const countryList = [
    "BRA - Brasil", "USA - Estados Unidos", "ARG - Argentina", "CHL - Chile", "COL - Colômbia",
    "MEX - México", "PER - Peru", "VEN - Venezuela", "URY - Uruguai", "PRY - Paraguai",
    "BOL - Bolívia", "ECU - Equador", "PAN - Panamá", "CRI - Costa Rica", "GTM - Guatemala",
    "HND - Honduras", "NIC - Nicarágua", "SLV - El Salvador", "CUB - Cuba", "DOM - República Dominicana",
    "JAM - Jamaica", "HTI - Haiti", "TTO - Trinidad e Tobago", "GBR - Reino Unido", "FRA - França",
    "DEU - Alemanha", "ITA - Itália", "ESP - Espanha", "PRT - Portugal", "NLD - Holanda",
    "BEL - Bélgica", "CHE - Suíça", "AUT - Áustria", "SWE - Suécia", "NOR - Noruega",
    "DNK - Dinamarca", "FIN - Finlândia", "POL - Polônia", "RUS - Rússia", "CHN - China",
    "JPN - Japão", "KOR - Coreia do Sul", "IND - Índia", "AUS - Austrália", "NZL - Nova Zelândia",
    "ZAF - África do Sul", "EGY - Egito", "MAR - Marrocos", "TUR - Turquia", "ISR - Israel",
    "SAU - Arábia Saudita", "ARE - Emirados Árabes", "CAN - Canadá"
  ]; 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados de UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [searchingISBN, setSearchingISBN] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedBookDetails, setSelectedBookDetails] = useState<any>(null);
  const [openCategory, setOpenCategory] = useState(false);

  const [formData, setFormData] = useState({
    isbn: "", title: "", subtitle: "", author: "", publisher: "", publication_date: "",
    page_count: "", language: "pt-BR", description: "", category: "", cover_url: "",
    series: "", volume: "", edition: "", translator: "", publication_place: "", cutter: "",
    country_classification: ""
  });

  useEffect(() => {
    fetchBooks();
  }, [user]);

  const fetchBooks = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('books') 
      .select('*, copies(id, status, library_id, libraries(name))')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      // Se for bibliotecário, filtrar apenas exemplares da sua biblioteca
      let filteredData = data;
      if (user?.role === 'bibliotecario' && user.library_id) {
        console.log('[Catalog] Filtrando livros para bibliotecário, library_id:', user.library_id);
        filteredData = data.map((book: any) => ({
          ...book,
          copies: book.copies?.filter((copy: any) => copy.library_id === user.library_id) || []
        })).filter((book: any) => book.copies && book.copies.length > 0);
        console.log('[Catalog] Livros após filtro:', filteredData.length, 'de', data.length);
      }
      setBooks(filteredData);
      calculateCategoryStats(filteredData);
    }
    setLoading(false);
  };

  const calculateCategoryStats = (booksData: any[]) => {
    const stats = new Map<string, number>();
    booksData.forEach(book => {
      if (book.category) {
        const count = stats.get(book.category) || 0;
        stats.set(book.category, count + 1);
      }
    });
    const statsArray = Array.from(stats.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    setCategoryStats(statsArray);
  };

  const translateCategory = (cat: string) => {
    if (!cat) return "";
    const map: Record<string, string> = {
      "Philosophy": "Filosofia", "History": "História", "Science": "Ciências", "Fiction": "Ficção",
      "Juvenile Fiction": "Infantojuvenil", "Children's stories": "Literatura Infantil", "Psychology": "Psicologia",
      "Religion": "Religião", "Biography": "Biografia", "Education": "Educação", "English": "Inglês",
      "Portuguese": "Português", "Literature": "Literatura", "Art": "Arte", "Music": "Música"
    };
    for (const key in map) {
      if (cat.toLowerCase().includes(key.toLowerCase())) return map[key];
    }
    return cat;
  };

  const handleSearchISBN = async () => {
    if (!formData.isbn) return toast({ title: "Digite um ISBN", variant: "destructive" });
    
    setSearchingISBN(true);
    const cleanIsbn = formData.isbn.replace(/[^0-9]/g, '');

    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}&langRestrict=pt`);
      const data = await response.json();

      if (data.totalItems > 0) {
        const info = data.items[0].volumeInfo;
        const googleCategory = translateCategory(info.categories ? info.categories[0] : "");
        
        // Tentar extrair país do ISBN ou da publicação
        let detectedCountry = "";
        
        // Mapear países comuns baseado em padrões (sigla de 2 dígitos para sigla de 3 dígitos)
        const countryMap: Record<string, string> = {
          "BR": "BRA - Brasil", "US": "USA - Estados Unidos", "GB": "GBR - Reino Unido",
          "FR": "FRA - França", "DE": "DEU - Alemanha", "IT": "ITA - Itália",
          "ES": "ESP - Espanha", "PT": "PRT - Portugal", "AR": "ARG - Argentina",
          "MX": "MEX - México", "CL": "CHL - Chile", "CO": "COL - Colômbia",
          "CA": "CAN - Canadá", "AU": "AUS - Austrália", "NZ": "NZL - Nova Zelândia",
          "JP": "JPN - Japão", "CN": "CHN - China", "KR": "KOR - Coreia do Sul",
          "IN": "IND - Índia", "RU": "RUS - Rússia", "ZA": "ZAF - África do Sul"
        };
        
        // Tentar detectar pelo campo country do Google Books
        if (info.country && countryMap[info.country]) {
          detectedCountry = countryMap[info.country];
        }
        // Tentar detectar pelo idioma (fallback)
        else if (info.language) {
          const langMap: Record<string, string> = {
            "pt": "BRA - Brasil", "pt-BR": "BRA - Brasil", "pt-PT": "PRT - Portugal",
            "en": "USA - Estados Unidos", "en-US": "USA - Estados Unidos", "en-GB": "GBR - Reino Unido",
            "es": "ESP - Espanha", "es-ES": "ESP - Espanha", "es-MX": "MEX - México",
            "fr": "FRA - França", "de": "DEU - Alemanha", "it": "ITA - Itália",
            "ja": "JPN - Japão", "zh": "CHN - China", "ko": "KOR - Coreia do Sul"
          };
          if (langMap[info.language]) {
            detectedCountry = langMap[info.language];
          }
        }
        
        setFormData(prev => ({
          ...prev,
          isbn: cleanIsbn, 
          title: info.title || "",
          subtitle: info.subtitle || "",
          author: info.authors ? info.authors.join(", ") : "",
          publisher: info.publisher || "",
          publication_date: info.publishedDate || "",
          description: info.description || "",
          page_count: info.pageCount || "",
          category: googleCategory,
          language: info.language || "pt-BR",
          cover_url: info.imageLinks?.thumbnail?.replace('http://', 'https://') || "",
          country_classification: detectedCountry,
        }));
        
        const exists = categoryStats.some(c => c.name === googleCategory);
        const desc = exists 
          ? "Dados preenchidos." 
          : `Dados preenchidos. Novo Assunto "${googleCategory}" será criado.`;

        toast({ title: "Encontrado!", description: desc });
      } else {
        toast({ title: "Não encontrado", description: "Preencha manualmente.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erro na busca", variant: "destructive" });
    } finally {
      setSearchingISBN(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title) return toast({ title: "Título obrigatório", variant: "destructive" });
    
    const cleanIsbn = formData.isbn ? formData.isbn.replace(/[^0-9]/g, '') : "";
    setSaving(true);

    try {
      if (cleanIsbn && (!editingId || (editingId && cleanIsbn !== books.find(b => b.id === editingId)?.isbn))) {
        const { data: existing } = await (supabase as any)
          .from('books').select('id').eq('isbn', cleanIsbn).maybeSingle();
        if (existing) throw new Error("Este ISBN já está cadastrado.");
      }

      const payload = {
        ...formData,
        isbn: cleanIsbn,
        page_count: formData.page_count ? parseInt(String(formData.page_count)) : null
      };

      let error = null;
      let bookData = null;
      
      if (editingId) {
        // Buscar valores antigos para auditoria
        const { data: oldBook } = await (supabase as any)
          .from('books')
          .select('*')
          .eq('id', editingId)
          .single();
        
        const { data: updatedBook, error: updateError } = await (supabase as any)
          .from('books')
          .update(payload)
          .eq('id', editingId)
          .select()
          .single();
        
        error = updateError;
        bookData = updatedBook;
        
        // Log de auditoria
        if (!error && oldBook && updatedBook) {
          await logUpdate(
            'BOOK_UPDATE',
            'book',
            editingId,
            formData.title,
            oldBook,
            payload,
            user?.id,
            user?.library_id
          );
        }
      } else {
        const { data: newBook, error: insertError } = await (supabase as any)
          .from('books')
          .insert(payload)
          .select()
          .single();
        
        error = insertError;
        bookData = newBook;
        
        // Log de auditoria
        if (!error && newBook) {
          await logCreate(
            'BOOK_CREATE',
            'book',
            newBook.id,
            formData.title,
            payload,
            user?.id,
            user?.library_id
          );
        }
      }

      if (error) throw error;

      toast({ title: "Sucesso", description: "Obra salva no Catálogo." });
      setIsModalOpen(false);
      setTimeout(() => { fetchBooks(); resetForm(); }, 500);

    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryName: string, count: number) => {
    if (count > 0) {
      if (!confirm(`ATENÇÃO: Existem ${count} livros usando o assunto "${categoryName}".\n\nDeseja remover este assunto de todos os livros?`)) {
        return;
      }
    }

    try {
      const { error } = await (supabase as any)
        .from('books')
        .update({ category: '' })
        .eq('category', categoryName);

      if (error) throw error;

      toast({ title: "Assunto removido", description: "Os livros foram atualizados." });
      fetchBooks();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (book: any) => {
    const totalCopies = book.copies?.length || 0;
    if (totalCopies > 0) {
      toast({ title: "Bloqueado", description: "Existem exemplares vinculados.", variant: "destructive" });
      return;
    }
    if (!confirm(`Excluir "${book.title}"?`)) return;

    const { error } = await (supabase as any).from('books').delete().eq('id', book.id);
    if (!error) {
      toast({ title: "Excluído", description: "Registro removido." });
      fetchBooks();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      isbn: "", title: "", subtitle: "", author: "", publisher: "", publication_date: "",
      page_count: "", language: "pt-BR", description: "", category: "", cover_url: "",
      series: "", volume: "", edition: "", translator: "", publication_place: "", cutter: "",
      country_classification: ""
    });
  };

  const handleEdit = (book: any) => {
    setEditingId(book.id);
    setFormData({
      isbn: book.isbn || "", title: book.title || "", subtitle: book.subtitle || "",
      author: book.author || "", publisher: book.publisher || "", publication_date: book.publication_date || "",
      page_count: book.page_count || "", language: book.language || "pt-BR", description: book.description || "",
      category: book.category || "", cover_url: book.cover_url || "", series: book.series || "",
      volume: book.volume || "", edition: book.edition || "", translator: book.translator || "",
      publication_place: book.publication_place || "", cutter: book.cutter || "",
      country_classification: book.country_classification || ""
    });
    setIsModalOpen(true);
  };

  const handleViewDetails = (book: any) => {
    const librariesMap = new Map();
    // Se for bibliotecário, mostrar apenas exemplares da sua biblioteca
    const copiesToShow = (user?.role === 'bibliotecario' && user?.library_id) 
      ? (book.copies?.filter((c:any) => c.library_id === user.library_id) || [])
      : (book.copies || []);
    
    copiesToShow.forEach((copy: any) => {
      const libName = copy.libraries?.name || "Desconhecida";
      if (!librariesMap.has(libName)) {
        librariesMap.set(libName, { total: 0, disponivel: 0 });
      }
      const libData = librariesMap.get(libName);
      libData.total += 1;
      if (copy.status === 'disponivel') libData.disponivel += 1;
    });

    const details = Array.from(librariesMap.entries()).map(([name, data]) => ({ name, ...data }));
    setSelectedBookDetails({ title: book.title, libraries: details });
    setIsDetailsOpen(true);
  };

  const handleExport = () => {
    const exportData = books.map(book => ({
      "ISBN": book.isbn, "Título": book.title, "Autor": book.author, "Assunto": book.category,
      "Total Rede": book.copies?.length || 0,
      "Disp. Rede": book.copies?.filter((c:any) => c.status === 'disponivel').length || 0
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Catalogo");
    XLSX.writeFile(wb, "catalogo_rede.xlsx");
  };

  // Importação/exportação MARC removida
  const parseMARC = () => ({ records: [], errors: [], analysis: {} });

  const filteredBooks = books.filter(book => 
    book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 p-8 fade-in">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Catálogo da Rede</h1>
          <p className="text-muted-foreground">Gestão unificada de obras de todas as bibliotecas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4"/> Excel</Button>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nova Obra
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-md bg-white p-2 rounded-md border">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input 
          placeholder="Pesquisar por título, autor ou ISBN..." 
          className="border-none focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Capa</TableHead>
              <TableHead>ISBN</TableHead>
              <TableHead>Obra</TableHead>
              <TableHead>Assunto</TableHead> {/* ALTERADO AQUI */}
              <TableHead className="text-center bg-blue-50 text-blue-700">Total Rede</TableHead>
              <TableHead className="text-center bg-blue-50 text-blue-700">Disp. Rede</TableHead>
              <TableHead className="text-center bg-green-50 text-green-700">Total Local</TableHead>
              <TableHead className="text-center bg-green-50 text-green-700">Disp. Local</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8">Carregando catálogo...</TableCell></TableRow>
            ) : filteredBooks.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma obra encontrada.</TableCell></TableRow>
            ) : (
              filteredBooks.map((book) => {
                const myLibId = user?.library_id;
                // Se for bibliotecário, mostrar apenas exemplares da sua biblioteca
                const copiesToShow = (user?.role === 'bibliotecario' && myLibId) 
                  ? (book.copies?.filter((c:any) => c.library_id === myLibId) || [])
                  : (book.copies || []);
                
                const totalRede = copiesToShow.length;
                const dispRede = copiesToShow.filter((c:any) => c.status === 'disponivel').length;
                const totalLocal = totalRede; // Para bibliotecário, local = total (já filtrado)
                const dispLocal = dispRede; // Para bibliotecário, disp local = disp total (já filtrado)

                return (
                  <TableRow key={book.id}>
                    <TableCell>
                      {book.cover_url ? <img src={book.cover_url} className="h-10 w-8 object-cover rounded border" /> : <div className="h-10 w-8 bg-slate-100 rounded flex items-center justify-center"><BookIcon className="h-4 w-4 text-slate-300"/></div>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{book.isbn || "-"}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm line-clamp-1">{book.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{book.author}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{book.category || "Geral"}</Badge></TableCell>
                    <TableCell className="text-center bg-blue-50/50 font-medium">{totalRede}</TableCell>
                    <TableCell className="text-center bg-blue-50/50">{dispRede}</TableCell>
                    <TableCell className="text-center bg-green-50/50 font-medium">{totalLocal}</TableCell>
                    <TableCell className="text-center bg-green-50/50">{dispLocal}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(book)}><Eye className="h-4 w-4 text-blue-600" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(book)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(book)} className="hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL GESTÃO DE ASSUNTOS */}
      <Dialog open={isCategoryManagerOpen} onOpenChange={setIsCategoryManagerOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Gerenciar Assuntos</DialogTitle></DialogHeader>
          <div className="max-h-[300px] overflow-y-auto border rounded-md">
            <Table>
              <TableHeader><TableRow><TableHead>Assunto</TableHead><TableHead className="text-right">Livros</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {categoryStats.map((stat, i) => (
                  <TableRow key={i}>
                    <TableCell>{stat.name}</TableCell>
                    <TableCell className="text-right">{stat.count}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(stat.name, stat.count)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL CADASTRO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Editar Obra" : "Nova Obra"}</DialogTitle></DialogHeader>
          <Tabs defaultValue="main">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="main">Principal</TabsTrigger>
              <TabsTrigger value="additional">Informações Adicionais</TabsTrigger>
            </TabsList>
            
            <TabsContent value="main" className="space-y-4 py-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label>ISBN</Label>
                  <div className="flex gap-2">
                    <Input value={formData.isbn} onChange={e=>setFormData({...formData, isbn:e.target.value})} placeholder="Apenas números"/>
                    <Button onClick={handleSearchISBN} disabled={searchingISBN}>
                      {searchingISBN ? <Loader2 className="animate-spin h-4 w-4"/> : <Search className="h-4 w-4"/>}
                    </Button>
                  </div>
                </div>
                <div className="flex-[2] space-y-1">
                  <Label>Título</Label>
                  <Input value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Autor</Label><Input value={formData.author} onChange={e=>setFormData({...formData, author:e.target.value})}/></div>
                <div></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* CAMPO DE ASSUNTO COM GESTÃO */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label>Assunto (Global)</Label>
                    <Button variant="link" size="sm" className="h-4 p-0 text-xs" onClick={() => setIsCategoryManagerOpen(true)}>
                      <Settings className="h-3 w-3 mr-1" /> Gerenciar
                    </Button>
                  </div>
                  <Popover open={openCategory} onOpenChange={setOpenCategory}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openCategory} className="w-full justify-between">
                        {formData.category || "Selecione..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar assunto..." />
                        <CommandList>
                          <CommandEmpty className="py-2 px-4 text-xs text-muted-foreground">
                            Nenhum encontrado. Digite abaixo.
                          </CommandEmpty>
                          <CommandGroup heading="Existentes">
                            {categoryStats.map((stat) => (
                              <CommandItem key={stat.name} value={stat.name} onSelect={(val) => {
                                  setFormData({...formData, category: stat.name});
                                  setOpenCategory(false);
                              }}>
                                <Check className={cn("mr-2 h-4 w-4", formData.category === stat.name ? "opacity-100" : "opacity-0")} />
                                {stat.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                      <div className="p-2 border-t bg-slate-50">
                        <Label className="text-xs text-muted-foreground">Novo Assunto:</Label>
                        <Input 
                          className="h-8 mt-1 bg-white" 
                          placeholder="Digite para criar..." 
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* CAMPO DE CLASSIFICAÇÃO PAÍS */}
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Classificação País
                  </Label>
                  <Popover open={openCountry} onOpenChange={setOpenCountry}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openCountry} className="w-full justify-between">
                        {formData.country_classification || "Selecione..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar país..." />
                        <CommandList>
                          <CommandEmpty className="py-2 px-4 text-xs text-muted-foreground">
                            Nenhum encontrado. Digite abaixo.
                          </CommandEmpty>
                          <CommandGroup heading="Países">
                            {countryList.map((country) => (
                              <CommandItem key={country} value={country} onSelect={(val) => {
                                  setFormData({...formData, country_classification: val});
                                  setOpenCountry(false);
                              }}>
                                <Check className={cn("mr-2 h-4 w-4", formData.country_classification === country ? "opacity-100" : "opacity-0")} />
                                {country}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                      <div className="p-2 border-t bg-slate-50">
                        <Label className="text-xs text-muted-foreground">Novo País (formato: SIG - Nome):</Label>
                        <Input 
                          className="h-8 mt-1 bg-white" 
                          placeholder="Ex: BRA - Brasil" 
                          value={formData.country_classification}
                          onChange={(e) => setFormData({...formData, country_classification: e.target.value})}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-1"><Label>Descrição</Label><Textarea className="h-20" value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})}/></div>
              <div className="space-y-1"><Label>Capa URL</Label><Input value={formData.cover_url} onChange={e=>setFormData({...formData, cover_url:e.target.value})}/></div>
            </TabsContent>

            <TabsContent value="additional" className="space-y-6 py-4">
              {/* Dados de Publicação */}
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-foreground border-b pb-2">Dados de Publicação</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Editora</Label>
                    <Input value={formData.publisher} onChange={e=>setFormData({...formData, publisher:e.target.value})}/>
                  </div>
                  <div className="space-y-1">
                    <Label>Ano</Label>
                    <Input value={formData.publication_date} onChange={e=>setFormData({...formData, publication_date:e.target.value})}/>
                  </div>
                  <div className="space-y-1">
                    <Label>Páginas</Label>
                    <Input type="number" value={formData.page_count} onChange={e=>setFormData({...formData, page_count:e.target.value})}/>
                  </div>
                  <div className="space-y-1">
                    <Label>Idioma</Label>
                    <Input value={formData.language} onChange={e=>setFormData({...formData, language:e.target.value})}/>
                  </div>
                </div>
              </div>

              {/* Dados Biblioteconômicos */}
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-foreground border-b pb-2">Dados Biblioteconômicos</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Série</Label>
                    <Input value={formData.series} onChange={e=>setFormData({...formData, series:e.target.value})}/>
                  </div>
                  <div className="space-y-1">
                    <Label>Volume</Label>
                    <Input value={formData.volume} onChange={e=>setFormData({...formData, volume:e.target.value})}/>
                  </div>
                  <div className="space-y-1">
                    <Label>Cutter</Label>
                    <Input value={formData.cutter} onChange={e=>setFormData({...formData, cutter:e.target.value})}/>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={()=>setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : null}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Disponibilidade: {selectedBookDetails?.title}</DialogTitle></DialogHeader>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Biblioteca</TableHead><TableHead className="text-center">Total</TableHead><TableHead className="text-center">Disponível</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {selectedBookDetails?.libraries.map((lib: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{lib.name}</TableCell>
                  <TableCell className="text-center">{lib.total}</TableCell>
                  <TableCell className="text-center"><Badge variant={lib.disponivel > 0 ? "success" : "secondary"}>{lib.disponivel}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {false && (
        <>
      {/* Modal de Importação MARC */}
      <Dialog open={isImportMarcOpen} onOpenChange={setIsImportMarcOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Registros MARC</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Carregar Arquivo</TabsTrigger>
              <TabsTrigger value="analysis" disabled={marcPreview.length === 0}>
                Análise ({marcPreview.length})
              </TabsTrigger>
              <TabsTrigger value="preview" disabled={marcPreview.length === 0}>
                Preview ({marcPreview.length})
              </TabsTrigger>
            </TabsList>
            
            {/* Aba 1: Upload */}
            <TabsContent value="upload" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Selecione o arquivo MARC (.mrc ou .txt)</Label>
                <Input
                  type="file"
                  accept=".mrc,.txt,.mar"
                  onChange={handleAnalyzeMARC}
                  disabled={importingMarc}
                />
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: MARC21 (.mrc, .txt, .mar)
                </p>
              </div>
              
              {marcAnalysis && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Análise do Arquivo
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total de Blocos</p>
                      <p className="text-lg font-bold">{marcAnalysis.totalBlocks}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Registros Válidos</p>
                      <p className="text-lg font-bold text-green-600">{marcAnalysis.validRecords}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Com Avisos</p>
                      <p className="text-lg font-bold text-yellow-600">{marcAnalysis.invalidRecords}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Campos Encontrados</p>
                      <p className="text-lg font-bold">{marcAnalysis.fieldsFound.size}</p>
                    </div>
                  </div>
                  
                  {marcAnalysis.fieldsFound.size > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Campos MARC detectados:</p>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(marcAnalysis.fieldsFound).sort().map(field => (
                          <Badge key={field} variant="outline" className="text-xs">{field}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {marcErrors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Avisos e Erros ({marcErrors.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {marcErrors.map((error, idx) => (
                      <div key={idx} className="text-xs text-destructive/80 flex items-start gap-2">
                        <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1">
                <p className="font-semibold">Informações:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Registros com ISBN serão atualizados se já existirem</li>
                  <li>Registros sem ISBN serão inseridos como novos</li>
                  <li>Campos suportados: Título, Autor, ISBN, Editora, Ano, Assunto, etc.</li>
                </ul>
              </div>
            </TabsContent>
            
            {/* Aba 2: Análise Detalhada */}
            <TabsContent value="analysis" className="space-y-4 py-4">
              {marcAnalysis && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Estatísticas</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total de Blocos:</span>
                          <span className="font-semibold">{marcAnalysis.totalBlocks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Válidos:</span>
                          <span className="font-semibold text-green-600">{marcAnalysis.validRecords}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Com Avisos:</span>
                          <span className="font-semibold text-yellow-600">{marcAnalysis.invalidRecords}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Campos Únicos:</span>
                          <span className="font-semibold">{marcAnalysis.fieldsFound.size}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Campos MARC</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                          {Array.from(marcAnalysis.fieldsFound).sort().map(field => (
                            <Badge key={field} variant="outline" className="text-xs">{field}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Ações</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button 
                          onClick={handleImportMARC} 
                          disabled={importingMarc || marcPreview.length === 0}
                          className="w-full"
                        >
                          {importingMarc ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Importando...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Importar {marcPreview.length} Registros
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setMarcPreview([]);
                            setMarcErrors([]);
                            setMarcAnalysis(null);
                            setMarcRawText('');
                          }}
                          className="w-full"
                        >
                          Limpar Análise
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {marcErrors.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm text-destructive flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Erros e Avisos ({marcErrors.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {marcErrors.map((error, idx) => (
                            <div key={idx} className="text-xs p-2 bg-destructive/5 border border-destructive/20 rounded flex items-start gap-2">
                              <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0 text-destructive" />
                              <span className="text-destructive/80">{error}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
            
            {/* Aba 3: Preview dos Registros */}
            <TabsContent value="preview" className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {marcPreview.length} registros encontrados
                  </p>
                  <Button 
                    onClick={handleImportMARC} 
                    disabled={importingMarc}
                    size="sm"
                  >
                    {importingMarc ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Importar Todos
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Autor</TableHead>
                        <TableHead>ISBN</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-20">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marcPreview.map((record, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs text-muted-foreground">
                            {record._blockIndex || idx + 1}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{record.title || <span className="text-muted-foreground italic">Sem título</span>}</div>
                            {record.subtitle && (
                              <div className="text-xs text-muted-foreground">{record.subtitle}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{record.author || '-'}</TableCell>
                          <TableCell className="text-xs font-mono">{record.isbn || '-'}</TableCell>
                          <TableCell>
                            {record._errors && record._errors.length > 0 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="destructive" className="cursor-help">
                                      {record._errors.length} aviso(s)
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      {record._errors.map((err: string, i: number) => (
                                        <p key={i} className="text-xs">{err}</p>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Válido
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedMarcRecord(record)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Modal de Detalhes do Registro MARC */}
          {selectedMarcRecord && (
            <Dialog open={!!selectedMarcRecord} onOpenChange={() => setSelectedMarcRecord(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Detalhes do Registro MARC #{selectedMarcRecord._blockIndex}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedMarcRecord._errors && selectedMarcRecord._errors.length > 0 && (
                    <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                      <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Avisos ({selectedMarcRecord._errors.length})
                      </h4>
                      <ul className="space-y-1">
                        {selectedMarcRecord._errors.map((err: string, i: number) => (
                          <li key={i} className="text-xs text-destructive/80">• {err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Título</Label>
                      <p className="font-medium">{selectedMarcRecord.title || <span className="text-muted-foreground italic">Não informado</span>}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Subtítulo</Label>
                      <p>{selectedMarcRecord.subtitle || '-'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Autor</Label>
                      <p>{selectedMarcRecord.author || '-'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">ISBN</Label>
                      <p className="font-mono text-sm">{selectedMarcRecord.isbn || '-'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Editora</Label>
                      <p>{selectedMarcRecord.publisher || '-'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Local de Publicação</Label>
                      <p>{selectedMarcRecord.publication_place || '-'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Ano</Label>
                      <p>{selectedMarcRecord.publication_date || '-'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Páginas</Label>
                      <p>{selectedMarcRecord.page_count || '-'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Assunto</Label>
                      <p>{selectedMarcRecord.category || '-'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Idioma</Label>
                      <p>{selectedMarcRecord.language || '-'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">País</Label>
                      <p>{selectedMarcRecord.country_classification || '-'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Cutter</Label>
                      <p className="font-mono text-sm">{selectedMarcRecord.cutter || '-'}</p>
                    </div>
                  </div>
                  
                  {selectedMarcRecord.description && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Descrição</Label>
                      <p className="text-sm bg-muted/50 p-3 rounded max-h-32 overflow-y-auto">
                        {selectedMarcRecord.description}
                      </p>
                    </div>
                  )}
                  
                  {selectedMarcRecord._rawLines && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Código MARC Original</Label>
                      <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-xs max-h-40 overflow-y-auto">
                        {selectedMarcRecord._rawLines.map((line: string, i: number) => (
                          <div key={i} className="whitespace-pre">{line}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => {
              setIsImportMarcOpen(false);
              setMarcPreview([]);
              setMarcErrors([]);
              setMarcAnalysis(null);
              setMarcRawText('');
              setSelectedMarcRecord(null);
            }}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}