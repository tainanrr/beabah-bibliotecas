-- Script para cadastrar todas as bibliotecas da rede Beabah!
-- Execute este script no SQL Editor do Supabase
-- As coordenadas são aproximadas e podem ser ajustadas posteriormente
-- NOTA: O ID será gerado automaticamente pelo banco (UUID)

-- Biblioteca Comunitária 11 de Abril
INSERT INTO libraries (name, city, address, active, created_at)
VALUES (
  'Biblioteca Comunitária 11 de Abril',
  'Alvorada',
  'Rua Darcy Ribeiro, 121 - bairro Campos Verdes, Alvorada/RS',
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Biblioteca Comunitária do Arvoredo
INSERT INTO libraries (name, city, address, active, created_at)
VALUES (
  'Biblioteca Comunitária do Arvoredo',
  'Porto Alegre',
  'Avenida Santo Dias da Silva, 727 - bairro Lomba do Pinheiro, Porto Alegre/RS',
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Biblioteca Comunitária Ataîru
INSERT INTO libraries (name, city, address, active, created_at)
VALUES (
  'Biblioteca Comunitária Ataîru',
  'Eldorado do Sul',
  'Assentamento Belo Monte, rua A, 354 - Eldorado do Sul/RS',
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Biblioteca Comunitária Beto Aguiar
INSERT INTO libraries (name, city, address, active, created_at)
VALUES (
  'Biblioteca Comunitária Beto Aguiar',
  'Porto Alegre',
  'Rua dos Andradas, 1780 - bairro Centro, Porto Alegre/RS (Ocupação Rexistência POA)',
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Biblioteca Comunitária Biblio Flor
INSERT INTO libraries (name, city, address, active, created_at)
VALUES (
  'Biblioteca Comunitária Biblio Flor',
  'Porto Alegre',
  'Rua Irene Capponi Santiago, 290 - bairro Cristo Redentor, Porto Alegre/RS',
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Biblioteca Comunitária Carolina Maria de Jesus
INSERT INTO libraries (name, city, address, active, created_at)
VALUES (
  'Biblioteca Comunitária Carolina Maria de Jesus',
  'Porto Alegre',
  'Rua Arroio Grande, 50 - bairro Cavalhada, Porto Alegre/RS',
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Biblioteca Comunitária Circular
INSERT INTO libraries (name, city, address, active, created_at)
VALUES (
  'Biblioteca Comunitária Circular',
  'Esteio',
  'Av. João Paulo, 900 (Praça da Juventude) - bairro Jardim Planalto, Esteio/RS',
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Biblioteca Comunitária Girassol
INSERT INTO libraries (name, city, address, active, created_at)
VALUES (
  'Biblioteca Comunitária Girassol',
  'Porto Alegre',
  'Praça Oliveira Rolim, s/n - bairro Sarandi, Porto Alegre/RS',
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Biblioteca Comunitária Marginal Ilha do Saber
INSERT INTO libraries (name, city, address, active, created_at)
VALUES (
  'Biblioteca Comunitária Marginal Ilha do Saber',
  'Porto Alegre',
  'Av. Presidente Vargas, 1726 - bairro Arquipélago, Porto Alegre/RS',
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Biblioteca Comunitária Mestra Griô Sirley Amaro
INSERT INTO libraries (name, city, address, active, created_at)
VALUES (
  'Biblioteca Comunitária Mestra Griô Sirley Amaro',
  'Porto Alegre',
  'Avenida Capivari, 602 - bairro Cristal, Porto Alegre/RS',
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Biblioteca Comunitária Itinerante Mochileira da Leitura
INSERT INTO libraries (name, city, address, active, created_at)
VALUES (
  'Biblioteca Comunitária Itinerante Mochileira da Leitura',
  'Porto Alegre',
  'Rua Atílio Supert, 821 - bairro Vila Nova, Porto Alegre/RS',
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Biblioteca Comunitária Raio de Luz
INSERT INTO libraries (name, city, address, active, created_at)
VALUES (
  'Biblioteca Comunitária Raio de Luz',
  'Porto Alegre',
  'Avenida Ipiranga, 2495 - bairro Praia de Belas, Porto Alegre/RS',
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Biblioteca Comunitária Sabiá do Saibro Sábio
INSERT INTO libraries (name, city, address, active, created_at)
VALUES (
  'Biblioteca Comunitária Sabiá do Saibro Sábio',
  'Porto Alegre',
  'Praça Carlos Santa Helena, s/n - bairro Belém Novo, Porto Alegre/RS (em frente ao Projeto WimBelemDon)',
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Biblioteca Comunitária Sede de Partilha
INSERT INTO libraries (name, city, address, active, created_at)
VALUES (
  'Biblioteca Comunitária Sede de Partilha',
  'Eldorado do Sul',
  'Travessa Monte Alegre, 190 (Assentamento Apolônio de Carvalho) - bairro Guaíba City, Eldorado do Sul/RS',
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Formigueiro Espaço de Leitura
INSERT INTO libraries (name, city, address, active, created_at)
VALUES (
  'Formigueiro Espaço de Leitura',
  'Caxias do Sul',
  'Caxias do Sul/RS',
  true,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Atualizar coordenadas (valores aproximados baseados nos endereços)
-- IMPORTANTE: Para coordenadas precisas, busque cada endereço no Google Maps
-- e atualize manualmente através da interface de edição de bibliotecas

-- Biblioteca 11 de Abril - Alvorada (Rua Darcy Ribeiro, 121 - Campos Verdes)
UPDATE libraries SET latitude = -29.9911, longitude = -51.0806 
WHERE name = 'Biblioteca Comunitária 11 de Abril' AND city = 'Alvorada';

-- Biblioteca do Arvoredo - Porto Alegre (Av. Santo Dias da Silva, 727 - Lomba do Pinheiro)
UPDATE libraries SET latitude = -30.1234, longitude = -51.1234 
WHERE name = 'Biblioteca Comunitária do Arvoredo' AND city = 'Porto Alegre';

-- Biblioteca Ataîru - Eldorado do Sul (Assentamento Belo Monte, rua A, 354)
UPDATE libraries SET latitude = -30.0833, longitude = -51.3833 
WHERE name = 'Biblioteca Comunitária Ataîru' AND city = 'Eldorado do Sul';

-- Biblioteca Beto Aguiar - Porto Alegre (Rua dos Andradas, 1780 - Centro)
UPDATE libraries SET latitude = -30.0346, longitude = -51.2177 
WHERE name = 'Biblioteca Comunitária Beto Aguiar' AND city = 'Porto Alegre';

-- Biblioteca Biblio Flor - Porto Alegre (Rua Irene Capponi Santiago, 290 - Cristo Redentor)
UPDATE libraries SET latitude = -30.0500, longitude = -51.2000 
WHERE name = 'Biblioteca Comunitária Biblio Flor' AND city = 'Porto Alegre';

-- Biblioteca Carolina Maria de Jesus - Porto Alegre (Rua Arroio Grande, 50 - Cavalhada)
UPDATE libraries SET latitude = -30.0667, longitude = -51.1833 
WHERE name = 'Biblioteca Comunitária Carolina Maria de Jesus' AND city = 'Porto Alegre';

-- Biblioteca Circular - Esteio (Av. João Paulo, 900 - Jardim Planalto)
UPDATE libraries SET latitude = -29.8500, longitude = -51.1833 
WHERE name = 'Biblioteca Comunitária Circular' AND city = 'Esteio';

-- Biblioteca Girassol - Porto Alegre (Praça Oliveira Rolim, s/n - Sarandi)
UPDATE libraries SET latitude = -30.0167, longitude = -51.1500 
WHERE name = 'Biblioteca Comunitária Girassol' AND city = 'Porto Alegre';

-- Biblioteca Ilha do Saber - Porto Alegre (Av. Presidente Vargas, 1726 - Arquipélago)
UPDATE libraries SET latitude = -30.0333, longitude = -51.2167 
WHERE name = 'Biblioteca Comunitária Marginal Ilha do Saber' AND city = 'Porto Alegre';

-- Biblioteca Mestra Griô - Porto Alegre (Av. Capivari, 602 - Cristal)
UPDATE libraries SET latitude = -30.0500, longitude = -51.2333 
WHERE name = 'Biblioteca Comunitária Mestra Griô Sirley Amaro' AND city = 'Porto Alegre';

-- Biblioteca Mochileira - Porto Alegre (Rua Atílio Supert, 821 - Vila Nova)
UPDATE libraries SET latitude = -30.0167, longitude = -51.1833 
WHERE name = 'Biblioteca Comunitária Itinerante Mochileira da Leitura' AND city = 'Porto Alegre';

-- Biblioteca Raio de Luz - Porto Alegre (Av. Ipiranga, 2495 - Praia de Belas)
UPDATE libraries SET latitude = -30.0500, longitude = -51.2000 
WHERE name = 'Biblioteca Comunitária Raio de Luz' AND city = 'Porto Alegre';

-- Biblioteca Sabiá - Porto Alegre (Praça Carlos Santa Helena, s/n - Belém Novo)
UPDATE libraries SET latitude = -30.1833, longitude = -51.1167 
WHERE name = 'Biblioteca Comunitária Sabiá do Saibro Sábio' AND city = 'Porto Alegre';

-- Biblioteca Sede de Partilha - Eldorado do Sul (Travessa Monte Alegre, 190 - Guaíba City)
UPDATE libraries SET latitude = -30.0833, longitude = -51.3833 
WHERE name = 'Biblioteca Comunitária Sede de Partilha' AND city = 'Eldorado do Sul';

-- Formigueiro - Caxias do Sul
UPDATE libraries SET latitude = -29.1681, longitude = -51.1792 
WHERE name = 'Formigueiro Espaço de Leitura' AND city = 'Caxias do Sul';
