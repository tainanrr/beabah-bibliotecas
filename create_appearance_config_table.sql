-- Tabela para armazenar configurações globais de aparência
-- Apenas admin_rede pode alterar essas configurações

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

-- Inserir registro inicial
INSERT INTO appearance_config (id) 
VALUES ('global')
ON CONFLICT (id) DO NOTHING;

-- NOTA: O sistema agora usa URLs de imagens externas em vez de upload
-- Não é mais necessário criar buckets no Supabase Storage para esta funcionalidade

-- Políticas de acesso (RLS) - permitir leitura pública, escrita apenas para admin_rede
ALTER TABLE appearance_config ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler
CREATE POLICY "appearance_config_select" ON appearance_config
  FOR SELECT
  USING (true);

-- Política: Apenas admin_rede pode inserir/atualizar
CREATE POLICY "appearance_config_insert" ON appearance_config
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin_rede'
    )
  );

CREATE POLICY "appearance_config_update" ON appearance_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin_rede'
    )
  );

