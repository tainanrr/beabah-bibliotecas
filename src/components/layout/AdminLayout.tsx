import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  // Atualizar título da página e favicon baseado no usuário
  useEffect(() => {
    const updatePageTitleAndFavicon = async () => {
      try {
        // Atualizar título
        let title = 'Beabah!';
        
        if (user?.role === 'bibliotecario' && user.library_id) {
          try {
            // Buscar nome da biblioteca
            const { data: libraryData, error: libraryError } = await (supabase as any)
              .from('libraries')
              .select('name')
              .eq('id', user.library_id)
              .single();
            
            if (!libraryError && libraryData?.name) {
              title = `Beabah! - ${libraryData.name}`;
            }
          } catch (error) {
            console.error('Erro ao buscar nome da biblioteca:', error);
            // Continuar com título padrão se houver erro
          }
        }
        
        document.title = title;

        // Atualizar favicon
        const updateFavicon = (faviconUrl: string) => {
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
          
          createRoundedFavicon(faviconUrl);
        };

        const { data: configData, error: configError } = await (supabase as any)
          .from('appearance_config')
          .select('favicon')
          .eq('id', 'global')
          .single();

        if (configData && !configError && configData.favicon) {
          updateFavicon(configData.favicon);
        } else {
          // Fallback para localStorage
          const saved = localStorage.getItem('beabah_appearance_config');
          if (saved) {
            const config = JSON.parse(saved);
            if (config.favicon) {
              updateFavicon(config.favicon);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao atualizar título/favicon:', error);
        document.title = user?.role === 'admin_rede' ? 'Beabah!' : 'Beabah! - Sistema de Gestão';
      }
    };

    if (user) {
      updatePageTitleAndFavicon();
    }
  }, [user]);

  // Remover cores personalizadas se existirem
  useEffect(() => {
    const root = document.documentElement;
    root.style.removeProperty('--library-primary');
    root.style.removeProperty('--library-secondary');
    root.style.removeProperty('--library-accent');
    root.style.removeProperty('--library-tertiary');
    root.style.removeProperty('--library-primary-10');
    root.style.removeProperty('--library-primary-20');
    root.style.removeProperty('--library-primary-90');
    root.style.removeProperty('--library-accent-10');
    root.style.removeProperty('--library-accent-5');
    root.style.removeProperty('--library-accent-20');
    root.style.removeProperty('--library-accent-90');
    document.body.removeAttribute('data-library-colors');
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
          <AppSidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Header */}
      <AppHeader
        sidebarCollapsed={sidebarCollapsed}
        onMobileMenuToggle={() => setMobileMenuOpen(true)}
      />

      {/* Main Content */}
      <main
        className={cn(
          'pt-16 transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        )}
      >
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
