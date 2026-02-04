-- =============================================================================
-- Adicionar campo show_in_homepage para controlar exibição na página pública
-- =============================================================================

-- 1. Adicionar campo na tabela events (ações culturais)
-- Por padrão: TRUE (ações culturais aparecem na página principal)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'show_in_homepage') THEN
    ALTER TABLE events ADD COLUMN show_in_homepage BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Atualizar eventos existentes para aparecerem na página principal
UPDATE events SET show_in_homepage = true WHERE show_in_homepage IS NULL;

COMMENT ON COLUMN events.show_in_homepage IS 'Se TRUE, o evento aparece na Agenda Cultural da página pública';

-- 2. Adicionar campo na tabela reading_mediations (mediações de leitura)
-- Por padrão: FALSE (mediações NÃO aparecem na página principal por padrão)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reading_mediations' AND column_name = 'show_in_homepage') THEN
    ALTER TABLE reading_mediations ADD COLUMN show_in_homepage BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Atualizar mediações existentes para NÃO aparecerem na página principal por padrão
UPDATE reading_mediations SET show_in_homepage = false WHERE show_in_homepage IS NULL;

COMMENT ON COLUMN reading_mediations.show_in_homepage IS 'Se TRUE, a mediação aparece na Agenda Cultural da página pública';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_events_show_homepage ON events(show_in_homepage);
CREATE INDEX IF NOT EXISTS idx_mediations_show_homepage ON reading_mediations(show_in_homepage);

-- =============================================================================
-- RESULTADO
-- =============================================================================
SELECT '✅ Campo show_in_homepage adicionado com sucesso!' AS status;
