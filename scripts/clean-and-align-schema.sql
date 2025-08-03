-- Clean and align database schema with application expectations

BEGIN;

-- Drop dependent objects first
DROP VIEW IF EXISTS dashboard_view CASCADE;
DROP FUNCTION IF EXISTS get_dashboard_data CASCADE;

-- 1. Rename loyalty_programs to airlines
ALTER TABLE IF EXISTS loyalty_programs RENAME TO airlines;

-- 2. Rename the sequence
ALTER SEQUENCE IF EXISTS loyalty_programs_id_seq RENAME TO airlines_id_seq;

-- 3. Fix column names in airlines table
ALTER TABLE airlines 
  RENAME COLUMN airline_code TO code;

-- 4. Add missing columns to airlines table
ALTER TABLE airlines
  ADD COLUMN IF NOT EXISTS program_name TEXT,
  ADD COLUMN IF NOT EXISTS transfer_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_transfer_amount INTEGER,
  ADD COLUMN IF NOT EXISTS transfer_fee_type TEXT,
  ADD COLUMN IF NOT EXISTS transfer_fee_amount INTEGER,
  ADD COLUMN IF NOT EXISTS transfer_fee_points INTEGER,
  ADD COLUMN IF NOT EXISTS transfer_delay_hours INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expiration_months INTEGER,
  ADD COLUMN IF NOT EXISTS extendable_on_activity BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_wallet_supported BOOLEAN DEFAULT false;

-- 5. Set program_name from name column
UPDATE airlines SET program_name = name WHERE program_name IS NULL;

-- 6. Update airline names to be company names
UPDATE airlines SET name = 
  CASE 
    WHEN name = 'AAdvantage' THEN 'American Airlines'
    WHEN name = 'MileagePlus' THEN 'United Airlines'
    WHEN name = 'SkyMiles' THEN 'Delta Air Lines'
    WHEN name = 'LATAM Pass' THEN 'LATAM Airlines'
    WHEN name = 'LifeMiles' THEN 'Avianca'
    WHEN name = 'TudoAzul' THEN 'Azul Brazilian Airlines'
    WHEN name = 'IHG One Rewards' THEN 'IHG Hotels'
    WHEN name = 'Bonvoy' THEN 'Marriott International'
    WHEN name = 'Hilton Honors' THEN 'Hilton Hotels'
    ELSE name
  END;

-- 7. Update codes to standard airline codes
UPDATE airlines SET code = 
  CASE 
    WHEN program_name = 'AAdvantage' THEN 'AA'
    WHEN program_name = 'MileagePlus' THEN 'UA'
    WHEN program_name = 'SkyMiles' THEN 'DL'
    WHEN program_name = 'LATAM Pass' THEN 'LA'
    WHEN program_name = 'LifeMiles' THEN 'AV'
    WHEN program_name = 'TudoAzul' THEN 'AD'
    WHEN program_name = 'IHG One Rewards' THEN 'IHG'
    WHEN program_name = 'Bonvoy' THEN 'MAR'
    WHEN program_name = 'Hilton Honors' THEN 'HH'
    ELSE COALESCE(code, UPPER(LEFT(program_name, 3)))
  END
WHERE code IS NULL OR code = '';

-- 8. Fix member_programs table columns
ALTER TABLE member_programs 
  RENAME COLUMN program_id TO airline_id;

ALTER TABLE member_programs
  RENAME COLUMN points_balance TO current_miles;

-- Only rename if column exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'member_programs' AND column_name = 'account_number') THEN
    ALTER TABLE member_programs RENAME COLUMN account_number TO member_number;
  END IF;
END $$;

-- 9. Add missing columns to member_programs
ALTER TABLE member_programs
  ADD COLUMN IF NOT EXISTS status_level TEXT,
  ADD COLUMN IF NOT EXISTS lifetime_miles INTEGER,
  ADD COLUMN IF NOT EXISTS pin TEXT,
  ADD COLUMN IF NOT EXISTS document_number TEXT,
  ADD COLUMN IF NOT EXISTS document_type TEXT,
  ADD COLUMN IF NOT EXISTS google_wallet_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_sync_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS sync_method TEXT,
  ADD COLUMN IF NOT EXISTS account_password TEXT,
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb;

-- 10. Move status to status_level
UPDATE member_programs SET status_level = status WHERE status_level IS NULL AND status IS NOT NULL;
ALTER TABLE member_programs DROP COLUMN IF EXISTS status;

-- 11. Fix foreign key constraints
ALTER TABLE member_programs 
  DROP CONSTRAINT IF EXISTS member_programs_program_id_fkey;

ALTER TABLE member_programs
  ADD CONSTRAINT member_programs_airline_id_fkey 
    FOREIGN KEY (airline_id) REFERENCES airlines(id) ON DELETE CASCADE;

-- 12. Add unique constraint on airline code
ALTER TABLE airlines 
  DROP CONSTRAINT IF EXISTS airlines_code_unique;
  
ALTER TABLE airlines 
  ADD CONSTRAINT airlines_code_unique UNIQUE (code);

-- 13. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_member_programs_airline_id ON member_programs(airline_id);
CREATE INDEX IF NOT EXISTS idx_airlines_code ON airlines(code);

-- 14. Create missing tables
CREATE TABLE IF NOT EXISTS mile_transactions (
    id SERIAL PRIMARY KEY,
    member_program_id INTEGER REFERENCES member_programs(id) NOT NULL,
    miles INTEGER NOT NULL,
    description TEXT NOT NULL,
    transaction_date DATE NOT NULL,
    expiration_date DATE,
    source TEXT NOT NULL,
    reference_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mile_transactions_member_program ON mile_transactions(member_program_id);
CREATE INDEX IF NOT EXISTS idx_mile_transactions_expiration ON mile_transactions(expiration_date);

CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL UNIQUE,
    email_enabled BOOLEAN DEFAULT true,
    email_frequency TEXT DEFAULT 'weekly',
    expiration_alert_days INTEGER DEFAULT 90,
    whatsapp_enabled BOOLEAN DEFAULT false,
    whatsapp_number TEXT,
    push_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMIT;