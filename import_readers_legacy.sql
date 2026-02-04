-- =============================================================================
-- IMPORTAÇÃO DE LEITORES DO SISTEMA ANTIGO
-- =============================================================================
-- INSTRUÇÕES:
-- 1. Execute primeiro o script 'add_reader_fields_migration.sql' para criar os campos
-- 2. Obtenha o UUID da biblioteca de destino (execute: SELECT id, name FROM libraries;)
-- 3. Substitua 'd9fafe3d-3006-4588-8d19-7713ba71fb54' pelo UUID da biblioteca correta
-- 4. Execute este script no Supabase SQL Editor
-- =============================================================================

-- IMPORTANTE: Antes de executar, defina a biblioteca de destino
-- Execute: SELECT id, name FROM libraries; para ver as bibliotecas disponíveis
-- Depois substitua o valor abaixo pelo UUID correto

DO $$
DECLARE
    v_library_id UUID;
BEGIN
    -- SUBSTITUA pelo ID da biblioteca correta!
    -- Para encontrar o ID, execute: SELECT id, name FROM libraries;
    v_library_id := 'd9fafe3d-3006-4588-8d19-7713ba71fb54'::UUID;
    
    RAISE NOTICE 'Library ID configurado: %', v_library_id;
END $$;

-- =============================================================================
-- INSERÇÃO DOS LEITORES
-- =============================================================================
-- NOTA: Substitua 'd9fafe3d-3006-4588-8d19-7713ba71fb54' pelo UUID real da biblioteca

