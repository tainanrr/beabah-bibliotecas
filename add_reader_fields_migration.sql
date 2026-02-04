-- =============================================================================
-- MIGRAÇÃO: Adicionar campos completos para leitores
-- =============================================================================
-- Este script adiciona todos os campos necessários para importar os dados
-- completos de leitores do sistema antigo.
-- =============================================================================

-- 1. Data de nascimento
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS birth_date DATE;
COMMENT ON COLUMN users_profile.birth_date IS 'Data de nascimento do leitor';

-- 2. Telefone
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
COMMENT ON COLUMN users_profile.phone IS 'Telefone de contato do leitor';

-- 3. Endereço - Rua e Número
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS address_street TEXT;
COMMENT ON COLUMN users_profile.address_street IS 'Endereço: rua e número do leitor';

-- 4. Endereço - Bairro
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100);
COMMENT ON COLUMN users_profile.address_neighborhood IS 'Bairro do leitor';

-- 5. Endereço - Cidade
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
COMMENT ON COLUMN users_profile.address_city IS 'Cidade do leitor';

-- 6. Etnia
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS ethnicity VARCHAR(50);
COMMENT ON COLUMN users_profile.ethnicity IS 'Etnia/raça declarada: Branca, Parda, Preta, Indígena, Amarela, Quilombola, etc.';

-- 7. Gênero
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
COMMENT ON COLUMN users_profile.gender IS 'Identidade de gênero: Mulheres cis, Homens cis, Mulheres trans, Homens trans, Não-binárie';

-- 8. Escolaridade
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS education_level VARCHAR(100);
COMMENT ON COLUMN users_profile.education_level IS 'Nível de escolaridade: Educação Infantil, Ensino Fundamental (1º ao 5º ano), Ensino Fundamental (6º ao 9º ano), Ensino Médio, Ensino Superior, Pós-graduação, Mestrado, Doutorado, Sem escolaridade';

-- 9. Interesses na biblioteca (múltiplos valores separados por vírgula)
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS interests TEXT;
COMMENT ON COLUMN users_profile.interests IS 'Interesses do leitor na biblioteca, separados por vírgula: Leitura na biblioteca, Levar livro, Participar de eventos, Voluntariado';

-- 10. Gêneros literários favoritos (múltiplos valores separados por vírgula)
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS favorite_genres TEXT;
COMMENT ON COLUMN users_profile.favorite_genres IS 'Gêneros literários favoritos, separados por vírgula';

-- 11. Sugestões de melhoria
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS suggestions TEXT;
COMMENT ON COLUMN users_profile.suggestions IS 'Sugestões do leitor para melhoria da biblioteca';

-- 12. Data de registro original (do sistema antigo)
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS original_registration_date TIMESTAMP WITH TIME ZONE;
COMMENT ON COLUMN users_profile.original_registration_date IS 'Data de cadastro original do sistema antigo';

-- 13. Observações internas
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS notes TEXT;
COMMENT ON COLUMN users_profile.notes IS 'Observações internas sobre o leitor';

-- =============================================================================
-- ÍNDICES para melhorar buscas
-- =============================================================================

-- Índice para busca por telefone
CREATE INDEX IF NOT EXISTS idx_users_profile_phone ON users_profile(phone);

-- Índice para busca por bairro
CREATE INDEX IF NOT EXISTS idx_users_profile_neighborhood ON users_profile(address_neighborhood);

-- Índice para busca por cidade
CREATE INDEX IF NOT EXISTS idx_users_profile_city ON users_profile(address_city);

-- Índice para busca por etnia
CREATE INDEX IF NOT EXISTS idx_users_profile_ethnicity ON users_profile(ethnicity);

-- Índice para busca por gênero
CREATE INDEX IF NOT EXISTS idx_users_profile_gender ON users_profile(gender);

-- Índice para busca por escolaridade
CREATE INDEX IF NOT EXISTS idx_users_profile_education ON users_profile(education_level);

-- Índice para busca em gêneros favoritos
CREATE INDEX IF NOT EXISTS idx_users_profile_genres ON users_profile(favorite_genres);

-- =============================================================================
-- ATUALIZAÇÃO DAS POLÍTICAS RLS (se necessário)
-- =============================================================================

-- Garantir que as políticas RLS existentes permitam acesso aos novos campos
-- (Não é necessário criar novas políticas, os campos serão acessíveis pelas políticas existentes)

SELECT 'Migração de campos de leitores concluída com sucesso!' as resultado;
