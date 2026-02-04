import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Library,
  BookOpen,
  Users,
  ArrowLeftRight,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  Building2,
  Calendar,
  HelpCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', roles: ['admin_rede', 'bibliotecario'] },
  { icon: Building2, label: 'Bibliotecas', path: '/admin/bibliotecas', roles: ['admin_rede'] },
  { icon: ArrowLeftRight, label: 'Circulação', path: '/admin/circulacao', roles: ['bibliotecario', 'admin_rede'] },
  { icon: BookOpen, label: 'Catálogo', path: '/admin/catalogo', roles: ['admin_rede', 'bibliotecario'] },
  { icon: BookMarked, label: 'Acervo Local', path: '/admin/acervo', roles: ['bibliotecario', 'admin_rede'] },
  { icon: Users, label: 'Leitores', path: '/admin/leitores', roles: ['bibliotecario', 'admin_rede'] },
  { icon: Calendar, label: 'Monitoramento', path: '/admin/eventos', roles: ['admin_rede', 'bibliotecario'] },
  { icon: FileText, label: 'Auditoria', path: '/admin/auditoria', roles: ['admin_rede'] },
  { icon: Settings, label: 'Configurações', path: '/admin/configuracoes', roles: ['admin_rede'] },
  { icon: HelpCircle, label: 'Ajuda', path: '/admin/ajuda', roles: ['admin_rede', 'bibliotecario'] },
];

export function AppSidebar({ collapsed, onToggle, isMobile = false }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const [networkLogo, setNetworkLogo] = useState<string>("");
  const [libraryLogo, setLibraryLogo] = useState<string>("");
  const [libraryName, setLibraryName] = useState<string>("");
  const [libraryCity, setLibraryCity] = useState<string>("");

  const isAdmin = user?.role === 'admin_rede';
  const isBibliotecario = user?.role === 'bibliotecario';

  useEffect(() => {
    const loadLogo = async () => {
      try {
        // Sempre carregar o logo da rede
        const { data, error } = await (supabase as any)
          .from('appearance_config')
          .select('network_logo')
          .eq('id', 'global')
          .single();

        console.log('[AppSidebar] network_logo data:', data);

        if (data && !error && data.network_logo) {
          setNetworkLogo(data.network_logo);
        } else {
          // Fallback para localStorage
          const saved = localStorage.getItem('beabah_appearance_config');
          if (saved) {
            const config = JSON.parse(saved);
            if (config.network_logo) {
              setNetworkLogo(config.network_logo);
            }
          }
        }

        // Se for bibliotecário, buscar dados da biblioteca
        if (isBibliotecario && user?.library_id) {
          const { data: libraryData, error: libraryError } = await (supabase as any)
            .from('libraries')
            .select('name, city, image_url')
            .eq('id', user.library_id)
            .single();

          console.log('[AppSidebar] library data:', libraryData);

          if (libraryData && !libraryError) {
            setLibraryName(libraryData.name || '');
            setLibraryCity(libraryData.city || '');
            setLibraryLogo(libraryData.image_url || '');
          }
        }
      } catch (error) {
        console.error('[AppSidebar] Error loading logo:', error);
        // Fallback para localStorage
        const saved = localStorage.getItem('beabah_appearance_config');
        if (saved) {
          const config = JSON.parse(saved);
          if (config.network_logo) {
            setNetworkLogo(config.network_logo);
          }
        }
      }
    };

    loadLogo();
  }, [user, isBibliotecario]);

  // Determinar qual logo e nome exibir
  const displayLogo = isBibliotecario && libraryLogo ? libraryLogo : networkLogo;
  const displayName = isBibliotecario && libraryName ? libraryName : 'Beabah!';
  const displaySubtitle = isBibliotecario && libraryCity ? libraryCity : 'Rede de Bibliotecas Comunitárias';

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen gradient-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-3">
            {displayLogo ? (
              <img 
                src={displayLogo} 
                alt={displayName} 
                className="h-9 w-9 object-cover rounded-full border-2 border-sidebar-border"
                onError={() => {
                  if (isBibliotecario) {
                    setLibraryLogo("");
                  } else {
                    setNetworkLogo("");
                  }
                }}
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary">
                <Library className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
            )}
            <div className="slide-in-left">
              <h1 className="text-sm font-semibold text-sidebar-foreground">{displayName}</h1>
              <p className="text-xs text-sidebar-muted">{displaySubtitle}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <>
            {displayLogo ? (
              <img 
                src={displayLogo} 
                alt={displayName} 
                className="h-9 w-9 mx-auto object-cover rounded-full border-2 border-sidebar-border"
                onError={() => {
                  if (isBibliotecario) {
                    setLibraryLogo("");
                  } else {
                    setNetworkLogo("");
                  }
                }}
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary mx-auto">
                <Library className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        {menuItems
          .filter((item) => {
            // Filtrar itens baseado no role do usuário
            if (!user?.role) return false;
            return item.roles.includes(user.role);
          })
          .map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                // Fechar menu mobile ao navegar
                if (isMobile) {
                  onToggle();
                }
              }}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-sidebar-primary')} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Toggle Button */}
      <div className="absolute bottom-4 right-0 translate-x-1/2">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onToggle}
          className="rounded-full border-sidebar-border bg-sidebar hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-sidebar-foreground" />
          )}
        </Button>
      </div>
    </aside>
  );
}
