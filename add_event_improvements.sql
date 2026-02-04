-- =============================================================================
-- Melhorias na tabela de eventos
-- =============================================================================

-- 1. Adicionar campo de horário de término
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'end_date') THEN
    ALTER TABLE events ADD COLUMN end_date TIMESTAMPTZ;
  END IF;
END $$;

COMMENT ON COLUMN events.end_date IS 'Data e horário de término do evento';

-- 2. Garantir que o campo banner_url existe (para imagem de capa)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'banner_url') THEN
    ALTER TABLE events ADD COLUMN banner_url TEXT;
  END IF;
END $$;

COMMENT ON COLUMN events.banner_url IS 'URL da imagem de capa/banner do evento';

-- 3. Adicionar campo de coordenadas do local do evento
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'location_lat') THEN
    ALTER TABLE events ADD COLUMN location_lat DECIMAL(10, 8);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'location_lng') THEN
    ALTER TABLE events ADD COLUMN location_lng DECIMAL(11, 8);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'location_place_id') THEN
    ALTER TABLE events ADD COLUMN location_place_id TEXT;
  END IF;
END $$;

COMMENT ON COLUMN events.location_lat IS 'Latitude do local do evento';
COMMENT ON COLUMN events.location_lng IS 'Longitude do local do evento';
COMMENT ON COLUMN events.location_place_id IS 'Place ID do Google Maps';

-- =============================================================================
-- RESULTADO
-- =============================================================================
SELECT '✅ Campos de melhoria adicionados à tabela events!' AS status;
