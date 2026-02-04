-- =============================================================================
-- IMPORTAÇÃO DE LEITORES DO SISTEMA ANTIGO - PARTE 2
-- =============================================================================
-- Execute após import_readers_legacy.sql
-- IMPORTANTE: Substitua 'd9fafe3d-3006-4588-8d19-7713ba71fb54' pelo UUID da biblioteca
-- =============================================================================

INSERT INTO users_profile (
    id, name, email, role, library_id, active, lgpd_consent, created_at,
    birth_date, phone, address_street, address_neighborhood, address_city,
    ethnicity, gender, education_level, interests, favorite_genres, suggestions, original_registration_date
) VALUES

-- 51. DAIANA MENDES BORBA MUNIZ
(gen_random_uuid(), 'Daiana Mendes Borba Muniz', 'daia30mendes12@yahoo.com.br', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1985-12-30', '51 996902556', 'RUA DOS PIONEIROS, 69', 'PARQUE SANTO INÁCIO', 'ESTEIO-RS', 'Parda', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Novelas / Romances / Ficção', NULL, '2025-09-25 16:33:29'),

-- 52. Daiana Rauler Rossato
(gen_random_uuid(), 'Daiana Rauler Rossato', 'rossato_deia@yahoo.com.br', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1991-04-20', '992918421', 'Rua 28 de Fevereiro, 281 - Parque Amador, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Contos tradicionais, Novelas / Romances / Ficção, Literatura fantástica, Informativo, Literatura negra / Africana / Afro-brasileira, Literatura indígena, Literatura marginal e / ou periférica', NULL, '2021-12-21 13:53:35'),

-- 53. DAIANE PEREIRA DA ROSA MOTTA
(gen_random_uuid(), 'Daiane Pereira da Rosa Motta', 'daianeprosa@hotmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1982-07-30', '51 991637805', 'RUA DI CAVALCANTI, 35', 'PARQUE SANTO INÁCIO', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Superior', 'Levar livro', 'Terror / Suspense', NULL, '2025-09-04 15:51:40'),

-- 54. Débora Dartora
(gen_random_uuid(), 'Débora Dartora', 'dartoradebora@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1990-06-03', '984243798', 'Av Cavalhada, 4937, Cavalhada, Porto Alegre', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Superior', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Contos tradicionais, Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Crônica, Teatro, Literatura fantástica, Informativo, Romance espírita, Livro imagem, Literatura negra / Africana / Afro-brasileira, Literatura indígena, Literatura marginal e / ou periférica', NULL, '2023-12-14 13:20:36'),

-- 55. Denise Bock de Andrade
(gen_random_uuid(), 'Denise Bock de Andrade', 'denisebock87@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1987-02-09', '992613148', 'Aristides Stumph, 185 - São Sebastião, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Doutorado', 'Levar livro', 'Literatura negra / Africana / Afro-brasileira', NULL, '2021-12-10 15:03:51'),

-- 56. Diandra Ramos
(gen_random_uuid(), 'Diandra Ramos', 'saradiandra@hotmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1997-11-25', '9801207365', 'Rua Gilda de Abreu, 301, Santo Inácio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro, Participar de eventos', 'Contos contemporâneos, Novelas / Romances / Ficção, Terror / Suspense, Crônica, Literatura fantástica, Informativo, Livro imagem', NULL, '2023-07-18 14:30:37'),

-- 57. DIEGO BORBA DOMINGUES
(gen_random_uuid(), 'Diego Borba Domingues', 'borbadominguesd@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1983-06-10', '51 989250025', 'RUA ALAN KARDEC, 120', 'JARDIM PLANALTO', 'ESTEIO-RS', 'Branca', 'Homens cis', 'Ensino Médio', 'Levar livro', 'Poesia, Terror / Suspense, Crônica, Romance espírita', NULL, '2025-10-21 14:05:54'),

-- 58. Diva da Assunção Sipriano
(gen_random_uuid(), 'Diva da Assunção Sipriano', 'diva.sipriano.leitor@biblioteca.local', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1962-11-21', '997666480', 'Santo Inácio', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Romance espírita', NULL, '2024-01-31 09:34:25'),

-- 59. DIVANIR FERREIRA ESPÍNDOLA
(gen_random_uuid(), 'Divanir Ferreira Espíndola', 'divanir.espindola.leitor@biblioteca.local', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1956-04-02', '51 994297900', 'AV. LUIZ PASTEUR, 6334', 'PARQUE PRIMAVERA', 'ESTEIO-RS', 'Preta', 'Mulheres cis', 'Ensino Médio', 'Leitura na biblioteca, Levar livro, Participar de eventos, Voluntariado', 'Contos tradicionais, Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Crônica, Literatura negra / Africana / Afro-brasileira', NULL, '2025-08-28 16:06:00'),

-- 60. Edison R. Corrêa
(gen_random_uuid(), 'Edison R. Corrêa', 'edison.correa.leitor@biblioteca.local', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1981-06-26', '51 996847344', 'Estrada Boqueirão 800, apto 812, Jardim Planalto, Esteio', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Livros de HQ', NULL, '2023-01-31 15:47:37'),

-- 61. Eduarda da Silva dos Santos
(gen_random_uuid(), 'Eduarda da Silva dos Santos', 'eduardadossantos1814@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2006-01-19', '51 991528341', 'Rua Orestes Pianta nº68, Primavera, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Contos tradicionais, Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Teatro, Literatura fantástica', NULL, '2022-10-04 16:07:23'),

-- 62. EDUARDO PACHECO SANTOS
(gen_random_uuid(), 'Eduardo Pacheco Santos', 'e.eduardopacheco@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1989-10-07', '51 984482211', 'RUA SENADOR SALGADO FILHO, 268', 'CENTRO', 'ESTEIO-RS', 'Branca', 'Homens cis', 'Pós-graduação Especialização', 'Leitura na biblioteca, Levar livro, Voluntariado', 'Contos contemporâneos, Novelas / Romances / Ficção, Literatura negra / Africana / Afro-brasileira', NULL, '2025-08-28 16:11:25'),

-- 63. Eliane Machado das Neves
(gen_random_uuid(), 'Eliane Machado das Neves', 'eliane.neves.leitor@biblioteca.local', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1991-12-02', '51985216308', 'Rua Euclides da Cunha, 160 - Jardim Planalto, Esteio/RS', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Novelas / Romances / Ficção, Romance espírita', NULL, '2022-05-23 12:02:35'),

-- 64. Elisandra Silveira dos Santos
(gen_random_uuid(), 'Elisandra Silveira dos Santos', 'elisandra.santos@educaesteio.com.br', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1979-11-15', '51 993801885', 'Av João Paulo 601 Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Pós-graduação Especialização', 'Levar livro', 'Contos tradicionais, Contos contemporâneos, Poesia, Crônica, Livro imagem', NULL, '2022-12-01 15:56:46'),

-- 65. ELISEU DE MELO JUNIOR
(gen_random_uuid(), 'Eliseu de Melo Junior', 'eliseudemelojunior@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1995-08-08', '51 981644048', 'Av. João Paulo I, 255', 'PARQUE SANTO INÁCIO', 'ESTEIO-RS', 'Preta', 'Homens cis', 'Ensino Médio', 'Levar livro', 'Contos tradicionais, Informativo, Romance espírita, Literatura negra / Africana / Afro-brasileira', NULL, '2025-10-28 15:40:35'),

-- 66. ELIZABETH LEHNEN
(gen_random_uuid(), 'Elizabeth Lehnen', 'elizabeth.lehnen.leitor@biblioteca.local', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1955-04-18', '51 85462176', 'AV. PORTO ALEGRE, 590.', 'JARDIM PLANALTO', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Contos contemporâneos, Novelas / Romances / Ficção, LITERATURA INFANTIL', NULL, '2025-08-04 15:09:24'),

-- 67. EMERSON CAMPOS CURVELO
(gen_random_uuid(), 'Emerson Campos Curvelo', 'emerson.curvelo.leitor@biblioteca.local', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1979-02-12', '51 985312706', 'AV. LUIZ PASTEUR, 5727', 'PARQUE PRIMAVERA', 'ESTEIO-RS', 'Branca', 'Homens cis', 'Ensino Médio', 'Leitura na biblioteca', 'Poesia', NULL, '2025-08-28 16:24:30'),

-- 68. Emilly Carvalho Silveira
(gen_random_uuid(), 'Emilly Carvalho Silveira', 'emillydcsilveira2020@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2009-10-20', NULL, 'Av Padre Claret, 1735, Parque Amador, Esteio', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Livros de HQ', NULL, '2023-05-11 13:26:46'),

-- 69. Emilly de Carvalho Silveira (duplicata - mesmo leitor)
(gen_random_uuid(), 'Emilly de Carvalho Silveira', 'emilly.silveira.leitor@biblioteca.local', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2009-10-20', '51984159497', 'Av. Padre Claret, 1635 - Parque Amador, Esteio', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Leitura na biblioteca, Levar livro', 'Livros de HQ, Literatura negra / Africana / Afro-brasileira', NULL, '2022-03-23 11:48:20'),

-- 70. Emilly Morais da Rosa
(gen_random_uuid(), 'Emilly Morais da Rosa', 'emilly.rosa.leitor@biblioteca.local', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2010-10-19', '996250023', 'Walter S. Nunes, 20 - Santo Inácio, Esteio', NULL, NULL, 'Preta', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Terror / Suspense', NULL, '2021-12-10 14:57:53'),

-- 71. ENDRIO DA SILVA WEBER
(gen_random_uuid(), 'Endrio da Silva Weber', 'endrio.weber@aluno.educaesteio.com.br', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2012-02-29', NULL, 'RUA PROCÓPIO FERREIRA, 39.', 'JARDIM PLANALTO', 'ESTEIO-RS', 'Branca', 'Homens cis', 'Ensino Fundamental (6º ao 9º ano)', 'Leitura na biblioteca', 'Novelas / Romances / Ficção, Informativo', 'AUMENTAR O HORÁRIO DE FUNCIONAMENTO DA BIBLIOTECA.', '2025-11-25 15:03:38'),

-- 72. Enildo Severino Correa Vargas
(gen_random_uuid(), 'Enildo Severino Correa Vargas', 'enildovargas.cjuridico@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1977-12-23', '51995843688', 'Rua Claudio Zonta, 114. Jardim Planalto, Esteio.', NULL, NULL, 'Preta', 'Homens cis', 'Pós-graduação Especialização', 'Voluntariado', 'Informativo, Literatura negra / Africana / Afro-brasileira', 'Divulgar a biblioteca com uma banca na frente de supermercado onde há mais movimento.', '2025-07-21 16:17:49'),

-- 73. Enzo Gabriel Silveira Garcia
(gen_random_uuid(), 'Enzo Gabriel Silveira Garcia', 'enzo.garcia.leitor@biblioteca.local', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2011-12-08', '51999940235', 'Av. Padre Claret, 1735 - Parque Amador, Esteio', NULL, NULL, 'Parda', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro', 'Contos contemporâneos, Poesia, Literatura fantástica, Livro imagem', NULL, '2022-03-31 14:08:34'),

-- 74. Eva Szazepawiak
(gen_random_uuid(), 'Eva Szazepawiak', 'eva.szazepawiak.leitor@biblioteca.local', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1957-03-26', '985013012', 'Estrada Boqueirão, 800, Bloco 4, Ap. 442 - Jardim Planalto, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Terror / Suspense, Romance espírita', NULL, '2021-12-21 13:55:10'),

-- 75. Eveline Acosta Calegaro Piagetti
(gen_random_uuid(), 'Eveline Acosta Calegaro Piagetti', 'evelinecalegaro@yahoo.com.br', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1978-08-18', '51 984878243', 'Rua Quarai, 96 (ap 835), Bloco 08, bairro São José, Esteio/RS', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Superior', 'Leitura na biblioteca, Levar livro, Participar de eventos, Voluntariado', 'Contos tradicionais, Teatro, Literatura negra / Africana / Afro-brasileira, Literatura indígena, Literatura marginal e / ou periférica', NULL, '2024-04-13 17:09:41'),

-- 76. FABIANA CRISTINA OLIVEIRA DE SOUZA
(gen_random_uuid(), 'Fabiana Cristina Oliveira de Souza', 'tayaalmeida12@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2012-06-21', '51 981526569', 'RUA FLORIANO MAIA D''AVILA, 510.', 'JARDIM PLANALTO', 'ESTEIO-RS', 'Preta', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Contos tradicionais', NULL, '2025-08-04 15:05:37'),

-- 77. Fabíola Carine Bulso Clavé
(gen_random_uuid(), 'Fabíola Carine Bulso Clavé', 'fabiolaclave@hotmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1982-12-16', '981788104', 'Estrada Morro do Paula, 3333, São Leopoldo', NULL, NULL, 'Branca', 'Mulheres cis', 'Pós-graduação Especialização', 'Levar livro, Participar de eventos, Professora', 'Contos contemporâneos, Novelas / Romances / Ficção, Crônica, Romance espírita, Literatura indígena', NULL, '2024-09-16 10:18:28'),

-- 78. FÁTIMA NAYARA SANTOS OLIVEIRA
(gen_random_uuid(), 'Fátima Nayara Santos Oliveira', 'oliviernayara@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1996-10-01', '38 999356680', 'RUA AMAPÁ, 370, PARQUE AMADOR. ESTEIO-RS', NULL, NULL, 'Quilombola', 'Mulheres cis', 'Ensino Superior', 'Levar livro, Participar de eventos, Voluntariado', 'Contos tradicionais, Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Crônica, Teatro, Literatura negra / Africana / Afro-brasileira, Literatura indígena, Literatura marginal e / ou periférica', NULL, '2025-07-22 15:49:31'),

-- 79. Felipe A. O. da Rosa
(gen_random_uuid(), 'Felipe A. O. da Rosa', 'felipeolacheadarosa@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2003-05-29', '51991432843', 'Rua 1º de Março, 410, Primavera, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Superior', 'Levar livro', 'Contos contemporâneos, Poesia, Terror / Suspense, Literatura fantástica, Informativo', NULL, '2022-11-17 13:22:03'),

-- 80. FERNANDA QUEIROZ VIECELI
(gen_random_uuid(), 'Fernanda Queiroz Vieceli', 'feqvieceli@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2000-07-09', '51 992196753', 'RUA DI CAVALCANTI, 364', 'SANTO INÁCIO', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Superior', 'Levar livro, Participar de eventos, Voluntariado', 'Contos contemporâneos, Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Crônica, Teatro, Literatura fantástica, Informativo, Livro imagem, Literatura negra / Africana / Afro-brasileira, Literatura indígena, Literatura marginal e / ou periférica', 'LIVROS DE ARTE E EDUCAÇÃO', '2025-08-28 16:17:42'),

-- 81. FLÁVIA RIBEIRO
(gen_random_uuid(), 'Flávia Ribeiro', 'flavia-675696@estudante.rs.gov.br', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2008-04-24', '51985442442', 'Avenida Boqueirão, 800. Bloco 7, apto 741.', 'Parque Primavera', 'Esteio-RS', 'Parda', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Poesia, Novelas / Romances / Ficção, Terror / Suspense, Teatro, Literatura fantástica', NULL, '2025-10-27 15:05:36'),

-- 82. Franciele Fernanda de Azevedo
(gen_random_uuid(), 'Franciele Fernanda de Azevedo', 'francielefernanda2706@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2002-06-27', '51 995112805', 'RUA LEOPOLDO BRENTANO, 107, PARQUE SANTO INÁCIO. ESTEIO-RS', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Novelas / Romances / Ficção', NULL, '2025-07-22 16:04:38'),

-- 83. Franciele Silva de Mattos
(gen_random_uuid(), 'Franciele Silva de Mattos', 'franciellemattos42@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2004-01-18', '51995498236', 'Rua Oreste Pianta, 42, Primavera, Esteio', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Poesia, Terror / Suspense, Romance espírita', NULL, '2022-11-17 13:27:39'),

-- 84. Gabriel Lohan Cunha
(gen_random_uuid(), 'Gabriel Lohan Cunha', 'gabriel.cunha.leitor@biblioteca.local', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), NULL, '984686901', 'R. Alberto Braun, 128 - Santo Inácio, Esteio', NULL, NULL, 'Branca', 'Homens cis', 'Educação Infantil', 'Leitura na biblioteca, Levar livro', 'Contos tradicionais, Livro imagem', 'Livros sobre dinossauros', '2022-02-01 13:47:20'),

-- 85. Gabriel Oliveira da Rocha
(gen_random_uuid(), 'Gabriel Oliveira da Rocha', 'gabriel.rocha.leitor@biblioteca.local', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2015-10-26', '993230907', 'Av Safira 1549', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Contos tradicionais, Contos contemporâneos, Novelas / Romances / Ficção, Livros de HQ, Livro imagem, Literatura indígena', NULL, '2024-08-14 10:15:15'),

-- 86. GABRIELA DE OLIVEIRA EICH
(gen_random_uuid(), 'Gabriela de Oliveira Eich', 'gabidedeich@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2005-06-01', '51 99916819', 'ESTRADA DO BOQUEIRÃO, 1093', 'JARDIM PLANALTO', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Superior', 'Leitura na biblioteca, Participar de eventos, Voluntariado', 'Poesia, Novelas / Romances / Ficção', NULL, '2025-08-28 16:21:24'),

-- 87. GABRIELA FERNANDES DE SOUZA
(gen_random_uuid(), 'Gabriela Fernandes de Souza', 'rl966076@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2014-04-01', '51 986438825', 'AV GOVERNADO ERNESTO DORNELLES, 244. SANTO INÁCIO, ESTEIO-RS', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro', 'Poesia, Terror / Suspense, Livro imagem, Literatura indígena', NULL, '2025-07-22 15:39:41'),

-- 88. GABRIELA MACHADO BRAGA
(gen_random_uuid(), 'Gabriela Machado Braga', 'gabriela.braga.leitor@biblioteca.local', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2014-04-01', '51 992916876', 'RUA ALDO LOCATELLI, 69. SANTO INÁCIO, ESTEIO-RS', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro', 'Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Literatura fantástica', NULL, '2025-07-22 15:41:09'),

-- 89. Gabriela Oliveira da Silva
(gen_random_uuid(), 'Gabriela Oliveira da Silva', 'gabrielaguterra2018@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1987-06-30', '51986865869', 'Travessa 74, num 18, Pq Primavera, Esteio', NULL, NULL, 'Preta', 'Mulheres cis', 'Ensino Médio', 'Leitura na biblioteca, Levar livro', 'Contos tradicionais', NULL, '2022-09-02 13:44:05'),

-- 90. Geovane Neves da Silva
(gen_random_uuid(), 'Geovane Neves da Silva', 'nvscontato@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1992-03-31', '984776911', 'Guararapes, 162 - Parque Amador, Esteio', NULL, NULL, 'Parda', 'Homens cis', 'Ensino Médio', 'Leitura na biblioteca, Levar livro, Voluntariado', 'Informativo, Literatura marginal e / ou periférica', 'Seja livre!', '2021-12-15 10:18:12'),

-- 91. Gilberto Busi Hirt
(gen_random_uuid(), 'Gilberto Busi Hirt', 'gilberto.hirt@hotmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1992-03-06', '994583830', 'Gilda de Abreu, 419 - Santo Inácio, Esteio', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Médio', 'Levar livro', 'Informativo, Literatura marginal e / ou periférica', NULL, '2021-12-10 14:53:53'),

-- 92. GILBERTO GIL RODRIGUES DOS SANTOS
(gen_random_uuid(), 'Gilberto Gil Rodrigues dos Santos', 'gilbertoxpc.gil@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1983-03-30', '51 999979525', 'TRAVESSA ALVINA FRANCISCA, 235', 'JARDIM PLANALTO', 'ESTEIO-RS', 'Branca', 'Homens cis', 'Ensino Médio', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Contos contemporâneos, Informativo', NULL, '2025-10-21 14:11:05'),

-- 93. Gilson Gunthier
(gen_random_uuid(), 'Gilson Gunthier', 'gilsongunthier@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1963-05-06', '998977180', 'Av. João Paulo, 776 - Santo Inácio, Esteio', NULL, NULL, 'Branca', 'Não-binárie', 'Ensino Médio', 'Levar livro', 'Contos tradicionais, Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Crônica, Literatura fantástica, Informativo', NULL, '2022-02-01 16:44:05'),

-- 94. GIÔNATAN PAGLIARINI DOS SANTOS
(gen_random_uuid(), 'Giônatan Pagliarini dos Santos', 'gionatan05022007@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2007-02-05', '51 999225601', 'RUA ALDO LOCATELI, 116', 'PARQUE SANTO INÁCIO', 'ESTEIO-RS', 'Branca', 'Homens cis', 'Ensino Médio', 'Levar livro', 'Terror / Suspense', 'PARTICIPAR DE CLUBE DE LEITURA PRESENCIAL. ALUNO DA ESCOLA JARDIM PLANALTO, TURMA 301, MAS BUSCA AS ATIVIDADES PARA CASA.', '2025-11-25 15:07:23'),

-- 95. Giovanna Deolinda
(gen_random_uuid(), 'Giovanna Deolinda', 'bellesgio@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2006-10-19', '51986585330', 'Rua Rio Grande, 2255, apto 304, Morada 1, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Poesia, Novelas / Romances / Ficção, Terror / Suspense', NULL, '2022-11-03 16:17:52'),

-- 96. Greice Neves Portugues
(gen_random_uuid(), 'Greice Neves Portugues', 'nevespgreice@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '1980-02-17', '51 995477525', 'Rua Rio Grande, 2195. Bloco Q / apto 468', 'Liberdade', 'Esteio-RS', 'Branca', 'Mulheres cis', 'Pós-graduação Especialização', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Contos tradicionais, Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Crônica, Informativo, Romance espírita', NULL, '2025-12-03 15:43:00'),

-- 97. Guilherme Brum da Silva
(gen_random_uuid(), 'Guilherme Brum da Silva', 'guiguibrum@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2003-12-28', '998075487', 'Rua das Dálias, 108 - Santo Inácio, Esteio', NULL, NULL, 'Preta', 'Homens cis', 'Ensino Superior', 'Levar livro', 'Contos contemporâneos, Terror / Suspense, Literatura fantástica', NULL, '2022-01-13 16:45:39'),

-- 98. Guilherme Lima de Almeida
(gen_random_uuid(), 'Guilherme Lima de Almeida', 'guilherme.almeida.leitor@biblioteca.local', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2000-02-28', '51 998330546', 'Esteio', NULL, NULL, 'Branca', 'Homens cis', 'Sem escolaridade', 'Levar livro', 'Literatura marginal e / ou periférica', NULL, '2023-02-23 13:33:42'),

-- 99. Guilherme Moreira Borges
(gen_random_uuid(), 'Guilherme Moreira Borges', 'guilherme.borges.leitor@biblioteca.local', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2014-12-13', '51985687499', 'Av. Boqueirão, 670 - Jardim Planalto, Esteio', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', NULL, 'Contos contemporâneos', NULL, '2023-01-26 13:34:42'),

-- 100. GUSTAVO FAGUNDES HUFF QUADRADO
(gen_random_uuid(), 'Gustavo Fagundes Huff Quadrado', 'gustavo.quadrado@aluno.educaesteio.com.br', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, NOW(), '2010-05-18', '51 985670807', 'RUA GUIMARÃES ROSA, 189', '-', 'ESTEIO-RS', 'Branca', 'Homens cis', 'Ensino Fundamental (6º ao 9º ano)', 'Leitura na biblioteca, Levar livro', 'Novelas / Romances / Ficção, Terror / Suspense', NULL, '2025-08-28 16:08:44')
;

SELECT 'Parte 2 da importação concluída (50 leitores)! Execute import_readers_legacy_part3.sql para continuar.' as resultado;
