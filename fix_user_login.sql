-- Script para verificar e corrigir problemas de login do usuário
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se o usuário existe
SELECT id, name, email, role, active, library_id, 
       CASE WHEN password IS NULL THEN 'SEM SENHA' 
            WHEN password = '' THEN 'SENHA VAZIA'
            ELSE 'SENHA OK' END as password_status
FROM users_profile 
WHERE email ILIKE '%beabah.rs.bc@gmail.com%';

-- 2. Se o usuário existir mas não tiver senha ou estiver inativo, corrigir:
-- (Descomente e ajuste conforme necessário)

-- Ativar usuário se estiver inativo
-- UPDATE users_profile 
-- SET active = true 
-- WHERE email ILIKE '%beabah.rs.bc@gmail.com%';

-- Definir senha se estiver vazia (substitua 'SENHA_AQUI' pela senha desejada)
-- UPDATE users_profile 
-- SET password = 'SENHA_AQUI' 
-- WHERE email ILIKE '%beabah.rs.bc@gmail.com%' AND (password IS NULL OR password = '');

-- 3. Verificar todos os campos do usuário
SELECT * FROM users_profile 
WHERE email ILIKE '%beabah.rs.bc@gmail.com%';




