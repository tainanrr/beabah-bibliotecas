import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Search, Plus, Pencil, Eye, Loader2, Book as BookIcon, Download, Trash2, Check, ChevronsUpDown, Settings, Globe, Upload, FileText, AlertCircle, CheckCircle2, XCircle, Info, Image, Link, X, Package, Keyboard, Smartphone, Camera, ScanBarcode, ArrowLeft, RotateCcw, Crop, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
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
  
  // Estados para upload de imagem da capa
  const [coverInputMode, setCoverInputMode] = useState<'url' | 'upload'>('url');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string>('');
  
  // Estados para Cadastro Rápido Integrado (Catálogo + Acervo)
  const [addToInventory, setAddToInventory] = useState(false);
  const [inventoryLibraryId, setInventoryLibraryId] = useState<string>("");
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
    series: "", volume: "", edition: "", translator: "", publication_place: "", country_classification: ""
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropType>({ unit: '%', width: 80, height: 90, x: 10, y: 5 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [mobileSaving, setMobileSaving] = useState(false);
  
  // Estados para cadastro de exemplares no modo mobile
  const [mobileAddToInventory, setMobileAddToInventory] = useState(false);
  const [mobileInventoryLibraryId, setMobileInventoryLibraryId] = useState("");
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
      
      // Configuração otimizada para ISBN (EAN-13)
      await html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 300, height: 200 }, // Área MAIOR para facilitar leitura
          aspectRatio: 1.0, // Quadrado para mais flexibilidade
          disableFlip: false,
          // Focar apenas em formatos de código de barras de livros
          formatsToSupport: [
            0,  // QR_CODE (backup)
            4,  // EAN_13 (ISBN-13)
            3,  // EAN_8
            12, // UPC_A
            13, // UPC_E
          ]
        },
        async (decodedText) => {
          // Validar se parece um ISBN válido
          const cleanIsbn = decodedText.replace(/[^0-9X]/gi, '');
          
          // ISBN-13 tem 13 dígitos, ISBN-10 tem 10
          if (cleanIsbn.length === 13 || cleanIsbn.length === 10) {
            // Vibrar para feedback
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            setScannedISBN(cleanIsbn);
            await stopBarcodeScanner();
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
    setMobileFormData(prev => ({ ...prev, isbn }));
    setMobileStep('review');
    
    try {
      const alternativeIsbn = convertISBN(isbn);
      
      // FASE 1: Buscar nas fontes principais (Google Books + Open Library)
      const [googleResponse, openLibraryData] = await Promise.all([
        fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`),
        fetchOpenLibraryData(isbn)
      ]);
      
      let data = await googleResponse.json();
      let hasGoogleData = data.totalItems > 0;
      let info = hasGoogleData ? data.items[0].volumeInfo : null;
      let externalData: ExternalBookData | null = null;
      
      // FASE 2: Se não encontrou, tentar fontes alternativas
      if (!hasGoogleData && !openLibraryData.title) {
        console.log("📱 Mobile: Tentando fontes alternativas...");
        
        // Tentar Brapci (API brasileira) - PRIORIDADE
        externalData = await fetchBrapciData(isbn);
        
        // Se Brapci falhou, tentar WorldCat
        if (!externalData) {
          externalData = await fetchWorldCatData(isbn);
        }
        
        // Se WorldCat falhou, tentar OpenBD
        if (!externalData) {
          externalData = await fetchOpenBDData(isbn);
        }
        
        // Tentar com ISBN alternativo
        if (!externalData && alternativeIsbn) {
          const altResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${alternativeIsbn}`);
          const altData = await altResponse.json();
          if (altData.totalItems > 0) {
            data = altData;
            hasGoogleData = true;
            info = altData.items[0].volumeInfo;
          } else {
            const altOpenLibrary = await fetchOpenLibraryData(alternativeIsbn);
            if (altOpenLibrary.title || altOpenLibrary.author) {
              Object.assign(openLibraryData, altOpenLibrary);
            }
          }
        }
        
        // Tentar busca específica BR no Google
        if (!externalData && !hasGoogleData && !openLibraryData.title) {
          externalData = await fetchMercadoEditorialData(isbn);
        }
      }
      
      const getBest = (googleValue: any, openLibraryValue: string, externalValue?: string): string => {
        if (googleValue && String(googleValue).trim()) return String(googleValue);
        if (openLibraryValue && openLibraryValue.trim()) return openLibraryValue;
        if (externalValue && externalValue.trim()) return externalValue;
        return "";
      };
      
      const title = getBest(info?.title, openLibraryData.title, externalData?.title).toUpperCase();
      const author = getBest(info?.authors?.join(", "), openLibraryData.author, externalData?.author).toUpperCase();
      const publisher = getBest(info?.publisher, openLibraryData.publisher, externalData?.publisher);
      const category = translateCategory(info?.categories?.[0] || "") || openLibraryData.category || externalData?.category || "";
      
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
      const subtitle = getBest(info?.subtitle, "", "").toUpperCase();
      const publication_date = info?.publishedDate || openLibraryData.publication_date || "";
      const page_count = info?.pageCount?.toString() || openLibraryData.page_count || "";
      const language = info?.language || "pt-BR";
      const description = sanitizeDescription(getBest(info?.description, openLibraryData.description || "", ""));
      
      setMobileFormData({
        isbn,
        title,
        subtitle,
        author,
        publisher,
        cover_url: coverUrl,
        category,
        cutter,
        publication_date,
        page_count,
        language,
        description,
        series: "",
        volume: "",
        edition: "",
        translator: "",
        publication_place: "",
        country_classification: "BRA - Brasil"
      });
      
      // Pré-selecionar biblioteca do usuário
      if (user?.role === 'bibliotecario' && user.library_id) {
        setMobileInventoryLibraryId(user.library_id);
      }
      
      if (!title && !author) {
        toast({ title: "ISBN não encontrado", description: "Preencha os dados manualmente", variant: "destructive" });
      } else {
        toast({ title: "Encontrado!", description: "Verifique os dados e complete o cadastro" });
      }
    } catch (err) {
      toast({ title: "Erro na busca", description: "Não foi possível buscar dados do ISBN", variant: "destructive" });
    }
  };
  
  // Iniciar câmera para foto da capa
  const startCamera = async () => {
    setMobileStep('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 1920 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível acessar a câmera", variant: "destructive" });
      setMobileStep('review');
    }
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
        setMobileStep('crop');
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
    if (!imgRef.current || !completedCrop || !canvasRef.current) return;
    
    const image = imgRef.current;
    const canvas = canvasRef.current;
    const crop = completedCrop;
    
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Tamanho final da imagem cortada (máximo 800px de largura mantendo proporção)
    const maxWidth = 800;
    const cropWidthOriginal = crop.width * scaleX;
    const cropHeightOriginal = crop.height * scaleY;
    const ratio = cropWidthOriginal / cropHeightOriginal;
    
    const finalWidth = Math.min(maxWidth, cropWidthOriginal);
    const finalHeight = finalWidth / ratio;
    
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      cropWidthOriginal,
      cropHeightOriginal,
      0,
      0,
      finalWidth,
      finalHeight
    );
    
    // Converter para blob e tentar upload
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      try {
        // Tentar upload no Supabase Storage (bucket 'books')
        const fileName = `book-covers/cover_${Date.now()}_${mobileFormData.isbn || 'manual'}.jpg`;
        const { data, error } = await (supabase as any).storage
          .from('books')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
        
        if (!error && data) {
          // Upload bem sucedido - usar URL pública
          const { data: urlData } = (supabase as any).storage.from('books').getPublicUrl(fileName);
          setMobileFormData(prev => ({ ...prev, cover_url: urlData.publicUrl }));
          setCapturedImage(null);
          setMobileStep('review');
          toast({ title: "✅ Capa salva!", description: "Imagem enviada com sucesso" });
          return;
        }
        
        // Fallback: Se o storage falhar, usar Base64
        console.warn('Storage upload failed, using Base64:', error);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        setMobileFormData(prev => ({ ...prev, cover_url: base64 }));
        setCapturedImage(null);
        setMobileStep('review');
        toast({ title: "Capa salva localmente", description: "Imagem processada com sucesso" });
        
      } catch (err: any) {
        console.error('Upload error:', err);
        // Fallback final: Base64
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        setMobileFormData(prev => ({ ...prev, cover_url: base64 }));
        setCapturedImage(null);
        setMobileStep('review');
        toast({ title: "Capa salva localmente", description: "Configure o Storage do Supabase para URLs permanentes" });
      }
    }, 'image/jpeg', 0.85);
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
          setMobileStep('crop');
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
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    
    // Validar acervo se marcado
    if (mobileAddToInventory && !mobileInventoryLibraryId) {
      toast({ title: "Selecione uma biblioteca", description: "Para adicionar ao acervo, selecione a biblioteca", variant: "destructive" });
      return;
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
      const payload = {
        isbn: mobileFormData.isbn || null,
        title: mobileFormData.title,
        subtitle: mobileFormData.subtitle || null,
        author: mobileFormData.author || null,
        publisher: mobileFormData.publisher || null,
        cover_url: mobileFormData.cover_url || null,
        category: mobileFormData.category || null,
        cutter: mobileFormData.cutter || null,
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
        
        for (const copy of mobileInventoryCopies) {
          let finalTombo = copy.tombo;
          
          // Gerar tombo automático se marcado
          if (copy.autoTombo) {
            const { data: maxTomboData } = await (supabase as any)
              .from('copies')
              .select('tombo')
              .eq('library_id', mobileInventoryLibraryId)
              .ilike('tombo', 'B%')
              .order('tombo', { ascending: false })
              .limit(100);
            
            let nextNum = 1;
            if (maxTomboData && maxTomboData.length > 0) {
              const nums = maxTomboData.map((c: any) => parseInt(c.tombo?.replace('B', '') || '0')).filter((n: number) => !isNaN(n));
              if (nums.length > 0) nextNum = Math.max(...nums) + 1;
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
            local_categories: copy.colors
          };
          
          const { error: copyError } = await (supabase as any).from('copies').insert(copyPayload);
          if (!copyError) copiesCreated++;
        }
        
        if (copiesCreated > 0) {
          toast({ title: "✅ Livro + Acervo!", description: `${mobileFormData.title} + ${copiesCreated} exemplar(es)` });
        }
      } else {
        toast({ title: "✅ Livro cadastrado!", description: mobileFormData.title });
      }
      
      // Resetar para próximo cadastro
      resetMobileForm();
      setMobileStep('scan');
      fetchBooks();
      
      // Reiniciar scanner automaticamente
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
    setMobileAddToInventory(false);
    setMobileInventoryQty(1);
    setMobileInventoryCopies([{ tombo: "", autoTombo: false, process_stamped: true, process_indexed: true, process_taped: true, colors: [] }]);
    setMobileActiveTab('principal');
    setCapturedImage(null);
  };
  
  // Fechar modo mobile
  const closeMobileMode = () => {
    stopBarcodeScanner();
    stopCamera();
    setIsMobileMode(false);
    setMobileStep('scan');
    resetMobileForm();
  };

  const fetchBooks = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('books') 
      .select('*, copies(id, status, library_id, libraries(name))')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      // Catálogo mostra TODAS as obras para todos os usuários
      // O filtro por biblioteca é feito apenas no Acervo (Inventory)
      setBooks(data);
      calculateCategoryStats(data);
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
      "Essays": "Ensaios",
      "Criticism": "Crítica",
      "Literary Criticism": "Crítica Literária",
      "Philosophy": "Filosofia",
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
  }

  // Interface para dados de outras APIs
  interface ExternalBookData {
    title: string;
    author: string;
    publisher: string;
    publication_date: string;
    cover: string;
    description: string;
    page_count: string;
    category: string;
    source: string;
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

  // Função para buscar dados na WorldCat via xISBN
  const fetchWorldCatData = async (isbn: string): Promise<ExternalBookData | null> => {
    try {
      // WorldCat xISBN - retorna ISBNs relacionados e metadados básicos
      const response = await fetch(`https://xisbn.worldcat.org/webservices/xid/isbn/${isbn}?method=getMetadata&format=json&fl=*`);
      if (response.ok) {
        const data = await response.json();
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
    } catch (e) {
      console.log("WorldCat não encontrou o livro");
    }
    return null;
  };

  // Função para buscar dados na API Brapci (brasileira, gratuita)
  const fetchBrapciData = async (isbn: string): Promise<ExternalBookData | null> => {
    try {
      // API Brapci - base de dados brasileira de livros
      const response = await fetch(`https://cip.brapci.inf.br/api/book/isbn/${isbn}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && (data.title || data.titulo)) {
          return {
            title: data.title || data.titulo || "",
            author: data.author || data.autor || (data.authors ? data.authors.join(", ") : "") || "",
            publisher: data.publisher || data.editora || "",
            publication_date: data.year || data.ano || data.publication_date || "",
            cover: data.cover || data.capa || "",
            description: data.description || data.descricao || data.sinopse || "",
            page_count: data.pages || data.paginas || "",
            category: data.subject || data.assunto || data.category || "",
            source: "Brapci"
          };
        }
      }
    } catch (e) {
      console.log("Brapci não encontrou o livro");
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
          // Se tem cover_i, podemos construir a URL da capa
          if (doc.cover_i) {
            return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
          }
          // Se tem ISBN, tentar pela capa do ISBN
          if (doc.isbn && doc.isbn[0]) {
            const coverUrl = `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`;
            // Verificar se a capa existe
            const coverCheck = await fetch(coverUrl, { method: 'HEAD' });
            if (coverCheck.ok && coverCheck.headers.get('content-length') !== '43') {
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
      category: ""
    };
    
    // 1. Verificar se a capa existe
    const openLibraryCover = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    try {
      const coverResponse = await fetch(openLibraryCover, { method: 'HEAD' });
      if (coverResponse.ok && coverResponse.headers.get('content-length') !== '43') {
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
                // Pegar o primeiro assunto e traduzir se possível
                const subject = workData.subjects[0];
                result.category = translateCategory(subject);
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

    try {
      // ESTRATÉGIA DE BUSCA EM CASCATA:
      // 1. Google Books + Open Library (em paralelo)
      // 2. Se não encontrar, tentar WorldCat
      // 3. Se não encontrar, tentar OpenBD
      // 4. Se não encontrar, tentar com ISBN convertido (10<->13)
      // 5. Se não encontrar, busca específica BR
      
      console.log(`🔍 Buscando ISBN: ${cleanIsbn}`);
      
      // Fase 1: Buscar dados do Google Books e Open Library em paralelo
      const [googleResponse, openLibraryData] = await Promise.all([
        fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`),
        fetchOpenLibraryData(cleanIsbn)
      ]);
      
      let data = await googleResponse.json();
      let hasGoogleData = data.totalItems > 0;
      let info = hasGoogleData ? data.items[0].volumeInfo : null;
      
      // Fase 2: Se Google Books não encontrou, tentar fontes alternativas
      let externalData: ExternalBookData | null = null;
      let sourcesUsed: string[] = [];
      
      if (hasGoogleData) {
        sourcesUsed.push("Google Books");
      }
      if (openLibraryData.title || openLibraryData.author) {
        sourcesUsed.push("Open Library");
      }
      
      // Se nenhuma fonte principal encontrou, tentar alternativas
      if (!hasGoogleData && !openLibraryData.title) {
        console.log("📚 Fontes principais não encontraram, tentando alternativas...");
        
        // Tentar Brapci (API brasileira gratuita) - PRIORIDADE para livros BR
        externalData = await fetchBrapciData(cleanIsbn);
        if (externalData) {
          console.log("✅ Encontrado na Brapci (BR)");
          sourcesUsed.push("Brapci");
        }
        
        // Se Brapci falhou, tentar WorldCat
        if (!externalData) {
          externalData = await fetchWorldCatData(cleanIsbn);
          if (externalData) {
            console.log("✅ Encontrado no WorldCat");
            sourcesUsed.push("WorldCat");
          }
        }
        
        // Se WorldCat falhou, tentar OpenBD
        if (!externalData) {
          externalData = await fetchOpenBDData(cleanIsbn);
          if (externalData) {
            console.log("✅ Encontrado no OpenBD");
            sourcesUsed.push("OpenBD");
          }
        }
        
        // Se ainda não encontrou, tentar com ISBN convertido
        if (!externalData && alternativeIsbn) {
          console.log(`🔄 Tentando ISBN alternativo: ${alternativeIsbn}`);
          
          // Tentar Google Books com ISBN alternativo
          const altResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${alternativeIsbn}`);
          const altData = await altResponse.json();
          if (altData.totalItems > 0) {
            data = altData;
            hasGoogleData = true;
            info = altData.items[0].volumeInfo;
            sourcesUsed.push("Google Books (ISBN alt)");
            console.log("✅ Encontrado com ISBN alternativo no Google Books");
          } else {
            // Tentar Open Library com ISBN alternativo
            const altOpenLibrary = await fetchOpenLibraryData(alternativeIsbn);
            if (altOpenLibrary.title || altOpenLibrary.author) {
              Object.assign(openLibraryData, altOpenLibrary);
              sourcesUsed.push("Open Library (ISBN alt)");
              console.log("✅ Encontrado com ISBN alternativo no Open Library");
            }
          }
        }
        
        // Se ainda não encontrou, tentar busca específica BR no Google
        if (!externalData && !hasGoogleData && !openLibraryData.title) {
          externalData = await fetchMercadoEditorialData(cleanIsbn);
          if (externalData) {
            console.log("✅ Encontrado na busca BR");
            sourcesUsed.push("Google Books BR");
          }
        }
      }
      
      const googleCategory = info ? translateCategory(info.categories ? info.categories[0] : "") : "";
      
      // Função auxiliar para pegar o melhor valor (Google Books, Open Library ou fonte externa)
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
      
      // Determinar os melhores valores de cada campo
      // Título, subtítulo e autor em CAIXA ALTA
      const bestTitle = getBest(info?.title, openLibraryData.title, externalData?.title).toUpperCase();
      const bestSubtitle = getBest(info?.subtitle, openLibraryData.subtitle).toUpperCase();
      const bestAuthor = getBest(info?.authors?.join(", "), openLibraryData.author, externalData?.author).toUpperCase();
      const bestPublisher = getBest(info?.publisher, openLibraryData.publisher, externalData?.publisher);
      const bestPublicationDate = getBest(info?.publishedDate, openLibraryData.publication_date, externalData?.publication_date);
      const bestPageCount = getBest(info?.pageCount, openLibraryData.page_count, externalData?.page_count);
      const bestLanguage = getBest(info?.language, openLibraryData.language) || "pt-BR";
      
      // Traduzir categoria/assunto se necessário
      const rawCategory = getBest(googleCategory, openLibraryData.category, externalData?.category);
      const bestCategory = await translateCategoryAsync(rawCategory);
      const categoryWasTranslated = rawCategory && bestCategory !== rawCategory;
      
      // Descrição precisa de sanitização especial e possível tradução
      let bestDescription = sanitizeDescription(info?.description || "");
      let descriptionWasTranslated = false;
      
      if (!bestDescription && openLibraryData.description) {
        bestDescription = openLibraryData.description;
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
      
      // Gerar Cutter automaticamente baseado no autor e título
      // Usando tabela Cutter-Sanborn (https://www.tabelacutter.com/)
      const bestCutter = bestAuthor ? generateCutter(bestAuthor, bestTitle) : "";
      
      // Verificar se encontrou algum dado útil
      const hasAnyData = bestTitle || bestAuthor || bestCoverUrl || bestDescription || externalData;
      
      if (hasAnyData) {
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
          cutter: bestCutter,
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
            .like('tombo', 'B%')
            .order('tombo', { ascending: false });
          
          if (copiesWithB && copiesWithB.length > 0) {
            for (const copy of copiesWithB) {
              if (copy.tombo && copy.tombo.startsWith('B')) {
                const numStr = copy.tombo.replace('B', '');
                const num = parseInt(numStr) || 0;
                if (num >= nextAutoNumber) {
                  nextAutoNumber = num + 1;
                }
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
            local_categories: inventoryColors
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

      // Mensagem de sucesso
      let successMsg = "Obra salva no Catálogo.";
      if (copiesCreated > 0) {
        const libName = libraries.find(l => l.id === inventoryLibraryId)?.name || "biblioteca";
        const tombosStr = createdTombos.length <= 3 
          ? createdTombos.join(", ") 
          : `${createdTombos.slice(0, 3).join(", ")}...`;
        successMsg = `Obra salva! ${copiesCreated} exemplar(es) criado(s) em "${libName}". Tombos: ${tombosStr}`;
      }
      
      toast({ title: "✅ Sucesso", description: successMsg, duration: 5000 });
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
    setCoverPreview('');
    setCoverInputMode('url');
    // Manter biblioteca selecionada e checkbox para cadastros em sequência
    // Resetar lista de exemplares (Auto DESMARCADO por padrão)
    setInventoryItems([{ id: 1, tombo: '', autoTombo: false }]);
    // Resetar processamento (todos marcados) e cores
    setInventoryProcessing({ stamped: true, indexed: true, taped: true });
    setInventoryColors([]);
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
      country_classification: book.country_classification || ""
    });
    // Definir preview da capa existente
    setCoverPreview(book.cover_url || '');
    setCoverInputMode('url');
    setIsModalOpen(true);
  };

  const handleViewDetails = (book: any) => {
    const librariesMap = new Map();
    const allCopies = book.copies || [];
    
    // Mostrar TODAS as bibliotecas da rede
    allCopies.forEach((copy: any) => {
      const libName = copy.libraries?.name || "Desconhecida";
      const libId = copy.library_id;
      if (!librariesMap.has(libId)) {
        librariesMap.set(libId, { name: libName, total: 0, disponivel: 0, isMyLibrary: libId === user?.library_id });
      }
      const libData = librariesMap.get(libId);
      libData.total += 1;
      if (copy.status === 'disponivel') libData.disponivel += 1;
    });

    const details = Array.from(librariesMap.values())
      .sort((a, b) => {
        // Minha biblioteca primeiro
        if (a.isMyLibrary) return -1;
        if (b.isMyLibrary) return 1;
        return a.name.localeCompare(b.name);
      });
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
            onClick={() => { setIsMobileMode(true); setTimeout(() => startBarcodeScanner(), 300); }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600 w-full sm:w-auto"
          >
            <Smartphone className="mr-2 h-4 w-4" /> Modo Rápido 📱
          </Button>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Nova Obra
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
          placeholder="Pesquisar por título, autor ou ISBN..." 
          className="border-none focus-visible:ring-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista de livros - Cards em mobile, Tabela em desktop */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando catálogo...</div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Nenhuma obra encontrada.</div>
      ) : (
        <>
          {/* MOBILE: Cards */}
          <div className="md:hidden space-y-3">
            {filteredBooks.map((book) => {
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
                      {book.cover_url ? (
                        <img src={book.cover_url} className="h-20 w-14 object-cover rounded border" />
                      ) : (
                        <div className="h-20 w-14 bg-slate-100 rounded border flex items-center justify-center">
                          <BookIcon className="h-6 w-6 text-slate-300"/>
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{book.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{book.author || "Autor não informado"}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="outline" className="text-[10px]">{book.category || "Geral"}</Badge>
                        {book.cutter && <Badge variant="secondary" className="text-[10px] font-mono">{book.cutter}</Badge>}
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
                  <TableHead className="text-center bg-blue-50 text-blue-700 w-[70px]">Rede</TableHead>
                  <TableHead className="text-center bg-blue-50 text-blue-700 w-[70px]">Disp.</TableHead>
                  <TableHead className="text-center bg-green-50 text-green-700 w-[70px]">Local</TableHead>
                  <TableHead className="text-center bg-green-50 text-green-700 w-[70px]">Disp.</TableHead>
                  <TableHead className="text-right w-[110px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.map((book) => {
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
                        {book.cover_url ? <img src={book.cover_url} className="h-12 w-9 object-cover rounded border" /> : <div className="h-12 w-9 bg-slate-100 rounded flex items-center justify-center"><BookIcon className="h-4 w-4 text-slate-300"/></div>}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{book.isbn || "-"}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm line-clamp-1">{book.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{book.author}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{book.category || "Geral"}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{book.cutter || "-"}</TableCell>
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
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="flex items-center gap-2">
                    ISBN
                    <span className="text-[10px] text-muted-foreground font-normal">(Enter = buscar)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      ref={isbnInputRef}
                      value={formData.isbn} 
                      onChange={e=>setFormData({...formData, isbn:e.target.value})} 
                      placeholder="Digite e pressione Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && formData.isbn && !searchingISBN) {
                          e.preventDefault();
                          handleSearchISBN();
                        }
                      }}
                    />
                    <Button onClick={handleSearchISBN} disabled={searchingISBN} title="Buscar dados do livro">
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
                      onClick={() => setCoverInputMode('url')}
                      className="h-7 text-xs"
                    >
                      <Link className="h-3 w-3 mr-1" />
                      URL
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={coverInputMode === 'upload' ? 'default' : 'ghost'}
                      onClick={() => setCoverInputMode('upload')}
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
                    ) : (
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
                    )}
                  </div>
                </div>
              </div>
              
              {/* Código Cutter - Gerado automaticamente */}
              <div className="space-y-2">
                <Label className="font-medium">Código Cutter</Label>
                <Input 
                  value={formData.cutter} 
                  onChange={e => setFormData({...formData, cutter: e.target.value.toUpperCase()})}
                  placeholder="Ex: K45d"
                  className="font-mono max-w-[200px]"
                />
                <p className="text-xs text-muted-foreground">
                  Gerado automaticamente ao buscar pelo ISBN. Pode ser editado.
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
                  {/* Seleção da Biblioteca */}
                  <div className="space-y-1 max-w-xs">
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
                                    const search = copyColorsSearch.toLowerCase();
                                    return (
                                      c.books?.title?.toLowerCase().includes(search) ||
                                      c.books?.author?.toLowerCase().includes(search) ||
                                      c.books?.isbn?.includes(search) ||
                                      c.local_categories?.some((cat: string) => cat.toLowerCase().includes(search))
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
                                          {copy.books?.author || "Autor desconhecido"} {copy.books?.isbn ? `• ISBN: ${copy.books.isbn}` : ""}
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
                      <div className="flex flex-wrap gap-1 p-2 border rounded bg-white max-h-[120px] overflow-y-auto">
                        {(() => {
                          // Agrupar cores por grupo
                          const colorsByGroup: Record<string, any[]> = {};
                          libraryColors.forEach(c => {
                            const group = c.color_group || 'Geral';
                            if (!colorsByGroup[group]) colorsByGroup[group] = [];
                            colorsByGroup[group].push(c);
                          });
                          
                          return Object.entries(colorsByGroup).map(([group, colors]) => (
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

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Disponibilidade: {selectedBookDetails?.title}</DialogTitle></DialogHeader>
          {selectedBookDetails?.libraries.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Nenhum exemplar cadastrado na rede.</p>
          ) : (
          <Table>
            <TableHeader>
                <TableRow>
                  <TableHead>Biblioteca</TableHead>
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
      
      {/* ============ MODO MOBILE ============ */}
      {isMobileMode && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header fixo */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={closeMobileMode} className="text-white hover:bg-white/20 p-2">
                <X className="h-5 w-5" />
              </Button>
              <span className="font-bold">Cadastro Rápido</span>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">
              {mobileStep === 'scan' ? 'Escanear' : mobileStep === 'review' ? 'Revisar' : 'Foto'}
            </Badge>
          </div>
          
          {/* Conteúdo */}
          <div className="flex-1 overflow-auto">
            {/* STEP 1: Scanner */}
            {mobileStep === 'scan' && (
              <div className="flex flex-col h-full">
                {/* Área do Scanner */}
                <div className="flex-1 bg-black relative min-h-[300px]">
                  <div id="barcode-reader" className="w-full h-full" />
                  
                  {!isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                      <Button 
                        onClick={startBarcodeScanner} 
                        size="lg"
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-6 text-lg"
                      >
                        <ScanBarcode className="mr-3 h-6 w-6" />
                        Abrir Câmera
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
                
                {/* Área de input manual */}
                <div className="p-4 bg-white border-t space-y-3">
                  <p className="text-center text-xs text-muted-foreground">Ou digite o ISBN manualmente:</p>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="ISBN (somente números)" 
                      value={scannedISBN}
                      onChange={(e) => setScannedISBN(e.target.value.replace(/[^0-9]/g, ''))}
                      className="flex-1 h-12 text-lg text-center"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    <Button 
                      onClick={() => scannedISBN && searchMobileISBN(scannedISBN)}
                      disabled={!scannedISBN || scannedISBN.length < 10}
                      className="h-12 px-6 bg-purple-600"
                    >
                      Buscar
                    </Button>
                  </div>
                  
                  {isScanning && (
                    <Button variant="outline" onClick={stopBarcodeScanner} className="w-full">
                      Parar Câmera
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {/* STEP 2: Review & Edit - Formulário completo */}
            {mobileStep === 'review' && (
              <div className="flex flex-col h-full">
                {/* Tabs de navegação */}
                <div className="flex border-b bg-slate-50 sticky top-0 z-10">
                  <button
                    onClick={() => setMobileActiveTab('principal')}
                    className={cn("flex-1 py-3 text-sm font-medium border-b-2 transition-colors", 
                      mobileActiveTab === 'principal' ? "border-purple-600 text-purple-600 bg-white" : "border-transparent text-muted-foreground"
                    )}
                  >
                    Principal
                  </button>
                  <button
                    onClick={() => setMobileActiveTab('detalhes')}
                    className={cn("flex-1 py-3 text-sm font-medium border-b-2 transition-colors", 
                      mobileActiveTab === 'detalhes' ? "border-purple-600 text-purple-600 bg-white" : "border-transparent text-muted-foreground"
                    )}
                  >
                    Detalhes
                  </button>
                  <button
                    onClick={() => setMobileActiveTab('acervo')}
                    className={cn("flex-1 py-3 text-sm font-medium border-b-2 transition-colors", 
                      mobileActiveTab === 'acervo' ? "border-purple-600 text-purple-600 bg-white" : "border-transparent text-muted-foreground",
                      mobileAddToInventory && "bg-green-50"
                    )}
                  >
                    Acervo {mobileAddToInventory && "✓"}
                  </button>
                </div>
                
                {/* Conteúdo das tabs */}
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  
                  {/* TAB: Principal */}
                  {mobileActiveTab === 'principal' && (
                    <>
                      {/* Capa + ISBN */}
                      <div className="flex gap-3 items-start">
                        <div 
                          className="w-20 h-28 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
                          onClick={startCamera}
                        >
                          {mobileFormData.cover_url ? (
                            <img src={mobileFormData.cover_url} className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="h-6 w-6 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="text-xs text-muted-foreground">ISBN: <span className="font-mono">{mobileFormData.isbn || '-'}</span></div>
                          <div className="flex gap-1.5">
                            <Button variant="outline" size="sm" onClick={startCamera} className="flex-1 h-8 text-xs">
                              <Camera className="mr-1 h-3 w-3" /> Câmera
                            </Button>
                            <Button variant="outline" size="sm" onClick={selectFromGallery} className="flex-1 h-8 text-xs">
                              <Image className="mr-1 h-3 w-3" /> Galeria
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Campos principais */}
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Título *</Label>
                          <Input 
                            value={mobileFormData.title}
                            onChange={(e) => setMobileFormData(p => ({ ...p, title: e.target.value.toUpperCase() }))}
                            className="h-11"
                            placeholder="TÍTULO DO LIVRO"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Subtítulo</Label>
                          <Input 
                            value={mobileFormData.subtitle}
                            onChange={(e) => setMobileFormData(p => ({ ...p, subtitle: e.target.value.toUpperCase() }))}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Autor *</Label>
                          <Input 
                            value={mobileFormData.author}
                            onChange={(e) => setMobileFormData(p => ({ ...p, author: e.target.value.toUpperCase() }))}
                            className="h-11"
                            placeholder="NOME DO AUTOR"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Editora</Label>
                            <Input 
                              value={mobileFormData.publisher}
                              onChange={(e) => setMobileFormData(p => ({ ...p, publisher: e.target.value }))}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Cutter</Label>
                            <Input 
                              value={mobileFormData.cutter}
                              onChange={(e) => setMobileFormData(p => ({ ...p, cutter: e.target.value }))}
                              className="h-10 font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Assunto/Categoria</Label>
                          <Input 
                            value={mobileFormData.category}
                            onChange={(e) => setMobileFormData(p => ({ ...p, category: e.target.value }))}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Descrição</Label>
                          <Textarea 
                            value={mobileFormData.description}
                            onChange={(e) => setMobileFormData(p => ({ ...p, description: e.target.value }))}
                            className="min-h-[80px] text-sm"
                            placeholder="Sinopse ou descrição do livro..."
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* TAB: Detalhes */}
                  {mobileActiveTab === 'detalhes' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Ano Publicação</Label>
                          <Input 
                            value={mobileFormData.publication_date}
                            onChange={(e) => setMobileFormData(p => ({ ...p, publication_date: e.target.value }))}
                            className="h-10"
                            placeholder="2024"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Páginas</Label>
                          <Input 
                            value={mobileFormData.page_count}
                            onChange={(e) => setMobileFormData(p => ({ ...p, page_count: e.target.value }))}
                            className="h-10"
                            type="number"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Idioma</Label>
                          <Select value={mobileFormData.language} onValueChange={(v) => setMobileFormData(p => ({ ...p, language: v }))}>
                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pt-BR">Português (BR)</SelectItem>
                              <SelectItem value="en">Inglês</SelectItem>
                              <SelectItem value="es">Espanhol</SelectItem>
                              <SelectItem value="fr">Francês</SelectItem>
                              <SelectItem value="de">Alemão</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Edição</Label>
                          <Input 
                            value={mobileFormData.edition}
                            onChange={(e) => setMobileFormData(p => ({ ...p, edition: e.target.value }))}
                            className="h-10"
                            placeholder="1ª"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Série</Label>
                          <Input 
                            value={mobileFormData.series}
                            onChange={(e) => setMobileFormData(p => ({ ...p, series: e.target.value }))}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Volume</Label>
                          <Input 
                            value={mobileFormData.volume}
                            onChange={(e) => setMobileFormData(p => ({ ...p, volume: e.target.value }))}
                            className="h-10"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Tradutor</Label>
                        <Input 
                          value={mobileFormData.translator}
                          onChange={(e) => setMobileFormData(p => ({ ...p, translator: e.target.value.toUpperCase() }))}
                          className="h-10"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Local de Publicação</Label>
                        <Input 
                          value={mobileFormData.publication_place}
                          onChange={(e) => setMobileFormData(p => ({ ...p, publication_place: e.target.value }))}
                          className="h-10"
                          placeholder="São Paulo"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">País de Origem</Label>
                        <Select value={mobileFormData.country_classification} onValueChange={(v) => setMobileFormData(p => ({ ...p, country_classification: v }))}>
                          <SelectTrigger className="h-10"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BRA - Brasil">Brasil</SelectItem>
                            <SelectItem value="USA - Estados Unidos">Estados Unidos</SelectItem>
                            <SelectItem value="GBR - Reino Unido">Reino Unido</SelectItem>
                            <SelectItem value="PRT - Portugal">Portugal</SelectItem>
                            <SelectItem value="ESP - Espanha">Espanha</SelectItem>
                            <SelectItem value="FRA - França">França</SelectItem>
                            <SelectItem value="DEU - Alemanha">Alemanha</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  
                  {/* TAB: Acervo */}
                  {mobileActiveTab === 'acervo' && (
                    <div className="space-y-4">
                      {/* Toggle para adicionar ao acervo */}
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                        <div>
                          <p className="font-medium text-sm">Adicionar ao Acervo</p>
                          <p className="text-xs text-muted-foreground">Criar exemplar(es) na biblioteca</p>
                        </div>
                        <Checkbox 
                          checked={mobileAddToInventory} 
                          onCheckedChange={(c) => setMobileAddToInventory(!!c)}
                        />
                      </div>
                      
                      {mobileAddToInventory && (
                        <>
                          {/* Biblioteca */}
                          <div>
                            <Label className="text-xs">Biblioteca *</Label>
                            <Select value={mobileInventoryLibraryId} onValueChange={setMobileInventoryLibraryId}>
                              <SelectTrigger className="h-10"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                              <SelectContent>
                                {libraries.map(lib => (
                                  <SelectItem key={lib.id} value={lib.id}>{lib.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Exemplares */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Exemplares ({mobileInventoryCopies.length})</Label>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-xs"
                                onClick={() => setMobileInventoryCopies([...mobileInventoryCopies, { 
                                  tombo: "", autoTombo: false, 
                                  process_stamped: true, process_indexed: true, process_taped: true, 
                                  colors: [] 
                                }])}
                              >
                                + Adicionar
                              </Button>
                            </div>
                            
                            {mobileInventoryCopies.map((copy, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 rounded-lg border space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">Exemplar #{idx + 1}</span>
                                  {mobileInventoryCopies.length > 1 && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 w-6 p-0 text-red-500"
                                      onClick={() => setMobileInventoryCopies(mobileInventoryCopies.filter((_, i) => i !== idx))}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                
                                <div className="flex gap-2 items-end">
                                  <div className="flex-1">
                                    <Label className="text-xs">Nr. Tombo</Label>
                                    <Input 
                                      value={copy.tombo}
                                      onChange={(e) => {
                                        const newCopies = [...mobileInventoryCopies];
                                        newCopies[idx].tombo = e.target.value;
                                        newCopies[idx].autoTombo = false;
                                        setMobileInventoryCopies(newCopies);
                                      }}
                                      className="h-9"
                                      placeholder={copy.autoTombo ? "Automático" : "Manual"}
                                      disabled={copy.autoTombo}
                                    />
                                  </div>
                                  <div className="flex items-center gap-1.5 pb-1">
                                    <Checkbox 
                                      checked={copy.autoTombo} 
                                      onCheckedChange={(c) => {
                                        const newCopies = [...mobileInventoryCopies];
                                        newCopies[idx].autoTombo = !!c;
                                        if (c) newCopies[idx].tombo = "";
                                        setMobileInventoryCopies(newCopies);
                                      }}
                                    />
                                    <span className="text-xs">Auto</span>
                                  </div>
                                </div>
                                
                                {/* Processamento */}
                                <div className="flex gap-3 pt-1">
                                  <label className="flex items-center gap-1.5">
                                    <Checkbox 
                                      checked={copy.process_stamped} 
                                      onCheckedChange={(c) => {
                                        const newCopies = [...mobileInventoryCopies];
                                        newCopies[idx].process_stamped = !!c;
                                        setMobileInventoryCopies(newCopies);
                                      }}
                                    />
                                    <span className="text-xs">C</span>
                                  </label>
                                  <label className="flex items-center gap-1.5">
                                    <Checkbox 
                                      checked={copy.process_indexed} 
                                      onCheckedChange={(c) => {
                                        const newCopies = [...mobileInventoryCopies];
                                        newCopies[idx].process_indexed = !!c;
                                        setMobileInventoryCopies(newCopies);
                                      }}
                                    />
                                    <span className="text-xs">I</span>
                                  </label>
                                  <label className="flex items-center gap-1.5">
                                    <Checkbox 
                                      checked={copy.process_taped} 
                                      onCheckedChange={(c) => {
                                        const newCopies = [...mobileInventoryCopies];
                                        newCopies[idx].process_taped = !!c;
                                        setMobileInventoryCopies(newCopies);
                                      }}
                                    />
                                    <span className="text-xs">L</span>
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Rodapé fixo com ações */}
                <div className="p-3 border-t bg-white space-y-2 shrink-0">
                  <Button 
                    onClick={saveMobileBook}
                    disabled={mobileSaving || !mobileFormData.title}
                    className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
                  >
                    {mobileSaving ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Salvando...</>
                    ) : (
                      <><Check className="mr-2 h-5 w-5" /> {mobileAddToInventory ? 'Salvar Livro + Acervo' : 'Salvar no Catálogo'}</>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => { 
                      resetMobileForm();
                      setMobileStep('scan'); 
                      setTimeout(() => startBarcodeScanner(), 300);
                    }}
                    className="w-full"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Escanear Outro
                  </Button>
                </div>
              </div>
            )}
            
            {/* STEP 3: Camera para Capa */}
            {mobileStep === 'camera' && (
              <div className="h-full flex flex-col bg-black">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="flex-1 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="p-4 bg-black/90 space-y-3">
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={capturePhoto}
                      size="lg"
                      className="bg-white text-black hover:bg-white/90 px-10 py-6"
                    >
                      <Camera className="mr-2 h-6 w-6" /> Tirar Foto
                    </Button>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => { stopCamera(); selectFromGallery(); }}
                      className="bg-transparent text-white border-white/50 flex-1"
                    >
                      <Image className="mr-2 h-4 w-4" /> Galeria
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => { stopCamera(); setMobileStep('review'); }}
                      className="bg-transparent text-white border-white/50 flex-1"
                    >
                      Pular
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* STEP 4: Crop */}
            {mobileStep === 'crop' && capturedImage && (
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <p className="font-medium">Ajuste o recorte da capa</p>
                  <p className="text-xs text-muted-foreground">Arraste os cantos para ajustar • Proporção 2:3</p>
                </div>
                
                <div className="border-2 border-dashed border-primary/30 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center p-2">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={2/3}
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
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => { setCapturedImage(null); startCamera(); }}
                    className="flex-1"
                  >
                    <Camera className="mr-2 h-4 w-4" /> Nova Foto
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => { setCapturedImage(null); selectFromGallery(); }}
                    className="flex-1"
                  >
                    <Image className="mr-2 h-4 w-4" /> Galeria
                  </Button>
                </div>
                <Button 
                  onClick={applyCropAndUpload}
                  className="w-full bg-green-600 hover:bg-green-700 py-6"
                  size="lg"
                >
                  <Check className="mr-2 h-5 w-5" /> Usar Esta Capa
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}