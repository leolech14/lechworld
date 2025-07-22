-- Add icon_url column to loyalty_programs table
ALTER TABLE loyalty_programs 
ADD COLUMN IF NOT EXISTS icon_url TEXT DEFAULT NULL;