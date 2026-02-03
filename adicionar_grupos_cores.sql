-- ============================================
-- Script para adicionar grupos de cores
-- e cadastrar as cores padrão do sistema
-- ============================================

-- 1. Adicionar coluna de grupo na tabela library_colors
ALTER TABLE library_colors ADD COLUMN IF NOT EXISTS color_group text DEFAULT 'Geral';
ALTER TABLE library_colors ADD COLUMN IF NOT EXISTS color_code text;
ALTER TABLE library_colors ADD COLUMN IF NOT EXISTS color_description text;

-- 2. Criar tabela de grupos padrão (global, não por biblioteca)
CREATE TABLE IF NOT EXISTS color_groups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 3. Inserir grupos padrão
INSERT INTO color_groups (name, description, sort_order) VALUES 
    ('Tipo de Leitor', 'Classificação por faixa etária e origem', 1),
    ('Gênero Literário', 'Classificação por gênero da obra', 2),
    ('Literaturas Afirmativas', 'Literaturas de grupos específicos', 3)
ON CONFLICT (name) DO NOTHING;

-- 4. Criar tabela de cores padrão (templates globais)
CREATE TABLE IF NOT EXISTS color_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_name text NOT NULL,
    category_name text NOT NULL,
    color_hex text NOT NULL,
    color_code text,
    color_description text,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(group_name, category_name)
);

-- 5. Limpar templates antigos para recriar
DELETE FROM color_templates;

-- 6. Inserir cores padrão - TIPO DE LEITOR
INSERT INTO color_templates (group_name, category_name, color_hex, color_code, color_description, sort_order) VALUES
    ('Tipo de Leitor', 'Infantil', '#0047AB', '13', 'Azul Cobalto Intenso', 1),
    ('Tipo de Leitor', 'Juvenil', '#FF6900', '10', 'Laranja Intenso', 2),
    ('Tipo de Leitor', 'Adulto Nacional', '#FFFF00', '15', 'Amarelo', 3),
    ('Tipo de Leitor', 'Adulto Estrangeiro', '#009C3B', '23', 'Verde Bandeira', 4);

-- 7. Inserir cores padrão - GÊNERO LITERÁRIO
INSERT INTO color_templates (group_name, category_name, color_hex, color_code, color_description, sort_order) VALUES
    ('Gênero Literário', 'Contos Tradicional', '#FFB6C1', '3', 'Rosa Claro', 1),
    ('Gênero Literário', 'Contos Contemporâneo', '#FF1493', '76', 'Rosa Choque (Pink)', 2),
    ('Gênero Literário', 'Poesia', '#5F9EA0', '12', 'Azul Petróleo Claro', 3),
    ('Gênero Literário', 'Novelas/ Romances/ Ficção', '#006064', '21', 'Azul Petróleo', 4),
    ('Gênero Literário', 'Terror/ Suspense', '#800080', '31', 'Roxo', 5),
    ('Gênero Literário', 'Livros de HQ', '#90EE90', '26', 'Verde Claro', 6),
    ('Gênero Literário', 'Crônica', '#ADD8E6', '11', 'Azul Claro', 7),
    ('Gênero Literário', 'Teatro', '#32CD32', '27', 'Verde Limão', 8),
    ('Gênero Literário', 'Literatura Fantástica', '#DDA0DD', '33', 'Lilás Claro', 9),
    ('Gênero Literário', 'Informativo', '#800000', '29', 'Vinho', 10),
    ('Gênero Literário', 'Romance Espírita', '#FFFFFF', '1', 'Branco', 11),
    ('Gênero Literário', 'Livro Imagem', '#808080', '24', 'Cinza', 12);

-- 8. Inserir cores padrão - LITERATURAS AFIRMATIVAS
INSERT INTO color_templates (group_name, category_name, color_hex, color_code, color_description, sort_order) VALUES
    ('Literaturas Afirmativas', 'Lit. Negra / Africana / Afro', '#FFFF99', '17', 'Amarelo Claro', 1),
    ('Literaturas Afirmativas', 'Literatura Indígena', '#CC7722', '47', 'Ocre', 2),
    ('Literaturas Afirmativas', 'Lit. Marginal e/ou Periférica', '#CC0000', '7', 'Vermelha', 3);

-- 9. Habilitar RLS nas novas tabelas
ALTER TABLE color_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_templates ENABLE ROW LEVEL SECURITY;

-- 10. Políticas de leitura pública (templates são globais)
DROP POLICY IF EXISTS "color_groups_read_all" ON color_groups;
CREATE POLICY "color_groups_read_all" ON color_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "color_templates_read_all" ON color_templates;
CREATE POLICY "color_templates_read_all" ON color_templates FOR SELECT USING (true);

-- 11. Políticas de escrita apenas para admins
DROP POLICY IF EXISTS "color_groups_admin_all" ON color_groups;
CREATE POLICY "color_groups_admin_all" ON color_groups FOR ALL USING (true);

DROP POLICY IF EXISTS "color_templates_admin_all" ON color_templates;
CREATE POLICY "color_templates_admin_all" ON color_templates FOR ALL USING (true);

SELECT '✅ Grupos e cores padrão criados com sucesso!' as resultado;
SELECT count(*) as total_templates FROM color_templates;