INSERT INTO users_profile (
    id,
    name,
    email,
    role,
    library_id,
    active,
    lgpd_consent,
    created_at,
    birth_date,
    phone,
    address_street,
    address_neighborhood,
    address_city,
    ethnicity,
    gender,
    education_level,
    interests,
    favorite_genres,
    suggestions,
    original_registration_date
) VALUES
-- 1. Abigail Faleiro
(gen_random_uuid(), 'Abigail Faleiro', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-01-27 14:16:45', '2008-12-12', '980288718', 'Rua das Estremosas, 358 - Santo Inácio, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Novelas / Romances / Ficção, Livros de HQ, Romance espírita', 'Livros da Meg Cabot', '2022-01-27 14:16:45'),

-- 2. Abner T. Barcelos
(gen_random_uuid(), 'Abner T. Barcelos', 'contato.abnertepedino@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-02 16:27:15', '2010-09-01', '51 990179358', 'Rua Santo Ângelo', '246', 'Esteio-RS', 'Parda', 'Homens cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Contos tradicionais, Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Terror / Suspense, Crônica, Teatro, Literatura fantástica, Informativo, Livro imagem, Literatura negra / Africana / Afro-brasileira', NULL, '2025-12-02 16:27:15'),

-- 3. Adriana de Souza Pereira
(gen_random_uuid(), 'Adriana de Souza Pereira', 'dricapereira15@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-03-09 09:20:01', '1976-02-06', '51 993456103', 'Rua Plínio Caetano Favero, 33 - Santo Inácio, Esteio', NULL, NULL, 'Preta', 'Mulheres cis', 'Ensino Médio', 'Levar livro, Participar de eventos', 'Contos tradicionais, Contos contemporâneos, Crônica, Literatura negra / Africana / Afro-brasileira', NULL, '2022-03-09 09:20:01'),

-- 4. ADRIANA WEIDE
(gen_random_uuid(), 'Adriana Weide', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-07 14:15:38', '1972-07-18', '5199314682', 'CALÇADÃO NORTE 521', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Leitura na biblioteca, Levar livro', 'Contos tradicionais', NULL, '2022-07-07 14:15:38'),

-- 5. Agatha Ester Chagas
(gen_random_uuid(), 'Agatha Ester Chagas', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-02-15 14:44:05', NULL, '994133733', '?', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Contos contemporâneos', NULL, '2022-02-15 14:44:05'),

-- 6. Ágatha Gabriele Borba Rodrigues
(gen_random_uuid(), 'Ágatha Gabriele Borba Rodrigues', 'renataaguiarborba234@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-02 14:06:22', '2014-10-30', '51 989016523', 'Travessa 60, 18', 'Parque Primavera', 'Esteio-RS', 'Parda', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Contos tradicionais, Contos contemporâneos, Poesia, Livros de HQ, Livro imagem, Literatura infantojuvenil', NULL, '2025-12-02 14:06:22'),

-- 7. Ágatha Rodrigues Pacheco da Silva
(gen_random_uuid(), 'Ágatha Rodrigues Pacheco da Silva', 'vro727310@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-08 10:24:22', '2015-01-31', '982759810', 'Av Padre Urbano Thissen, 224', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca', 'Poesia, Teatro', NULL, '2025-07-08 10:24:22'),

-- 8. Alessandra Dutra da Silva
(gen_random_uuid(), 'Alessandra Dutra da Silva', 'alessandradutra2003@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-01-13 16:43:46', '2003-12-15', '993684443', 'Rua Taquara, 1157 - Vila Olímpica, Esteio', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Superior', 'Leitura na biblioteca, Levar livro', 'Contos contemporâneos, Novelas / Romances / Ficção, Livros de HQ, Literatura fantástica, Literatura negra / Africana / Afro-brasileira', NULL, '2022-01-13 16:43:46'),

-- 9. ALESSANDRA P. SOUZA
(gen_random_uuid(), 'Alessandra P. Souza', 'alessandrapereirasouzas@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-07 14:39:59', '2008-04-10', '51996000329', 'Rua Osmar Cortes Barcelos 210', NULL, NULL, 'Indígena', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Leitura na biblioteca, Levar livro', 'Terror / Suspense, Livros de HQ, Romance espírita', NULL, '2022-07-07 14:39:59'),

-- 10. ALEXANDRA F. RIFFEL
(gen_random_uuid(), 'Alexandra F. Riffel', 'alexandrariffel20@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-10-21 13:59:41', '1982-12-20', '51 991993452', 'ESTRADA DO BOQUEIRÃO, 630', 'JARDIM PLANALTO', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Romance espírita', NULL, '2025-10-21 13:59:41'),

-- 11. ALEXANDRE D. SILVEIRA
(gen_random_uuid(), 'Alexandre D. Silveira', 'xandi.silveira04@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-09-03 14:35:35', '2008-04-03', '51 994580095', 'RUA MACHADO DE ASSIS, 317', '-', 'ESTEIO-RS', 'Branca', 'Homens cis', 'Ensino Médio', 'Levar livro', 'Terror / Suspense, Livros de HQ, Literatura fantástica', 'LIVROS DE TERROR SOBRE LENDAS URBANAS. LIVRO CORAÇÃO DO MAR', '2025-09-03 14:35:35'),

-- 12. ALEXIA ALMEIDA DA SILVA
(gen_random_uuid(), 'Alexia Almeida da Silva', 'denise.gca@hotmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-09-17 15:38:46', '2014-04-08', '51 982792767', 'RUA GUARARAPES, 125', 'PARQUE AMADOR', 'ESTEIO-RS', 'Parda', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro, Participar de eventos', 'Contos tradicionais', NULL, '2025-09-17 15:38:46'),

-- 13. Alexia dos Santos Cruz da Silva
(gen_random_uuid(), 'Alexia dos Santos Cruz da Silva', 'franciele.santos752@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-08 09:56:35', '2015-02-25', '986339286', 'Rua Floriano Maia, 530, Jd Planalto, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Poesia, Literatura fantástica', NULL, '2025-07-08 09:56:35'),

-- 14. Alice Bennenmen
(gen_random_uuid(), 'Alice Bennenmen', 'alicebem96@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2024-08-12 10:30:02', '1996-01-12', '51992460706', 'Rua das Flores, 237, Berto Círio, Nova Santa Rita', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Superior', 'Levar livro', 'Contos tradicionais, Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Crônica', NULL, '2024-08-12 10:30:02'),

-- 15. Alice Elsem Leal dos Santos
(gen_random_uuid(), 'Alice Elsem Leal dos Santos', 'ane.elsem@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-12-07 13:43:42', '2016-01-02', '993189854', 'Estrada Boqueirão, 660, casa 7, Jardim Planalto', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Contos tradicionais, Contos contemporâneos, Livros de HQ, Livro imagem', NULL, '2023-12-07 13:43:42'),

-- 16. Alvarino de Mello
(gen_random_uuid(), 'Alvarino de Mello', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-08-24 14:20:06', '1951-02-19', '998159439', 'Avenida João Paulo, 1078, Jardim Planalto', NULL, NULL, 'Parda', 'Homens cis', 'Ensino Médio', 'Leitura na biblioteca, Levar livro', 'Informativo', NULL, '2023-08-24 14:20:06'),

-- 17. Ana Caroline Rauber da Silva
(gen_random_uuid(), 'Ana Caroline Rauber da Silva', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-01-18 13:12:56', '2008-02-19', '997166793', 'Rua 28 de Fevereiro, 281 - Parque Amador, Esteio', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Poesia, Terror / Suspense, Teatro, Literatura fantástica, Livro imagem', 'Aquisição de mangás.', '2022-01-18 13:12:56'),

-- 18. ANA JÚLIA FREITAS FERREIRA
(gen_random_uuid(), 'Ana Júlia Freitas Ferreira', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-24 15:36:57', '2020-11-10', '51 981666661', 'RUA CALÇADÃO NORTE, 410. PARQUE PRIMAVERA, ESTEIO-RS.', NULL, NULL, 'Branca', 'Mulheres cis', 'Educação Infantil', 'Levar livro', 'LITERATURA INFANTIL', NULL, '2025-07-24 15:36:57'),

-- 19. Ana Paula
(gen_random_uuid(), 'Ana Paula', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-12-13 16:48:19', '1994-04-01', '51 994824048', 'Boqueirão, 800 Jardim Planalto', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Leitura na biblioteca, Levar livro', 'Contos tradicionais', NULL, '2022-12-13 16:48:19'),

-- 20. Ana Paula S. F. Simoni
(gen_random_uuid(), 'Ana Paula S. F. Simoni', 'streletcki80@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2024-09-16 10:14:47', '2002-09-22', '991588034', 'Rua Hélio Arnoldo Sperb, 294, Jd Planalto', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Contos contemporâneos, Poesia, Novelas / Romances / Ficção', NULL, '2024-09-16 10:14:47'),

-- 21. ANALÚ DE CÂNDIDO CASTRO
(gen_random_uuid(), 'Analú de Cândido Castro', 'rodrigo.mkc@hotmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-22 15:43:17', '2014-01-30', '51 992909841', 'RUA LUPÍCINIO RODRIGUES, 448, SANTO INÁCIO. ESTEIO-RS', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Leitura na biblioteca, Levar livro', 'Livros de HQ, LITERATURA INFANTOJUVENIL', NULL, '2025-07-22 15:43:17'),

-- 22. André S. dos Santos
(gen_random_uuid(), 'André S. dos Santos', 'andresholtefedt@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-12-13 16:44:47', '1984-09-22', '51 989313359', 'Estrada Boqueirão, con, jardim b 17, ap 13', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Superior', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Contos tradicionais, Contos contemporâneos, Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Crônica, Teatro, Literatura fantástica, Informativo, Romance espírita, Literatura negra / Africana / Afro-brasileira, Literatura indígena', NULL, '2022-12-13 16:44:47'),

-- 23. Andreia Bueno
(gen_random_uuid(), 'Andreia Bueno', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-10-10 14:54:25', '1971-04-23', '993707539', 'Rua Aldo Locateli 248, Santo Inácio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Novelas / Romances / Ficção, Romance espírita', NULL, '2023-10-10 14:54:25'),

-- 24. Ângela Ariadne Hoffmann
(gen_random_uuid(), 'Ângela Ariadne Hoffmann', 'angelaclaraluz@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2024-08-19 10:59:23', '1969-05-07', '999325230', 'Rua dos Ferroviários, 363/402. centro- Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Mestrado', 'Leitura na biblioteca, Levar livro, Participar de eventos, Voluntariado', 'Contos tradicionais, Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Crônica, Livro imagem, Literatura negra / Africana / Afro-brasileira, Literatura indígena, Literatura marginal e / ou periférica', NULL, '2024-08-19 10:59:23'),

-- 25. ANTHONY BORBA MUNIZ
(gen_random_uuid(), 'Anthony Borba Muniz', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-09-25 16:31:53', '2020-11-14', '51 996902556', 'RUA DOS PIONEIROS, 69', 'PARQUE SANTO INÁCIO', 'ESTEIO-RS', 'Branca', 'Homens cis', 'Educação Infantil', 'Levar livro', 'Livro imagem, LITERATURA INFANTIL', NULL, '2025-09-25 16:31:53'),

-- 26. ANTONYA RAISSA DOS SANTOS RIFFEL
(gen_random_uuid(), 'Antonya Raissa dos Santos Riffel', 'alexandrariffel20@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-10-21 13:57:32', '2017-07-28', '51 991993452', 'ESTRADA DO BOQUEIRÃO, 630', 'JARDIM PLANALTO', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Contos tradicionais, Contos contemporâneos, Poesia', NULL, '2025-10-21 13:57:32'),

-- 27. Ariane Milene Da Silva de Moreira
(gen_random_uuid(), 'Ariane Milene Da Silva de Moreira', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-07 10:07:10', '2011-11-10', '51 981368090', 'Rua Alvina Francisca, 380, Jd Planalto, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Leitura na biblioteca, Participar de eventos', 'Poesia, Terror / Suspense, Teatro, Romance espírita', NULL, '2025-07-07 10:07:10'),

-- 28. Atoni Lourenço Machado
(gen_random_uuid(), 'Atoni Lourenço Machado', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-01-13 13:04:34', '1950-07-07', '51997975700', 'Av. Santo Inácio de Loyola, 146 - Santo Inácio, Esteio', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Médio', 'Levar livro', 'Informativo', NULL, '2022-01-13 13:04:34'),

-- 29. Audry Pedroso de Matos
(gen_random_uuid(), 'Audry Pedroso de Matos', 'audrymatos10@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-12-05 14:56:02', '2009-02-15', '999519432', 'Rua João Frainer 480, santo inácio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Poesia, Novelas / Romances / Ficção, Terror / Suspense', NULL, '2023-12-05 14:56:02'),

-- 30. Augusto Krause
(gen_random_uuid(), 'Augusto Krause', 'rkra9@yahoo.com.br', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2021-12-15 10:16:56', '1980-06-29', '982348432', 'Santo Antônio, 101 - Centro, Esteio', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Superior', 'Levar livro', 'Contos tradicionais, Poesia, Literatura fantástica', 'Literatura evangélica', '2021-12-15 10:16:56'),

-- 31. Beatriz Beckman
(gen_random_uuid(), 'Beatriz Beckman', 'shirlenebeckman@hotmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-02-15 14:40:49', '2011-05-01', '991039919', 'Rua Borges de Medeiros, 71 - Jardim Planalto, Esteio', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Poesia, Livro imagem', NULL, '2022-02-15 14:40:49'),

-- 32. Beatriz Vasconcelos Lacerda
(gen_random_uuid(), 'Beatriz Vasconcelos Lacerda', 'lacerdabeatriz552@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-02 14:13:17', '1981-12-16', '51 989703619', 'Rua Cristo Rei, 79', 'Parque Santo Inácio', 'Esteio-RS', 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Leitura na biblioteca, Levar livro', 'Contos tradicionais, Poesia, Novelas / Romances / Ficção', NULL, '2025-12-02 14:13:17'),

-- 33. Bianca Lacerda Gomes
(gen_random_uuid(), 'Bianca Lacerda Gomes', 'lacerdabeatriz552@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-02 14:11:14', '2017-02-17', '51 989703619', 'Rua Cristo Rei, 79', 'Parque Santo Inácio', 'Esteio-RS', 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro', 'Contos tradicionais, Livro imagem, Literatura infantojuvenil', NULL, '2025-12-02 14:11:14'),

-- 34. Bruna Alessandra
(gen_random_uuid(), 'Bruna Alessandra', 'brunaritterrr@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-08 10:40:45', '2013-07-27', '990189905', 'Rua Gilda de Abreu, 791', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Contos tradicionais', NULL, '2025-07-08 10:40:45'),

-- 35. BRUNA EDUARDA
(gen_random_uuid(), 'Bruna Eduarda', 'brunasilva6110@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-07 15:11:25', '2008-06-11', '51983547286', 'Estrada do Boqueirão, Primavera, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Poesia, Terror / Suspense, Livro imagem', NULL, '2022-07-07 15:11:25'),

-- 36. Bruno Borges Machado
(gen_random_uuid(), 'Bruno Borges Machado', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-02-23 16:16:27', '1944-10-31', '51 34592952', 'Rua Alan Kardek, 415, santo inácio', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Médio', 'Levar livro', 'Contos tradicionais, Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Crônica, Teatro, Literatura fantástica, Informativo, Romance espírita, Livro imagem, Literatura negra / Africana / Afro-brasileira, Literatura indígena, Literatura marginal e / ou periférica', NULL, '2023-02-23 16:16:27'),

-- 37. Bruno Luiz Luz da Silva
(gen_random_uuid(), 'Bruno Luiz Luz da Silva', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-04-07 14:32:48', '2004-02-11', '985734003', 'Rua L, 181 - Primavera, Esteio', NULL, NULL, 'Parda', 'Homens cis', 'Ensino Médio', 'Leitura na biblioteca, Participar de eventos', 'Poesia, Terror / Suspense, Teatro', NULL, '2022-04-07 14:32:48'),

-- 38. Camile Vitoria Pereira F. João
(gen_random_uuid(), 'Camile Vitoria Pereira F. João', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-02-03 16:56:24', '2010-06-01', '983111041', 'Rua Veiga Marques, 142 - Santo Inácio, Esteio', NULL, NULL, 'Indígena', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Terror / Suspense, Livros de HQ', NULL, '2022-02-03 16:56:24'),

-- 39. Carine Dias
(gen_random_uuid(), 'Carine Dias', 'carinecrisdias@hotmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-04-26 13:17:50', '1985-10-14', '995346717', 'Rua João Goulart, 105', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Superior', 'Levar livro', 'Contos tradicionais, Literatura fantástica, Livro imagem, Literatura negra / Africana / Afro-brasileira, Literatura indígena', NULL, '2023-04-26 13:17:50'),

-- 40. Carlos Rodrigues
(gen_random_uuid(), 'Carlos Rodrigues', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-04-07 14:34:56', '2001-10-23', '998544325', 'Rua Oscarito, 25 - Primavera, Esteio', NULL, NULL, 'Preta', 'Homens cis', 'Ensino Superior', 'Levar livro', 'Contos contemporâneos', NULL, '2022-04-07 14:34:56'),

-- 41. Carmen Maria Machado
(gen_random_uuid(), 'Carmen Maria Machado', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-03-02 10:19:07', '1948-06-12', '51 999645613', 'Rua Cruz Alta, 254 - Parque Amador, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Novelas / Romances / Ficção, Romance espírita', NULL, '2023-03-02 10:19:07'),

-- 42. CASSIANE T. BORBA
(gen_random_uuid(), 'Cassiane T. Borba', 'citajaraborba@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-10-21 14:08:00', '1983-12-01', '51 984915648', 'RUA ALAN KARDEC, 120', 'JARDIM PLANALTO', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Superior', 'Levar livro', 'Contos contemporâneos, Novelas / Romances / Ficção, Crônica', NULL, '2025-10-21 14:08:00'),

-- 43. Catarina Bernd Padilha
(gen_random_uuid(), 'Catarina Bernd Padilha', 'lucianapadilha05199@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-08-15 16:32:27', '1949-11-25', '993018361', 'Rua Coelho Neto, 30, Jardim Planalto', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Crônica, Romance espírita', NULL, '2023-08-15 16:32:27'),

-- 44. Cauê de Fraga Domingues
(gen_random_uuid(), 'Cauê de Fraga Domingues', 'borbadominguesd@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-21 14:56:50', '2015-03-21', '51989250025', 'Rua Alan Kardec, 120. Jardim Planalto, Esteio.', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Contos tradicionais, Poesia, Livro imagem', NULL, '2025-07-21 14:56:50'),

-- 45. Cecília Pedroso da Silva
(gen_random_uuid(), 'Cecília Pedroso da Silva', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-21 14:47:34', '2014-11-18', '51994295711', 'Rua Caturrita, 127. Bairro Três Marias. Esteio-RS', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro', 'Livros de HQ', NULL, '2025-07-21 14:47:34'),

-- 46. Ciane da Cruz Xavier
(gen_random_uuid(), 'Ciane da Cruz Xavier', 'ciane_xavier@hotmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-02 13:54:48', '1979-10-16', '51 985058561', 'Rua Padre Balduíno Rambo, 48', 'Parque Santo Inácio', 'Esteio-RS', 'Branca', 'Mulheres cis', 'Educação Infantil', 'Levar livro', 'Contos tradicionais', NULL, '2025-12-02 13:54:48'),

-- 47. CLAUDETE DOS SANTOS RAMOS DA SILVA
(gen_random_uuid(), 'Claudete dos Santos Ramos da Silva', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-10-02 13:49:03', '1958-06-23', '51 999596488', 'RUA DOS PIONEIROS, 161', 'PARQUE SANTO INÁCIO', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro, Participar de eventos', 'Novelas / Romances / Ficção', NULL, '2025-10-02 13:49:03'),

-- 48. Cleusa Castro da Silva
(gen_random_uuid(), 'Cleusa Castro da Silva', 'clausa.canoas@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-03-01 15:56:16', '1962-08-26', '51 992620144', 'Rua Claudio Manoel da Costa, 65', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Contos tradicionais, Contos contemporâneos, Novelas / Romances / Ficção', NULL, '2023-03-01 15:56:16'),

-- 49. Clóvis Ortiz de Souza
(gen_random_uuid(), 'Clóvis Ortiz de Souza', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-12-05 15:18:01', '1980-05-21', '980495940', 'Rua Otávio Silveira Boreges, 327, Vila Olímpica', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Médio', 'Levar livro', 'Contos tradicionais, Contos contemporâneos', NULL, '2023-12-05 15:18:01'),

-- 50. Cybelle C. R. Dias
(gen_random_uuid(), 'Cybelle C. R. Dias', 'cybellecuringard@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-22 14:20:15', '2009-08-01', '51 991855284', 'Av. Porto Alegre, 1308. Jardim Planalto, Esteio-RS.', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Contos tradicionais, Contos contemporâneos, Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Literatura fantástica', NULL, '2025-07-22 14:20:15')

-- Fim da parte 1
;

SELECT 'Parte 1 da importação concluída (50 leitores)! Execute import_readers_legacy_part2.sql para continuar.' as resultado;
