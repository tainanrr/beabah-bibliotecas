-- =============================================================================
-- Adicionar coluna updated_at na tabela library_opening_log
-- Este script resolve o erro: record "new" has no field "updated_at"
-- =============================================================================

-- Adicionar coluna updated_at se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'library_opening_log' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE library_opening_log ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Criar trigger para atualizar updated_at automaticamente (se não existir)
CREATE OR REPLACE FUNCTION update_library_opening_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS update_library_opening_log_updated_at ON library_opening_log;

-- Criar novo trigger
CREATE TRIGGER update_library_opening_log_updated_at
  BEFORE UPDATE ON library_opening_log
  FOR EACH ROW
  EXECUTE FUNCTION update_library_opening_log_updated_at();
