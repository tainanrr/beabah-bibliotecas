import { useState } from 'react';
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
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', roles: ['admin_rede', 'bibliotecario'] },
  { icon: Building2, label: 'Bibliotecas', path: '/admin/bibliotecas', roles: ['admin_rede'] },
  { icon: ArrowLeftRight, label: 'Circulação', path: '/admin/circulacao', roles: ['bibliotecario', 'admin_rede'] },
  { icon: BookOpen, label: 'Catálogo', path: '/admin/catalogo', roles: ['admin_rede', 'bibliotecario'] },
  { icon: BookMarked, label: 'Acervo Local', path: '/admin/acervo', roles: ['bibliotecario', 'admin_rede'] },
  { icon: Users, label: 'Leitores', path: '/admin/leitores', roles: ['bibliotecario', 'admin_rede'] },
  { icon: Calendar, label: 'Eventos', path: '/admin/eventos', roles: ['admin_rede', 'bibliotecario'] },
  { icon: FileText, label: 'Auditoria', path: '/admin/auditoria', roles: ['admin_rede'] },
  { icon: Settings, label: 'Configurações', path: '/admin/configuracoes', roles: ['admin_rede'] },
];

export function AppSidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <Library className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div className="slide-in-left">
              <h1 className="text-sm font-semibold text-sidebar-foreground">BiblioRede</h1>
              <p className="text-xs text-sidebar-muted">Gestão Estadual</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary mx-auto">
            <Library className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
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
