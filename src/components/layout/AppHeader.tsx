import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronRight, LogOut, Settings, User, Menu, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { APP_VERSION, BUILD_NUMBER } from '@/version';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle: () => void;
}

const breadcrumbMap: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/bibliotecas': 'Bibliotecas',
  '/admin/circulacao': 'Circulação',
  '/admin/catalogo': 'Catálogo',
  '/admin/acervo': 'Acervo Local',
  '/admin/leitores': 'Leitores',
  '/admin/eventos': 'Gestão de Eventos',
  '/admin/auditoria': 'Auditoria',
  '/admin/configuracoes': 'Configurações',
  '/admin/ajuda': 'Central de Ajuda',
};

export function AppHeader({ sidebarCollapsed, onMobileMenuToggle }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const currentPage = breadcrumbMap[location.pathname] || 'Dashboard';
  const [isClearing, setIsClearing] = useState(false);

  // Função para limpar cache e forçar atualização
  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      // 1. Limpar caches do Service Worker
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        console.log('✅ Service Worker caches limpos');
      }

      // 2. Desregistrar Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
        console.log('✅ Service Workers desregistrados');
      }

      // 3. Limpar localStorage (exceto dados de autenticação)
      const authKeys = ['sb-auth-token', 'supabase.auth.token'];
      const savedAuthData: Record<string, string | null> = {};
      
      // Salvar dados de autenticação
      for (const key of Object.keys(localStorage)) {
        if (authKeys.some(ak => key.includes(ak)) || key.startsWith('sb-')) {
          savedAuthData[key] = localStorage.getItem(key);
        }
      }
      
      // Limpar tudo
      localStorage.clear();
      sessionStorage.clear();
      
      // Restaurar dados de autenticação
      for (const [key, value] of Object.entries(savedAuthData)) {
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      }
      
      console.log('✅ localStorage e sessionStorage limpos (auth preservado)');

      // 4. Forçar recarregamento completo (sem cache)
      // Pequeno delay para o usuário ver a animação
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      // Mesmo em caso de erro, recarregar
      window.location.reload();
    }
  };

  // Função para obter iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 border-b border-border bg-card transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64',
        'max-lg:left-0'
      )}
    >
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumbs - oculto em mobile pequeno, mostra só página atual */}
        <nav className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
          <span className="text-muted-foreground hidden sm:inline">Beabah!</span>
          <ChevronRight className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground hidden sm:inline" />
          <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none">{currentPage}</span>
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Versão do Sistema */}
          <span className="text-[10px] text-muted-foreground hidden sm:inline select-none">
            v{APP_VERSION}
          </span>

          {/* Botão Limpar Cache / Atualizar */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleClearCache}
                  disabled={isClearing}
                >
                  <RefreshCw className={cn("h-4 w-4", isClearing && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Limpar cache e atualizar (v{APP_VERSION} build {BUILD_NUMBER})</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-3 px-2">
                <Avatar className="h-8 w-8">
                  {user?.avatar_url ? (
                    <AvatarImage src={user.avatar_url} alt={user.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {user ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-medium">{user?.name || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.role === 'admin_rede' ? 'Admin Rede' : user?.role === 'bibliotecario' ? 'Bibliotecário' : user?.role || 'Usuário'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/admin/profile')}>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/admin/configuracoes')}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
