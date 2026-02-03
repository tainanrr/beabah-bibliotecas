-- Script para adicionar campo Instagram nas bibliotecas
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna instagram na tabela libraries
ALTER TABLE libraries 
ADD COLUMN IF NOT EXISTS instagram VARCHAR(255);

-- 2. Comentário na coluna
COMMENT ON COLUMN libraries.instagram IS 'URL do perfil do Instagram da biblioteca';

-- 3. Atualizar os Instagrams das bibliotecas existentes
UPDATE libraries 
SET instagram = 'https://www.instagram.com/bcdo11/'
WHERE name ILIKE '%11 de Abril%';

UPDATE libraries 
SET instagram = 'https://www.instagram.com/bc_arvoredo/'
WHERE name ILIKE '%Arvoredo%';

UPDATE libraries 
SET instagram = 'https://www.instagram.com/bcdo11?igsh=MXF4ZDF2Yzlrazh1Mw=='
WHERE name ILIKE '%Ataîru%';

UPDATE libraries 
SET instagram = 'https://www.instagram.com/bibliotecabetoaguiar/'
WHERE name ILIKE '%Beto Aguiar%';

UPDATE libraries 
SET instagram = 'https://www.instagram.com/biblioflor/'
WHERE name ILIKE '%Biblio Flor%';

UPDATE libraries 
SET instagram = 'https://www.instagram.com/mochileiradaleiturars/'
WHERE name ILIKE '%Carolina Maria de Jesus%';

UPDATE libraries 
SET instagram = 'https://www.instagram.com/bccircular/'
WHERE name ILIKE '%Circular%';

UPDATE libraries 
SET instagram = 'https://www.instagram.com/bibliocomunitariagirassol/'
WHERE name ILIKE '%Girassol%';

UPDATE libraries 
SET instagram = 'https://www.instagram.com/colaicultural/'
WHERE name ILIKE '%Ilha do Saber%';

UPDATE libraries 
SET instagram = 'https://www.instagram.com/quilombodosopapo/'
WHERE name ILIKE '%Mestra Griô%';

UPDATE libraries 
SET instagram = 'https://www.instagram.com/mochileiradaleiturars?igsh=cjhpcWdicDV2NmRx'
WHERE name ILIKE '%Mochileira%';

UPDATE libraries 
SET instagram = 'https://www.instagram.com/biblioraiodeluz/'
WHERE name ILIKE '%Raio de Luz%';

UPDATE libraries 
SET instagram = 'https://www.instagram.com/bibliosabia/'
WHERE name ILIKE '%Sabiá%';

UPDATE libraries 
SET instagram = 'https://www.instagram.com/sededepartilha/'
WHERE name ILIKE '%Sede de Partilha%';

UPDATE libraries 
SET instagram = 'https://www.instagram.com/ocoletivomeio/'
WHERE name ILIKE '%Formigueiro%';




