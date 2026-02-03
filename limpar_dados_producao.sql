-- =============================================================================
-- SCRIPT PARA LIMPAR DADOS DE TESTE - PREPARAR PARA PRODUÇÃO
-- =============================================================================
-- 
-- Este script remove todos os dados de teste das seguintes áreas:
-- - Histórico de Movimentações (empréstimos)
-- - Acervo Local (exemplares)
-- - Catálogo (livros)
-- - Leitores (usuários com role='leitor')
-- - Eventos
-- - Logs de auditoria (opcional)
--
-- IMPORTANTE: Este script NÃO remove:
-- - Bibliotecas
-- - Usuários administradores e bibliotecários
-- - Configurações do sistema
--
-- ATENÇÃO: Execute este script com cuidado! Os dados serão removidos permanentemente.
-- =============================================================================

-- =============================================================================
-- FUNÇÃO PRINCIPAL: Limpar todos os dados de teste
-- =============================================================================
CREATE OR REPLACE FUNCTION limpar_dados_producao(
    p_limpar_auditoria BOOLEAN DEFAULT FALSE,
    p_confirmar TEXT DEFAULT NULL
)
RETURNS TABLE(
    tabela TEXT,
    registros_removidos BIGINT,
    status TEXT
) AS $$
DECLARE
    v_count BIGINT;
BEGIN
    -- Verificação de segurança
    IF p_confirmar IS NULL OR p_confirmar != 'CONFIRMO_LIMPEZA' THEN
        RETURN QUERY SELECT 
            'ERRO'::TEXT, 
            0::BIGINT, 
            'Para executar, passe o parâmetro: SELECT * FROM limpar_dados_producao(false, ''CONFIRMO_LIMPEZA'')'::TEXT;
        RETURN;
    END IF;

    -- 1. LIMPAR EMPRÉSTIMOS (loans) - Histórico de Movimentações
    -- Deve ser o primeiro pois referencia copies e users_profile
    SELECT COUNT(*) INTO v_count FROM loans;
    DELETE FROM loans;
    RETURN QUERY SELECT 'loans (empréstimos)'::TEXT, v_count, 'OK - Removido'::TEXT;

    -- 2. LIMPAR EVENT_LIBRARIES (relacionamento eventos-bibliotecas)
    -- Deve vir antes de events
    BEGIN
        SELECT COUNT(*) INTO v_count FROM event_libraries;
        DELETE FROM event_libraries;
        RETURN QUERY SELECT 'event_libraries'::TEXT, v_count, 'OK - Removido'::TEXT;
    EXCEPTION WHEN undefined_table THEN
        RETURN QUERY SELECT 'event_libraries'::TEXT, 0::BIGINT, 'Tabela não existe'::TEXT;
    END;

    -- 3. LIMPAR EVENTOS (events)
    BEGIN
        SELECT COUNT(*) INTO v_count FROM events;
        DELETE FROM events;
        RETURN QUERY SELECT 'events (eventos)'::TEXT, v_count, 'OK - Removido'::TEXT;
    EXCEPTION WHEN undefined_table THEN
        RETURN QUERY SELECT 'events (eventos)'::TEXT, 0::BIGINT, 'Tabela não existe'::TEXT;
    END;

    -- 4. LIMPAR EXEMPLARES (copies) - Acervo Local
    -- Deve vir antes de books pois referencia books
    SELECT COUNT(*) INTO v_count FROM copies;
    DELETE FROM copies;
    RETURN QUERY SELECT 'copies (exemplares)'::TEXT, v_count, 'OK - Removido'::TEXT;

    -- 5. LIMPAR LIVROS (books) - Catálogo
    SELECT COUNT(*) INTO v_count FROM books;
    DELETE FROM books;
    RETURN QUERY SELECT 'books (catálogo)'::TEXT, v_count, 'OK - Removido'::TEXT;

    -- 6. LIMPAR LEITORES (users_profile onde role='leitor')
    -- NÃO remove admin_rede nem bibliotecario
    SELECT COUNT(*) INTO v_count FROM users_profile WHERE role = 'leitor';
    DELETE FROM users_profile WHERE role = 'leitor';
    RETURN QUERY SELECT 'users_profile (leitores)'::TEXT, v_count, 'OK - Removido'::TEXT;

    -- 7. LIMPAR AUDITORIA (opcional)
    IF p_limpar_auditoria THEN
        BEGIN
            SELECT COUNT(*) INTO v_count FROM audit_logs;
            DELETE FROM audit_logs;
            RETURN QUERY SELECT 'audit_logs (auditoria)'::TEXT, v_count, 'OK - Removido'::TEXT;
        EXCEPTION WHEN undefined_table THEN
            RETURN QUERY SELECT 'audit_logs (auditoria)'::TEXT, 0::BIGINT, 'Tabela não existe'::TEXT;
        END;
    ELSE
        RETURN QUERY SELECT 'audit_logs (auditoria)'::TEXT, 0::BIGINT, 'MANTIDO (passe true para limpar)'::TEXT;
    END IF;

    -- Resumo final
    RETURN QUERY SELECT '--- LIMPEZA CONCLUÍDA ---'::TEXT, 0::BIGINT, 'Sistema pronto para produção!'::TEXT;

END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNÇÕES INDIVIDUAIS (para limpar cada área separadamente)
-- =============================================================================

