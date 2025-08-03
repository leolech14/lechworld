-- Add missing columns to family_members table

ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS profile_photo TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS birthdate DATE,
ADD COLUMN IF NOT EXISTS frame_color TEXT,
ADD COLUMN IF NOT EXISTS frame_border_color TEXT,
ADD COLUMN IF NOT EXISTS profile_emoji TEXT;