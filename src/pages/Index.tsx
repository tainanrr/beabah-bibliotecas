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
  Heart,
  Star,
  BookMarked,
  ChevronRight,
  Loader2,
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
  categories?: string[];
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
  show_in_homepage?: boolean;
  description?: string;
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

// Funções de cores para livros (paleta Beabah)
const getBookColor = (title: string) => {
  const colors = [
    'from-slate-800 to-blue-900',
    'from-purple-600 to-violet-700',
    'from-lime-500 to-emerald-600',
    'from-rose-500 to-red-600',
    'from-blue-700 to-indigo-800',
    'from-amber-500 to-orange-600',
  ];
  const index = title.charCodeAt(0) % colors.length;
  return colors[index];
};

const getInitials = (title: string) => {
  const words = title.split(' ').filter(w => w.length > 0);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return title.substring(0, 2).toUpperCase();
};

// Cores para categorias de eventos
const getCategoryStyle = (category: string) => {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    'Oficina': { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-300' },
    'Sarau': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    'Leitura': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    'Encontro': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
    'Clube de Leitura': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
    'default': { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  };
  return styles[category] || styles['default'];
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

  // Filtros
  const filterLibraries = () => {
    let filtered = [...allLibraries];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lib => 
        lib.name.toLowerCase().includes(query) ||
        lib.city.toLowerCase().includes(query) ||
        ((lib as any).address && (lib as any).address.toLowerCase().includes(query)) ||
        ((lib as any).phone && (lib as any).phone.includes(query))
      );
    }
    if (selectedLibrary !== 'all') {
      filtered = filtered.filter(lib => lib.id === selectedLibrary);
    }
    setLibraries(filtered);
  };

  const filterEvents = () => {
    let filtered = [...allEvents];
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
    if (selectedLibrary !== 'all') {
      filtered = filtered.filter(event => {
        if (event.libraries && event.libraries.length > 0) {
          return event.libraries.some(lib => lib.id === selectedLibrary);
        }
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
    document.title = 'Beabah! - Rede de Bibliotecas Comunitárias do Rio Grande do Sul';
  }, []);

  const loadAppearanceConfig = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('appearance_config')
        .select('*')
        .eq('id', 'global')
        .single();

      if (data && !error) {
        setAppearanceConfig({
          network_logo: data.network_logo || "",
          favicon: data.favicon || "",
          cover_image: data.cover_image || "",
          primary_color: data.primary_color || "#1e293b",
          secondary_color: data.secondary_color || "#1e40af",
          accent_color: data.accent_color || "#84cc16",
          tertiary_color: data.tertiary_color || "#a855f7",
        });
        
        if (data.favicon) {
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
          createRoundedFavicon(data.favicon);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
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

      // Carregar eventos (ações culturais) marcados para aparecer na homepage
      const { data, error } = await (supabase as any)
        .from('events')
        .select('*, libraries(name)')
        .eq('show_in_homepage', true)
        .gte('date', todayISO)
        .neq('status', 'cancelado')
        .order('date', { ascending: true });

      if (error) throw error;

      const eventsData = (data || []) as EventWithLibrary[];

      // Carregar bibliotecas vinculadas
      if (eventsData.length > 0) {
        const eventIds = eventsData.map(e => e.id);
        const { data: eventLibrariesData } = await (supabase as any)
          .from('event_libraries')
          .select('event_id, library_id, libraries(id, name)')
          .in('event_id', eventIds);

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

        eventsData.forEach(event => {
          event.libraries = librariesMap[event.id] || [];
        });
      }

      // Também carregar mediações marcadas para homepage
      const { data: mediationsData, error: mediationsError } = await (supabase as any)
        .from('reading_mediations')
        .select('*, libraries(name)')
        .eq('show_in_homepage', true)
        .gte('date', today.toISOString().split('T')[0])
        .order('date', { ascending: true });

      // Converter mediações para formato de evento
      const mediationsAsEvents: EventWithLibrary[] = (mediationsData || []).map((m: any) => ({
        id: m.id,
        title: `Mediação de Leitura - ${m.mediation_type === 'presencial_biblioteca' ? 'Na Biblioteca' : m.mediation_type === 'presencial_externo' ? 'Externa' : 'Virtual'}`,
        date: `${m.date}T10:00:00`,
        location: m.location || 'Na Biblioteca',
        category: 'Mediação',
        expected_audience: m.audience_count || 0,
        actual_audience: null,
        status: 'agendado' as const,
        banner_url: null,
        library_id: m.library_id,
        created_at: m.created_at,
        updated_at: m.updated_at,
        show_in_homepage: true,
        description: m.description,
        library: m.libraries,
        libraries: m.libraries ? [{ id: m.library_id, name: m.libraries.name }] : [],
      }));

      // Combinar eventos e mediações, ordenar por data
      const allEventsData = [...eventsData, ...mediationsAsEvents].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setAllEvents(allEventsData);
      setEvents(allEventsData);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const loadBooks = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('books')
        .select('*, copies!inner(id, status, library_id, local_categories, libraries(name))');

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,isbn.ilike.%${searchQuery}%`);
      }

      if (selectedLibrary !== 'all') {
        query = query.eq('copies.library_id', selectedLibrary);
      }

      const { data: booksData, error } = await query.order('title').limit(50);
      if (error) throw error;

      const booksMap = new Map<string, any>();
      (booksData || []).forEach((item: any) => {
        const bookId = item.id;
        if (!booksMap.has(bookId)) {
          const { copies, ...book } = item;
          booksMap.set(bookId, {
            ...book,
            totalCopies: 0,
            availableCopies: 0,
            cover_url: (book as any).cover_url || null,
          });
        }

        const bookEntry = booksMap.get(bookId)!;
        if (item.copies) {
          if (Array.isArray(item.copies)) {
            item.copies.forEach((copy: any) => {
              if (copy && copy.id) {
                bookEntry.totalCopies += 1;
                if (copy.status === 'disponivel') {
                  bookEntry.availableCopies += 1;
                }
              }
            });
          } else if (typeof item.copies === 'object' && item.copies.id) {
            bookEntry.totalCopies += 1;
            if (item.copies.status === 'disponivel') {
              bookEntry.availableCopies += 1;
            }
          }
        }
      });

      setBooks(Array.from(booksMap.values()));
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
      const { data: copiesData, error } = await supabase
        .from('copies')
        .select('*, libraries(name), local_categories')
        .eq('book_id', book.id);

      if (error) throw error;
      setBookCopies(copiesData || []);

      const { data: colorsData, error: colorsError } = await (supabase as any)
        .from('library_colors')
        .select('*');

      if (!colorsError) {
        setLibraryColors(colorsData || []);
      }

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

  const handleGoToLibrary = (libraryId: string) => {
    setDialogOpen(false);
    const library = libraries.find(lib => lib.id === libraryId);
    if (library) {
      setSelectedMapLibrary(library);
    }
    setActiveTab("bibliotecas");
    setTimeout(() => {
      const tabsSection = document.querySelector('[data-tabs-section]');
      if (tabsSection) {
        tabsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const getGoogleMapsUrl = (library: LibraryWithLocation) => {
    if (library.latitude && library.longitude) {
      return `https://www.google.com/maps?q=${library.latitude},${library.longitude}`;
    }
    if ((library as any).address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((library as any).address)}`;
    }
    return null;
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      fullDate: date.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }),
      weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase(),
    };
  };

  const getMapCenter = (): [number, number] => {
    const librariesWithCoords = libraries.filter(
      (lib) => lib.latitude && lib.longitude
    );
    if (librariesWithCoords.length === 0) {
      return [-14.235, -51.925];
    }
    if (librariesWithCoords.length === 1) {
      return [librariesWithCoords[0].latitude!, librariesWithCoords[0].longitude!];
    }
    const avgLat = librariesWithCoords.reduce((sum, lib) => sum + (lib.latitude || 0), 0) / librariesWithCoords.length;
    const avgLng = librariesWithCoords.reduce((sum, lib) => sum + (lib.longitude || 0), 0) / librariesWithCoords.length;
    return [avgLat, avgLng];
  };

  const librariesWithLocation = libraries.filter(
    (lib) => lib.latitude && lib.longitude
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header Moderno */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3 group cursor-pointer">
            {appearanceConfig.network_logo ? (
              <img 
                src={appearanceConfig.network_logo} 
                alt="Beabah!" 
                className="h-10 w-10 object-cover rounded-full border-2 border-lime-400/50 shadow-lg group-hover:scale-105 transition-transform"
              />
            ) : (
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-full shadow-lg group-hover:scale-105 transition-transform"
                style={{ background: `linear-gradient(135deg, ${appearanceConfig.primary_color}, ${appearanceConfig.secondary_color})` }}
              >
                <Library className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Beabah!
              </h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                REDE DE BIBLIOTECAS COMUNITÁRIAS
              </p>
            </div>
          </div>
          <Link to="/auth">
            <Button 
              variant="outline" 
              size="sm" 
              className="font-medium border-2 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              Área do Bibliotecário
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section Premium */}
      <section className="relative overflow-hidden">
        {/* Background com gradiente e padrão */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${appearanceConfig.primary_color} 0%, ${appearanceConfig.secondary_color} 50%, ${appearanceConfig.primary_color} 100%)`
          }}
        />
        
        {/* Imagem de capa */}
        {appearanceConfig.cover_image && (
          <div className="absolute inset-0">
            <img 
              src={appearanceConfig.cover_image} 
              alt="Capa" 
              className="w-full h-full object-cover opacity-20"
            />
          </div>
        )}
        
        {/* Elementos decorativos animados */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute -top-20 -left-20 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse"
            style={{ backgroundColor: appearanceConfig.accent_color }}
          />
          <div 
            className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20 animate-pulse"
            style={{ backgroundColor: appearanceConfig.tertiary_color, animationDelay: '1s' }}
          />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-10"
            style={{ backgroundColor: '#fff' }}
          />
        </div>
        
        {/* Padrão de grid sutil */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
        
        <div className="relative z-10 container mx-auto px-4 lg:px-8 py-12 lg:py-20">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <Heart className="h-4 w-4 text-lime-400" />
              <span className="text-sm font-medium text-white/90">Desde 2008 transformando vidas através da leitura</span>
            </div>
            
            {/* Título principal com animação de entrada */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight animate-fade-in">
              Democratizando o acesso à{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-lime-300 to-emerald-300 bg-clip-text text-transparent">
                  cultura e educação
                </span>
                <span 
                  className="absolute -bottom-2 left-0 w-full h-3 opacity-50 rounded"
                  style={{ backgroundColor: appearanceConfig.accent_color }}
                />
              </span>
            </h2>
            
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Uma rede de bibliotecas comunitárias conectando leitores, livros e comunidades no Rio Grande do Sul.
            </p>
            
            {/* Estatísticas em destaque */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
              {[
                { icon: Building2, value: stats.libraries, label: 'Bibliotecas', color: 'from-lime-400 to-emerald-500' },
                { icon: BookOpen, value: stats.books, label: 'Títulos', color: 'from-blue-400 to-indigo-500' },
                { icon: BookMarked, value: stats.copies, label: 'Exemplares', color: 'from-purple-400 to-violet-500' },
                { icon: Users, value: stats.readers, label: 'Leitores', color: 'from-amber-400 to-orange-500' },
              ].map((stat, idx) => (
                <div 
                  key={stat.label}
                  className="group bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${stat.color} mb-2`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-white">{stat.value.toLocaleString()}</div>
                  <div className="text-xs text-white/60 font-medium uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Barra de Pesquisa Flutuante */}
      <section className="relative z-20 -mt-8 px-4 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardContent className="p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder={
                      activeTab === 'acervo' 
                        ? "Buscar livros por título, autor ou ISBN..."
                        : activeTab === 'bibliotecas'
                        ? "Buscar bibliotecas por nome ou cidade..."
                        : "Buscar eventos por título ou local..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="h-12 pl-12 text-base border-2 border-slate-200 focus:border-lime-500 rounded-xl transition-colors"
                  />
                </div>
                <Select value={selectedLibrary} onValueChange={setSelectedLibrary}>
                  <SelectTrigger className="h-12 w-full sm:w-[220px] border-2 border-slate-200 rounded-xl">
                    <Building2 className="h-4 w-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Todas as bibliotecas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as bibliotecas</SelectItem>
                    {allLibraries.map((lib) => (
                      <SelectItem key={lib.id} value={lib.id}>
                        {lib.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleSearch}
                  className="h-12 px-8 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background: `linear-gradient(135deg, ${appearanceConfig.accent_color}, ${appearanceConfig.secondary_color})`,
                  }}
                >
                  Pesquisar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-tabs-section>
            <div className="flex justify-center mb-8">
              <TabsList className="inline-flex h-auto p-1.5 bg-slate-100 rounded-2xl shadow-inner">
                {[
                  { value: 'acervo', icon: BookOpen, label: 'Consultar Acervo' },
                  { value: 'bibliotecas', icon: MapPin, label: 'Nossas Bibliotecas' },
                  { value: 'agenda', icon: Calendar, label: 'Agenda Cultural' },
                ].map((tab) => (
                  <TabsTrigger 
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 text-slate-600"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Tab: Consultar Acervo */}
            <TabsContent value="acervo" className="mt-0 animate-fade-in">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 text-lime-500 animate-spin mb-4" />
                  <p className="text-slate-500 font-medium">Carregando acervo...</p>
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-4">
                    <BookOpen className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhum livro encontrado</h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    {searchQuery.trim() || selectedLibrary !== 'all'
                      ? 'Tente ajustar os filtros de busca.'
                      : 'O acervo está vazio no momento.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-800">
                      {searchQuery.trim() || selectedLibrary !== 'all'
                        ? `${books.length} resultado(s) encontrado(s)`
                        : 'Acervo Digital'}
                    </h3>
                    {searchQuery.trim() && (
                      <p className="text-slate-500 mt-1">
                        Resultados para: <span className="font-semibold text-slate-700">"{searchQuery}"</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {books.map((book, idx) => {
                      const bookColor = getBookColor(book.title);
                      const initials = getInitials(book.title);
                      
                      return (
                        <Card 
                          key={book.id} 
                          className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer bg-white rounded-2xl"
                          onClick={() => handleBookClick(book)}
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <CardContent className="p-0">
                            <div className="relative h-56 overflow-hidden">
                              {(book as any).cover_url ? (
                                <img 
                                  src={(book as any).cover_url} 
                                  alt={book.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className={cn(
                                  "w-full h-full bg-gradient-to-br flex flex-col items-center justify-center",
                                  bookColor
                                )}>
                                  <div className="text-white text-4xl font-bold drop-shadow-lg mb-2">
                                    {initials}
                                  </div>
                                  <BookOpen className="h-8 w-8 text-white/40" />
                                </div>
                              )}
                              
                              {/* Overlay com gradiente */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              
                              {/* Badge de disponibilidade */}
                              <div className="absolute top-3 right-3">
                                <Badge 
                                  className={cn(
                                    "font-semibold shadow-lg backdrop-blur-sm",
                                    book.availableCopies && book.availableCopies > 0 
                                      ? "bg-lime-500/90 hover:bg-lime-600 text-white border-0" 
                                      : "bg-slate-500/90 text-white border-0"
                                  )}
                                >
                                  {book.availableCopies || 0} disponível
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="p-4 space-y-3">
                              <div>
                                <h4 className="font-bold text-slate-800 line-clamp-2 text-sm leading-snug group-hover:text-lime-700 transition-colors">
                                  {book.title}
                                </h4>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                  {book.author || 'Autor não informado'}
                                </p>
                              </div>
                              
                              {book.category && (
                                <Badge variant="outline" className="text-xs font-medium">
                                  {book.category}
                                </Badge>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs font-semibold text-slate-600 hover:text-lime-700 hover:bg-lime-50 rounded-xl"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBookClick(book);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver disponibilidade
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

            {/* Tab: Nossas Bibliotecas */}
            <TabsContent value="bibliotecas" className="mt-0 animate-fade-in">
              <div className="h-[650px] grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-0 border-2 border-slate-200 rounded-3xl overflow-hidden bg-white shadow-2xl">
                {/* Lista Lateral */}
                <div className="flex flex-col h-full max-h-[650px] bg-slate-50/50 border-r border-slate-200 overflow-hidden">
                  <div className="flex-shrink-0 p-5 bg-white border-b border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-lime-600" />
                      Bibliotecas da Rede
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {libraries.length} {libraries.length === 1 ? 'biblioteca encontrada' : 'bibliotecas encontradas'}
                    </p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {libraries.length === 0 ? (
                      <div className="text-center py-12">
                        <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium">Nenhuma biblioteca encontrada.</p>
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
                              "cursor-pointer transition-all duration-300 border-2 rounded-2xl overflow-hidden",
                              isSelected
                                ? 'border-lime-500 bg-lime-50 shadow-lg ring-2 ring-lime-500/20' 
                                : 'border-transparent bg-white hover:border-slate-200 hover:shadow-md'
                            )}
                            onClick={() => handleLibraryClick(library)}
                          >
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                  {(library as any).image_url ? (
                                    <img 
                                      src={(library as any).image_url} 
                                      alt={library.name}
                                      className="w-14 h-14 rounded-xl object-cover border-2 border-slate-200"
                                    />
                                  ) : (
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                                      <Building2 className="h-7 w-7 text-white" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0 space-y-2">
                                  <h4 className="font-bold text-slate-800 leading-tight">
                                    {library.name}
                                  </h4>
                                  
                                  <div className="space-y-1">
                                    {(library as any).address ? (
                                      <div className="flex items-start gap-2 text-xs text-slate-500">
                                        <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-lime-600" />
                                        <span className="line-clamp-2">{(library as any).address}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <MapPin className="h-3.5 w-3.5 text-lime-600" />
                                        <span>{library.city}</span>
                                      </div>
                                    )}
                                    
                                    {(library as any).phone && (
                                      <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Phone className="h-3.5 w-3.5 text-lime-600" />
                                        <span>{(library as any).phone}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 pt-1">
                                    {(library as any).instagram && (
                                      <a
                                        href={(library as any).instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 text-white hover:opacity-90 transition-opacity"
                                      >
                                        <Instagram className="h-4 w-4" />
                                      </a>
                                    )}
                                    
                                    {hasLocation && (
                                      <Button
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        className={cn(
                                          "text-xs h-8 rounded-lg",
                                          isSelected && "bg-lime-600 hover:bg-lime-700"
                                        )}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleLibraryClick(library);
                                        }}
                                      >
                                        <Navigation className="mr-1.5 h-3.5 w-3.5" />
                                        Ver no Mapa
                                      </Button>
                                    )}
                                    
                                    {googleMapsUrl && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs h-8 px-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(googleMapsUrl, '_blank');
                                        }}
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Mapa */}
                <div className="h-full relative bg-slate-100">
                  {librariesWithLocation.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center">
                      <MapPin className="h-20 w-20 text-slate-300 mb-4" />
                      <p className="text-slate-500 font-semibold text-lg">Nenhuma biblioteca com localização</p>
                      <p className="text-sm text-slate-400 mt-2">
                        Cadastre coordenadas nas bibliotecas para visualizar no mapa.
                      </p>
                    </div>
                  ) : (
                    <MapContainer
                      center={getMapCenter()}
                      zoom={selectedMapLibrary ? 15 : 6}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={true}
                    >
                      {selectedMapLibrary && selectedMapLibrary.latitude && selectedMapLibrary.longitude && (
                        <MapController 
                          center={[selectedMapLibrary.latitude, selectedMapLibrary.longitude]} 
                          zoom={15}
                        />
                      )}
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {librariesWithLocation.map((library) => (
                        <Marker
                          key={library.id}
                          position={[library.latitude!, library.longitude!]}
                          eventHandlers={{
                            click: () => setSelectedMapLibrary(library),
                          }}
                        >
                          <Popup className="rounded-xl min-w-[250px]">
                            <div className="space-y-3 p-1">
                              <div className="flex items-start gap-3">
                                {(library as any).image_url ? (
                                  <img 
                                    src={(library as any).image_url} 
                                    alt={library.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                                    <Building2 className="h-6 w-6 text-white" />
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-bold text-sm">{library.name}</h4>
                                  <p className="text-xs text-slate-500">{library.city}</p>
                                </div>
                              </div>
                              
                              {(library as any).address && (
                                <p className="text-xs text-slate-600">{(library as any).address}</p>
                              )}
                              
                              {getGoogleMapsUrl(library) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-xs"
                                  onClick={() => window.open(getGoogleMapsUrl(library)!, '_blank')}
                                >
                                  <ExternalLink className="mr-2 h-3 w-3" />
                                  Abrir no Google Maps
                                </Button>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab: Agenda Cultural */}
            <TabsContent value="agenda" className="mt-0 animate-fade-in">
              {eventsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-4" />
                  <p className="text-slate-500 font-medium">Carregando agenda cultural...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 mb-4">
                    <Calendar className="h-10 w-10 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhum evento agendado</h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Fique atento! Em breve teremos novos eventos culturais.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-purple-500" />
                        Agenda Cultural
                      </h3>
                      <p className="text-slate-500 mt-1">
                        {events.length} {events.length === 1 ? 'evento agendado' : 'eventos agendados'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {events.map((event, idx) => {
                      const eventDate = formatEventDate(event.date);
                      const categoryStyle = getCategoryStyle(event.category);
                      const librariesList = event.libraries && event.libraries.length > 0 
                        ? event.libraries 
                        : (event.library ? [{ id: event.library_id, name: event.library.name }] : []);
                      const libraryNames = librariesList.length > 0 
                        ? librariesList.map(l => l.name).join(', ')
                        : 'Biblioteca não informada';
                      
                      return (
                        <Card
                          key={event.id}
                          className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white rounded-2xl"
                          style={{ animationDelay: `${idx * 100}ms` }}
                        >
                          <CardContent className="p-0">
                            {/* Header com imagem ou gradiente */}
                            <div className="relative h-40 overflow-hidden">
                              {event.banner_url ? (
                                <img
                                  src={event.banner_url}
                                  alt={event.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 flex items-center justify-center">
                                  <div className="text-center text-white">
                                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                  </div>
                                </div>
                              )}
                              
                              {/* Gradiente overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              
                              {/* Badge de categoria */}
                              <div className="absolute top-4 left-4">
                                <Badge className={cn(
                                  "font-semibold border shadow-lg",
                                  categoryStyle.bg, categoryStyle.text, categoryStyle.border
                                )}>
                                  {event.category}
                                </Badge>
                              </div>
                              
                              {/* Data em destaque */}
                              <div className="absolute bottom-4 left-4 text-white">
                                <div className="flex items-end gap-2">
                                  <div className="text-4xl font-bold leading-none">{eventDate.day}</div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-medium opacity-80">{eventDate.month}</span>
                                    <span className="text-xs opacity-60">{eventDate.weekday}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Conteúdo */}
                            <div className="p-5 space-y-4">
                              <div>
                                <h4 className="font-bold text-lg text-slate-800 leading-tight group-hover:text-purple-700 transition-colors line-clamp-2">
                                  {event.title}
                                </h4>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                  <Clock className="h-4 w-4 text-purple-500" />
                                  <span>{eventDate.time}</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm text-slate-500">
                                  <MapPin className="h-4 w-4 text-purple-500 mt-0.5" />
                                  <span className="line-clamp-1">{event.location}</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm text-slate-500">
                                  <Library className="h-4 w-4 text-purple-500 mt-0.5" />
                                  <span className="line-clamp-1">{libraryNames}</span>
                                </div>
                              </div>
                              
                              <Button
                                className="w-full rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
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
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto rounded-2xl">
          {selectedBook && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">{selectedBook.title}</DialogTitle>
                <DialogDescription className="text-base">
                  {selectedBook.author && (
                    <span className="font-medium">por {selectedBook.author}</span>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 mt-6">
                {/* Coluna Esquerda */}
                <div className="space-y-4">
                  {/* Capa */}
                  <div className="w-full rounded-xl overflow-hidden shadow-lg">
                    {(selectedBook as any).cover_url ? (
                      <img
                        src={(selectedBook as any).cover_url}
                        alt={selectedBook.title}
                        className="w-full object-cover"
                        style={{ aspectRatio: '2/3' }}
                      />
                    ) : (
                      <div 
                        className={cn(
                          "w-full bg-gradient-to-br flex flex-col items-center justify-center",
                          getBookColor(selectedBook.title)
                        )}
                        style={{ aspectRatio: '2/3' }}
                      >
                        <div className="text-white text-5xl font-bold mb-2">
                          {getInitials(selectedBook.title)}
                        </div>
                        <BookOpen className="h-12 w-12 text-white/40" />
                      </div>
                    )}
                  </div>

                  {/* Ficha Técnica */}
                  <Card className="border-2 border-slate-200 rounded-xl">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-semibold flex items-center gap-2 text-slate-700">
                        <FileText className="h-4 w-4 text-lime-600" />
                        Ficha Técnica
                      </h3>
                      <div className="space-y-2 text-sm">
                        {selectedBook.publisher && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Editora</span>
                            <span className="font-medium text-slate-700">{selectedBook.publisher}</span>
                          </div>
                        )}
                        {selectedBook.publication_date && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Ano</span>
                            <span className="font-medium text-slate-700">{new Date(selectedBook.publication_date).getFullYear()}</span>
                          </div>
                        )}
                        {selectedBook.pages && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Páginas</span>
                            <span className="font-medium text-slate-700">{selectedBook.pages}</span>
                          </div>
                        )}
                        {selectedBook.isbn && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">ISBN</span>
                            <span className="font-mono text-xs text-slate-700">{selectedBook.isbn}</span>
                          </div>
                        )}
                        {selectedBook.language && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Idioma</span>
                            <span className="font-medium text-slate-700">{selectedBook.language}</span>
                          </div>
                        )}
                        {selectedBook.category && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Categoria</span>
                            <Badge variant="outline">{selectedBook.category}</Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Coluna Direita */}
                <div className="space-y-4">
                  {/* Sinopse */}
                  {((selectedBook as any).description || (selectedBook as any).synopsis) && (
                    <Card className="border-2 border-slate-200 rounded-xl">
                      <CardContent className="p-4">
                        <h3 className="font-semibold flex items-center gap-2 text-slate-700 mb-3">
                          <Info className="h-4 w-4 text-lime-600" />
                          Sinopse
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {(selectedBook as any).description || (selectedBook as any).synopsis}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Disponibilidade */}
                  <Card className="border-2 border-slate-200 rounded-xl">
                    <CardContent className="p-4">
                      <h3 className="font-semibold flex items-center gap-2 text-slate-700 mb-3">
                        <Library className="h-4 w-4 text-lime-600" />
                        Onde Encontrar
                      </h3>
                      {libraryAvailability.length === 0 ? (
                        <div className="py-8 text-center">
                          <BookOpen className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                          <p className="text-slate-500">Nenhum exemplar encontrado.</p>
                        </div>
                      ) : (
                        <div className="border rounded-xl overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead className="font-semibold">Biblioteca</TableHead>
                                <TableHead className="text-center font-semibold">Total</TableHead>
                                <TableHead className="text-center font-semibold">Disponíveis</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {libraryAvailability.map((avail) => (
                                <TableRow key={avail.libraryId} className="hover:bg-slate-50">
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-lime-600" />
                                      <Button
                                        variant="link"
                                        className="p-0 h-auto font-medium text-slate-700 hover:text-lime-700"
                                        onClick={() => handleGoToLibrary(avail.libraryId)}
                                      >
                                        {avail.libraryName}
                                        <ChevronRight className="h-3 w-3 ml-1" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="font-medium">{avail.totalCopies}</span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge 
                                      className={cn(
                                        "font-semibold",
                                        avail.availableCopies > 0 
                                          ? "bg-lime-500 hover:bg-lime-600" 
                                          : "bg-slate-400"
                                      )}
                                    >
                                      {avail.availableCopies}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Evento */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  {selectedEvent.banner_url && (
                    <img
                      src={selectedEvent.banner_url}
                      alt={selectedEvent.title}
                      className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={cn(
                        "font-semibold",
                        getCategoryStyle(selectedEvent.category).bg,
                        getCategoryStyle(selectedEvent.category).text
                      )}>
                        {selectedEvent.category}
                      </Badge>
                    </div>
                    <DialogTitle className="text-xl font-bold">{selectedEvent.title}</DialogTitle>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="mt-6 space-y-4">
                {/* Data e Hora */}
                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
                  <div className="flex flex-col items-center justify-center bg-white rounded-xl px-4 py-3 shadow-sm min-w-[80px]">
                    <span className="text-3xl font-bold text-purple-600">
                      {formatEventDate(selectedEvent.date).day}
                    </span>
                    <span className="text-xs font-medium text-slate-500 uppercase">
                      {formatEventDate(selectedEvent.date).month}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-700">
                      {formatEventDate(selectedEvent.date).fullDate}
                    </p>
                    <div className="flex items-center gap-2 text-slate-500 mt-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatEventDate(selectedEvent.date).time}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-700">Local</p>
                      <p className="text-slate-500">{selectedEvent.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Library className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-700">
                        {selectedEvent.libraries && selectedEvent.libraries.length > 1 ? 'Bibliotecas' : 'Biblioteca'}
                      </p>
                      <p className="text-slate-500">
                        {selectedEvent.libraries && selectedEvent.libraries.length > 0
                          ? selectedEvent.libraries.map(l => l.name).join(', ')
                          : selectedEvent.library?.name || 'Biblioteca não informada'}
                      </p>
                    </div>
                  </div>

                  {selectedEvent.description && (
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-700">Sobre o evento</p>
                        <p className="text-slate-500">{selectedEvent.description}</p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.expected_audience > 0 && (
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-700">Público Esperado</p>
                        <p className="text-slate-500">{selectedEvent.expected_audience} pessoas</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-400">
                    Para mais informações, entre em contato com a biblioteca responsável.
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer Moderno */}
      <footer className="bg-slate-900 text-white mt-16">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {appearanceConfig.network_logo ? (
                  <img 
                    src={appearanceConfig.network_logo} 
                    alt="Beabah!" 
                    className="h-10 w-10 object-cover rounded-full border-2 border-lime-400/50"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center">
                    <Library className="h-5 w-5 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg">Beabah!</h3>
                  <p className="text-xs text-slate-400">Rede de Bibliotecas Comunitárias</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Democratizando e descentralizando o acesso à cultura, leitura, escrita e educação desde 2008.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-lime-400">Links Rápidos</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <button onClick={() => setActiveTab('acervo')} className="hover:text-white transition-colors">
                    Consultar Acervo
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('bibliotecas')} className="hover:text-white transition-colors">
                    Nossas Bibliotecas
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('agenda')} className="hover:text-white transition-colors">
                    Agenda Cultural
                  </button>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-lime-400">Área Administrativa</h4>
              <p className="text-sm text-slate-400">
                Acesse a área restrita para bibliotecários e administradores da rede.
              </p>
              <Link to="/auth">
                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                  Acessar Sistema
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © 2024 Beabah! - Todos os direitos reservados
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Heart className="h-3 w-3 text-red-400" />
              <span>Feito com amor pelo Rio Grande do Sul</span>
            </div>
          </div>
        </div>
      </footer>
      
      {/* CSS para animações */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
