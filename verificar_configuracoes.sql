-- ============================================
-- VERIFICAR CONFIGURAÇÕES SALVAS
-- Execute este comando para ver se as configurações estão sendo salvas
-- ============================================

-- Ver todos os registros na tabela
SELECT * FROM appearance_config;

-- Ver apenas o registro global
SELECT * FROM appearance_config WHERE id = 'global';

-- Verificar se há algum problema de permissão
-- Execute como admin no Supabase Dashboard
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'appearance_config';




