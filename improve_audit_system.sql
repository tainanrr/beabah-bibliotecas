-- Script para melhorar o sistema de auditoria
-- Execute este script no SQL Editor do Supabase
-- Este script adiciona colunas à tabela audit_logs existente ou cria a tabela se não existir

-- 1. Criar tabela se não existir (com estrutura mínima inicial)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users_profile(id) ON DELETE SET NULL,
  library_id UUID REFERENCES libraries(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT, -- Será convertido para JSONB depois se necessário
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar colunas se não existirem
DO $$
BEGIN
  -- Adicionar entity_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs' 
    AND column_name = 'entity_type'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN entity_type VARCHAR(50);
  END IF;
  
  -- Adicionar entity_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs' 
    AND column_name = 'entity_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN entity_id UUID;
  END IF;
  
  -- Adicionar entity_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs' 
    AND column_name = 'entity_name'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN entity_name VARCHAR(255);
  END IF;
  
  -- Converter details para JSONB se ainda for TEXT, ou adicionar se não existir
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs' 
    AND column_name = 'details'
    AND data_type = 'text'
  ) THEN
    -- Tentar converter TEXT para JSONB (pode falhar se houver dados inválidos)
    BEGIN
      ALTER TABLE audit_logs ALTER COLUMN details TYPE JSONB USING 
        CASE 
          WHEN details IS NULL OR details = '' THEN NULL::jsonb
          ELSE details::jsonb
        END;
    EXCEPTION WHEN OTHERS THEN
      -- Se falhar, manter como TEXT e adicionar uma nova coluna details_jsonb
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs' 
        AND column_name = 'details_jsonb'
      ) THEN
        ALTER TABLE audit_logs ADD COLUMN details_jsonb JSONB;
      END IF;
    END;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs' 
    AND column_name = 'details'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN details JSONB;
  END IF;
  
  -- Adicionar old_values
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs' 
    AND column_name = 'old_values'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN old_values JSONB;
  END IF;
  
  -- Adicionar new_values
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs' 
    AND column_name = 'new_values'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN new_values JSONB;
  END IF;
  
  -- Adicionar ip_address
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs' 
    AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN ip_address VARCHAR(45);
  END IF;
  
  -- Adicionar user_agent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs' 
    AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN user_agent TEXT;
  END IF;
  
  -- Adicionar status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN status VARCHAR(20) DEFAULT 'success';
  END IF;
  
  -- Adicionar error_message
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs' 
    AND column_name = 'error_message'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN error_message TEXT;
  END IF;
  
  -- Adicionar updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 3. Criar índices para melhorar performance (após adicionar as colunas)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_library_id ON audit_logs(library_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type) WHERE entity_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status) WHERE status IS NOT NULL;

-- 4. Comentários nas colunas
COMMENT ON TABLE audit_logs IS 'Registro completo de todas as ações realizadas no sistema';
COMMENT ON COLUMN audit_logs.user_id IS 'ID do usuário que realizou a ação';
COMMENT ON COLUMN audit_logs.library_id IS 'ID da biblioteca relacionada à ação';
COMMENT ON COLUMN audit_logs.action IS 'Tipo de ação: CREATE, UPDATE, DELETE, LOAN, RETURN, RENEW, etc.';
COMMENT ON COLUMN audit_logs.entity_type IS 'Tipo de entidade afetada: book, copy, loan, user, library, event';
COMMENT ON COLUMN audit_logs.entity_id IS 'ID da entidade afetada';
COMMENT ON COLUMN audit_logs.entity_name IS 'Nome/título da entidade para facilitar busca';
COMMENT ON COLUMN audit_logs.details IS 'Detalhes completos da ação em formato JSON';
COMMENT ON COLUMN audit_logs.old_values IS 'Valores antigos (para ações de UPDATE)';
COMMENT ON COLUMN audit_logs.new_values IS 'Valores novos (para ações de UPDATE)';
COMMENT ON COLUMN audit_logs.ip_address IS 'Endereço IP do usuário';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent do navegador';
COMMENT ON COLUMN audit_logs.status IS 'Status da ação: success, error, warning';
COMMENT ON COLUMN audit_logs.error_message IS 'Mensagem de erro se a ação falhou';

-- 5. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_audit_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_audit_logs_updated_at ON audit_logs;
CREATE TRIGGER trigger_update_audit_logs_updated_at
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_logs_updated_at();
