import { useState, useEffect, useMemo } from 'react';
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
  Building2,
  Eye,
  Phone,
  Navigation,
  Clock,
  ExternalLink,
  Calendar,
  Sparkles,
  FileText,
  Globe,
  Tag,
  Info,
  Instagram,
  Heart,
  BookMarked,
  ChevronRight,
  ChevronLeft,
  Loader2,
  List,
  CalendarDays,
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
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

// Ícone customizado para o mapa - mais bonito
const createCustomIcon = (color: string = '#84cc16') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        transform: rotate(45deg);
        color: white;
        font-size: 14px;
        font-weight: bold;
      ">📚</div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const customIcon = createCustomIcon('#84cc16');

// Componente para controlar o centro do mapa
function MapController({ center, zoom = 15 }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [center, zoom, map]);
  return null;
}

type Book = Tables<'books'>;
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
  end_date?: string;
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
  location_lat?: number;
  location_lng?: number;
};

type EventWithLibrary = Event & {
  library?: { name: string } | null;
  libraries?: Array<{ id: string; name: string }>;
};

// Cores para livros
const getBookColor = (title: string) => {
  const colors = [
    'from-slate-800 to-blue-900',
    'from-purple-600 to-violet-700',
    'from-lime-500 to-emerald-600',
    'from-rose-500 to-red-600',
    'from-blue-700 to-indigo-800',
    'from-amber-500 to-orange-600',
  ];
  return colors[title.charCodeAt(0) % colors.length];
};

const getInitials = (title: string) => {
  const words = title.split(' ').filter(w => w.length > 0);
  return words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : title.substring(0, 2).toUpperCase();
};

