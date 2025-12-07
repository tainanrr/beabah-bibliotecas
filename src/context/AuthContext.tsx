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
      // Busca na tabela users_profile se existe esse email e senha
      // Nota: Estamos usando comparação direta para simplificar o MVP. 
      // Em produção real, senhas devem ser hash.
      const { data, error } = await (supabase as any)
        .from("users_profile")
        .select("*, libraries(name)")
        .eq("email", email)
        .eq("password", pass) // Verifica a senha
        .eq("active", true)   // Verifica se não está bloqueado
        .single();

      if (error || !data) {
        throw new Error("Email ou senha inválidos.");
      }

      const userData = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        library_id: data.library_id,
        library_name: data.libraries?.name || undefined,
        avatar_url: data.avatar_url || undefined
      };

      setUser(userData);
      localStorage.setItem("sgbc_user", JSON.stringify(userData));
      
      toast({ title: "Bem-vindo!", description: `Olá, ${userData.name}` });
      navigate("/admin"); // Redireciona para o dashboard administrativo
      
    } catch (err: any) {
      toast({ title: "Erro de Acesso", description: err.message, variant: "destructive" });
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