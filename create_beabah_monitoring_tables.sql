-- =============================================================================
-- TABELAS DE MONITORAMENTO BEABAH! - Sistema de Bibliotecas
-- =============================================================================
-- Este script cria as tabelas necessárias para o monitoramento mensal da Rede Beabah!
-- Execute no painel SQL do Supabase
-- =============================================================================

-- 1. Tabela de Registro de Abertura da Biblioteca (Calendário)
CREATE TABLE IF NOT EXISTS library_opening_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  opened BOOLEAN NOT NULL DEFAULT false,
  opening_time TIME,
  closing_time TIME,
  staff_names TEXT,
  notes TEXT,
  created_by UUID REFERENCES users_profile(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(library_id, date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_opening_log_library ON library_opening_log(library_id);
CREATE INDEX IF NOT EXISTS idx_opening_log_date ON library_opening_log(date);
CREATE INDEX IF NOT EXISTS idx_opening_log_library_date ON library_opening_log(library_id, date);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_opening_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_opening_log_updated ON library_opening_log;
CREATE TRIGGER trigger_opening_log_updated
  BEFORE UPDATE ON library_opening_log
  FOR EACH ROW
  EXECUTE FUNCTION update_opening_log_updated_at();

-- RLS para library_opening_log
ALTER TABLE library_opening_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "opening_log_select" ON library_opening_log;
CREATE POLICY "opening_log_select" ON library_opening_log
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "opening_log_insert" ON library_opening_log;
CREATE POLICY "opening_log_insert" ON library_opening_log
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "opening_log_update" ON library_opening_log;
CREATE POLICY "opening_log_update" ON library_opening_log
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "opening_log_delete" ON library_opening_log;
CREATE POLICY "opening_log_delete" ON library_opening_log
  FOR DELETE
  USING (true);

-- =============================================================================
-- 2. Tabela de Mediações de Leitura
-- =============================================================================
CREATE TABLE IF NOT EXISTS reading_mediations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mediation_type VARCHAR(50) NOT NULL CHECK (mediation_type IN ('presencial_biblioteca', 'presencial_externo', 'virtual')),
  location TEXT,
  audience_count INTEGER DEFAULT 0,
  virtual_views INTEGER DEFAULT 0,
  literary_genres TEXT[] DEFAULT '{}',
  description TEXT,
  post_mediation_notes TEXT,
  created_by UUID REFERENCES users_profile(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_mediations_library ON reading_mediations(library_id);
CREATE INDEX IF NOT EXISTS idx_mediations_date ON reading_mediations(date);
CREATE INDEX IF NOT EXISTS idx_mediations_library_date ON reading_mediations(library_id, date);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_mediations_updated ON reading_mediations;
CREATE TRIGGER trigger_mediations_updated
  BEFORE UPDATE ON reading_mediations
  FOR EACH ROW
  EXECUTE FUNCTION update_opening_log_updated_at();

-- RLS
ALTER TABLE reading_mediations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mediations_select" ON reading_mediations;
CREATE POLICY "mediations_select" ON reading_mediations FOR SELECT USING (true);

DROP POLICY IF EXISTS "mediations_insert" ON reading_mediations;
CREATE POLICY "mediations_insert" ON reading_mediations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "mediations_update" ON reading_mediations;
CREATE POLICY "mediations_update" ON reading_mediations FOR UPDATE USING (true);

DROP POLICY IF EXISTS "mediations_delete" ON reading_mediations;
CREATE POLICY "mediations_delete" ON reading_mediations FOR DELETE USING (true);

-- =============================================================================
-- 3. Tabela de Processamento Técnico (Dados mensais)
-- =============================================================================
CREATE TABLE IF NOT EXISTS technical_processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  date DATE NOT NULL, -- Primeiro dia do mês de referência
  books_purchased INTEGER DEFAULT 0,
  books_donated INTEGER DEFAULT 0,
  books_cataloged INTEGER DEFAULT 0,
  books_classified INTEGER DEFAULT 0,
  books_indexed INTEGER DEFAULT 0,
  books_stamped INTEGER DEFAULT 0,
  books_consulted INTEGER DEFAULT 0,
  reading_bags_distributed INTEGER DEFAULT 0,
  other_donations TEXT,
  notes TEXT,
  created_by UUID REFERENCES users_profile(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(library_id, date)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_technical_library ON technical_processing(library_id);
CREATE INDEX IF NOT EXISTS idx_technical_date ON technical_processing(date);

-- Trigger
DROP TRIGGER IF EXISTS trigger_technical_updated ON technical_processing;
CREATE TRIGGER trigger_technical_updated
  BEFORE UPDATE ON technical_processing
  FOR EACH ROW
  EXECUTE FUNCTION update_opening_log_updated_at();

-- RLS
ALTER TABLE technical_processing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "technical_select" ON technical_processing;
CREATE POLICY "technical_select" ON technical_processing FOR SELECT USING (true);

DROP POLICY IF EXISTS "technical_insert" ON technical_processing;
CREATE POLICY "technical_insert" ON technical_processing FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "technical_update" ON technical_processing;
CREATE POLICY "technical_update" ON technical_processing FOR UPDATE USING (true);

DROP POLICY IF EXISTS "technical_delete" ON technical_processing;
CREATE POLICY "technical_delete" ON technical_processing FOR DELETE USING (true);

-- =============================================================================
-- 4. Verificar se a tabela events existe e adicionar campos necessários
-- =============================================================================

-- Se a tabela events não tiver os campos action_type, frequency, adicionar:
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'action_type') THEN
    ALTER TABLE events ADD COLUMN action_type VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'frequency') THEN
    ALTER TABLE events ADD COLUMN frequency VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'description') THEN
    ALTER TABLE events ADD COLUMN description TEXT;
  END IF;
END $$;

-- =============================================================================
-- 5. Adicionar campos de processamento na tabela copies (se não existirem)
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'copies' AND column_name = 'process_stamped') THEN
    ALTER TABLE copies ADD COLUMN process_stamped BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'copies' AND column_name = 'process_indexed') THEN
    ALTER TABLE copies ADD COLUMN process_indexed BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'copies' AND column_name = 'process_taped') THEN
    ALTER TABLE copies ADD COLUMN process_taped BOOLEAN DEFAULT false;
  END IF;
