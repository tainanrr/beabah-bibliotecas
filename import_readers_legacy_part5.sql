-- =============================================================================
-- IMPORTAÇÃO DE LEITORES DO SISTEMA ANTIGO - PARTE 5 (FINAL)
-- =============================================================================
-- Execute após import_readers_legacy_part4.sql
-- =============================================================================

INSERT INTO users_profile (
    id, name, email, role, library_id, active, lgpd_consent, created_at,
    birth_date, phone, address_street, address_neighborhood, address_city,
    ethnicity, gender, education_level, interests, favorite_genres, suggestions, original_registration_date
) VALUES

-- 201. Rafaela Bitencourt
(gen_random_uuid(), 'Rafaela Bitencourt', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-01-18 13:14:15', '2012-07-08', '997166793', 'Rua 28 de Fevereiro, 281 - Parque Amador, Esteio', NULL, NULL, 'Preta', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Novelas / Romances / Ficção, Livro imagem, Literatura negra / Africana / Afro-brasileira, Literatura indígena, Literatura marginal e / ou periférica', NULL, '2022-01-18 13:14:15'),

-- 202. Raffael Lucca Rocha Pereira
(gen_random_uuid(), 'Raffael Lucca Rocha Pereira', 'dieniffer.pinheiro@yahoo.com.br', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-08 10:00:50', '2015-03-07', '996591901', 'Av Luiz Pasteur, 5552', NULL, NULL, 'Amarela', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro', 'Contos tradicionais, Livros de HQ', NULL, '2025-07-08 10:00:50'),

