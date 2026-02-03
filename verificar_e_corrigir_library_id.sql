-- Script para verificar e corrigir o library_id do usuário "Circular"

-- 1. Verificar o usuário "Circular"
SELECT 
  id,
  name,
  email,
  role,
  library_id,
  active
FROM users_profile
WHERE email ILIKE '%circular%' OR name ILIKE '%circular%';

-- 2. Verificar qual é o ID da biblioteca "Biblioteca Comunitária Circular"
SELECT 
  id,
  name,
  city
FROM libraries
WHERE name ILIKE '%circular%';

-- 3. Atualizar o library_id do usuário "Circular" (substitua 'USER_ID' e 'LIBRARY_ID' pelos valores encontrados acima)
-- Exemplo:
-- UPDATE users_profile
-- SET library_id = 'LIBRARY_ID_AQUI'
-- WHERE id = 'USER_ID_AQUI';

-- 4. Verificar todos os bibliotecários sem library_id
SELECT 
  id,
  name,
  email,
  role,
  library_id
FROM users_profile
WHERE role = 'bibliotecario' AND library_id IS NULL;

-- 5. Listar todas as bibliotecas para referência
SELECT 
  id,
  name,
  city
FROM libraries
ORDER BY name;

