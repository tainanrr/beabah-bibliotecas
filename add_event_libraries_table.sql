-- Script para criar tabela de relacionamento many-to-many entre eventos e bibliotecas
-- Permite que um evento seja vinculado a múltiplas bibliotecas

-- 1. Criar tabela de relacionamento
CREATE TABLE IF NOT EXISTS event_libraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, library_id)
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_event_libraries_event_id ON event_libraries(event_id);
CREATE INDEX IF NOT EXISTS idx_event_libraries_library_id ON event_libraries(library_id);

-- 3. Migrar dados existentes (se houver eventos com library_id)
-- Copiar library_id dos eventos existentes para a nova tabela
INSERT INTO event_libraries (event_id, library_id)
SELECT id, library_id
FROM events
WHERE library_id IS NOT NULL
ON CONFLICT (event_id, library_id) DO NOTHING;

-- 4. Comentários para documentação
COMMENT ON TABLE event_libraries IS 'Tabela de relacionamento many-to-many entre eventos e bibliotecas';
COMMENT ON COLUMN event_libraries.event_id IS 'ID do evento';
COMMENT ON COLUMN event_libraries.library_id IS 'ID da biblioteca vinculada ao evento';