-- 203. Rebecca M. D. Cunha
(gen_random_uuid(), 'Rebecca M. D. Cunha', 'rebeca.dantas@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-12-13 16:52:38', '1982-09-23', '51 99227447', 'Rua Venâncio Aires, 45 Parque Amador', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Superior', 'Levar livro, Participar de eventos', 'Contos tradicionais, Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Literatura fantástica', NULL, '2022-12-13 16:52:38'),

-- 204. Renan Alves Porto
(gen_random_uuid(), 'Renan Alves Porto', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-04-27 11:07:49', '2008-11-02', '982902100', 'Travessa Alvina Francisca, 161 - Jardim Planalto, Esteio', NULL, NULL, 'Parda', 'Homens cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Livros de HQ', NULL, '2022-04-27 11:07:49'),

-- 205. Roberta Dias Feijó
(gen_random_uuid(), 'Roberta Dias Feijó', 'rooberta@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-03-15 14:29:52', '1978-06-19', '984729031', 'Rua Guarani, 23, são josé, esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Superior', 'Leitura na biblioteca, Levar livro', 'Novelas / Romances / Ficção, Terror / Suspense, Crônica, Informativo, Romance espírita', NULL, '2023-03-15 14:29:52'),

-- 206. Rodrigo Ávila Colla
(gen_random_uuid(), 'Rodrigo Ávila Colla', 'rodrigo.a.colla@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-08-04 17:32:50', '1983-05-18', '51983238986', 'Rua Otávio Silveira Borges, 46 (202) - Vila Olímpica, Esteio', NULL, NULL, 'Branca', 'Homens cis', 'Doutorado', 'Leitura na biblioteca, Levar livro, Participar de eventos, Voluntariado', 'Contos tradicionais, Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Crônica, Literatura indígena, Literatura marginal e / ou periférica', NULL, '2022-08-04 17:32:50'),

-- 207. RODRIGO BARBOSA CASTRO
(gen_random_uuid(), 'Rodrigo Barbosa Castro', 'rodrigo.mkc@hotmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-22 15:45:29', '1992-09-01', '51 992909841', 'RUA PAULO COUTO, 340. BAIRRO IPIRANGA, SAPUCAIA DO SUL.', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Médio', 'Leitura na biblioteca, Levar livro', 'Contos tradicionais, Poesia, Teatro', 'PAI DA ANALÚ CASTRO.', '2025-07-22 15:45:29'),

-- 208. RODRIGO DA ROSA MACEDO
(gen_random_uuid(), 'Rodrigo da Rosa Macedo', 'kellyvanesaormislc@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-22 14:26:52', '2014-04-29', '51 992036342', 'Rua Alvina Francisca, 230. Jardim Planalto, Esteio-RS.', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro', 'Contos tradicionais, Terror / Suspense, Livros de HQ, Crônica, Literatura fantástica, Livro imagem', NULL, '2025-07-22 14:26:52'),

-- 209. ROSANGELA DA COSTA
(gen_random_uuid(), 'Rosangela da Costa', 'rosangelacostarangel@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-24 15:53:09', '1981-03-21', '51 981855718', 'RUA TRAVESSA ALVINA FRANCISCA, 495. JARDIM PLANALTO, ESTEIO-RS.', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Poesia, Novelas / Romances / Ficção, Terror / Suspense', NULL, '2025-07-24 15:53:09'),

-- 210. ROSANGELA FERNANDES
(gen_random_uuid(), 'Rosangela Fernandes', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-07 15:54:53', '1955-12-11', '51996924175', 'RUA SANTANA 486 OLIMPICA ESTEIO', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Romance espírita', NULL, '2022-07-07 15:54:53'),

-- 211. Rosiane de A. Lima
(gen_random_uuid(), 'Rosiane de A. Lima', 'rosianelima2604@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-08-04 13:18:42', '1976-10-17', '51997237608', 'Rua Romualdo Marchis, 253, santo inácio, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Contos tradicionais, Poesia, Livros de HQ, Informativo, Romance espírita', NULL, '2022-08-04 13:18:42'),

-- 212. Rosilene Schneider Herbes
(gen_random_uuid(), 'Rosilene Schneider Herbes', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-12-05 15:30:39', '1987-05-02', '985159505', 'Rua Santo Antônio, 121, centro Esteio', NULL, NULL, 'Amarela', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Leitura na biblioteca, Levar livro', 'Contos tradicionais, Poesia, Novelas / Romances / Ficção, Terror / Suspense, Crônica, Literatura fantástica, Romance espírita', NULL, '2023-12-05 15:30:39'),

-- 213. Ryan Feijó
(gen_random_uuid(), 'Ryan Feijó', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-04-11 13:51:38', '2009-01-01', '992957038', 'Av Porto Alegre, 406 Jardim Planalto', NULL, NULL, 'Preta', 'Homens cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro, Participar de eventos', 'Terror / Suspense', NULL, '2023-04-11 13:51:38'),

-- 214. Sabrina Thais Moreira
(gen_random_uuid(), 'Sabrina Thais Moreira', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-01-13 13:08:23', '2003-06-29', '998272565', 'Av. Padre Urbano Thiesen, 47 - Santo Inácio, Esteio', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Poesia, Terror / Suspense, Romance espírita', NULL, '2022-01-13 13:08:23'),

-- 215. Samuel Marques Vargas
(gen_random_uuid(), 'Samuel Marques Vargas', 'jussianevargas1101@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-21 15:00:38', '2012-08-30', '51933803934', 'Rua Claudio Zonta, 114. Jardim Planalto, Esteio.', NULL, NULL, 'Preta', 'Homens cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Contos tradicionais, Terror / Suspense, Livro imagem, Literatura negra / Africana / Afro-brasileira, Literatura marginal e / ou periférica', 'Livros sobre judô.', '2025-07-21 15:00:38'),

-- 216. Sarah Yasmin Frós Rick
(gen_random_uuid(), 'Sarah Yasmin Frós Rick', 'sarahrick666@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-02 13:57:16', '2012-08-22', '51 81479846', 'Rua Roque Gonzales, 551', 'Parque Santo Inácio', 'Esteio-RS', 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Terror / Suspense, Crônica, Teatro', NULL, '2025-12-02 13:57:16'),

-- 217. Shirlene Barros Beckman
(gen_random_uuid(), 'Shirlene Barros Beckman', 'shrilenebeckman@hotmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-02-15 14:41:59', '1991-02-24', '991039919', 'Rua Borges de Medeiros, 71 - Jardim Planalto, Esteio', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Superior', 'Levar livro', 'Contos tradicionais, Contos contemporâneos, Poesia', NULL, '2022-02-15 14:41:59'),

-- 218. Sidnei Da Silva Adornes
(gen_random_uuid(), 'Sidnei Da Silva Adornes', 'sidnei.adornes@outlook.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-10-20 17:07:22', '1964-05-07', '51 996873525', 'Rua Otavio Silveira Borges, 635, Vila Olimpica, Esteio', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Superior', 'Levar livro', 'Contos tradicionais, Poesia, Crônica, Romance espírita, Literatura negra / Africana / Afro-brasileira, Literatura indígena', NULL, '2022-10-20 17:07:22'),

-- 219. Silvia Linck
(gen_random_uuid(), 'Silvia Linck', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2021-12-22 11:45:01', '1958-12-09', '92478024', 'Av. Luis Pasteur, 4970 - Valderez, Sapucaia do Sul', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Leitura na biblioteca, Levar livro', 'Novelas / Romances / Ficção, Informativo', NULL, '2021-12-22 11:45:01'),

-- 220. Silvia Regina Doroteia Francine
(gen_random_uuid(), 'Silvia Regina Doroteia Francine', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-01-13 13:07:17', '1974-06-05', '998272565', 'Av. Padre Urbano Thiesen, 47 - Santo Inácio, Esteio', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca', 'Poesia, Informativo, Literatura negra / Africana / Afro-brasileira', NULL, '2022-01-13 13:07:17'),

-- 221. Silvia Regina Moreira
(gen_random_uuid(), 'Silvia Regina Moreira', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-01-13 13:13:34', '1974-06-05', '998272565', 'Av. Padre Urbano Thiesen, 47 - Santo Inácio, Esteio', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro', 'Poesia, Informativo, Literatura negra / Africana / Afro-brasileira', NULL, '2022-01-13 13:13:34'),

-- 222. Simone da Silva J. Matias
(gen_random_uuid(), 'Simone da Silva J. Matias', 'simone.jacobi@hotmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-03-15 14:34:41', '1972-10-16', '991291819', 'Rua Roque Gonzales 606, santo inácio, esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Romance espírita', NULL, '2023-03-15 14:34:41'),

-- 223. Simone Nunes
(gen_random_uuid(), 'Simone Nunes', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-03-22 17:24:03', '1967-11-05', '51996967241', 'Estrada do Boqueirão, 800, Ap 1742, Bloco 17 - Jardim Planalto, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Literatura fantástica', NULL, '2022-03-22 17:24:03'),

-- 224. Simone Oliveira
(gen_random_uuid(), 'Simone Oliveira', 'simoneoliveira@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-03-03 13:29:03', '1985-02-28', '989612140', 'Rua Alvina Francisca, 405 - Jardim Planalto, Esteio', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Textos bíblicos', NULL, '2022-03-03 13:29:03'),

-- 225. Sofia Tessler de Souza
(gen_random_uuid(), 'Sofia Tessler de Souza', 'sofia.tessler@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-02-22 16:18:53', '1993-07-01', '996504332', 'Rua Fernandes Vieira, 474/32 - Bom Fim, Porto Alegre', NULL, NULL, 'Branca', 'Mulheres cis', 'Mestrado', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Crônica, Livro imagem, Literatura negra / Africana / Afro-brasileira, Literatura indígena, Literatura marginal e / ou periférica', NULL, '2022-02-22 16:18:53'),

-- 226. SOLANGE DA SILVEIRA RAMOS
(gen_random_uuid(), 'Solange da Silveira Ramos', 'solangesilveira609@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-09-17 15:36:15', '1979-11-23', '51 997906968', 'RUA OSVALDO JESUS VIEIRA, 117.', 'PARQUE PRIMAVERA', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Médio', 'Leitura na biblioteca, Levar livro', 'Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Terror / Suspense, Crônica, Informativo', 'Revistas sobre beleza, nutrição, cultura, cultivo de plantas...', '2025-09-17 15:36:15'),

-- 227. SONIA WELTER FECK
(gen_random_uuid(), 'Sonia Welter Feck', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-24 15:31:05', '1959-01-03', '51 998042587', 'RUA PE SEBASTIÃO PACHECO, 294. JARDIM PLANALTO, ESTEIO-RS.', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro, Participar de eventos', 'Novelas / Romances / Ficção, Teatro, Romance espírita', NULL, '2025-07-24 15:31:05'),

-- 228. Sophia Eloise Lacerda Scislewiski
(gen_random_uuid(), 'Sophia Eloise Lacerda Scislewiski', 'lacerdabeatriz552@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-02 14:16:06', '2012-12-27', '51 989703619', 'Rua Cristo Rei, 79', 'Parque Santo Inácio', 'Esteio-RS', 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Leitura na biblioteca, Levar livro', 'Contos tradicionais, Novelas / Romances / Ficção, Livros de HQ, Literatura fantástica, Informativo, Livro imagem', NULL, '2025-12-02 14:16:06'),

-- 229. Sophia N. de Freitas Wisnienski
(gen_random_uuid(), 'Sophia N. de Freitas Wisnienski', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-03 15:48:43', '2014-09-27', '51 981308019', 'Rua Casuerina, 306', 'Parque Primavera', 'Esteio-RS', 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Leitura na biblioteca, Levar livro, Participar de eventos, Voluntariado', 'Novelas / Romances / Ficção, Literatura fantástica', 'Observação da biblioteca: ajustar preenchimento dos dados, letra ilegível.', '2025-12-03 15:48:43'),

-- 230. Stefany Regina Francisco Ferreira
(gen_random_uuid(), 'Stefany Regina Francisco Ferreira', 'stefanyfrancisco958@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-01-27 17:04:23', '1998-12-28', '989572565', 'Av. Padre Urbâno Thiesen, 47 - Santo Inácio, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Romance espírita', NULL, '2022-01-27 17:04:23'),

-- 231. STEPHANIE DA SILVA BRAUN
(gen_random_uuid(), 'Stephanie da Silva Braun', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-11-25 14:56:58', '2007-07-17', '51 95011344', 'RUA SANTO AUGUSTO', 'BOA VISTA', 'SAPUCAIA DO SUL-RS', 'Parda', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Terror / Suspense', NULL, '2025-11-25 14:56:58'),

-- 232. Sueda Terezinha
(gen_random_uuid(), 'Sueda Terezinha', 'suedaterezinha@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2024-08-12 10:38:42', '1954-03-06', '992277988', 'Rua Allan Kerdec, 79', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Contos tradicionais, Romance espírita, Literatura negra / Africana / Afro-brasileira', NULL, '2024-08-12 10:38:42'),

-- 233. TAINÁ DANDARA HOFMANN ESTIVALET
(gen_random_uuid(), 'Tainá Dandara Hofmann Estivalet', 'angelaclaraluz@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-08-04 15:17:18', '2015-05-28', '51 999325230', 'RUA DOS FERROVIÁRIOS, 363/402', 'CENTRO', 'ESTEIO-RS', 'Preta', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro', 'Contos tradicionais, Contos contemporâneos, Terror / Suspense, Literatura fantástica, Livro imagem', NULL, '2025-08-04 15:17:18'),

-- 234. TAINÁ RODRIGUES ALDERETTE
(gen_random_uuid(), 'Tainá Rodrigues Alderette', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-26 14:05:48', '1986-06-16', '51981101607', 'RUA LUIS CARLOS MORETTI NUNES, 197, SANTO INÁCIO, ESTEIO', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Poesia, Crônica, Teatro, Livro imagem', NULL, '2022-07-26 14:05:48'),

-- 235. Tainan Ramos Rodrigues
(gen_random_uuid(), 'Tainan Ramos Rodrigues', 'tainanramosrodrigues@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2024-04-13 16:18:33', '1996-06-14', '55 999511009', 'Rua Benjamin Constant, 389, Rio Branco, Novo Hamburgo, RS', NULL, NULL, 'Branca', 'Homens cis', 'Pós-graduação Especialização', 'Leitura na biblioteca, Levar livro, Participar de eventos, Voluntariado', 'Novelas / Romances / Ficção, Romance espírita, Literatura marginal e / ou periférica', NULL, '2024-04-13 16:18:33'),

-- 236. TAÍS FERNANDA DEWES
(gen_random_uuid(), 'Taís Fernanda Dewes', 'taisdewes@yahoo.com.br', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-09-03 14:32:14', '1981-05-09', '51 983257052', 'AV. PADRE CLARET, 208', 'CENTRO', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Superior', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'LITERATURA INFANTOJUVENIL', NULL, '2025-09-03 14:32:14'),

-- 237. Tamires Janaína Rodrigues Feijó
(gen_random_uuid(), 'Tamires Janaína Rodrigues Feijó', 'janainatamires155@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-03-29 13:19:02', '1990-08-18', '994850810', 'Av Porto Alegre, 406', NULL, NULL, 'Preta', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro, Participar de eventos, Voluntariado', 'Contos tradicionais, Contos contemporâneos, Terror / Suspense, Crônica, Literatura fantástica, Romance espírita, Literatura negra / Africana / Afro-brasileira, Literatura indígena, Literatura marginal e / ou periférica', NULL, '2023-03-29 13:19:02'),

-- 238. Tanise Rodrigues Moreira
(gen_random_uuid(), 'Tanise Rodrigues Moreira', 'tanisemoreira26@hotmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-09-15 16:03:00', '1993-12-26', '51 997313351', 'Rua 24 de agosto 2569', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro, Participar de eventos', 'Contos tradicionais, Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Crônica, Teatro, Literatura fantástica, Livro imagem, Literatura indígena', NULL, '2022-09-15 16:03:00'),

-- 239. TATIELE DA SILVEIRA FERRAZ
(gen_random_uuid(), 'Tatiele da Silveira Ferraz', 'tatiele031204@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-08-04 14:55:48', '2004-12-03', '51 999607712', 'RUA FLORIANO MAIA D''ÁVILA, 510', 'JARDIM PLANALTO', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Poesia, Terror / Suspense, Romance espírita', NULL, '2025-08-04 14:55:48'),

-- 240. Thaiane Vitória Aguiar da Silva
(gen_random_uuid(), 'Thaiane Vitória Aguiar da Silva', 'aguiarthaiane81@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-02 14:08:22', '2006-09-05', '51 989016523', 'Travessa 50, 41', 'Parque Primavera', 'Esteio-RS', 'Parda', 'Mulheres cis', 'Ensino Médio', 'Leitura na biblioteca, Levar livro', 'Poesia, Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Literatura fantástica, Romance espírita, Literatura negra / Africana / Afro-brasileira', NULL, '2025-12-02 14:08:22'),

-- 241. Thiago Souza
(gen_random_uuid(), 'Thiago Souza', 'thiagosouzaborge@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-01-27 14:35:39', '1999-10-06', NULL, 'Rua 1ª de Março, 320 - Primavera, Esteio', NULL, NULL, 'Preta', 'Não-binárie', 'Ensino Médio', 'Levar livro', 'Literatura negra / Africana / Afro-brasileira', NULL, '2022-01-27 14:35:39'),

-- 242. Valderez Rodrigues
(gen_random_uuid(), 'Valderez Rodrigues', 'valferre2004@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2021-12-10 15:10:29', '1964-04-04', '995865725', 'Rua Charrua, 176 (Ap. 103) - Parque Amador, Esteio', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Superior', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Contos contemporâneos, Poesia, Terror / Suspense, Crônica, Literatura fantástica, Literatura negra / Africana / Afro-brasileira', NULL, '2021-12-10 15:10:29'),

-- 243. Valentina Padilha Alves
(gen_random_uuid(), 'Valentina Padilha Alves', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-01-20 16:51:31', '2012-07-24', NULL, 'Rua Cláudio Manoel da Costa, 118 - Jardim Planalto, Esteio', NULL, NULL, 'Preta', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca', 'Teatro', NULL, '2022-01-20 16:51:31'),

-- 244. VANI SOARES
(gen_random_uuid(), 'Vani Soares', 'vaniromildo@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-11-25 15:01:04', '1969-11-14', '51 983405823', 'RUA GERALDO JOSÉ DE ALMEIDA, 40', 'PARQUE PRIMAVERA', 'ESTEIO-RS', 'Preta', 'Mulheres cis', 'Ensino Superior', 'Levar livro', 'Poesia, Romance espírita, Livro imagem, Literatura negra / Africana / Afro-brasileira', NULL, '2025-11-25 15:01:04'),

-- 245. VERA LÚCIA DE FREITAS GALLE
(gen_random_uuid(), 'Vera Lúcia de Freitas Galle', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-24 15:34:51', '1963-09-07', '51 984428047', 'RUA HÉLIO ARNOLDO SPERB, 51. JARDIM PLANALTO, ESTEIO-RS.', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Novelas / Romances / Ficção, Romance espírita', NULL, '2025-07-24 15:34:51'),

-- 246. VICTOR ALEXANDRE BRANDÃO
(gen_random_uuid(), 'Victor Alexandre Brandão', 'victorgutinhodemorango@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-12 13:42:53', '2005-12-26', '51989248887', 'Av POA, 540, JARDIM PLANALTO, ESTEIO', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Médio', 'Leitura na biblioteca, Levar livro', 'Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Crônica, Informativo', NULL, '2022-07-12 13:42:53'),

-- 247. VICTOR DAVI OLIVEIRA FALEIRO
(gen_random_uuid(), 'Victor Davi Oliveira Faleiro', 'victordavi1590@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-07 14:52:37', '2010-01-25', '51985093471', 'Estrada do Boqueirão 800 Parque Primavera Esteio', NULL, NULL, 'Branca', 'Não-binárie', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Crônica', NULL, '2022-07-07 14:52:37'),

-- 248. VITÓRIA CAROLINE VAZ RAMOS
(gen_random_uuid(), 'Vitória Caroline Vaz Ramos', 'ramosviih22@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-24 15:49:08', '1997-07-17', '51 981486416', 'RUA CALÇADÃO SUL, 219. PARQUE PRIMAVERA, ESTEIO-RS.', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro, Participar de eventos', 'Contos tradicionais, Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Romance espírita', NULL, '2025-07-24 15:49:08'),

-- 249. VITÓRIA MARIANA DA SILVA BARBOZA
(gen_random_uuid(), 'Vitória Mariana da Silva Barboza', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-11-25 14:58:43', '2008-06-19', '51 92188395', 'RUA ALVINA FRANCISCA, 117', 'JARDIM PLANALTO', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Literatura marginal e / ou periférica', NULL, '2025-11-25 14:58:43'),

-- 250. Vitória Souto de Moraes
(gen_random_uuid(), 'Vitória Souto de Moraes', 'vitoria.soutodm@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-01-26 15:03:40', '2002-10-03', '51 989245533', 'Rua Claudio Manoel da Costa, 283 - Jardim Planalto, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Contos tradicionais, Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Terror / Suspense, Crônica, Literatura fantástica, Informativo', NULL, '2023-01-26 15:03:40'),

-- 251. Wallacy Gabriel Borba Rodrigues
(gen_random_uuid(), 'Wallacy Gabriel Borba Rodrigues', 'renataaguiarborba234@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-02 14:04:05', '2015-09-16', '51 989016523', 'Travessa 60, 18', 'Parque Primavera', 'Esteio-RS', 'Parda', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Contos tradicionais, Contos contemporâneos', NULL, '2025-12-02 14:04:05'),

-- 252. WILIAN JAMBEIRO FAGUNDES
(gen_random_uuid(), 'Wilian Jambeiro Fagundes', 'fernandawilliam013@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-22 16:00:43', '1984-02-11', '47 992372750', 'TRAVESSA 50, 48. PARQUE PRIMAVERA, ESTEIO-RS', NULL, NULL, 'Preta', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Poesia, Novelas / Romances / Ficção, PROSA, LIVRO EVANGÉLICO PENTECOSTAL', NULL, '2025-07-22 16:00:43'),

-- 253. Yago Rossato Muzikant
(gen_random_uuid(), 'Yago Rossato Muzikant', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-01-25 15:24:28', '2013-11-04', '51 993011270', 'Rua 28 de fevereiro, 281 - Parque Amador, Esteio', NULL, NULL, 'Branca', 'Homens cis', 'Sem escolaridade', 'Levar livro', 'Livros de HQ, Literatura fantástica, Livro imagem', NULL, '2023-01-25 15:24:28'),

-- 254. Yasmin Mello
(gen_random_uuid(), 'Yasmin Mello', 'ydanigno@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-12-13 16:38:45', '1990-10-17', '51 981989909', 'Monsenhur Geraldo Penteado, 200, casa 1, santo inácio', NULL, NULL, 'Branca', 'Mulheres cis', 'Pós-graduação Especialização', 'Levar livro', 'Romance espírita', NULL, '2022-12-13 16:38:45'),

-- 255. Yeleidys Perez
(gen_random_uuid(), 'Yeleidys Perez', 'pyeleidys@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-10-08 16:28:38', '2007-09-20', '51 92593720', 'Rua Bom Jesus, 303', 'São Sebastião', 'Esteio-RS', 'Branca', 'Mulheres cis', 'Ensino Médio', 'Leitura na biblioteca, Levar livro, Participar de eventos, Voluntariado', 'Poesia, Crônica, Literatura fantástica, Literatura negra / Africana / Afro-brasileira, Literatura marginal e / ou periférica', NULL, '2025-10-08 16:28:38'),

-- 256. Yohanna Pinto Ferreira
(gen_random_uuid(), 'Yohanna Pinto Ferreira', 'yohannaferreira@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-05-17 10:18:34', '1999-02-18', '983440834', 'Rua Orlando Silva, 204 - Santo Inácio, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Superior', 'Levar livro', 'Novelas / Romances / Ficção, Terror / Suspense, Informativo, Livro imagem', NULL, '2022-05-17 10:18:34'),

-- 257. Yuri Rodrigues dos Santos
(gen_random_uuid(), 'Yuri Rodrigues dos Santos', 'dipiuga@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-21 14:53:19', '2014-08-11', '51983424929', 'Av. Porto Alegre, 136. Jardim Planalto, Esteio.', NULL, NULL, 'Não respondeu', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro', 'Literatura juvenil', NULL, '2025-07-21 14:53:19'),

-- 258. Yuri Rossato Muzikant
(gen_random_uuid(), 'Yuri Rossato Muzikant', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-01-25 15:27:58', '2011-05-24', '51 993484792', 'Rua 28 de fevereiro, 281 - Parque Amador, Esteio', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Livros de HQ, Livro imagem', NULL, '2023-01-25 15:27:58'),

-- 259. Mariáh da Rosa Cruz Ribeiro Lopes
(gen_random_uuid(), 'Mariáh da Rosa Cruz Ribeiro Lopes', 'charlinilopes79@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-17 13:53:05', '2020-09-06', '51 984677769', 'Rua Jardel Filho, 196', 'Parque Santo Inácio', 'Esteio-RS', 'Parda', 'Mulheres cis', 'Educação Infantil', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Poesia, Livros de HQ, Livro imagem', 'Literatura infantil', '2025-12-17 13:53:05'),

-- 260. Noah da Rosa Cruz Ribeiro Lopes
(gen_random_uuid(), 'Noah da Rosa Cruz Ribeiro Lopes', 'charlinilopes79@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-17 13:56:00', '2017-02-03', '51 984677769', 'Rua Jardel Filho, 195', 'Parque Santo Inácio', 'Esteio-RS', 'Branca', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Poesia, Livros de HQ, Livro imagem, Literatura infantil', NULL, '2025-12-17 13:56:00'),

-- 261. Charlini Letícia da Rosa Cruz Lopes
(gen_random_uuid(), 'Charlini Letícia da Rosa Cruz Lopes', 'charlinilopes79@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-17 13:57:59', '1981-08-27', '51 984677769', 'Rua Jardel Filho, 195', 'Parque Santo Inácio', 'Esteio-RS', 'Branca', 'Mulheres cis', 'Ensino Superior', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Novelas / Romances / Ficção, Livros de HQ, Crônica, Informativo, Livro imagem', NULL, '2025-12-17 13:57:59'),

-- 262. Cristiane Borba
(gen_random_uuid(), 'Cristiane Borba', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-17 14:36:07', '1989-06-13', '51 989120256', 'Rua Nações Árabes, 29', 'Parque Primavera', 'Esteio-RS', 'Preta', 'Mulheres cis', 'Ensino Médio', 'Leitura na biblioteca', 'Poesia, Novelas / Romances / Ficção, Romance espírita, Literatura negra / Africana / Afro-brasileira, Literatura marginal e / ou periférica', NULL, '2025-12-17 14:36:07'),

-- 263. Valentina do Nascimento Ribeiro
(gen_random_uuid(), 'Valentina do Nascimento Ribeiro', 'liriaa5970@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-18 14:28:03', '2017-09-02', '51 981513585', 'Av. Pe. Urbano Thiesen, 68.', 'Parque Santo Inácio', 'Esteio-RS', 'Preta', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Livro imagem, Literatura negra / Africana / Afro-brasileira, Literatura infantil', NULL, '2025-12-18 14:28:03'),

-- 264. Líria do Nascimento
(gen_random_uuid(), 'Líria do Nascimento', 'liria5970@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-18 14:32:01', '1977-12-10', '51 981513585', 'Av. Pe. Urbano Thiesen, 68', 'Parque Santo Inácio', 'Esteio-RS', 'Preta', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Contos tradicionais, Contos contemporâneos, Novelas / Romances / Ficção, Literatura negra / Africana / Afro-brasileira, Literatura marginal e / ou periférica, Literatura brasileira', NULL, '2025-12-18 14:32:01'),

-- 265. Davih Oreda Luz
(gen_random_uuid(), 'Davih Oreda Luz', 'davih.minato@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-18 14:34:44', '2014-04-12', '51 989651596', 'Av. Porto Alegre, 215.', 'Jardim Planalto', 'Esteio-RS', 'Branca', 'Homens cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Literatura fantástica', NULL, '2025-12-18 14:34:44')
;

-- =============================================================================
-- RESUMO DA IMPORTAÇÃO
-- =============================================================================
SELECT 
    '✅ Importação concluída com sucesso!' as status,
    COUNT(*) as total_leitores
FROM users_profile 
WHERE role = 'leitor';
