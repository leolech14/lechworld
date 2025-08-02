-- Final setup for local database

-- Create airlines (loyalty programs)
INSERT INTO airlines (code, name, program_name, category, transfer_enabled, created_at) VALUES
('LA', 'LATAM Airlines', 'LATAM Pass', 'airline', false, NOW()),
('G3', 'GOL', 'Smiles', 'airline', false, NOW()),
('AD', 'Azul', 'TudoAzul', 'airline', false, NOW()),
('AA', 'American Airlines', 'AAdvantage', 'airline', false, NOW()),
('TK', 'Turkish Airlines', 'Miles&Smiles', 'airline', false, NOW()),
('CM', 'Copa Airlines', 'ConnectMiles', 'airline', false, NOW())
ON CONFLICT (code) DO NOTHING;

-- Add missing columns to family_members
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create family members
INSERT INTO family_members (name, email, role, user_id, is_active) VALUES
('Osvandré', 'osvandre@lech.world', 'primary', (SELECT id FROM users WHERE username = 'osvandre'), true),
('Marilise', 'marilise@lech.world', 'primary', (SELECT id FROM users WHERE username = 'marilise'), true),
('Graciela', 'graciela@lech.world', 'extended', (SELECT id FROM users WHERE username = 'graciela'), true),
('Leonardo', 'leonardo@lech.world', 'extended', (SELECT id FROM users WHERE username = 'leonardo'), true)
ON CONFLICT DO NOTHING;

-- Update family_member_id in users table
UPDATE users u 
SET family_member_id = fm.id 
FROM family_members fm 
WHERE fm.user_id = u.id;