// Cores para categorias
const getCategoryStyle = (category: string) => {
  const styles: Record<string, { bg: string; text: string }> = {
    'Oficina': { bg: 'bg-lime-500', text: 'text-white' },
    'Sarau': { bg: 'bg-purple-500', text: 'text-white' },
    'Leitura': { bg: 'bg-blue-500', text: 'text-white' },
    'Mediação': { bg: 'bg-pink-500', text: 'text-white' },
    'Encontro': { bg: 'bg-amber-500', text: 'text-white' },
    'default': { bg: 'bg-slate-500', text: 'text-white' },
  };
  return styles[category] || styles['default'];
};

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMapLibrary, setSelectedMapLibrary] = useState<LibraryWithLocation | null>(null);
  const [activeTab, setActiveTab] = useState("acervo");
  const [allEvents, setAllEvents] = useState<EventWithLibrary[]>([]);
  const [events, setEvents] = useState<EventWithLibrary[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithLibrary | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [stats, setStats] = useState({ libraries: 0, books: 0, copies: 0, readers: 0 });
  const [appearanceConfig, setAppearanceConfig] = useState({
    network_logo: "", favicon: "", cover_image: "",
    primary_color: "#1e293b", secondary_color: "#1e40af",
    accent_color: "#84cc16", tertiary_color: "#a855f7",
  });
  
  // Calendário de eventos
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [eventViewMode, setEventViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [dayEventsDialogOpen, setDayEventsDialogOpen] = useState(false);

  // Filtros
  const filterLibraries = () => {
    let filtered = [...allLibraries];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lib => 
        lib.name.toLowerCase().includes(query) ||
        lib.city.toLowerCase().includes(query) ||
        ((lib as any).address && (lib as any).address.toLowerCase().includes(query))
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
        const libraryNames = event.libraries?.map(l => l.name.toLowerCase()).join(' ') || event.library?.name?.toLowerCase() || '';
        return event.title.toLowerCase().includes(query) || event.location.toLowerCase().includes(query) || libraryNames.includes(query);
      });
    }
    if (selectedLibrary !== 'all') {
      filtered = filtered.filter(event => {
        if (event.libraries && event.libraries.length > 0) return event.libraries.some(lib => lib.id === selectedLibrary);
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
      const { data, error } = await (supabase as any).from('appearance_config').select('*').eq('id', 'global').single();
      if (data && !error) {
        setAppearanceConfig({
          network_logo: data.network_logo || "", favicon: data.favicon || "", cover_image: data.cover_image || "",
          primary_color: data.primary_color || "#1e293b", secondary_color: data.secondary_color || "#1e40af",
          accent_color: data.accent_color || "#84cc16", tertiary_color: data.tertiary_color || "#a855f7",
        });
        if (data.favicon) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.beginPath(); ctx.arc(32, 32, 32, 0, 2 * Math.PI); ctx.clip();
              ctx.drawImage(img, 0, 0, 64, 64);
              document.querySelectorAll("link[rel*='icon']").forEach(l => l.remove());
              const link = document.createElement('link');
              link.rel = 'icon'; link.type = 'image/png'; link.href = canvas.toDataURL('image/png');
              document.head.appendChild(link);
            }
          };
          img.src = data.favicon;
        }
      }
    } catch (error) { console.error('Erro ao carregar configurações:', error); }
  };

  useEffect(() => {
    if (activeTab === 'acervo') loadBooks();
    else if (activeTab === 'bibliotecas') filterLibraries();
    else if (activeTab === 'agenda') filterEvents();
  }, [searchQuery, selectedLibrary, activeTab]);

  useEffect(() => {
    if (activeTab === 'bibliotecas') filterLibraries();
    else if (activeTab === 'agenda') filterEvents();
  }, [activeTab]);

  const loadLibraries = async () => {
    try {
      const { data, error } = await (supabase as any).from('libraries').select('*').eq('active', true).order('name');
      if (error) throw error;
      setAllLibraries((data || []) as LibraryWithLocation[]);
      setLibraries((data || []) as LibraryWithLocation[]);
    } catch (error) { console.error('Erro ao carregar bibliotecas:', error); }
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
        libraries: librariesResult.count || 0, books: booksResult.count || 0,
        copies: copiesResult.count || 0, readers: readersResult.count || 0,
      });
    } catch (error) { console.error('Erro ao carregar estatísticas:', error); }
  };

  const loadEvents = async () => {
    try {
      setEventsLoading(true);
      const today = new Date(); today.setHours(0, 0, 0, 0);

      // Carregar eventos com biblioteca vinculada
      const { data, error } = await (supabase as any)
        .from('events')
        .select('*, libraries!events_library_id_fkey(id, name)')
        .eq('show_in_homepage', true)
        .gte('date', today.toISOString())
        .neq('status', 'cancelado')
        .order('date', { ascending: true });

      if (error) throw error;

      const eventsData = (data || []).map((event: any) => ({
        ...event,
        library: event.libraries,
        libraries: event.libraries ? [{ id: event.libraries.id, name: event.libraries.name }] : [],
      })) as EventWithLibrary[];

      // Também carregar via event_libraries
      if (eventsData.length > 0) {
        const eventIds = eventsData.map(e => e.id);
        const { data: eventLibrariesData } = await (supabase as any)
          .from('event_libraries')
          .select('event_id, library_id, libraries(id, name)')
          .in('event_id', eventIds);

        if (eventLibrariesData) {
          const librariesMap: Record<string, Array<{ id: string; name: string }>> = {};
          eventLibrariesData.forEach((el: any) => {
            if (!librariesMap[el.event_id]) librariesMap[el.event_id] = [];
            if (el.libraries) librariesMap[el.event_id].push({ id: el.libraries.id, name: el.libraries.name });
          });
          eventsData.forEach(event => {
            if (librariesMap[event.id] && librariesMap[event.id].length > 0) {
              event.libraries = librariesMap[event.id];
            }
          });
        }
      }

      // Carregar mediações
      const { data: mediationsData } = await (supabase as any)
        .from('reading_mediations')
        .select('*, libraries(id, name)')
        .eq('show_in_homepage', true)
        .gte('date', today.toISOString().split('T')[0])
        .order('date', { ascending: true });

      const mediationsAsEvents: EventWithLibrary[] = (mediationsData || []).map((m: any) => ({
        id: m.id,
        title: `Mediação de Leitura`,
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

      const allEventsData = [...eventsData, ...mediationsAsEvents].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setAllEvents(allEventsData);
      setEvents(allEventsData);
    } catch (error) { console.error('Erro ao carregar eventos:', error); }
    finally { setEventsLoading(false); }
  };

  const loadBooks = async () => {
    try {
      setLoading(true);
      let query = supabase.from('books').select('*, copies!inner(id, status, library_id, libraries(name))');
      if (searchQuery.trim()) query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,isbn.ilike.%${searchQuery}%`);
      if (selectedLibrary !== 'all') query = query.eq('copies.library_id', selectedLibrary);
      const { data: booksData, error } = await query.order('title').limit(50);
      if (error) throw error;

      const booksMap = new Map<string, any>();
      (booksData || []).forEach((item: any) => {
        if (!booksMap.has(item.id)) {
          const { copies, ...book } = item;
          booksMap.set(item.id, { ...book, totalCopies: 0, availableCopies: 0, cover_url: (book as any).cover_url || null });
        }
        const entry = booksMap.get(item.id)!;
        if (item.copies) {
          const copiesArr = Array.isArray(item.copies) ? item.copies : [item.copies];
          copiesArr.forEach((copy: any) => {
            if (copy?.id) { entry.totalCopies++; if (copy.status === 'disponivel') entry.availableCopies++; }
          });
        }
      });
      setBooks(Array.from(booksMap.values()));
    } catch (error) { console.error('Erro ao carregar livros:', error); setBooks([]); }
    finally { setLoading(false); }
  };

  const handleBookClick = async (book: Book) => {
    setSelectedBook(book);
    setDialogOpen(true);
    try {
      const { data: copiesData } = await supabase.from('copies').select('*, libraries(name)').eq('book_id', book.id);
      const { data: colorsData } = await (supabase as any).from('library_colors').select('*');
      setLibraryColors(colorsData || []);

      const availabilityMap = new Map<string, LibraryAvailability>();
      (copiesData || []).forEach((copy: any) => {
        if (!availabilityMap.has(copy.library_id)) {
          availabilityMap.set(copy.library_id, {
            libraryId: copy.library_id,
            libraryName: copy.libraries?.name || 'Biblioteca não encontrada',
            totalCopies: 0, availableCopies: 0, categories: [],
          });
        }
        const avail = availabilityMap.get(copy.library_id)!;
        avail.totalCopies++;
        if (copy.status === 'disponivel') avail.availableCopies++;
      });
      setLibraryAvailability(Array.from(availabilityMap.values()));
    } catch (error) { console.error('Erro:', error); setLibraryAvailability([]); }
  };

  const handleSearch = () => {
    if (activeTab === 'acervo') loadBooks();
    else if (activeTab === 'bibliotecas') filterLibraries();
    else if (activeTab === 'agenda') filterEvents();
  };

  const handleLibraryClick = (library: LibraryWithLocation) => {
    if (library.latitude && library.longitude) setSelectedMapLibrary(library);
  };

  const handleGoToLibrary = (libraryId: string) => {
    setDialogOpen(false);
    const library = libraries.find(lib => lib.id === libraryId);
    if (library) setSelectedMapLibrary(library);
    setActiveTab("bibliotecas");
    setSearchQuery('');
  };

  const getGoogleMapsUrl = (library: LibraryWithLocation) => {
    if (library.latitude && library.longitude) return `https://www.google.com/maps/dir/?api=1&destination=${library.latitude},${library.longitude}`;
    if ((library as any).address) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((library as any).address)}`;
    return null;
  };

  const getEventDirectionsUrl = (event: EventWithLibrary) => {
    if (event.location_lat && event.location_lng) return `https://www.google.com/maps/dir/?api=1&destination=${event.location_lat},${event.location_lng}`;
    if (event.location) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location)}`;
    return null;
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      fullDate: date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase(),
    };
  };

  const getMapCenter = (): [number, number] => {
    const withCoords = libraries.filter(lib => lib.latitude && lib.longitude);
    if (withCoords.length === 0) return [-30.0, -51.2];
    if (withCoords.length === 1) return [withCoords[0].latitude!, withCoords[0].longitude!];
    const avgLat = withCoords.reduce((s, l) => s + (l.latitude || 0), 0) / withCoords.length;
    const avgLng = withCoords.reduce((s, l) => s + (l.longitude || 0), 0) / withCoords.length;
    return [avgLat, avgLng];
  };

  // Calendário helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const eventsForSelectedDate = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return getEventsForDate(selectedCalendarDate);
  }, [selectedCalendarDate, events]);

  const librariesWithLocation = libraries.filter(lib => lib.latitude && lib.longitude);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header Compacto */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-2 cursor-pointer">
            {appearanceConfig.network_logo ? (
              <img src={appearanceConfig.network_logo} alt="Beabah!" className="h-9 w-9 object-cover rounded-full border-2 border-lime-400/50 shadow" />
            ) : (
              <div className="h-9 w-9 rounded-full shadow flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${appearanceConfig.primary_color}, ${appearanceConfig.secondary_color})` }}>
                <Library className="h-4 w-4 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-base font-bold text-slate-800">Beabah!</h1>
              <p className="text-[9px] text-slate-500 font-medium tracking-wide leading-none">REDE DE BIBLIOTECAS</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Compacto */}
      <section className="relative overflow-hidden py-10" style={{ background: `linear-gradient(135deg, ${appearanceConfig.primary_color}, ${appearanceConfig.secondary_color})` }}>
        {appearanceConfig.cover_image && (
          <div className="absolute inset-0">
            <img src={appearanceConfig.cover_image} alt="" className="w-full h-full object-cover opacity-15" />
          </div>
        )}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ backgroundColor: appearanceConfig.accent_color }} />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-15" style={{ backgroundColor: appearanceConfig.tertiary_color }} />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs mb-2">
                <Heart className="h-3 w-3 text-lime-400" />
                <span className="text-white/90">Desde 2008 transformando vidas através da leitura</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white">
                Democratizando o acesso à <span className="text-lime-300">cultura e educação</span>
              </h2>
            </div>
            
            {/* Stats compactos */}
            <div className="flex gap-3">
              {[
                { value: stats.libraries, label: 'Bibliotecas', icon: Building2 },
                { value: stats.books, label: 'Títulos', icon: BookOpen },
                { value: stats.copies, label: 'Exemplares', icon: BookMarked },
                { value: stats.readers, label: 'Leitores', icon: Users },
              ].map((stat) => (
                <div key={stat.label} className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                  <div className="text-lg font-bold text-white">{stat.value.toLocaleString()}</div>
                  <div className="text-[9px] text-white/60 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Barra de Pesquisa */}
      <section className="relative z-20 -mt-8 px-4 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-2xl border-2 border-white bg-white rounded-xl overflow-hidden">
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder={activeTab === 'acervo' ? "Buscar livros..." : activeTab === 'bibliotecas' ? "Buscar bibliotecas..." : "Buscar eventos..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="h-10 pl-9 text-sm border-2 border-slate-200 focus:border-lime-500 rounded-lg"
                  />
                </div>
                <Select value={selectedLibrary} onValueChange={setSelectedLibrary}>
                  <SelectTrigger className="h-10 w-full sm:w-[180px] border-2 border-slate-200 rounded-lg text-sm">
                    <Building2 className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    <SelectValue placeholder="Todas as bibliotecas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as bibliotecas</SelectItem>
                    {allLibraries.map((lib) => (
                      <SelectItem key={lib.id} value={lib.id}>{lib.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} className="h-10 px-5 rounded-lg font-semibold text-sm" style={{ background: `linear-gradient(135deg, ${appearanceConfig.accent_color}, ${appearanceConfig.secondary_color})` }}>
                  Pesquisar <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tabs */}
      <section className="py-6">
        <div className="container mx-auto px-4 lg:px-8">
          <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setSearchQuery(''); }} className="w-full" data-tabs-section>
            <div className="flex justify-center mb-6">
              <TabsList className="inline-flex h-auto p-1 bg-slate-100 rounded-xl">
                {[
                  { value: 'acervo', icon: BookOpen, label: 'Consultar Acervo' },
                  { value: 'bibliotecas', icon: MapPin, label: 'Nossas Bibliotecas' },
                  { value: 'agenda', icon: Calendar, label: 'Agenda Cultural' },
                ].map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow">
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Tab: Acervo */}
            <TabsContent value="acervo" className="mt-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 text-lime-500 animate-spin mb-3" />
                  <p className="text-slate-500">Carregando acervo...</p>
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="h-14 w-14 mx-auto text-slate-300 mb-3" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-1">Nenhum livro encontrado</h3>
                  <p className="text-slate-500 text-sm">Tente ajustar os filtros de busca.</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-800">
                      {searchQuery.trim() || selectedLibrary !== 'all' ? `${books.length} resultado(s)` : 'Acervo Digital'}
                    </h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {books.map((book) => (
                      <Card key={book.id} className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white rounded-xl" onClick={() => handleBookClick(book)}>
                        <CardContent className="p-0">
                          <div className="relative h-48 overflow-hidden">
                            {(book as any).cover_url ? (
                              <img src={(book as any).cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className={cn("w-full h-full bg-gradient-to-br flex flex-col items-center justify-center", getBookColor(book.title))}>
                                <div className="text-white text-3xl font-bold mb-1">{getInitials(book.title)}</div>
                                <BookOpen className="h-6 w-6 text-white/40" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2">
                              <Badge className={cn("font-semibold text-xs shadow", book.availableCopies && book.availableCopies > 0 ? "bg-lime-500 text-white" : "bg-slate-500 text-white")}>
                                {book.availableCopies || 0} disp.
                              </Badge>
                            </div>
                          </div>
                          <div className="p-3 space-y-2">
                            <h4 className="font-semibold text-slate-800 line-clamp-2 text-sm leading-tight">{book.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-1">{book.author || 'Autor não informado'}</p>
                            <Button variant="ghost" size="sm" className="w-full text-xs font-medium text-slate-600 hover:text-lime-700 hover:bg-lime-50 rounded-lg h-8">
                              <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver disponibilidade
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Tab: Bibliotecas - Layout Melhorado */}
            <TabsContent value="bibliotecas" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-lg" style={{ height: '500px' }}>
                {/* Lista - Mais compacta */}
                <div className="flex flex-col h-full bg-slate-50/50 border-r border-slate-200 overflow-hidden">
                  <div className="flex-shrink-0 p-3 bg-white border-b border-slate-200">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-lime-600" /> Bibliotecas da Rede
                    </h3>
                    <p className="text-xs text-slate-500">{libraries.length} bibliotecas</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                    {libraries.map((library) => {
                      const isSelected = selectedMapLibrary?.id === library.id;
                      const googleMapsUrl = getGoogleMapsUrl(library);
                      
                      return (
                        <div
                          key={library.id}
                          className={cn(
                            "p-2.5 rounded-lg cursor-pointer transition-all duration-200",
                            isSelected ? 'bg-lime-100 border-2 border-lime-500' : 'bg-white border border-slate-200 hover:border-lime-300 hover:bg-lime-50'
                          )}
                          onClick={() => handleLibraryClick(library)}
                        >
                          <div className="flex gap-2.5">
                            <div className="flex-shrink-0">
                              {(library as any).image_url ? (
                                <img src={(library as any).image_url} alt={library.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-800 text-sm leading-tight truncate">{library.name}</h4>
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                <MapPin className="h-3 w-3 inline mr-1" />
                                {(library as any).address || library.city}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                {(library as any).instagram && (
                                  <a href={(library as any).instagram} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                                    className="flex items-center justify-center w-6 h-6 rounded bg-gradient-to-br from-pink-500 to-purple-600 text-white text-xs">
                                    <Instagram className="h-3 w-3" />
                                  </a>
                                )}
                                {googleMapsUrl && (
                                  <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-medium" onClick={(e) => { e.stopPropagation(); window.open(googleMapsUrl, '_blank'); }}>
                                    <Navigation className="h-3 w-3 mr-1" /> Como chegar
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mapa */}
                <div className="h-full relative bg-slate-100">
                  {librariesWithLocation.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center">
                      <MapPin className="h-16 w-16 text-slate-300 mb-3" />
                      <p className="text-slate-500 font-medium">Nenhuma biblioteca com localização</p>
                    </div>
                  ) : (
                    <MapContainer center={getMapCenter()} zoom={selectedMapLibrary ? 14 : 7} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                      {selectedMapLibrary && selectedMapLibrary.latitude && selectedMapLibrary.longitude && (
                        <MapController center={[selectedMapLibrary.latitude, selectedMapLibrary.longitude]} zoom={14} />
                      )}
                      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {librariesWithLocation.map((library) => (
                        <Marker key={library.id} position={[library.latitude!, library.longitude!]} icon={customIcon} eventHandlers={{ click: () => setSelectedMapLibrary(library) }}>
                          <Popup className="rounded-lg min-w-[200px]">
                            <div className="space-y-2 p-1">
                              <h4 className="font-bold text-sm">{library.name}</h4>
                              <p className="text-xs text-slate-600">{(library as any).address || library.city}</p>
                              {(library as any).phone && <p className="text-xs text-slate-500"><Phone className="h-3 w-3 inline mr-1" />{(library as any).phone}</p>}
                              {getGoogleMapsUrl(library) && (
                                <Button variant="default" size="sm" className="w-full text-xs bg-lime-600 hover:bg-lime-700" onClick={() => window.open(getGoogleMapsUrl(library)!, '_blank')}>
                                  <Navigation className="mr-1.5 h-3 w-3" /> Como chegar
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

            {/* Tab: Agenda Cultural com Calendário */}
            <TabsContent value="agenda" className="mt-0">
              {eventsLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 text-purple-500 animate-spin mb-3" />
                  <p className="text-slate-500">Carregando agenda cultural...</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" /> Agenda Cultural
                      </h3>
                      <p className="text-slate-500 text-sm">{events.length} eventos agendados</p>
                    </div>
                    
                    {/* Toggle de visualização */}
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 px-3 text-xs transition-all",
                          eventViewMode === 'list' 
                            ? 'bg-white shadow text-slate-900 font-semibold' 
                            : 'text-slate-600 hover:text-slate-900'
                        )}
                        onClick={() => setEventViewMode('list')}
                      >
                        <List className="h-3.5 w-3.5 mr-1.5" /> Lista
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 px-3 text-xs transition-all",
                          eventViewMode === 'calendar' 
                            ? 'bg-white shadow text-slate-900 font-semibold' 
                            : 'text-slate-600 hover:text-slate-900'
                        )}
                        onClick={() => setEventViewMode('calendar')}
                      >
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5" /> Calendário
                      </Button>
                    </div>
                  </div>

                  {eventViewMode === 'calendar' ? (
                    /* Visualização Calendário */
                    <Card className="border-2 border-slate-200 rounded-xl overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <Button variant="outline" size="sm" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <h4 className="font-bold text-lg text-slate-800">
                            {MONTH_NAMES[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                          </h4>
                          <Button variant="outline" size="sm" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1">
                          {WEEK_DAYS.map(day => (
                            <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">{day}</div>
                          ))}
                          {getDaysInMonth(calendarDate).map((date, idx) => {
                            if (!date) return <div key={`empty-${idx}`} className="h-16" />;
                            
                            const dayEvents = getEventsForDate(date);
                            const isToday = date.toDateString() === new Date().toDateString();
                            const hasEvents = dayEvents.length > 0;
                            
                            return (
                              <button
                                key={date.toISOString()}
                                onClick={() => {
                                  if (hasEvents) {
                                    setSelectedCalendarDate(date);
                                    setDayEventsDialogOpen(true);
                                  }
                                }}
                                className={cn(
                                  "h-16 rounded-lg border text-left p-1.5 transition-all",
                                  isToday && "ring-2 ring-purple-500",
                                  hasEvents ? "bg-purple-50 border-purple-200 hover:bg-purple-100 cursor-pointer" : "border-slate-200 hover:bg-slate-50",
                                )}
                              >
                                <span className={cn("text-xs font-semibold", isToday ? "text-purple-600" : "text-slate-600")}>{date.getDate()}</span>
                                {hasEvents && (
                                  <div className="mt-0.5 space-y-0.5">
                                    {dayEvents.slice(0, 2).map((event, i) => (
                                      <div key={i} className={cn("text-[9px] px-1 py-0.5 rounded truncate font-medium", getCategoryStyle(event.category).bg, getCategoryStyle(event.category).text)}>
                                        {event.title}
                                      </div>
                                    ))}
                                    {dayEvents.length > 2 && (
                                      <div className="text-[9px] text-purple-600 font-medium">+{dayEvents.length - 2} mais</div>
                                    )}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ) : events.length === 0 ? (
                    <div className="text-center py-16">
                      <Calendar className="h-14 w-14 mx-auto text-slate-300 mb-3" />
                      <h3 className="text-lg font-semibold text-slate-700 mb-1">Nenhum evento agendado</h3>
                      <p className="text-slate-500 text-sm">Fique atento! Em breve teremos novos eventos.</p>
                    </div>
                  ) : (
                    /* Visualização Lista */
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {events.map((event) => {
                        const eventDate = formatEventDate(event.date);
                        const categoryStyle = getCategoryStyle(event.category);
                        const libraryName = event.libraries?.length ? event.libraries.map(l => l.name).join(', ') : event.library?.name || 'Biblioteca não informada';
                        
                        return (
                          <Card key={event.id} className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white rounded-xl">
                            <CardContent className="p-0">
                              <div className="relative h-32 overflow-hidden">
                                {event.banner_url ? (
                                  <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center">
                                    <Calendar className="h-10 w-10 text-white/50" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute top-2 left-2">
                                  <Badge className={cn("font-semibold text-xs shadow", categoryStyle.bg, categoryStyle.text)}>{event.category}</Badge>
                                </div>
                                <div className="absolute bottom-2 left-2 text-white">
                                  <div className="flex items-end gap-1.5">
                                    <div className="text-2xl font-bold leading-none">{eventDate.day}</div>
                                    <div className="text-xs opacity-80">{eventDate.month}</div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="p-3 space-y-2">
                                <h4 className="font-semibold text-slate-800 line-clamp-2 text-sm leading-tight">{event.title}</h4>
                                <div className="space-y-1 text-xs text-slate-500">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-3 w-3 text-purple-500" />
                                    <span>{eventDate.time}{event.end_date && ` - ${formatEventDate(event.end_date).time}`}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="h-3 w-3 text-purple-500" />
                                    <span className="truncate">{event.location}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Library className="h-3 w-3 text-purple-500" />
                                    <span className="truncate">{libraryName}</span>
                                  </div>
                                </div>
                                <Button
                                  className="w-full rounded-lg font-semibold text-xs h-8 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
                                  onClick={() => { setSelectedEvent(event); setEventDialogOpen(true); }}
                                >
                                  <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Ver detalhes
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Modal do Livro */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl">
          {selectedBook && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{selectedBook.title}</DialogTitle>
                <DialogDescription>{selectedBook.author && `por ${selectedBook.author}`}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 mt-4">
                <div className="space-y-4">
                  <div className="w-full rounded-lg overflow-hidden shadow">
                    {(selectedBook as any).cover_url ? (
                      <img src={(selectedBook as any).cover_url} alt={selectedBook.title} className="w-full object-cover" style={{ aspectRatio: '2/3' }} />
                    ) : (
                      <div className={cn("w-full bg-gradient-to-br flex flex-col items-center justify-center", getBookColor(selectedBook.title))} style={{ aspectRatio: '2/3' }}>
                        <div className="text-white text-4xl font-bold mb-2">{getInitials(selectedBook.title)}</div>
                        <BookOpen className="h-10 w-10 text-white/40" />
                      </div>
                    )}
                  </div>
                  <Card className="border border-slate-200">
                    <CardContent className="p-3 space-y-2">
                      <h3 className="font-semibold flex items-center gap-2 text-sm text-slate-700"><FileText className="h-4 w-4 text-lime-600" /> Ficha Técnica</h3>
                      <div className="space-y-1.5 text-xs">
                        {selectedBook.publisher && <div className="flex justify-between"><span className="text-slate-500">Editora</span><span className="font-medium">{selectedBook.publisher}</span></div>}
                        {selectedBook.pages && <div className="flex justify-between"><span className="text-slate-500">Páginas</span><span className="font-medium">{selectedBook.pages}</span></div>}
                        {selectedBook.isbn && <div className="flex justify-between"><span className="text-slate-500">ISBN</span><span className="font-mono text-xs">{selectedBook.isbn}</span></div>}
                        {selectedBook.language && <div className="flex justify-between"><span className="text-slate-500">Idioma</span><span className="font-medium">{selectedBook.language}</span></div>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-4">
                  {((selectedBook as any).description || (selectedBook as any).synopsis) && (
                    <Card className="border border-slate-200">
                      <CardContent className="p-3">
                        <h3 className="font-semibold flex items-center gap-2 text-sm text-slate-700 mb-2"><Info className="h-4 w-4 text-lime-600" /> Sinopse</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{(selectedBook as any).description || (selectedBook as any).synopsis}</p>
                      </CardContent>
                    </Card>
                  )}
                  <Card className="border border-slate-200">
                    <CardContent className="p-3">
                      <h3 className="font-semibold flex items-center gap-2 text-sm text-slate-700 mb-2"><Library className="h-4 w-4 text-lime-600" /> Onde Encontrar</h3>
                      {libraryAvailability.length === 0 ? (
                        <div className="py-6 text-center"><BookOpen className="h-10 w-10 mx-auto text-slate-300 mb-2" /><p className="text-slate-500 text-sm">Nenhum exemplar encontrado.</p></div>
                      ) : (
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader><TableRow className="bg-slate-50"><TableHead className="font-semibold text-xs">Biblioteca</TableHead><TableHead className="text-center font-semibold text-xs">Total</TableHead><TableHead className="text-center font-semibold text-xs">Disp.</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {libraryAvailability.map((avail) => (
                                <TableRow key={avail.libraryId}>
                                  <TableCell className="font-medium text-xs">
                                    <Button variant="link" className="p-0 h-auto text-xs font-medium text-slate-700 hover:text-lime-700" onClick={() => handleGoToLibrary(avail.libraryId)}>
                                      <MapPin className="h-3 w-3 mr-1 text-lime-600" />{avail.libraryName}<ChevronRight className="h-3 w-3 ml-1" />
                                    </Button>
                                  </TableCell>
                                  <TableCell className="text-center text-xs">{avail.totalCopies}</TableCell>
                                  <TableCell className="text-center"><Badge className={cn("text-xs", avail.availableCopies > 0 ? "bg-lime-500" : "bg-slate-400")}>{avail.availableCopies}</Badge></TableCell>
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

      {/* Modal do Evento */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-lg rounded-xl">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  {selectedEvent.banner_url && <img src={selectedEvent.banner_url} alt={selectedEvent.title} className="w-20 h-20 rounded-lg object-cover" />}
                  <div>
                    <Badge className={cn("font-semibold text-xs mb-1", getCategoryStyle(selectedEvent.category).bg, getCategoryStyle(selectedEvent.category).text)}>{selectedEvent.category}</Badge>
                    <DialogTitle className="text-lg font-bold">{selectedEvent.title}</DialogTitle>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="flex flex-col items-center justify-center bg-white rounded-lg px-3 py-2 shadow-sm min-w-[60px]">
                    <span className="text-2xl font-bold text-purple-600">{formatEventDate(selectedEvent.date).day}</span>
                    <span className="text-[10px] font-medium text-slate-500 uppercase">{formatEventDate(selectedEvent.date).month}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-700">{formatEventDate(selectedEvent.date).fullDate}</p>
                    <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{formatEventDate(selectedEvent.date).time}{selectedEvent.end_date && ` - ${formatEventDate(selectedEvent.end_date).time}`}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-purple-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-slate-700">Local</p>
                      <p className="text-xs text-slate-500">{selectedEvent.location}</p>
                    </div>
                    {getEventDirectionsUrl(selectedEvent) && (
                      <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => window.open(getEventDirectionsUrl(selectedEvent)!, '_blank')}>
                        <Navigation className="h-3 w-3 mr-1" /> Como chegar
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Library className="h-4 w-4 text-purple-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-slate-700">Biblioteca</p>
                      <p className="text-xs text-slate-500">
                        {selectedEvent.libraries?.length ? selectedEvent.libraries.map(l => l.name).join(', ') : selectedEvent.library?.name || 'Não informada'}
                      </p>
                    </div>
                  </div>

                  {selectedEvent.description && (
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-purple-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-slate-700">Sobre</p>
                        <p className="text-xs text-slate-500">{selectedEvent.description}</p>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 border-t pt-3">Para mais informações, entre em contato com a biblioteca.</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de eventos do dia */}
      <Dialog open={dayEventsDialogOpen} onOpenChange={setDayEventsDialogOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-purple-500" />
              {selectedCalendarDate && selectedCalendarDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </DialogTitle>
            <DialogDescription>{eventsForSelectedDate.length} evento(s) neste dia</DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
            {eventsForSelectedDate.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-all"
                onClick={() => { setSelectedEvent(event); setDayEventsDialogOpen(false); setEventDialogOpen(true); }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("w-2 h-full rounded-full self-stretch", getCategoryStyle(event.category).bg)} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn("text-[10px] px-1.5 py-0", getCategoryStyle(event.category).bg, getCategoryStyle(event.category).text)}>{event.category}</Badge>
                      <span className="text-xs text-slate-500">{formatEventDate(event.date).time}</span>
                    </div>
                    <h4 className="font-semibold text-sm text-slate-800">{event.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5"><MapPin className="h-3 w-3 inline mr-1" />{event.location}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-12">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {appearanceConfig.network_logo ? (
                  <img src={appearanceConfig.network_logo} alt="Beabah!" className="h-8 w-8 object-cover rounded-full border border-lime-400/50" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center">
                    <Library className="h-4 w-4 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm">Beabah!</h3>
                  <p className="text-[10px] text-slate-400">Rede de Bibliotecas Comunitárias</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">Democratizando o acesso à cultura, leitura e educação desde 2008.</p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-lime-400 text-sm">Links Rápidos</h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li><button onClick={() => { setActiveTab('acervo'); setSearchQuery(''); }} className="hover:text-white transition-colors">Consultar Acervo</button></li>
                <li><button onClick={() => { setActiveTab('bibliotecas'); setSearchQuery(''); }} className="hover:text-white transition-colors">Nossas Bibliotecas</button></li>
                <li><button onClick={() => { setActiveTab('agenda'); setSearchQuery(''); }} className="hover:text-white transition-colors">Agenda Cultural</button></li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-lime-400 text-sm">Área Administrativa</h4>
              <p className="text-xs text-slate-400">Acesso restrito para bibliotecários e administradores.</p>
              <Link to="/auth">
                <Button size="sm" className="bg-lime-600 hover:bg-lime-700 text-white font-semibold text-xs">
                  Acessar Sistema <ArrowRight className="ml-1.5 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-6 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[10px] text-slate-500">© 2024 Beabah! - Todos os direitos reservados</p>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <Heart className="h-3 w-3 text-red-400" />
              <span>Feito com amor pelo Rio Grande do Sul</span>
            </div>
          </div>
        </div>
      </footer>
      
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .custom-marker { background: transparent !important; border: none !important; }
      `}</style>
    </div>
  );
}
