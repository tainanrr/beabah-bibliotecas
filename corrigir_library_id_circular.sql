-- Script para corrigir o library_id do usuário "Circular"

-- 1. Verificar o usuário "Circular" e sua biblioteca
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.email,
  u.role,
  u.library_id as current_library_id,
  l.id as library_id_correta,
  l.name as library_name
FROM users_profile u
LEFT JOIN libraries l ON l.name ILIKE '%circular%'
WHERE u.email ILIKE '%circular%' OR u.name ILIKE '%circular%';

-- 2. Se o resultado acima mostrar que library_id_correta existe e current_library_id está NULL,
-- execute o UPDATE abaixo (substitua os IDs pelos valores encontrados na query acima):

-- Exemplo de UPDATE (descomente e ajuste os IDs):
/*
UPDATE users_profile
SET library_id = (
  SELECT id FROM libraries WHERE name ILIKE '%circular%' LIMIT 1
)
WHERE (email ILIKE '%circular%' OR name ILIKE '%circular%')
  AND role = 'bibliotecario'
  AND library_id IS NULL;
*/

-- 3. Verificar todos os bibliotecários sem library_id
SELECT 
  id,
  name,
  email,
  role,
  library_id
FROM users_profile
WHERE role = 'bibliotecario' AND library_id IS NULL;

-- 4. Listar todas as bibliotecas para referência
SELECT 
  id,
  name,
  city
FROM libraries
ORDER BY name;




