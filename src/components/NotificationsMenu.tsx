import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error";
  date: Date;
  read: boolean;
  link?: string;
};

export function NotificationsMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Carregar notificações sempre que abrir o menu ou mudar usuário
  useEffect(() => {
    if (user) fetchNotifications();
  }, [user, isOpen]);

  const fetchNotifications = async () => {
    const loadedNotifs: Notification[] = [];

    // 1. BUSCAR ATRASOS REAIS (Cálculo em tempo real)
    // Isso é melhor que salvar no banco, pois muda a cada segundo
    let loansQuery = (supabase as any)
      .from("loans")
      .select("*, copies(title), users_profile(name)")
      .eq("status", "aberto")
      .lt("due_date", new Date().toISOString()); // Data prevista menor que hoje (Atrasado)

    if (user?.role === 'bibliotecario' && user.library_id) {
      loansQuery = loansQuery.eq("library_id", user.library_id);
    }

    const { data: overdueLoans } = await loansQuery;

    if (overdueLoans && overdueLoans.length > 0) {
      // Agrupar ou mostrar individual? Vamos mostrar um resumo se forem muitos
      if (overdueLoans.length > 3) {
        loadedNotifs.push({
          id: "overdue-summary",
          title: "Atenção: Itens Atrasados",
          message: `Existem ${overdueLoans.length} empréstimos vencidos precisando de atenção.`,
          type: "error",
          date: new Date(),
          read: false,
          link: "/admin/circulacao"
        });
      } else {
        // Mostrar um por um se forem poucos
        overdueLoans.forEach((loan: any) => {
          loadedNotifs.push({
            id: `overdue-${loan.id}`,
            title: "Atraso Detectado",
            message: `"${loan.copies?.title}" (${loan.users_profile?.name}) venceu em ${new Date(loan.due_date).toLocaleDateString()}.`,
            type: "error",
            date: new Date(loan.due_date), // Data do vencimento
            read: false,
            link: "/admin/circulacao"
          });
        });
      }
    }

    // 2. BUSCAR AVISOS DO SISTEMA (Tabela Notifications)
    let sysQuery = supabase
      .from("notifications")
      .select("*")
      .eq("read", false)
      .order("created_at", { ascending: false });
      
    // Filtros de destino (para mim ou para minha biblioteca)
    // (Simplificado para o MVP: traz tudo)
    
    const { data: sysNotifs } = await sysQuery;
    
    if (sysNotifs) {
      sysNotifs.forEach((n: any) => {
        loadedNotifs.push({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type as any,
          date: new Date(n.created_at),
          read: n.read,
        });
      });
    }

    setNotifications(loadedNotifs);
    setUnreadCount(loadedNotifs.filter(n => !n.read).length);
  };

  const handleClick = (notification: Notification) => {
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
    // Aqui poderíamos marcar como lida no banco se fosse persistente
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">Notificações</h4>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} novas
            </Badge>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Check className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">Tudo em dia!</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  className="w-full flex flex-col items-start gap-1 p-4 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => handleClick(notif)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className={`h-2 w-2 rounded-full ${
                      notif.type === 'error' ? 'bg-red-500' : 
                      notif.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <span className="font-medium text-sm flex-1">{notif.title}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {notif.date.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-4 line-clamp-2">
                    {notif.message}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}