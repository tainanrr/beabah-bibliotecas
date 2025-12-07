-- Script para popular o banco de dados com dados de teste
-- Execute este script no SQL Editor do Supabase

-- 1. Criar bibliotecas (se não existirem)
INSERT INTO libraries (id, name, city, active, created_at)
VALUES 
  ('lib-001', 'Biblioteca Central', 'São Paulo', true, NOW() - INTERVAL '1 year'),
  ('lib-002', 'Biblioteca Mário de Andrade', 'Campinas', true, NOW() - INTERVAL '10 months'),
  ('lib-003', 'Biblioteca Monteiro Lobato', 'Santos', true, NOW() - INTERVAL '8 months'),
  ('lib-004', 'Biblioteca Paulo Freire', 'Ribeirão Preto', true, NOW() - INTERVAL '6 months'),
  ('lib-005', 'Biblioteca Cecília Meireles', 'Sorocaba', false, NOW() - INTERVAL '4 months')
ON CONFLICT (id) DO NOTHING;

-- 2. Criar 50 livros
INSERT INTO books (id, title, author, category, isbn, created_at)
VALUES
  ('book-001', 'Dom Casmurro', 'Machado de Assis', 'Literatura Brasileira', '9788525406453', NOW() - INTERVAL '8 months'),
  ('book-002', 'Grande Sertão: Veredas', 'Guimarães Rosa', 'Literatura Brasileira', '9788520923115', NOW() - INTERVAL '8 months'),
  ('book-003', 'Memórias Póstumas de Brás Cubas', 'Machado de Assis', 'Literatura Brasileira', '9788525410450', NOW() - INTERVAL '8 months'),
  ('book-004', 'O Cortiço', 'Aluísio Azevedo', 'Literatura Brasileira', '9788544001005', NOW() - INTERVAL '8 months'),
  ('book-005', 'Vidas Secas', 'Graciliano Ramos', 'Literatura Brasileira', '9788501014665', NOW() - INTERVAL '8 months'),
  ('book-006', 'Capitães da Areia', 'Jorge Amado', 'Literatura Brasileira', '9788535914061', NOW() - INTERVAL '7 months'),
  ('book-007', 'A Hora da Estrela', 'Clarice Lispector', 'Literatura Brasileira', '9788532511454', NOW() - INTERVAL '7 months'),
  ('book-008', 'O Alienista', 'Machado de Assis', 'Literatura Brasileira', '9788525410451', NOW() - INTERVAL '7 months'),
  ('book-009', 'Macunaíma', 'Mário de Andrade', 'Literatura Brasileira', '9788525410452', NOW() - INTERVAL '7 months'),
  ('book-010', 'O Guarani', 'José de Alencar', 'Literatura Brasileira', '9788525410453', NOW() - INTERVAL '7 months'),
  ('book-011', 'Iracema', 'José de Alencar', 'Literatura Brasileira', '9788525410454', NOW() - INTERVAL '6 months'),
  ('book-012', 'Senhora', 'José de Alencar', 'Literatura Brasileira', '9788525410455', NOW() - INTERVAL '6 months'),
  ('book-013', 'O Mulato', 'Aluísio Azevedo', 'Literatura Brasileira', '9788525410456', NOW() - INTERVAL '6 months'),
  ('book-014', 'A Moreninha', 'Joaquim Manuel de Macedo', 'Literatura Brasileira', '9788525410457', NOW() - INTERVAL '6 months'),
  ('book-015', 'O Guarani', 'José de Alencar', 'Literatura Brasileira', '9788525410458', NOW() - INTERVAL '6 months'),
  ('book-016', '1984', 'George Orwell', 'Ficção', '9788525410459', NOW() - INTERVAL '5 months'),
  ('book-017', 'A Revolução dos Bichos', 'George Orwell', 'Ficção', '9788525410460', NOW() - INTERVAL '5 months'),
  ('book-018', 'O Senhor dos Anéis', 'J.R.R. Tolkien', 'Fantasia', '9788525410461', NOW() - INTERVAL '5 months'),
  ('book-019', 'O Hobbit', 'J.R.R. Tolkien', 'Fantasia', '9788525410462', NOW() - INTERVAL '5 months'),
  ('book-020', 'Harry Potter e a Pedra Filosofal', 'J.K. Rowling', 'Fantasia', '9788525410463', NOW() - INTERVAL '5 months'),
  ('book-021', 'Harry Potter e a Câmara Secreta', 'J.K. Rowling', 'Fantasia', '9788525410464', NOW() - INTERVAL '4 months'),
  ('book-022', 'O Código Da Vinci', 'Dan Brown', 'Ficção', '9788525410465', NOW() - INTERVAL '4 months'),
  ('book-023', 'Anjos e Demônios', 'Dan Brown', 'Ficção', '9788525410466', NOW() - INTERVAL '4 months'),
  ('book-024', 'O Pequeno Príncipe', 'Antoine de Saint-Exupéry', 'Infantojuvenil', '9788525410467', NOW() - INTERVAL '4 months'),
  ('book-025', 'A Arte da Guerra', 'Sun Tzu', 'História', '9788525410468', NOW() - INTERVAL '4 months'),
  ('book-026', 'Sapiens', 'Yuval Noah Harari', 'História', '9788525410469', NOW() - INTERVAL '3 months'),
  ('book-027', 'Homo Deus', 'Yuval Noah Harari', 'História', '9788525410470', NOW() - INTERVAL '3 months'),
  ('book-028', '21 Lições para o Século 21', 'Yuval Noah Harari', 'História', '9788525410471', NOW() - INTERVAL '3 months'),
  ('book-029', 'O Poder do Hábito', 'Charles Duhigg', 'Autoajuda', '9788525410472', NOW() - INTERVAL '3 months'),
  ('book-030', 'Atomic Habits', 'James Clear', 'Autoajuda', '9788525410473', NOW() - INTERVAL '3 months'),
  ('book-031', 'O Alquimista', 'Paulo Coelho', 'Ficção', '9788525410474', NOW() - INTERVAL '2 months'),
  ('book-032', 'Brida', 'Paulo Coelho', 'Ficção', '9788525410475', NOW() - INTERVAL '2 months'),
  ('book-033', 'Veronika Decide Morrer', 'Paulo Coelho', 'Ficção', '9788525410476', NOW() - INTERVAL '2 months'),
  ('book-034', 'Onze Minutos', 'Paulo Coelho', 'Ficção', '9788525410477', NOW() - INTERVAL '2 months'),
  ('book-035', 'O Diário de Anne Frank', 'Anne Frank', 'História', '9788525410478', NOW() - INTERVAL '2 months'),
  ('book-036', 'A Menina que Roubava Livros', 'Markus Zusak', 'Ficção', '9788525410479', NOW() - INTERVAL '1 month'),
  ('book-037', 'O Caçador de Pipas', 'Khaled Hosseini', 'Ficção', '9788525410480', NOW() - INTERVAL '1 month'),
  ('book-038', 'A Cidade do Sol', 'Khaled Hosseini', 'Ficção', '9788525410481', NOW() - INTERVAL '1 month'),
  ('book-039', 'O Sol é para Todos', 'Harper Lee', 'Ficção', '9788525410482', NOW() - INTERVAL '1 month'),
  ('book-040', 'A Metamorfose', 'Franz Kafka', 'Clássicos', '9788525410483', NOW() - INTERVAL '1 month'),
  ('book-041', 'O Processo', 'Franz Kafka', 'Clássicos', '9788525410484', NOW() - INTERVAL '20 days'),
  ('book-042', 'Crime e Castigo', 'Fiódor Dostoiévski', 'Clássicos', '9788525410485', NOW() - INTERVAL '20 days'),
  ('book-043', 'Os Irmãos Karamázov', 'Fiódor Dostoiévski', 'Clássicos', '9788525410486', NOW() - INTERVAL '20 days'),
  ('book-044', 'Guerra e Paz', 'Liev Tolstói', 'Clássicos', '9788525410487', NOW() - INTERVAL '20 days'),
  ('book-045', 'Anna Karenina', 'Liev Tolstói', 'Clássicos', '9788525410488', NOW() - INTERVAL '20 days'),
  ('book-046', 'Orgulho e Preconceito', 'Jane Austen', 'Clássicos', '9788525410489', NOW() - INTERVAL '15 days'),
  ('book-047', 'Razão e Sensibilidade', 'Jane Austen', 'Clássicos', '9788525410490', NOW() - INTERVAL '15 days'),
  ('book-048', 'Emma', 'Jane Austen', 'Clássicos', '9788525410491', NOW() - INTERVAL '15 days'),
  ('book-049', 'O Morro dos Ventos Uivantes', 'Emily Brontë', 'Clássicos', '9788525410492', NOW() - INTERVAL '15 days'),
  ('book-050', 'Jane Eyre', 'Charlotte Brontë', 'Clássicos', '9788525410493', NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

-- 3. Criar 30 leitores
INSERT INTO users_profile (id, name, email, role, library_id, active, lgpd_consent, created_at)
VALUES
  ('user-001', 'Ana Silva', 'ana.silva@email.com', 'leitor', 'lib-001', true, true, NOW() - INTERVAL '8 months'),
  ('user-002', 'Pedro Santos', 'pedro.santos@email.com', 'leitor', 'lib-001', true, true, NOW() - INTERVAL '8 months'),
  ('user-003', 'Fernanda Costa', 'fernanda.costa@email.com', 'leitor', 'lib-001', true, true, NOW() - INTERVAL '7 months'),
  ('user-004', 'Lucas Oliveira', 'lucas.oliveira@email.com', 'leitor', 'lib-001', false, true, NOW() - INTERVAL '7 months'),
  ('user-005', 'Juliana Ferreira', 'juliana.ferreira@email.com', 'leitor', 'lib-002', true, true, NOW() - INTERVAL '7 months'),
  ('user-006', 'Rafael Almeida', 'rafael.almeida@email.com', 'leitor', 'lib-002', true, true, NOW() - INTERVAL '6 months'),
  ('user-007', 'Camila Rodrigues', 'camila.rodrigues@email.com', 'leitor', 'lib-002', true, true, NOW() - INTERVAL '6 months'),
  ('user-008', 'Bruno Lima', 'bruno.lima@email.com', 'leitor', 'lib-002', true, true, NOW() - INTERVAL '6 months'),
  ('user-009', 'Larissa Martins', 'larissa.martins@email.com', 'leitor', 'lib-003', true, true, NOW() - INTERVAL '5 months'),
  ('user-010', 'Gustavo Pereira', 'gustavo.pereira@email.com', 'leitor', 'lib-003', true, true, NOW() - INTERVAL '5 months'),
  ('user-011', 'Patrícia Souza', 'patricia.souza@email.com', 'leitor', 'lib-003', true, true, NOW() - INTERVAL '5 months'),
  ('user-012', 'Thiago Barbosa', 'thiago.barbosa@email.com', 'leitor', 'lib-003', true, true, NOW() - INTERVAL '4 months'),
  ('user-013', 'Mariana Rocha', 'mariana.rocha@email.com', 'leitor', 'lib-004', true, true, NOW() - INTERVAL '4 months'),
  ('user-014', 'Diego Araújo', 'diego.araujo@email.com', 'leitor', 'lib-004', true, true, NOW() - INTERVAL '4 months'),
  ('user-015', 'Carolina Mendes', 'carolina.mendes@email.com', 'leitor', 'lib-004', true, true, NOW() - INTERVAL '3 months'),
  ('user-016', 'Felipe Cardoso', 'felipe.cardoso@email.com', 'leitor', 'lib-001', true, true, NOW() - INTERVAL '3 months'),
  ('user-017', 'Amanda Ribeiro', 'amanda.ribeiro@email.com', 'leitor', 'lib-001', true, true, NOW() - INTERVAL '3 months'),
  ('user-018', 'Gabriel Nunes', 'gabriel.nunes@email.com', 'leitor', 'lib-002', true, true, NOW() - INTERVAL '2 months'),
  ('user-019', 'Isabela Freitas', 'isabela.freitas@email.com', 'leitor', 'lib-002', true, true, NOW() - INTERVAL '2 months'),
  ('user-020', 'Ricardo Gomes', 'ricardo.gomes@email.com', 'leitor', 'lib-003', true, true, NOW() - INTERVAL '2 months'),
  ('user-021', 'Beatriz Dias', 'beatriz.dias@email.com', 'leitor', 'lib-003', true, true, NOW() - INTERVAL '1 month'),
  ('user-022', 'Rodrigo Monteiro', 'rodrigo.monteiro@email.com', 'leitor', 'lib-004', true, true, NOW() - INTERVAL '1 month'),
  ('user-023', 'Tatiana Lopes', 'tatiana.lopes@email.com', 'leitor', 'lib-001', true, true, NOW() - INTERVAL '1 month'),
  ('user-024', 'Marcelo Cunha', 'marcelo.cunha@email.com', 'leitor', 'lib-002', true, true, NOW() - INTERVAL '20 days'),
  ('user-025', 'Vanessa Teixeira', 'vanessa.teixeira@email.com', 'leitor', 'lib-003', true, true, NOW() - INTERVAL '20 days'),
  ('user-026', 'André Campos', 'andre.campos@email.com', 'leitor', 'lib-004', true, true, NOW() - INTERVAL '15 days'),
  ('user-027', 'Renata Azevedo', 'renata.azevedo@email.com', 'leitor', 'lib-001', true, true, NOW() - INTERVAL '15 days'),
  ('user-028', 'Leonardo Pires', 'leonardo.pires@email.com', 'leitor', 'lib-002', true, true, NOW() - INTERVAL '10 days'),
  ('user-029', 'Cristina Ramos', 'cristina.ramos@email.com', 'leitor', 'lib-003', true, true, NOW() - INTERVAL '10 days'),
  ('user-030', 'Eduardo Moreira', 'eduardo.moreira@email.com', 'leitor', 'lib-004', true, true, NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- 4. Criar exemplares (copies) - distribuindo livros entre as bibliotecas
-- Criando 150 exemplares distribuídos entre as bibliotecas
INSERT INTO copies (id, book_id, library_id, code, status, created_at)
SELECT 
  'copy-' || LPAD(gs::text, 6, '0') as id,
  'book-' || LPAD(((gs - 1) % 50 + 1)::text, 3, '0') as book_id,
  CASE 
    WHEN (gs - 1) % 4 = 0 THEN 'lib-001'
    WHEN (gs - 1) % 4 = 1 THEN 'lib-002'
    WHEN (gs - 1) % 4 = 2 THEN 'lib-003'
    ELSE 'lib-004'
  END as library_id,
  'LIB' || LPAD(gs::text, 6, '0') as code,
  CASE 
    WHEN gs % 5 = 0 THEN 'emprestado'
    WHEN gs % 5 = 1 THEN 'manutencao'
    ELSE 'disponivel'
  END as status,
  NOW() - (RANDOM() * INTERVAL '8 months') as created_at
FROM generate_series(1, 150) gs
ON CONFLICT (id) DO NOTHING;

-- 5. Criar empréstimos históricos (8 meses de movimentação)
-- Empréstimos devolvidos (histórico - 200 registros)
INSERT INTO loans (id, user_id, copy_id, library_id, loan_date, due_date, return_date, status, created_at)
SELECT 
  'loan-' || LPAD(gs::text, 6, '0') as id,
  'user-' || LPAD(((gs - 1) % 30 + 1)::text, 3, '0') as user_id,
  'copy-' || LPAD(((gs - 1) % 150 + 1)::text, 6, '0') as copy_id,
  CASE 
    WHEN gs % 4 = 0 THEN 'lib-001'
    WHEN gs % 4 = 1 THEN 'lib-002'
    WHEN gs % 4 = 2 THEN 'lib-003'
    ELSE 'lib-004'
  END as library_id,
  (NOW() - INTERVAL '8 months' + (RANDOM() * INTERVAL '7 months'))::date as loan_date,
  (NOW() - INTERVAL '8 months' + (RANDOM() * INTERVAL '7 months') + INTERVAL '14 days')::date as due_date,
  (NOW() - INTERVAL '8 months' + (RANDOM() * INTERVAL '7 months') + INTERVAL '10 days' + (RANDOM() * INTERVAL '5 days'))::date as return_date,
  'devolvido' as status,
  NOW() - INTERVAL '8 months' + (RANDOM() * INTERVAL '7 months') as created_at
FROM generate_series(1, 200) gs
ON CONFLICT (id) DO NOTHING;

-- Empréstimos ativos (alguns em dia - 25 registros)
INSERT INTO loans (id, user_id, copy_id, library_id, loan_date, due_date, status, created_at)
SELECT 
  'loan-active-' || LPAD(gs::text, 6, '0') as id,
  'user-' || LPAD(((gs - 1) % 30 + 1)::text, 3, '0') as user_id,
  'copy-' || LPAD(((gs - 1) % 150 + 1)::text, 6, '0') as copy_id,
  CASE 
    WHEN gs % 4 = 0 THEN 'lib-001'
    WHEN gs % 4 = 1 THEN 'lib-002'
    WHEN gs % 4 = 2 THEN 'lib-003'
    ELSE 'lib-004'
  END as library_id,
  (NOW() - INTERVAL '10 days' - (RANDOM() * INTERVAL '5 days'))::date as loan_date,
  (NOW() - INTERVAL '10 days' - (RANDOM() * INTERVAL '5 days') + INTERVAL '14 days')::date as due_date,
  'aberto' as status,
  NOW() - INTERVAL '10 days' - (RANDOM() * INTERVAL '5 days') as created_at
FROM generate_series(1, 25) gs
ON CONFLICT (id) DO NOTHING;

-- Empréstimos em atraso (vencidos - 12 registros)
INSERT INTO loans (id, user_id, copy_id, library_id, loan_date, due_date, status, created_at)
SELECT 
  'loan-overdue-' || LPAD(gs::text, 6, '0') as id,
  'user-' || LPAD(((gs - 1) % 30 + 1)::text, 3, '0') as user_id,
  'copy-' || LPAD(((gs - 1) % 150 + 1)::text, 6, '0') as copy_id,
  CASE 
    WHEN gs % 3 = 0 THEN 'lib-001'
    WHEN gs % 3 = 1 THEN 'lib-002'
    ELSE 'lib-003'
  END as library_id,
  (NOW() - INTERVAL '20 days' - (RANDOM() * INTERVAL '10 days'))::date as loan_date,
  (NOW() - INTERVAL '5 days' - (RANDOM() * INTERVAL '3 days'))::date as due_date,
  'aberto' as status,
  NOW() - INTERVAL '20 days' - (RANDOM() * INTERVAL '10 days') as created_at
FROM generate_series(1, 12) gs
ON CONFLICT (id) DO NOTHING;

-- Atualizar status dos exemplares que estão emprestados
UPDATE copies 
SET status = 'emprestado' 
WHERE id IN (
  SELECT copy_id FROM loans WHERE status = 'aberto'
);

-- Atualizar status dos exemplares que estão em manutenção (alguns aleatórios)
UPDATE copies 
SET status = 'manutencao' 
WHERE id IN (
  SELECT id FROM copies WHERE code LIKE '%5' OR code LIKE '%0' LIMIT 20
) AND status != 'emprestado';

