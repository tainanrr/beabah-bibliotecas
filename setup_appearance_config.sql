-- ============================================
-- CONFIGURAÇÃO DE APARÊNCIA - BEABAH!
-- Execute este comando no SQL Editor do Supabase
-- ============================================

-- 1. Criar tabela (se não existir)
CREATE TABLE IF NOT EXISTS appearance_config (
  id TEXT PRIMARY KEY DEFAULT 'global',
  network_logo TEXT,
  favicon TEXT,
  cover_image TEXT,
  primary_color TEXT DEFAULT '#1e293b',
  secondary_color TEXT DEFAULT '#1e40af',
  accent_color TEXT DEFAULT '#84cc16',
  tertiary_color TEXT DEFAULT '#a855f7',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar colunas de cores se a tabela já existir sem elas
DO $$ 
BEGIN
  -- Adicionar primary_color se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appearance_config' AND column_name = 'primary_color'
  ) THEN
    ALTER TABLE appearance_config ADD COLUMN primary_color TEXT DEFAULT '#1e293b';
  END IF;

  -- Adicionar secondary_color se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appearance_config' AND column_name = 'secondary_color'
  ) THEN
    ALTER TABLE appearance_config ADD COLUMN secondary_color TEXT DEFAULT '#1e40af';
  END IF;

  -- Adicionar accent_color se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appearance_config' AND column_name = 'accent_color'
  ) THEN
    ALTER TABLE appearance_config ADD COLUMN accent_color TEXT DEFAULT '#84cc16';
  END IF;

  -- Adicionar tertiary_color se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appearance_config' AND column_name = 'tertiary_color'
  ) THEN
    ALTER TABLE appearance_config ADD COLUMN tertiary_color TEXT DEFAULT '#a855f7';
  END IF;
END $$;

-- 3. Inserir registro inicial (se não existir)
INSERT INTO appearance_config (id, primary_color, secondary_color, accent_color, tertiary_color) 
VALUES ('global', '#1e293b', '#1e40af', '#84cc16', '#a855f7')
ON CONFLICT (id) DO UPDATE SET
  primary_color = COALESCE(appearance_config.primary_color, '#1e293b'),
  secondary_color = COALESCE(appearance_config.secondary_color, '#1e40af'),
  accent_color = COALESCE(appearance_config.accent_color, '#84cc16'),
  tertiary_color = COALESCE(appearance_config.tertiary_color, '#a855f7');

-- 4. Habilitar Row Level Security
ALTER TABLE appearance_config ENABLE ROW LEVEL SECURITY;

-- 5. Remover políticas antigas se existirem (para evitar conflitos)
DROP POLICY IF EXISTS "appearance_config_select" ON appearance_config;
DROP POLICY IF EXISTS "appearance_config_insert" ON appearance_config;
DROP POLICY IF EXISTS "appearance_config_update" ON appearance_config;

-- 6. Criar políticas de acesso
-- Política: Todos podem ler
CREATE POLICY "appearance_config_select" ON appearance_config
  FOR SELECT
  USING (true);

-- Política: Apenas admin_rede pode inserir
CREATE POLICY "appearance_config_insert" ON appearance_config
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin_rede'
    )
  );

-- Política: Apenas admin_rede pode atualizar
CREATE POLICY "appearance_config_update" ON appearance_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin_rede'
    )
  );

-- 7. Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_appearance_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS appearance_config_updated_at ON appearance_config;
CREATE TRIGGER appearance_config_updated_at
  BEFORE UPDATE ON appearance_config
  FOR EACH ROW
  EXECUTE FUNCTION update_appearance_config_updated_at();




