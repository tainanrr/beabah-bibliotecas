-- ============================================
-- Script para alterar o campo 'tombo' para aceitar texto
-- Como é uma coluna IDENTITY, precisamos recriar
-- ============================================

-- 1. Verificar tombos existentes
SELECT 'Tombos existentes antes da migração:' as info;
SELECT id, tombo FROM copies WHERE tombo IS NOT NULL LIMIT 10;

-- 2. Criar uma coluna temporária para guardar os valores
ALTER TABLE copies ADD COLUMN tombo_temp text;

-- 3. Copiar os valores existentes convertendo para o novo formato (sem zeros)
UPDATE copies 
SET tombo_temp = CASE 
    WHEN tombo IS NOT NULL THEN 'B' || tombo::text
    ELSE NULL 
END;

-- 4. Remover a coluna antiga (identity)
ALTER TABLE copies DROP COLUMN tombo;

-- 5. Renomear a coluna temporária para tombo
ALTER TABLE copies RENAME COLUMN tombo_temp TO tombo;

-- 6. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_copies_tombo ON copies(tombo);

-- 7. Verificar resultado
SELECT 'Tombos após migração:' as info;
SELECT id, tombo FROM copies WHERE tombo IS NOT NULL LIMIT 10;

SELECT '✅ Migração concluída com sucesso!' as resultado;
SELECT 'O campo tombo agora aceita valores como B1, B2, B3, etc.' as info;