-- Limpar apenas empréstimos
CREATE OR REPLACE FUNCTION limpar_emprestimos(p_confirmar TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE v_count BIGINT;
BEGIN
    IF p_confirmar != 'CONFIRMO' THEN
        RETURN 'Execute: SELECT limpar_emprestimos(''CONFIRMO'')';
    END IF;
    SELECT COUNT(*) INTO v_count FROM loans;
    DELETE FROM loans;
    RETURN 'Removidos ' || v_count || ' empréstimos.';
END;
$$ LANGUAGE plpgsql;

-- Limpar apenas exemplares (e empréstimos relacionados)
CREATE OR REPLACE FUNCTION limpar_exemplares(p_confirmar TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE v_count_loans BIGINT; v_count_copies BIGINT;
BEGIN
    IF p_confirmar != 'CONFIRMO' THEN
        RETURN 'Execute: SELECT limpar_exemplares(''CONFIRMO'')';
    END IF;
    SELECT COUNT(*) INTO v_count_loans FROM loans;
    DELETE FROM loans;
    SELECT COUNT(*) INTO v_count_copies FROM copies;
    DELETE FROM copies;
    RETURN 'Removidos ' || v_count_loans || ' empréstimos e ' || v_count_copies || ' exemplares.';
END;
$$ LANGUAGE plpgsql;

-- Limpar apenas catálogo (e exemplares/empréstimos relacionados)
CREATE OR REPLACE FUNCTION limpar_catalogo(p_confirmar TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE v_count_loans BIGINT; v_count_copies BIGINT; v_count_books BIGINT;
BEGIN
    IF p_confirmar != 'CONFIRMO' THEN
        RETURN 'Execute: SELECT limpar_catalogo(''CONFIRMO'')';
    END IF;
    SELECT COUNT(*) INTO v_count_loans FROM loans;
    DELETE FROM loans;
    SELECT COUNT(*) INTO v_count_copies FROM copies;
    DELETE FROM copies;
    SELECT COUNT(*) INTO v_count_books FROM books;
    DELETE FROM books;
    RETURN 'Removidos ' || v_count_loans || ' empréstimos, ' || v_count_copies || ' exemplares e ' || v_count_books || ' livros.';
END;
$$ LANGUAGE plpgsql;

-- Limpar apenas leitores (e empréstimos relacionados)
CREATE OR REPLACE FUNCTION limpar_leitores(p_confirmar TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE v_count_loans BIGINT; v_count_readers BIGINT;
BEGIN
    IF p_confirmar != 'CONFIRMO' THEN
        RETURN 'Execute: SELECT limpar_leitores(''CONFIRMO'')';
    END IF;
    SELECT COUNT(*) INTO v_count_loans FROM loans;
    DELETE FROM loans;
    SELECT COUNT(*) INTO v_count_readers FROM users_profile WHERE role = 'leitor';
    DELETE FROM users_profile WHERE role = 'leitor';
    RETURN 'Removidos ' || v_count_loans || ' empréstimos e ' || v_count_readers || ' leitores.';
END;
$$ LANGUAGE plpgsql;

-- Limpar apenas eventos
CREATE OR REPLACE FUNCTION limpar_eventos(p_confirmar TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE v_count_rel BIGINT; v_count_events BIGINT;
BEGIN
    IF p_confirmar != 'CONFIRMO' THEN
        RETURN 'Execute: SELECT limpar_eventos(''CONFIRMO'')';
    END IF;
    
    BEGIN
        SELECT COUNT(*) INTO v_count_rel FROM event_libraries;
        DELETE FROM event_libraries;
    EXCEPTION WHEN undefined_table THEN
        v_count_rel := 0;
    END;
    
    BEGIN
        SELECT COUNT(*) INTO v_count_events FROM events;
        DELETE FROM events;
    EXCEPTION WHEN undefined_table THEN
        v_count_events := 0;
    END;
    
    RETURN 'Removidos ' || v_count_events || ' eventos e ' || v_count_rel || ' relacionamentos.';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMO USAR:
-- =============================================================================
-- 
-- OPÇÃO 1: Limpar TUDO (sem auditoria)
-- SELECT * FROM limpar_dados_producao(false, 'CONFIRMO_LIMPEZA');
--
-- OPÇÃO 2: Limpar TUDO (incluindo auditoria)
-- SELECT * FROM limpar_dados_producao(true, 'CONFIRMO_LIMPEZA');
--
-- OPÇÃO 3: Limpar apenas uma área:
-- SELECT limpar_emprestimos('CONFIRMO');
-- SELECT limpar_exemplares('CONFIRMO');
-- SELECT limpar_catalogo('CONFIRMO');
-- SELECT limpar_leitores('CONFIRMO');
-- SELECT limpar_eventos('CONFIRMO');
--
-- =============================================================================

-- Mensagem final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'FUNÇÕES DE LIMPEZA CRIADAS COM SUCESSO!';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Para limpar TODOS os dados de teste, execute:';
    RAISE NOTICE 'SELECT * FROM limpar_dados_producao(false, ''CONFIRMO_LIMPEZA'');';
    RAISE NOTICE '';
    RAISE NOTICE 'Para limpar TUDO incluindo auditoria:';
    RAISE NOTICE 'SELECT * FROM limpar_dados_producao(true, ''CONFIRMO_LIMPEZA'');';
    RAISE NOTICE '';
    RAISE NOTICE 'ATENÇÃO: Esta ação é IRREVERSÍVEL!';
    RAISE NOTICE '=============================================================================';
END $$;
