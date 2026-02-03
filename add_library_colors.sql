-- Adicionar colunas de cores na tabela libraries para personalização da área administrativa
-- Essas cores são específicas de cada biblioteca e afetam apenas a área administrativa
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna primary_color
ALTER TABLE libraries 
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#1e293b';

-- Adicionar coluna secondary_color
ALTER TABLE libraries 
ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#1e40af';

-- Adicionar coluna accent_color
ALTER TABLE libraries 
ADD COLUMN IF NOT EXISTS accent_color VARCHAR(7) DEFAULT '#84cc16';

-- Adicionar coluna tertiary_color
ALTER TABLE libraries 
ADD COLUMN IF NOT EXISTS tertiary_color VARCHAR(7) DEFAULT '#a855f7';

-- Comentários nas colunas (opcional)
COMMENT ON COLUMN libraries.primary_color IS 'Cor primária da área administrativa da biblioteca';
COMMENT ON COLUMN libraries.secondary_color IS 'Cor secundária da área administrativa da biblioteca';
COMMENT ON COLUMN libraries.accent_color IS 'Cor de destaque da área administrativa da biblioteca';
COMMENT ON COLUMN libraries.tertiary_color IS 'Cor terciária da área administrativa da biblioteca';

