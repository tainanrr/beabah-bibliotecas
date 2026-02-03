import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Search,
  BookOpen,
  MapPin,
  Library,
  ArrowRight,
  Users,
  UserCircle,
  Building2,
  Eye,
  Phone,
  Navigation,
  Clock,
  ExternalLink,
  Calendar,
  Sparkles,
  FileText,
  Calendar as CalendarIcon,
  Globe,
  Tag,
  Info,
  Instagram,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

// Fix para o ícone padrão do Leaflet no React
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Componente para controlar o centro do mapa com animação flyTo
function MapController({ center, zoom = 15 }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  }, [center, zoom, map]);
  return null;
}

type Book = Tables<'books'>;
type Copy = Tables<'copies'>;
type Library = Tables<'libraries'>;

type BookWithAvailability = Book & {
  totalCopies?: number;
  availableCopies?: number;
  cover_url?: string;
};

type LibraryAvailability = {
  libraryId: string;
  libraryName: string;
  totalCopies: number;
  availableCopies: number;
  categories?: string[]; // Categorias locais dos exemplares desta biblioteca
};

type LibraryWithLocation = Library & {
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
};

type Event = {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  expected_audience: number;
  actual_audience: number | null;
  status: 'agendado' | 'realizado' | 'cancelado';
  banner_url: string | null;
  library_id: string;
  created_at: string;
  updated_at: string;
};

type EventWithLibrary = Event & {
  library?: {
    name: string;
  } | null;
  libraries?: Array<{
    id: string;
    name: string;
  }>;
};

// Função para gerar cores baseadas no título do livro (cores Beabah!)
const getBookColor = (title: string) => {
  const colors = [
    'from-slate-800 to-blue-900',
    'from-purple-500 to-violet-600',
    'from-lime-400 to-green-500',
    'from-red-500 to-rose-600',
    'from-blue-800 to-slate-900',
    'from-purple-600 to-pink-500',
  ];
  const index = title.charCodeAt(0) % colors.length;
  return colors[index];
};

