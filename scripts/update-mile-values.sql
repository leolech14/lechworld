-- Update mile values for specific airlines
-- Values are per single mile (divide by 1000 from the per-thousand values)

-- Example: Update LATAM Pass to R$40 per 1000 miles
UPDATE airlines SET mile_value_brl = 0.040 WHERE program_name = 'LATAM Pass';

-- Example: Update Smiles to R$30 per 1000 miles
UPDATE airlines SET mile_value_brl = 0.030 WHERE program_name = 'Smiles';

-- Example: Update multiple at once
UPDATE airlines 
SET mile_value_brl = CASE
    WHEN program_name = 'LATAM Pass' THEN 0.040       -- R$40 per 1000
    WHEN program_name = 'Smiles' THEN 0.030           -- R$30 per 1000
    WHEN program_name = 'TudoAzul' THEN 0.035         -- R$35 per 1000
    ELSE mile_value_brl  -- Keep current value
END
WHERE program_name IN ('LATAM Pass', 'Smiles', 'TudoAzul');

-- View current values
SELECT program_name, 
       mile_value_brl,
       mile_value_brl * 1000 as value_per_thousand
FROM airlines
ORDER BY program_name;