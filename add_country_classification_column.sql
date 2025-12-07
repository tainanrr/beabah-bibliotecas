-- Script para adicionar a coluna 'country_classification' à tabela 'books'
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna country_classification à tabela books
ALTER TABLE books
ADD COLUMN IF NOT EXISTS country_classification TEXT;

-- Comentário da coluna (opcional, mas útil para documentação)
COMMENT ON COLUMN books.country_classification IS 'Classificação do país de origem do livro no formato: SIG - Nome (ex: BRA - Brasil)';

-- Verificar se a coluna foi criada corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'books' 
  AND column_name = 'country_classification';

