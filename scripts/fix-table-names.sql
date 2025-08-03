-- Fix table name mismatch - rename loyalty_programs to airlines
-- and update foreign key references

-- First, drop the view that depends on loyalty_programs
DROP VIEW IF EXISTS dashboard_view;

-- Drop the function that depends on loyalty_programs
DROP FUNCTION IF EXISTS get_dashboard_data(INTEGER, INTEGER);

-- Rename the table
ALTER TABLE loyalty_programs RENAME TO airlines;

-- Rename the sequence
ALTER SEQUENCE loyalty_programs_id_seq RENAME TO airlines_id_seq;

-- Update foreign key constraint names in member_programs
ALTER TABLE member_programs 
  DROP CONSTRAINT member_programs_program_id_fkey,
  ADD CONSTRAINT member_programs_airline_id_fkey 
    FOREIGN KEY (program_id) REFERENCES airlines(id) ON DELETE CASCADE;

-- Rename the column in member_programs to match schema
ALTER TABLE member_programs 
  RENAME COLUMN program_id TO airline_id;

-- Add missing columns to airlines table
ALTER TABLE airlines
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS transfer_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_transfer_amount INTEGER,
  ADD COLUMN IF NOT EXISTS transfer_fee_type TEXT,
  ADD COLUMN IF NOT EXISTS transfer_fee_amount INTEGER,
  ADD COLUMN IF NOT EXISTS transfer_fee_points INTEGER,
  ADD COLUMN IF NOT EXISTS transfer_delay_hours INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expiration_months INTEGER,
  ADD COLUMN IF NOT EXISTS extendable_on_activity BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_wallet_supported BOOLEAN DEFAULT false;

-- Rename columns to match schema
ALTER TABLE airlines
  RENAME COLUMN airline_code TO code;

-- Add unique constraint on code
ALTER TABLE airlines 
  ADD CONSTRAINT airlines_code_unique UNIQUE (code);

-- Update airline codes based on names
UPDATE airlines SET code = 
  CASE 
    WHEN name = 'American Airlines' THEN 'AA'
    WHEN name = 'United Airlines' THEN 'UA'
    WHEN name = 'Delta' THEN 'DL'
    WHEN name = 'LATAM' THEN 'LA'
    WHEN name = 'Avianca' THEN 'AV'
    WHEN name = 'Azul' THEN 'AD'
    WHEN name = 'IHG' THEN 'IHG'
    WHEN name = 'Marriott' THEN 'MAR'
    WHEN name = 'Hilton' THEN 'HH'
    ELSE UPPER(LEFT(name, 3))
  END
WHERE code IS NULL;

-- Rename program_name column if it exists
ALTER TABLE airlines
  RENAME COLUMN name TO program_name;

-- Add name column based on airline
ALTER TABLE airlines
  ADD COLUMN name TEXT;

UPDATE airlines SET name = 
  CASE code
    WHEN 'AA' THEN 'American Airlines'
    WHEN 'UA' THEN 'United Airlines'
    WHEN 'DL' THEN 'Delta Air Lines'
    WHEN 'LA' THEN 'LATAM Airlines'
    WHEN 'AV' THEN 'Avianca'
    WHEN 'AD' THEN 'Azul Brazilian Airlines'
    WHEN 'IHG' THEN 'IHG Hotels'
    WHEN 'MAR' THEN 'Marriott International'
    WHEN 'HH' THEN 'Hilton Hotels'
    ELSE program_name
  END;

-- Fix member_programs columns to match schema
ALTER TABLE member_programs
  RENAME COLUMN account_number TO member_number;
  
ALTER TABLE member_programs
  RENAME COLUMN points_balance TO current_miles;

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

-- Rename status to status_level if needed
UPDATE member_programs 
SET status_level = status 
WHERE status_level IS NULL AND status IS NOT NULL;

ALTER TABLE member_programs DROP COLUMN IF EXISTS status;

