    -- =============================================================================
    -- CORREÇÃO DOS LEITORES JÁ IMPORTADOS (TODAS AS PARTES)
    -- =============================================================================
    -- Execute este script para corrigir TODOS os leitores importados:
    -- 1. Data de cadastro (created_at) - usar a data original
    -- 2. Email - remover emails fictícios @biblioteca.local
    -- =============================================================================

    -- 1. Atualizar created_at para usar a data original de registro
    -- Isso corrige TODOS os leitores da biblioteca circular
    UPDATE users_profile
    SET created_at = original_registration_date
    WHERE role = 'leitor' 
    AND original_registration_date IS NOT NULL
    AND library_id = 'd9fafe3d-3006-4588-8d19-7713ba71fb54'
    AND created_at::date != original_registration_date::date;

    -- 2. Remover emails fictícios (deixar NULL)
    UPDATE users_profile
    SET email = NULL
    WHERE role = 'leitor'
    AND email LIKE '%@biblioteca.local'
    AND library_id = 'd9fafe3d-3006-4588-8d19-7713ba71fb54';

    -- Contar quantos foram corrigidos
    SELECT 
        COUNT(*) as total_leitores,
        COUNT(CASE WHEN email IS NULL THEN 1 END) as sem_email,
        COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as com_email
    FROM users_profile
    WHERE role = 'leitor'
    AND library_id = 'd9fafe3d-3006-4588-8d19-7713ba71fb54';

    -- Verificar resultado (amostra)
    SELECT 
        name,
        email,
        created_at,
        original_registration_date
    FROM users_profile
    WHERE role = 'leitor'
    AND library_id = 'd9fafe3d-3006-4588-8d19-7713ba71fb54'
    ORDER BY created_at DESC
    LIMIT 20;

    SELECT '✅ Correção concluída para TODOS os leitores importados!' as status;
