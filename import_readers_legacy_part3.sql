-- =============================================================================
-- IMPORTAÇÃO DE LEITORES DO SISTEMA ANTIGO - PARTE 3
-- =============================================================================
-- Execute após import_readers_legacy_part2.sql
-- =============================================================================

INSERT INTO users_profile (
    id, name, email, role, library_id, active, lgpd_consent, created_at,
    birth_date, phone, address_street, address_neighborhood, address_city,
    ethnicity, gender, education_level, interests, favorite_genres, suggestions, original_registration_date
) VALUES

-- 101. HADASSA DEMEHIGHI DE OLIVEIRA
(gen_random_uuid(), 'Hadassa Demehighi de Oliveira', 'reharte.kezia@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-08 15:25:29', '2010-08-07', '51994621238', 'RUA TAQUARA 723 OLIMPICA, ESTEIO', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Novelas / Romances / Ficção, Terror / Suspense, Teatro, Literatura fantástica, Literatura negra / Africana / Afro-brasileira', NULL, '2022-07-08 15:25:29'),

-- 102. Helen Cristine
(gen_random_uuid(), 'Helen Cristine', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-03-28 14:17:36', '1984-01-17', '996712222', 'Rua Roque Gonzales, 486', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Superior', 'Leitura na biblioteca, Levar livro', 'Informativo', NULL, '2023-03-28 14:17:36'),

-- 103. HELOÍSA DA COSTA RANGEL
(gen_random_uuid(), 'Heloísa da Costa Rangel', 'rosangelacostarangel@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-24 15:55:27', '2018-02-28', '51 981855718', 'RUA TRAVESSA ALVINA FRANCISCA, 495. JARDIM PLANALTO, ESTEIO-RS.', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro', 'LITERATURA INFANTIL', NULL, '2025-07-24 15:55:27'),

-- 104. HERBERT ANUSCA MOREIRA
(gen_random_uuid(), 'Herbert Anusca Moreira', 'herbertanusca177@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-07 15:57:56', '2008-08-12', '51980449627', 'Não identificado', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Fundamental (6º ao 9º ano)', 'Leitura na biblioteca', 'Terror / Suspense, Livros de HQ', NULL, '2022-07-07 15:57:56'),

-- 105. Iara da Silva Santos
(gen_random_uuid(), 'Iara da Silva Santos', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-03-15 14:22:23', '1965-08-14', NULL, 'Rua Lupicineo Rodrigues, 548, Santo Inácio, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Contos tradicionais, Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Livros de HQ, Literatura fantástica', NULL, '2023-03-15 14:22:23'),

-- 106. Ilda Roldão
(gen_random_uuid(), 'Ilda Roldão', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-08-16 15:07:18', '1959-10-17', '994131380', 'Rua Gilda de Abreu 662', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Romance espírita', NULL, '2023-08-16 15:07:18'),

-- 107. ILSE REBESCHINI FERNANDES
(gen_random_uuid(), 'Ilse Rebeschini Fernandes', 'ilserebeschini61@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-08-28 16:14:35', '1961-02-16', '51 991776568', 'RUA SÃO JORGE, 321', 'PARQUE PRIMAVERA', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Superior', 'Levar livro', 'Contos tradicionais, Poesia, Crônica, Literatura fantástica, Livro imagem, LITERATURA INFANTIL E LITERATURA INFANTOJUVENIL', NULL, '2025-08-28 16:14:35'),

-- 108. Indiara Rodrigues Feijó
(gen_random_uuid(), 'Indiara Rodrigues Feijó', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-03-29 13:26:02', '2001-02-23', '992957038', 'Av Porto Alegre 406', NULL, NULL, 'Preta', 'Mulheres cis', 'Ensino Médio', 'Levar livro, Participar de eventos, Voluntariado', 'Novelas / Romances / Ficção, Terror / Suspense, Literatura fantástica, Literatura negra / Africana / Afro-brasileira', NULL, '2023-03-29 13:26:02'),

-- 109. Isaac Rodrigues
(gen_random_uuid(), 'Isaac Rodrigues', 'isaac.saka.22@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-03 15:53:09', '2011-07-22', '51998121526', 'Rua Osvaldo Jesus Vieira, 142', 'Parque Primavera', 'Esteio-RS', 'Branca', 'Homens trans', 'Ensino Fundamental (6º ao 9º ano)', 'Participar de eventos, Voluntariado', 'Contos tradicionais, Livros de HQ, Informativo, Livro imagem', NULL, '2025-12-03 15:53:09'),

-- 110. ISABEL CRISTINA V RIBEIRO FAGUNDES
(gen_random_uuid(), 'Isabel Cristina V Ribeiro Fagundes', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-07 15:47:51', '2000-01-01', '51985983414', 'RUA ALDO LOCATELI 466, STO INACIO, ESTEIO', NULL, NULL, 'Não declarada', 'Mulheres cis', 'Sem escolaridade', 'Leitura na biblioteca, Levar livro', 'Romance espírita', NULL, '2022-07-07 15:47:51'),

-- 111. Isabela Reimann de Medeiros
(gen_random_uuid(), 'Isabela Reimann de Medeiros', 'isabelareimann09@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-21 14:50:31', '2014-04-09', '5191341860', 'Rua Boqueirão, 660. Bairro Jardim Planalto, Esteio-RS.', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro', 'Novelas / Romances / Ficção, Terror / Suspense, Romance espírita, Livro imagem, Literatura indígena', 'Pode ser mais espaçoso (mais aberto).', '2025-07-21 14:50:31'),

-- 112. ISABELLE OLIVEIRA EICH
(gen_random_uuid(), 'Isabelle Oliveira Eich', 'kikifeia138@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-08-28 16:28:43', '2012-07-23', '51 980720376', 'ESTRADA DO BOQUEIRÃO, 1093', 'JARDIM PLANALTO', 'ESTEIO-RS', 'Parda', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Leitura na biblioteca, Levar livro, Participar de eventos, Voluntariado', 'Poesia, Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Crônica, Informativo', NULL, '2025-08-28 16:28:43'),

-- 113. ISADORA DE AZEVEDO
(gen_random_uuid(), 'Isadora de Azevedo', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-22 16:08:52', '2018-09-05', '51 996550116', 'Rua Leopoldo Brentano, 107. Parque Santo Inácio. Esteio-RS', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Contos tradicionais, Poesia, Livros de HQ, Livro imagem, Literatura negra / Africana / Afro-brasileira, INFANTIL', NULL, '2025-07-22 16:08:52'),

-- 114. Isadora R. Maciel da Silva
(gen_random_uuid(), 'Isadora R. Maciel da Silva', 'marcelo.maciel163@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-01-24 16:34:25', '2013-10-01', '51998252558', 'Rua Beira Rio, 340 - Liberdade, Esteio', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Contos tradicionais, Poesia, Livros de HQ, Crônica, Teatro, Literatura fantástica, Romance espírita, Livro imagem, Literatura negra / Africana / Afro-brasileira, Literatura indígena', NULL, '2023-01-24 16:34:25'),

-- 115. Isis Lima da Silva
(gen_random_uuid(), 'Isis Lima da Silva', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-08 10:44:56', '2015-03-25', '92059403', 'Rua Cláudio Mascarelo, 76, Santo inácio', NULL, NULL, 'Amarela', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro, Participar de eventos, Voluntariado', 'Contos tradicionais', NULL, '2025-07-08 10:44:56'),

-- 116. IVANA BENINCA
(gen_random_uuid(), 'Ivana Beninca', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-07 15:13:51', '0149-11-21', '51998207678', 'AV PORTO ALEGRE 1416, JARDIM PLANALTO', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Superior', 'Levar livro', 'Informativo', NULL, '2022-07-07 15:13:51'),

-- 117. Jamille Elsem Leal dos Santos
(gen_random_uuid(), 'Jamille Elsem Leal dos Santos', 'jamille.leal24@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-03-16 11:35:49', '2002-02-21', '51994233717', 'Av. Boqueirão, 660, Casa 07 - Jardim Planalto, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Contos tradicionais, Livro imagem', NULL, '2022-03-16 11:35:49'),

-- 118. JEAN CARLOS GARCIA
(gen_random_uuid(), 'Jean Carlos Garcia', 'jcgaucho@yahoo.com.br', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-07 14:46:42', '1981-11-18', '51986879157', 'AV CASTRO ALVES 130 TAMANDARÉ ESTEIO', NULL, NULL, 'Branca', 'Homens cis', 'Pós-graduação Especialização', 'Leitura na biblioteca, Levar livro', 'Novelas / Romances / Ficção, Terror / Suspense', NULL, '2022-07-07 14:46:42'),

-- 119. JOÃO ANTONIO WERNER DE LIMA
(gen_random_uuid(), 'João Antonio Werner de Lima', 'jadowerne@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-09-18 15:51:33', '2013-04-06', '51 98019802', 'ESTRADA DO BOQUEIRÃO, 219', 'JARDIM PLANALTO', 'ESTEIO-RS', 'Branca', 'Homens cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Poesia, Literatura negra / Africana / Afro-brasileira, UMBANDA, QUIMBANDA, EXU, CLÁSSICOS', NULL, '2025-09-18 15:51:33'),

-- 120. João Porto da Cruz Trajano
(gen_random_uuid(), 'João Porto da Cruz Trajano', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-02 13:52:24', '2016-08-17', '51 985059561', 'Rua Padre Balduíno Rambo, 48', 'Parque Santo Inácio', 'Esteio-RS', 'Branca', 'Homens cis', 'Educação Infantil', 'Levar livro', 'Contos contemporâneos', NULL, '2025-12-02 13:52:24'),

-- 121. João Victor Garcia Lopes
(gen_random_uuid(), 'João Victor Garcia Lopes', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-20 13:29:08', '2011-06-01', '51985122368', 'Rua Dr Miguel Vieira Ferreira, 259, santo inácio, esteio', NULL, NULL, 'Amarela', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Contos contemporâneos', NULL, '2022-07-20 13:29:08'),

-- 122. João Vitor Rodrigues Alvez
(gen_random_uuid(), 'João Vitor Rodrigues Alvez', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-11-21 16:26:21', '2011-01-15', '981334177', 'TRAVESSA AVINA FRANCISCA, 602 JARDIM PLANALTO', NULL, NULL, 'Parda', 'Homens cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Contos contemporâneos, Livros de HQ, Literatura fantástica, Livro imagem', NULL, '2023-11-21 16:26:21'),

-- 123. Jônatan S.
(gen_random_uuid(), 'Jônatan S.', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2024-09-30 10:03:46', '2007-02-05', NULL, 'Rua Aldo locateli, 404', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro', 'Contos tradicionais, Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Crônica, Teatro, Literatura fantástica, Informativo, Romance espírita, Livro imagem, Literatura negra / Africana / Afro-brasileira, Literatura indígena, Literatura marginal e / ou periférica', 'Aulas de xadrez, ou apenas jogos casuais', '2024-09-30 10:03:46'),

-- 124. Jorge Lois Lopes Junior
(gen_random_uuid(), 'Jorge Lois Lopes Junior', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-26 17:58:44', '2006-06-08', '51 985122368', 'Dr Miguel Vieira Ferreira 259', NULL, NULL, 'Amarela', 'Homens cis', 'Ensino Médio', 'Leitura na biblioteca, Levar livro, Participar de eventos, Voluntariado', 'Contos contemporâneos', NULL, '2022-07-26 17:58:44'),

-- 125. José Gorete Coelho
(gen_random_uuid(), 'José Gorete Coelho', 'coelhojgg71@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-05-23 12:01:21', '1954-01-02', '51997168761', 'Rua Viterbo José Machado, 74 - Jardim Planalto, Esteio/RS', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Médio', 'Levar livro', 'Contos tradicionais, Novelas / Romances / Ficção, Literatura indígena', NULL, '2022-05-23 12:01:21'),

-- 126. JOSÉ MAURO S. DE SOUZA
(gen_random_uuid(), 'José Mauro S. de Souza', 'zemauromt@hotmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-09-17 15:41:56', '1963-08-22', '51 994120718', 'RUA MACHADO DE ASSIS, 50', 'VILA OLÍMPICA', 'ESTEIO-RS', 'Parda', 'Homens cis', 'Ensino Superior', 'Levar livro, Participar de eventos', 'Contos contemporâneos, Poesia, Literatura fantástica, Literatura marginal e / ou periférica', NULL, '2025-09-17 15:41:56'),

-- 127. Josiane Justo Conceição
(gen_random_uuid(), 'Josiane Justo Conceição', 'josij81@hotmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-03-16 11:34:15', '1981-01-30', '51997330157', 'Rua Irmã Gema Brum, 59 - Parque Amador, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Pós-graduação Especialização', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Contos tradicionais, Contos contemporâneos, Poesia, Romance espírita, Literatura negra / Africana / Afro-brasileira, Literatura indígena, Literatura marginal e / ou periférica', NULL, '2022-03-16 11:34:15'),

-- 128. JULIANA DOS SANTOS PRESTES
(gen_random_uuid(), 'Juliana dos Santos Prestes', 'juliana1929prestes@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-10-21 14:03:39', '2009-06-13', '51 97431113', 'RUA LUIZ CARLOS M. NUNES, 209', 'PARQUE SANTO INÁCIO', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Literatura fantástica, Livro imagem', NULL, '2025-10-21 14:03:39'),

-- 129. Juliano Firpo
(gen_random_uuid(), 'Juliano Firpo', 'juliano.firpo@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-05-23 12:07:18', '1986-01-02', '51993110212', 'Rua Galvão de Oliveira Loureiro, 36, Casa C - Vila Olímpica, Esteio/RS', NULL, NULL, 'Preta', 'Homens cis', 'Ensino Superior', 'Levar livro', 'Livros de HQ, Literatura fantástica', NULL, '2022-05-23 12:07:18'),

-- 130. JULIE SIMA DA SILVA
(gen_random_uuid(), 'Julie Sima da Silva', 'webprobrasil@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-22 15:52:09', '2014-08-12', '51 986226288', 'RUA OTÁVIO SILVEIRA BORGES, 862, VILA OLÍMPICA. ESTEIO-RS', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'LITERATURA JUVENIL E LITERATURA INFANTOJUVENIL', 'PROCURA LIVRO AMOR GELATO.', '2025-07-22 15:52:09'),

-- 131. Jussiane de Oliveira Marques Vargas
(gen_random_uuid(), 'Jussiane de Oliveira Marques Vargas', 'jussianevargas1101@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-22 14:23:59', '1977-01-11', '51 933803934', 'Rua Claudio Zonta, 14, Jardim Planalto, Esteio-RS.', NULL, NULL, 'Preta', 'Mulheres cis', 'Pós-graduação Especialização', 'Levar livro, Participar de eventos, Voluntariado', 'Contos tradicionais, Contos contemporâneos, Novelas / Romances / Ficção, Terror / Suspense, Crônica, Livro imagem, Literatura negra / Africana / Afro-brasileira, Literatura indígena, Literatura marginal e / ou periférica', 'Sugestão de livros voltados ao Serviço Social. Interesse em associar-se na Associação da Biblioteca Circular.', '2025-07-22 14:23:59'),

-- 132. KALLYANNY MYKAELLY FERREIRA DIAS
(gen_random_uuid(), 'Kallyanny Mykaelly Ferreira Dias', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-24 15:51:18', '2014-01-14', '51 997357544', 'AV JOÃO FRAINER, BECO 3, Nº 48 (ENDEREÇO DA VIZINHA ESTER DE SOUZA MARQUES)', NULL, NULL, 'Preta', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Leitura na biblioteca, Levar livro', 'Livros de HQ', NULL, '2025-07-24 15:51:18'),

-- 133. KAMILLY VITÓRIA DE SOUZA PEREIRA DANI
(gen_random_uuid(), 'Kamilly Vitória de Souza Pereira Dani', 'daniviviane783@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-08-04 15:22:16', '2015-02-09', '51 990029516', 'RUA VITERBO JOSÉ MACHADO, 208.', 'JARDIM PLANALTO', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Poesia, Novelas / Romances / Ficção, Literatura fantástica, Livro imagem', NULL, '2025-08-04 15:22:16'),

-- 134. Kauã Rodrigues de Oliveira
(gen_random_uuid(), 'Kauã Rodrigues de Oliveira', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-06-14 13:47:04', '2013-03-27', '995194120', 'Av Porto Alegre, 406', NULL, NULL, 'Parda', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Literatura fantástica, Livro imagem', NULL, '2023-06-14 13:47:04'),

-- 135. Kauany Martins
(gen_random_uuid(), 'Kauany Martins', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2021-12-10 15:15:21', '2007-04-17', '96250023', 'Travessa Alvina Francisca, 90 - Jardim Planalto, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Leitura na biblioteca, Levar livro', 'Terror / Suspense, Romance espírita', NULL, '2021-12-10 15:15:21'),

-- 136. KETHLEEN CARVALHO QUINTANA
(gen_random_uuid(), 'Kethleen Carvalho Quintana', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-22 16:16:22', '1995-08-22', '51 981558801', 'RUA ALVARENGA PEIXOTO, 65. JARDIM PLANALTO, ESTEIO-RS.', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Novelas / Romances / Ficção, Romance espírita', NULL, '2025-07-22 16:16:22'),

-- 137. KEYLIS LOPEZ
(gen_random_uuid(), 'Keylis Lopez', 'keylissalazar@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-22 15:57:49', '2002-09-03', '51 990199375', 'RUA CALÇADÃO NORTE, 534, PARQUE PRIMAVERA. ESTEIO-RS.', NULL, NULL, 'Venezuelana', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Livro imagem, Livro infantil, Livro evangélico', NULL, '2025-07-22 15:57:49'),

-- 138. Kimberly Rodrigues
(gen_random_uuid(), 'Kimberly Rodrigues', 'kumberlyalupo@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-12-13 13:37:02', '1996-02-26', '984888037', 'Rua Pedro Lerbach, 69, Centro, Esteio', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Superior', 'Levar livro', 'Novelas / Romances / Ficção, Crônica, Teatro, Romance espírita, Literatura negra / Africana / Afro-brasileira', NULL, '2023-12-13 13:37:02'),

-- 139. KLEBERSON COUTO
(gen_random_uuid(), 'Kleberson Couto', 'klebersoncouto9@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-24 15:29:11', '2008-12-14', '51995830876', 'RUA 8 DE MARÇO, 470. BAIRRO PARQUE PRIMAVERA, ESTEIO-RS.', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Médio', 'Leitura na biblioteca, Levar livro', 'Novelas / Romances / Ficção, Terror / Suspense', 'MAIS LITERATURA CLÁSSICA!', '2025-07-24 15:29:11'),

-- 140. LAURA GUIMARÃES
(gen_random_uuid(), 'Laura Guimarães', 'brunaduda@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-07 15:01:41', '2008-07-09', '51991830189', 'Estrada do Boqueirão', NULL, NULL, 'Preta', 'Não-binárie', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Terror / Suspense, Crônica', NULL, '2022-07-07 15:01:41'),

-- 141. LAURA SILVA DE CAMPOS FREITAS
(gen_random_uuid(), 'Laura Silva de Campos Freitas', 'marialuiza.campos@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-09-17 16:14:40', '2025-01-04', '51 996921996', 'RUA JARDEL FILHO, 223', 'PARQUE SANTO INÁCIO', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Educação Infantil', 'Leitura na biblioteca, Levar livro', 'Livro imagem, LITERATURA INFANTIL', NULL, '2025-09-17 16:14:40'),

-- 142. Lauren Padilha Alves
(gen_random_uuid(), 'Lauren Padilha Alves', 'laurepadyalves@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-01-20 16:52:50', '2011-02-19', NULL, 'Rua Cláudio Manoel da Costa, 118 - Jardim Planalto, Esteio', NULL, NULL, 'Preta', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Poesia, Literatura negra / Africana / Afro-brasileira', NULL, '2022-01-20 16:52:50'),

-- 143. Leonardo Patrick do Amaral Salazar
(gen_random_uuid(), 'Leonardo Patrick do Amaral Salazar', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-05-23 11:59:06', '2002-08-14', '5198338021', 'Calçadão Norte, 23 - Primavera, Esteio/RS', NULL, NULL, 'Preta', 'Homens cis', 'Ensino Médio', 'Leitura na biblioteca, Levar livro', 'Novelas / Romances / Ficção', NULL, '2022-05-23 11:59:06'),

-- 144. LETICIA MORAES
(gen_random_uuid(), 'Leticia Moraes', 'leticiadgoes3@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-07 15:25:09', '1995-12-30', '51980301116', 'Estrada do Boqueirão 800, bloco 10, apto 1053, esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Contos tradicionais', NULL, '2022-07-07 15:25:09'),

-- 145. LETÍCIA TATIELE FREITAS DE OLIVEIRA
(gen_random_uuid(), 'Letícia Tatiele Freitas de Oliveira', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-24 15:38:52', '1998-10-25', '51 981666661', 'RUA CALÇADÃO NORTE, 410. PARQUE PRIMAVERA, ESTEIO-RS.', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Novelas / Romances / Ficção, Terror / Suspense', NULL, '2025-07-24 15:38:52'),

-- 146. Lilian Catiéli Chitolina
(gen_random_uuid(), 'Lilian Catiéli Chitolina', 'lilian182@hotmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-09-19 13:44:23', '1990-05-02', '982266439', 'Rua Guananás, 58, Ouro Branco, Novo Hamburgo', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Superior', 'Levar livro', 'Contos contemporâneos, Novelas / Romances / Ficção, Terror / Suspense, Crônica, Literatura fantástica, Informativo', NULL, '2023-09-19 13:44:23'),

-- 147. LOÍDES TREVISAN RUKHABER
(gen_random_uuid(), 'Loídes Trevisan Rukhaber', 'loidestrevisan13@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-24 15:33:22', '1969-06-13', '51 992175692', 'AV. JOÃO PAULO I, 31. PARQUE SANTO INÁCIO, ESTEIO-RS.', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Poesia, Novelas / Romances / Ficção, Livros de HQ, Romance espírita', NULL, '2025-07-24 15:33:22'),

-- 148. LORENZO BORBA MUNIZ
(gen_random_uuid(), 'Lorenzo Borba Muniz', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-09-25 16:30:19', '2016-12-30', '51 996902556', 'RUA DOS PIONEIROS, 69', 'PARQUE SANTO INÁCIO', 'ESTEIO-RS', 'Branca', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Contos tradicionais, Informativo, LITERATURA INFANTIL', NULL, '2025-09-25 16:30:19'),

-- 149. LORENZO FERREIRA DA SILVA
(gen_random_uuid(), 'Lorenzo Ferreira da Silva', 'ferreiralaine735@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-22 14:29:42', '2014-05-03', NULL, 'Av Porto Alegre, 595, Jardim Planalto, Esteio-RS', NULL, NULL, 'Preta', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Terror / Suspense, Literatura negra / Africana / Afro-brasileira', NULL, '2025-07-22 14:29:42'),

-- 150. LOURDES TEREZINHA DA CONCEIÇÃO
(gen_random_uuid(), 'Lourdes Terezinha da Conceição', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-07 15:40:31', '1961-05-09', '51995404589', 'RUA TAQUARA 620, OLIMPICA, ESTEIO', NULL, NULL, 'Preta', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Novelas / Romances / Ficção, Informativo, Literatura negra / Africana / Afro-brasileira', NULL, '2022-07-07 15:40:31')
;

SELECT 'Parte 3 da importação concluída (50 leitores)! Execute import_readers_legacy_part4.sql para continuar.' as resultado;
