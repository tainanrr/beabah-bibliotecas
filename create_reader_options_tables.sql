-- =============================================================================
-- Tabelas para opções customizáveis de leitores
-- =============================================================================

-- 1. Tabela para opções de Interesses na Biblioteca
CREATE TABLE IF NOT EXISTS reader_interest_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_default BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users_profile(id)
);

-- Inserir opções padrão de Interesses
INSERT INTO reader_interest_options (name, is_default) VALUES
  ('Leitura na biblioteca', true),
  ('Levar livro', true),
  ('Participar de eventos', true),
  ('Voluntariado', true),
  ('Outro', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Tabela para opções de Gêneros Literários Favoritos
CREATE TABLE IF NOT EXISTS reader_genre_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_default BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users_profile(id)
);

-- Inserir opções padrão de Gêneros Literários
INSERT INTO reader_genre_options (name, is_default) VALUES
  ('Contos tradicionais', true),
  ('Contos contemporâneos', true),
  ('Poesia', true),
  ('Novelas / Romances / Ficção', true),
  ('Terror / Suspense', true),
  ('Livros de HQ', true),
  ('Crônica', true),
  ('Teatro', true),
  ('Literatura fantástica', true),
  ('Informativo', true),
  ('Romance espírita', true),
  ('Livro imagem', true),
  ('Literatura negra / Africana / Afro-brasileira', true),
  ('Literatura indígena', true),
  ('Literatura marginal e / ou periférica', true),
  ('Outro', true)
ON CONFLICT (name) DO NOTHING;

-- Habilitar RLS
ALTER TABLE reader_interest_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE reader_genre_options ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para reader_interest_options
DROP POLICY IF EXISTS "Todos podem ver opções de interesses" ON reader_interest_options;
CREATE POLICY "Todos podem ver opções de interesses" ON reader_interest_options
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin e bibliotecários podem inserir opções de interesses" ON reader_interest_options;
CREATE POLICY "Admin e bibliotecários podem inserir opções de interesses" ON reader_interest_options
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin pode atualizar opções de interesses" ON reader_interest_options;
CREATE POLICY "Admin pode atualizar opções de interesses" ON reader_interest_options
  FOR UPDATE USING (true) WITH CHECK (true);

-- Políticas RLS para reader_genre_options
DROP POLICY IF EXISTS "Todos podem ver opções de gêneros" ON reader_genre_options;
CREATE POLICY "Todos podem ver opções de gêneros" ON reader_genre_options
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin e bibliotecários podem inserir opções de gêneros" ON reader_genre_options;
CREATE POLICY "Admin e bibliotecários podem inserir opções de gêneros" ON reader_genre_options
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin pode atualizar opções de gêneros" ON reader_genre_options;
CREATE POLICY "Admin pode atualizar opções de gêneros" ON reader_genre_options
  FOR UPDATE USING (true) WITH CHECK (true);

-- Comentários nas tabelas
COMMENT ON TABLE reader_interest_options IS 'Opções customizáveis de interesses na biblioteca para leitores';
COMMENT ON TABLE reader_genre_options IS 'Opções customizáveis de gêneros literários favoritos para leitores';

-- =============================================================================
-- RESULTADO
-- =============================================================================
SELECT '✅ Tabelas de opções customizáveis criadas com sucesso!' AS status;
