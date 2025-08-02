-- Setup local database with all required changes

-- Add username column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
ALTER TABLE users ADD COLUMN IF NOT EXISTS family_member_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

-- Make password nullable for first-time login
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Create case-insensitive index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_ci ON users (LOWER(username));

-- Create the 5 users
INSERT INTO users (username, email, name, role, is_first_login) VALUES
('leonardo', 'leonardo@lech.world', 'Leonardo', 'member', true),
('graciela', 'graciela@lech.world', 'Graciela', 'member', true),
('osvandre', 'osvandre@lech.world', 'Osvandré', 'member', true),
('marilise', 'marilise@lech.world', 'Marilise', 'member', true),
('denise', 'denise@lech.world', 'Denise', 'staff', true)
ON CONFLICT (username) DO NOTHING;

-- Create family members if they don't exist
INSERT INTO family_members (name, email, role, is_active) VALUES
('Osvandré', 'osvandre@lech.world', 'primary', true),
('Marilise', 'marilise@lech.world', 'primary', true),
('Graciela', 'graciela@lech.world', 'extended', true),
('Leonardo', 'leonardo@lech.world', 'extended', true)
ON CONFLICT DO NOTHING;

-- Link users to family members
UPDATE users u 
SET family_member_id = fm.id 
FROM family_members fm 
WHERE LOWER(u.username) = LOWER(REPLACE(fm.name, 'é', 'e'))
AND u.username IN ('leonardo', 'graciela', 'osvandre', 'marilise');

-- Add missing columns to member_programs
ALTER TABLE member_programs ADD COLUMN IF NOT EXISTS site_password TEXT;
ALTER TABLE member_programs ADD COLUMN IF NOT EXISTS miles_password TEXT;
ALTER TABLE member_programs ADD COLUMN IF NOT EXISTS last_updated_by INTEGER REFERENCES users(id);

-- Create loyalty programs
INSERT INTO loyalty_programs (name, company, code, program_type, category, point_value, is_active) VALUES
('LATAM Pass', 'LATAM Airlines', 'LA', 'miles', 'airline', '0.030', true),
('Smiles', 'GOL', 'G3', 'miles', 'airline', '0.025', true),
('TudoAzul', 'Azul', 'AD', 'miles', 'airline', '0.028', true),
('AAdvantage', 'American Airlines', 'AA', 'miles', 'airline', '0.040', true),
('Miles&Smiles', 'Turkish Airlines', 'TK', 'miles', 'airline', '0.035', true),
('ConnectMiles', 'Copa Airlines', 'CM', 'miles', 'airline', '0.032', true)
ON CONFLICT DO NOTHING;