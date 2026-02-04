-- =============================================================================
-- IMPORTAÇÃO DE LEITORES DO SISTEMA ANTIGO - PARTE 4
-- =============================================================================
-- Execute após import_readers_legacy_part3.sql
-- =============================================================================

INSERT INTO users_profile (
    id, name, email, role, library_id, active, lgpd_consent, created_at,
    birth_date, phone, address_street, address_neighborhood, address_city,
    ethnicity, gender, education_level, interests, favorite_genres, suggestions, original_registration_date
) VALUES

-- 151. LUANA ISADORA DOS SANTOS
(gen_random_uuid(), 'Luana Isadora dos Santos', 'is5382424@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-09-17 15:33:18', '2007-02-01', '51983103597', 'RUA OSVALDO JESUS VIEIRA, 117.', 'PARQUE PRIMAVERA', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Médio', 'Leitura na biblioteca, Levar livro, Participar de eventos, Voluntariado', 'Contos tradicionais, Poesia, Livros de HQ, Teatro, Literatura marginal e / ou periférica', 'Massinha de modelar, slime para brincar.', '2025-09-17 15:33:18'),

-- 152. Lucas Kinczikowski - Julia
(gen_random_uuid(), 'Lucas Kinczikowski - Julia', 'v3nuss4turno@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-03-09 09:18:19', '2007-02-23', '5196536306', 'Jardel Filho, 467 - Santo Inácio, Esteio', NULL, NULL, 'Branca', 'Não-binárie', 'Ensino Médio', 'Leitura na biblioteca, Levar livro, Voluntariado', 'Poesia, Literatura fantástica, Romance espírita', NULL, '2022-03-09 09:18:19'),

-- 153. Lucas Kova Dias Cunha
(gen_random_uuid(), 'Lucas Kova Dias Cunha', 'lucasd.cunha42@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-02-01 13:44:22', '1992-09-28', '984686901', 'Rua Cláudio Manuel da Costa, 273 - Jardim Planalto, Esteio', NULL, NULL, 'Branca', 'Homens cis', 'Pós-graduação Especialização', 'Levar livro, Voluntariado', 'Contos tradicionais, Teatro, Informativo', NULL, '2022-02-01 13:44:22'),

-- 154. Luciana Polly
(gen_random_uuid(), 'Luciana Polly', 'llupolly.lp@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-12-05 15:43:50', '1976-09-28', '984392808', 'Rua Cláudio Mascarelo, 336, Santo inácio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Contos tradicionais, Contos contemporâneos, Poesia, Romance espírita', NULL, '2023-12-05 15:43:50'),

-- 155. Luciane Alves
(gen_random_uuid(), 'Luciane Alves', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-11-10 14:42:02', '1976-01-06', '51980425233', 'Travessa 50, nº41, Hípica, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca', 'Novelas / Romances / Ficção', NULL, '2022-11-10 14:42:02'),

-- 156. Luis André da Silva Correa
(gen_random_uuid(), 'Luis André da Silva Correa', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2021-12-10 15:27:41', '2014-02-12', '994133733', 'Rua 8 de Março, 216 - Jardim Planalto, Esteio', NULL, NULL, 'Preta', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Contos contemporâneos, Livros de HQ', NULL, '2021-12-10 15:27:41'),

-- 157. LUIS EDUARDO RITTER GALVÃO
(gen_random_uuid(), 'Luis Eduardo Ritter Galvão', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-11-25 14:54:32', '2006-03-22', '51981129760', 'RUA FORTALEZA, 61', 'LIBERDADE', 'ESTEIO-RS', 'Preta', 'Homens cis', 'Ensino Médio', 'Leitura na biblioteca, Voluntariado', 'Contos tradicionais, Contos contemporâneos, Poesia, Terror / Suspense, Livros de HQ, Crônica, Literatura fantástica, Informativo', 'COMPRAR LIVRO "50 tons de darcy"', '2025-11-25 14:54:32'),

-- 158. Luiza Mesquita Alves Gonçalves
(gen_random_uuid(), 'Luiza Mesquita Alves Gonçalves', 'luiza2008goncalves@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-02 14:02:00', '2008-11-12', '51 99416795', 'Rua', 'Parque Santo Inácio', 'Esteio-RS', 'Parda', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Crônica, Romance espírita', NULL, '2025-12-02 14:02:00'),

-- 159. Luiza de Silva Farias
(gen_random_uuid(), 'Luiza de Silva Farias', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-01-25 15:42:20', '2011-08-18', '51 984933507', 'Allan Kardec 100, Jardim Planalto', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Contos tradicionais', NULL, '2023-01-25 15:42:20'),

-- 160. LUIZA DEWES MOUTINHO GUGLIELMI
(gen_random_uuid(), 'Luiza Dewes Moutinho Guglielmi', 'taisdewes@yahoo.com.br', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-09-03 14:30:05', '2015-07-17', '51 983257052', 'AV. PADRE CLARET, 208', 'CENTRO', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'LITERATURA INFANTOJUVENIL', NULL, '2025-09-03 14:30:05'),

-- 161. Manoela Mesquita Alves Gonçalves
(gen_random_uuid(), 'Manoela Mesquita Alves Gonçalves', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-02 13:59:58', '2011-04-12', '51 981777913', 'Rua', 'Parque Santo Inácio', 'Esteio-RS', 'Parda', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Leitura na biblioteca', 'Contos tradicionais, Romance espírita', 'Aquisição de livro: "Pretty Little Liars", "Eu e esse meu coração".', '2025-12-02 13:59:58'),

-- 162. MARCELA KUTTER DOS SANTOS
(gen_random_uuid(), 'Marcela Kutter dos Santos', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-09-17 16:17:41', '2014-07-30', '51...', 'RUA 8 DE MARÇO, 309', 'PARQUE PRIMAVERA', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro', 'Livros de HQ, Literatura fantástica, Livro imagem, LIVRO INFANTOJUVENIL', NULL, '2025-09-17 16:17:41'),

-- 163. MARCELO GABRIEL NASCIMENTO
(gen_random_uuid(), 'Marcelo Gabriel Nascimento', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-26 13:50:09', '2016-10-08', '51 991039919', 'RUA BORGES DE MEDEIROS, 71, JARDIM PLANALTO, ESTEIO', NULL, NULL, 'Parda', 'Homens cis', 'Educação Infantil', 'Levar livro', 'Contos contemporâneos', NULL, '2022-07-26 13:50:09'),

-- 164. MÁRCIA ELIANE DE MELO
(gen_random_uuid(), 'Márcia Eliane de Melo', 'marcy8400@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-08-04 15:12:51', '1973-01-29', '51 995664291', 'AV. JOÃO PAULO I, 255.', 'PARQUE SANTO INÁCIO', 'ESTEIO-RS', 'Preta', 'Mulheres cis', 'Ensino Médio', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Contos tradicionais, Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Livros de HQ, Crônica, Teatro, Literatura fantástica, Informativo, Livro imagem, Literatura negra / Africana / Afro-brasileira, Literatura indígena, Literatura marginal e / ou periférica', NULL, '2025-08-04 15:12:51'),

-- 165. Marcia Evaldt
(gen_random_uuid(), 'Marcia Evaldt', 'maciamagneis6@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-05-04 13:36:20', '1973-10-06', '981272348', 'Rua Osmar Fortes Barcelos 490 esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Crônica, Teatro, Romance espírita, Livro imagem', NULL, '2023-05-04 13:36:20'),

-- 166. MÁRCIA LUCIANA DA SILVA
(gen_random_uuid(), 'Márcia Luciana da Silva', 'henriquelobo111@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-22 16:12:03', '1976-10-13', '51 996550116', 'RUA LEOPOLDO BRENTANO, 107, BAIRRO PARQUE SANTO INÁCIO. ESTEIO-RS', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Contos tradicionais, Contos contemporâneos, Novelas / Romances / Ficção, Informativo, CULINÁRIA, PLANTAS MEDICINAIS E CHÁS NATURAIS.', NULL, '2025-07-22 16:12:03'),

-- 167. Maria Afra G. dos Santos
(gen_random_uuid(), 'Maria Afra G. dos Santos', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-08-16 15:00:34', '1945-08-06', '34101123', 'Av João Paulo I, 127, Sto Inácio, esteio', NULL, NULL, 'Branca', 'Mulheres trans', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Novelas / Romances / Ficção', NULL, '2022-08-16 15:00:34'),

-- 168. MARIA ALICE RAMIRES
(gen_random_uuid(), 'Maria Alice Ramires', 'mariaaliceramires123@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-24 15:41:27', '2013-04-22', '51 992998782', 'RUA QUARAÍ, 170, SÃO JOSÉ. ESTEIO-RS.', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Poesia, Novelas / Romances / Ficção, Terror / Suspense, Teatro', NULL, '2025-07-24 15:41:27'),

-- 169. Maria de Fátima
(gen_random_uuid(), 'Maria de Fátima', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-02-15 16:02:39', '1960-02-13', '34605370', 'Rua Nei Brito 403, santo inácio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Contos tradicionais, Romance espírita', NULL, '2023-02-15 16:02:39'),

-- 170. Maria do Carmo da Rosa Batista
(gen_random_uuid(), 'Maria do Carmo da Rosa Batista', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-07-18 13:57:42', '1953-09-10', '986339929', 'Rua Serafim 15, santo inácio', NULL, NULL, 'Preta', 'Mulheres cis', 'Ensino Médio', 'Leitura na biblioteca', 'Romance espírita', NULL, '2023-07-18 13:57:42'),

-- 171. Maria Helena Roldão Machado
(gen_random_uuid(), 'Maria Helena Roldão Machado', 'mariahelenaroldaomachado@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-04-11 13:56:56', '1990-10-16', '989969060', 'AV João Paulo I 445 santo inácio, esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro, Participar de eventos', 'Contos tradicionais, Contos contemporâneos, Teatro, Literatura fantástica, Informativo', NULL, '2023-04-11 13:56:56'),

-- 172. Maria Neila Cardoso Teixeira
(gen_random_uuid(), 'Maria Neila Cardoso Teixeira', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-11-16 14:32:52', '1955-12-25', '51998371928', 'Av. Padre Landel de Moura 123, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Romance espírita', NULL, '2022-11-16 14:32:52'),

-- 173. MARIA RITA HOFMANN ESTIVALET
(gen_random_uuid(), 'Maria Rita Hofmann Estivalet', 'angelaclaraluz@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-08-04 15:15:53', '2011-11-11', '51 9999325230', 'RUA DOS FERROVIÁRIOS, 363/402', 'CENTRO', 'ESTEIO-RS', 'Preta', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Leitura na biblioteca, Levar livro', 'Contos tradicionais, Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ', NULL, '2025-08-04 15:15:53'),

-- 174. Mariah de Almeida
(gen_random_uuid(), 'Mariah de Almeida', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-01-25 15:43:57', '2013-01-15', '51 997718605', 'Allan Kadec 35, Santo Inácio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Contos tradicionais', NULL, '2023-01-25 15:43:57'),

-- 175. Mariala de Almeida Birnkolt
(gen_random_uuid(), 'Mariala de Almeida Birnkolt', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-12-02 13:49:58', '2013-01-15', '51 96998681', 'Rua Allan Kardec, 35', 'Jardim Planalto', 'Esteio-RS', 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Contos tradicionais, Novelas / Romances / Ficção, Terror / Suspense', NULL, '2025-12-02 13:49:58'),

-- 176. MARIELLI ANTONETTI
(gen_random_uuid(), 'Marielli Antonetti', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-08-04 15:28:44', '1990-07-31', '51 986238638', 'RUA ROQUE GONZALES, 707.', 'PARQUE SANTO INÁCIO', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Médio', 'Leitura na biblioteca', 'Novelas / Romances / Ficção, Terror / Suspense, Teatro, Livro imagem', NULL, '2025-08-04 15:28:44'),

-- 177. MARLENE SETMHOSWKI
(gen_random_uuid(), 'Marlene Setmhoswki', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-08-28 16:26:42', '1944-09-16', '51 81716003', 'AV. PORTO ALEGRE, 1068', 'JARDIM PLANALTO', 'ESTEIO-RS', 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro, Participar de eventos', 'HISTÓRIA', 'LIVROS DE HISTÓRIA', '2025-08-28 16:26:42'),

-- 178. Marlene Stmpuski
(gen_random_uuid(), 'Marlene Stmpuski', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-10-20 17:01:53', '1950-09-16', '51 981716003', 'Av Porto Alegre 1068', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Teatro, Romance espírita, Livro imagem', NULL, '2022-10-20 17:01:53'),

-- 179. Miguel da Rosa da Silva
(gen_random_uuid(), 'Miguel da Rosa da Silva', 'lidiadarosa1987@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-22 14:55:52', '2015-02-20', '51 994627348', 'Rua Viterbo José Machado, 214. Jardim Planalto. Esteio-RS', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Livros de HQ, Literatura fantástica, Informativo, Livro imagem', NULL, '2025-07-22 14:55:52'),

-- 180. MIRANDA EDUARDA MACIEL PEREIRA
(gen_random_uuid(), 'Miranda Eduarda Maciel Pereira', 'mrndmaciel15@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-08-09 14:03:23', '2002-10-15', '51982878310', 'Estrada do Boqueirão, 800, jardim planalto, esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Levar livro', 'Novelas / Romances / Ficção', NULL, '2022-08-09 14:03:23'),

-- 181. MIRIÃ DE B COITO
(gen_random_uuid(), 'Miriã de B Coito', 'barrosmiria45@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-07 14:08:04', '1997-12-10', '51984336831', 'Rua 1° de Março 650', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Contos contemporâneos, Terror / Suspense, Literatura fantástica', NULL, '2022-07-07 14:08:04'),

-- 182. MIRIÃ FIGUEIRÓ
(gen_random_uuid(), 'Miriã Figueiró', 'freitasmiria17@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-08 15:21:33', '2008-10-28', '51992008506', 'RUA TAQUARA 723 OLIMPICA, ESTEIO', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Contos contemporâneos, Novelas / Romances / Ficção, Terror / Suspense, Literatura fantástica, Literatura marginal e / ou periférica', NULL, '2022-07-08 15:21:33'),

-- 183. MURILLO LEAL VIGIL
(gen_random_uuid(), 'Murillo Leal Vigil', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-08-04 14:50:55', '2014-07-17', '51 991795970', 'AV. PORTO ALEGRE, 998. JARDIM PLANALTO, ESTEIO-RS', 'JARDIM PLANALTO', 'ESTEIO-RS', 'Branca', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro, Participar de eventos, Voluntariado', 'Terror / Suspense, Crônica, Literatura fantástica, Livro imagem, Literatura negra / Africana / Afro-brasileira, Literatura indígena', NULL, '2025-08-04 14:50:55'),

-- 184. Murilo Alves Porto
(gen_random_uuid(), 'Murilo Alves Porto', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-04-27 11:11:09', NULL, '982902100', 'Travessa Alvina Francisca, 161 - Jardim Planalto, Esteio', NULL, NULL, 'Parda', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Livros de HQ', NULL, '2022-04-27 11:11:09'),

-- 185. Nair Machado
(gen_random_uuid(), 'Nair Machado', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-01-13 13:09:26', '1954-04-23', '997975700', 'Av. Santo Inácio, 146 - Santo Inácio, Esteio', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Romance espírita', NULL, '2022-01-13 13:09:26'),

-- 186. Neli Rodrigues
(gen_random_uuid(), 'Neli Rodrigues', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-09-15 16:07:02', '1954-07-26', '51 9999844406', 'Av João Paulo I', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Superior', 'Levar livro', 'Contos tradicionais', NULL, '2022-09-15 16:07:02'),

-- 187. NEUZA GARCIA BRUM
(gen_random_uuid(), 'Neuza Garcia Brum', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-07 15:33:20', '1943-02-06', '51994434843', 'RUA RIO PARDO, 968, TAMANDARÉ', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Superior', 'Leitura na biblioteca, Levar livro', 'Informativo', NULL, '2022-07-07 15:33:20'),

-- 188. Nicollas Lama dos Santos / Nicolly
(gen_random_uuid(), 'Nicollas Lama dos Santos', 'ndc130292@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-11-03 16:22:35', '2005-03-04', '51980296705', 'Rua Ney Britto 371, santo inácio, esteio', NULL, NULL, 'Branca', 'Mulheres trans', 'Ensino Médio', 'Leitura na biblioteca, Voluntariado', 'Novelas / Romances / Ficção, Terror / Suspense, Literatura fantástica', NULL, '2022-11-03 16:22:35'),

-- 189. Nicolly Alessandra Rodrigues Silva
(gen_random_uuid(), 'Nicolly Alessandra Rodrigues Silva', 'nicollyrodrigues138014@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-22 14:17:03', '2014-05-13', '51 99212014', 'Av. Porto Alegre, 1308, Jardim Planalto, Esteio-RS', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Contos tradicionais, Novelas / Romances / Ficção, Terror / Suspense, Literatura fantástica', NULL, '2025-07-22 14:17:03'),

-- 190. Nicolly Pereira Santos
(gen_random_uuid(), 'Nicolly Pereira Santos', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2021-12-10 15:12:25', '2008-10-21', '994133733', 'Rua 8 de Março, 216 - Jardim Planalto, Esteio', NULL, NULL, 'Parda', 'Mulheres cis', 'Ensino Fundamental (6º ao 9º ano)', 'Levar livro', 'Terror / Suspense, Crônica, Literatura fantástica', NULL, '2021-12-10 15:12:25'),

-- 191. Nicoly Feijó
(gen_random_uuid(), 'Nicoly Feijó', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2023-04-11 14:02:29', '2012-01-01', '994850810', 'Av Porto Alegre 406', NULL, NULL, 'Preta', 'Mulheres cis', 'Educação Infantil', 'Levar livro', 'Livro imagem', NULL, '2023-04-11 14:02:29'),

-- 192. Nikolas Alessandro
(gen_random_uuid(), 'Nikolas Alessandro', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-08 10:20:40', '2014-07-28', '981644972', 'Travessa Alvina Francisca, 100, jd Planalto', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Contos tradicionais, Poesia, Terror / Suspense, Livros de HQ, Crônica, Teatro, Romance espírita, Livro imagem, Literatura negra / Africana / Afro-brasileira, Literatura marginal e / ou periférica', NULL, '2025-07-08 10:20:40'),

-- 193. Nilce P. Biasi Prates
(gen_random_uuid(), 'Nilce P. Biasi Prates', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-05-23 12:05:13', '1958-04-11', '51992297128', 'Rua Orlando Silva, 219 - Santo Inácio, Esteio/RS', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Superior', 'Levar livro', 'Novelas / Romances / Ficção, Informativo', NULL, '2022-05-23 12:05:13'),

-- 194. NILDETE DA SILVA MARQUEZOTTI
(gen_random_uuid(), 'Nildete da Silva Marquezotti', 'nildetedasilvamarquezotti@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-08-28 16:03:48', '1962-01-15', '51 985137805', 'RUA ACHYLLES QUAIATTO, 24', '?', '?', 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Novelas / Romances / Ficção', NULL, '2025-08-28 16:03:48'),

-- 195. Paulo Guilherme Oliveira Silva
(gen_random_uuid(), 'Paulo Guilherme Oliveira Silva', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-07 10:15:03', '2014-10-15', '99460851', 'Oscarito, 26, Pq Primavera, Esteio', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Leitura na biblioteca, Levar livro', 'Terror / Suspense', NULL, '2025-07-07 10:15:03'),

-- 196. Pedro Henrique da Mota Teixeira
(gen_random_uuid(), 'Pedro Henrique da Mota Teixeira', 'pedrohmteixeira30@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-22 14:32:54', '2014-06-30', '51 997457090', 'Av Santo Inácio de Loyola, 230, Parque Santo Inácio. Esteio-RS', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Terror / Suspense, Livros de HQ, Literatura fantástica', NULL, '2025-07-22 14:32:54'),

-- 197. PIETRA T. DOS SANTOS
(gen_random_uuid(), 'Pietra T. dos Santos', 'patricia.teixeira@importadorabage.com.br', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-22 16:14:40', '2014-08-25', '51 992859484', 'RUA ROQUE GONZALEZ, 438. PARQUE SANTO INÁCIO, ESTEIO-RS', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Poesia, Novelas / Romances / Ficção, Teatro, Literatura fantástica', NULL, '2025-07-22 16:14:40'),

-- 198. PIETRO CARVALHO QUINTANA
(gen_random_uuid(), 'Pietro Carvalho Quintana', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2025-07-22 16:30:20', '2013-08-08', '34736080', 'RUA ALVARENGA PEIXOTO, 65. JARDIM PLANALTO, ESTEIO-RS.', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Fundamental (1º ao 5º ano)', 'Levar livro', 'Contos tradicionais, Livro imagem', NULL, '2025-07-22 16:30:20'),

-- 199. PRISCILA RODRIGUES ALDERETTE
(gen_random_uuid(), 'Priscila Rodrigues Alderette', NULL, 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-07-07 13:58:37', '1999-02-25', '51985868817', 'RUA LUS CARLOS MORETTI NUNES 197, SANTO INÁCIO, ESTEIO', NULL, NULL, 'Branca', 'Mulheres cis', 'Ensino Médio', 'Leitura na biblioteca, Levar livro, Participar de eventos', 'Contos tradicionais, Livro imagem', NULL, '2022-07-07 13:58:37'),

-- 200. Rafael Silva de Oliveira
(gen_random_uuid(), 'Rafael Silva de Oliveira', 'fuelso88@gmail.com', 'leitor', 'd9fafe3d-3006-4588-8d19-7713ba71fb54', true, true, '2022-04-26 08:33:20', '1988-12-15', '993738171', 'Rua Hélio Arnoldo Sperb, 67 - Jardim Planalto, Esteio', NULL, NULL, 'Branca', 'Homens cis', 'Ensino Médio', 'Levar livro', 'Contos tradicionais, Contos contemporâneos, Poesia, Novelas / Romances / Ficção, Terror / Suspense, Livros de HQ, Crônica, Teatro, Literatura fantástica, Informativo, Romance espírita, Livro imagem, Literatura negra / Africana / Afro-brasileira, Literatura indígena, Literatura marginal e / ou periférica', NULL, '2022-04-26 08:33:20')
;

SELECT 'Parte 4 da importação concluída (50 leitores)! Execute import_readers_legacy_part5.sql para finalizar.' as resultado;
