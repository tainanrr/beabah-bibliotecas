-- ============================================
-- Script para alterar o campo 'tombo' de bigint para text
-- Permitindo o uso de prefixo "B" (ex: B00001)
-- ============================================

-- 1. Primeiro, vamos verificar se há dados existentes
SELECT 'Tombos existentes antes da migração:' as info;
SELECT tombo FROM copies WHERE tombo IS NOT NULL LIMIT 10;

-- 2. Alterar o tipo do campo tombo de bigint para text
-- Isso vai converter automaticamente os números existentes para texto
ALTER TABLE copies 
ALTER COLUMN tombo TYPE text 
USING CASE 
    WHEN tombo IS NOT NULL THEN 'B' || LPAD(tombo::text, 5, '0')
    ELSE NULL 
END;

-- 3. Verificar resultado
SELECT 'Tombos após migração:' as info;
SELECT tombo FROM copies WHERE tombo IS NOT NULL LIMIT 10;

-- 4. Criar índice para melhor performance nas buscas
DROP INDEX IF EXISTS idx_copies_tombo;
CREATE INDEX idx_copies_tombo ON copies(tombo);

SELECT 'Migração concluída com sucesso!' as resultado;
SELECT 'O campo tombo agora aceita valores como B00001, B00002, etc.' as info;