-- Recreate the view with correct table names
CREATE OR REPLACE VIEW dashboard_view AS
SELECT 
    fm.id as member_id,
    fm.name as member_name,
    fm.email as member_email,
    a.program_name,
    a.type as program_type,
    a.code as airline_code,
    mp.current_miles as points_balance,
    mp.status_level as status,
    mp.expiry_date,
    a.mile_value_brl,
    (mp.current_miles * a.mile_value_brl) as value_brl,
    f.id as family_id,
    f.name as family_name
FROM member_programs mp
JOIN family_members fm ON fm.id = mp.member_id
JOIN airlines a ON a.id = mp.airline_id
JOIN families f ON f.id = fm.family_id;

-- Recreate the dashboard function with correct table/column names
CREATE OR REPLACE FUNCTION get_dashboard_data(
    p_user_id INTEGER,
    p_activity_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    total_points BIGINT,
    total_value NUMERIC,
    programs_count BIGINT,
    members_count BIGINT,
    expiring_soon_count BIGINT,
    member_totals JSONB,
    program_totals JSONB,
    recent_activities JSONB
) AS $$
DECLARE
    v_family_id INTEGER;
BEGIN
    -- Get the user's family_id
    SELECT family_id INTO v_family_id
    FROM users
    WHERE id = p_user_id;
    
    -- If no family_id, return empty results
    IF v_family_id IS NULL THEN
        RETURN QUERY
        SELECT 
            0::BIGINT,
            0::NUMERIC,
            0::BIGINT,
            0::BIGINT,
            0::BIGINT,
            '[]'::JSONB,
            '[]'::JSONB,
            '[]'::JSONB;
        RETURN;
    END IF;
    
    RETURN QUERY
    WITH family_data AS (
        SELECT 
            mp.member_id,
            fm.name as member_name,
            a.id as program_id,
            a.program_name,
            a.type as program_type,
            mp.current_miles as points_balance,
            a.mile_value_brl,
            mp.expiry_date,
            mp.updated_at
        FROM member_programs mp
        JOIN family_members fm ON fm.id = mp.member_id
        JOIN airlines a ON a.id = mp.airline_id
        WHERE fm.family_id = v_family_id
    )
    SELECT 
        -- Total points
        COALESCE(SUM(fd.points_balance), 0)::BIGINT,
        
        -- Total value in BRL
        COALESCE(SUM(fd.points_balance * fd.mile_value_brl), 0)::NUMERIC,
        
        -- Programs count
        COUNT(DISTINCT fd.program_id)::BIGINT,
        
        -- Members count
        COUNT(DISTINCT fd.member_id)::BIGINT,
        
        -- Expiring soon count (within 90 days)
        COUNT(DISTINCT CASE 
            WHEN fd.expiry_date <= CURRENT_DATE + INTERVAL '90 days' 
            THEN fd.program_id 
        END)::BIGINT,
        
        -- Member totals
        COALESCE(
            (SELECT jsonb_agg(member_summary ORDER BY total_points DESC)
             FROM (
                 SELECT 
                     member_name,
                     SUM(points_balance) as total_points,
                     SUM(points_balance * mile_value_brl) as total_value
                 FROM family_data
                 GROUP BY member_id, member_name
             ) member_summary),
            '[]'::JSONB
        ),
        
        -- Program totals
        COALESCE(
            (SELECT jsonb_agg(program_summary ORDER BY total_points DESC)
             FROM (
                 SELECT 
                     program_name,
                     program_type,
                     SUM(points_balance) as total_points,
                     SUM(points_balance * mile_value_brl) as total_value,
                     COUNT(DISTINCT member_id) as members_count
                 FROM family_data
                 GROUP BY program_id, program_name, program_type
             ) program_summary),
            '[]'::JSONB
        ),
        
        -- Recent activities (limited)
        COALESCE(
            (SELECT jsonb_agg(activity ORDER BY updated_at DESC)
             FROM (
                 SELECT 
                     member_name,
                     program_name,
                     points_balance,
                     updated_at
                 FROM family_data
                 ORDER BY updated_at DESC
                 LIMIT p_activity_limit
             ) activity),
            '[]'::JSONB
        )
    FROM family_data fd;
END;
$$ LANGUAGE plpgsql;