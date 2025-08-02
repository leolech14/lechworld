-- Add new profile fields to family_members table
ALTER TABLE family_members 
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS birthdate VARCHAR(10),
ADD COLUMN IF NOT EXISTS frame_color VARCHAR(7) DEFAULT '#FED7E2',
ADD COLUMN IF NOT EXISTS frame_border_color VARCHAR(7) DEFAULT '#F687B3',
ADD COLUMN IF NOT EXISTS profile_emoji VARCHAR(10) DEFAULT '👤';

-- Verify the columns were added
SELECT column_name, data_type, character_maximum_length, column_default
FROM information_schema.columns
WHERE table_name = 'family_members'
ORDER BY ordinal_position;