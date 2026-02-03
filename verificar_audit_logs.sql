-- Script para verificar e criar a tabela audit_logs se não existir

-- Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'audit_logs'
) AS table_exists;

-- Se a tabela não existir, criar uma versão básica
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs'
  ) THEN
    CREATE TABLE audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      library_id UUID,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50),
      entity_id UUID,
      entity_name VARCHAR(255),
      details JSONB,
      old_values JSONB,
      new_values JSONB,
      status VARCHAR(50) DEFAULT 'success',
      error_message TEXT,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Criar índices
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_library_id ON audit_logs(library_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);

    RAISE NOTICE 'Tabela audit_logs criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela audit_logs já existe.';
  END IF;
END $$;

-- Verificar estrutura da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'audit_logs'
ORDER BY ordinal_position;




