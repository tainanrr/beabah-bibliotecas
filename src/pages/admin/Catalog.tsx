import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Search, Plus, Pencil, Eye, Loader2, Book as BookIcon, Download, Trash2, Check, ChevronsUpDown, Settings, Globe, Upload, FileText, AlertCircle, CheckCircle2, XCircle, Info, Image, Link, X, Package, Keyboard, Smartphone, Camera, ScanBarcode, ArrowLeft, RotateCcw, Crop, Save, ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { cn, includesIgnoringAccents, normalizeText } from "@/lib/utils";
import { logCreate, logUpdate, logDelete } from '@/utils/audit';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Html5Qrcode } from "html5-qrcode";
import ReactCrop, { Crop as CropType, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

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
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 40;

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
    country_classification: "", tags: ""
  });
  
  // Estado para controle de "Sem ISBN"
  const [noIsbn, setNoIsbn] = useState(false);
  
  // Estados para upload de imagem da capa
  const [coverInputMode, setCoverInputMode] = useState<'url' | 'upload' | 'search'>('url');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string>('');
  
  // Estados para busca de capas alternativas
  const [searchingCovers, setSearchingCovers] = useState(false);
  const [coverOptions, setCoverOptions] = useState<{ url: string; source: string }[]>([]);
  const [showCoverOptions, setShowCoverOptions] = useState(false);
  
  // Estado para dialog de sucesso com tombos
  const [successDialog, setSuccessDialog] = useState<{ open: boolean; title: string; message: string }>({ open: false, title: '', message: '' });

  // Estados para Cadastro Rápido Integrado (Catálogo + Acervo)
  const [addToInventory, setAddToInventory] = useState(false);
  const [inventoryLibraryId, setInventoryLibraryId] = useState<string>("");
  const [inventoryOrigin, setInventoryOrigin] = useState<'comprado' | 'doado' | 'indefinido'>('indefinido');
  const [libraries, setLibraries] = useState<any[]>([]);
  
  // Lista de exemplares a criar (cada um com tombo manual ou automático)
  type InventoryItem = { id: number; tombo: string; autoTombo: boolean };
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    { id: 1, tombo: '', autoTombo: false } // Auto DESMARCADO por padrão
  ]);
  
  // Estados para processamento e cores dos exemplares
  const [inventoryProcessing, setInventoryProcessing] = useState({
    stamped: true,   // C - Carimbado
    indexed: true,   // I - Indexado
    taped: true      // L - Lombada
  });
  const [inventoryColors, setInventoryColors] = useState<string[]>([]);
  const [libraryColors, setLibraryColors] = useState<any[]>([]);
  const [allCopies, setAllCopies] = useState<any[]>([]);
  const [openCopyColorsPopover, setOpenCopyColorsPopover] = useState(false);
  const [copyColorsSearch, setCopyColorsSearch] = useState("");
  
  // Refs para atalhos de teclado
  const isbnInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Estados para Modo Mobile
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [mobileStep, setMobileStep] = useState<'scan' | 'review' | 'camera' | 'crop'>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedISBN, setScannedISBN] = useState("");
  const [mobileFormData, setMobileFormData] = useState({
    isbn: "", title: "", subtitle: "", author: "", publisher: "", cover_url: "", category: "", cutter: "",
    publication_date: "", page_count: "", language: "pt-BR", description: "",
    series: "", volume: "", edition: "", translator: "", publication_place: "", country_classification: "", tags: ""
  });
  
  // Estado para controle de "Sem ISBN" no modo mobile
  const [mobileNoIsbn, setMobileNoIsbn] = useState(false);
  
  // Estados para diálogo de confirmação de Cutter vazio (modo mobile)
  const [showCutterConfirmDialog, setShowCutterConfirmDialog] = useState(false);
  const [cutterDialogValue, setCutterDialogValue] = useState("");
  const [cutterConfirmedEmpty, setCutterConfirmedEmpty] = useState(false);
  const cutterConfirmedRef = useRef(false); // Ref síncrona para evitar problema de estado assíncrono
  const cutterValueRef = useRef(""); // Ref síncrona para valor do Cutter digitado no diálogo
  
  // Estados para diálogo de confirmação de Cutter vazio (modo computador)
  const [showDesktopCutterDialog, setShowDesktopCutterDialog] = useState(false);
  const [desktopCutterDialogValue, setDesktopCutterDialogValue] = useState("");
  const desktopCutterConfirmedRef = useRef(false);
  const desktopCutterValueRef = useRef("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropType>({ unit: '%', width: 80, height: 90, x: 10, y: 5 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [mobileSaving, setMobileSaving] = useState(false);
  const [mobileSearching, setMobileSearching] = useState(false);
  const [mobileSearchStatus, setMobileSearchStatus] = useState("");
  
  // Estados para cadastro de exemplares no modo mobile
  const [mobileAddToInventory, setMobileAddToInventory] = useState(true); // Padrão marcado
  const [mobileInventoryLibraryId, setMobileInventoryLibraryId] = useState("");
  const [mobileInventoryOrigin, setMobileInventoryOrigin] = useState<'comprado' | 'doado' | 'indefinido'>('indefinido');
  const [mobileInventoryQty, setMobileInventoryQty] = useState(1);
  const [mobileInventoryCopies, setMobileInventoryCopies] = useState<Array<{
    tombo: string;
    autoTombo: boolean;
    process_stamped: boolean;
    process_indexed: boolean;
    process_taped: boolean;
    colors: string[];
  }>>([{ tombo: "", autoTombo: false, process_stamped: true, process_indexed: true, process_taped: true, colors: [] }]);
  const [mobileActiveTab, setMobileActiveTab] = useState<'principal' | 'detalhes' | 'acervo'>('principal');
  const [mobileSelectedColors, setMobileSelectedColors] = useState<string[]>([]);
  const [showMobileScanner, setShowMobileScanner] = useState(false);
  const [showMobileCamera, setShowMobileCamera] = useState(false);
  const [booksForQuickAddCopyColors, setBooksForQuickAddCopyColors] = useState<any[]>([]);
  const [mobileCopyColorsSearch, setMobileCopyColorsSearch] = useState("");
  const [showMobileCrop, setShowMobileCrop] = useState(false);
  const [mobileExpandedSections, setMobileExpandedSections] = useState<string[]>(['isbn', 'principal', 'detalhes', 'acervo']);
  
  // Estados para busca de capas no modo mobile
  const [mobileSearchingCovers, setMobileSearchingCovers] = useState(false);
  const [mobileCoverOptions, setMobileCoverOptions] = useState<{ url: string; source: string }[]>([]);
  const [showMobileCoverOptions, setShowMobileCoverOptions] = useState(false);

  useEffect(() => {
    fetchBooks();
    fetchLibraries();
  }, [user]);
  
  // Carregar bibliotecas para o cadastro rápido
  const fetchLibraries = async () => {
    const { data } = await (supabase as any)
      .from('libraries')
      .select('id, name')
      .eq('active', true)
      .order('name');
    setLibraries(data || []);
    
    // Se for bibliotecário, pré-selecionar sua biblioteca
    if (user?.role === 'bibliotecario' && user.library_id) {
      setInventoryLibraryId(user.library_id);
      fetchLibraryColorsForInventory(user.library_id);
    }
  };
  
  // Carregar cores da biblioteca selecionada
  const fetchLibraryColorsForInventory = async (libraryId: string) => {
    if (!libraryId) return;
    const { data } = await (supabase as any)
      .from('library_colors')
      .select('*')
      .eq('library_id', libraryId)
      .order('color_group, category_name');
    setLibraryColors(data || []);
  };
  
  // Carregar livros com cores (do catálogo) para copiar cores
  const fetchAllCopiesForColors = async () => {
    // Buscar cópias com cores agrupando por book_id (pegar apenas uma por livro)
    const { data } = await (supabase as any)
      .from('copies')
      .select('id, tombo, local_categories, library_id, book_id, books(id, title, author, isbn)')
      .not('local_categories', 'is', null)
      .order('book_id, created_at');
    
    if (data) {
      // Agrupar por book_id e pegar apenas o primeiro de cada
      const uniqueByBook = new Map();
      data.forEach((c: any) => {
        if (c.local_categories?.length > 0 && c.books?.id && !uniqueByBook.has(c.books.id)) {
          uniqueByBook.set(c.books.id, c);
        }
      });
      setAllCopies(Array.from(uniqueByBook.values()));
    } else {
      setAllCopies([]);
    }
  };
  
  // Quando mudar a biblioteca, carregar cores
  useEffect(() => {
    if (inventoryLibraryId) {
      fetchLibraryColorsForInventory(inventoryLibraryId);
    }
  }, [inventoryLibraryId]);
  
  // Carregar cópias quando abrir modal
  useEffect(() => {
    if (isModalOpen && addToInventory) {
      fetchAllCopiesForColors();
    }
  }, [isModalOpen, addToInventory]);
  
  // Atalho Ctrl+S para salvar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S ou Cmd+S para salvar
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isModalOpen && !saving && formData.title) {
          handleSave();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, saving, formData]);

  // ============ FUNÇÕES DO MODO MOBILE ============
  
  // Iniciar scanner de código de barras
  const startBarcodeScanner = async () => {
    setIsScanning(true);
    setMobileStep('scan');
    
    // Aguardar o elemento estar no DOM
    await new Promise(resolve => setTimeout(resolve, 600));
    
    try {
      const html5Qrcode = new Html5Qrcode("barcode-reader");
      html5QrcodeRef.current = html5Qrcode;
      
      // Configuração SIMPLES - máxima compatibilidade
      await html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 120 },
        },
        async (decodedText) => {
          // Validar se parece um ISBN válido
          const cleanIsbn = decodedText.replace(/[^0-9X]/gi, '');
          
          // ISBN-13 tem 13 dígitos, ISBN-10 tem 10
          if (cleanIsbn.length === 13 || cleanIsbn.length === 10) {
            // Vibrar para feedback
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            setScannedISBN(cleanIsbn);
            
            // IMPORTANTE: Fechar scanner PRIMEIRO para mostrar loading
            await stopBarcodeScanner();
            setShowMobileScanner(false);
            
            // Agora buscar com loading visível
            await searchMobileISBN(cleanIsbn);
          }
        },
        () => {} // Ignorar erros de frame
      );
      
    } catch (err) {
      console.error("Erro ao iniciar scanner:", err);
      toast({ title: "Erro", description: "Não foi possível acessar a câmera. Verifique as permissões.", variant: "destructive" });
      setIsScanning(false);
    }
  };
  
  // Parar scanner
  const stopBarcodeScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current = null;
      } catch (e) {}
    }
    setIsScanning(false);
  };
  
  // Buscar dados do ISBN no modo mobile (com múltiplas fontes)
  const searchMobileISBN = async (isbn: string) => {
    // Iniciar estado de busca com feedback visual
    setMobileSearching(true);
    setMobileSearchStatus("Buscando informações...");
    setMobileFormData(prev => ({ ...prev, isbn }));
    
    // Vibração para confirmar leitura
    if (navigator.vibrate) navigator.vibrate(100);
    
    try {
      const alternativeIsbn = convertISBN(isbn);
      
      // Detectar se é ISBN brasileiro (prefixos 978-85, 978-65, 85, 65)
      const isBrazilianISBN = isbn.startsWith('97885') || 
                             isbn.startsWith('97865') || 
                             isbn.startsWith('85') || 
                             isbn.startsWith('65');
      
      let externalData: ExternalBookData | null = null;
      let cblData: ExternalBookData | null = null;
      
      // FASE 1: Se for ISBN brasileiro, buscar na CBL PRIMEIRO (dados oficiais)
      if (isBrazilianISBN) {
        setMobileSearchStatus("📚 Consultando CBL (oficial BR)...");
        cblData = await fetchCBLData(isbn);
        if (cblData && cblData.title) {
          console.log("📱 Mobile: Encontrado na CBL (oficial)");
          externalData = cblData;
        }
      }
      
      // FASE 2: Buscar dados complementares (Google Books + Open Library)
      setMobileSearchStatus("📚 Consultando Google Books...");
      const [googleResponse, openLibraryData] = await Promise.all([
        fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`),
        fetchOpenLibraryData(isbn)
      ]);
      
      let data = await googleResponse.json();
      let hasGoogleData = data.totalItems > 0;
      let info = hasGoogleData ? data.items[0].volumeInfo : null;
      
      // FASE 3: Se ainda não tem dados, tentar fontes alternativas
      if (!externalData && !hasGoogleData && !openLibraryData.title) {
        console.log("📱 Mobile: Tentando fontes alternativas...");
        
        // 1. Tentar Brapci (API brasileira)
        setMobileSearchStatus("🇧🇷 Consultando bases brasileiras...");
        externalData = await fetchBrapciData(isbn);
        
        // 2. Se Brapci falhou, tentar OpenBD
        if (!externalData) {
          setMobileSearchStatus("📖 Consultando OpenBD...");
          externalData = await fetchOpenBDData(isbn);
        }
        
        // 3. Tentar com ISBN alternativo (10 <-> 13)
        if (!externalData && alternativeIsbn) {
          setMobileSearchStatus("🔄 Tentando ISBN alternativo...");
          const altOpenLibrary = await fetchOpenLibraryData(alternativeIsbn);
          if (altOpenLibrary.title || altOpenLibrary.author) {
            Object.assign(openLibraryData, altOpenLibrary);
          }
        }
        
        // 4. WorldCat (pode ser lento)
        if (!externalData && !openLibraryData.title) {
          setMobileSearchStatus("🌍 Consultando WorldCat...");
          externalData = await fetchWorldCatData(isbn);
        }
        
        // 5. CBL como fallback (se não foi consultada na fase 1)
        if (!externalData && !openLibraryData.title && !cblData) {
          setMobileSearchStatus("📚 Consultando CBL (oficial BR)...");
          const cblFallback = await fetchCBLData(isbn);
          if (cblFallback) {
            externalData = cblFallback;
            cblData = cblFallback;
          }
        }
      }
      
      setMobileSearchStatus("✅ Processando dados...");
      
      // Verificar se temos dados da CBL (prioridade para dados básicos)
      const hasCBLData = cblData && cblData.title;
      
      const getBest = (googleValue: any, openLibraryValue: string, externalValue?: string): string => {
        if (googleValue && String(googleValue).trim()) return String(googleValue);
        if (openLibraryValue && openLibraryValue.trim()) return openLibraryValue;
        if (externalValue && externalValue.trim()) return externalValue;
        return "";
      };
      
      // Função especial para campos que a CBL tem prioridade (dados oficiais BR)
      const getBestWithCBLPriority = (cblValue: string | undefined, googleValue: any, openLibraryValue: string, externalValue?: string): string => {
        if (hasCBLData && cblValue && cblValue.trim()) return cblValue;
        return getBest(googleValue, openLibraryValue, externalValue);
      };
      
      // CBL tem prioridade para título, autor, editora, assunto (dados oficiais padronizados)
      const title = getBestWithCBLPriority(cblData?.title, info?.title, openLibraryData.title, externalData?.title).toUpperCase();
      const author = getBestWithCBLPriority(cblData?.author, info?.authors?.join(", "), openLibraryData.author, externalData?.author).toUpperCase();
      const publisher = getBestWithCBLPriority(cblData?.publisher, info?.publisher, openLibraryData.publisher, externalData?.publisher);
      const cblCategory = cblData?.category || "";
      const googleCategory = translateCategory(info?.categories?.[0] || "");
      const category = getBestWithCBLPriority(cblCategory, googleCategory, openLibraryData.category, externalData?.category);
      
      // Capa
      let coverUrl = "";
      if (openLibraryData.cover) {
        coverUrl = openLibraryData.cover;
      } else if (info?.imageLinks?.thumbnail) {
        coverUrl = info.imageLinks.thumbnail.replace('http://', 'https://').replace('zoom=1', 'zoom=2');
      } else if (externalData?.cover) {
        coverUrl = externalData.cover;
      }
      
      // Se não encontrou capa mas tem título/autor, tentar buscar capa por pesquisa
      if (!coverUrl && (title || author)) {
        const altCover = await fetchOpenLibraryCoverBySearch(title, author);
        if (altCover) {
          coverUrl = altCover;
        }
      }
      
      // Gerar Cutter
      const cutter = author ? generateCutter(author, title) : "";
      
      // Dados adicionais
      const subtitle = getBestWithCBLPriority(cblData?.subtitle, info?.subtitle, "", externalData?.subtitle).toUpperCase();
      const publication_date = getBestWithCBLPriority(cblData?.publication_date, info?.publishedDate, openLibraryData.publication_date, externalData?.publication_date);
      const page_count = getBestWithCBLPriority(cblData?.page_count, info?.pageCount?.toString(), openLibraryData.page_count, externalData?.page_count);
      const language = getBestWithCBLPriority(cblData?.language, info?.language, "", externalData?.language) || "pt-BR";
      const description = cblData?.description || sanitizeDescription(getBest(info?.description, openLibraryData.description || "", externalData?.description));
      const edition = cblData?.edition || "";
      
      // Gerar tags automáticas
      let allTags: string[] = [];
      
      // 1. Tags da CBL (PalavrasChave)
      if (cblData?.tags && cblData.tags.length > 0) {
        allTags = [...cblData.tags.map(t => t.toLowerCase())];
      }
      
      // 2. Tags do Open Library (subjects) - traduzir para português (com API)
      if (openLibraryData.subjects && openLibraryData.subjects.length > 0) {
        const translatedSubjects = await translateTagsAsync(openLibraryData.subjects);
        translatedSubjects.forEach(t => {
          if (!allTags.includes(t)) {
            allTags.push(t);
          }
        });
      }
      
      // 3. Tags de outras fontes
      if (externalData?.tags && externalData.tags.length > 0) {
        externalData.tags.forEach(t => {
          if (!allTags.includes(t.toLowerCase())) {
            allTags.push(t.toLowerCase());
          }
        });
      }
      
      // 4. Tags geradas automaticamente
      const autoTags = generateAutoTags({
        title, subtitle, author, category, publisher, description, language,
        format: cblData?.format, target_audience: cblData?.target_audience
      });
      autoTags.forEach(t => {
        if (!allTags.includes(t)) allTags.push(t);
      });
      
      const tags = allTags.slice(0, 15).join(', ');
      
      // Local de publicação da CBL
      let publicationPlace = "";
      if (cblData?.city || cblData?.state || cblData?.country) {
        const parts = [cblData?.city, cblData?.state, cblData?.country].filter(Boolean);
        publicationPlace = parts.join(" - ");
      }
      
      setMobileFormData({
        isbn,
        title,
        subtitle,
        author,
        publisher,
        cover_url: coverUrl,
        category,
        cutter: "", // Cutter não é preenchido automaticamente - usuário deve confirmar ou inserir manualmente
        publication_date,
        page_count,
        language,
        description,
        series: "",
        volume: "",
        edition,
        translator: "",
        publication_place: publicationPlace,
        country_classification: "BRA - Brasil",
        tags
      });
      
      // Pré-selecionar biblioteca do usuário (cores já foram carregadas ao abrir o modo)
      if (user?.role === 'bibliotecario' && user.library_id && !mobileInventoryLibraryId) {
        setMobileInventoryLibraryId(user.library_id);
      }
      
      // Finalizar busca
      setMobileSearching(false);
      setShowMobileScanner(false);
      stopBarcodeScanner();
      
      if (!title && !author) {
        toast({ 
          title: "📚 ISBN não encontrado nas bases", 
          description: "Este livro não está nas bases gratuitas. Preencha os dados manualmente.", 
          variant: "destructive",
          duration: 8000
        });
      } else {
        toast({ title: "✅ Encontrado!", description: "Verifique os dados e complete o cadastro" });
        // Vibração de sucesso
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      }
    } catch (err) {
      setMobileSearching(false);
      setShowMobileScanner(false);
      toast({ title: "Erro na busca", description: "Não foi possível buscar dados do ISBN", variant: "destructive" });
    }
  };
  
  // Iniciar câmera para foto da capa
  const startCamera = async () => {
    setShowMobileCamera(true);
    // Iniciar câmera com retry
    const initCamera = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          // Aguardar um pouco para o DOM atualizar
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: "environment", 
              width: { ideal: 1280, max: 1920 }, 
              height: { ideal: 720, max: 1080 } 
            }
          });
          
          setCameraStream(stream);
          
          // Aguardar o video element estar disponível
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(() => {});
          }
          return; // Sucesso
        } catch (err) {
          console.error(`Tentativa ${i + 1} falhou:`, err);
          if (i === retries - 1) {
            toast({ title: "Erro", description: "Não foi possível acessar a câmera", variant: "destructive" });
          }
        }
      }
    };
    initCamera();
  };
  
  // Capturar foto
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
        setShowMobileCamera(false);
        setShowMobileCrop(true);
      }
    }
  };
  
  // Parar câmera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };
  
  // Aplicar crop e fazer upload
  const applyCropAndUpload = async () => {
    if (!capturedImage) {
      toast({ title: "Erro", description: "Nenhuma imagem capturada", variant: "destructive" });
      setShowMobileCrop(false);
      return;
    }
    
    // Criar uma nova imagem a partir do capturedImage (mais confiável que usar ref)
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        toast({ title: "Erro", description: "Erro ao processar imagem", variant: "destructive" });
        setShowMobileCrop(false);
        return;
      }
      
      // Obter dimensões da imagem no DOM (se tiver ref)
      const displayedWidth = imgRef.current?.width || image.width;
      const displayedHeight = imgRef.current?.height || image.height;
      
      const scaleX = image.naturalWidth / displayedWidth;
      const scaleY = image.naturalHeight / displayedHeight;
      
      // Se não tiver crop definido, usar imagem inteira
      let cropX = 0, cropY = 0, cropW = image.naturalWidth, cropH = image.naturalHeight;
      
      if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
        cropX = completedCrop.x * scaleX;
        cropY = completedCrop.y * scaleY;
        cropW = completedCrop.width * scaleX;
        cropH = completedCrop.height * scaleY;
      }
      
      // Tamanho final (máximo 800px de largura)
      const maxWidth = 800;
      const ratio = cropW / cropH;
      const finalWidth = Math.min(maxWidth, cropW);
      const finalHeight = finalWidth / ratio;
      
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      
      ctx.drawImage(
        image,
        cropX, cropY, cropW, cropH,
        0, 0, finalWidth, finalHeight
      );
      
      try {
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        setMobileFormData(prev => ({ ...prev, cover_url: base64 }));
        setCapturedImage(null);
        setCompletedCrop(null);
        setShowMobileCrop(false);
        toast({ title: "✅ Capa salva!", description: "Imagem processada com sucesso" });
      } catch (err: any) {
        console.error('Erro ao processar imagem:', err);
        toast({ title: "Erro", description: "Falha ao processar imagem", variant: "destructive" });
        setShowMobileCrop(false);
      }
    };
    
    image.onerror = () => {
      toast({ title: "Erro", description: "Falha ao carregar imagem", variant: "destructive" });
      setShowMobileCrop(false);
    };
    
    image.src = capturedImage;
  };
  
  // Selecionar imagem da galeria
  const selectFromGallery = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setCapturedImage(reader.result as string);
          setShowMobileCrop(true); // Mostrar tela de crop
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };
  
  // Sugerir crop automático quando imagem carregar
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const imgWidth = img.width;
    const imgHeight = img.height;
    
    // Proporção de livro: 2:3 (largura:altura)
    const targetRatio = 2 / 3;
    const imgRatio = imgWidth / imgHeight;
    
    let cropWidth, cropHeight, cropX, cropY;
    
    if (imgRatio > targetRatio) {
      // Imagem mais larga - ajustar largura
      cropHeight = imgHeight * 0.9; // 90% da altura
      cropWidth = cropHeight * targetRatio;
      cropX = (imgWidth - cropWidth) / 2;
      cropY = (imgHeight - cropHeight) / 2;
    } else {
      // Imagem mais alta - ajustar altura
      cropWidth = imgWidth * 0.9; // 90% da largura
      cropHeight = cropWidth / targetRatio;
      cropX = (imgWidth - cropWidth) / 2;
      cropY = (imgHeight - cropHeight) / 2;
    }
    
    // Definir crop inicial sugerido
    const initialCrop: CropType = {
      unit: 'px',
      x: cropX,
      y: cropY,
      width: cropWidth,
      height: cropHeight
    };
    
    setCrop(initialCrop);
    setCompletedCrop(initialCrop as PixelCrop);
  };
  
  // Salvar livro no modo mobile
  const saveMobileBook = async () => {
    if (!mobileFormData.title) {
      toast({ title: "Título obrigatório", description: "Preencha o título do livro", variant: "destructive" });
      return;
    }
    
    if (!mobileFormData.author) {
      toast({ title: "Autor(a) obrigatório(a)", description: "Preencha o nome do(a) autor(a) do livro", variant: "destructive" });
      return;
    }
    
    // Validar acervo se marcado
    if (mobileAddToInventory && !mobileInventoryLibraryId) {
      toast({ title: "Selecione uma biblioteca", description: "Para adicionar ao acervo, selecione a biblioteca", variant: "destructive" });
      return;
    }
    
    // Validar Cutter - se vazio, abrir diálogo de confirmação
    // Usa refs para verificação síncrona (evita problema de estado assíncrono do React)
    const hasCutter = mobileFormData.cutter || cutterValueRef.current;
    if (!hasCutter && !cutterConfirmedRef.current) {
      setShowCutterConfirmDialog(true);
      setCutterDialogValue("");
      return;
    }
    
    // Validar tombo dos exemplares - deve ter tombo manual ou automático marcado
    if (mobileAddToInventory) {
      const invalidCopy = mobileInventoryCopies.find(copy => !copy.tombo.trim() && !copy.autoTombo);
      if (invalidCopy) {
        toast({ 
          title: "Tombo obrigatório", 
          description: "Digite o número do tombo ou marque para gerar automaticamente", 
          variant: "destructive" 
        });
        return;
      }
    }
    
    setMobileSaving(true);
    
    try {
      // Verificar se ISBN já existe
      if (mobileFormData.isbn) {
        const { data: existing } = await (supabase as any)
          .from('books').select('id').eq('isbn', mobileFormData.isbn).maybeSingle();
        if (existing) {
          toast({ title: "ISBN já cadastrado", description: "Este livro já existe no catálogo", variant: "destructive" });
          setMobileSaving(false);
          return;
        }
      }
      
      // Payload completo com todos os campos
      // Usa ref do Cutter se estado ainda não atualizou (problema assíncrono do React)
      const finalCutter = mobileFormData.cutter || cutterValueRef.current || null;
      const payload = {
        isbn: mobileFormData.isbn || null,
        title: mobileFormData.title,
        subtitle: mobileFormData.subtitle || null,
        author: mobileFormData.author || null,
        publisher: mobileFormData.publisher || null,
        cover_url: mobileFormData.cover_url || null,
        category: mobileFormData.category || null,
        cutter: finalCutter,
        language: mobileFormData.language || "pt-BR",
        publication_date: mobileFormData.publication_date || null,
        page_count: mobileFormData.page_count ? parseInt(mobileFormData.page_count) : null,
        description: mobileFormData.description || null,
        series: mobileFormData.series || null,
        volume: mobileFormData.volume || null,
        edition: mobileFormData.edition || null,
        translator: mobileFormData.translator || null,
        publication_place: mobileFormData.publication_place || null,
        country_classification: mobileFormData.country_classification || null
      };
      
      const { data: newBook, error } = await (supabase as any)
        .from('books')
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log de auditoria
      if (newBook) {
        await logCreate('BOOK_CREATE', 'book', newBook.id, mobileFormData.title, payload, user?.id, user?.library_id);
      }
      
      // Criar exemplares no acervo se solicitado
      if (mobileAddToInventory && newBook && mobileInventoryLibraryId) {
        let copiesCreated = 0;
        const createdTombos: string[] = [];
        
        for (const copy of mobileInventoryCopies) {
          let finalTombo = copy.tombo;
          
          // Gerar tombo automático se marcado
          // Importante: não usar order('tombo') + limit — ordenação é lexicográfica (ex.: "B999" > "B1000"),
          // então o maior número real (ex. B1000) pode ficar fora dos primeiros N registros e o próximo tombo repetia (ex. B1000 várias vezes).
          if (copy.autoTombo) {
            const { data: tomboRows } = await (supabase as any)
              .from('copies')
              .select('tombo')
              .eq('library_id', mobileInventoryLibraryId)
              .ilike('tombo', 'B%');
            let nextNum = 1;
            if (tomboRows?.length) {
              let maxN = 0;
              for (const row of tomboRows) {
                const t = row.tombo as string | null | undefined;
                if (!t || !/^B\d+$/i.test(t)) continue;
                const n = parseInt(t.slice(1), 10);
                if (!Number.isNaN(n) && n > maxN) maxN = n;
              }
              nextNum = maxN + 1;
            }
            finalTombo = `B${nextNum + copiesCreated}`;
          }
          
          const copyPayload = {
            book_id: newBook.id,
            library_id: mobileInventoryLibraryId,
            code: mobileFormData.isbn || finalTombo,
            tombo: finalTombo,
            status: 'disponivel',
            process_stamped: copy.process_stamped,
            process_indexed: copy.process_indexed,
            process_taped: copy.process_taped,
            local_categories: mobileSelectedColors.length > 0 ? mobileSelectedColors : null,
            origin: mobileInventoryOrigin
          };
          
          const { error: copyError } = await (supabase as any).from('copies').insert(copyPayload);
          if (!copyError) {
            copiesCreated++;
            createdTombos.push(finalTombo);
          }
        }
        
        if (copiesCreated > 0) {
          const tombosStr = createdTombos.join(", ");
          setSuccessDialog({
            open: true,
            title: "Livro + Acervo!",
            message: `${mobileFormData.title} — ${copiesCreated} exemplar(es)\n\nNº Tombo: ${tombosStr}`,
          });
        }
      } else {
        toast({ title: "✅ Livro cadastrado!", description: mobileFormData.title });
      }
      
      // Resetar para próximo cadastro
      resetMobileForm();
      fetchBooks();
      
      // Mostrar scanner para próximo livro
      setShowMobileScanner(true);
      setTimeout(() => startBarcodeScanner(), 500);
      
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setMobileSaving(false);
    }
  };
  
  // Resetar formulário mobile
  const resetMobileForm = () => {
    setMobileFormData({
      isbn: "", title: "", subtitle: "", author: "", publisher: "", cover_url: "", category: "", cutter: "",
      publication_date: "", page_count: "", language: "pt-BR", description: "",
      series: "", volume: "", edition: "", translator: "", publication_place: "", country_classification: ""
    });
    setScannedISBN("");
    setMobileAddToInventory(true); // Manter padrão marcado
    setMobileInventoryQty(1);
    setMobileInventoryCopies([{ tombo: "", autoTombo: false, process_stamped: true, process_indexed: true, process_taped: true, colors: [] }]);
    setMobileActiveTab('principal');
    setMobileSelectedColors([]);
    setMobileExpandedSections(['isbn', 'principal', 'acervo']);
    setCapturedImage(null);
    // Reset estados de confirmação de Cutter
    setCutterConfirmedEmpty(false);
    setCutterDialogValue("");
    cutterConfirmedRef.current = false; // Reset ref síncrona
    cutterValueRef.current = ""; // Reset ref do valor do Cutter
  };
  
  // Confirmar Cutter vazio ou com valor digitado no diálogo
  const handleCutterConfirm = (confirmEmpty: boolean) => {
    if (confirmEmpty) {
      // Usuário marcou "Sem Cutter" - confirmar e salvar
      cutterConfirmedRef.current = true; // Atualiza ref de forma síncrona
      cutterValueRef.current = ""; // Limpa valor da ref
      setCutterConfirmedEmpty(true);
      setShowCutterConfirmDialog(false);
      // Salvar automaticamente após confirmar
      setTimeout(() => saveMobileBook(), 50);
    } else if (cutterDialogValue.trim()) {
      // Usuário digitou um Cutter - usar e salvar
      const cutterValue = cutterDialogValue.trim();
      cutterValueRef.current = cutterValue; // Atualiza ref de forma síncrona
      cutterConfirmedRef.current = true; // Marca como confirmado
      setMobileFormData(prev => ({ ...prev, cutter: cutterValue }));
      setCutterConfirmedEmpty(true);
      setShowCutterConfirmDialog(false);
      // Salvar automaticamente após inserir Cutter
      setTimeout(() => saveMobileBook(), 50);
    } else {
      toast({ title: "Atenção", description: "Digite o Cutter ou marque 'Sem Cutter'", variant: "destructive" });
    }
  };
  
  // Confirmar Cutter vazio ou com valor digitado no diálogo (modo computador)
  const handleDesktopCutterConfirm = (confirmEmpty: boolean) => {
    if (confirmEmpty) {
      // Usuário marcou "Sem Cutter" - confirmar e salvar
      desktopCutterConfirmedRef.current = true;
      desktopCutterValueRef.current = "";
      setShowDesktopCutterDialog(false);
      // Salvar automaticamente após confirmar
      setTimeout(() => handleSave(), 50);
    } else if (desktopCutterDialogValue.trim()) {
      // Usuário digitou um Cutter - usar e salvar
      const cutterValue = desktopCutterDialogValue.trim();
      desktopCutterValueRef.current = cutterValue;
      desktopCutterConfirmedRef.current = true;
      setFormData(prev => ({ ...prev, cutter: cutterValue }));
      setShowDesktopCutterDialog(false);
      // Salvar automaticamente após inserir Cutter
      setTimeout(() => handleSave(), 50);
    } else {
      toast({ title: "Atenção", description: "Digite o Cutter ou marque 'Sem Cutter'", variant: "destructive" });
    }
  };
  
  // Fechar modo mobile
  const closeMobileMode = () => {
    stopBarcodeScanner();
    stopCamera();
    setIsMobileMode(false);
    setMobileStep('scan');
    resetMobileForm();
  };

  // Cache de capas carregadas por id
  const [coverCache, setCoverCache] = useState<Record<string, string>>({});
  const coverCacheRef = useRef<Record<string, string>>({});

  const fetchBooks = async () => {
    try {
      setLoading(true);
      
      // Buscar livros SEM cover_url (evita timeout por imagens base64 gigantes)
      // e contagens em paralelo
      const [booksResult, copiesResult] = await Promise.all([
        (supabase as any).from('books').select('id, isbn, title, author, category, cutter, created_at, tags, country_classification').order('created_at', { ascending: false }),
        (supabase as any).from('copies').select('book_id, status, library_id')
      ]);
      
      if (booksResult.error) {
        console.error('[Catálogo] Erro na query de livros:', booksResult.error);
        toast({ title: "Erro ao carregar livros", description: booksResult.error.message || 'Erro desconhecido', variant: "destructive" });
        throw booksResult.error;
      }
      
      // Agregar contagens por book_id (Map para O(1) lookup)
      const statsMap = new Map<string, { total: number; disponivel: number; libraries: Set<string> }>();
      (copiesResult.data || []).forEach((copy: any) => {
        if (!statsMap.has(copy.book_id)) {
          statsMap.set(copy.book_id, { total: 0, disponivel: 0, libraries: new Set() });
        }
        const stats = statsMap.get(copy.book_id)!;
        stats.total++;
        if (copy.status === 'disponivel') stats.disponivel++;
        stats.libraries.add(copy.library_id);
      });
      
      // Enriquecer livros com contagens (sem criar arrays grandes)
      const enrichedBooks = (booksResult.data || []).map((book: any) => {
        const stats = statsMap.get(book.id);
        return {
          ...book,
          copies: stats ? [{ status: 'disponivel', library_id: Array.from(stats.libraries)[0] }] : [],
          _totalCopies: stats?.total || 0,
          _availableCopies: stats?.disponivel || 0,
          _libraryCount: stats?.libraries.size || 0
        };
      });
      
      setBooks(enrichedBooks);
      calculateCategoryStats(enrichedBooks);
    } catch (error) {
      console.error('Erro ao carregar catálogo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar capas apenas dos livros da página visível (lazy loading)
  const fetchCoversForPage = useCallback(async (bookIds: string[]) => {
    // Filtrar apenas IDs que ainda não estão no cache
    const uncachedIds = bookIds.filter(id => !coverCacheRef.current[id]);
    if (uncachedIds.length === 0) return;

    const { data } = await (supabase as any)
      .from('books')
      .select('id, cover_url')
      .in('id', uncachedIds);

    if (data) {
      const newCovers: Record<string, string> = {};
      data.forEach((book: any) => {
        if (book.cover_url) {
          newCovers[book.id] = book.cover_url;
          coverCacheRef.current[book.id] = book.cover_url;
        }
      });
      if (Object.keys(newCovers).length > 0) {
        setCoverCache(prev => ({ ...prev, ...newCovers }));
      }
    }
  }, []);

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

  // Função para gerar Código Cutter usando tabela Cutter-Sanborn de 3 dígitos
  // Referência: https://www.tabelacutter.com/
  // Formato: [Primeira letra do sobrenome][Número 3 dígitos][Primeira letra do título]
  const generateCutter = (authorName: string, bookTitle?: string): string => {
    if (!authorName) return "";
    
    // Extrair sobrenome do autor (formato: "Nome Sobrenome" ou "Sobrenome, Nome")
    let surname = "";
    const parts = authorName.trim().split(/[\s,]+/).filter(p => p.length > 0);
    
    if (authorName.includes(',')) {
      // Formato "Sobrenome, Nome" - pegar primeiro elemento
      surname = parts[0].toUpperCase();
    } else {
      // Formato "Nome Sobrenome" - pegar último elemento
      surname = parts[parts.length - 1].toUpperCase();
    }
    
    // Se o nome termina com sufixos, pegar o penúltimo
    const suffixes = ['JR', 'JR.', 'FILHO', 'NETO', 'SOBRINHO', 'JUNIOR', 'II', 'III', 'IV'];
    if (suffixes.includes(surname) && parts.length > 1) {
      surname = parts[parts.length - 2].toUpperCase();
    }
    
    // Remover acentos e caracteres especiais
    surname = surname.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z]/g, '');
    
    if (!surname) return "";
    
    // Tabela Cutter-Sanborn oficial de 3 dígitos
    // Fonte: https://www.tabelacutter.com/
    const cutterSanborn: Record<string, [string, number][]> = {
      'A': [
        ['A', 100], ['Ab', 117], ['Ac', 127], ['Ad', 134], ['Ae', 146], ['Af', 148], ['Ag', 154], 
        ['Ah', 159], ['Ai', 161], ['Aj', 165], ['Ak', 168], ['Al', 176], ['Alm', 186], ['Alo', 190],
        ['Als', 195], ['Alt', 198], ['Am', 199], ['An', 227], ['And', 235], ['Ang', 244], ['Ant', 267],
        ['Ap', 275], ['Ar', 287], ['Arm', 312], ['Arn', 318], ['Aro', 323], ['Ars', 329], ['Art', 333],
        ['As', 351], ['Ash', 358], ['At', 373], ['Au', 386], ['Av', 418], ['Aw', 422], ['Ax', 425],
        ['Ay', 428], ['Az', 444]
      ],
      'B': [
        ['B', 100], ['Ba', 111], ['Bai', 125], ['Bal', 139], ['Ban', 155], ['Bar', 177], ['Bas', 199],
        ['Bat', 217], ['Bau', 221], ['Be', 261], ['Bea', 266], ['Bec', 284], ['Bei', 306], ['Bel', 316],
        ['Ben', 333], ['Ber', 362], ['Bi', 432], ['Bl', 474], ['Bo', 533], ['Bol', 559], ['Bon', 571],
        ['Bor', 585], ['Bos', 598], ['Bot', 609], ['Bou', 613], ['Bow', 638], ['Boy', 658], ['Br', 667],
        ['Bra', 679], ['Bre', 697], ['Bri', 715], ['Bro', 741], ['Bru', 782], ['Bu', 822], ['Bur', 863],
        ['Bus', 875], ['But', 882], ['By', 916]
      ],
      'C': [
        ['C', 100], ['Ca', 116], ['Cal', 134], ['Cam', 148], ['Can', 159], ['Cap', 176], ['Car', 197],
        ['Cas', 218], ['Cat', 233], ['Ce', 266], ['Ch', 310], ['Cha', 318], ['Che', 337], ['Chi', 353],
        ['Cho', 367], ['Chr', 379], ['Ci', 393], ['Cl', 425], ['Cla', 434], ['Cle', 449], ['Cli', 459],
        ['Co', 485], ['Coe', 495], ['Col', 518], ['Com', 546], ['Con', 557], ['Coo', 582], ['Cop', 596],
        ['Cor', 616], ['Cos', 651], ['Cot', 663], ['Cou', 672], ['Cow', 689], ['Cox', 697], ['Cr', 712],
        ['Cra', 718], ['Cre', 734], ['Cri', 749], ['Cro', 765], ['Cru', 789], ['Cu', 821], ['Cun', 854],
        ['Cur', 866]
      ],
      'D': [
        ['D', 100], ['Da', 118], ['Dal', 139], ['Dam', 149], ['Dan', 159], ['Dar', 176], ['Das', 189],
        ['Dat', 193], ['Dav', 197], ['De', 223], ['Dea', 226], ['Del', 245], ['Dem', 258], ['Den', 265],
        ['Der', 275], ['Des', 289], ['Dev', 298], ['Di', 331], ['Dia', 333], ['Dic', 343], ['Die', 356],
        ['Dim', 368], ['Do', 423], ['Dob', 427], ['Doc', 431], ['Dod', 435], ['Dol', 458], ['Dom', 469],
        ['Don', 481], ['Doo', 499], ['Dor', 511], ['Dos', 523], ['Dou', 529], ['Dow', 545], ['Dr', 573],
        ['Du', 618], ['Dub', 622], ['Duc', 633], ['Dud', 642], ['Duf', 657], ['Dun', 692], ['Dup', 716],
        ['Dur', 726], ['Dut', 741], ['Dy', 787]
      ],
      'E': [
        ['E', 100], ['Ea', 117], ['Eb', 137], ['Ed', 184], ['Edw', 215], ['Ef', 257], ['Eg', 266],
        ['Ei', 278], ['El', 296], ['Eli', 314], ['Ell', 328], ['Em', 376], ['En', 429], ['Ep', 464],
        ['Er', 492], ['Es', 545], ['Est', 556], ['Et', 568], ['Eu', 582], ['Ev', 617], ['Ew', 637],
        ['Ex', 652], ['Ey', 656]
      ],
      'F': [
        ['F', 100], ['Fa', 118], ['Fai', 132], ['Fal', 146], ['Fan', 159], ['Far', 173], ['Fas', 187],
        ['Fat', 192], ['Fau', 197], ['Fe', 235], ['Fei', 271], ['Fel', 284], ['Fen', 295], ['Fer', 312],
        ['Fes', 333], ['Fi', 374], ['Fie', 381], ['Fil', 397], ['Fin', 415], ['Fis', 438], ['Fit', 449],
        ['Fl', 487], ['Fle', 513], ['Fli', 521], ['Flo', 537], ['Fo', 573], ['Fon', 587], ['For', 619],
        ['Fos', 649], ['Fou', 658], ['Fox', 664], ['Fr', 688], ['Fra', 698], ['Fre', 729], ['Fri', 757],
        ['Fro', 775], ['Fu', 828], ['Ful', 853], ['Fun', 866], ['Fur', 876]
      ],
      'G': [
        ['G', 100], ['Ga', 118], ['Gal', 144], ['Gam', 159], ['Gar', 191], ['Gas', 214], ['Gat', 224],
        ['Ge', 255], ['Gel', 273], ['Geo', 285], ['Ger', 298], ['Gi', 338], ['Gib', 347], ['Gil', 369],
        ['Gir', 398], ['Gl', 433], ['Go', 488], ['God', 497], ['Gol', 518], ['Gom', 528], ['Gon', 537],
        ['Goo', 552], ['Gor', 571], ['Gos', 585], ['Got', 591], ['Gou', 596], ['Gr', 638], ['Gra', 656],
        ['Gre', 693], ['Gri', 729], ['Gro', 759], ['Gru', 783], ['Gu', 824], ['Gue', 844], ['Gui', 859],
        ['Gun', 877], ['Gur', 891], ['Gut', 897]
      ],
      'H': [
        ['H', 100], ['Ha', 118], ['Hag', 127], ['Hai', 141], ['Hal', 158], ['Ham', 183], ['Han', 213],
        ['Har', 248], ['Has', 287], ['Hat', 299], ['Hau', 316], ['Haw', 326], ['Hay', 347], ['He', 386],
        ['Hea', 393], ['Hec', 406], ['Hef', 417], ['Hei', 425], ['Hel', 445], ['Hem', 464], ['Hen', 478],
        ['Her', 515], ['Hes', 542], ['Hi', 584], ['Hig', 596], ['Hil', 625], ['Hin', 658], ['Ho', 694],
        ['Hob', 699], ['Hod', 711], ['Hof', 728], ['Hog', 739], ['Hol', 756], ['Hom', 779], ['Hon', 784],
        ['Hoo', 796], ['Hop', 812], ['Hor', 831], ['Hos', 848], ['Hot', 859], ['Hou', 863], ['How', 879],
        ['Hu', 924], ['Hub', 927], ['Hud', 935], ['Hue', 941], ['Hug', 953], ['Hum', 977], ['Hun', 985],
        ['Hur', 991], ['Hut', 994], ['Hy', 997]
      ],
      'I': [
        ['I', 100], ['Ia', 125], ['Ib', 137], ['Id', 182], ['If', 249], ['Ig', 274], ['Il', 348],
        ['Im', 397], ['In', 448], ['Io', 577], ['Ir', 648], ['Is', 742], ['It', 786], ['Iv', 879],
        ['Iw', 914], ['Ix', 949], ['Iy', 974], ['Iz', 987]
      ],
      'J': [
        ['J', 100], ['Ja', 118], ['Jac', 125], ['Jaf', 146], ['Jam', 176], ['Jan', 195], ['Jar', 227],
        ['Je', 286], ['Jef', 294], ['Jen', 325], ['Jer', 358], ['Ji', 417], ['Jo', 486], ['Job', 492],
        ['Joh', 536], ['Jon', 618], ['Jor', 658], ['Jos', 682], ['Joy', 747], ['Ju', 788], ['Jun', 845],
        ['Jur', 866]
      ],
      'K': [
        ['K', 100], ['Ka', 118], ['Kaf', 126], ['Kam', 148], ['Kan', 157], ['Kap', 175], ['Kar', 196],
        ['Kat', 224], ['Kau', 234], ['Ke', 268], ['Kea', 272], ['Kee', 289], ['Kel', 318], ['Kem', 338],
        ['Ken', 349], ['Ker', 375], ['Ki', 424], ['Kie', 435], ['Kil', 455], ['Kim', 476], ['Kin', 489],
        ['Kir', 523], ['Kit', 546], ['Kl', 575], ['Kn', 637], ['Ko', 687], ['Kob', 695], ['Koc', 712],
        ['Koe', 725], ['Koh', 748], ['Kol', 768], ['Kom', 777], ['Kon', 786], ['Koo', 793], ['Kor', 816],
        ['Kos', 839], ['Kr', 867], ['Kra', 879], ['Kre', 893], ['Kri', 908], ['Kro', 922], ['Kru', 944],
        ['Ku', 958], ['Kun', 972], ['Kur', 982], ['Kus', 986]
      ],
      'L': [
        ['L', 100], ['La', 116], ['Lab', 122], ['Lac', 128], ['Laf', 155], ['Lag', 165], ['Lai', 175],
        ['Lam', 196], ['Lan', 224], ['Lar', 264], ['Las', 277], ['Lat', 285], ['Lau', 294], ['Lav', 316],
        ['Law', 327], ['Le', 362], ['Lea', 367], ['Leb', 378], ['Lee', 396], ['Leg', 414], ['Lei', 423],
        ['Lem', 448], ['Leo', 473], ['Les', 486], ['Lev', 516], ['Lew', 535], ['Li', 568], ['Lib', 576],
        ['Lie', 592], ['Lim', 618], ['Lin', 637], ['Lip', 672], ['Lis', 686], ['Lit', 693], ['Liu', 717],
        ['Lo', 738], ['Lob', 744], ['Loc', 755], ['Lof', 768], ['Log', 778], ['Lom', 797], ['Lon', 817],
        ['Loo', 827], ['Lop', 852], ['Lor', 864], ['Lou', 877], ['Lov', 888], ['Low', 894], ['Lu', 912],
        ['Lub', 916], ['Luc', 922], ['Lud', 934], ['Lui', 948], ['Lun', 962], ['Lut', 976], ['Ly', 991]
      ],
      'M': [
        ['M', 100], ['Ma', 114], ['Mac', 127], ['Mad', 145], ['Mag', 162], ['Mah', 173], ['Mai', 184],
        ['Mal', 212], ['Man', 235], ['Map', 265], ['Mar', 276], ['Marq', 357], ['Mas', 389], ['Mat', 414],
        ['Mau', 434], ['Max', 447], ['May', 456], ['Mc', 485], ['Me', 531], ['Mea', 536], ['Med', 554],
        ['Mei', 568], ['Mel', 588], ['Men', 612], ['Mer', 638], ['Mes', 661], ['Met', 674], ['Mey', 686],
        ['Mi', 713], ['Mic', 724], ['Mil', 755], ['Min', 789], ['Mir', 814], ['Mit', 838], ['Mo', 868],
        ['Moe', 876], ['Mol', 896], ['Mon', 916], ['Moo', 934], ['Mor', 948], ['Mos', 963], ['Mot', 975],
        ['Mou', 979], ['Moy', 986], ['Mu', 988], ['Mue', 929], ['Muh', 937], ['Mul', 952], ['Mun', 967],
        ['Mur', 977], ['Mus', 986], ['My', 994]
      ],
      'N': [
        ['N', 100], ['Na', 117], ['Nag', 124], ['Nak', 145], ['Nan', 159], ['Nap', 176], ['Nas', 196],
        ['Nat', 218], ['Ne', 282], ['Nea', 286], ['Nee', 313], ['Nel', 337], ['Ner', 357], ['Neu', 382],
        ['New', 418], ['Ni', 468], ['Nic', 487], ['Nie', 522], ['Nil', 566], ['Nis', 618], ['Nit', 641],
        ['No', 673], ['Nob', 682], ['Noe', 692], ['Nol', 717], ['Nor', 755], ['Not', 778], ['Nov', 789],
        ['Nu', 849], ['Nun', 878], ['Nut', 916], ['Ny', 954]
      ],
      'O': [
        ['O', 100], ['Oa', 125], ['Ob', 142], ['Oc', 159], ['Od', 178], ['Of', 219], ['Og', 263],
        ['Oh', 284], ['Ok', 326], ['Ol', 382], ['Oli', 418], ['Olm', 439], ['Ols', 467], ['Om', 498],
        ['On', 545], ['Op', 584], ['Or', 635], ['Ori', 668], ['Orn', 698], ['Ort', 724], ['Os', 765],
        ['Osb', 778], ['Osg', 789], ['Ost', 815], ['Ot', 848], ['Ou', 872], ['Ov', 894], ['Ow', 924],
        ['Ox', 964], ['Oy', 978]
      ],
      'P': [
        ['P', 100], ['Pa', 116], ['Pac', 124], ['Pad', 132], ['Pag', 145], ['Pai', 157], ['Pal', 178],
        ['Pan', 197], ['Pap', 217], ['Par', 237], ['Pas', 287], ['Pat', 312], ['Pau', 332], ['Pav', 354],
        ['Pay', 367], ['Pe', 396], ['Pea', 399], ['Pec', 413], ['Ped', 426], ['Pee', 434], ['Pel', 464],
        ['Pen', 489], ['Per', 523], ['Pes', 558], ['Pet', 577], ['Ph', 614], ['Phi', 634], ['Pi', 684],
        ['Pic', 698], ['Pie', 723], ['Pil', 746], ['Pin', 768], ['Pir', 798], ['Pit', 813], ['Pl', 842],
        ['Po', 868], ['Pod', 876], ['Poe', 885], ['Poh', 892], ['Poi', 896], ['Pol', 925], ['Pom', 937],
        ['Pon', 946], ['Poo', 953], ['Pop', 959], ['Por', 967], ['Pos', 978], ['Pot', 982], ['Pou', 986],
        ['Pow', 989], ['Pr', 992], ['Pre', 994], ['Pri', 996], ['Pro', 997], ['Pru', 998], ['Pu', 999]
      ],
      'Q': [
        ['Q', 100], ['Qa', 117], ['Qu', 254], ['Que', 378], ['Qui', 515]
      ],
      'R': [
        ['R', 100], ['Ra', 117], ['Rab', 124], ['Rad', 137], ['Raf', 156], ['Rag', 168], ['Rai', 182],
        ['Ram', 198], ['Ran', 224], ['Rap', 247], ['Ras', 256], ['Rat', 268], ['Rau', 279], ['Raw', 292],
        ['Ray', 318], ['Re', 349], ['Rea', 352], ['Rec', 367], ['Red', 386], ['Ree', 395], ['Reg', 417],
        ['Rei', 434], ['Rem', 468], ['Ren', 489], ['Rep', 516], ['Rev', 534], ['Rey', 556], ['Rh', 575],
        ['Ri', 613], ['Rib', 627], ['Ric', 648], ['Rid', 675], ['Rie', 698], ['Rig', 723], ['Ril', 749],
        ['Rin', 768], ['Rio', 785], ['Ris', 798], ['Rit', 815], ['Riv', 828], ['Ro', 858], ['Rob', 865],
        ['Roc', 878], ['Rod', 892], ['Roe', 896], ['Rog', 917], ['Roh', 928], ['Rol', 938], ['Rom', 956],
        ['Ron', 968], ['Roo', 975], ['Ros', 984], ['Rot', 988], ['Rou', 991], ['Row', 994], ['Roy', 996],
        ['Ru', 997], ['Rub', 998], ['Rud', 999]
      ],
      'S': [
        ['S', 100], ['Sa', 114], ['Sab', 118], ['Sac', 124], ['Sad', 132], ['Sae', 138], ['Saf', 145],
        ['Sag', 155], ['Sai', 165], ['Sal', 184], ['Sam', 215], ['San', 224], ['Sao', 256], ['Sap', 268],
        ['Sar', 284], ['Sas', 296], ['Sat', 318], ['Sau', 332], ['Sav', 347], ['Saw', 368], ['Say', 376],
        ['Sc', 395], ['Sch', 418], ['Sci', 474], ['Sco', 486], ['Se', 518], ['Sea', 522], ['Seb', 532],
        ['Sec', 545], ['See', 554], ['Seg', 568], ['Sei', 582], ['Sel', 598], ['Sem', 618], ['Sen', 637],
        ['Ser', 658], ['Set', 678], ['Sev', 695], ['Sew', 717], ['Sh', 728], ['Sha', 736], ['She', 768],
        ['Shi', 798], ['Sho', 824], ['Shu', 847], ['Si', 868], ['Sib', 874], ['Sid', 885], ['Sie', 898],
        ['Sig', 917], ['Sil', 928], ['Sim', 948], ['Sin', 965], ['Sip', 972], ['Sir', 978], ['Sis', 982],
        ['Sk', 985], ['Sl', 987], ['Sm', 989], ['Smi', 991], ['Sn', 993], ['So', 994], ['Sob', 9941],
        ['Soc', 9943], ['Sod', 9946], ['Sol', 9948], ['Som', 9951], ['Son', 9953], ['Soo', 9955],
        ['Sor', 9958], ['Sot', 9962], ['Sou', 9965], ['Sov', 9967], ['Sp', 9968], ['Spa', 9972],
        ['Spe', 9976], ['Spi', 9979], ['Spo', 9982], ['Spr', 9985], ['Sq', 9988], ['St', 9989],
        ['Sta', 9991], ['Ste', 9993], ['Sti', 9995], ['Sto', 9996], ['Str', 9997], ['Stu', 9998],
        ['Su', 9999]
      ],
      'T': [
        ['T', 100], ['Ta', 117], ['Tab', 122], ['Tac', 128], ['Taf', 145], ['Tag', 158], ['Tai', 168],
        ['Tak', 178], ['Tal', 192], ['Tam', 218], ['Tan', 234], ['Tap', 256], ['Tar', 278], ['Tas', 296],
        ['Tat', 312], ['Tau', 326], ['Tav', 345], ['Tay', 368], ['Te', 395], ['Tea', 398], ['Tec', 418],
        ['Tei', 438], ['Tel', 456], ['Tem', 478], ['Ten', 498], ['Ter', 528], ['Tes', 556], ['Th', 585],
        ['Tha', 598], ['The', 624], ['Thi', 658], ['Tho', 686], ['Thu', 728], ['Ti', 768], ['Tie', 778],
        ['Til', 798], ['Tim', 818], ['Tin', 838], ['Tit', 858], ['To', 875], ['Tob', 878], ['Tod', 886],
        ['Tol', 914], ['Tom', 928], ['Ton', 945], ['Too', 956], ['Top', 968], ['Tor', 978], ['Tos', 986],
        ['Tot', 989], ['Tou', 991], ['Tow', 993], ['Tr', 995], ['Tra', 996], ['Tre', 997], ['Tri', 998],
        ['Tro', 998], ['Tru', 999], ['Ts', 999], ['Tu', 999], ['Tub', 999], ['Tuc', 999], ['Tul', 999],
        ['Tun', 999], ['Tur', 999], ['Tut', 999], ['Tw', 999], ['Ty', 999]
      ],
      'U': [
        ['U', 100], ['Ua', 125], ['Ub', 145], ['Ud', 178], ['Ue', 215], ['Ug', 268], ['Uh', 316],
        ['Ul', 434], ['Ulm', 454], ['Uls', 476], ['Um', 518], ['Un', 576], ['Und', 595], ['Ung', 618],
        ['Uni', 648], ['Up', 698], ['Ur', 768], ['Urb', 785], ['Uri', 815], ['Us', 868], ['Ut', 925],
        ['Uz', 978]
      ],
      'V': [
        ['V', 100], ['Va', 117], ['Vac', 126], ['Vad', 138], ['Vag', 156], ['Vai', 168], ['Val', 186],
        ['Van', 228], ['Var', 276], ['Vas', 298], ['Vau', 324], ['Ve', 378], ['Vea', 386], ['Vec', 418],
        ['Vel', 438], ['Ven', 468], ['Ver', 496], ['Ves', 528], ['Vi', 568], ['Vic', 585], ['Vid', 618],
        ['Vie', 648], ['Vil', 686], ['Vin', 718], ['Vio', 748], ['Vir', 782], ['Vis', 815], ['Vit', 848],
        ['Viv', 878], ['Vo', 914], ['Vog', 928], ['Vol', 948], ['Von', 968], ['Vor', 982], ['Vos', 989],
        ['Vu', 994]
      ],
      'W': [
        ['W', 100], ['Wa', 117], ['Wab', 124], ['Wac', 134], ['Wad', 145], ['Wag', 168], ['Wah', 178],
        ['Wai', 186], ['Wal', 218], ['Wam', 248], ['Wan', 268], ['War', 298], ['Was', 334], ['Wat', 358],
        ['Wau', 376], ['Way', 398], ['We', 436], ['Wea', 445], ['Web', 468], ['Wed', 486], ['Wee', 498],
        ['Wei', 528], ['Wel', 558], ['Wen', 578], ['Wer', 598], ['Wes', 628], ['Wet', 656], ['Wh', 686],
        ['Wha', 698], ['Whe', 718], ['Whi', 748], ['Who', 778], ['Wi', 818], ['Wic', 828], ['Wid', 848],
        ['Wie', 868], ['Wig', 886], ['Wil', 908], ['Win', 948], ['Wis', 968], ['Wit', 982], ['Wo', 992],
        ['Wob', 993], ['Woe', 994], ['Wol', 995], ['Won', 996], ['Woo', 997], ['Wor', 998], ['Wot', 998],
        ['Wr', 999], ['Wri', 999], ['Wu', 999], ['Wy', 999]
      ],
      'X': [
        ['X', 100], ['Xa', 178], ['Xe', 298], ['Xi', 468], ['Xo', 678], ['Xu', 878]
      ],
      'Y': [
        ['Y', 100], ['Ya', 125], ['Yam', 148], ['Yan', 178], ['Yar', 218], ['Ye', 298], ['Yea', 318],
        ['Yel', 368], ['Yen', 418], ['Yo', 578], ['Yok', 598], ['Yon', 648], ['Yor', 698], ['You', 748],
        ['Yu', 878], ['Yun', 948]
      ],
      'Z': [
        ['Z', 100], ['Za', 125], ['Zab', 138], ['Zac', 158], ['Zah', 198], ['Zam', 248], ['Zan', 288],
        ['Zap', 328], ['Zar', 378], ['Ze', 448], ['Zea', 468], ['Zeb', 498], ['Zei', 548], ['Zel', 598],
        ['Zem', 648], ['Zen', 698], ['Zer', 748], ['Zi', 818], ['Zid', 838], ['Zie', 858], ['Zim', 898],
        ['Zin', 938], ['Zir', 968], ['Zo', 985], ['Zob', 987], ['Zol', 989], ['Zon', 991], ['Zoo', 993],
        ['Zor', 995], ['Zu', 997], ['Zuc', 998], ['Zum', 998], ['Zun', 999], ['Zur', 999], ['Zw', 999],
        ['Zy', 999]
      ]
    };
    
    const firstLetter = surname.charAt(0);
    
    // Buscar número na tabela
    let number = 100; // Valor padrão
    const table = cutterSanborn[firstLetter];
    
    if (table) {
      for (let i = table.length - 1; i >= 0; i--) {
        const [prefix, num] = table[i];
        if (surname.toUpperCase() >= prefix.toUpperCase()) {
          number = num;
          break;
        }
      }
    }
    
    // Pegar primeira letra do título (complemento) - desconsiderar artigos
    let titleLetter = '';
    if (bookTitle) {
      // Remover artigos iniciais
      const cleanTitle = bookTitle
        .replace(/^(o|a|os|as|um|uma|uns|umas|the|an|a)\s+/i, '')
        .trim();
      titleLetter = cleanTitle.charAt(0).toLowerCase();
    }
    
    return `${firstLetter}${number}${titleLetter}`;
  };

  const translateCategory = (cat: string): string => {
    if (!cat) return "";
    
    // Mapa extenso de traduções de categorias/assuntos
    const map: Record<string, string> = {
      // Ficção e Literatura
      "Fiction": "Ficção",
      "Literature": "Literatura",
      "Literary Fiction": "Ficção Literária",
      "General Fiction": "Ficção Geral",
      "Contemporary Fiction": "Ficção Contemporânea",
      "Classic Literature": "Literatura Clássica",
      "Classics": "Clássicos",
      "Poetry": "Poesia",
      "Drama": "Drama",
      "Short Stories": "Contos",
      "Essays": "Ensaios",
      "Novel": "Romance",
      "Novels": "Romances",
      
      // Infantojuvenil
      "Juvenile Fiction": "Infantojuvenil",
      "Juvenile Literature": "Literatura Juvenil",
      "Children's Fiction": "Ficção Infantil",
      "Children's stories": "Literatura Infantil",
      "Children's Books": "Livros Infantis",
      "Children": "Infantil",
      "Young Adult Fiction": "Ficção Jovem Adulto",
      "Young Adult": "Jovem Adulto",
      "Teen": "Adolescente",
      "Picture Books": "Livros Ilustrados",
      
      // Gêneros de Ficção
      "Fantasy": "Fantasia",
      "Science Fiction": "Ficção Científica",
      "Sci-Fi": "Ficção Científica",
      "Horror": "Terror",
      "Mystery": "Mistério",
      "Thriller": "Suspense",
      "Suspense": "Suspense",
      "Crime": "Crime",
      "Detective": "Detetive",
      "Romance": "Romance",
      "Adventure": "Aventura",
      "Action": "Ação",
      "Historical Fiction": "Ficção Histórica",
      "War": "Guerra",
      "Western": "Faroeste",
      "Humor": "Humor",
      "Comedy": "Comédia",
      "Satire": "Sátira",
      "Dystopian": "Distopia",
      "Utopian": "Utopia",
      "Paranormal": "Paranormal",
      "Supernatural": "Sobrenatural",
      "Urban Fantasy": "Fantasia Urbana",
      "Epic Fantasy": "Fantasia Épica",
      "Dark Fantasy": "Fantasia Sombria",
      "Fairy Tales": "Contos de Fadas",
      "Folklore": "Folclore",
      "Mythology": "Mitologia",
      "Legends": "Lendas",
      
      // Ciências e Tecnologia
      "Science": "Ciências",
      "Sciences": "Ciências",
      "Technology": "Tecnologia",
      "Computers": "Computação",
      "Computer Science": "Ciência da Computação",
      "Programming": "Programação",
      "Mathematics": "Matemática",
      "Math": "Matemática",
      "Physics": "Física",
      "Chemistry": "Química",
      "Biology": "Biologia",
      "Astronomy": "Astronomia",
      "Geology": "Geologia",
      "Ecology": "Ecologia",
      "Environmental": "Meio Ambiente",
      "Nature": "Natureza",
      "Natural History": "História Natural",
      "Engineering": "Engenharia",
      "Medicine": "Medicina",
      "Medical": "Medicina",
      "Health": "Saúde",
      "Nutrition": "Nutrição",
      "Anatomy": "Anatomia",
      "Genetics": "Genética",
      "Neuroscience": "Neurociência",
      "Agriculture": "Agricultura",
      "Botany": "Botânica",
      "Zoology": "Zoologia",
      "Animals": "Animais",
      
      // Ciências Humanas e Sociais
      "Philosophy": "Filosofia",
      "Psychology": "Psicologia",
      "Sociology": "Sociologia",
      "Anthropology": "Antropologia",
      "Archaeology": "Arqueologia",
      "History": "História",
      "World History": "História Mundial",
      "Ancient History": "História Antiga",
      "Modern History": "História Moderna",
      "Politics": "Política",
      "Political Science": "Ciência Política",
      "Government": "Governo",
      "Law": "Direito",
      "Legal": "Jurídico",
      "Economics": "Economia",
      "Business": "Negócios",
      "Finance": "Finanças",
      "Management": "Administração",
      "Marketing": "Marketing",
      "Entrepreneurship": "Empreendedorismo",
      "Self-Help": "Autoajuda",
      "Self Help": "Autoajuda",
      "Personal Development": "Desenvolvimento Pessoal",
      "Motivation": "Motivação",
      "Inspirational": "Inspiração",
      "Success": "Sucesso",
      "Leadership": "Liderança",
      
      // Educação
      "Education": "Educação",
      "Teaching": "Ensino",
      "Learning": "Aprendizagem",
      "Study Aids": "Material de Estudo",
      "Reference": "Referência",
      "Textbook": "Livro Didático",
      "Academic": "Acadêmico",
      "Language": "Idiomas",
      "Languages": "Idiomas",
      "English": "Inglês",
      "Portuguese": "Português",
      "Spanish": "Espanhol",
      "French": "Francês",
      "German": "Alemão",
      "Italian": "Italiano",
      "Foreign Language": "Língua Estrangeira",
      "Grammar": "Gramática",
      "Vocabulary": "Vocabulário",
      "Dictionary": "Dicionário",
      
      // Artes
      "Art": "Arte",
      "Arts": "Artes",
      "Fine Arts": "Belas Artes",
      "Visual Arts": "Artes Visuais",
      "Painting": "Pintura",
      "Drawing": "Desenho",
      "Sculpture": "Escultura",
      "Photography": "Fotografia",
      "Architecture": "Arquitetura",
      "Design": "Design",
      "Graphic Design": "Design Gráfico",
      "Interior Design": "Design de Interiores",
      "Fashion": "Moda",
      "Music": "Música",
      "Film": "Cinema",
      "Movies": "Cinema",
      "Television": "Televisão",
      "Theater": "Teatro",
      "Theatre": "Teatro",
      "Dance": "Dança",
      "Performing Arts": "Artes Cênicas",
      "Comics": "Quadrinhos",
      "Graphic Novels": "Graphic Novels",
      "Manga": "Mangá",
      "Animation": "Animação",
      
      // Religião e Espiritualidade
      "Religion": "Religião",
      "Religious": "Religioso",
      "Spirituality": "Espiritualidade",
      "Christianity": "Cristianismo",
      "Christian": "Cristão",
      "Bible": "Bíblia",
      "Biblical": "Bíblico",
      "Catholicism": "Catolicismo",
      "Catholic": "Católico",
      "Protestant": "Protestante",
      "Buddhism": "Budismo",
      "Buddhist": "Budista",
      "Hinduism": "Hinduísmo",
      "Islam": "Islamismo",
      "Judaism": "Judaísmo",
      "Jewish": "Judaico",
      "Occult": "Ocultismo",
      "New Age": "Nova Era",
      "Meditation": "Meditação",
      "Mindfulness": "Mindfulness",
      "Yoga": "Yoga",
      
      // Biografias e Memórias
      "Biography": "Biografia",
      "Biographies": "Biografias",
      "Autobiography": "Autobiografia",
      "Memoir": "Memórias",
      "Memoirs": "Memórias",
      "Personal Narratives": "Narrativas Pessoais",
      "Diaries": "Diários",
      "Letters": "Cartas",
      
      // Casa e Estilo de Vida
      "Cooking": "Culinária",
      "Cookbooks": "Livros de Receitas",
      "Food": "Gastronomia",
      "Wine": "Vinhos",
      "Beverages": "Bebidas",
      "Gardening": "Jardinagem",
      "Home": "Casa",
      "House": "Casa",
      "Crafts": "Artesanato",
      "Hobbies": "Hobbies",
      "Games": "Jogos",
      "Puzzles": "Quebra-cabeças",
      "Sports": "Esportes",
      "Fitness": "Fitness",
      "Exercise": "Exercícios",
      "Outdoors": "Ao Ar Livre",
      "Travel": "Viagens",
      "Tourism": "Turismo",
      "Pets": "Animais de Estimação",
      "Dogs": "Cães",
      "Cats": "Gatos",
      
      // Família e Relacionamentos
      "Family": "Família",
      "Parenting": "Paternidade/Maternidade",
      "Relationships": "Relacionamentos",
      "Marriage": "Casamento",
      "Dating": "Namoro",
      "Sexuality": "Sexualidade",
      "Gender": "Gênero",
      "Women": "Mulheres",
      "Men": "Homens",
      "Feminism": "Feminismo",
      "LGBTQ": "LGBTQ+",
      
      // Outros
      "True Crime": "Crime Real",
      "True Story": "História Real",
      "Journalism": "Jornalismo",
      "Media": "Mídia",
      "Communication": "Comunicação",
      "Social Issues": "Questões Sociais",
      "Current Events": "Atualidades",
      "Criticism": "Crítica",
      "Literary Criticism": "Crítica Literária",
      "Ethics": "Ética",
      "Logic": "Lógica",
      "Metaphysics": "Metafísica",
      "Aesthetics": "Estética",
      "General": "Geral",
      "Miscellaneous": "Diversos",
      "Unknown": "Desconhecido",
      "Unspecified": "Não Especificado",
      "Accessible book": "Livro Acessível",
      "Protected DAISY": "DAISY Protegido",
      "In library": "Em Biblioteca",
      "Internet Archive Wishlist": "Lista de Desejos"
    };
    
    // Primeiro, tentar encontrar correspondência exata (case insensitive)
    const catLower = cat.toLowerCase().trim();
    for (const key in map) {
      if (catLower === key.toLowerCase()) {
        return map[key];
      }
    }
    
    // Depois, tentar encontrar correspondência parcial
    for (const key in map) {
      if (catLower.includes(key.toLowerCase())) {
        return map[key];
      }
    }
    
    // Se não encontrou tradução no mapa, retornar original
    return cat;
  };
  
  // Função assíncrona para traduzir categoria via API se necessário
  const translateCategoryAsync = async (cat: string): Promise<string> => {
    if (!cat) return "";
    
    // Primeiro tenta tradução local
    const translated = translateCategory(cat);
    
    // Se a tradução local retornou o mesmo valor (não encontrou no mapa)
    // e parece ser inglês, traduzir via API
    if (translated === cat && isEnglishText(cat + " " + cat + " " + cat)) {
      try {
        const response = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cat)}&langpair=en|pt-BR`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.responseStatus === 200 && data.responseData?.translatedText) {
            // Capitalizar primeira letra
            const result = data.responseData.translatedText;
            return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
          }
        }
      } catch (e) {
        console.warn('Erro ao traduzir categoria:', e);
      }
    }
    
    return translated;
  };

  // Função para detectar se o texto está em inglês
  const isEnglishText = (text: string): boolean => {
    if (!text || text.length < 20) return false;
    
    // Palavras comuns em inglês que raramente aparecem em português
    const englishWords = [
      /\bthe\b/gi, /\band\b/gi, /\bof\b/gi, /\bto\b/gi, /\bin\b/gi,
      /\bthat\b/gi, /\bis\b/gi, /\bwas\b/gi, /\bfor\b/gi, /\bon\b/gi,
      /\bwith\b/gi, /\bhe\b/gi, /\bshe\b/gi, /\bit\b/gi, /\bhis\b/gi,
      /\bher\b/gi, /\bthey\b/gi, /\bwho\b/gi, /\bwhat\b/gi, /\bwhen\b/gi,
      /\bwhere\b/gi, /\bwhich\b/gi, /\bhow\b/gi, /\bthis\b/gi, /\bthere\b/gi,
      /\bfrom\b/gi, /\bhave\b/gi, /\bhas\b/gi, /\bbeen\b/gi, /\bwill\b/gi,
      /\btheir\b/gi, /\bcan\b/gi, /\binto\b/gi, /\babout\b/gi
    ];
    
    let matchCount = 0;
    for (const word of englishWords) {
      if (word.test(text)) matchCount++;
    }
    
    // Se encontrar 5 ou mais palavras em inglês, provavelmente é inglês
    return matchCount >= 5;
  };

  // Função para traduzir texto para português
  const translateToPortuguese = async (text: string): Promise<string> => {
    if (!text || text.length < 10) return text;
    
    try {
      // Usar API MyMemory (gratuita, até 5000 chars/dia)
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.substring(0, 500))}&langpair=en|pt-BR`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
          let translated = data.responseData.translatedText;
          
          // Se o texto original era maior que 500 chars, traduzir o resto
          if (text.length > 500) {
            const response2 = await fetch(
              `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.substring(500, 1000))}&langpair=en|pt-BR`
            );
            if (response2.ok) {
              const data2 = await response2.json();
              if (data2.responseStatus === 200 && data2.responseData?.translatedText) {
                translated += ' ' + data2.responseData.translatedText;
              }
            }
          }
          
          return translated;
        }
      }
    } catch (e) {
      console.warn('Erro ao traduzir:', e);
    }
    
    // Se falhar, retornar texto original
    return text;
  };

  // Função para limpar HTML/JavaScript da descrição
  const sanitizeDescription = (text: string): string => {
    if (!text) return "";
    
    // Detectar se é código JavaScript/HTML (mesmo sem < e >)
    const codePatterns = [
      /script\s+type\s*=/i,                    // script type=
      /function\s+\w+\s*\(/i,                  // function nome(
      /function\s*\(\s*\w*\s*\)\s*\{/i,        // function() { ou function(d) {
      /document\.(getElementById|write|createElement)/i,
      /window\.(screen|location|jQuery)/i,
      /jQuery\s*\(/i,
      /\.innerHTML\s*=/i,
      /\.ready\s*\(\s*function/i,
      /setTimeout\s*\(\s*function/i,
      /\.ajax\s*\(\s*\{/i,
      /iframe\s+width\s*=/i,
      /frameborder\s*=/i,
    ];
    
    // Se o texto contém múltiplos padrões de código, é provavelmente só código
    const matchCount = codePatterns.filter(pattern => pattern.test(text)).length;
    if (matchCount >= 2) {
      return "";
    }
    
    // Remover tags script e seu conteúdo (com ou sem < >)
    let cleaned = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/script[^/]*\/script/gi, '');
    
    // Remover tags style e seu conteúdo
    cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remover iframes
    cleaned = cleaned.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
    cleaned = cleaned.replace(/<iframe[^>]*\/>/gi, '');
    cleaned = cleaned.replace(/iframe[^/]*\/iframe/gi, '');
    
    // Remover divs vazias
    cleaned = cleaned.replace(/div\s+id\s*=\s*"[^"]*"\s*\/div/gi, '');
    
    // Converter quebras de linha HTML para espaços
    cleaned = cleaned.replace(/<br\s*\/?>/gi, ' ');
    cleaned = cleaned.replace(/<\/p>/gi, ' ');
    
    // Remover todas as outras tags HTML
    cleaned = cleaned.replace(/<[^>]+>/g, '');
    
    // Remover entidades HTML comuns
    cleaned = cleaned
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&#\d+;/g, '');
    
    // Remover múltiplos espaços e quebras de linha
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  };

  // Interface para dados do Open Library
  interface OpenLibraryData {
    cover: string;
    title: string;
    subtitle: string;
    author: string;
    publisher: string;
    publication_date: string;
    description: string;
    page_count: string;
    language: string;
    category: string;
    subjects: string[]; // Tags/assuntos do Open Library
  }

  // Interface para dados de outras APIs
  interface ExternalBookData {
    title: string;
    subtitle?: string;
    author: string;
    publisher: string;
    publication_date: string;
    cover: string;
    description: string;
    page_count: string;
    category: string;
    source: string;
    // Campos extras da CBL
    edition?: string;
    language?: string;
    format?: string;
    target_audience?: string;
    city?: string;
    state?: string;
    country?: string;
    tags?: string[]; // Tags/palavras-chave
  }

  // Função para buscar dados na API do OpenBD (base japonesa com boa cobertura)
  const fetchOpenBDData = async (isbn: string): Promise<ExternalBookData | null> => {
    try {
      const response = await fetch(`https://api.openbd.jp/v1/get?isbn=${isbn}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0].summary) {
          const book = data[0].summary;
          return {
            title: book.title || "",
            author: book.author || "",
            publisher: book.publisher || "",
            publication_date: book.pubdate || "",
            cover: book.cover || "",
            description: "",
            page_count: "",
            category: "",
            source: "OpenBD"
          };
        }
      }
    } catch (e) {
      console.log("OpenBD não encontrou o livro");
    }
    return null;
  };

  // Helper: fetch com timeout
  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = 5000): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  };

  // Função para buscar dados na WorldCat via xISBN (com timeout de 3s)
  const fetchWorldCatData = async (isbn: string): Promise<ExternalBookData | null> => {
    try {
      console.log("🌍 Consultando WorldCat...");
      // WorldCat xISBN - retorna ISBNs relacionados e metadados básicos
      const response = await fetchWithTimeout(
        `https://xisbn.worldcat.org/webservices/xid/isbn/${isbn}?method=getMetadata&format=json&fl=*`,
        {},
        3000 // timeout de 3 segundos
      );
      if (response.ok) {
        const data = await response.json();
        console.log("WorldCat response:", data);
        if (data && data.stat === "ok" && data.list && data.list[0]) {
          const book = data.list[0];
          return {
            title: book.title || "",
            author: book.author || "",
            publisher: book.publisher || "",
            publication_date: book.year || "",
            cover: "",
            description: "",
            page_count: "",
            category: "",
            source: "WorldCat"
          };
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log("⏱️ WorldCat timeout (muito lento)");
      } else {
        console.log("WorldCat não encontrou o livro");
      }
    }
    return null;
  };

  // Função para buscar dados na API Brapci (brasileira, gratuita)
  const fetchBrapciData = async (isbn: string): Promise<ExternalBookData | null> => {
    try {
      console.log("🇧🇷 Consultando Brapci...");
      // API Brapci - base de dados brasileira de livros
      const response = await fetchWithTimeout(
        `https://cip.brapci.inf.br/api/book/isbn/${isbn}`,
        { headers: { 'Accept': 'application/json' } },
        5000
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Brapci response:", data);
        
        // Verificar se tem dados reais (não apenas validação de ISBN)
        const hasRealData = data && (
          (data.title && data.title.trim()) || 
          (data.titulo && data.titulo.trim()) ||
          (data.isbnbd && data.isbnbd.title && data.isbnbd.title.trim())
        );
        
        if (hasRealData) {
          // Dados podem estar em diferentes níveis da resposta
          const bookData = data.isbnbd || data;
          return {
            title: bookData.title || bookData.titulo || "",
            author: bookData.author || bookData.autor || (bookData.authors ? bookData.authors.join(", ") : "") || "",
            publisher: bookData.publisher || bookData.editora || "",
            publication_date: bookData.year || bookData.ano || bookData.publication_date || "",
            cover: bookData.cover || bookData.capa || "",
            description: bookData.description || bookData.descricao || bookData.sinopse || "",
            page_count: bookData.pages || bookData.paginas || "",
            category: bookData.subject || bookData.assunto || bookData.category || "",
            source: "Brapci"
          };
        } else {
          console.log("Brapci: ISBN válido mas sem dados do livro");
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log("⏱️ Brapci timeout");
      } else {
        console.log("Brapci erro:", e.message || e);
      }
    }
    return null;
  };

  // Função para buscar dados na CBL (Câmara Brasileira do Livro) - API Azure Search
  // Esta é a fonte OFICIAL de ISBNs brasileiros
  const fetchCBLData = async (isbn: string): Promise<ExternalBookData | null> => {
    try {
      console.log("📚 Consultando CBL (Câmara Brasileira do Livro)...");
      
      // API Azure Search da CBL - chave pública disponível no site
      const response = await fetchWithTimeout(
        `https://isbn-search-br.search.windows.net/indexes/isbn-index/docs?api-version=2021-04-30-Preview&search=${isbn}&$top=1`,
        { 
          headers: { 
            'api-key': '100216A23C5AEE390338BBD19EA86D29',
            'Content-Type': 'application/json'
          } 
        },
        8000 // timeout de 8 segundos
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log("CBL response:", data);
        
        if (data && data.value && data.value.length > 0) {
          const book = data.value[0];
          
          // Verificar se o ISBN encontrado corresponde ao buscado
          const foundIsbn = book.RowKey || book.FormattedKey?.replace(/-/g, '');
          if (foundIsbn && foundIsbn.includes(isbn.replace(/-/g, ''))) {
            // Extrair idioma do array IdiomasObra
            let language = "";
            if (book.IdiomasObra && book.IdiomasObra.length > 0) {
              const idioma = book.IdiomasObra[0];
              // Converter para código de idioma padrão
              if (idioma.toLowerCase().includes("português") || idioma.toLowerCase().includes("portugues")) {
                language = "pt-BR";
              } else if (idioma.toLowerCase().includes("english") || idioma.toLowerCase().includes("inglês")) {
                language = "en";
              } else if (idioma.toLowerCase().includes("español") || idioma.toLowerCase().includes("espanhol")) {
                language = "es";
              } else {
                language = idioma;
              }
            }
            
            // Extrair país do array Countries
            let country = "";
            if (book.Countries && book.Countries.length > 0) {
              country = book.Countries[0];
            }
            
            return {
              title: book.Title || "",
              subtitle: book.Subtitle || "",
              author: book.AuthorsStr || (book.Authors ? book.Authors.join(", ") : "") || "",
              publisher: book.Imprint || "",
              publication_date: book.Ano || (book.Date ? new Date(book.Date).getFullYear().toString() : "") || "",
              cover: "", // CBL não fornece capas
              description: book.Sinopse || "",
              page_count: book.Paginas && book.Paginas !== "0" ? book.Paginas : "",
              category: book.Subject || book.Assunto || "",
              source: "CBL (Oficial)",
              // Campos extras da CBL
              edition: book.Edicao || "",
              language: language,
              format: book.Formato || book.Veiculacao || "",
              target_audience: book.Publico || "",
              city: book.Cidade || "",
              state: book.UF || "",
              country: country,
              tags: book.PalavrasChave || [] // Tags/palavras-chave da CBL
            };
          }
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log("⏱️ CBL timeout");
      } else {
        console.log("CBL erro:", e.message || e);
      }
    }
    return null;
  };

  // Função para buscar dados via API do Mercado Editorial / BuscaISBN (livros brasileiros)
  const fetchMercadoEditorialData = async (isbn: string): Promise<ExternalBookData | null> => {
    try {
      // Tentar via API alternativa - biblioteca.org.br ou similar
      // Como não há API oficial aberta, usamos busca no Google Books com filtro brasileiro
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&country=BR&maxResults=1`);
      if (response.ok) {
        const data = await response.json();
        if (data.totalItems > 0 && data.items[0].volumeInfo) {
          const info = data.items[0].volumeInfo;
          return {
            title: info.title || "",
            author: info.authors?.join(", ") || "",
            publisher: info.publisher || "",
            publication_date: info.publishedDate || "",
            cover: info.imageLinks?.thumbnail?.replace('http://', 'https://') || "",
            description: info.description || "",
            page_count: info.pageCount?.toString() || "",
            category: info.categories?.[0] || "",
            source: "Google Books BR"
          };
        }
      }
    } catch (e) {
      console.log("Busca BR não encontrou o livro");
    }
    return null;
  };

  // Função simplificada - apenas retorna true, validação de placeholder será visual
  // O problema de CORS impede validação confiável no navegador
  const isValidOpenLibraryCover = async (coverUrl: string): Promise<boolean> => {
    // Sempre retorna true - deixa o navegador carregar e mostrar
    // Se for placeholder, usuário verá e pode remover manualmente
    console.log("🖼️ Capa Open Library:", coverUrl);
    return true;
  };

  // Dicionário de tradução palavra por palavra (inglês -> português)
  const wordTranslations: Record<string, string> = {
    // Palavras comuns em tags
    'fiction': 'ficção', 'nonfiction': 'não-ficção', 'non-fiction': 'não-ficção',
    'stories': 'histórias', 'story': 'história', 'tales': 'contos', 'tale': 'conto',
    'life': 'vida', 'lives': 'vidas', 'living': 'vivendo',
    'school': 'escola', 'schools': 'escolas', 'middle': 'fundamental',
    'high': 'ensino médio', 'elementary': 'fundamental', 'college': 'faculdade',
    'family': 'família', 'families': 'famílias', 'familiar': 'familiar',
    'friend': 'amigo', 'friends': 'amigos', 'friendship': 'amizade',
    'child': 'criança', 'children': 'crianças', "children's": 'infantil',
    'parent': 'pai/mãe', 'parents': 'pais', 'parenting': 'parentalidade',
    'mother': 'mãe', 'father': 'pai', 'son': 'filho', 'daughter': 'filha',
    'brother': 'irmão', 'sister': 'irmã', 'siblings': 'irmãos',
    'diary': 'diário', 'diaries': 'diários', 'journal': 'diário', 'journals': 'diários',
    'humorous': 'humorístico', 'humor': 'humor', 'funny': 'engraçado', 'comic': 'cômico',
    'juvenile': 'juvenil', 'teen': 'adolescente', 'teenager': 'adolescente', 'teens': 'adolescentes',
    'young': 'jovem', 'youth': 'juventude', 'adult': 'adulto', 'adults': 'adultos',
    'relation': 'relação', 'relations': 'relações', 'relationship': 'relacionamento',
    'love': 'amor', 'loving': 'amoroso', 'romance': 'romance', 'romantic': 'romântico',
    'adventure': 'aventura', 'adventures': 'aventuras', 'adventurous': 'aventureiro',
    'mystery': 'mistério', 'mysteries': 'mistérios', 'mysterious': 'misterioso',
    'fantasy': 'fantasia', 'fantastic': 'fantástico', 'magical': 'mágico', 'magic': 'magia',
    'science': 'ciência', 'scientific': 'científico', 'scientist': 'cientista',
    'history': 'história', 'historical': 'histórico', 'historic': 'histórico',
    'biography': 'biografia', 'biographical': 'biográfico', 'autobiographical': 'autobiográfico',
    'autobiography': 'autobiografia', 'memoir': 'memórias', 'memoirs': 'memórias',
    'poetry': 'poesia', 'poems': 'poemas', 'poem': 'poema', 'poetic': 'poético',
    'novel': 'romance', 'novels': 'romances', 'novella': 'novela',
    'short': 'curto', 'long': 'longo', 'series': 'série',
    'drama': 'drama', 'dramatic': 'dramático', 'tragedy': 'tragédia', 'tragic': 'trágico',
    'comedy': 'comédia', 'comedic': 'cômico', 'satire': 'sátira', 'satirical': 'satírico',
    'thriller': 'suspense', 'suspense': 'suspense', 'suspenseful': 'tenso',
    'horror': 'terror', 'scary': 'assustador', 'frightening': 'aterrorizante',
    'crime': 'crime', 'criminal': 'criminal', 'detective': 'detetive', 'detectives': 'detetives',
    'war': 'guerra', 'wars': 'guerras', 'military': 'militar', 'battle': 'batalha',
    'death': 'morte', 'dead': 'morto', 'dying': 'morrendo', 'ghost': 'fantasma',
    'animal': 'animal', 'animals': 'animais', 'pet': 'animal de estimação', 'pets': 'animais de estimação',
    'dog': 'cachorro', 'dogs': 'cachorros', 'cat': 'gato', 'cats': 'gatos',
    'nature': 'natureza', 'natural': 'natural', 'environment': 'meio ambiente',
    'world': 'mundo', 'global': 'global', 'international': 'internacional',
    'american': 'americano', 'british': 'britânico', 'english': 'inglês',
    'french': 'francês', 'german': 'alemão', 'spanish': 'espanhol',
    'brazilian': 'brasileiro', 'portuguese': 'português', 'latin': 'latino',
    'african': 'africano', 'asian': 'asiático', 'european': 'europeu',
    'classic': 'clássico', 'classics': 'clássicos', 'classical': 'clássico',
    'modern': 'moderno', 'contemporary': 'contemporâneo', 'current': 'atual',
    'new': 'novo', 'old': 'antigo', 'ancient': 'antigo',
    'literature': 'literatura', 'literary': 'literário', 'fiction': 'ficção',
    'reading': 'leitura', 'readers': 'leitores', 'reader': 'leitor',
    'book': 'livro', 'books': 'livros', 'text': 'texto', 'texts': 'textos',
    'education': 'educação', 'educational': 'educacional', 'learning': 'aprendizado',
    'teaching': 'ensino', 'teacher': 'professor', 'teachers': 'professores',
    'student': 'estudante', 'students': 'estudantes', 'study': 'estudo',
    'art': 'arte', 'arts': 'artes', 'artistic': 'artístico', 'artist': 'artista',
    'music': 'música', 'musical': 'musical', 'musician': 'músico',
    'film': 'filme', 'films': 'filmes', 'movie': 'filme', 'movies': 'filmes',
    'theater': 'teatro', 'theatre': 'teatro', 'play': 'peça', 'plays': 'peças',
    'dance': 'dança', 'dancing': 'dançando', 'dancer': 'dançarino',
    'sport': 'esporte', 'sports': 'esportes', 'athletic': 'atlético',
    'game': 'jogo', 'games': 'jogos', 'gaming': 'jogos',
    'cooking': 'culinária', 'cook': 'cozinhar', 'food': 'comida', 'recipe': 'receita',
    'travel': 'viagem', 'traveling': 'viajando', 'traveler': 'viajante',
    'religion': 'religião', 'religious': 'religioso', 'spiritual': 'espiritual',
    'christian': 'cristão', 'christianity': 'cristianismo', 'catholic': 'católico',
    'philosophy': 'filosofia', 'philosophical': 'filosófico', 'philosopher': 'filósofo',
    'psychology': 'psicologia', 'psychological': 'psicológico', 'psychologist': 'psicólogo',
    'sociology': 'sociologia', 'sociological': 'sociológico', 'social': 'social',
    'politics': 'política', 'political': 'político', 'politician': 'político',
    'economics': 'economia', 'economic': 'econômico', 'economist': 'economista',
    'business': 'negócios', 'management': 'gestão', 'marketing': 'marketing',
    'technology': 'tecnologia', 'technological': 'tecnológico', 'tech': 'tecnologia',
    'computer': 'computador', 'computers': 'computadores', 'internet': 'internet',
    'health': 'saúde', 'healthy': 'saudável', 'medicine': 'medicina', 'medical': 'médico',
    'self': 'auto', 'help': 'ajuda', 'self-help': 'autoajuda', 'improvement': 'melhoria',
    'personal': 'pessoal', 'development': 'desenvolvimento', 'growth': 'crescimento',
    'success': 'sucesso', 'successful': 'bem-sucedido', 'motivation': 'motivação',
    'inspirational': 'inspiracional', 'inspiring': 'inspirador', 'inspiration': 'inspiração',
    'women': 'mulheres', 'woman': 'mulher', 'female': 'feminino', 'feminine': 'feminino',
    'men': 'homens', 'man': 'homem', 'male': 'masculino', 'masculine': 'masculino',
    'girl': 'menina', 'girls': 'meninas', 'boy': 'menino', 'boys': 'meninos',
    'baby': 'bebê', 'babies': 'bebês', 'infant': 'bebê', 'infants': 'bebês',
    'picture': 'ilustrado', 'pictures': 'ilustrações', 'illustrated': 'ilustrado',
    'graphic': 'gráfico', 'comics': 'quadrinhos', 'manga': 'mangá',
    'award': 'prêmio', 'awards': 'prêmios', 'winning': 'vencedor', 'winner': 'vencedor',
    'bestseller': 'best-seller', 'bestselling': 'mais vendido', 'popular': 'popular',
    'coming': 'amadurecimento', 'age': 'idade', 'coming-of-age': 'amadurecimento',
    'growing': 'crescimento', 'up': '', 'growing up': 'crescimento'
  };

  // Traduções de frases completas (prioridade sobre palavra por palavra)
  const phraseTranslations: Record<string, string> = {
    'family life': 'vida familiar',
    'school stories': 'histórias escolares',
    'school life': 'vida escolar',
    'middle school': 'ensino fundamental',
    'high school': 'ensino médio',
    'parent-child': 'pais e filhos',
    'parent child': 'pais e filhos',
    'parent-child relations': 'relação familiar',
    'parent and child': 'pais e filhos',
    'mother-daughter': 'mãe e filha',
    'father-son': 'pai e filho',
    'coming of age': 'amadurecimento',
    'coming-of-age': 'amadurecimento',
    'young adult': 'juvenil',
    'young adult fiction': 'ficção juvenil',
    "children's fiction": 'ficção infantil',
    "children's literature": 'literatura infantil',
    'juvenile fiction': 'ficção juvenil',
    'juvenile literature': 'literatura juvenil',
    'humorous stories': 'histórias humorísticas',
    'humorous fiction': 'ficção humorística',
    'short stories': 'contos',
    'love stories': 'histórias de amor',
    'adventure stories': 'histórias de aventura',
    'detective stories': 'histórias de detetive',
    'ghost stories': 'histórias de fantasma',
    'fairy tales': 'contos de fadas',
    'folk tales': 'contos populares',
    'science fiction': 'ficção científica',
    'historical fiction': 'ficção histórica',
    'realistic fiction': 'ficção realista',
    'graphic novels': 'graphic novels',
    'picture books': 'livros ilustrados',
    'board books': 'livros cartonados',
    'chapter books': 'livros infantojuvenis',
    'easy readers': 'leitura fácil',
    'best friends': 'melhores amigos',
    'first love': 'primeiro amor',
    'true story': 'história real',
    'based on': 'baseado em',
    'new york times': 'new york times',
    'award winner': 'premiado',
    'award-winning': 'premiado',
    'best seller': 'best-seller',
    'self help': 'autoajuda',
    'self-help': 'autoajuda',
    'personal development': 'desenvolvimento pessoal',
    'mental health': 'saúde mental',
    'world war': 'guerra mundial',
    'civil war': 'guerra civil'
  };

  // Cache de traduções da API para evitar requisições repetidas
  const apiTranslationCache: Record<string, string> = {};

  // Função para traduzir via API MyMemory (gratuita)
  const translateViaAPI = async (text: string): Promise<string> => {
    const cacheKey = text.toLowerCase().trim();
    if (apiTranslationCache[cacheKey]) return apiTranslationCache[cacheKey];
    
    try {
      const response = await fetchWithTimeout(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|pt-br`,
        {}, 3000
      );
      if (response.ok) {
        const data = await response.json();
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
          const translated = data.responseData.translatedText.toLowerCase().trim();
          if (translated !== text.toLowerCase()) {
            apiTranslationCache[cacheKey] = translated;
            console.log(`🌐 API: "${text}" → "${translated}"`);
            return translated;
          }
        }
      }
    } catch (e) { /* silenciar */ }
    return '';
  };

  // Verifica se texto parece inglês não traduzido
  const looksLikeEnglish = (text: string): boolean => {
    const clean = text.toLowerCase().trim();
    if (clean.length < 4 || /[áàâãéèêíìîóòôõúùûç]/.test(clean)) return false;
    const englishIndicators = ['ing', 'tion', 'ness', 'ment', 'able', 'ous', 'ive', 'ful', 'less', 'ship'];
    const commonEnglish = ['and', 'the', 'of', 'stories', 'story', 'life', 'relations', 'related'];
    const words = clean.split(/\s+/);
    if (words.some(w => commonEnglish.includes(w))) return true;
    if (englishIndicators.some(s => clean.endsWith(s))) return true;
    return /^[a-z\s]+$/.test(clean) && clean.length > 5;
  };

  // Tradução síncrona (apenas dicionário local)
  const translateTagSync = (tag: string): string => {
    let lowerTag = tag.toLowerCase().trim();
    if (phraseTranslations[lowerTag]) return phraseTranslations[lowerTag];
    for (const [en, pt] of Object.entries(phraseTranslations)) {
      if (lowerTag.includes(en)) lowerTag = lowerTag.replace(en, pt);
    }
    const words = lowerTag.split(/[\s,\-]+/);
    const translated = words.map(w => wordTranslations[w.trim()] || w.trim()).filter(w => w.length > 0);
    let result = translated.join(' ');
    const stopWords = ['the', 'and', 'of', 'in', 'for', 'with', 'from', 'by', 'to', 'a', 'an', 'on', 'at', 'as', 'or'];
    result = result.split(' ').filter(w => !stopWords.includes(w.toLowerCase())).join(' ');
    result = result.replace(/\s+/g, ' ').trim();
    return result.length < 3 ? '' : result;
  };

  // Tradução assíncrona (com fallback para API)
  const translateTagAsync = async (tag: string): Promise<string> => {
    let result = translateTagSync(tag);
    if (result && looksLikeEnglish(result)) {
      const apiResult = await translateViaAPI(result);
      if (apiResult) result = apiResult;
    }
    if (!result && tag.trim().length > 3) {
      const apiResult = await translateViaAPI(tag);
      if (apiResult && !looksLikeEnglish(apiResult)) result = apiResult;
    }
    result = result.replace(/\s+/g, ' ').trim();
    return result.length < 3 ? '' : result;
  };

  // Traduz array de tags (assíncrona com API)
  const translateTagsAsync = async (tags: string[]): Promise<string[]> => {
    const results: string[] = [];
    for (let i = 0; i < tags.length; i += 5) {
      const batch = tags.slice(i, i + 5);
      const translations = await Promise.all(batch.map(translateTagAsync));
      translations.forEach(t => { if (t && !results.includes(t)) results.push(t); });
    }
    // Remover tags similares/duplicadas
    return removeSimilarTags(results);
  };

  // Remove acentos de uma string
  const removeAccents = (str: string): string => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  // Converte palavra para singular
  const toSingular = (word: string): string => {
    let w = word.toLowerCase().trim();
    
    // Regras de plural -> singular em português
    if (w.endsWith('ões')) return w.slice(0, -3) + 'ao';
    if (w.endsWith('ães')) return w.slice(0, -3) + 'ao';
    if (w.endsWith('ais')) return w.slice(0, -2) + 'l';
    if (w.endsWith('eis')) return w.slice(0, -2) + 'l';
    if (w.endsWith('ois')) return w.slice(0, -2) + 'l';
    if (w.endsWith('uis')) return w.slice(0, -2) + 'l';
    if (w.endsWith('res') && w.length > 4) return w.slice(0, -2);
    if (w.endsWith('ses') && w.length > 4) return w.slice(0, -2);
    if (w.endsWith('ns') && w.length > 3) return w.slice(0, -2) + 'm';
    if (w.endsWith('s') && w.length > 3 && !w.endsWith('ss')) return w.slice(0, -1);
    
    return w;
  };

  // Verifica se uma palavra parece ser inglês
  const isEnglishWord = (word: string): boolean => {
    const englishWords = new Set([
      'investments', 'holdings', 'trading', 'business', 'management', 'marketing',
      'the', 'and', 'of', 'in', 'for', 'with', 'from', 'by', 'to', 'about',
      'fiction', 'stories', 'story', 'life', 'love', 'death', 'war', 'world',
      'children', 'family', 'school', 'friends', 'home', 'house', 'money',
      'self', 'help', 'book', 'books', 'reading', 'reader', 'readers',
      'young', 'adult', 'new', 'old', 'good', 'bad', 'best', 'first', 'last',
      'economic', 'financial', 'investment', 'investor', 'market', 'stock',
      'axioms', 'axiom', 'speculation', 'speculative', 'wealth', 'rich',
      'zurich', 'swiss', 'switzerland'
    ]);
    
    const w = removeAccents(word.toLowerCase().trim());
    return englishWords.has(w) || 
           /^[a-z]+ing$/.test(w) || // palavras terminando em -ing
           /^[a-z]+tion$/.test(w) || // palavras terminando em -tion
           /^[a-z]+ness$/.test(w); // palavras terminando em -ness
  };

  // Função para normalizar tag (sem acento, singular, minúsculo)
  const normalizeTag = (tag: string): string => {
    let normalized = removeAccents(tag.toLowerCase().trim());
    
    // Converter cada palavra para singular
    const words = normalized.split(/\s+/);
    normalized = words.map(toSingular).join(' ');
    
    // Limpar espaços extras
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
  };

  // Função para extrair raiz de uma palavra (stemming simplificado)
  const getStemPt = (word: string): string => {
    let stem = removeAccents(word.toLowerCase().trim());
    stem = toSingular(stem);
    
    // Remover sufixos comuns em português
    const suffixes = ['cao', 'dade', 'mente', 'ismo', 'ista', 'avel', 'ivel', 'oso', 'eiro', 'ado', 'ido'];
    
    for (const suffix of suffixes) {
      if (stem.length > suffix.length + 3 && stem.endsWith(suffix)) {
        stem = stem.slice(0, -suffix.length);
        break;
      }
    }
    
    return stem;
  };

  // Função para remover tags duplicadas ou muito similares
  const removeSimilarTags = (tags: string[]): string[] => {
    // Grupos de palavras relacionadas (sinônimos/variações) - tudo singular, sem acento
    const synonymGroups: string[][] = [
      ['familia', 'familiar', 'parental', 'pai', 'filho', 'relacao familiar', 'vida familiar'],
      ['escola', 'escolar', 'ensino', 'estudante', 'historia escolar'],
      ['diario'],
      ['amigo', 'amizade'],
      ['crianca', 'infantil', 'infancia'],
      ['jovem', 'juvenil', 'juventude', 'adolescente'],
      ['humor', 'humoristico', 'comedia', 'comico', 'engracado', 'historia humoristica'],
      ['historia', 'historico'],
      ['romance', 'romantico', 'amor', 'amoroso'],
      ['aventura', 'aventureiro'],
      ['misterio', 'misterioso'],
      ['fantasia', 'fantastico', 'magico', 'magia'],
      ['terror', 'horror', 'assustador', 'medo'],
      ['suspense', 'thriller', 'tensao'],
      ['biografia', 'biografico', 'autobiografia', 'memoria'],
      ['ciencia', 'cientifico']
    ];
    
    // Palavras a remover completamente (muito genéricas, redundantes ou idioma)
    const stopTags = new Set([
      'ficcao', 'fiction', 'stories', 'story', 'literatura', 'livro', 'book',
      'portugues', 'portuguesa', 'ingles', 'english', 'espanhol', 'spanish',
      'brasil', 'brasileiro', 'brasileira', 'brazil', 'brazilian'
    ]);
    
    // Limpar tag: remover ficção, normalizar, converter para singular, sem acento
    const cleanTag = (t: string): string => {
      let clean = removeAccents(t.toLowerCase().trim());
      // Remover "ficcao", "fiction", "stories"
      clean = clean.replace(/\s*ficc?ao\s*/gi, ' ');
      clean = clean.replace(/\s*fiction\s*/gi, ' ');
      clean = clean.replace(/\s*stories?\s*/gi, ' ');
      clean = clean.replace(/\s+/g, ' ').trim();
      // Converter para singular
      clean = clean.split(' ').map(toSingular).join(' ');
      return clean;
    };
    
    // Encontrar grupo de sinônimos de uma tag
    const findSynonymGroup = (tag: string): number => {
      const normTag = normalizeTag(tag);
      const words = normTag.split(' ');
      
      for (let i = 0; i < synonymGroups.length; i++) {
        for (const syn of synonymGroups[i]) {
          if (normTag.includes(syn) || words.some(w => getStemPt(w) === getStemPt(syn))) {
            return i;
          }
        }
      }
      return -1;
    };
    
    // Verificar se duas tags são similares
    const areSimilar = (tag1: string, tag2: string): boolean => {
      const norm1 = cleanTag(tag1);
      const norm2 = cleanTag(tag2);
      
      // Iguais após limpeza
      if (norm1 === norm2) return true;
      
      // Uma contém a outra
      if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
      
      // Mesma raiz
      const stem1 = getStemPt(norm1.replace(/\s/g, ''));
      const stem2 = getStemPt(norm2.replace(/\s/g, ''));
      if (stem1.length > 3 && stem1 === stem2) return true;
      
      // Mesmo grupo de sinônimos
      const group1 = findSynonymGroup(tag1);
      const group2 = findSynonymGroup(tag2);
      if (group1 !== -1 && group1 === group2) return true;
      
      return false;
    };
    
    const result: string[] = [];
    const usedGroups = new Set<number>();
    
    // Filtrar: limpar, converter para singular, remover acentos, filtrar inglês e stop tags
    const filtered = tags
      .map(t => cleanTag(t))
      .filter(t => {
        if (t.length < 3) return false;
        // Verificar se é uma palavra/frase em inglês
        const words = t.split(' ');
        if (words.some(w => isEnglishWord(w))) return false;
        // Verificar se é uma stop tag
        if (stopTags.has(t) || words.some(w => stopTags.has(w))) return false;
        return true;
      });
    
    // Remover duplicatas e ordenar por tamanho (mais curtas primeiro)
    const sorted = [...new Set(filtered)].sort((a, b) => a.length - b.length);
    
    for (const tag of sorted) {
      const synGroup = findSynonymGroup(tag);
      
      // Se já usamos esse grupo de sinônimos, pular
      if (synGroup !== -1 && usedGroups.has(synGroup)) continue;
      
      // Verificar se é similar a alguma já adicionada
      let isDuplicate = false;
      for (const existing of result) {
        if (areSimilar(tag, existing)) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        result.push(tag);
        if (synGroup !== -1) usedGroups.add(synGroup);
      }
    }
    
    return result;
  };

  // Aliases para compatibilidade
  const translateTag = translateTagSync;
  const translateTags = (tags: string[]): string[] => {
    const translated = tags.map(translateTagSync).filter(t => t.length > 0);
    return removeSimilarTags(translated);
  };

  // Função para gerar tags automáticas baseadas no conteúdo do livro
  // Foco em itens realmente relevantes para categorização e busca
  const generateAutoTags = (bookData: {
    title?: string;
    subtitle?: string;
    category?: string;
    description?: string;
    language?: string;
    target_audience?: string;
  }): string[] => {
    const tags: Set<string> = new Set();
    
    // 1. CATEGORIA/ASSUNTO - Principal fonte de tags
    if (bookData.category) {
      // Dividir categoria composta (ex: "Ficção / Romance")
      bookData.category.split(/[\/,;]/).forEach(cat => {
        const tag = cat.trim().toLowerCase();
        if (tag.length > 2 && tag.length < 30) tags.add(tag);
      });
    }
    
    // 2. PÚBLICO-ALVO - Importante para filtros
    if (bookData.target_audience) {
      const audience = bookData.target_audience.toLowerCase();
      if (audience.includes('infantil')) tags.add('infantil');
      if (audience.includes('juvenil')) tags.add('juvenil');
      if (audience.includes('adulto')) tags.add('adulto');
      if (audience.includes('didático') || audience.includes('didatico')) tags.add('didático');
      if (audience.includes('acadêmico') || audience.includes('academico')) tags.add('acadêmico');
    }
    
    // 3. PALAVRAS-CHAVE DO TÍTULO - Apenas substantivos relevantes
    if (bookData.title) {
      const stopWords = [
        'sobre', 'entre', 'para', 'como', 'todos', 'todas', 'livro', 'edicao', 'volume',
        'uma', 'uns', 'umas', 'the', 'and', 'with', 'from', 'that', 'this', 'have',
        'novo', 'nova', 'grande', 'pequeno', 'primeiro', 'segundo', 'terceiro',
        'parte', 'capitulo', 'serie', 'colecao', 'especial', 'completo', 'completa'
      ];
      
      const titleWords = bookData.title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos para comparação
        .replace(/[^\w\s]/g, '') // Remove pontuação
        .split(/\s+/)
        .filter(word => word.length > 4 && word.length < 20 && !stopWords.includes(word));
      
      // Adicionar apenas palavras muito significativas (máx 2)
      titleWords.slice(0, 2).forEach(word => {
        tags.add(word);
      });
    }
    
    // 5. PALAVRAS-CHAVE DA DESCRIÇÃO - Gêneros e temas literários
    if (bookData.description) {
      const desc = bookData.description.toLowerCase();
      
      // Gêneros literários
      const generos = [
        'romance', 'conto', 'contos', 'novela', 'crônica', 'crônicas', 'poesia', 'poemas',
        'ficção', 'não-ficção', 'ensaio', 'ensaios', 'antologia'
      ];
      
      // Temas/Atmosfera
      const temas = [
        'aventura', 'suspense', 'terror', 'horror', 'mistério', 'thriller',
        'fantasia', 'ficção científica', 'distopia', 'utopia',
        'drama', 'comédia', 'humor', 'sátira', 'tragédia',
        'amor', 'paixão', 'amizade', 'família', 'guerra', 'morte'
      ];
      
      // Áreas do conhecimento
      const areas = [
        'biografia', 'autobiografia', 'memórias', 'história', 'histórico',
        'filosofia', 'psicologia', 'sociologia', 'antropologia', 'política',
        'economia', 'negócios', 'empreendedorismo', 'liderança', 'gestão',
        'autoajuda', 'desenvolvimento pessoal', 'motivacional',
        'ciência', 'tecnologia', 'matemática', 'física', 'química', 'biologia',
        'medicina', 'saúde', 'nutrição', 'esporte', 'fitness',
        'arte', 'música', 'cinema', 'teatro', 'fotografia', 'design',
        'religião', 'espiritualidade', 'meditação', 'mindfulness',
        'educação', 'pedagogia', 'didático', 'infantil', 'juvenil',
        'culinária', 'gastronomia', 'viagem', 'turismo', 'natureza', 'ecologia'
      ];
      
      [...generos, ...temas, ...areas].forEach(keyword => {
        if (desc.includes(keyword)) tags.add(keyword);
      });
    }
    
    return Array.from(tags).slice(0, 15); // Máximo 15 tags
  };

  // Função para gerar código para obras sem ISBN (SI + número sequencial)
  const generateNoIsbnCode = async (): Promise<string> => {
    try {
      // Buscar o último código SI usado
      const { data, error } = await supabase
        .from('books')
        .select('isbn')
        .like('isbn', 'SI%')
        .order('isbn', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastCode = data[0].isbn;
        const lastNumber = parseInt(lastCode.replace('SI', ''), 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      // Formatar com zeros à esquerda (SI0001, SI0002, etc.)
      return `SI${nextNumber.toString().padStart(4, '0')}`;
    } catch (e) {
      console.error('Erro ao gerar código SI:', e);
      // Fallback: usar timestamp
      return `SI${Date.now().toString().slice(-6)}`;
    }
  };

  // Função para buscar capa via Open Library Covers API (por título/autor quando ISBN não tem capa)
  const fetchOpenLibraryCoverBySearch = async (title: string, author: string): Promise<string> => {
    if (!title) return "";
    try {
      // Buscar obra pelo título no Open Library
      const searchQuery = encodeURIComponent(`${title} ${author}`.trim());
      const response = await fetch(`https://openlibrary.org/search.json?q=${searchQuery}&limit=1`);
      if (response.ok) {
        const data = await response.json();
        if (data.docs && data.docs[0]) {
          const doc = data.docs[0];
          // Se tem cover_i, podemos construir a URL da capa (mais confiável)
          if (doc.cover_i) {
            const coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
            // Validar mesmo com cover_i (pode ser placeholder)
            if (await isValidOpenLibraryCover(coverUrl)) {
              return coverUrl;
            }
          }
          // Se tem ISBN, tentar pela capa do ISBN
          if (doc.isbn && doc.isbn[0]) {
            const coverUrl = `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`;
            // Verificar se a capa existe (não é placeholder)
            if (await isValidOpenLibraryCover(coverUrl)) {
              return coverUrl;
            }
          }
        }
      }
    } catch (e) {
      console.log("Não encontrou capa alternativa");
    }
    return "";
  };

  // Função para buscar múltiplas opções de capas para o usuário escolher
  const searchCoverOptions = async (title: string, author: string, isbn: string): Promise<{ url: string; source: string }[]> => {
    const covers: { url: string; source: string }[] = [];
    const seenUrls = new Set<string>();
    
    const addCover = (url: string, source: string) => {
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        covers.push({ url, source });
      }
    };
    
    const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
    const alternativeIsbn = convertISBN(cleanIsbn);
    
    try {
      // 1. Buscar no Open Library por ISBN (várias variações)
      if (cleanIsbn) {
        // ISBN original - tamanhos L e M
        addCover(`https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`, "Open Library");
        if (alternativeIsbn) {
          addCover(`https://covers.openlibrary.org/b/isbn/${alternativeIsbn}-L.jpg`, "Open Library (Alt)");
        }
      }
      
      // 2. Buscar no Google Books
      if (cleanIsbn) {
        try {
          const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
          if (googleResponse.ok) {
            const googleData = await googleResponse.json();
            if (googleData.items && googleData.items.length > 0) {
              for (const item of googleData.items.slice(0, 3)) {
                const imageLinks = item.volumeInfo?.imageLinks;
                if (imageLinks?.thumbnail) {
                  // Melhorar qualidade da imagem do Google Books
                  const betterUrl = imageLinks.thumbnail
                    .replace('http://', 'https://')
                    .replace('zoom=1', 'zoom=2')
                    .replace('&edge=curl', '');
                  addCover(betterUrl, "Google Books");
                }
                if (imageLinks?.smallThumbnail) {
                  addCover(imageLinks.smallThumbnail.replace('http://', 'https://'), "Google Books (mini)");
                }
              }
            }
          }
        } catch (e) {
          console.log("Erro ao buscar no Google Books:", e);
        }
      }
      
      // 3. Buscar no Open Library por título/autor
      if (title) {
        try {
          const searchQuery = encodeURIComponent(`${title} ${author}`.trim());
          const response = await fetch(`https://openlibrary.org/search.json?q=${searchQuery}&limit=5`);
          if (response.ok) {
            const data = await response.json();
            if (data.docs) {
              for (const doc of data.docs.slice(0, 5)) {
                // Por cover_i (ID de capa)
                if (doc.cover_i) {
                  addCover(`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`, `Open Library: ${doc.title?.substring(0, 30) || 'Resultado'}`);
                }
                // Por ISBN do resultado
                if (doc.isbn && doc.isbn[0]) {
                  addCover(`https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`, `Open Library ISBN: ${doc.isbn[0]}`);
                }
              }
            }
          }
        } catch (e) {
          console.log("Erro ao buscar por título no Open Library:", e);
        }
      }
      
      // 4. Buscar no Google Books por título/autor
      if (title) {
        try {
          const searchQuery = encodeURIComponent(`${title} ${author}`.trim());
          const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=5`);
          if (googleResponse.ok) {
            const googleData = await googleResponse.json();
            if (googleData.items) {
              for (const item of googleData.items.slice(0, 5)) {
                const imageLinks = item.volumeInfo?.imageLinks;
                if (imageLinks?.thumbnail) {
                  const betterUrl = imageLinks.thumbnail
                    .replace('http://', 'https://')
                    .replace('zoom=1', 'zoom=2')
                    .replace('&edge=curl', '');
                  addCover(betterUrl, `Google: ${item.volumeInfo?.title?.substring(0, 30) || 'Resultado'}`);
                }
              }
            }
          }
        } catch (e) {
          console.log("Erro ao buscar por título no Google Books:", e);
        }
      }
      
    } catch (e) {
      console.error("Erro geral ao buscar capas:", e);
    }
    
    // Filtrar capas válidas (verificar se a imagem carrega)
    const validCovers: { url: string; source: string }[] = [];
    
    for (const cover of covers) {
      try {
        // Verificar se a imagem existe e não é um placeholder
        const isValid = await new Promise<boolean>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            // Open Library retorna uma imagem 1x1 como placeholder
            if (img.width > 10 && img.height > 10) {
              resolve(true);
            } else {
              resolve(false);
            }
          };
          img.onerror = () => resolve(false);
          // Timeout de 5 segundos
          setTimeout(() => resolve(false), 5000);
          img.src = cover.url;
        });
        
        if (isValid) {
          validCovers.push(cover);
          // Limitar a 6 capas válidas
          if (validCovers.length >= 6) break;
        }
      } catch {
        // Ignorar erros de validação
      }
    }
    
    return validCovers;
  };

  // Handler para buscar opções de capas
  const handleSearchCovers = async () => {
    const title = formData.title;
    const author = formData.author;
    const isbn = formData.isbn;
    
    if (!title && !isbn) {
      toast({ 
        title: "Dados insuficientes", 
        description: "Preencha pelo menos o título ou ISBN para buscar capas.", 
        variant: "destructive" 
      });
      return;
    }
    
    setSearchingCovers(true);
    setCoverOptions([]);
    setShowCoverOptions(true);
    
    try {
      const options = await searchCoverOptions(title, author, isbn);
      setCoverOptions(options);
      
      if (options.length === 0) {
        toast({ 
          title: "Nenhuma capa encontrada", 
          description: "Tente usar o modo URL ou Upload para adicionar uma capa manualmente.",
          variant: "default"
        });
      } else {
        toast({
          title: `${options.length} capa${options.length > 1 ? 's' : ''} encontrada${options.length > 1 ? 's' : ''}!`,
          description: "Clique em uma imagem para selecioná-la.",
        });
      }
    } catch (e) {
      console.error("Erro ao buscar capas:", e);
      toast({ title: "Erro ao buscar capas", variant: "destructive" });
    } finally {
      setSearchingCovers(false);
    }
  };

  // Handler para selecionar uma capa das opções
  const handleSelectCoverOption = (url: string) => {
    setFormData({ ...formData, cover_url: url });
    setCoverPreview(url);
    setShowCoverOptions(false);
    toast({ title: "Capa selecionada!", description: "A capa foi aplicada ao livro." });
  };

  // Handler para buscar opções de capas no modo mobile
  const handleMobileSearchCovers = async () => {
    const title = mobileFormData.title;
    const author = mobileFormData.author;
    const isbn = mobileFormData.isbn;
    
    if (!title && !isbn) {
      toast({ 
        title: "Dados insuficientes", 
        description: "Preencha pelo menos o título ou ISBN para buscar capas.", 
        variant: "destructive" 
      });
      return;
    }
    
    setMobileSearchingCovers(true);
    setMobileCoverOptions([]);
    setShowMobileCoverOptions(true);
    
    try {
      const options = await searchCoverOptions(title, author, isbn);
      setMobileCoverOptions(options);
      
      if (options.length === 0) {
        toast({ 
          title: "Nenhuma capa encontrada", 
          description: "Tente tirar uma foto ou usar a galeria.",
          variant: "default"
        });
        setShowMobileCoverOptions(false);
      } else {
        toast({
          title: `${options.length} capa${options.length > 1 ? 's' : ''} encontrada${options.length > 1 ? 's' : ''}!`,
          description: "Selecione uma opção.",
        });
      }
    } catch (e) {
      console.error("Erro ao buscar capas:", e);
      toast({ title: "Erro ao buscar capas", variant: "destructive" });
    } finally {
      setMobileSearchingCovers(false);
    }
  };

  // Handler para selecionar uma capa das opções no modo mobile
  const handleMobileSelectCoverOption = (url: string) => {
    setMobileFormData({ ...mobileFormData, cover_url: url });
    setShowMobileCoverOptions(false);
    toast({ title: "Capa selecionada!", description: "A capa foi aplicada ao livro." });
  };

  // Função para buscar dados via ISBN convertido (ISBN-10 <-> ISBN-13)
  const convertISBN = (isbn: string): string => {
    const clean = isbn.replace(/[^0-9X]/gi, '');
    if (clean.length === 13 && clean.startsWith('978')) {
      // Converter ISBN-13 para ISBN-10
      const isbn10base = clean.substring(3, 12);
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(isbn10base[i]) * (10 - i);
      }
      const check = (11 - (sum % 11)) % 11;
      return isbn10base + (check === 10 ? 'X' : check.toString());
    } else if (clean.length === 10) {
      // Converter ISBN-10 para ISBN-13
      const isbn13base = '978' + clean.substring(0, 9);
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(isbn13base[i]) * (i % 2 === 0 ? 1 : 3);
      }
      const check = (10 - (sum % 10)) % 10;
      return isbn13base + check.toString();
    }
    return "";
  };

  // Função para buscar dados completos do livro no Open Library
  const fetchOpenLibraryData = async (isbn: string): Promise<OpenLibraryData> => {
    const result: OpenLibraryData = {
      cover: "",
      title: "",
      subtitle: "",
      author: "",
      publisher: "",
      publication_date: "",
      description: "",
      page_count: "",
      language: "",
      category: "",
      subjects: []
    };
    
    // 1. Verificar se a capa existe (não é placeholder GIF do Open Library)
    const openLibraryCover = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    try {
      if (await isValidOpenLibraryCover(openLibraryCover)) {
        result.cover = openLibraryCover;
      }
    } catch (e) {
      // Ignorar erro de capa
    }
    
    // 2. Buscar dados via API do Open Library
    try {
      const response = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
      if (response.ok) {
        const data = await response.json();
        
        // Título
        if (data.title) {
          result.title = data.title;
        }
        
        // Subtítulo
        if (data.subtitle) {
          result.subtitle = data.subtitle;
        }
        
        // Editora
        if (data.publishers && data.publishers.length > 0) {
          result.publisher = data.publishers[0];
        }
        
        // Data de publicação
        if (data.publish_date) {
          result.publication_date = data.publish_date;
        }
        
        // Número de páginas
        if (data.number_of_pages) {
          result.page_count = String(data.number_of_pages);
        }
        
        // Idioma (converter código para formato legível)
        if (data.languages && data.languages.length > 0) {
          const langKey = data.languages[0].key; // ex: "/languages/por"
          const langCode = langKey?.split('/').pop();
          const langMap: Record<string, string> = {
            'por': 'pt-BR', 'eng': 'en', 'spa': 'es', 'fre': 'fr', 'ger': 'de',
            'ita': 'it', 'jpn': 'ja', 'chi': 'zh', 'kor': 'ko', 'rus': 'ru'
          };
          result.language = langMap[langCode || ''] || langCode || '';
        }
        
        // Descrição
        if (data.description) {
          if (typeof data.description === 'string') {
            result.description = data.description;
          } else if (data.description.value) {
            result.description = data.description.value;
          }
        }
        
        // Buscar autores (precisam de requisição separada)
        if (data.authors && data.authors.length > 0) {
          try {
            const authorPromises = data.authors.slice(0, 3).map(async (author: any) => {
              if (author.key) {
                try {
                  const authorResponse = await fetch(`https://openlibrary.org${author.key}.json`);
                  if (authorResponse.ok) {
                    const authorData = await authorResponse.json();
                    const authorName = authorData.name || authorData.personal_name || '';
                    // Filtrar nomes claramente inválidos
                    if (authorName && 
                        authorName.length > 1 &&
                        !authorName.toUpperCase().includes('NOT IDENTIFIED') && 
                        !authorName.toUpperCase().includes('INVALID') &&
                        !authorName.toUpperCase().includes('UNKNOWN')) {
                      return authorName;
                    }
                  }
                } catch (e) {
                  // Ignorar erro individual de autor
                }
              }
              return '';
            });
            const authors = await Promise.all(authorPromises);
            const validAuthors = authors.filter(Boolean);
            if (validAuthors.length > 0) {
              result.author = validAuthors.join(', ');
            }
          } catch (e) {
            // Ignorar erro de autores
          }
        }
        
        // FALLBACK: Se não encontrou autor nas edições, buscar na obra (work)
        if (!result.author && data.works && data.works[0]?.key) {
          try {
            const workResponse = await fetch(`https://openlibrary.org${data.works[0].key}.json`);
            if (workResponse.ok) {
              const workData = await workResponse.json();
              if (workData.authors && workData.authors.length > 0) {
                const workAuthorPromises = workData.authors.slice(0, 3).map(async (author: any) => {
                  if (author.author?.key) {
                    try {
                      const authorResponse = await fetch(`https://openlibrary.org${author.author.key}.json`);
                      if (authorResponse.ok) {
                        const authorData = await authorResponse.json();
                        return authorData.name || authorData.personal_name || '';
                      }
                    } catch (e) {}
                  }
                  return '';
                });
                const workAuthors = await Promise.all(workAuthorPromises);
                const validWorkAuthors = workAuthors.filter(Boolean);
                if (validWorkAuthors.length > 0) {
                  result.author = validWorkAuthors.join(', ');
                }
              }
            }
          } catch (e) {
            // Ignorar erro
          }
        }
        
        // Buscar dados adicionais da obra (work) - descrição e assuntos
        if (data.works && data.works[0]?.key) {
          try {
            const workResponse = await fetch(`https://openlibrary.org${data.works[0].key}.json`);
            if (workResponse.ok) {
              const workData = await workResponse.json();
              
              // Descrição da obra (se não tiver na edição)
              if (!result.description && workData.description) {
                if (typeof workData.description === 'string') {
                  result.description = workData.description;
                } else if (workData.description.value) {
                  result.description = workData.description.value;
                }
              }
              
              // Assuntos/Categorias
              if (workData.subjects && workData.subjects.length > 0) {
                // Pegar o primeiro assunto como categoria principal
                const subject = workData.subjects[0];
                result.category = translateCategory(subject);
                
                // Extrair todos os subjects como tags (máximo 15)
                result.subjects = workData.subjects
                  .slice(0, 15)
                  .map((s: string) => s.toLowerCase().trim())
                  .filter((s: string) => s.length > 2 && s.length < 50);
                
                console.log("📚 Open Library subjects:", result.subjects);
              }
            }
          } catch (e) {
            // Ignorar erro
          }
        }
      }
    } catch (e) {
      // Ignorar erro de API
    }
    
    return result;
  };

  const handleSearchISBN = async () => {
    if (!formData.isbn) return toast({ title: "Digite um ISBN", variant: "destructive" });
    
    setSearchingISBN(true);
    const cleanIsbn = formData.isbn.replace(/[^0-9X]/gi, '');
    const alternativeIsbn = convertISBN(cleanIsbn);
    
    // Detectar se é ISBN brasileiro (prefixos 978-85, 978-65, 85, 65)
    const isBrazilianISBN = cleanIsbn.startsWith('97885') || 
                           cleanIsbn.startsWith('97865') || 
                           cleanIsbn.startsWith('85') || 
                           cleanIsbn.startsWith('65');

    try {
      // ESTRATÉGIA DE BUSCA INTELIGENTE:
      // - Para ISBNs BRASILEIROS: CBL primeiro (dados oficiais padronizados)
      // - Para ISBNs INTERNACIONAIS: Google Books + Open Library primeiro
      // - Complementar com outras fontes para dados faltantes (capa, descrição)
      
      console.log(`🔍 Buscando ISBN: ${cleanIsbn} ${isBrazilianISBN ? '(BR detectado)' : '(Internacional)'}`);
      
      let externalData: ExternalBookData | null = null;
      let sourcesUsed: string[] = [];
      let cblData: ExternalBookData | null = null;
      
      // FASE 1: Se for ISBN brasileiro, buscar na CBL PRIMEIRO (dados oficiais)
      if (isBrazilianISBN) {
        console.log("🇧🇷 ISBN brasileiro detectado - consultando CBL primeiro...");
        cblData = await fetchCBLData(cleanIsbn);
        if (cblData && cblData.title) {
          console.log("✅ Encontrado na CBL (fonte oficial BR)");
          sourcesUsed.push("CBL (Oficial)");
          externalData = cblData;
        }
      }
      
      // FASE 2: Buscar dados complementares do Google Books e Open Library
      const [googleResponse, openLibraryData] = await Promise.all([
        fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`),
        fetchOpenLibraryData(cleanIsbn)
      ]);
      
      let data = await googleResponse.json();
      let hasGoogleData = data.totalItems > 0;
      let info = hasGoogleData ? data.items[0].volumeInfo : null;
      
      if (hasGoogleData && !sourcesUsed.includes("CBL (Oficial)")) {
        sourcesUsed.push("Google Books");
      }
      if ((openLibraryData.title || openLibraryData.author) && !sourcesUsed.includes("CBL (Oficial)")) {
        sourcesUsed.push("Open Library");
      }
      
      // FASE 3: Se ainda não tem dados, tentar fontes alternativas
      if (!externalData && !hasGoogleData && !openLibraryData.title) {
        console.log("📚 Fontes principais não encontraram, tentando alternativas...");
        
        // 1. Tentar Brapci (API brasileira gratuita)
        externalData = await fetchBrapciData(cleanIsbn);
        if (externalData) {
          console.log("✅ Encontrado na Brapci (BR)");
          sourcesUsed.push("Brapci");
        }
        
        // 2. Se Brapci falhou, tentar OpenBD
        if (!externalData) {
          console.log("🇯🇵 Consultando OpenBD...");
          externalData = await fetchOpenBDData(cleanIsbn);
          if (externalData) {
            console.log("✅ Encontrado no OpenBD");
            sourcesUsed.push("OpenBD");
          }
        }
        
        // 3. Se ainda não encontrou, tentar com ISBN convertido (ISBN-10 <-> ISBN-13)
        if (!externalData && alternativeIsbn) {
          console.log(`🔄 Tentando ISBN alternativo: ${alternativeIsbn}`);
          
          // Tentar Open Library com ISBN alternativo (mais confiável)
          const altOpenLibrary = await fetchOpenLibraryData(alternativeIsbn);
          if (altOpenLibrary.title || altOpenLibrary.author) {
            Object.assign(openLibraryData, altOpenLibrary);
            sourcesUsed.push("Open Library (ISBN alt)");
            console.log("✅ Encontrado com ISBN alternativo no Open Library");
          } else {
            // Tentar Google Books com ISBN alternativo
            try {
              const altResponse = await fetchWithTimeout(
                `https://www.googleapis.com/books/v1/volumes?q=isbn:${alternativeIsbn}`,
                {},
                5000
              );
              const altData = await altResponse.json();
              if (altData.totalItems > 0) {
                data = altData;
                hasGoogleData = true;
                info = altData.items[0].volumeInfo;
                sourcesUsed.push("Google Books (ISBN alt)");
                console.log("✅ Encontrado com ISBN alternativo no Google Books");
              }
            } catch (e) {
              console.log("Google Books (ISBN alt) falhou");
            }
          }
        }
        
        // 4. WorldCat (pode ser lento)
        if (!externalData && !hasGoogleData && !openLibraryData.title) {
          externalData = await fetchWorldCatData(cleanIsbn);
          if (externalData) {
            console.log("✅ Encontrado no WorldCat");
            sourcesUsed.push("WorldCat");
          }
        }
        
        // 5. CBL como fallback final (se ainda não foi consultada na fase 1)
        if (!externalData && !hasGoogleData && !openLibraryData.title && !cblData) {
          externalData = await fetchCBLData(cleanIsbn);
          if (externalData) {
            console.log("✅ Encontrado na CBL (fonte oficial BR)");
            sourcesUsed.push("CBL (Oficial)");
          }
        }
      }
      
      const googleCategory = info ? translateCategory(info.categories ? info.categories[0] : "") : "";
      
      // Verificar se temos dados da CBL (fonte oficial brasileira - prioridade máxima para dados básicos)
      const hasCBLData = cblData && cblData.title;
      
      // Função auxiliar para pegar o melhor valor
      // Se tiver dados da CBL, eles têm PRIORIDADE para título, autor, editora (dados oficiais padronizados)
      const getBest = (googleValue: any, openLibraryValue: string, externalValue?: string): string => {
        if (googleValue && String(googleValue).trim()) {
          return String(googleValue);
        }
        if (openLibraryValue && openLibraryValue.trim()) {
          return openLibraryValue;
        }
        if (externalValue && externalValue.trim()) {
          return externalValue;
        }
        return "";
      };
      
      // Função especial para campos que a CBL tem prioridade (dados oficiais BR)
      const getBestWithCBLPriority = (cblValue: string | undefined, googleValue: any, openLibraryValue: string, externalValue?: string): string => {
        // Se temos dados da CBL e o valor existe, usar CBL (dados oficiais padronizados)
        if (hasCBLData && cblValue && cblValue.trim()) {
          return cblValue;
        }
        return getBest(googleValue, openLibraryValue, externalValue);
      };
      
      // Determinar os melhores valores de cada campo
      // Para ISBN brasileiro: CBL tem prioridade em título, autor, editora, assunto
      // Título, subtítulo e autor em CAIXA ALTA
      const bestTitle = getBestWithCBLPriority(cblData?.title, info?.title, openLibraryData.title, externalData?.title).toUpperCase();
      const bestSubtitle = getBestWithCBLPriority(cblData?.subtitle, info?.subtitle, openLibraryData.subtitle, externalData?.subtitle).toUpperCase();
      const bestAuthor = getBestWithCBLPriority(cblData?.author, info?.authors?.join(", "), openLibraryData.author, externalData?.author).toUpperCase();
      const bestPublisher = getBestWithCBLPriority(cblData?.publisher, info?.publisher, openLibraryData.publisher, externalData?.publisher);
      const bestPublicationDate = getBestWithCBLPriority(cblData?.publication_date, info?.publishedDate, openLibraryData.publication_date, externalData?.publication_date);
      const bestPageCount = getBestWithCBLPriority(cblData?.page_count, info?.pageCount, openLibraryData.page_count, externalData?.page_count);
      const bestLanguage = getBestWithCBLPriority(cblData?.language, info?.language, openLibraryData.language, externalData?.language) || "pt-BR";
      
      // Campos extras da CBL
      const bestEdition = cblData?.edition || "";
      const bestFormat = cblData?.format || "";
      const bestTargetAudience = cblData?.target_audience || "";
      const bestCity = cblData?.city || "";
      const bestState = cblData?.state || "";
      const bestCountry = cblData?.country || "";
      
      // Traduzir categoria/assunto se necessário - CBL tem prioridade para assunto
      const rawCategory = getBestWithCBLPriority(cblData?.category, googleCategory, openLibraryData.category, externalData?.category);
      const bestCategory = await translateCategoryAsync(rawCategory);
      const categoryWasTranslated = rawCategory && bestCategory !== rawCategory;
      
      // Descrição/Sinopse - CBL tem prioridade
      let bestDescription = "";
      let descriptionWasTranslated = false;
      
      // Primeiro tentar sinopse da CBL
      if (cblData?.description && cblData.description.trim()) {
        bestDescription = cblData.description;
      } else if (info?.description) {
        bestDescription = sanitizeDescription(info.description);
      } else if (openLibraryData.description) {
        bestDescription = openLibraryData.description;
      } else if (externalData?.description) {
        bestDescription = externalData.description;
      }
      
      // Se a descrição estiver em inglês, traduzir para português
      if (bestDescription && isEnglishText(bestDescription)) {
        try {
          const translated = await translateToPortuguese(bestDescription);
          if (translated && translated !== bestDescription) {
            bestDescription = translated;
            descriptionWasTranslated = true;
          }
        } catch (e) {
          console.warn('Erro na tradução:', e);
        }
      }
      
      // Determinar a melhor URL de capa disponível
      let bestCoverUrl = "";
      if (openLibraryData.cover) {
        bestCoverUrl = openLibraryData.cover;
      } else if (info?.imageLinks?.thumbnail) {
        bestCoverUrl = info.imageLinks.thumbnail
          .replace('http://', 'https://')
          .replace('zoom=1', 'zoom=2');
      } else if (info?.imageLinks?.smallThumbnail) {
        bestCoverUrl = info.imageLinks.smallThumbnail.replace('http://', 'https://');
      } else if (externalData?.cover) {
        bestCoverUrl = externalData.cover;
      }
      
      // Se não encontrou capa mas tem título/autor, tentar buscar capa por pesquisa
      if (!bestCoverUrl && (bestTitle || bestAuthor)) {
        console.log("🖼️ Buscando capa alternativa por título/autor...");
        const altCover = await fetchOpenLibraryCoverBySearch(bestTitle, bestAuthor);
        if (altCover) {
          bestCoverUrl = altCover;
          console.log("✅ Capa encontrada via busca por título");
          sourcesUsed.push("Capa: Open Library Search");
        }
      }
        
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
      if (info?.country && countryMap[info.country]) {
          detectedCountry = countryMap[info.country];
        }
        // Tentar detectar pelo idioma (fallback)
      else if (bestLanguage) {
          const langMap: Record<string, string> = {
            "pt": "BRA - Brasil", "pt-BR": "BRA - Brasil", "pt-PT": "PRT - Portugal",
            "en": "USA - Estados Unidos", "en-US": "USA - Estados Unidos", "en-GB": "GBR - Reino Unido",
            "es": "ESP - Espanha", "es-ES": "ESP - Espanha", "es-MX": "MEX - México",
            "fr": "FRA - França", "de": "DEU - Alemanha", "it": "ITA - Itália",
            "ja": "JPN - Japão", "zh": "CHN - China", "ko": "KOR - Coreia do Sul"
          };
        if (langMap[bestLanguage]) {
          detectedCountry = langMap[bestLanguage];
        }
      }
      
      // Cutter não é gerado automaticamente - usuário deve inserir manualmente no diálogo de confirmação
      // const bestCutter = bestAuthor ? generateCutter(bestAuthor, bestTitle) : "";
      
      // Verificar se encontrou algum dado útil
      const hasAnyData = bestTitle || bestAuthor || bestCoverUrl || bestDescription || externalData;
      
      if (hasAnyData) {
        // Montar local de publicação da CBL (Cidade - UF - País)
        let publicationPlace = "";
        if (bestCity || bestState || bestCountry) {
          const parts = [bestCity, bestState, bestCountry].filter(Boolean);
          publicationPlace = parts.join(" - ");
        }
        
        // Se CBL tem país, usar para classificação
        if (bestCountry && !detectedCountry) {
          const countryMapFromCBL: Record<string, string> = {
            "Brasil": "BRA - Brasil",
            "Portugal": "PRT - Portugal",
            "Estados Unidos": "USA - Estados Unidos",
            "Argentina": "ARG - Argentina",
            "Espanha": "ESP - Espanha"
          };
          detectedCountry = countryMapFromCBL[bestCountry] || detectedCountry;
        }
        
        // Log dos campos extras da CBL para referência
        if (hasCBLData) {
          console.log("📚 Dados extras da CBL:", {
            edition: bestEdition,
            format: bestFormat,
            targetAudience: bestTargetAudience,
            publicationPlace,
            country: bestCountry
          });
        }
        
        // Gerar tags automáticas
        let allTags: string[] = [];
        
        // 1. Tags da CBL (PalavrasChave)
        if (cblData?.tags && cblData.tags.length > 0) {
          allTags = [...cblData.tags.map(t => t.toLowerCase())];
          console.log("🏷️ Tags da CBL:", cblData.tags);
        }
        
        // 2. Tags do Open Library (subjects) - traduzir para português (com API)
        if (openLibraryData.subjects && openLibraryData.subjects.length > 0) {
          const translatedSubjects = await translateTagsAsync(openLibraryData.subjects);
          translatedSubjects.forEach(t => {
            if (!allTags.includes(t)) {
              allTags.push(t);
            }
          });
          console.log("🏷️ Tags do Open Library (traduzidas):", translatedSubjects);
        }
        
        // 3. Tags de outras fontes externas
        if (externalData?.tags && externalData.tags.length > 0) {
          externalData.tags.forEach(t => {
            if (!allTags.includes(t.toLowerCase())) {
              allTags.push(t.toLowerCase());
            }
          });
        }
        
        // 4. Tags geradas automaticamente
        const autoTags = generateAutoTags({
          title: bestTitle,
          subtitle: bestSubtitle,
          author: bestAuthor,
          category: bestCategory,
          publisher: bestPublisher,
          description: bestDescription,
          language: bestLanguage,
          format: bestFormat,
          target_audience: bestTargetAudience
        });
        
        // Adicionar tags automáticas que não existem
        autoTags.forEach(t => {
          if (!allTags.includes(t)) {
            allTags.push(t);
          }
        });
        
        // Limitar a 15 tags e formatar
        const bestTags = allTags.slice(0, 15).join(', ');
        console.log("🏷️ Tags finais:", bestTags);
        
        setFormData(prev => ({
          ...prev,
          isbn: cleanIsbn, 
          title: bestTitle,
          subtitle: bestSubtitle,
          author: bestAuthor,
          publisher: bestPublisher,
          publication_date: bestPublicationDate,
          description: bestDescription,
          page_count: bestPageCount,
          category: bestCategory,
          language: bestLanguage,
          cover_url: bestCoverUrl,
          country_classification: detectedCountry,
          cutter: "", // Cutter não é preenchido automaticamente - usuário deve confirmar ou inserir manualmente
          // Campos extras da CBL
          edition: bestEdition || prev.edition,
          publication_place: publicationPlace || prev.publication_place,
          tags: bestTags || prev.tags,
        }));
        
        // Atualizar preview da capa
        if (bestCoverUrl) {
          setCoverPreview(bestCoverUrl);
          setCoverInputMode('url');
        }
        
        // Montar mensagem de feedback
        const usedOpenLibrary: string[] = [];
        if (!info?.title && openLibraryData.title) usedOpenLibrary.push("título");
        if (!info?.authors && openLibraryData.author) usedOpenLibrary.push("autor");
        if (!info?.publisher && openLibraryData.publisher) usedOpenLibrary.push("editora");
        if (!info?.publishedDate && openLibraryData.publication_date) usedOpenLibrary.push("ano");
        if (!info?.pageCount && openLibraryData.page_count) usedOpenLibrary.push("páginas");
        if (!sanitizeDescription(info?.description || "") && openLibraryData.description) usedOpenLibrary.push("descrição");
        if (!googleCategory && openLibraryData.category) usedOpenLibrary.push("assunto");
        if (openLibraryData.cover) usedOpenLibrary.push("capa");
        
        let desc = "Dados preenchidos.";
        
        // Mostrar fontes utilizadas
        if (sourcesUsed.length > 0) {
          desc += ` Fontes: ${sourcesUsed.join(", ")}.`;
        }
        
        // Mostrar campos extras da CBL quando encontrados
        if (hasCBLData) {
          const cblExtras: string[] = [];
          if (bestSubtitle) cblExtras.push("subtítulo");
          if (bestEdition) cblExtras.push(`edição ${bestEdition}`);
          if (bestFormat) cblExtras.push(bestFormat.toLowerCase());
          if (bestTargetAudience) cblExtras.push(`público: ${bestTargetAudience.toLowerCase()}`);
          if (publicationPlace) cblExtras.push(publicationPlace);
          if (cblExtras.length > 0) {
            desc += ` [CBL: ${cblExtras.join(", ")}]`;
          }
        }
        
        if (descriptionWasTranslated || categoryWasTranslated) {
          const translated: string[] = [];
          if (descriptionWasTranslated) translated.push("descrição");
          if (categoryWasTranslated) translated.push("assunto");
          desc += ` Traduzido: ${translated.join(", ")}.`;
        }
        if (usedOpenLibrary.length > 0 && !sourcesUsed.includes("Open Library")) {
          desc += ` Open Library: ${usedOpenLibrary.join(", ")}.`;
        }
        
        const exists = categoryStats.some(c => c.name === bestCategory);
        if (bestCategory && !exists) {
          desc += ` Novo assunto "${bestCategory}" será criado.`;
        }

        toast({ title: "Encontrado!", description: desc });
      } else {
        toast({ 
          title: "📚 ISBN não encontrado nas bases", 
          description: "Este livro não está cadastrado nas bases de dados gratuitas (Google Books, Open Library, Brapci, WorldCat). Preencha os dados manualmente abaixo.", 
          variant: "destructive",
          duration: 8000
        });
      }
    } catch (err) {
      toast({ title: "Erro na busca", variant: "destructive" });
    } finally {
      setSearchingISBN(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title) return toast({ title: "Título obrigatório", description: "Preencha o título do livro", variant: "destructive" });
    if (!formData.author) return toast({ title: "Autor(a) obrigatório(a)", description: "Preencha o nome do(a) autor(a) do livro", variant: "destructive" });
    
    // Validar Cutter - se vazio, abrir diálogo de confirmação (apenas para novas obras)
    if (!editingId) {
      const hasCutter = formData.cutter || desktopCutterValueRef.current;
      if (!hasCutter && !desktopCutterConfirmedRef.current) {
        setShowDesktopCutterDialog(true);
        setDesktopCutterDialogValue("");
        return;
      }
    }
    
    // Validar tombo dos exemplares - deve ter tombo manual ou automático marcado
    if (addToInventory && !editingId) {
      const invalidItem = inventoryItems.find(item => !item.tombo.trim() && !item.autoTombo);
      if (invalidItem) {
        toast({ 
          title: "Tombo obrigatório", 
          description: "Digite o número do tombo ou marque 'Auto' para gerar automaticamente", 
          variant: "destructive" 
        });
        return;
      }
    }
    
    const cleanIsbn = formData.isbn ? formData.isbn.replace(/[^0-9]/g, '') : "";
    setSaving(true);

    try {
      if (cleanIsbn && (!editingId || (editingId && cleanIsbn !== books.find(b => b.id === editingId)?.isbn))) {
        const { data: existing } = await (supabase as any)
          .from('books').select('id').eq('isbn', cleanIsbn).maybeSingle();
        if (existing) throw new Error("Este ISBN já está cadastrado.");
      }

      // Usa o Cutter do diálogo se foi preenchido (problema assíncrono do React)
      const finalCutter = formData.cutter || desktopCutterValueRef.current || null;
      
      const payload = {
        ...formData,
        isbn: cleanIsbn,
        cutter: finalCutter,
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

      // === CADASTRO RÁPIDO INTEGRADO: Criar exemplares no Acervo ===
      let copiesCreated = 0;
      const createdTombos: string[] = [];
      
      if (addToInventory && inventoryLibraryId && bookData?.id && !editingId && inventoryItems.length > 0) {
        // Buscar o próximo número de tombo automático (apenas se algum item for automático)
        let nextAutoNumber = 1;
        const hasAutoTombo = inventoryItems.some(item => item.autoTombo);
        
        if (hasAutoTombo) {
          const { data: copiesWithB } = await (supabase as any)
            .from('copies')
            .select('tombo')
            .eq('library_id', inventoryLibraryId)
            .like('tombo', 'B%');
          if (copiesWithB?.length) {
            for (const copy of copiesWithB) {
              const t = copy.tombo as string | undefined;
              if (!t || !/^B\d+$/i.test(t)) continue;
              const num = parseInt(t.slice(1), 10);
              if (!Number.isNaN(num) && num >= nextAutoNumber) {
                nextAutoNumber = num + 1;
              }
            }
          }
        }
        
        // Criar os exemplares
        for (const item of inventoryItems) {
          let tomboToUse: string;
          
          if (item.autoTombo) {
            tomboToUse = `B${nextAutoNumber}`;
            nextAutoNumber++;
          } else {
            tomboToUse = item.tombo.trim().toUpperCase();
            if (!tomboToUse) continue; // Pular se tombo manual estiver vazio
          }
          
          const copyPayload = {
            book_id: bookData.id,
            library_id: inventoryLibraryId,
            status: 'disponivel',
            code: cleanIsbn || null,
            tombo: tomboToUse,
            process_stamped: inventoryProcessing.stamped,
            process_indexed: inventoryProcessing.indexed,
            process_taped: inventoryProcessing.taped,
            local_categories: inventoryColors,
            origin: inventoryOrigin
          };
          
          const { error: copyError } = await (supabase as any)
            .from('copies')
            .insert(copyPayload);
          
          if (!copyError) {
            copiesCreated++;
            createdTombos.push(tomboToUse);
          }
        }
      }

      setIsModalOpen(false);

      if (copiesCreated > 0) {
        const libName = libraries.find(l => l.id === inventoryLibraryId)?.name || "biblioteca";
        const tombosStr = createdTombos.join(", ");
        setTimeout(() => {
          setSuccessDialog({
            open: true,
            title: "Obra salva + Acervo!",
            message: `${copiesCreated} exemplar(es) criado(s) em "${libName}".\n\nNº Tombo: ${tombosStr}`,
          });
        }, 300);
      } else {
        toast({ title: "✅ Sucesso", description: "Obra salva no Catálogo.", duration: 5000 });
      }
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
      country_classification: "", tags: ""
    });
    setNoIsbn(false);
    setCoverPreview('');
    setCoverInputMode('url');
    // Manter biblioteca selecionada e checkbox para cadastros em sequência
    // Resetar lista de exemplares (Auto DESMARCADO por padrão)
    setInventoryItems([{ id: 1, tombo: '', autoTombo: false }]);
    // Resetar processamento (todos marcados) e cores
    setInventoryProcessing({ stamped: true, indexed: true, taped: true });
    setInventoryColors([]);
    // Resetar estados de confirmação de Cutter (modo computador)
    setDesktopCutterDialogValue("");
    desktopCutterConfirmedRef.current = false;
    desktopCutterValueRef.current = "";
    // Focar no campo ISBN para próximo cadastro
    setTimeout(() => isbnInputRef.current?.focus(), 100);
  };

  // Função para fazer upload da imagem da capa para o Supabase Storage
  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({ 
        title: "Tipo inválido", 
        description: "Selecione uma imagem JPG, PNG, WebP ou GIF.", 
        variant: "destructive" 
      });
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: "Arquivo muito grande", 
        description: "O tamanho máximo é 5MB.", 
        variant: "destructive" 
      });
      return;
    }

    setUploadingCover(true);

    try {
      // Criar preview local imediatamente
      const localPreview = URL.createObjectURL(file);
      setCoverPreview(localPreview);

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `cover_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `book-covers/${fileName}`;

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('books')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // Se o bucket não existir, usar URL local como alternativa
        console.warn('Upload error:', error);
        
        // Converter para Base64 como fallback
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setFormData(prev => ({ ...prev, cover_url: base64 }));
          toast({ 
            title: "Imagem processada", 
            description: "Imagem salva localmente. Configure o Storage do Supabase para URLs permanentes." 
          });
        };
        reader.readAsDataURL(file);
        return;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('books')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, cover_url: publicUrl }));
      setCoverPreview(publicUrl);
      
      toast({ title: "Upload concluído!", description: "Capa adicionada com sucesso." });
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({ 
        title: "Erro no upload", 
        description: err.message || "Não foi possível fazer o upload.", 
        variant: "destructive" 
      });
    } finally {
      setUploadingCover(false);
    }
  };

  // Função para remover a capa
  const handleRemoveCover = () => {
    setFormData(prev => ({ ...prev, cover_url: '' }));
    setCoverPreview('');
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
      country_classification: book.country_classification || "", tags: book.tags || ""
    });
    // Verificar se é código SI (sem ISBN)
    setNoIsbn(book.isbn?.startsWith('SI') || false);
    // Definir preview da capa existente
    setCoverPreview(book.cover_url || '');
    setCoverInputMode('url');
    setIsModalOpen(true);
  };

  const handleViewDetails = async (book: any) => {
    setIsDetailsOpen(true);
    setSelectedBookDetails({ title: book.title, libraries: [], loading: true });

    const { data: copies } = await (supabase as any)
      .from('copies')
      .select('library_id, status, tombo, libraries(name)')
      .eq('book_id', book.id);

    const librariesMap = new Map();
    (copies || []).forEach((copy: any) => {
      const libName = copy.libraries?.name || "Desconhecida";
      const libId = copy.library_id;
      if (!librariesMap.has(libId)) {
        librariesMap.set(libId, { name: libName, total: 0, disponivel: 0, tombos: [], isMyLibrary: libId === user?.library_id });
      }
      const libData = librariesMap.get(libId);
      libData.total += 1;
      if (copy.status === 'disponivel') libData.disponivel += 1;
      if (copy.tombo) libData.tombos.push(copy.tombo);
    });

    const details = Array.from(librariesMap.values())
      .sort((a, b) => {
        if (a.isMyLibrary) return -1;
        if (b.isMyLibrary) return 1;
        return a.name.localeCompare(b.name);
      });
    setSelectedBookDetails({ title: book.title, libraries: details, loading: false });
  };

  const handleExport = () => {
    const exportData = books.map(book => ({
      "ID": book.id,
      "ISBN": book.isbn || "",
      "Título": book.title || "",
      "Subtítulo": book.subtitle || "",
      "Autor(a)": book.author || "",
      "Editora": book.publisher || "",
      "Ano Publicação": book.publication_date || "",
      "Páginas": book.page_count || "",
      "Idioma": book.language || "",
      "Assunto/Categoria": book.category || "",
      "Cutter": book.cutter || "",
      "Classificação País": book.country_classification || "",
      "Série": book.series || "",
      "Volume": book.volume || "",
      "Edição": book.edition || "",
      "Tradutor(a)": book.translator || "",
      "Local Publicação": book.publication_place || "",
      "Tags": book.tags || "",
      "Descrição": book.description || "",
      "URL Capa": book.cover_url || "",
      "Total Exemplares Rede": book.copies?.length || 0,
      "Disponíveis Rede": book.copies?.filter((c:any) => c.status === 'disponivel').length || 0,
      "Emprestados Rede": book.copies?.filter((c:any) => c.status === 'emprestado').length || 0,
      "Bibliotecas": [...new Set(book.copies?.map((c:any) => c.libraries?.name).filter(Boolean))].join(", ") || "",
      "Data Criação": book.created_at ? new Date(book.created_at).toLocaleString('pt-BR') : "",
      "Data Atualização": book.updated_at ? new Date(book.updated_at).toLocaleString('pt-BR') : ""
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Ajustar largura das colunas
    const colWidths = [
      { wch: 36 }, // ID
      { wch: 15 }, // ISBN
      { wch: 40 }, // Título
      { wch: 30 }, // Subtítulo
      { wch: 30 }, // Autor(a)
      { wch: 20 }, // Editora
      { wch: 12 }, // Ano
      { wch: 8 },  // Páginas
      { wch: 10 }, // Idioma
      { wch: 20 }, // Assunto
      { wch: 10 }, // Cutter
      { wch: 15 }, // País
      { wch: 20 }, // Série
      { wch: 8 },  // Volume
      { wch: 8 },  // Edição
      { wch: 25 }, // Tradutor(a)
      { wch: 20 }, // Local
      { wch: 40 }, // Tags
      { wch: 50 }, // Descrição
      { wch: 50 }, // URL Capa
      { wch: 12 }, // Total
      { wch: 12 }, // Disponíveis
      { wch: 12 }, // Emprestados
      { wch: 30 }, // Bibliotecas
      { wch: 18 }, // Data Criação
      { wch: 18 }, // Data Atualização
    ];
    ws['!cols'] = colWidths;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Catalogo_Completo");
    XLSX.writeFile(wb, `catalogo_completo_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Importação/exportação MARC removida
  const parseMARC = () => ({ records: [], errors: [], analysis: {} });

  // Estados para filtros por coluna
  const [filterISBN, setFilterISBN] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const [filterAuthor, setFilterAuthor] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCutter, setFilterCutter] = useState("");
  const [filterTags, setFilterTags] = useState("");

  const filteredBooks = books.filter(book => {
    // Filtro geral (busca em tudo incluindo tags)
    const bookTags = typeof book.tags === 'string' ? book.tags : '';
    const matchesGlobal = !searchTerm || 
      includesIgnoringAccents(book.title, searchTerm) ||
      includesIgnoringAccents(book.author, searchTerm) ||
      book.isbn?.includes(searchTerm) ||
      includesIgnoringAccents(bookTags, searchTerm);
    
    if (!matchesGlobal) return false;
    
    // Filtros individuais por coluna
    if (filterISBN && !(book.isbn || '').toLowerCase().includes(filterISBN.toLowerCase())) return false;
    if (filterTitle && !includesIgnoringAccents(book.title, filterTitle)) return false;
    if (filterAuthor && !includesIgnoringAccents(book.author, filterAuthor)) return false;
    if (filterCategory && !includesIgnoringAccents(book.category || '', filterCategory)) return false;
    if (filterCutter && !(book.cutter || '').toLowerCase().includes(filterCutter.toLowerCase())) return false;
    if (filterTags && !includesIgnoringAccents(bookTags, filterTags)) return false;
    
    return true;
  });
  
  // Paginação dos livros filtrados
  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  // Resetar página quando o filtro muda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterISBN, filterTitle, filterAuthor, filterCategory, filterCutter, filterTags]);

  // Carregar capas dos livros da página atual (lazy loading)
  useEffect(() => {
    if (paginatedBooks.length > 0) {
      const ids = paginatedBooks.map((b: any) => b.id);
      fetchCoversForPage(ids);
    }
  }, [paginatedBooks.map((b: any) => b.id).join(','), fetchCoversForPage]);

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-8 fade-in">
      {/* Header responsivo */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Catálogo da Rede</h1>
          <p className="text-sm text-muted-foreground">Gestão unificada de obras de todas as bibliotecas.</p>
        </div>
        
        {/* Botões - empilham em mobile */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={async () => {
              setIsMobileMode(true);
              // Pré-selecionar biblioteca se for bibliotecário
              if (user?.role === 'bibliotecario' && user.library_id) {
                setMobileInventoryLibraryId(user.library_id);
                // Carregar cores da biblioteca automaticamente
                const { data: colors } = await (supabase as any)
                  .from('library_colors')
                  .select('*')
                  .eq('library_id', user.library_id)
                  .order('color_group, category_name');
                setLibraryColors(colors || []);
                
                // Carregar livros com cores para copiar
                const { data: copies } = await (supabase as any)
                  .from('copies')
                  .select('id, local_categories, books(id, title, author, isbn)')
                  .eq('library_id', user.library_id)
                  .not('local_categories', 'is', null);
                
                const booksMap = new Map();
                (copies || []).forEach((c: any) => {
                  if (c.books && c.local_categories?.length > 0 && !booksMap.has(c.books.id)) {
                    booksMap.set(c.books.id, {
                      id: c.books.id,
                      title: c.books.title,
                      author: c.books.author,
                      isbn: c.books.isbn,
                      local_categories: c.local_categories
                    });
                  }
                });
                setBooksForQuickAddCopyColors(Array.from(booksMap.values()));
              }
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600 w-full sm:w-auto"
          >
            <Smartphone className="mr-2 h-4 w-4" /> + Modo mobile
          </Button>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> + Modo computador
          </Button>
          <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4"/> Excel
          </Button>
        </div>
      </div>

      {/* Busca */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-md border">
        <Search className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
        <Input 
          placeholder="Pesquisar por título, autor(a), ISBN ou tags..." 
          className="border-none focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista de livros - Cards em mobile, Tabela em desktop */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando catálogo...</div>
      ) : (
        <>
          {/* Info de resultados e paginação */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              {filteredBooks.length} obra(s) encontrada(s)
              {totalPages > 1 && ` • Página ${currentPage} de ${totalPages}`}
            </div>
          </div>
          
          {/* MOBILE: Cards */}
          <div className="md:hidden space-y-3">
            {paginatedBooks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">Nenhuma obra encontrada com os filtros aplicados.</div>
            )}
            {paginatedBooks.map((book) => {
              const myLibId = user?.library_id;
              const allCopies = book.copies || [];
              const totalRede = allCopies.length;
              const dispRede = allCopies.filter((c:any) => c.status === 'disponivel').length;
              const localCopies = myLibId ? allCopies.filter((c:any) => c.library_id === myLibId) : allCopies;
              const totalLocal = localCopies.length;
              const dispLocal = localCopies.filter((c:any) => c.status === 'disponivel').length;

              return (
                <div key={book.id} className="bg-white border rounded-lg p-3 shadow-sm">
                  {/* Ações no topo */}
                  <div className="flex justify-end gap-1 mb-2 -mt-1 -mr-1">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(book)} className="h-8 px-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(book)} className="h-8 px-2">
                      <Pencil className="h-4 w-4 text-gray-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(book)} className="h-8 px-2 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="flex gap-3">
                    {/* Capa */}
                    <div className="shrink-0">
                      {coverCache[book.id] ? (
                        <img src={coverCache[book.id]} className="h-20 w-14 object-cover rounded border" />
                      ) : (
                        <div className="h-20 w-14 bg-slate-100 rounded border flex items-center justify-center">
                          <BookIcon className="h-6 w-6 text-slate-300"/>
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{book.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{book.author || "Autor(a) não informado(a)"}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="outline" className="text-[10px]">{book.category || "Geral"}</Badge>
                        {book.cutter && <Badge variant="secondary" className="text-[10px] font-mono">{book.cutter}</Badge>}
                        {book.tags && (typeof book.tags === 'string' ? book.tags.split(',') : []).slice(0, 2).map((tag: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-[9px] px-1 py-0 font-normal bg-violet-50 text-violet-700">{tag.trim()}</Badge>
                        ))}
                      </div>
                      
                      <div className="flex gap-2 mt-2 text-[10px]">
                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Rede: {dispRede}/{totalRede}</span>
                        <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded">Local: {dispLocal}/{totalLocal}</span>
                      </div>
                      
                      {book.isbn && (
                        <p className="text-[10px] text-muted-foreground mt-1 font-mono">ISBN: {book.isbn}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* DESKTOP: Tabela */}
          <div className="hidden md:block rounded-md border bg-white overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Capa</TableHead>
                  <TableHead className="w-[130px]">ISBN</TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead className="w-[100px]">Assunto</TableHead>
                  <TableHead className="w-[80px]">Cutter</TableHead>
                  <TableHead className="w-[140px]">Tags</TableHead>
                  <TableHead className="text-center bg-blue-50 text-blue-700 w-[70px]">Rede</TableHead>
                  <TableHead className="text-center bg-blue-50 text-blue-700 w-[70px]">Disp.</TableHead>
                  <TableHead className="text-center bg-green-50 text-green-700 w-[70px]">Local</TableHead>
                  <TableHead className="text-center bg-green-50 text-green-700 w-[70px]">Disp.</TableHead>
                  <TableHead className="text-right w-[110px]">Ações</TableHead>
                </TableRow>
                {/* Filtros por coluna */}
                <TableRow className="bg-slate-50/80">
                  <TableHead></TableHead>
                  <TableHead>
                    <Input placeholder="ISBN..." className="h-7 text-xs" value={filterISBN} onChange={(e) => setFilterISBN(e.target.value)} />
                  </TableHead>
                  <TableHead>
                    <div className="flex flex-col gap-1">
                      <Input placeholder="Título..." className="h-7 text-xs" value={filterTitle} onChange={(e) => setFilterTitle(e.target.value)} />
                      <Input placeholder="Autor(a)..." className="h-7 text-xs" value={filterAuthor} onChange={(e) => setFilterAuthor(e.target.value)} />
                    </div>
                  </TableHead>
                  <TableHead>
                    <Input placeholder="Assunto..." className="h-7 text-xs" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} />
                  </TableHead>
                  <TableHead>
                    <Input placeholder="Cutter..." className="h-7 text-xs" value={filterCutter} onChange={(e) => setFilterCutter(e.target.value)} />
                  </TableHead>
                  <TableHead>
                    <Input placeholder="Tags..." className="h-7 text-xs" value={filterTags} onChange={(e) => setFilterTags(e.target.value)} />
                  </TableHead>
                  <TableHead colSpan={4}></TableHead>
                  <TableHead className="text-right">
                    {(filterISBN || filterTitle || filterAuthor || filterCategory || filterCutter || filterTags) && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-700 px-2" onClick={() => { setFilterISBN(''); setFilterTitle(''); setFilterAuthor(''); setFilterCategory(''); setFilterCutter(''); setFilterTags(''); }}>
                        <X className="h-3 w-3 mr-1" /> Limpar
                      </Button>
                    )}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBooks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      Nenhuma obra encontrada com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : paginatedBooks.map((book) => {
                  const myLibId = user?.library_id;
                  const allCopies = book.copies || [];
                  const totalRede = allCopies.length;
                  const dispRede = allCopies.filter((c:any) => c.status === 'disponivel').length;
                  const localCopies = myLibId ? allCopies.filter((c:any) => c.library_id === myLibId) : allCopies;
                  const totalLocal = localCopies.length;
                  const dispLocal = localCopies.filter((c:any) => c.status === 'disponivel').length;

                  return (
                    <TableRow key={book.id}>
                      <TableCell>
                        {coverCache[book.id] ? <img src={coverCache[book.id]} className="h-12 w-9 object-cover rounded border" /> : <div className="h-12 w-9 bg-slate-100 rounded flex items-center justify-center"><BookIcon className="h-4 w-4 text-slate-300"/></div>}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{book.isbn || "-"}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm line-clamp-1">{book.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{book.author}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{book.category || "Geral"}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{book.cutter || "-"}</TableCell>
                      <TableCell>
                        {book.tags ? (
                          <div className="flex flex-wrap gap-1">
                            {(typeof book.tags === 'string' ? book.tags.split(',') : []).slice(0, 3).map((tag: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-[9px] px-1.5 py-0 font-normal bg-violet-50 text-violet-700 border-violet-200">
                                {tag.trim()}
                              </Badge>
                            ))}
                            {(typeof book.tags === 'string' ? book.tags.split(',') : []).length > 3 && (
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-normal">
                                +{(book.tags.split(',').length - 3)}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
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
                })}
              </TableBody>
            </Table>
          </div>
          
          {/* Controles de Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="hidden sm:flex"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Anterior</span>
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-8 h-8 p-0",
                        currentPage === pageNum && "bg-primary hover:bg-primary/90"
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <span className="hidden sm:inline mr-1">Próxima</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="hidden sm:flex"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

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
              <div className="flex gap-4 items-start">
                <div className="w-[280px] space-y-2">
                  <Label className="flex items-center gap-2">
                    ISBN
                    <span className="text-[10px] text-muted-foreground font-normal">(Enter = buscar)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      ref={isbnInputRef}
                      value={formData.isbn} 
                      onChange={e=>setFormData({...formData, isbn:e.target.value})} 
                      placeholder={noIsbn ? "Código automático" : "Digite e pressione Enter"}
                      disabled={noIsbn}
                      className="font-mono"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && formData.isbn && !searchingISBN && !noIsbn) {
                          e.preventDefault();
                          handleSearchISBN();
                        }
                      }}
                    />
                    <Button onClick={handleSearchISBN} disabled={searchingISBN || noIsbn} title="Buscar dados do livro">
                      {searchingISBN ? <Loader2 className="animate-spin h-4 w-4"/> : <Search className="h-4 w-4"/>}
                    </Button>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-md border bg-slate-50 hover:bg-slate-100 transition-colors">
                    <Checkbox 
                      checked={noIsbn}
                      onCheckedChange={async (checked) => {
                        setNoIsbn(checked as boolean);
                        if (checked) {
                          const code = await generateNoIsbnCode();
                          setFormData({...formData, isbn: code});
                        } else {
                          setFormData({...formData, isbn: ''});
                        }
                      }}
                    />
                    <span className="text-sm">Obra sem ISBN</span>
                    <span className="text-[10px] text-muted-foreground">(gera código SI)</span>
                  </label>
                </div>
                <div className="flex-1 space-y-1">
                  <Label>Título</Label>
                  <Input value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value.toUpperCase()})}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Autor(a)</Label><Input value={formData.author} onChange={e=>setFormData({...formData, author:e.target.value.toUpperCase()})}/></div>
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
                      <Command
                        filter={(value, search) => {
                          if (!search) return 1;
                          return normalizeText(value).includes(normalizeText(search)) ? 1 : 0;
                        }}
                      >
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
                      <Command
                        filter={(value, search) => {
                          if (!search) return 1;
                          return normalizeText(value).includes(normalizeText(search)) ? 1 : 0;
                        }}
                      >
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
              
              {/* Campo de Tags */}
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                  <span className="text-[10px] text-muted-foreground font-normal">(separadas por vírgula)</span>
                </Label>
                <Textarea 
                  value={formData.tags} 
                  onChange={e => setFormData({...formData, tags: e.target.value})}
                  placeholder="romance, aventura, ficção científica..."
                  className="min-h-[60px] resize-y"
                  rows={2}
                />
                <p className="text-[10px] text-muted-foreground">
                  Tags são geradas automaticamente ao buscar ISBN, mas você pode editar ou adicionar novas.
                </p>
              </div>
              
              {/* Seção de Capa do Livro */}
              <div className="space-y-3 p-4 border rounded-lg bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Capa do Livro
                  </Label>
                  <div className="flex gap-1 bg-white rounded-md p-1 border">
                    <Button
                      type="button"
                      size="sm"
                      variant={coverInputMode === 'url' ? 'default' : 'ghost'}
                      onClick={() => { setCoverInputMode('url'); setShowCoverOptions(false); }}
                      className="h-7 text-xs"
                    >
                      <Link className="h-3 w-3 mr-1" />
                      URL
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={coverInputMode === 'upload' ? 'default' : 'ghost'}
                      onClick={() => { setCoverInputMode('upload'); setShowCoverOptions(false); }}
                      className="h-7 text-xs"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Upload
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={coverInputMode === 'search' ? 'default' : 'ghost'}
                      onClick={() => { setCoverInputMode('search'); }}
                      className="h-7 text-xs"
                    >
                      <Search className="h-3 w-3 mr-1" />
                      Buscar
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  {/* Preview da capa */}
                  <div className="flex-shrink-0">
                    {coverPreview || formData.cover_url ? (
                      <div className="relative group">
                        <img 
                          src={coverPreview || formData.cover_url} 
                          alt="Preview da capa"
                          className="h-32 w-24 object-cover rounded-md border shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={handleRemoveCover}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="h-32 w-24 bg-slate-200 rounded-md border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                        <BookIcon className="h-8 w-8 mb-1" />
                        <span className="text-[10px] text-center px-1">Sem capa</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Inputs de capa */}
                  <div className="flex-1 space-y-2">
                    {coverInputMode === 'url' ? (
                      <>
                        <Label className="text-xs text-muted-foreground">URL da imagem</Label>
                        <Input 
                          value={formData.cover_url} 
                          onChange={e => {
                            setFormData({...formData, cover_url: e.target.value});
                            setCoverPreview(e.target.value);
                          }}
                          placeholder="https://exemplo.com/capa.jpg"
                          className="bg-white"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          💡 Dica: Ao buscar pelo ISBN, a capa é preenchida automaticamente se disponível.
                        </p>
                      </>
                    ) : coverInputMode === 'upload' ? (
                      <>
                        <Label className="text-xs text-muted-foreground">Enviar arquivo de imagem</Label>
                        <div className="relative">
                          <Input 
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleCoverUpload}
                            disabled={uploadingCover}
                            className="bg-white cursor-pointer"
                          />
                          {uploadingCover && (
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
                    ) : (
                      <>
                        <Label className="text-xs text-muted-foreground">Buscar capas na internet</Label>
                        <Button
                          type="button"
                          onClick={handleSearchCovers}
                          disabled={searchingCovers || (!formData.title && !formData.isbn)}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          {searchingCovers ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Buscando capas...
                            </>
                          ) : (
                            <>
                              <Search className="h-4 w-4 mr-2" />
                              Buscar Opções de Capa
                            </>
                          )}
                        </Button>
                        <p className="text-[10px] text-muted-foreground">
                          🔍 Busca em Open Library e Google Books. Preencha título ou ISBN antes de buscar.
                        </p>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Grid de opções de capas encontradas */}
                {coverInputMode === 'search' && showCoverOptions && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        {searchingCovers ? 'Buscando...' : coverOptions.length > 0 ? `${coverOptions.length} capa${coverOptions.length > 1 ? 's' : ''} encontrada${coverOptions.length > 1 ? 's' : ''}` : 'Nenhuma capa encontrada'}
                      </Label>
                      {coverOptions.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCoverOptions(false)}
                          className="h-6 text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Fechar
                        </Button>
                      )}
                    </div>
                    
                    {searchingCovers ? (
                      <div className="flex items-center justify-center py-8 bg-slate-100 rounded-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <span className="ml-3 text-slate-600">Procurando capas...</span>
                      </div>
                    ) : coverOptions.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 p-3 bg-slate-100 rounded-lg max-h-[300px] overflow-y-auto">
                        {coverOptions.map((option, index) => (
                          <div 
                            key={index}
                            className="relative group cursor-pointer"
                            onClick={() => handleSelectCoverOption(option.url)}
                          >
                            <div className="aspect-[2/3] bg-white rounded-lg border-2 border-transparent hover:border-blue-500 transition-all overflow-hidden shadow-sm hover:shadow-md">
                              <img 
                                src={option.url} 
                                alt={`Opção ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                                }}
                              />
                            </div>
                            <div className="absolute inset-0 bg-blue-600/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Check className="h-8 w-8 text-white" />
                            </div>
                            <p className="text-[9px] text-center text-slate-500 mt-1 truncate px-1" title={option.source}>
                              {option.source}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : !searchingCovers && (
                      <div className="text-center py-6 bg-slate-100 rounded-lg">
                        <BookIcon className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">Nenhuma capa encontrada</p>
                        <p className="text-xs text-slate-400 mt-1">Tente usar URL ou Upload</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Código Cutter - Gerado automaticamente */}
              <div className="space-y-2">
                <Label className="font-medium">Código Cutter</Label>
                <Input 
                  value={formData.cutter} 
                  onChange={e => setFormData({...formData, cutter: e.target.value})}
                  placeholder="Ex: K45d"
                  className="font-mono max-w-[200px]"
                />
                <p className="text-xs text-muted-foreground">
                  Digite o código Cutter ou deixe em branco. Será solicitado ao salvar.
                </p>
              </div>
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
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* === CADASTRO RÁPIDO INTEGRADO: Adicionar ao Acervo === */}
          {!editingId && (
            <div className="mt-4 p-4 border-2 border-dashed border-green-300 rounded-lg bg-green-50/50">
              <div className="flex items-center gap-2 mb-3">
                <Checkbox 
                  id="addToInventory" 
                  checked={addToInventory}
                  onCheckedChange={(checked) => setAddToInventory(checked as boolean)}
                />
                <Label htmlFor="addToInventory" className="font-semibold text-green-800 cursor-pointer flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Adicionar exemplar(es) ao Acervo
                </Label>
              </div>
              
              {addToInventory && (
                <div className="space-y-3 mt-3 pl-6">
                  {/* Seleção da Biblioteca e Origem */}
                  <div className="flex flex-wrap gap-4">
                    <div className="space-y-1 min-w-[200px]">
                      <Label className="text-sm">Biblioteca *</Label>
                      <Select value={inventoryLibraryId} onValueChange={setInventoryLibraryId}>
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
                    
                    <div className="space-y-1 min-w-[150px]">
                      <Label className="text-sm">Origem</Label>
                      <Select value={inventoryOrigin} onValueChange={(val: 'comprado' | 'doado' | 'indefinido') => setInventoryOrigin(val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="indefinido">Indefinido</SelectItem>
                          <SelectItem value="doado">Doado</SelectItem>
                          <SelectItem value="comprado">Comprado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Lista de Exemplares */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Exemplares ({inventoryItems.length})</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setInventoryItems([...inventoryItems, { 
                          id: Date.now(), 
                          tombo: '', 
                          autoTombo: false // Auto DESMARCADO por padrão
                        }])}
                        className="h-7 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Adicionar exemplar
                      </Button>
                    </div>
                    
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {inventoryItems.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                          <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                          
                          <Checkbox
                            checked={item.autoTombo}
                            onCheckedChange={(checked) => {
                              setInventoryItems(inventoryItems.map(i => 
                                i.id === item.id ? { ...i, autoTombo: checked as boolean, tombo: '' } : i
                              ));
                            }}
                          />
                          <span className="text-xs whitespace-nowrap">Auto</span>
                          
                          {item.autoTombo ? (
                            <div className="flex-1 text-xs text-muted-foreground italic">
                              Tombo automático (B...)
                            </div>
                          ) : (
                            <Input
                              value={item.tombo}
                              onChange={(e) => {
                                setInventoryItems(inventoryItems.map(i => 
                                  i.id === item.id ? { ...i, tombo: e.target.value } : i
                                ));
                              }}
                              placeholder="Digite o Nº Tombo"
                              className="flex-1 h-8 text-sm"
                            />
                          )}
                          
                          {inventoryItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setInventoryItems(inventoryItems.filter(i => i.id !== item.id))}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Atalho para adicionar múltiplos */}
                    <div className="flex gap-1 pt-1">
                      <span className="text-xs text-muted-foreground">Adicionar rápido:</span>
                      {[2, 3, 5, 10].map(n => (
                        <Button
                          key={n}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            const newItems = Array.from({ length: n }, (_, i) => ({
                              id: Date.now() + i,
                              tombo: '',
                              autoTombo: false // Auto DESMARCADO por padrão
                            }));
                            setInventoryItems([...inventoryItems, ...newItems]);
                          }}
                        >
                          +{n}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Processamento Físico */}
                  <div className="space-y-2 pt-3 border-t">
                    <Label className="text-sm">Processamento Físico</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox 
                          checked={inventoryProcessing.stamped}
                          onCheckedChange={(checked) => setInventoryProcessing(p => ({...p, stamped: checked as boolean}))}
                        />
                        <span className="text-sm">C - Carimbado</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox 
                          checked={inventoryProcessing.indexed}
                          onCheckedChange={(checked) => setInventoryProcessing(p => ({...p, indexed: checked as boolean}))}
                        />
                        <span className="text-sm">I - Indexado</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox 
                          checked={inventoryProcessing.taped}
                          onCheckedChange={(checked) => setInventoryProcessing(p => ({...p, taped: checked as boolean}))}
                        />
                        <span className="text-sm">L - Lombada</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Cores / Categorias */}
                  <div className="space-y-2 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Cores / Categorias ({inventoryColors.length}/3)</Label>
                      <Popover open={openCopyColorsPopover} onOpenChange={setOpenCopyColorsPopover}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            📋 Copiar de outro livro
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="end">
                          <Command shouldFilter={false}>
                            <CommandInput 
                              placeholder="Digite para buscar por título, autor ou ISBN..." 
                              value={copyColorsSearch}
                              onValueChange={setCopyColorsSearch}
                            />
                            <CommandList>
                              <CommandEmpty>Nenhum livro com cores encontrado.</CommandEmpty>
                              <CommandGroup heading={`Livros com cores (${allCopies.length})`}>
                                {allCopies
                                  .filter(c => {
                                    if (!copyColorsSearch) return true;
                                    return (
                                      includesIgnoringAccents(c.books?.title, copyColorsSearch) ||
                                      includesIgnoringAccents(c.books?.author, copyColorsSearch) ||
                                      c.books?.isbn?.includes(copyColorsSearch) ||
                                      c.local_categories?.some((cat: string) => includesIgnoringAccents(cat, copyColorsSearch))
                                    );
                                  })
                                  .slice(0, 20)
                                  .map(copy => (
                                    <CommandItem
                                      key={copy.id}
                                      value={copy.books?.title || copy.id}
                                      onSelect={() => {
                                        setInventoryColors(copy.local_categories || []);
                                        setOpenCopyColorsPopover(false);
                                        setCopyColorsSearch("");
                                        toast({ title: "Cores copiadas!", description: `${copy.local_categories?.join(", ")}` });
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <div className="flex flex-col flex-1 gap-0.5">
                                        <span className="text-sm font-medium truncate">{copy.books?.title || "Sem título"}</span>
                                        <span className="text-xs text-muted-foreground truncate">
                                          {copy.books?.author || "Autor(a) desconhecido(a)"} {copy.books?.isbn ? `• ISBN: ${copy.books.isbn}` : ""}
                                        </span>
                                        <div className="flex gap-1 mt-1">
                                          {copy.local_categories?.map((cat: string, i: number) => (
                                            <Badge key={i} variant="secondary" className="text-[10px] h-5">
                                              {cat}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))
                                }
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {/* Seleção de cores disponíveis */}
                    {libraryColors.length > 0 ? (
                      <div className="flex flex-wrap gap-1 p-2 border rounded bg-white max-h-[280px] overflow-y-auto">
                        {(() => {
                          // Agrupar cores por grupo
                          const colorsByGroup: Record<string, any[]> = {};
                          libraryColors.forEach(c => {
                            const group = c.color_group || 'Geral';
                            if (!colorsByGroup[group]) colorsByGroup[group] = [];
                            colorsByGroup[group].push(c);
                          });
                          
                          // Ordenar grupos: Tipo de Leitor > Gênero Literário > Literaturas Afirmativas > outros
                          const groupOrder = ['Tipo de Leitor', 'TIPO DE LEITOR', 'Gênero Literário', 'GÊNERO LITERÁRIO', 'Literaturas Afirmativas', 'LITERATURAS AFIRMATIVAS'];
                          const sortedGroups = Object.entries(colorsByGroup).sort(([a], [b]) => {
                            const aIdx = groupOrder.findIndex(g => g.toLowerCase() === a.toLowerCase());
                            const bIdx = groupOrder.findIndex(g => g.toLowerCase() === b.toLowerCase());
                            if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
                            if (aIdx === -1) return 1;
                            if (bIdx === -1) return -1;
                            return aIdx - bIdx;
                          });
                          
                          return sortedGroups.map(([group, colors]) => (
                            <div key={group} className="w-full">
                              <div className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">{group}</div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {colors.map(c => {
                                  const isSelected = inventoryColors.includes(c.category_name);
                                  return (
                                    <Badge
                                      key={c.id}
                                      variant={isSelected ? "default" : "outline"}
                                      className="cursor-pointer text-xs"
                                      style={isSelected ? { backgroundColor: c.color_hex } : {}}
                                      onClick={() => {
                                        if (isSelected) {
                                          setInventoryColors(inventoryColors.filter(x => x !== c.category_name));
                                        } else if (inventoryColors.length < 3) {
                                          setInventoryColors([...inventoryColors, c.category_name]);
                                        } else {
                                          toast({ title: "Máximo 3 cores", variant: "destructive" });
                                        }
                                      }}
                                    >
                                      <div 
                                        className="w-3 h-3 rounded-full mr-1 border"
                                        style={{ backgroundColor: c.color_hex }}
                                      />
                                      {c.category_name}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {inventoryLibraryId ? "Nenhuma cor configurada para esta biblioteca." : "Selecione uma biblioteca para ver as cores."}
                      </p>
                    )}
                    
                    {inventoryColors.length > 0 && (
                      <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                        <strong>Selecionadas:</strong> {inventoryColors.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Atalhos de teclado */}
          <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-4 justify-end">
            <span className="flex items-center gap-1"><Keyboard className="h-3 w-3" /> <kbd className="px-1 bg-muted rounded">Enter</kbd> no ISBN = buscar</span>
            <span className="flex items-center gap-1"><kbd className="px-1 bg-muted rounded">Ctrl</kbd>+<kbd className="px-1 bg-muted rounded">S</kbd> = salvar</span>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={()=>setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || (addToInventory && !inventoryLibraryId)}>
              {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : null}
              {addToInventory ? `Salvar e Criar ${inventoryItems.length} Exemplar(es)` : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Confirmação de Cutter vazio (modo computador) */}
      <Dialog open={showDesktopCutterDialog} onOpenChange={setShowDesktopCutterDialog}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Cutter não preenchido
            </DialogTitle>
            <DialogDescription className="text-left">
              O código Cutter está em branco. Confirme se esta obra realmente não possui Cutter ou digite o código manualmente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* Opção 1: Digitar Cutter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Digite o Cutter:</Label>
              <Input
                placeholder="Ex: K45d"
                value={desktopCutterDialogValue}
                onChange={(e) => setDesktopCutterDialogValue(e.target.value)}
                className="font-mono text-center text-lg h-12"
              />
              <Button 
                onClick={() => handleDesktopCutterConfirm(false)}
                disabled={!desktopCutterDialogValue.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                <Check className="mr-2 h-4 w-4" /> Usar este Cutter
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">ou</span>
              </div>
            </div>
            
            {/* Opção 2: Confirmar sem Cutter */}
            <div className="border rounded-lg p-3 bg-amber-50 border-amber-200">
              <button
                onClick={() => handleDesktopCutterConfirm(true)}
                className="w-full flex items-center gap-3 text-left"
              >
                <div className="w-6 h-6 rounded border-2 border-amber-400 bg-white flex items-center justify-center shrink-0">
                  <Check className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <span className="font-medium text-amber-800 block">Sem Cutter</span>
                  <span className="text-xs text-amber-600">Esta obra não possui código Cutter</span>
                </div>
              </button>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setShowDesktopCutterDialog(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Disponibilidade: {selectedBookDetails?.title}</DialogTitle></DialogHeader>
          {selectedBookDetails?.loading ? (
            <p className="text-center text-muted-foreground py-4">Carregando...</p>
          ) : selectedBookDetails?.libraries.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Nenhum exemplar cadastrado na rede.</p>
          ) : (
          <Table>
            <TableHeader>
                <TableRow>
                  <TableHead>Biblioteca</TableHead>
                  <TableHead>Nr. Tombo</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Disponível</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {selectedBookDetails?.libraries.map((lib: any, idx: number) => (
                  <TableRow key={idx} className={lib.isMyLibrary ? "bg-green-50" : ""}>
                    <TableCell className="font-medium">
                      {lib.name}
                      {lib.isMyLibrary && <Badge variant="outline" className="ml-2 text-[10px] text-green-700 border-green-300">Sua biblioteca</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {lib.tombos.length > 0 ? lib.tombos.join(', ') : '-'}
                    </TableCell>
                  <TableCell className="text-center">{lib.total}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={lib.disponivel > 0 ? "success" : "secondary"}>{lib.disponivel}</Badge>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
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
                        <TableHead>Autor(a)</TableHead>
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
                      <Label className="text-xs text-muted-foreground">Autor(a)</Label>
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
      
      {/* ============ MODO MOBILE - REDESIGN COMPLETO ============ */}
      {isMobileMode && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header compacto */}
          <div className="bg-white border-b px-3 py-2 flex items-center gap-2 shrink-0 safe-area-top">
            <button onClick={closeMobileMode} className="p-1.5 -ml-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <span className="text-base font-medium text-gray-800">Cadastro Rápido</span>
          </div>
          
          {/* LOADING - Estilo moderno */}
          {mobileSearching && (
            <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center">
              <div className="w-20 h-20 mb-6">
                <svg className="animate-spin" viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                  <circle cx="25" cy="25" r="20" fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" strokeDasharray="80" strokeDashoffset="60" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-1">Buscando livro...</p>
              <p className="text-base text-gray-500 font-mono">{mobileFormData.isbn}</p>
              <p className="text-sm text-indigo-600 mt-4">{mobileSearchStatus}</p>
            </div>
          )}
          
          {/* Conteúdo principal */}
          <div className="flex-1 overflow-auto bg-gray-50">
            <div className="p-3 space-y-3 pb-28">
              
              {/* Card ISBN - Compacto */}
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { if (!mobileNoIsbn) { setShowMobileScanner(true); setTimeout(() => startBarcodeScanner(), 300); }}}
                    disabled={mobileNoIsbn}
                    className="w-12 h-12 bg-white/95 rounded-xl flex items-center justify-center shadow active:scale-95 transition-all disabled:opacity-50"
                  >
                    <ScanBarcode className="h-6 w-6 text-indigo-600" />
                  </button>
                  <input 
                    type="text"
                    placeholder={mobileNoIsbn ? "Código automático" : "ISBN do livro"}
                    value={mobileFormData.isbn || scannedISBN}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setScannedISBN(val);
                      setMobileFormData(p => ({ ...p, isbn: val }));
                    }}
                    disabled={mobileNoIsbn}
                    className="flex-1 bg-white/20 text-white placeholder-white/60 rounded-xl px-3 py-2.5 text-base font-mono tracking-wide focus:outline-none focus:bg-white/30 transition-colors disabled:opacity-70"
                    inputMode="numeric"
                  />
                  <button 
                    onClick={() => (mobileFormData.isbn || scannedISBN) && searchMobileISBN(mobileFormData.isbn || scannedISBN)}
                    disabled={mobileNoIsbn || !(mobileFormData.isbn || scannedISBN) || (mobileFormData.isbn || scannedISBN).length < 10}
                    className="w-12 h-12 bg-white/95 rounded-xl flex items-center justify-center shadow active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Search className="h-5 w-5 text-indigo-600" />
                  </button>
                </div>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${mobileNoIsbn ? 'bg-white border-white' : 'border-white/50'}`}>
                    {mobileNoIsbn && <Check className="h-3 w-3 text-indigo-600" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={mobileNoIsbn}
                    onChange={async (e) => {
                      const checked = e.target.checked;
                      setMobileNoIsbn(checked);
                      if (checked) {
                        const code = await generateNoIsbnCode();
                        setScannedISBN(code);
                        setMobileFormData(p => ({ ...p, isbn: code }));
                      } else {
                        setScannedISBN('');
                        setMobileFormData(p => ({ ...p, isbn: '' }));
                      }
                    }}
                  />
                  <span className="text-white/90 text-sm">Obra sem ISBN</span>
                </label>
              </div>
              
              {/* Card Dados do Livro */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-3">
                  {/* Preview da capa com dados */}
                  <div className="flex gap-3">
                    {/* Capa */}
                    <div className="relative shrink-0 flex flex-col items-center gap-1">
                      <button 
                        onClick={() => startCamera()}
                        className="w-20 h-28 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex flex-col items-center justify-center overflow-hidden border border-dashed border-slate-300 active:scale-95 transition-all"
                      >
                        {mobileFormData.cover_url ? (
                          <img src={mobileFormData.cover_url} className="w-full h-full object-cover" alt="Capa" />
                        ) : (
                          <>
                            <Camera className="h-6 w-6 text-slate-400" />
                            <span className="text-[10px] text-slate-400 mt-0.5">Capa</span>
                          </>
                        )}
                      </button>
                      {mobileFormData.cover_url && (
                        <button 
                          onClick={() => setMobileFormData(p => ({ ...p, cover_url: '' }))} 
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow active:scale-90 transition-all"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      {/* Botão de buscar capas */}
                      <button
                        onClick={handleMobileSearchCovers}
                        disabled={mobileSearchingCovers || (!mobileFormData.title && !mobileFormData.isbn)}
                        className="w-20 h-6 text-[10px] bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded flex items-center justify-center gap-1 active:scale-95 transition-all"
                      >
                        {mobileSearchingCovers ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Search className="h-3 w-3" />
                            Buscar
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Dados principais */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <input 
                        type="text"
                        placeholder="Título do livro"
                        value={mobileFormData.title}
                        onChange={(e) => setMobileFormData(p => ({ ...p, title: e.target.value.toUpperCase() }))}
                        className="w-full text-sm font-bold text-gray-900 placeholder-gray-300 border-b border-gray-200 focus:border-indigo-500 py-1.5 bg-transparent transition-colors outline-none truncate"
                      />
                      <input 
                        type="text"
                        placeholder="Autor(a)"
                        value={mobileFormData.author}
                        onChange={(e) => setMobileFormData(p => ({ ...p, author: e.target.value.toUpperCase() }))}
                        className="w-full text-sm text-gray-700 placeholder-gray-300 border-b border-gray-100 focus:border-indigo-500 py-1.5 bg-transparent transition-colors outline-none"
                      />
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Editora"
                          value={mobileFormData.publisher}
                          onChange={(e) => setMobileFormData(p => ({ ...p, publisher: e.target.value }))}
                          className="flex-1 text-xs text-gray-600 placeholder-gray-300 border-b border-gray-100 focus:border-indigo-500 py-1 bg-transparent transition-colors outline-none"
                        />
                        <input 
                          type="text"
                          placeholder="Cutter"
                          value={mobileFormData.cutter}
                          onChange={(e) => setMobileFormData(p => ({ ...p, cutter: e.target.value }))}
                          className="w-16 text-xs font-mono text-indigo-600 placeholder-gray-300 bg-indigo-50 rounded px-2 py-1 text-center focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            
            {/* Detalhes do Livro */}
            <div className="bg-white rounded-xl shadow-sm">
              <button 
                className="w-full px-3 py-2.5 flex items-center justify-between"
                onClick={() => setMobileExpandedSections(s => s.includes('detalhes') ? s.filter(x => x !== 'detalhes') : [...s, 'detalhes'])}
              >
                <span className="text-sm font-semibold text-gray-900">Detalhes do Livro</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${mobileExpandedSections.includes('detalhes') ? 'rotate-180' : ''}`} />
              </button>
              
              {mobileExpandedSections.includes('detalhes') && (
                <div className="px-3 pb-3 space-y-1.5 border-t border-gray-100 pt-2">
                  <input 
                    type="text"
                    placeholder="Subtítulo"
                    value={mobileFormData.subtitle}
                    onChange={(e) => setMobileFormData(p => ({ ...p, subtitle: e.target.value.toUpperCase() }))}
                    className="w-full h-8 px-2 text-xs bg-gray-50 rounded border-0 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <input 
                    type="text"
                    placeholder="Categoria / Assunto"
                    value={mobileFormData.category}
                    onChange={(e) => setMobileFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full h-8 px-2 text-xs bg-gray-50 rounded border-0 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <textarea 
                    placeholder="Tags (separe por vírgula: romance, ficção, aventura...)"
                    value={mobileFormData.tags || ''}
                    onChange={(e) => setMobileFormData(p => ({ ...p, tags: e.target.value }))}
                    rows={2}
                    className="w-full px-2 py-1.5 text-xs bg-gray-50 rounded border-0 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                  <div className="grid grid-cols-3 gap-1.5">
                    <input 
                      type="text"
                      placeholder="Ano"
                      value={mobileFormData.publication_date}
                      onChange={(e) => setMobileFormData(p => ({ ...p, publication_date: e.target.value }))}
                      className="h-8 px-2 text-xs bg-gray-50 rounded border-0 focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                    />
                    <input 
                      type="number"
                      placeholder="Pág."
                      value={mobileFormData.page_count}
                      onChange={(e) => setMobileFormData(p => ({ ...p, page_count: e.target.value }))}
                      className="h-8 px-2 text-xs bg-gray-50 rounded border-0 focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                    />
                    <input 
                      type="text"
                      placeholder="Ed."
                      value={mobileFormData.edition}
                      onChange={(e) => setMobileFormData(p => ({ ...p, edition: e.target.value }))}
                      className="h-8 px-2 text-xs bg-gray-50 rounded border-0 focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Select value={mobileFormData.language} onValueChange={(v) => setMobileFormData(p => ({ ...p, language: v }))}>
                      <SelectTrigger className="h-8 text-xs bg-gray-50 border-0 rounded"><SelectValue placeholder="Idioma" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (BR)</SelectItem>
                        <SelectItem value="en">Inglês</SelectItem>
                        <SelectItem value="es">Espanhol</SelectItem>
                        <SelectItem value="fr">Francês</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={mobileFormData.country_classification} onValueChange={(v) => setMobileFormData(p => ({ ...p, country_classification: v }))}>
                      <SelectTrigger className="h-8 text-xs bg-gray-50 border-0 rounded"><SelectValue placeholder="País" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRA - Brasil">Brasil</SelectItem>
                        <SelectItem value="USA - Estados Unidos">EUA</SelectItem>
                        <SelectItem value="PRT - Portugal">Portugal</SelectItem>
                        <SelectItem value="ESP - Espanha">Espanha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input 
                      type="text"
                      placeholder="Série"
                      value={mobileFormData.series}
                      onChange={(e) => setMobileFormData(p => ({ ...p, series: e.target.value }))}
                      className="h-8 px-2 text-xs bg-gray-50 rounded border-0 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input 
                      type="text"
                      placeholder="Volume"
                      value={mobileFormData.volume}
                      onChange={(e) => setMobileFormData(p => ({ ...p, volume: e.target.value }))}
                      className="h-8 px-2 text-xs bg-gray-50 rounded border-0 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input 
                      type="text"
                      placeholder="Tradutor(a)" 
                      value={mobileFormData.translator}
                      onChange={(e) => setMobileFormData(p => ({ ...p, translator: e.target.value.toUpperCase() }))}
                      className="h-8 px-2 text-xs bg-gray-50 rounded border-0 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input 
                      type="text"
                      placeholder="Local publicação"
                      value={mobileFormData.publication_place}
                      onChange={(e) => setMobileFormData(p => ({ ...p, publication_place: e.target.value }))}
                      className="h-8 px-2 text-xs bg-gray-50 rounded border-0 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <textarea 
                    placeholder="Descrição"
                    value={mobileFormData.description}
                    onChange={(e) => setMobileFormData(p => ({ ...p, description: e.target.value }))}
                    rows={2}
                    className="w-full px-2 py-1.5 text-xs bg-gray-50 rounded border-0 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>
              )}
            </div>
            
            {/* Adicionar ao Acervo */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button 
                className="w-full px-3 py-2.5 flex items-center justify-between"
                onClick={() => setMobileAddToInventory(!mobileAddToInventory)}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                    mobileAddToInventory ? "bg-green-500" : "bg-gray-200"
                  )}>
                    {mobileAddToInventory && <Check className="h-4 w-4 text-white" />}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Adicionar ao acervo</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${mobileAddToInventory ? 'rotate-180' : ''}`} />
              </button>
              
              {mobileAddToInventory && (
                <div className="px-3 pb-3 space-y-3 border-t border-gray-100 pt-3">
                  {/* Biblioteca - só mostra se user for admin ou tiver múltiplas bibliotecas */}
                  {(user?.role === 'admin' || !user?.library_id) && (
                    <Select value={mobileInventoryLibraryId} onValueChange={(v) => {
                      setMobileInventoryLibraryId(v);
                      (async () => {
                        const { data: colors } = await (supabase as any)
                          .from('library_colors')
                          .select('*')
                          .eq('library_id', v)
                          .order('color_group, category_name');
                        setLibraryColors(colors || []);
                        
                        const { data: copies } = await (supabase as any)
                          .from('copies')
                          .select('id, local_categories, books(id, title, author, isbn)')
                          .eq('library_id', v)
                          .not('local_categories', 'is', null);
                        
                        const booksMap = new Map();
                        (copies || []).forEach((c: any) => {
                          if (c.books && c.local_categories?.length > 0 && !booksMap.has(c.books.id)) {
                            booksMap.set(c.books.id, {
                              id: c.books.id,
                              title: c.books.title,
                              author: c.books.author,
                              isbn: c.books.isbn,
                              local_categories: c.local_categories
                            });
                          }
                        });
                        setBooksForQuickAddCopyColors(Array.from(booksMap.values()));
                      })();
                    }}>
                      <SelectTrigger className="h-9 rounded-lg text-sm bg-gray-50 border-0 focus:ring-2 focus:ring-indigo-500">
                        <SelectValue placeholder="Selecione a biblioteca" />
                      </SelectTrigger>
                      <SelectContent>
                        {libraries.map(lib => (
                          <SelectItem key={lib.id} value={lib.id}>{lib.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {/* Origem do exemplar */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500">Origem</p>
                    <div className="flex gap-2">
                      {[
                        { value: 'indefinido', label: 'Indefinido' },
                        { value: 'doado', label: 'Doado' },
                        { value: 'comprado', label: 'Comprado' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setMobileInventoryOrigin(opt.value as any)}
                          className={cn(
                            "flex-1 h-8 rounded-lg text-xs font-medium transition-all",
                            mobileInventoryOrigin === opt.value
                              ? "bg-indigo-500 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Exemplares */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-500">Exemplares ({mobileInventoryCopies.length})</p>
                      <button 
                        onClick={() => setMobileInventoryCopies([...mobileInventoryCopies, { 
                          tombo: "", autoTombo: false, 
                          process_stamped: true, process_indexed: true, process_taped: true, 
                          colors: [] 
                        }])}
                        className="text-xs font-semibold text-indigo-600"
                      >
                        + Adicionar
                      </button>
                    </div>
                    
                    {mobileInventoryCopies.map((copy, idx) => (
                      <div key={idx} className="p-2 bg-gray-50 rounded-lg flex items-center gap-2">
                        <input 
                          type="text"
                          value={copy.tombo}
                          onChange={(e) => {
                            const newCopies = [...mobileInventoryCopies];
                            newCopies[idx].tombo = e.target.value;
                            newCopies[idx].autoTombo = false;
                            setMobileInventoryCopies(newCopies);
                          }}
                          className="flex-1 min-w-0 h-8 text-sm text-gray-800 placeholder-gray-400 bg-white border border-gray-200 rounded px-2 focus:border-indigo-500 outline-none"
                          placeholder={copy.autoTombo ? "Automático" : "Nº do tombo"}
                          disabled={copy.autoTombo}
                        />
                        <button 
                          onClick={() => {
                            const newCopies = [...mobileInventoryCopies];
                            newCopies[idx].autoTombo = !copy.autoTombo;
                            if (newCopies[idx].autoTombo) newCopies[idx].tombo = "";
                            setMobileInventoryCopies(newCopies);
                          }}
                          className={cn(
                            "h-8 px-2 rounded text-xs font-medium shrink-0",
                            copy.autoTombo 
                              ? "bg-indigo-500 text-white" 
                              : "bg-white border border-gray-200 text-gray-500"
                          )}
                        >
                          Auto
                        </button>
                        {/* C I L inline */}
                        {[
                          { key: 'process_stamped', label: 'C' },
                          { key: 'process_indexed', label: 'I' },
                          { key: 'process_taped', label: 'L' }
                        ].map((item) => (
                          <button
                            key={item.key}
                            onClick={() => {
                              const newCopies = [...mobileInventoryCopies];
                              (newCopies[idx] as any)[item.key] = !(newCopies[idx] as any)[item.key];
                              setMobileInventoryCopies(newCopies);
                            }}
                            className={cn(
                              "w-6 h-6 rounded text-xs font-bold shrink-0",
                              (copy as any)[item.key]
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-400"
                            )}
                          >
                            {item.label}
                          </button>
                        ))}
                        {mobileInventoryCopies.length > 1 && (
                          <button 
                            onClick={() => setMobileInventoryCopies(mobileInventoryCopies.filter((_, i) => i !== idx))}
                            className="w-6 h-6 flex items-center justify-center text-red-400 shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Cores/Categorias */}
                  {mobileInventoryLibraryId && (
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-500">Cores / Categorias</p>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="text-xs font-semibold text-indigo-600">
                              Copiar de outro
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-2" align="end">
                            <Command className="border rounded-lg overflow-hidden">
                              <CommandInput 
                                placeholder="Buscar livro..." 
                                className="h-9 text-sm" 
                                value={mobileCopyColorsSearch}
                                onValueChange={setMobileCopyColorsSearch}
                              />
                              <CommandList className="max-h-40">
                                <CommandEmpty>Nenhum livro</CommandEmpty>
                                <CommandGroup>
                                  {booksForQuickAddCopyColors
                                    .filter((book: any) => {
                                      if (!mobileCopyColorsSearch) return true;
                                      return includesIgnoringAccents(book.title, mobileCopyColorsSearch) ||
                                             includesIgnoringAccents(book.author, mobileCopyColorsSearch) ||
                                             book.isbn?.includes(mobileCopyColorsSearch);
                                    })
                                    .map((book: any) => (
                                    <CommandItem 
                                      key={book.id}
                                      onSelect={() => {
                                        if (book.local_categories?.length > 0) {
                                          setMobileSelectedColors(book.local_categories);
                                          toast({ title: "Cores copiadas!" });
                                        }
                                      }}
                                      className="py-2 cursor-pointer text-xs"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="truncate font-medium">{book.title}</p>
                                      </div>
                                      {book.local_categories?.length > 0 && (
                                        <Badge variant="secondary" className="text-[10px] ml-1">{book.local_categories.length}</Badge>
                                      )}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      {/* Cores disponíveis - ordenadas */}
                      {libraryColors.length > 0 ? (
                        <div className="space-y-2">
                          {(() => {
                            const colorsByGroup: Record<string, any[]> = {};
                            libraryColors.forEach((c: any) => {
                              const group = c.color_group || 'Geral';
                              if (!colorsByGroup[group]) colorsByGroup[group] = [];
                              colorsByGroup[group].push(c);
                            });
                            
                            // Ordenar grupos: Tipo de Leitor > Gênero Literário > Literaturas Afirmativas > outros
                            const groupOrder = ['Tipo de Leitor', 'TIPO DE LEITOR', 'Gênero Literário', 'GÊNERO LITERÁRIO', 'Literaturas Afirmativas', 'LITERATURAS AFIRMATIVAS'];
                            const sortedGroups = Object.entries(colorsByGroup).sort(([a], [b]) => {
                              const aIdx = groupOrder.findIndex(g => g.toLowerCase() === a.toLowerCase());
                              const bIdx = groupOrder.findIndex(g => g.toLowerCase() === b.toLowerCase());
                              if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
                              if (aIdx === -1) return 1;
                              if (bIdx === -1) return -1;
                              return aIdx - bIdx;
                            });
                            
                            // Função para verificar se a cor é clara
                            const isLightColor = (hex: string) => {
                              const c = hex.replace('#', '');
                              const r = parseInt(c.substr(0, 2), 16);
                              const g = parseInt(c.substr(2, 2), 16);
                              const b = parseInt(c.substr(4, 2), 16);
                              const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                              return brightness > 180;
                            };
                            
                            return sortedGroups.map(([group, colors]) => (
                              <div key={group}>
                                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">{group}</p>
                                <div className="flex flex-wrap gap-1">
                                  {colors.map((lc: any) => {
                                    const isSelected = mobileSelectedColors.includes(lc.category_name);
                                    const hexColor = lc.color_hex || '#888888';
                                    const isLight = isLightColor(hexColor);
                                    const maxColors = 3; // Limite de 3 cores
                                    const canSelect = isSelected || mobileSelectedColors.length < maxColors;
                                    return (
                                      <button
                                        key={lc.id}
                                        onClick={() => {
                                          if (!canSelect && !isSelected) {
                                            toast({ title: "Limite atingido", description: `Máximo de ${maxColors} cores por livro`, variant: "destructive" });
                                            return;
                                          }
                                          setMobileSelectedColors(prev => 
                                            isSelected 
                                              ? prev.filter(c => c !== lc.category_name)
                                              : [...prev, lc.category_name]
                                          );
                                        }}
                                        className={cn(
                                          "px-2 py-1 rounded text-[11px] font-medium border-2 transition-all flex items-center gap-1",
                                          isSelected 
                                            ? "ring-2 ring-offset-1 ring-gray-900 shadow-md" 
                                            : canSelect ? "bg-white hover:shadow-sm" : "bg-gray-100 opacity-50 cursor-not-allowed"
                                        )}
                                        style={{ 
                                          backgroundColor: isSelected ? hexColor : (canSelect ? 'white' : '#f3f4f6'),
                                          borderColor: isSelected ? (isLight ? '#333' : hexColor) : (isLight ? '#d1d5db' : hexColor),
                                          color: isSelected ? (isLight ? '#000' : '#fff') : '#333'
                                        }}
                                      >
                                        <span 
                                          className={cn("w-2.5 h-2.5 rounded-full shrink-0", isLight && "border border-gray-400")}
                                          style={{ backgroundColor: hexColor }}
                                        />
                                        <span className="truncate max-w-[100px]">{lc.category_name}</span>
                                        {isSelected && <Check className="h-3 w-3 shrink-0" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ));
                          })()}
                          {/* Contador de cores selecionadas */}
                          {mobileSelectedColors.length > 0 && (
                            <p className="text-[10px] text-gray-500 text-center pt-1">
                              {mobileSelectedColors.length}/3 cores selecionadas
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 text-center py-2">Nenhuma cor configurada.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
          </div>
          
          {/* Barra de ação fixa - apenas botão salvar */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-3 pt-2 pb-4 safe-area-bottom">
            <button 
              onClick={saveMobileBook}
              disabled={mobileSaving || !mobileFormData.title}
              className="w-full h-12 text-base font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {mobileSaving ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Salvando...</>
              ) : (
                <><Check className="h-5 w-5" /> {mobileAddToInventory ? 'Salvar livro + acervo' : 'Salvar no catálogo'}</>
              )}
            </button>
            {/* Botão limpar pequeno abaixo */}
            <button 
              onClick={resetMobileForm}
              className="w-full mt-2 h-9 text-sm font-medium text-gray-500 active:text-gray-700 transition-colors flex items-center justify-center gap-1"
            >
              <RotateCcw className="h-4 w-4" /> Limpar formulário
            </button>
          </div>
          
          {/* OVERLAY: Scanner */}
          {showMobileScanner && (
            <div className="absolute inset-0 z-50 bg-black flex flex-col">
              <div className="bg-black/90 text-white p-3 flex items-center justify-between">
                <span className="font-bold">📷 Escanear ISBN</span>
                <Button variant="ghost" size="sm" onClick={() => { stopBarcodeScanner(); setShowMobileScanner(false); }} className="text-white">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 relative">
                <div id="barcode-reader" className="w-full h-full" />
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <Button 
                      onClick={startBarcodeScanner} 
                      size="lg"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-6 text-lg"
                    >
                      <ScanBarcode className="mr-3 h-6 w-6" /> Iniciar Câmera
                    </Button>
                  </div>
                )}
                {isScanning && (
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="text-white text-sm bg-black/50 inline-block px-4 py-2 rounded-full">
                      📷 Aponte para o código de barras
                    </p>
                  </div>
                )}
              </div>
              <div className="p-4 bg-black/90 space-y-3">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ou digite o ISBN" 
                    value={scannedISBN}
                    onChange={(e) => setScannedISBN(e.target.value.replace(/[^0-9]/g, ''))}
                    className="flex-1 h-12 text-lg text-center bg-white"
                    inputMode="numeric"
                  />
                  <Button 
                    onClick={() => { 
                      if (scannedISBN && scannedISBN.length >= 10) {
                        stopBarcodeScanner(); 
                        setShowMobileScanner(false); 
                        searchMobileISBN(scannedISBN); 
                      }
                    }}
                    disabled={!scannedISBN || scannedISBN.length < 10}
                    className="h-12 px-6 bg-purple-600"
                  >
                    Buscar
                  </Button>
                </div>
                {isScanning && (
                  <Button variant="outline" onClick={stopBarcodeScanner} className="w-full text-white border-white/50 bg-transparent">
                    Parar Câmera
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* OVERLAY: Câmera para Capa */}
          {showMobileCamera && (
            <div className="absolute inset-0 z-50 bg-black flex flex-col">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-3 flex items-center justify-between">
                <span className="font-bold flex items-center gap-2">📸 Foto da Capa</span>
                <Button variant="ghost" size="sm" onClick={() => { stopCamera(); setShowMobileCamera(false); }} className="text-white hover:bg-white/20">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Área da câmera - sempre mostra o video */}
              <div className="flex-1 relative bg-black overflow-hidden">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay de loading quando não tem stream */}
                {!cameraStream && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 text-white animate-spin mb-4" />
                    <p className="text-white text-base font-medium">Iniciando câmera...</p>
                    <p className="text-white/60 text-sm mt-1">Aguarde um momento</p>
                  </div>
                )}
                
                {/* Grid para ajudar a tirar foto reta */}
                {cameraStream && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Linhas horizontais */}
                    <div className="absolute top-1/3 left-0 right-0 h-[1px] bg-white/30" />
                    <div className="absolute top-2/3 left-0 right-0 h-[1px] bg-white/30" />
                    {/* Linhas verticais */}
                    <div className="absolute left-1/3 top-0 bottom-0 w-[1px] bg-white/30" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-[1px] bg-white/30" />
                  </div>
                )}
              </div>
              
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Controles */}
              <div className="p-4 bg-gradient-to-t from-black to-black/80 space-y-3">
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => {
                      if (canvasRef.current && videoRef.current && cameraStream) {
                        const canvas = canvasRef.current;
                        canvas.width = videoRef.current.videoWidth;
                        canvas.height = videoRef.current.videoHeight;
                        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        setCapturedImage(dataUrl);
                        stopCamera();
                        setShowMobileCamera(false);
                        setShowMobileCrop(true);
                      }
                    }}
                    disabled={!cameraStream}
                    size="lg"
                    className="bg-white text-black hover:bg-white/90 px-8 py-6 rounded-full shadow-lg disabled:opacity-50"
                  >
                    <Camera className="h-7 w-7" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => { stopCamera(); setShowMobileCamera(false); selectFromGallery(); }}
                    className="bg-transparent text-white border-white/50 flex-1"
                  >
                    <Image className="mr-2 h-4 w-4" /> Galeria
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => { stopCamera(); setShowMobileCamera(false); }}
                    className="bg-transparent text-white border-white/50 flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* OVERLAY: Crop da Capa */}
          {showMobileCrop && capturedImage && (
            <div className="absolute inset-0 z-50 bg-white flex flex-col">
              <div className="bg-slate-800 text-white p-3 flex items-center justify-between">
                <span className="font-bold">✂️ Recortar Capa</span>
                <Button variant="ghost" size="sm" onClick={() => { setCapturedImage(null); setShowMobileCrop(false); }} className="text-white">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                <p className="text-center text-xs text-muted-foreground mb-3">Arraste os cantos para ajustar livremente</p>
                <div className="border-2 border-dashed border-primary/30 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center p-2">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    className="max-h-[50vh]"
                  >
                    <img 
                      ref={imgRef}
                      src={capturedImage} 
                      alt="Captured" 
                      onLoad={onImageLoad}
                      style={{ maxHeight: '50vh', width: 'auto' }}
                    />
                  </ReactCrop>
                </div>
              </div>
              <div className="p-3 bg-white border-t space-y-2">
                <Button 
                  onClick={async () => {
                    await applyCropAndUpload();
                    // Não chamar setShowMobileCrop aqui - já é chamado no applyCropAndUpload
                  }}
                  className="w-full h-12 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Check className="mr-2 h-5 w-5" /> Usar Esta Capa
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => { setCapturedImage(null); setShowMobileCrop(false); setShowMobileCamera(true); }}
                    className="flex-1"
                  >
                    <Camera className="mr-1 h-4 w-4" /> Nova Foto
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => { setCapturedImage(null); setShowMobileCrop(false); selectFromGallery(); }}
                    className="flex-1"
                  >
                    <Image className="mr-1 h-4 w-4" /> Galeria
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* OVERLAY: Opções de Capas Encontradas */}
          {showMobileCoverOptions && (
            <div className="absolute inset-0 z-50 bg-black/90 flex flex-col">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 flex items-center justify-between">
                <span className="font-bold flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Capas Encontradas
                </span>
                <Button variant="ghost" size="sm" onClick={() => setShowMobileCoverOptions(false)} className="text-white hover:bg-white/20">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="flex-1 p-4 overflow-auto">
                {mobileSearchingCovers ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
                    <p className="text-white text-sm">Buscando capas na internet...</p>
                  </div>
                ) : mobileCoverOptions.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {mobileCoverOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleMobileSelectCoverOption(option.url)}
                        className="relative group"
                      >
                        <div className="aspect-[2/3] bg-white rounded-xl overflow-hidden shadow-lg border-2 border-transparent active:border-blue-500 transition-all">
                          <img 
                            src={option.url} 
                            alt={`Opção ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-white/70 text-center mt-2 truncate px-1" title={option.source}>
                          {option.source}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                    <BookIcon className="h-16 w-16 text-slate-400" />
                    <p className="text-white text-lg">Nenhuma capa encontrada</p>
                    <p className="text-slate-400 text-sm">Tente tirar uma foto ou selecionar da galeria</p>
                    <div className="flex gap-3 mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => { setShowMobileCoverOptions(false); startCamera(); }}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <Camera className="mr-2 h-4 w-4" /> Tirar Foto
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => { setShowMobileCoverOptions(false); }}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <X className="mr-2 h-4 w-4" /> Fechar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {mobileCoverOptions.length > 0 && (
                <div className="p-3 bg-slate-900 border-t border-slate-700 text-center">
                  <p className="text-[10px] text-slate-400">
                    Toque em uma capa para selecioná-la
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* DIALOG: Confirmação de Cutter vazio */}
          <Dialog open={showCutterConfirmDialog} onOpenChange={setShowCutterConfirmDialog}>
            <DialogContent className="max-w-[340px] rounded-xl mx-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                  Cutter não preenchido
                </DialogTitle>
                <DialogDescription className="text-left">
                  O código Cutter está em branco. Confirme se esta obra realmente não possui Cutter ou digite o código manualmente.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                {/* Opção 1: Digitar Cutter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Digite o Cutter:</Label>
                  <Input
                    placeholder="Ex: K45d"
                    value={cutterDialogValue}
                    onChange={(e) => setCutterDialogValue(e.target.value)}
                    className="font-mono text-center text-lg h-12"
                  />
                  <Button 
                    onClick={() => handleCutterConfirm(false)}
                    disabled={!cutterDialogValue.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Check className="mr-2 h-4 w-4" /> Usar este Cutter
                  </Button>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">ou</span>
                  </div>
                </div>
                
                {/* Opção 2: Confirmar sem Cutter */}
                <div className="border rounded-lg p-3 bg-amber-50 border-amber-200">
                  <button
                    onClick={() => handleCutterConfirm(true)}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <div className="w-6 h-6 rounded border-2 border-amber-400 bg-white flex items-center justify-center shrink-0">
                      <Check className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <span className="font-medium text-amber-800 block">Sem Cutter</span>
                      <span className="text-xs text-amber-600">Esta obra não possui código Cutter</span>
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="ghost" onClick={() => setShowCutterConfirmDialog(false)}>
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Dialog de sucesso com Nº Tombo */}
      <AlertDialog open={successDialog.open} onOpenChange={(open) => setSuccessDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              {successDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line text-base text-foreground pt-2">
              {successDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSuccessDialog({ open: false, title: '', message: '' })}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}