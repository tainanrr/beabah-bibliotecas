-- Adiciona coluna sort_order para permitir ordenação manual dos gêneros literários
-- Execute este SQL no Supabase Dashboard (SQL Editor)

ALTER TABLE reader_genre_options
ADD COLUMN IF NOT EXISTS sort_order INTEGER;

ALTER TABLE reader_interest_options
ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Inicializa sort_order com base na ordem alfabética atual
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) - 1 AS rn
  FROM reader_genre_options
  WHERE active = true
)
UPDATE reader_genre_options
SET sort_order = numbered.rn
FROM numbered
WHERE reader_genre_options.id = numbered.id;

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) - 1 AS rn
  FROM reader_interest_options
  WHERE active = true
)
UPDATE reader_interest_options
SET sort_order = numbered.rn
FROM numbered
WHERE reader_interest_options.id = numbered.id;
