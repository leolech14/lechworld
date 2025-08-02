-- Supabase schema for lechworld
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE family_members (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loyalty_programs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  logo_color VARCHAR(7) DEFAULT '#000000',
  website VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE member_programs (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES family_members(id) ON DELETE CASCADE,
  program_id INTEGER REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  account_number VARCHAR(255),
  login VARCHAR(255),
  password VARCHAR(255),
  cpf VARCHAR(14),
  points_balance INTEGER DEFAULT 0,
  elite_tier VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(member_id, program_id)
);

CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_member_programs_member_id ON member_programs(member_id);
CREATE INDEX idx_member_programs_program_id ON member_programs(program_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read on users for login"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage their family members"
  ON family_members FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read for loyalty programs"
  ON loyalty_programs FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add programs"
  ON loyalty_programs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users manage their member programs"
  ON member_programs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.id = member_programs.member_id
        AND fm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.id = member_programs.member_id
        AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users manage their activity logs"
  ON activity_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
