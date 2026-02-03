-- Versão alternativa caso a primeira não funcione
-- Adicionar colunas de cores na tabela libraries
-- Execute este script no SQL Editor do Supabase

-- Se der erro de "column already exists", ignore e continue

-- Adicionar coluna primary_color
ALTER TABLE libraries ADD COLUMN primary_color VARCHAR(7) DEFAULT '#1e293b';

-- Adicionar coluna secondary_color  
ALTER TABLE libraries ADD COLUMN secondary_color VARCHAR(7) DEFAULT '#1e40af';

-- Adicionar coluna accent_color
ALTER TABLE libraries ADD COLUMN accent_color VARCHAR(7) DEFAULT '#84cc16';

-- Adicionar coluna tertiary_color
ALTER TABLE libraries ADD COLUMN tertiary_color VARCHAR(7) DEFAULT '#a855f7';




