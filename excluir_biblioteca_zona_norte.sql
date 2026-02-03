-- Script para excluir a Biblioteca Comunitária Zona Norte
-- Execute este script no SQL Editor do Supabase

-- IMPORTANTE: Execute cada bloco separadamente e verifique os resultados antes de prosseguir

-- 1. Primeiro, vamos encontrar o ID da biblioteca
DO $$
DECLARE
    lib_id UUID;
    active_loans_count INTEGER;
BEGIN
    -- Buscar o ID da biblioteca
    SELECT id INTO lib_id
    FROM libraries
    WHERE name ILIKE '%Zona Norte%'
    LIMIT 1;

    IF lib_id IS NULL THEN
        RAISE NOTICE 'Biblioteca "Zona Norte" não encontrada!';
        RETURN;
    END IF;

    RAISE NOTICE 'ID da biblioteca encontrado: %', lib_id;

    -- 2. Verificar empréstimos ativos
    SELECT COUNT(*) INTO active_loans_count
    FROM loans
    WHERE library_id = lib_id
      AND status = 'aberto';

    IF active_loans_count > 0 THEN
        RAISE NOTICE 'ATENÇÃO: Existem % empréstimo(s) ativo(s) vinculados a esta biblioteca!', active_loans_count;
        RAISE NOTICE 'Você precisa finalizar ou cancelar esses empréstimos antes de excluir a biblioteca.';
        RAISE NOTICE 'Execute: UPDATE loans SET status = ''devolvido'', return_date = NOW() WHERE library_id = ''%'' AND status = ''aberto'';', lib_id;
        RETURN;
    END IF;

    RAISE NOTICE 'Nenhum empréstimo ativo encontrado. Prosseguindo com a exclusão...';

    -- 3. Atualizar empréstimos históricos para NULL (se a coluna permitir NULL)
    BEGIN
        UPDATE loans
        SET library_id = NULL
        WHERE library_id = lib_id;
        RAISE NOTICE 'Empréstimos históricos atualizados.';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Aviso ao atualizar empréstimos: %', SQLERRM;
        -- Se não permitir NULL, vamos tentar excluir os empréstimos históricos
        DELETE FROM loans WHERE library_id = lib_id AND status != 'aberto';
        RAISE NOTICE 'Empréstimos históricos excluídos.';
    END;

    -- 4. Atualizar exemplares para NULL (se a coluna permitir NULL)
    BEGIN
        UPDATE copies
        SET library_id = NULL
        WHERE library_id = lib_id;
        RAISE NOTICE 'Exemplares atualizados.';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Aviso ao atualizar exemplares: %', SQLERRM;
        -- Se não permitir NULL, vamos excluir os exemplares
        DELETE FROM copies WHERE library_id = lib_id;
        RAISE NOTICE 'Exemplares excluídos.';
    END;

    -- 5. Atualizar usuários vinculados para NULL
    UPDATE users_profile
    SET library_id = NULL
    WHERE library_id = lib_id;
    RAISE NOTICE 'Usuários atualizados.';

    -- 6. Tentar atualizar eventos (se a tabela existir)
    BEGIN
        UPDATE events
        SET library_id = NULL
        WHERE library_id = lib_id;
        RAISE NOTICE 'Eventos atualizados.';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Tabela events não existe ou erro ao atualizar: %', SQLERRM;
    END;

    -- 7. Excluir a biblioteca
    DELETE FROM libraries WHERE id = lib_id;
    RAISE NOTICE 'Biblioteca excluída com sucesso!';

END $$;

-- Verificar se foi excluída
SELECT * FROM libraries WHERE name ILIKE '%Zona Norte%';

