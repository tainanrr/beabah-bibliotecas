-- Adicionar coluna de tags na tabela books
-- Tags são palavras-chave para facilitar busca e categorização

-- Adicionar coluna tags (texto, separado por vírgulas)
ALTER TABLE books ADD COLUMN IF NOT EXISTS tags TEXT;

-- Comentário explicativo
COMMENT ON COLUMN books.tags IS 'Tags/palavras-chave do livro, separadas por vírgula. Ex: romance, aventura, ficção científica';

-- Criar índice simples para busca por tags
CREATE INDEX IF NOT EXISTS idx_books_tags ON books(tags);

SELECT 'Coluna tags adicionada com sucesso!' as resultado;
