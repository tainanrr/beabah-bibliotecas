/**
 * Utilitário centralizado para gerenciamento de cache do sistema.
 * Usado na tela de login para garantir que o usuário sempre tenha a versão mais recente.
 */

import { APP_VERSION } from '@/version';

/**
 * Limpa todos os caches do navegador (Service Worker, sessionStorage)
 * preservando dados essenciais no localStorage.
 * 
 * @param preserveKeys - Chaves do localStorage que devem ser preservadas
 */
export async function clearAllCaches(preserveKeys: string[] = []): Promise<void> {
  try {
    // 1. Limpar caches do Service Worker
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      console.log('[CacheManager] ✅ Service Worker caches limpos');
    }

    // 2. Desregistrar Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
      console.log('[CacheManager] ✅ Service Workers desregistrados');
    }

    // 3. Salvar dados que devem ser preservados
    const savedData: Record<string, string | null> = {};
    
    for (const key of Object.keys(localStorage)) {
      const shouldPreserve = preserveKeys.some(pk => key.includes(pk) || key.startsWith(pk));
      if (shouldPreserve) {
        savedData[key] = localStorage.getItem(key);
      }
    }

    // 4. Limpar tudo
    localStorage.clear();
    sessionStorage.clear();

    // 5. Restaurar dados preservados
    for (const [key, value] of Object.entries(savedData)) {
      if (value !== null) {
        localStorage.setItem(key, value);
      }
    }

    console.log('[CacheManager] ✅ localStorage e sessionStorage limpos');
  } catch (error) {
    console.error('[CacheManager] Erro ao limpar caches:', error);
  }
}

/**
 * Busca a versão mais recente do sistema a partir do version.json público.
 * Usa cache-busting para garantir que não receba uma versão cacheada.
 * 
 * @returns A versão remota ou null se não conseguir buscar
 */
export async function fetchRemoteVersion(): Promise<string | null> {
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });

    if (!response.ok) {
      console.warn('[CacheManager] Não foi possível buscar version.json:', response.status);
      return null;
    }

    const data = await response.json();
    return data.version || null;
  } catch (error) {
    console.warn('[CacheManager] Erro ao buscar versão remota:', error);
    return null;
  }
}

/**
 * Verifica se a versão local está desatualizada comparando com a versão remota.
 * Se estiver, limpa os caches e força um recarregamento.
 * 
 * Usa sessionStorage para evitar loops infinitos de reload.
 * 
 * @returns true se foi necessário recarregar (a página será recarregada), false se está atualizado
 */
export async function checkVersionAndUpdate(): Promise<boolean> {
  // Proteção contra loop infinito: se acabamos de verificar, não verificar de novo
  const justChecked = sessionStorage.getItem('beabah_version_just_checked');
  if (justChecked) {
    sessionStorage.removeItem('beabah_version_just_checked');
    console.log('[CacheManager] Verificação de versão já realizada nesta sessão, pulando...');
    return false;
  }

  const remoteVersion = await fetchRemoteVersion();

  if (!remoteVersion) {
    console.log('[CacheManager] Não foi possível obter versão remota, continuando normalmente.');
    return false;
  }

  console.log(`[CacheManager] Versão local: ${APP_VERSION} | Versão remota: ${remoteVersion}`);

  if (remoteVersion !== APP_VERSION) {
    console.log(`[CacheManager] ⚠️ Versão desatualizada! Limpando cache e atualizando...`);

    // Limpar caches preservando apenas dados de autenticação do Supabase
    await clearAllCaches(['sb-', 'supabase.auth']);

    // Marcar que acabamos de verificar (para evitar loop no reload)
    sessionStorage.setItem('beabah_version_just_checked', 'true');

    // Forçar recarregamento completo
    window.location.reload();
    return true;
  }

  console.log('[CacheManager] ✅ Sistema está na versão mais recente.');
  return false;
}

/**
 * Limpa caches e redireciona para uma URL específica.
 * Usado após o login para garantir que o usuário carregue a versão mais recente.
 * 
 * @param redirectTo - URL para redirecionar após limpeza
 */
export async function clearCacheAndRedirect(redirectTo: string = '/admin'): Promise<void> {
  console.log('[CacheManager] 🔄 Limpando cache pós-login e redirecionando...');

  // Preservar dados de autenticação e do usuário logado
  await clearAllCaches(['sb-', 'supabase.auth', 'sgbc_user']);

  // Usar navegação hard (não React Router) para garantir recarregamento completo
  // Adiciona timestamp para forçar o browser a não usar cache
  window.location.href = `${redirectTo}?v=${Date.now()}`;
}
