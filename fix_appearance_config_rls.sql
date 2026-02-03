-- ============================================
-- CORREÇÃO DE RLS PARA appearance_config
-- Como o sistema usa autenticação customizada (não Supabase Auth),
-- precisamos ajustar as políticas RLS
-- ============================================

-- Opção 1: Desabilitar RLS completamente (mais simples)
-- Use esta opção se o controle de acesso já está no frontend
ALTER TABLE appearance_config DISABLE ROW LEVEL SECURITY;

-- OU

-- Opção 2: Manter RLS mas permitir todas as operações para usuários autenticados
-- (Descomente se preferir manter RLS ativo)
/*
ALTER TABLE appearance_config ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "appearance_config_select" ON appearance_config;
DROP POLICY IF EXISTS "appearance_config_insert" ON appearance_config;
DROP POLICY IF EXISTS "appearance_config_update" ON appearance_config;

-- Política: Todos podem ler (público)
CREATE POLICY "appearance_config_select" ON appearance_config
  FOR SELECT
  USING (true);

-- Política: Permitir inserção para qualquer um (controle no frontend)
CREATE POLICY "appearance_config_insert" ON appearance_config
  FOR INSERT
  WITH CHECK (true);

-- Política: Permitir atualização para qualquer um (controle no frontend)
CREATE POLICY "appearance_config_update" ON appearance_config
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
*/

-- Verificar se funcionou
SELECT * FROM appearance_config WHERE id = 'global';




