-- Add mile_value_brl column to airlines table
ALTER TABLE airlines ADD COLUMN IF NOT EXISTS mile_value_brl DECIMAL(10,6);
ALTER TABLE airlines ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'airline';

-- Update mile values for each airline in BRL
UPDATE airlines SET mile_value_brl = CASE
    WHEN code = 'LA' THEN 0.030  -- LATAM Pass
    WHEN code = 'G3' THEN 0.025  -- Smiles/GOL
    WHEN code = 'AD' THEN 0.028  -- TudoAzul/Azul
    WHEN code = 'AA' THEN 0.040  -- AAdvantage/American
    WHEN code = 'TK' THEN 0.035  -- Miles&Smiles/Turkish
    WHEN code = 'CM' THEN 0.032  -- ConnectMiles/Copa
    ELSE 0.030  -- Default value
END;