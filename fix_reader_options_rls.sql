-- =============================================================================
-- Correção das políticas RLS para tabelas de opções de leitores
-- Execute este script se estiver recebendo erro de RLS ao editar/excluir opções
-- =============================================================================

-- Corrigir políticas RLS para reader_interest_options
DROP POLICY IF EXISTS "Todos podem ver opções de interesses" ON reader_interest_options;
CREATE POLICY "Todos podem ver opções de interesses" ON reader_interest_options
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin e bibliotecários podem inserir opções de interesses" ON reader_interest_options;
CREATE POLICY "Admin e bibliotecários podem inserir opções de interesses" ON reader_interest_options
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin pode atualizar opções de interesses" ON reader_interest_options;
CREATE POLICY "Admin pode atualizar opções de interesses" ON reader_interest_options
  FOR UPDATE USING (true) WITH CHECK (true);

-- Corrigir políticas RLS para reader_genre_options
DROP POLICY IF EXISTS "Todos podem ver opções de gêneros" ON reader_genre_options;
CREATE POLICY "Todos podem ver opções de gêneros" ON reader_genre_options
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin e bibliotecários podem inserir opções de gêneros" ON reader_genre_options;
CREATE POLICY "Admin e bibliotecários podem inserir opções de gêneros" ON reader_genre_options
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin pode atualizar opções de gêneros" ON reader_genre_options;
CREATE POLICY "Admin pode atualizar opções de gêneros" ON reader_genre_options
  FOR UPDATE USING (true) WITH CHECK (true);

-- =============================================================================
-- RESULTADO
-- =============================================================================
SELECT '✅ Políticas RLS corrigidas com sucesso!' AS status;
