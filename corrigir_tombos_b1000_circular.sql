-- =============================================================================
-- Corrige 8 exemplares com tombo duplicado B1000 na Biblioteca Comunitária Circular
-- Atribui B1000 a B1007 conforme a ordem do relatório (por título da obra).
-- Execute no SQL Editor do Supabase (produção). Revise o SELECT inicial antes.
-- Requer índice único (library_id, tombo): atualização em 2 fases evita conflito.
-- =============================================================================

-- 0) Conferência: biblioteca e linhas afetadas
SELECT l.id AS library_id, l.name, c.id AS copy_id, b.title, c.tombo
FROM copies c
JOIN libraries l ON l.id = c.library_id
JOIN books b ON b.id = c.book_id
WHERE l.name = 'Biblioteca Comunitária Circular'
  AND c.tombo = 'B1000'
ORDER BY b.title;

-- 1) Fase A: valores temporários únicos (ajuste se não forem exatamente 8 linhas)
UPDATE copies c
SET tombo = '__fix_b1000__' || replace(c.id::text, '-', '')
FROM libraries l
WHERE c.library_id = l.id
  AND l.name = 'Biblioteca Comunitária Circular'
  AND c.tombo = 'B1000';

-- 2) Fase B: tombos definitivos (padrões do mais específico ao mais geral)

UPDATE copies c SET tombo = 'B1000'
FROM books b, libraries l
WHERE c.book_id = b.id AND c.library_id = l.id
  AND l.name = 'Biblioteca Comunitária Circular'
  AND c.tombo LIKE '__fix_b1000__%'
  AND b.title ILIKE 'O PEQUENO PRÍNCIPE%';

UPDATE copies c SET tombo = 'B1001'
FROM books b, libraries l
WHERE c.book_id = b.id AND c.library_id = l.id
  AND l.name = 'Biblioteca Comunitária Circular'
  AND c.tombo LIKE '__fix_b1000__%'
  AND b.title ILIKE 'BIA E O ELEFANTE%';

UPDATE copies c SET tombo = 'B1002'
FROM books b, libraries l
WHERE c.book_id = b.id AND c.library_id = l.id
  AND l.name = 'Biblioteca Comunitária Circular'
  AND c.tombo LIKE '__fix_b1000__%'
  AND trim(upper(b.title)) = 'EU';

UPDATE copies c SET tombo = 'B1003'
FROM books b, libraries l
WHERE c.book_id = b.id AND c.library_id = l.id
  AND l.name = 'Biblioteca Comunitária Circular'
  AND c.tombo LIKE '__fix_b1000__%'
  AND b.title ILIKE 'A GRANDE AVENTURA DE MARIA FUMAÇA%';

UPDATE copies c SET tombo = 'B1004'
FROM books b, libraries l
WHERE c.book_id = b.id AND c.library_id = l.id
  AND l.name = 'Biblioteca Comunitária Circular'
  AND c.tombo LIKE '__fix_b1000__%'
  AND b.title ILIKE 'POR QUE TENHO MEDO DE LHE DIZER QUEM SOU%';

UPDATE copies c SET tombo = 'B1005'
FROM books b, libraries l
WHERE c.book_id = b.id AND c.library_id = l.id
  AND l.name = 'Biblioteca Comunitária Circular'
  AND c.tombo LIKE '__fix_b1000__%'
  AND b.title ILIKE 'DE REPENTE, O DESEJO%';

UPDATE copies c SET tombo = 'B1006'
FROM books b, libraries l
WHERE c.book_id = b.id AND c.library_id = l.id
  AND l.name = 'Biblioteca Comunitária Circular'
  AND c.tombo LIKE '__fix_b1000__%'
  AND (b.title ILIKE 'DE REPENTE O AMOR%' OR b.title ILIKE 'DE REPENTE, O AMOR%')
  AND b.title NOT ILIKE '%É ELE%'
  AND b.title NOT ILIKE '%DESEJO%';

UPDATE copies c SET tombo = 'B1007'
FROM books b, libraries l
WHERE c.book_id = b.id AND c.library_id = l.id
  AND l.name = 'Biblioteca Comunitária Circular'
  AND c.tombo LIKE '__fix_b1000__%'
  AND (b.title ILIKE 'DE REPENTE, É ELE%' OR b.title ILIKE 'DE REPENTE, E ELE%');

-- 3) Verificar: não deve restar __fix_b1000__ nem duplicidade de tombo nessa biblioteca
SELECT c.tombo, count(*) AS qtd
FROM copies c
JOIN libraries l ON l.id = c.library_id
WHERE l.name = 'Biblioteca Comunitária Circular'
  AND c.tombo LIKE '__fix_b1000__%'
GROUP BY c.tombo;

SELECT c.tombo, count(*) AS qtd
FROM copies c
JOIN libraries l ON l.id = c.library_id
WHERE l.name = 'Biblioteca Comunitária Circular'
  AND c.tombo IN ('B1000','B1001','B1002','B1003','B1004','B1005','B1006','B1007')
GROUP BY c.tombo
ORDER BY c.tombo;
