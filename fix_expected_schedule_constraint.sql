-- =============================================================================
-- Correção da constraint de library_expected_schedule
-- Este script resolve o problema de conflitos de chave única
-- =============================================================================

-- 1. Remover constraints antigas PRIMEIRO (antes dos índices)
ALTER TABLE library_expected_schedule DROP CONSTRAINT IF EXISTS library_expected_schedule_unique_period;
ALTER TABLE library_expected_schedule DROP CONSTRAINT IF EXISTS library_expected_schedule_library_id_day_of_week_shift_name_key;

-- 2. Agora remover índices únicos antigos
DROP INDEX IF EXISTS idx_expected_schedule_unique;
DROP INDEX IF EXISTS library_expected_schedule_library_id_day_of_week_shift_name_key;

-- 3. Remover duplicatas existentes (mantendo apenas o mais recente)
DELETE FROM library_expected_schedule a
USING library_expected_schedule b
WHERE a.id < b.id
  AND a.library_id = b.library_id
  AND a.day_of_week = b.day_of_week
  AND a.shift_name = b.shift_name
  AND COALESCE(a.valid_from, '1900-01-01') = COALESCE(b.valid_from, '1900-01-01')
  AND COALESCE(a.valid_until, '2100-12-31') = COALESCE(b.valid_until, '2100-12-31');

-- 4. Criar índice único que funciona com NULL usando COALESCE
-- Isso garante que registros sem período definido sejam tratados como únicos
CREATE UNIQUE INDEX IF NOT EXISTS idx_expected_schedule_unique 
  ON library_expected_schedule(
    library_id, 
    day_of_week, 
    shift_name, 
    COALESCE(valid_from, '1900-01-01'), 
    COALESCE(valid_until, '2100-12-31')
  );

-- 5. Verificar registros existentes
SELECT 
  library_id,
  day_of_week,
  shift_name,
  valid_from,
  valid_until,
  is_open,
  COUNT(*) as count
FROM library_expected_schedule
GROUP BY library_id, day_of_week, shift_name, valid_from, valid_until, is_open
HAVING COUNT(*) > 1;
