import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  library_id?: string;
  library_name?: string;
  avatar_url?: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Ao abrir o site, verifica se já tem alguém salvo no "localStorage"
  useEffect(() => {
    const savedUser = localStorage.getItem("sgbc_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      // Normalizar email (trim e lowercase)
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPass = pass.trim();

      // Primeiro, verificar se o usuário existe
      const { data: userCheckData, error: userCheckError } = await (supabase as any)
        .from("users_profile")
        .select("id, email, active, password, role")
        .ilike("email", normalizedEmail); // Usar ilike para case-insensitive

      if (userCheckError) {
        console.error("Erro ao buscar usuário:", userCheckError);
        throw new Error("Erro ao verificar usuário. Tente novamente.");
      }

      if (!userCheckData || userCheckData.length === 0) {
        throw new Error("Email não encontrado. Verifique se o email está correto.");
      }

      const userCheck = userCheckData[0]; // Pegar o primeiro resultado

      // Verificar se o usuário está ativo
      if (!userCheck.active) {
        throw new Error("Usuário inativo. Contate a administração.");
      }

      // Verificar se a senha está correta (comparação direta)
      // Verificar se a senha existe
      if (!userCheck.password || userCheck.password.trim() === '') {
        throw new Error("Usuário sem senha cadastrada. Contate a administração para definir uma senha.");
      }

      // Comparar senhas (trim para remover espaços)
      if (userCheck.password.trim() !== normalizedPass) {
        throw new Error("Senha incorreta. Verifique sua senha.");
      }

      // Se chegou aqui, buscar dados completos do usuário
      const { data, error } = await (supabase as any)
        .from("users_profile")
        .select("*, libraries(name)")
        .eq("id", userCheck.id)
        .single();

      if (error || !data) {
        throw new Error("Erro ao carregar dados do usuário.");
      }

      // DEBUG: Log dos dados do usuário
      console.log('[AuthContext] Dados do usuário carregados:', {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        library_id: data.library_id,
        library_name: data.libraries?.name
      });

      const userData = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        library_id: data.library_id || null, // Garantir que seja null se não existir
        library_name: data.libraries?.name || undefined,
        avatar_url: data.avatar_url || undefined
      };

      // DEBUG: Log do userData final
      console.log('[AuthContext] userData final:', userData);

      setUser(userData);
      localStorage.setItem("sgbc_user", JSON.stringify(userData));
      
      navigate("/admin"); // Redireciona para o dashboard administrativo
      
    } catch (err: any) {
      console.error("Erro no login:", err);
      toast({ title: "Erro de Acesso", description: err.message || "Erro ao fazer login. Tente novamente.", variant: "destructive" });
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sgbc_user");
    navigate("/auth"); // Manda de volta para o login
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}