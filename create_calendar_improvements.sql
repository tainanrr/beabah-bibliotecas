-- =============================================================================
-- Melhorias no Sistema de Calendário - Turnos, Feriados e Agenda Prevista
-- =============================================================================

-- 1. Tabela para definir os turnos padrão do sistema
CREATE TABLE IF NOT EXISTS shift_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- 'morning', 'afternoon', 'evening'
  label TEXT NOT NULL, -- 'Manhã', 'Tarde', 'Noite'
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir turnos padrão
INSERT INTO shift_definitions (name, label, start_time, end_time, display_order) VALUES
  ('morning', 'Manhã', '08:00:00', '12:00:00', 1),
  ('afternoon', 'Tarde', '13:00:00', '18:00:00', 2),
  ('evening', 'Noite', '18:00:00', '22:00:00', 3)
ON CONFLICT (name) DO NOTHING;

-- 2. Tabela para configurar horários previstos de abertura por biblioteca
-- Define quais dias da semana e turnos cada biblioteca deveria abrir
CREATE TABLE IF NOT EXISTS library_expected_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Dom, 1=Seg, ..., 6=Sab
  shift_name TEXT NOT NULL DEFAULT 'morning' CHECK (shift_name IN ('morning', 'afternoon', 'evening')),
  is_open BOOLEAN DEFAULT true, -- Se a biblioteca deveria abrir neste dia/turno
  custom_start_time TIME, -- Horário customizado de início (opcional)
  custom_end_time TIME, -- Horário customizado de fim (opcional)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users_profile(id),
  UNIQUE(library_id, day_of_week, shift_name)
);

-- 3. Tabela para cadastro de feriados
CREATE TABLE IF NOT EXISTS holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  recurring BOOLEAN DEFAULT false, -- Se o feriado se repete todo ano (ignora o ano)
  national BOOLEAN DEFAULT true, -- Feriado nacional
  library_id UUID REFERENCES libraries(id) ON DELETE CASCADE, -- NULL = todas as bibliotecas
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users_profile(id)
);

-- Inserir feriados nacionais padrão (2024-2030)
INSERT INTO holidays (name, date, recurring, national) VALUES
  ('Confraternização Universal', '2026-01-01', true, true),
  ('Carnaval', '2026-03-02', false, true),
  ('Carnaval', '2026-03-03', false, true),
  ('Sexta-feira Santa', '2026-04-03', false, true),
  ('Tiradentes', '2026-04-21', true, true),
  ('Dia do Trabalho', '2026-05-01', true, true),
  ('Corpus Christi', '2026-06-04', false, true),
  ('Independência do Brasil', '2026-09-07', true, true),
  ('Nossa Senhora Aparecida', '2026-10-12', true, true),
  ('Finados', '2026-11-02', true, true),
  ('Proclamação da República', '2026-11-15', true, true),
  ('Natal', '2026-12-25', true, true)
ON CONFLICT DO NOTHING;

-- 4. Modificar a tabela library_opening_log para suportar turnos
-- Primeiro verificar se a coluna já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'library_opening_log' AND column_name = 'shift_name'
  ) THEN
    ALTER TABLE library_opening_log ADD COLUMN shift_name TEXT DEFAULT 'full_day';
  END IF;
END $$;

-- Adicionar constraint para shift_name na library_opening_log
-- Valores possíveis: 'morning', 'afternoon', 'evening', 'full_day'
DO $$
BEGIN
  -- Remover constraint antiga se existir
  ALTER TABLE library_opening_log DROP CONSTRAINT IF EXISTS library_opening_log_shift_check;
  
  -- Adicionar nova constraint
  ALTER TABLE library_opening_log ADD CONSTRAINT library_opening_log_shift_check 
    CHECK (shift_name IN ('morning', 'afternoon', 'evening', 'full_day'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Atualizar constraint de unicidade para incluir shift_name
DO $$
BEGIN
  -- Dropar constraint antiga se existir
  ALTER TABLE library_opening_log DROP CONSTRAINT IF EXISTS library_opening_log_library_id_date_key;
  
  -- Criar nova constraint única incluindo shift_name
  ALTER TABLE library_opening_log ADD CONSTRAINT library_opening_log_library_date_shift_key 
    UNIQUE (library_id, date, shift_name);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 5. Habilitar RLS nas novas tabelas
ALTER TABLE shift_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_expected_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para shift_definitions
DROP POLICY IF EXISTS "Todos podem ver turnos" ON shift_definitions;
CREATE POLICY "Todos podem ver turnos" ON shift_definitions
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admin pode gerenciar turnos" ON shift_definitions;
CREATE POLICY "Admin pode gerenciar turnos" ON shift_definitions
  FOR ALL USING (true);

-- Políticas RLS para library_expected_schedule
DROP POLICY IF EXISTS "Todos podem ver agenda prevista" ON library_expected_schedule;
CREATE POLICY "Todos podem ver agenda prevista" ON library_expected_schedule
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin e bibliotecários podem gerenciar agenda" ON library_expected_schedule;
CREATE POLICY "Admin e bibliotecários podem gerenciar agenda" ON library_expected_schedule
  FOR ALL USING (true);

-- Políticas RLS para holidays
DROP POLICY IF EXISTS "Todos podem ver feriados" ON holidays;
CREATE POLICY "Todos podem ver feriados" ON holidays
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admin pode gerenciar feriados" ON holidays;
CREATE POLICY "Admin pode gerenciar feriados" ON holidays
  FOR ALL USING (true);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_expected_schedule_library ON library_expected_schedule(library_id);
CREATE INDEX IF NOT EXISTS idx_expected_schedule_day ON library_expected_schedule(day_of_week);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_library ON holidays(library_id);
CREATE INDEX IF NOT EXISTS idx_opening_log_shift ON library_opening_log(shift_name);

-- Comentários nas tabelas
COMMENT ON TABLE shift_definitions IS 'Definições dos turnos padrão do sistema (manhã, tarde, noite)';
COMMENT ON TABLE library_expected_schedule IS 'Agenda prevista de abertura por biblioteca (dias da semana e turnos)';
COMMENT ON TABLE holidays IS 'Cadastro de feriados nacionais e locais';

-- =============================================================================
-- RESULTADO
-- =============================================================================
SELECT '✅ Tabelas de melhorias do calendário criadas com sucesso!' AS status;