// Função para obter iniciais do título
const getInitials = (title: string) => {
  const words = title.split(' ').filter(w => w.length > 0);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return title.substring(0, 2).toUpperCase();
};

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLibrary, setSelectedLibrary] = useState<string>('all');
  const [books, setBooks] = useState<BookWithAvailability[]>([]);
  const [allLibraries, setAllLibraries] = useState<LibraryWithLocation[]>([]);
  const [libraries, setLibraries] = useState<LibraryWithLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [libraryAvailability, setLibraryAvailability] = useState<LibraryAvailability[]>([]);
  const [libraryColors, setLibraryColors] = useState<any[]>([]);
  const [bookCopies, setBookCopies] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMapLibrary, setSelectedMapLibrary] = useState<LibraryWithLocation | null>(null);
  const [activeTab, setActiveTab] = useState("acervo");
  const [allEvents, setAllEvents] = useState<EventWithLibrary[]>([]);
  const [events, setEvents] = useState<EventWithLibrary[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithLibrary | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    libraries: 0,
    books: 0,
    copies: 0,
    readers: 0,
  });
  const [appearanceConfig, setAppearanceConfig] = useState({
    network_logo: "",
    favicon: "",
    cover_image: "",
    primary_color: "#1e293b",
    secondary_color: "#1e40af",
    accent_color: "#84cc16",
    tertiary_color: "#a855f7",
  });

  // Funções de filtro (definidas antes dos useEffects)
  const filterLibraries = () => {
    let filtered = [...allLibraries];

    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lib => 
        lib.name.toLowerCase().includes(query) ||
        lib.city.toLowerCase().includes(query) ||
        ((lib as any).address && (lib as any).address.toLowerCase().includes(query)) ||
        ((lib as any).phone && (lib as any).phone.includes(query))
      );
    }

    // Filtrar por biblioteca selecionada (se não for "all")
    if (selectedLibrary !== 'all') {
      filtered = filtered.filter(lib => lib.id === selectedLibrary);
    }

    setLibraries(filtered);
  };

  const filterEvents = () => {
    let filtered = [...allEvents];

    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => {
        const libraryNames = event.libraries 
          ? event.libraries.map(l => l.name.toLowerCase()).join(' ')
          : (event.library?.name?.toLowerCase() || '');
        return (
          event.title.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.category.toLowerCase().includes(query) ||
          libraryNames.includes(query)
        );
      });
    }

    // Filtrar por biblioteca selecionada (se não for "all")
    if (selectedLibrary !== 'all') {
      filtered = filtered.filter(event => {
        // Verificar se o evento está vinculado à biblioteca selecionada
        if (event.libraries && event.libraries.length > 0) {
          return event.libraries.some(lib => lib.id === selectedLibrary);
        }
        // Fallback para library_id antigo
        return event.library_id === selectedLibrary;
      });
    }

    setEvents(filtered);
  };

  useEffect(() => {
    loadLibraries();
    loadBooks();
    loadStats();
    loadEvents();
    loadAppearanceConfig();
    // Atualizar título da página
    document.title = 'Beabah! - Rede de Bibliotecas Comunitárias do Rio Grande do Sul';
  }, []);

  const loadAppearanceConfig = async () => {
    try {
      // Tentar buscar do banco
      const { data, error } = await (supabase as any)
        .from('appearance_config')
        .select('*')
        .eq('id', 'global')
        .single();

      if (data && !error) {
        console.log('Configurações carregadas na página inicial:', data);
        setAppearanceConfig({
          network_logo: data.network_logo || "",
          favicon: data.favicon || "",
          cover_image: data.cover_image || "",
          primary_color: data.primary_color || "#1e293b",
          secondary_color: data.secondary_color || "#1e40af",
          accent_color: data.accent_color || "#84cc16",
          tertiary_color: data.tertiary_color || "#a855f7",
        });
        
        // Atualizar favicon se existir
        if (data.favicon) {
          // Função para criar favicon arredondado
          const createRoundedFavicon = (imageUrl: string) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const size = 64; // Tamanho do canvas (maior = melhor qualidade)
              canvas.width = size;
              canvas.height = size;
              const ctx = canvas.getContext('2d');
              
              if (ctx) {
                // Criar clipping path circular
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
                ctx.clip();
                
                // Desenhar a imagem
                ctx.drawImage(img, 0, 0, size, size);
                
                // Converter para data URL e atualizar favicon
                const dataUrl = canvas.toDataURL('image/png');
                
                // Remover todos os links de favicon existentes
                const existingLinks = document.querySelectorAll("link[rel*='icon']");
                existingLinks.forEach(link => link.remove());

                // Criar novo link de favicon
                const link = document.createElement('link');
                link.rel = 'icon';
                link.type = 'image/png';
                link.href = dataUrl;
                document.getElementsByTagName('head')[0].appendChild(link);
              }
            };
            img.onerror = () => {
              // Fallback: usar imagem original se falhar
              const existingLinks = document.querySelectorAll("link[rel*='icon']");
              existingLinks.forEach(link => link.remove());
              const link = document.createElement('link');
              link.rel = 'icon';
              link.type = 'image/x-icon';
              link.href = imageUrl;
              document.getElementsByTagName('head')[0].appendChild(link);
            };
            img.src = imageUrl;
          };
          
          createRoundedFavicon(data.favicon);
        }
        // Atualizar título da página
        document.title = 'Beabah! - Rede de Bibliotecas Comunitárias do Rio Grande do Sul';
      } else if (error) {
        console.log('Erro ao carregar do banco na página inicial, usando localStorage:', error);
        // Fallback para localStorage
        const saved = localStorage.getItem('beabah_appearance_config');
        if (saved) {
          const config = JSON.parse(saved);
          setAppearanceConfig({
            network_logo: config.network_logo || "",
            favicon: config.favicon || "",
            cover_image: config.cover_image || "",
            primary_color: config.primary_color || "#1e293b",
            secondary_color: config.secondary_color || "#1e40af",
            accent_color: config.accent_color || "#84cc16",
            tertiary_color: config.tertiary_color || "#a855f7",
          });
          if (config.favicon) {
            // Função para criar favicon arredondado
            const createRoundedFavicon = (imageUrl: string) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const size = 64;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                
                if (ctx) {
                  ctx.beginPath();
                  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
                  ctx.clip();
                  ctx.drawImage(img, 0, 0, size, size);
                  
                  const dataUrl = canvas.toDataURL('image/png');
                  const existingLinks = document.querySelectorAll("link[rel*='icon']");
                  existingLinks.forEach(link => link.remove());
                  const link = document.createElement('link');
                  link.rel = 'icon';
                  link.type = 'image/png';
                  link.href = dataUrl;
                  document.getElementsByTagName('head')[0].appendChild(link);
                }
              };
              img.onerror = () => {
                const existingLinks = document.querySelectorAll("link[rel*='icon']");
                existingLinks.forEach(link => link.remove());
                const link = document.createElement('link');
                link.rel = 'icon';
                link.type = 'image/x-icon';
                link.href = imageUrl;
                document.getElementsByTagName('head')[0].appendChild(link);
              };
              img.src = imageUrl;
            };
            
            createRoundedFavicon(config.favicon);
          }
        }
      }
    } catch (error) {
      // Fallback para localStorage
      const saved = localStorage.getItem('beabah_appearance_config');
      if (saved) {
        const config = JSON.parse(saved);
        setAppearanceConfig({
          network_logo: config.network_logo || "",
          favicon: config.favicon || "",
          cover_image: config.cover_image || "",
          primary_color: config.primary_color || "#1e293b",
          secondary_color: config.secondary_color || "#1e40af",
          accent_color: config.accent_color || "#84cc16",
          tertiary_color: config.tertiary_color || "#a855f7",
        });
        if (config.favicon) {
          // Função para criar favicon arredondado
          const createRoundedFavicon = (imageUrl: string) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const size = 64;
              canvas.width = size;
              canvas.height = size;
              const ctx = canvas.getContext('2d');
              
              if (ctx) {
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
                ctx.clip();
                ctx.drawImage(img, 0, 0, size, size);
                
                const dataUrl = canvas.toDataURL('image/png');
                const existingLinks = document.querySelectorAll("link[rel*='icon']");
                existingLinks.forEach(link => link.remove());
                const link = document.createElement('link');
                link.rel = 'icon';
                link.type = 'image/png';
                link.href = dataUrl;
                document.getElementsByTagName('head')[0].appendChild(link);
              }
            };
            img.onerror = () => {
              const existingLinks = document.querySelectorAll("link[rel*='icon']");
              existingLinks.forEach(link => link.remove());
              const link = document.createElement('link');
              link.rel = 'icon';
              link.type = 'image/x-icon';
              link.href = imageUrl;
              document.getElementsByTagName('head')[0].appendChild(link);
            };
            img.src = imageUrl;
          };
          
          createRoundedFavicon(config.favicon);
        }
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'acervo') {
      loadBooks();
    } else if (activeTab === 'bibliotecas') {
      filterLibraries();
    } else if (activeTab === 'agenda') {
      filterEvents();
    }
  }, [searchQuery, selectedLibrary, activeTab]);

  // Aplicar filtros quando a aba mudar
  useEffect(() => {
    if (activeTab === 'bibliotecas') {
      filterLibraries();
    } else if (activeTab === 'agenda') {
      filterEvents();
    }
  }, [activeTab]);

  const loadLibraries = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('libraries')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setAllLibraries((data || []) as LibraryWithLocation[]);
      setLibraries((data || []) as LibraryWithLocation[]);
    } catch (error) {
      console.error('Erro ao carregar bibliotecas:', error);
    }
  };

  const loadStats = async () => {
    try {
      const [librariesResult, booksResult, copiesResult, readersResult] = await Promise.all([
        supabase.from('libraries').select('id', { count: 'exact' }).eq('active', true),
        supabase.from('books').select('id', { count: 'exact' }),
        supabase.from('copies').select('id', { count: 'exact' }),
        supabase.from('users_profile').select('id', { count: 'exact' }).eq('role', 'leitor').eq('active', true),
      ]);

      setStats({
        libraries: librariesResult.count || 0,
        books: booksResult.count || 0,
        copies: copiesResult.count || 0,
        readers: readersResult.count || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadEvents = async () => {
    try {
      setEventsLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { data, error } = await (supabase as any)
        .from('events')
        .select('*, libraries(name)')
        .gte('date', todayISO)
        .neq('status', 'cancelado')
        .order('date', { ascending: true });

      if (error) throw error;

      const eventsData = (data || []) as EventWithLibrary[];

      // Carregar bibliotecas vinculadas através da tabela event_libraries
      if (eventsData.length > 0) {
        const eventIds = eventsData.map(e => e.id);
        const { data: eventLibrariesData } = await (supabase as any)
          .from('event_libraries')
          .select('event_id, library_id, libraries(id, name)')
          .in('event_id', eventIds);

        // Mapear bibliotecas para cada evento
        const librariesMap: Record<string, Array<{ id: string; name: string }>> = {};
        if (eventLibrariesData) {
          eventLibrariesData.forEach((el: any) => {
            if (!librariesMap[el.event_id]) {
              librariesMap[el.event_id] = [];
            }
            if (el.libraries) {
              librariesMap[el.event_id].push({
                id: el.libraries.id,
                name: el.libraries.name,
              });
            }
          });
        }

        // Adicionar bibliotecas aos eventos
        eventsData.forEach(event => {
          event.libraries = librariesMap[event.id] || [];
        });
      }

      setAllEvents(eventsData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const loadBooks = async () => {
    try {
      setLoading(true);
      
      // Construir query com INNER JOIN para garantir que só retorne livros com cópias
      let query = supabase
        .from('books')
        .select('*, copies!inner(id, status, library_id, local_categories, libraries(name))');

      // Aplicar filtro de busca
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,isbn.ilike.%${searchQuery}%`);
      }

      // Filtrar por biblioteca se selecionada
      if (selectedLibrary !== 'all') {
        query = query.eq('copies.library_id', selectedLibrary);
      }

      const { data: booksData, error } = await query.order('title').limit(50);

      if (error) throw error;

      // Processar dados: agrupar cópias por livro e calcular disponibilidade
      const booksMap = new Map<string, any>();

      (booksData || []).forEach((item: any) => {
        const bookId = item.id;
        
        if (!booksMap.has(bookId)) {
          // Criar entrada do livro
          const { copies, ...book } = item;
          booksMap.set(bookId, {
            ...book,
            totalCopies: 0,
            availableCopies: 0,
            cover_url: (book as any).cover_url || null,
          });
        }

        const bookEntry = booksMap.get(bookId)!;
        
        // Processar cópia (Supabase com !inner pode retornar objeto único ou array)
        let copyToProcess: any = null;
        
        if (item.copies) {
          if (Array.isArray(item.copies)) {
            // Se for array, processar cada cópia
            item.copies.forEach((copy: any) => {
              if (copy && copy.id) {
                bookEntry.totalCopies += 1;
                if (copy.status === 'disponivel') {
                  bookEntry.availableCopies += 1;
                }
              }
            });
          } else if (typeof item.copies === 'object' && item.copies.id) {
            // Se for objeto único
            bookEntry.totalCopies += 1;
            if (item.copies.status === 'disponivel') {
              bookEntry.availableCopies += 1;
            }
          }
        }
      });

      // Converter Map para Array
      const booksWithAvailability = Array.from(booksMap.values());

      setBooks(booksWithAvailability);
    } catch (error) {
      console.error('Erro ao carregar livros:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = async (book: Book) => {
    setSelectedBook(book);
    setDialogOpen(true);

    try {
      // Buscar todas as cópias deste livro com informações das bibliotecas e categorias locais
      const { data: copiesData, error } = await supabase
        .from('copies')
        .select('*, libraries(name), local_categories')
        .eq('book_id', book.id);

      if (error) throw error;

      // Salvar cópias para uso posterior
      setBookCopies(copiesData || []);

      // Buscar todas as cores das bibliotecas
      const { data: colorsData, error: colorsError } = await (supabase as any)
        .from('library_colors')
        .select('*');

      if (!colorsError) {
        setLibraryColors(colorsData || []);
      }

      // Agrupar por biblioteca e coletar categorias
      const availabilityMap = new Map<string, LibraryAvailability>();

      (copiesData || []).forEach((copy: any) => {
        const libraryId = copy.library_id;
        const libraryName = copy.libraries?.name || 'Biblioteca não encontrada';

        if (!availabilityMap.has(libraryId)) {
          availabilityMap.set(libraryId, {
            libraryId,
            libraryName,
            totalCopies: 0,
            availableCopies: 0,
            categories: [],
          });
        }

        const availability = availabilityMap.get(libraryId)!;
        availability.totalCopies += 1;
        if (copy.status === 'disponivel') {
          availability.availableCopies += 1;
        }

        // Coletar categorias locais dos exemplares
        if (copy.local_categories && Array.isArray(copy.local_categories)) {
          copy.local_categories.forEach((cat: string) => {
            if (!availability.categories?.includes(cat)) {
              availability.categories = [...(availability.categories || []), cat];
            }
          });
        }
      });

      setLibraryAvailability(Array.from(availabilityMap.values()));
    } catch (error) {
      console.error('Erro ao carregar disponibilidade:', error);
      setLibraryAvailability([]);
      setBookCopies([]);
      setLibraryColors([]);
    }
  };

  const handleSearch = () => {
    if (activeTab === 'acervo') {
      loadBooks();
    } else if (activeTab === 'bibliotecas') {
      filterLibraries();
    } else if (activeTab === 'agenda') {
      filterEvents();
    }
  };

  const handleLibraryClick = (library: LibraryWithLocation) => {
    if (library.latitude && library.longitude) {
      setSelectedMapLibrary(library);
    }
  };

  // Função para navegar do modal de detalhes do livro para a aba de bibliotecas
  const handleGoToLibrary = (libraryId: string) => {
    // 1. Fechar o modal
    setDialogOpen(false);
    
    // 2. Encontrar e selecionar a biblioteca
    const library = libraries.find(lib => lib.id === libraryId);
    if (library) {
      setSelectedMapLibrary(library);
    }
    
    // 3. Trocar para a aba de bibliotecas
    setActiveTab("bibliotecas");
    
    // 4. Scroll suave até a seção de tabs (opcional, mas melhora UX)
    setTimeout(() => {
      const tabsSection = document.querySelector('[data-tabs-section]');
      if (tabsSection) {
        tabsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Função para gerar link do Google Maps
  const getGoogleMapsUrl = (library: LibraryWithLocation) => {
    if (library.latitude && library.longitude) {
      return `https://www.google.com/maps?q=${library.latitude},${library.longitude}`;
    }
    if ((library as any).address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((library as any).address)}`;
    }
    return null;
  };

  // Funções para formatar data do evento
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      fullDate: date.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }),
    };
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      'Oficina': 'bg-lime-400 hover:bg-lime-500 text-slate-900',
      'Sarau': 'bg-purple-500 hover:bg-purple-600',
      'Leitura': 'bg-blue-800 hover:bg-blue-900',
      'Outros': 'bg-red-500 hover:bg-red-600',
    };
    return colors[category] || colors['Outros'];
  };

  // Calcular coordenada média para centralizar o mapa
  const getMapCenter = (): [number, number] => {
    const librariesWithCoords = libraries.filter(
      (lib) => lib.latitude && lib.longitude
    );

    if (librariesWithCoords.length === 0) {
      // Coordenada padrão do Brasil (centro geográfico aproximado)
      return [-14.235, -51.925];
    }

    if (librariesWithCoords.length === 1) {
      return [librariesWithCoords[0].latitude!, librariesWithCoords[0].longitude!];
    }

    // Calcular média das coordenadas
    const avgLat = librariesWithCoords.reduce((sum, lib) => sum + (lib.latitude || 0), 0) / librariesWithCoords.length;
    const avgLng = librariesWithCoords.reduce((sum, lib) => sum + (lib.longitude || 0), 0) / librariesWithCoords.length;

    return [avgLat, avgLng];
  };

  const librariesWithLocation = libraries.filter(
    (lib) => lib.latitude && lib.longitude
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {appearanceConfig.network_logo ? (
              <img 
                src={appearanceConfig.network_logo} 
                alt="Beabah!" 
                className="h-10 w-10 object-cover rounded-full border-2 border-white/20"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
                <Library className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-foreground">Beabah!</h1>
              <p className="text-xs text-muted-foreground">
                Rede de Bibliotecas Comunitárias do Rio Grande do Sul
              </p>
            </div>
          </div>
          <Link to="/auth">
            <Button variant="outline" size="sm" className="font-medium">
              Área do Bibliotecário
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section Premium */}
      <section 
        className="relative py-6 lg:py-10 overflow-hidden"
        style={{
          background: `linear-gradient(to right, ${appearanceConfig.primary_color}, ${appearanceConfig.secondary_color}, ${appearanceConfig.primary_color})`
        }}
      >
        {/* Imagem de capa de fundo se existir */}
        {appearanceConfig.cover_image && (
          <div className="absolute inset-0">
            <img 
              src={appearanceConfig.cover_image} 
              alt="Capa" 
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-blue-900/80 to-slate-800/80" />
          </div>
        )}
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div 
          className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: appearanceConfig.accent_color }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: appearanceConfig.tertiary_color }}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight">
              Democratizando e descentralizando o acesso à cultura, leitura, escrita e educação desde 2008.
            </h2>
          </div>

          {/* Search Card Flutuante */}
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={
                        activeTab === 'acervo' 
                          ? "Buscar por título, autor ou ISBN..."
                          : activeTab === 'bibliotecas'
                          ? "Buscar por nome, cidade ou endereço..."
                          : "Buscar por título, local ou categoria..."
                      }
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="h-11 pl-10 text-sm border-2 focus:border-primary"
                    />
                  </div>
                  <Select value={selectedLibrary} onValueChange={setSelectedLibrary}>
                    <SelectTrigger className="h-11 w-full sm:w-[200px] border-2 text-sm">
                      <SelectValue placeholder={
                        activeTab === 'acervo' 
                          ? "Todas as bibliotecas"
                          : activeTab === 'bibliotecas'
                          ? "Filtrar biblioteca"
                          : "Filtrar por biblioteca"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {activeTab === 'acervo' 
                          ? "Todas as bibliotecas"
                          : "Todas"}
                      </SelectItem>
                      {allLibraries.map((lib) => (
                        <SelectItem key={lib.id} value={lib.id}>
                          {lib.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="default"
                    size="lg"
                    onClick={handleSearch}
                    className="h-11 font-semibold px-6 shadow-lg text-sm"
                    style={{
                      background: `linear-gradient(to right, ${appearanceConfig.accent_color}, ${appearanceConfig.secondary_color})`,
                      color: '#ffffff'
                    }}
                  >
                    Pesquisar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section - Mostrar apenas na aba Acervo */}
      {activeTab === 'acervo' && (
        <section className="border-b border-border bg-gradient-to-b from-card to-background py-6">
          <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 px-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-primary">
                <Building2 className="h-4 w-4" />
                <span className="text-xl font-bold">{stats.libraries}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">Bibliotecas</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-primary">
                <BookOpen className="h-4 w-4" />
                <span className="text-xl font-bold">{stats.books}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">Títulos</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-primary">
                <Users className="h-4 w-4" />
                <span className="text-xl font-bold">{stats.copies}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">Exemplares</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-primary">
                <UserCircle className="h-4 w-4" />
                <span className="text-xl font-bold">{stats.readers}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">Leitores</p>
            </div>
          </div>
        </section>
      )}

      {/* Tabs Section */}
      <section className="py-4 lg:py-6">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-tabs-section>
            <div className="flex justify-center mb-4">
              <TabsList className="inline-flex h-10 items-center justify-center rounded-full bg-muted p-1 shadow-md">
                <TabsTrigger 
                  value="acervo" 
                  className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all"
                >
                  Consultar Acervo
                </TabsTrigger>
                <TabsTrigger 
                  value="bibliotecas"
                  className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all"
                >
                  Nossas Bibliotecas
                </TabsTrigger>
                <TabsTrigger 
                  value="agenda"
                  className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all"
                >
                  Agenda Cultural
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Aba 1: Consultar Acervo */}
            <TabsContent value="acervo" className="mt-4">
              {loading ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-4 text-muted-foreground">Carregando acervo...</p>
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-lg text-muted-foreground">
                    {searchQuery.trim() || selectedLibrary !== 'all'
                      ? 'Nenhum livro encontrado com os filtros selecionados.'
                      : 'Nenhum livro cadastrado no acervo.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-2">
                      {searchQuery.trim() || selectedLibrary !== 'all'
                        ? `${books.length} resultado(s) encontrado(s)`
                        : 'Acervo Digital'}
                    </h3>
                    {searchQuery.trim() && (
                      <p className="text-muted-foreground">
                        Resultados para: <span className="font-medium">"{searchQuery}"</span>
                      </p>
                    )}
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {books.map((book) => {
                      const bookColor = getBookColor(book.title);
                      const initials = getInitials(book.title);
                      
                      return (
                        <Card 
                          key={book.id} 
                          className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer bg-card"
                          onClick={() => handleBookClick(book)}
                        >
                          <CardContent className="p-0">
                            {/* Book Cover */}
                            <div className="relative h-64 bg-gradient-to-br overflow-hidden">
                              {(book as any).cover_url ? (
                                <img 
                                  src={(book as any).cover_url} 
                                  alt={book.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className={cn(
                                  "w-full h-full bg-gradient-to-br flex items-center justify-center",
                                  bookColor
                                )}>
                                  <div className="text-white text-4xl font-bold drop-shadow-lg">
                                    {initials}
                                  </div>
                                </div>
                              )}
                              {/* Overlay on hover */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                            </div>
                            
                            {/* Book Info */}
                            <div className="p-4 space-y-3">
                              <div>
                                <h4 className="font-bold line-clamp-2 text-sm leading-tight group-hover:text-primary transition-colors">
                                  {book.title}
                                </h4>
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                  {book.author || 'Autor não informado'}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                {book.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {book.category}
                                  </Badge>
                                )}
                                <Badge 
                                  variant={book.availableCopies && book.availableCopies > 0 ? 'default' : 'secondary'}
                                  className="text-xs font-medium"
                                >
                                  {book.availableCopies || 0} disponível(is)
                                </Badge>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs font-medium group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBookClick(book);
                                }}
                              >
                                <Eye className="mr-2 h-3.5 w-3.5" />
                                Ver Disponibilidade
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Aba 2: Nossas Bibliotecas - Store Locator */}
            <TabsContent value="bibliotecas" className="mt-4">
              <div className="h-[600px] grid grid-cols-1 lg:grid-cols-[35%_65%] gap-4 border-2 border-border rounded-2xl overflow-hidden bg-card shadow-lg">
                {/* Lista Lateral - Esquerda */}
                <div className="flex flex-col h-full max-h-[600px] bg-background border-r border-border overflow-hidden">
                  <div className="flex-shrink-0 p-4 border-b border-border bg-gradient-to-r from-lime-50 to-green-50">
                    <h3 className="text-xl font-bold text-foreground">Bibliotecas da Rede</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {libraries.length} {libraries.length === 1 ? 'biblioteca encontrada' : 'bibliotecas encontradas'}
                    </p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto h-full max-h-[600px] p-4 pr-2 space-y-3 min-h-0">
                    {libraries.length === 0 ? (
                      <div className="text-center py-12">
                        <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground font-medium">
                          Nenhuma biblioteca cadastrada.
                        </p>
                      </div>
                    ) : (
                      libraries.map((library) => {
                        const isSelected = selectedMapLibrary?.id === library.id;
                        const hasLocation = library.latitude && library.longitude;
                        const googleMapsUrl = getGoogleMapsUrl(library);
                        
                        return (
                          <Card 
                            key={library.id}
                            className={cn(
                              "cursor-pointer transition-all duration-300 border-2",
                              isSelected
                                ? 'border-primary bg-lime-50 shadow-lg scale-[1.02]' 
                                : 'border-border hover:border-lime-400/60 hover:shadow-md hover:bg-accent/30'
                            )}
                            onClick={() => handleLibraryClick(library)}
                          >
                            <CardContent className="p-4">
                              <div className="flex gap-3">
                                {/* Avatar/Imagem da Biblioteca */}
                                <div className="flex-shrink-0">
                                  {(library as any).image_url ? (
                                    <img 
                                      src={(library as any).image_url} 
                                      alt={library.name}
                                      className="w-14 h-14 rounded-full object-cover border-2 border-border"
                                    />
                                  ) : (
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-800 to-blue-900 flex items-center justify-center border-2 border-border">
                                      <Building2 className="h-7 w-7 text-white" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Informações */}
                                <div className="flex-1 min-w-0 space-y-2">
                                  <h4 className="font-bold text-base leading-tight text-foreground">
                                    {library.name}
                                  </h4>
                                  
                                  <div className="space-y-1.5">
                                    {(library as any).address ? (
                                      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                        <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
                                        <span className="line-clamp-2">{(library as any).address}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                                        <span>{library.city}</span>
                                      </div>
                                    )}
                                    
                                    {(library as any).phone && (
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Phone className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                                        <span>{(library as any).phone}</span>
                                      </div>
                                    )}
                                    
                                    {(library as any).instagram && (
                                      <div className="flex items-center gap-1.5 text-xs">
                                        <a
                                          href={(library as any).instagram}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
                                          title="Instagram"
                                        >
                                          <Instagram className="h-4 w-4" />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Botões de Ação */}
                                  {hasLocation && (
                                    <div className="flex gap-2 mt-3">
                                      <Button
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        className="flex-1 text-xs h-8"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleLibraryClick(library);
                                        }}
                                      >
                                        <Navigation className="mr-1.5 h-3.5 w-3.5" />
                                        Ver no Mapa
                                      </Button>
                                      
                                      {googleMapsUrl && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-xs h-8 px-3"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(googleMapsUrl, '_blank');
                                          }}
                                          title="Abrir no Google Maps"
                                        >
                                          <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Mapa - Direita */}
                <div className="h-full relative bg-muted/30">
                  {librariesWithLocation.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center">
                      <MapPin className="h-20 w-20 text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground font-semibold text-lg">
                        Nenhuma biblioteca com localização cadastrada.
                      </p>
                      <p className="text-sm text-muted-foreground/70 mt-2 text-center max-w-md">
                        Cadastre coordenadas (latitude e longitude) nas bibliotecas para visualizar no mapa.
                      </p>
                    </div>
                  ) : (
                    <MapContainer
                      center={getMapCenter()}
                      zoom={selectedMapLibrary ? 15 : 6}
                      style={{ height: '100%', width: '100%' }}
                      className="rounded-r-2xl"
                      scrollWheelZoom={true}
                    >
                      {selectedMapLibrary && selectedMapLibrary.latitude && selectedMapLibrary.longitude && (
                        <MapController 
                          center={[selectedMapLibrary.latitude, selectedMapLibrary.longitude]} 
                          zoom={15}
                        />
                      )}
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {librariesWithLocation.map((library) => {
                        const isSelected = selectedMapLibrary?.id === library.id;
                        return (
                          <Marker
                            key={library.id}
                            position={[library.latitude!, library.longitude!]}
                            eventHandlers={{
                              click: () => setSelectedMapLibrary(library),
                            }}
                          >
                            <Popup className="rounded-lg min-w-[220px]">
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  {(library as any).image_url ? (
                                    <img 
                                      src={(library as any).image_url} 
                                      alt={library.name}
                                      className="w-12 h-12 rounded-full object-cover border-2 border-border"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-800 to-blue-900 flex items-center justify-center">
                                      <Building2 className="h-6 w-6 text-white" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <h4 className="font-bold text-sm leading-tight">{library.name}</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">{library.city}</p>
                                  </div>
                                </div>
                                
                                {(library as any).address && (
                                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground pt-1 border-t">
                                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span>{(library as any).address}</span>
                                  </div>
                                )}
                                
                                {(library as any).phone && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Phone className="h-3 w-3 flex-shrink-0" />
                                    <span>{(library as any).phone}</span>
                                  </div>
                                )}
                                
                                {(library as any).instagram && (
                                  <div className="flex items-center gap-1.5 text-xs pt-1 border-t">
                                    <a
                                      href={(library as any).instagram}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
                                      title="Instagram"
                                    >
                                      <Instagram className="h-4 w-4" />
                                    </a>
                                  </div>
                                )}
                                
                                {getGoogleMapsUrl(library) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-2 text-xs h-7"
                                    onClick={() => window.open(getGoogleMapsUrl(library)!, '_blank')}
                                  >
                                    <ExternalLink className="mr-1.5 h-3 w-3" />
                                    Abrir no Google Maps
                                  </Button>
                                )}
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </MapContainer>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Aba 3: Agenda Cultural */}
            <TabsContent value="agenda" className="mt-4">
              {eventsLoading ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-4 text-muted-foreground">Carregando agenda cultural...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-16">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-lg text-muted-foreground">
                    Nenhum evento agendado no momento.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-2">
                      Agenda Cultural
                    </h3>
                    <p className="text-muted-foreground">
                      {events.length} {events.length === 1 ? 'evento agendado' : 'eventos agendados'}
                    </p>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => {
                      const eventDate = formatEventDate(event.date);
                      // Usar bibliotecas da tabela event_libraries se disponível, senão usar library antiga
                      const librariesList = event.libraries && event.libraries.length > 0 
                        ? event.libraries 
                        : (event.library ? [{ id: event.library_id, name: event.library.name }] : []);
                      const libraryNames = librariesList.length > 0 
                        ? librariesList.map(l => l.name).join(', ')
                        : 'Biblioteca não informada';
                      
                      return (
                        <Card
                          key={event.id}
                          className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-card"
                        >
                          <CardContent className="p-0">
                            {/* Banner/Imagem do Evento */}
                            {event.banner_url ? (
                              <div className="relative h-48 overflow-hidden">
                                <img
                                  src={event.banner_url}
                                  alt={event.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-4 left-4">
                                  <Badge className={cn("text-white border-0", getCategoryBadgeColor(event.category))}>
                                    {event.category}
                                  </Badge>
                                </div>
                              </div>
                            ) : (
                              <div className="relative h-48 bg-gradient-to-br from-slate-800 via-blue-900 to-purple-700 flex items-center justify-center">
                                <div className="absolute top-4 left-4">
                                  <Badge className={cn("text-white border-0", getCategoryBadgeColor(event.category))}>
                                    {event.category}
                                  </Badge>
                                </div>
                                <Calendar className="h-16 w-16 text-white/80" />
                              </div>
                            )}
                            
                            {/* Data em Destaque */}
                            <div className="px-4 pt-4 pb-2">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg px-4 py-2 min-w-[60px]">
                                  <span className="text-2xl font-bold text-primary">{eventDate.day}</span>
                                  <span className="text-xs font-medium text-muted-foreground uppercase">{eventDate.month}</span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>{eventDate.time}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Título */}
                              <h4 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                {event.title}
                              </h4>
                              
                              {/* Local e Biblioteca */}
                              <div className="space-y-2 mb-4">
                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                                  <span className="line-clamp-2">{event.location}</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <Library className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
                                  <span className="line-clamp-2">{libraryNames}</span>
                                </div>
                              </div>
                              
                              {/* Botão Saiba Mais */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setEventDialogOpen(true);
                                }}
                              >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Saiba mais
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Modal de Detalhes do Livro */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          {selectedBook && (
            <>
              {/* Header com Título e Autor */}
              <DialogHeader>
                <DialogTitle className="text-2xl mb-2">{selectedBook.title}</DialogTitle>
                <DialogDescription className="text-base">
                  {selectedBook.author && (
                    <span className="font-medium text-foreground">Autor: {selectedBook.author}</span>
                  )}
                </DialogDescription>
              </DialogHeader>

              {/* Layout em duas colunas: Ficha Técnica e Disponibilidade */}
              <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-4 mt-4">
                {/* Coluna Esquerda: Capa e Ficha Técnica */}
                <div className="space-y-4">
                  {/* Capa Grande */}
                  <div className="w-full">
                    {(selectedBook as any).cover_url ? (
                      <img
                        src={(selectedBook as any).cover_url}
                        alt={selectedBook.title}
                        className="w-full rounded-lg shadow-lg border-2 border-border object-cover"
                        style={{ aspectRatio: '2/3' }}
                      />
                    ) : (
                      <div className="w-full rounded-lg shadow-lg border-2 border-border bg-gradient-to-br from-slate-800 to-blue-900 flex items-center justify-center" style={{ aspectRatio: '2/3' }}>
                        <BookOpen className="h-20 w-20 text-white/80" />
                      </div>
                    )}
                  </div>

                  {/* Ficha Técnica */}
                  <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Ficha Técnica
                    </h3>
                    <div className="space-y-1.5 text-xs">
                      {selectedBook.publisher && (
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground min-w-[80px]">Editora:</span>
                          <span className="font-medium">{selectedBook.publisher}</span>
                        </div>
                      )}
                      {selectedBook.publication_date && (
                        <div className="flex items-start gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="text-muted-foreground min-w-[80px]">Ano:</span>
                          <span className="font-medium">{new Date(selectedBook.publication_date).getFullYear()}</span>
                        </div>
                      )}
                      {selectedBook.pages && (
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground min-w-[80px]">Páginas:</span>
                          <span className="font-medium">{selectedBook.pages}</span>
                        </div>
                      )}
                      {selectedBook.isbn && (
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground min-w-[80px]">ISBN:</span>
                          <span className="font-mono text-xs">{selectedBook.isbn}</span>
                        </div>
                      )}
                      {selectedBook.language && (
                        <div className="flex items-start gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="text-muted-foreground min-w-[80px]">Idioma:</span>
                          <span className="font-medium">{selectedBook.language}</span>
                        </div>
                      )}
                      {selectedBook.category && (
                        <div className="flex items-start gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="text-muted-foreground min-w-[80px]">Categoria:</span>
                          <Badge variant="outline">{selectedBook.category}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Coluna Direita: Sinopse e Disponibilidade */}
                <div className="space-y-3">
                  {/* Sinopse/Descrição */}
                  {(selectedBook as any).description || (selectedBook as any).synopsis ? (
                    <div className="space-y-1.5">
                      <h3 className="font-semibold text-base flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        Sinopse
                      </h3>
                      <div className="p-3 bg-muted/50 rounded-lg border max-h-[150px] overflow-y-auto text-xs text-muted-foreground leading-relaxed">
                        {(selectedBook as any).description || (selectedBook as any).synopsis || 'Sinopse não disponível.'}
                      </div>
                    </div>
                  ) : null}

                  {/* Disponibilidade */}
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Library className="h-4 w-4 text-primary" />
                      Onde Encontrar
                    </h3>
                    {libraryAvailability.length === 0 ? (
                      <div className="py-8 text-center bg-muted/50 rounded-lg border">
                        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">Nenhum exemplar encontrado para este livro.</p>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="font-semibold">Biblioteca</TableHead>
                              <TableHead className="text-center font-semibold text-xs">Cutter / Assunto</TableHead>
                              <TableHead className="text-center font-semibold">Total</TableHead>
                              <TableHead className="text-center font-semibold">Disponíveis</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {libraryAvailability.map((avail) => {
                              // Buscar cores das categorias desta biblioteca
                              const categoryColors = (avail.categories || []).map((catName: string) => {
                                const colorDef = libraryColors.find(
                                  lc => lc.library_id === avail.libraryId && lc.category_name === catName
                                );
                                return { name: catName, color: colorDef?.color_hex || '#ccc' };
                              });

                              return (
                                <TableRow key={avail.libraryId} className="hover:bg-accent/50">
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                      <Button
                                        variant="link"
                                        className="h-auto p-0 text-sm font-medium text-foreground hover:text-primary hover:underline"
                                        onClick={() => handleGoToLibrary(avail.libraryId)}
                                      >
                                        <span className="line-clamp-1">{avail.libraryName}</span>
                                        <ExternalLink className="h-3 w-3 ml-1 inline" />
                                      </Button>
                                      {categoryColors.length > 0 && (
                                        <TooltipProvider>
                                          <div className="flex items-center gap-0.5 ml-1">
                                            {categoryColors.map((cat, idx) => (
                                              <Tooltip key={idx}>
                                                <TooltipTrigger asChild>
                                                  <div
                                                    className="w-3 h-3 rounded-full border border-gray-300 cursor-help hover:scale-110 transition-transform"
                                                    style={{ backgroundColor: cat.color }}
                                                  />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p className="text-xs">{cat.name}</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            ))}
                                          </div>
                                        </TooltipProvider>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex flex-col items-center gap-1.5">
                                      <span className="font-mono text-xs font-semibold text-lime-500">
                                        {(selectedBook as any)?.cutter || '-'}
                                      </span>
                                      {selectedBook?.category ? (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                          {selectedBook.category}
                                        </Badge>
                                      ) : (
                                        <span className="text-[10px] text-muted-foreground">-</span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="text-sm font-medium">{avail.totalCopies}</span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge 
                                      variant={avail.availableCopies > 0 ? 'default' : 'secondary'}
                                      className="text-xs font-medium"
                                    >
                                      {avail.availableCopies}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Evento */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  {selectedEvent.banner_url && (
                    <img
                      src={selectedEvent.banner_url}
                      alt={selectedEvent.title}
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <DialogTitle className="text-2xl mb-2">{selectedEvent.title}</DialogTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn("text-white border-0", getCategoryBadgeColor(selectedEvent.category))}>
                        {selectedEvent.category}
                      </Badge>
                      <Badge variant="outline">
                        {selectedEvent.status === 'agendado' ? 'Agendado' : 'Realizado'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="mt-6 space-y-4">
                {/* Data e Hora */}
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg px-4 py-3 min-w-[70px]">
                    <span className="text-3xl font-bold text-primary">
                      {formatEventDate(selectedEvent.date).day}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground uppercase">
                      {formatEventDate(selectedEvent.date).month}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">
                      {formatEventDate(selectedEvent.date).fullDate}
                    </p>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatEventDate(selectedEvent.date).time}</span>
                    </div>
                  </div>
                </div>

                {/* Local */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Local
                  </h4>
                  <p className="text-muted-foreground pl-7">{selectedEvent.location}</p>
                </div>

                {/* Bibliotecas */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Library className="h-5 w-5 text-primary" />
                    {selectedEvent.libraries && selectedEvent.libraries.length > 1 ? 'Bibliotecas' : 'Biblioteca'}
                  </h4>
                  <p className="text-muted-foreground pl-7">
                    {selectedEvent.libraries && selectedEvent.libraries.length > 0
                      ? selectedEvent.libraries.map(l => l.name).join(', ')
                      : selectedEvent.library?.name || 'Biblioteca não informada'}
                  </p>
                </div>

                {/* Público Esperado */}
                {selectedEvent.expected_audience > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Público Esperado
                    </h4>
                    <p className="text-muted-foreground pl-7">
                      {selectedEvent.expected_audience} pessoas
                    </p>
                  </div>
                )}

                {/* Descrição (se houver mais informações, pode ser expandido) */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Para mais informações sobre este evento, entre em contato com a biblioteca responsável.
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Library className="h-5 w-5" />
              <span className="font-semibold">Beabah!</span>
              <span className="text-sm">• Sistema de Gestão da Rede de Bibliotecas Comunitárias do Rio Grande do Sul</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>© 2024 - Beabah! - Rede de Bibliotecas Comunitárias do Rio Grande do Sul</span>
              <Link to="/auth" className="hover:text-primary transition-colors font-medium">
                Área Administrativa
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
