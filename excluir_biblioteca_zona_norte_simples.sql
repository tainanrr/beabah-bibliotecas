-- Script SIMPLES para excluir a Biblioteca Comunitária Zona Norte
-- Execute este script no SQL Editor do Supabase
-- ATENÇÃO: Este script exclui TODOS os dados relacionados!

-- Passo 1: Verificar o ID da biblioteca
SELECT id, name, city 
FROM libraries 
WHERE name ILIKE '%Zona Norte%';

-- Passo 2: Verificar empréstimos ativos (SUBSTITUA 'ID_AQUI' pelo ID encontrado acima)
-- SELECT COUNT(*) as emprestimos_ativos
-- FROM loans
-- WHERE library_id = 'ID_AQUI' AND status = 'aberto';

-- Passo 3: Se houver empréstimos ativos, finalize-os primeiro:
-- UPDATE loans 
-- SET status = 'devolvido', return_date = NOW() 
-- WHERE library_id = 'ID_AQUI' AND status = 'aberto';

-- Passo 4: Excluir empréstimos históricos (SUBSTITUA 'ID_AQUI' pelo ID)
-- DELETE FROM loans WHERE library_id = 'ID_AQUI';

-- Passo 5: Excluir exemplares (SUBSTITUA 'ID_AQUI' pelo ID)
-- DELETE FROM copies WHERE library_id = 'ID_AQUI';

-- Passo 6: Atualizar usuários (SUBSTITUA 'ID_AQUI' pelo ID)
-- UPDATE users_profile SET library_id = NULL WHERE library_id = 'ID_AQUI';

-- Passo 7: Excluir eventos se existir (SUBSTITUA 'ID_AQUI' pelo ID)
-- DELETE FROM events WHERE library_id = 'ID_AQUI';

-- Passo 8: Excluir a biblioteca (SUBSTITUA 'ID_AQUI' pelo ID)
-- DELETE FROM libraries WHERE id = 'ID_AQUI';

-- OU, se preferir fazer tudo de uma vez (CUIDADO: exclui tudo relacionado):
-- Substitua 'ID_AQUI' pelo ID real da biblioteca e descomente:

/*
DO $$
DECLARE
    lib_id UUID := 'ID_AQUI'; -- SUBSTITUA PELO ID REAL
BEGIN
    -- Excluir empréstimos
    DELETE FROM loans WHERE library_id = lib_id;
    
    -- Excluir exemplares
    DELETE FROM copies WHERE library_id = lib_id;
    
    -- Atualizar usuários
    UPDATE users_profile SET library_id = NULL WHERE library_id = lib_id;
    
    -- Excluir eventos (se existir)
    BEGIN
        DELETE FROM events WHERE library_id = lib_id;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignora se a tabela não existir
    END;
    
    -- Excluir a biblioteca
    DELETE FROM libraries WHERE id = lib_id;
    
    RAISE NOTICE 'Biblioteca excluída com sucesso!';
END $$;
*/




