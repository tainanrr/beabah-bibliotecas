-- =============================================================================
-- LIMPEZA COMPLETA DOS DADOS DE TESTE - INÍCIO DA OPERAÇÃO OFICIAL
-- =============================================================================
-- 
-- Este script remove todos os dados de teste das seguintes áreas:
--
-- CIRCULAÇÃO (http://localhost:8081/admin/circulacao):
--   - loans (Histórico de Empréstimos/Devoluções)
--   - local_consultations (Histórico de Consultas Locais)
--
-- CATÁLOGO (http://localhost:8081/admin/catalogo):
--   - books (Catálogo da Rede)
--
-- ACERVO (http://localhost:8081/admin/acervo):
--   - copies (Acervo Local / Exemplares)
--
-- EVENTOS (http://localhost:8081/admin/eventos):
--   - library_opening_log (Calendário)
--   - reading_mediations (Mediações)
--   - events / event_libraries (Ações Culturais)
--   - technical_processing (Técnico)
--
-- AUDITORIA (http://localhost:8081/admin/auditoria):
--   - audit_logs (Auditoria & Logs)
--
-- IMPORTANTE: Este script NÃO remove:
--   - Bibliotecas
--   - Usuários (admin_rede, bibliotecários)
--   - Configurações do sistema
--   - Agenda esperada (library_expected_schedule)
--
-- =============================================================================

-- =============================================================================
-- PASSO 1: VERIFICAR O QUE SERÁ REMOVIDO (CONSULTAS)
-- =============================================================================

-- 1.1 Verificar empréstimos
SELECT 
    'loans' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'aberto' THEN 1 END) as ativos,
    COUNT(CASE WHEN status = 'devolvido' THEN 1 END) as devolvidos
FROM loans;

-- 1.2 Verificar consultas locais
SELECT 'local_consultations' as tabela, COUNT(*) as total FROM local_consultations;

-- 1.3 Verificar exemplares (acervo)
SELECT 'copies' as tabela, COUNT(*) as total FROM copies;

-- 1.4 Verificar livros (catálogo)
SELECT 'books' as tabela, COUNT(*) as total FROM books;

-- 1.5 Verificar calendário de aberturas
SELECT 'library_opening_log' as tabela, COUNT(*) as total FROM library_opening_log;

-- 1.6 Verificar mediações
SELECT 'reading_mediations' as tabela, COUNT(*) as total FROM reading_mediations;

-- 1.7 Verificar ações culturais (eventos)
SELECT 'events' as tabela, COUNT(*) as total FROM events;

-- 1.8 Verificar relacionamento eventos-bibliotecas
SELECT 'event_libraries' as tabela, COUNT(*) as total FROM event_libraries;

-- 1.9 Verificar processamento técnico
SELECT 'technical_processing' as tabela, COUNT(*) as total FROM technical_processing;

-- 1.10 Verificar logs de auditoria
SELECT 'audit_logs' as tabela, COUNT(*) as total FROM audit_logs;

-- =============================================================================
-- PASSO 2: EXECUTAR A LIMPEZA (na ordem correta por causa das FKs)
-- =============================================================================

-- 2.1 CIRCULAÇÃO - Histórico de Empréstimos/Devoluções
-- (Deve ser o primeiro pois referencia copies e users_profile)
DELETE FROM loans;

-- 2.2 CIRCULAÇÃO - Histórico de Consultas Locais
DELETE FROM local_consultations;

-- 2.3 ACERVO LOCAL - Exemplares
-- (Deve vir antes de books pois referencia books)
DELETE FROM copies;

-- 2.4 CATÁLOGO - Livros
DELETE FROM books;

-- 2.5 EVENTOS - Relacionamento eventos-bibliotecas
-- (Deve vir antes de events)
DELETE FROM event_libraries;

-- 2.6 EVENTOS - Ações Culturais
DELETE FROM events;

-- 2.7 EVENTOS - Mediações de Leitura
DELETE FROM reading_mediations;

-- 2.8 EVENTOS - Calendário de Aberturas
DELETE FROM library_opening_log;

-- 2.9 EVENTOS - Processamento Técnico
DELETE FROM technical_processing;

-- 2.10 AUDITORIA - Logs de Auditoria
DELETE FROM audit_logs;

-- =============================================================================
-- PASSO 3: VERIFICAR SE TUDO FOI LIMPO
-- =============================================================================

SELECT 
    'VERIFICAÇÃO PÓS-LIMPEZA' as status,
    (SELECT COUNT(*) FROM loans) as loans,
    (SELECT COUNT(*) FROM local_consultations) as consultas_locais,
    (SELECT COUNT(*) FROM copies) as exemplares,
    (SELECT COUNT(*) FROM books) as livros,
    (SELECT COUNT(*) FROM event_libraries) as event_libraries,
    (SELECT COUNT(*) FROM events) as eventos,
    (SELECT COUNT(*) FROM reading_mediations) as mediacoes,
    (SELECT COUNT(*) FROM library_opening_log) as calendario,
    (SELECT COUNT(*) FROM technical_processing) as processamento,
    (SELECT COUNT(*) FROM audit_logs) as auditoria;

-- =============================================================================
-- RESULTADO
-- =============================================================================
SELECT '✅ LIMPEZA COMPLETA!' as resultado,
       'Sistema pronto para uso oficial!' as mensagem,
       NOW() as data_limpeza;
