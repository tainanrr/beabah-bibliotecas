-- =============================================================================
-- LIMPEZA DA CIRCULAÇÃO (EMPRÉSTIMOS)
-- =============================================================================
-- Este script remove todos os empréstimos do sistema
-- Execute com cuidado - esta ação é irreversível!
-- =============================================================================

-- Primeiro, verificar quantos empréstimos existem
SELECT 
    COUNT(*) as total_emprestimos,
    COUNT(CASE WHEN status = 'aberto' THEN 1 END) as emprestimos_ativos,
    COUNT(CASE WHEN status = 'devolvido' THEN 1 END) as emprestimos_devolvidos
FROM loans;

-- Deletar todos os empréstimos
DELETE FROM loans;

-- Verificar se foi limpo
SELECT COUNT(*) as emprestimos_restantes FROM loans;

-- Resultado
SELECT '✅ Circulação limpa com sucesso! Todos os empréstimos foram removidos.' as status;
