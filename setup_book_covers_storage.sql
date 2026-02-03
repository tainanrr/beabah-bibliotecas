-- =============================================================================
-- CONFIGURAÇÃO DO STORAGE PARA CAPAS DE LIVROS
-- =============================================================================
-- 
-- Este script cria o bucket e as políticas necessárias para armazenar
-- as capas dos livros no Supabase Storage.
--
-- Execute este script no SQL Editor do Supabase Dashboard.
-- =============================================================================

-- 1. Criar o bucket para capas de livros (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'books',
    'books',
    true,  -- Bucket público para permitir visualização das capas
    5242880,  -- 5MB em bytes
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Política para permitir leitura pública das capas
DROP POLICY IF EXISTS "public_read_books" ON storage.objects;
CREATE POLICY "public_read_books"
ON storage.objects FOR SELECT
USING (bucket_id = 'books');

-- 3. Política para permitir upload apenas por usuários autenticados
DROP POLICY IF EXISTS "authenticated_upload_books" ON storage.objects;
CREATE POLICY "authenticated_upload_books"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'books' 
    AND auth.role() = 'authenticated'
);

-- 4. Política para permitir atualização por usuários autenticados
DROP POLICY IF EXISTS "authenticated_update_books" ON storage.objects;
CREATE POLICY "authenticated_update_books"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'books' 
    AND auth.role() = 'authenticated'
);

-- 5. Política para permitir exclusão por usuários autenticados
DROP POLICY IF EXISTS "authenticated_delete_books" ON storage.objects;
CREATE POLICY "authenticated_delete_books"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'books' 
    AND auth.role() = 'authenticated'
);

-- =============================================================================
-- VERIFICAÇÃO
-- =============================================================================
-- Execute esta query para verificar se o bucket foi criado:
-- SELECT * FROM storage.buckets WHERE id = 'books';
-- 
-- Execute esta query para verificar as políticas:
-- SELECT * FROM pg_policies WHERE tablename = 'objects';
-- =============================================================================

-- Mensagem de conclusão
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'STORAGE PARA CAPAS DE LIVROS CONFIGURADO!';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'O bucket "books" foi criado com as seguintes configurações:';
    RAISE NOTICE '  - Público: Sim (capas visíveis para todos)';
    RAISE NOTICE '  - Limite de arquivo: 5MB';
    RAISE NOTICE '  - Formatos aceitos: JPEG, PNG, WebP, GIF';
    RAISE NOTICE '';
    RAISE NOTICE 'Políticas configuradas:';
    RAISE NOTICE '  - Leitura: Pública';
    RAISE NOTICE '  - Upload/Update/Delete: Apenas usuários autenticados';
    RAISE NOTICE '=============================================================================';
END $$;