END $$;

-- =============================================================================
-- 6. Adicionar campo library_id na tabela events (se não existir)
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'library_id') THEN
    ALTER TABLE events ADD COLUMN library_id UUID REFERENCES libraries(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_library ON events(library_id);

-- =============================================================================
-- 7. Adicionar campo origin na tabela copies (se não existir)
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'copies' AND column_name = 'origin') THEN
    ALTER TABLE copies ADD COLUMN origin VARCHAR(20) DEFAULT 'indefinido' CHECK (origin IN ('comprado', 'doado', 'indefinido'));
  ELSE
    -- Se já existe, alterar constraint para aceitar 'indefinido'
    ALTER TABLE copies DROP CONSTRAINT IF EXISTS copies_origin_check;
    ALTER TABLE copies ADD CONSTRAINT copies_origin_check CHECK (origin IN ('comprado', 'doado', 'indefinido'));
    -- Atualizar default
    ALTER TABLE copies ALTER COLUMN origin SET DEFAULT 'indefinido';
  END IF;
END $$;

COMMENT ON COLUMN copies.origin IS 'Origem do exemplar: comprado, doado ou indefinido';

-- =============================================================================
-- 8. Criar tabela de Consultas Locais (livros consultados sem empréstimo)
-- =============================================================================

CREATE TABLE IF NOT EXISTS local_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  copy_id UUID REFERENCES copies(id) ON DELETE SET NULL,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users_profile(id) ON DELETE SET NULL,
  consultation_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_by UUID REFERENCES users_profile(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_consultations_library ON local_consultations(library_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON local_consultations(consultation_date);
CREATE INDEX IF NOT EXISTS idx_consultations_copy ON local_consultations(copy_id);

-- RLS
ALTER TABLE local_consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consultations_select" ON local_consultations;
CREATE POLICY "consultations_select" ON local_consultations FOR SELECT USING (true);

DROP POLICY IF EXISTS "consultations_insert" ON local_consultations;
CREATE POLICY "consultations_insert" ON local_consultations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "consultations_delete" ON local_consultations;
CREATE POLICY "consultations_delete" ON local_consultations FOR DELETE USING (true);

-- =============================================================================
-- COMENTÁRIOS/DOCUMENTAÇÃO
-- =============================================================================

COMMENT ON TABLE library_opening_log IS 'Registro diário de abertura das bibliotecas';
COMMENT ON TABLE reading_mediations IS 'Mediações de leitura realizadas (presenciais e virtuais)';
COMMENT ON TABLE technical_processing IS 'Dados mensais de processamento técnico do acervo';

COMMENT ON COLUMN library_opening_log.staff_names IS 'Nomes dos funcionários/voluntários que trabalharam no dia';
COMMENT ON COLUMN reading_mediations.mediation_type IS 'presencial_biblioteca, presencial_externo ou virtual';
COMMENT ON COLUMN reading_mediations.literary_genres IS 'Array de gêneros literários utilizados na mediação';
COMMENT ON COLUMN reading_mediations.post_mediation_notes IS 'Estratégia de pós-mediação utilizada';
COMMENT ON COLUMN technical_processing.reading_bags_distributed IS 'Malas de leitura distribuídas no mês';

-- =============================================================================
-- RESULTADO FINAL
-- =============================================================================
SELECT '✅ Tabelas de monitoramento Beabah! criadas com sucesso!' AS status;
https://beabahbibliotecas.vercel.app/admin/catalogo