import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Library, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkVersionAndUpdate } from "@/utils/cacheManager";
import { APP_VERSION } from "@/version";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [networkLogo, setNetworkLogo] = useState<string>("");
  const [isCheckingVersion, setIsCheckingVersion] = useState(true);
  const { login } = useAuth();

  // ====== VERIFICAÇÃO DE VERSÃO AO ABRIR A TELA DE LOGIN ======
  // Toda vez que o usuário acessar /auth, verificamos se ele está na versão mais recente.
  // Se não estiver, limpamos o cache e forçamos recarregamento antes mesmo de mostrar o formulário.
  useEffect(() => {
    const verifyVersion = async () => {
      try {
        console.log(`[Auth] 🔍 Verificando versão do sistema (local: v${APP_VERSION})...`);
        const needsReload = await checkVersionAndUpdate();
        
        if (needsReload) {
          // A página será recarregada, não precisamos fazer mais nada
          return;
        }
        
        console.log('[Auth] ✅ Versão OK, exibindo tela de login.');
      } catch (error) {
        console.warn('[Auth] Erro na verificação de versão, continuando normalmente:', error);
      } finally {
        setIsCheckingVersion(false);
      }
    };

    verifyVersion();
  }, []);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('appearance_config')
          .select('network_logo')
          .eq('id', 'global')
          .single();

        console.log('[Auth] appearance_config data:', data, 'error:', error);

        if (data && !error && data.network_logo) {
          console.log('[Auth] Setting network_logo:', data.network_logo);
          setNetworkLogo(data.network_logo);
        } else {
          // Fallback para localStorage
          const saved = localStorage.getItem('beabah_appearance_config');
          console.log('[Auth] Fallback localStorage:', saved);
          if (saved) {
            const config = JSON.parse(saved);
            if (config.network_logo) {
              setNetworkLogo(config.network_logo);
            }
          }
        }
      } catch (error) {
        console.error('[Auth] Error loading logo:', error);
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // ====== VERIFICAÇÃO DE VERSÃO AO CLICAR NO BOTÃO ======
    // Antes de fazer login, verificar se a versão está atualizada.
    // Se estiver desatualizada, redireciona para /update.html que limpa tudo.
    try {
      const resp = await fetch(`/version.json?_=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store', 'Pragma': 'no-cache' }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.version && data.version !== APP_VERSION) {
          console.log(`[Auth] ⚠️ Versão desatualizada ao clicar login! Local: ${APP_VERSION}, Remota: ${data.version}`);
          console.log('[Auth] Redirecionando para /update.html...');
          window.location.href = '/update.html';
          return; // Não continua com o login
        }
      }
    } catch (err) {
      console.warn('[Auth] Erro na verificação de versão pré-login:', err);
      // Em caso de erro, continua com o login normalmente
    }

    await login(email, password);
    setIsSubmitting(false);
  };

  // Enquanto verifica a versão, mostra um loading elegante
  if (isCheckingVersion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4 gap-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Verificando versão do sistema...</span>
        </div>
        <span className="text-[10px] text-muted-foreground/60">v{APP_VERSION}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2 overflow-hidden">
            {networkLogo ? (
              <img 
                src={networkLogo} 
                alt="Beabah!" 
                className="w-full h-full object-cover"
                onError={() => setNetworkLogo("")}
              />
            ) : (
              <div className="bg-primary/10 w-full h-full flex items-center justify-center">
                <Library className="w-8 h-8 text-primary" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Beabah!</CardTitle>
          <CardDescription>
            Rede de Bibliotecas Comunitárias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@rede.com" 
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Senha</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-9"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Acessar Área Restrita"}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-xs text-muted-foreground">
            Esqueceu a senha? Contate a Administração da Rede.
          </div>

          {/* Versão do sistema */}
          <div className="mt-3 text-center">
            <span className="text-[10px] text-muted-foreground/50 select-none">v{APP_VERSION}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}