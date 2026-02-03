-- ============================================
-- Script para remover constraint única de library_id + code
-- Permite múltiplos exemplares do mesmo livro (mesmo ISBN/código)
-- na mesma biblioteca, diferenciados pelo Nr. Tombo
-- ============================================

-- 1. Remover a constraint única existente
ALTER TABLE copies DROP CONSTRAINT IF EXISTS copies_library_id_code_key;

-- 2. Verificar se há outras constraints com nome similar
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'copies' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%code%'
    LOOP
        EXECUTE 'ALTER TABLE copies DROP CONSTRAINT IF EXISTS ' || r.constraint_name;
        RAISE NOTICE 'Constraint removida: %', r.constraint_name;
    END LOOP;
END $$;

-- 3. Criar índice simples (não único) para performance nas buscas por código
DROP INDEX IF EXISTS idx_copies_code;
CREATE INDEX idx_copies_code ON copies(code);

-- 4. Garantir que o tombo seja único por biblioteca
-- (cada exemplar tem um tombo diferente na mesma biblioteca)
DROP INDEX IF EXISTS idx_copies_library_tombo_unique;
CREATE UNIQUE INDEX idx_copies_library_tombo_unique ON copies(library_id, tombo) 
WHERE tombo IS NOT NULL;

SELECT '✅ Constraint removida com sucesso!' as resultado;
SELECT 'Agora você pode cadastrar múltiplos exemplares do mesmo livro (mesmo código de barras)' as info;
SELECT 'Cada exemplar será identificado pelo Nr. Tombo único' as info2;
