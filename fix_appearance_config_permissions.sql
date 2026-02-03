-- ============================================
-- CORREÇÃO DE PERMISSÕES - appearance_config
-- Execute este comando se houver problemas de permissão
-- ============================================

-- 1. Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'appearance_config'
);

-- 2. Remover todas as políticas existentes
DROP POLICY IF EXISTS "appearance_config_select" ON appearance_config;
DROP POLICY IF EXISTS "appearance_config_insert" ON appearance_config;
DROP POLICY IF EXISTS "appearance_config_update" ON appearance_config;
DROP POLICY IF EXISTS "appearance_config_delete" ON appearance_config;

-- 3. Criar políticas mais permissivas para teste (temporariamente)
-- IMPORTANTE: Ajuste depois conforme sua necessidade de segurança

-- Política: Todos podem ler (público)
CREATE POLICY "appearance_config_select" ON appearance_config
  FOR SELECT
  USING (true);

-- Política: Permitir inserção para usuários autenticados (temporário para teste)
-- Se funcionar, você pode restringir depois para apenas admin_rede
CREATE POLICY "appearance_config_insert" ON appearance_config
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política: Permitir atualização para usuários autenticados (temporário para teste)
CREATE POLICY "appearance_config_update" ON appearance_config
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 4. Verificar se o registro 'global' existe
SELECT * FROM appearance_config WHERE id = 'global';

-- 5. Se não existir, criar manualmente
INSERT INTO appearance_config (id, primary_color, secondary_color, accent_color, tertiary_color) 
VALUES ('global', '#1e293b', '#1e40af', '#84cc16', '#a855f7')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- APÓS TESTAR E CONFIRMAR QUE FUNCIONA,
-- EXECUTE O COMANDO ABAIXO PARA RESTRINGIR
-- APENAS PARA admin_rede:
-- ============================================

/*
-- Remover políticas temporárias
DROP POLICY IF EXISTS "appearance_config_insert" ON appearance_config;
DROP POLICY IF EXISTS "appearance_config_update" ON appearance_config;

-- Criar políticas restritivas (apenas admin_rede)
CREATE POLICY "appearance_config_insert" ON appearance_config
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id::text = auth.uid()::text
      AND users_profile.role = 'admin_rede'
    )
  );

CREATE POLICY "appearance_config_update" ON appearance_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id::text = auth.uid()::text
      AND users_profile.role = 'admin_rede'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id::text = auth.uid()::text
      AND users_profile.role = 'admin_rede'
    )
  );
*/




