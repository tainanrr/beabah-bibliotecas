-- =============================================================================
-- Limpeza e correção de registros de abertura da biblioteca
-- Este script analisa e limpa dados inconsistentes
-- =============================================================================

-- 1. Ver registros antigos com 'full_day' (versão anterior sem turnos)
SELECT 
  l.id,
  lib.name as biblioteca,
  l.date,
  l.shift_name as turno,
  l.opened
FROM library_opening_log l
JOIN libraries lib ON lib.id = l.library_id
WHERE l.shift_name = 'full_day' OR l.shift_name IS NULL
ORDER BY l.date DESC;

-- 2. DELETAR registros antigos com 'full_day' (versão anterior)
DELETE FROM library_opening_log 
WHERE shift_name = 'full_day' OR shift_name IS NULL;

-- 3. Ver registros de datas futuras (que não deveriam existir)
SELECT 
  l.id,
  lib.name as biblioteca,
  l.date,
  l.shift_name as turno,
  l.opened
FROM library_opening_log l
JOIN libraries lib ON lib.id = l.library_id
WHERE l.date > CURRENT_DATE
ORDER BY l.date;

-- 4. DELETAR registros de datas futuras
DELETE FROM library_opening_log WHERE date > CURRENT_DATE;

-- 5. Ver todos os registros restantes (para verificação)
SELECT 
  l.id,
  lib.name as biblioteca,
  l.date,
  l.shift_name as turno,
  l.opened,
  l.opening_time,
  l.closing_time
FROM library_opening_log l
JOIN libraries lib ON lib.id = l.library_id
ORDER BY l.date DESC, l.shift_name;

-- 6. Ver registros duplicados (mesmo dia/turno com valores diferentes)
SELECT 
  library_id,
  date,
  shift_name,
  COUNT(*) as qtd
FROM library_opening_log
GROUP BY library_id, date, shift_name
HAVING COUNT(*) > 1;

-- 7. Contar registros por biblioteca e turno
SELECT 
  lib.name as biblioteca,
  l.shift_name as turno,
  COUNT(*) as total_registros,
  SUM(CASE WHEN l.opened = true THEN 1 ELSE 0 END) as aberturas,
  SUM(CASE WHEN l.opened = false THEN 1 ELSE 0 END) as fechamentos
FROM library_opening_log l
JOIN libraries lib ON lib.id = l.library_id
GROUP BY lib.name, l.shift_name
ORDER BY lib.name, l.shift_name;

-- 8. Ver agenda esperada configurada
SELECT 
  lib.name as biblioteca,
  les.day_of_week,
  CASE les.day_of_week
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Segunda'
    WHEN 2 THEN 'Terça'
    WHEN 3 THEN 'Quarta'
    WHEN 4 THEN 'Quinta'
    WHEN 5 THEN 'Sexta'
    WHEN 6 THEN 'Sábado'
  END as dia_semana,
  les.shift_name as turno,
  les.is_open as esperado_abrir,
  les.valid_from,
  les.valid_until
FROM library_expected_schedule les
JOIN libraries lib ON lib.id = les.library_id
ORDER BY lib.name, les.day_of_week, les.shift_name;

-- 9. OPÇÃO: LIMPAR TODOS os registros de abertura para começar do zero
-- DELETE FROM library_opening_log;
