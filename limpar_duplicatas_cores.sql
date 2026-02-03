-- ============================================
-- Script COMPLETO para limpar duplicatas de cores
-- Execute TODO o script de uma vez
-- ============================================

-- 1. Ver o estado atual (quantas duplicatas existem)
SELECT '=== ANTES DA LIMPEZA ===' as etapa;
SELECT library_id, category_name, color_group, COUNT(*) as qtd
FROM library_colors
GROUP BY library_id, category_name, color_group
HAVING COUNT(*) > 1
ORDER BY qtd DESC;

-- 2. Criar tabela temporária com registros únicos (mantendo apenas o mais antigo de cada)
CREATE TEMP TABLE library_colors_clean AS
SELECT DISTINCT ON (library_id, category_name, COALESCE(color_group, '')) *
FROM library_colors
ORDER BY library_id, category_name, COALESCE(color_group, ''), created_at ASC;

-- 3. Contar registros antes e depois
SELECT 'Registros ANTES: ' || COUNT(*)::text as info FROM library_colors;
SELECT 'Registros DEPOIS (únicos): ' || COUNT(*)::text as info FROM library_colors_clean;

-- 4. Limpar a tabela original
TRUNCATE library_colors;

-- 5. Reinserir apenas os registros únicos
INSERT INTO library_colors 
SELECT * FROM library_colors_clean;

-- 6. Limpar tabela temporária
DROP TABLE library_colors_clean;

-- 7. Remover constraint antiga se existir
ALTER TABLE library_colors 
DROP CONSTRAINT IF EXISTS library_colors_unique_per_library;

-- 8. Criar nova constraint única (tratando NULL em color_group)
CREATE UNIQUE INDEX IF NOT EXISTS idx_library_colors_unique 
ON library_colors (library_id, category_name, COALESCE(color_group, ''));

-- 9. Verificar resultado final
SELECT '=== APÓS LIMPEZA ===' as etapa;
SELECT library_id, category_name, color_group, COUNT(*) as qtd
FROM library_colors
GROUP BY library_id, category_name, color_group
HAVING COUNT(*) > 1;

-- 10. Mostrar totais por biblioteca e grupo
SELECT '=== TOTAIS POR GRUPO ===' as etapa;
SELECT 
    l.name as biblioteca,
    lc.color_group as grupo,
    COUNT(*) as total_cores
FROM library_colors lc
LEFT JOIN libraries l ON l.id = lc.library_id
GROUP BY l.name, lc.color_group
ORDER BY l.name, lc.color_group;

SELECT '✅ LIMPEZA CONCLUÍDA!' as resultado;
