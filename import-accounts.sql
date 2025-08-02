-- Import Real Loyalty Program Account Data
-- Run this after creating family members and loyalty programs

-- First, let's create a temporary function to get IDs
CREATE OR REPLACE FUNCTION get_member_id(member_name TEXT) RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT id FROM family_members WHERE LOWER(name) = LOWER(member_name) LIMIT 1);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_program_id(program_name TEXT) RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT id FROM loyalty_programs WHERE name LIKE '%' || program_name || '%' OR company LIKE '%' || program_name || '%' LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- LATAM Pass accounts
INSERT INTO member_programs (member_id, program_id, account_number, login, site_password, miles_password, points_balance, elite_tier, notes, last_updated, is_active)
VALUES
(get_member_id('Osvandré'), get_program_id('LATAM'), '20493592091', '20493592091', 'L1e2c3h4', 'L1e2c3h4', 44578, 'PLATINUM', NULL, '2025-07-07', true),
(get_member_id('Marilise'), get_program_id('LATAM'), '47616237053', '47616237053', 'M1@2r3i4', 'M1@2r3i4', 59699, 'GOLD', NULL, '2025-07-17', true),
(get_member_id('Graciela'), get_program_id('LATAM'), '02424404011', '02424404011', NULL, 'Graciela2019', 10565, 'MULTIPLUS', 'nenhuma das senhas deu certo', NOW(), true),
(get_member_id('Leonardo'), get_program_id('LATAM'), '02424403040', '02424403040', 'Leo140195', 'Leo140195', 10814, 'MULTIPLUS', NULL, '2025-07-07', true);

-- GOL/Smiles accounts
INSERT INTO member_programs (member_id, program_id, account_number, login, site_password, miles_password, points_balance, elite_tier, notes, last_updated, is_active)
VALUES
(get_member_id('Osvandré'), get_program_id('Smiles'), '001827136', '001827136', 'M1a2r3i4#', '2049', 252713, 'DIAMANTE', NULL, '2025-07-07', true),
(get_member_id('Marilise'), get_program_id('Smiles'), '001106910', '001106910', NULL, '4736', 30109, 'PRATA', NULL, NOW(), true),
(get_member_id('Graciela'), get_program_id('Smiles'), '226446080', '226446080', NULL, '2419', 26953, NULL, NULL, NOW(), true),
(get_member_id('Leonardo'), get_program_id('Smiles'), '226446264', '226446264', NULL, '3040', 5888, NULL, NULL, NOW(), true);

-- Turkish Airlines accounts
INSERT INTO member_programs (member_id, program_id, account_number, login, site_password, miles_password, points_balance, elite_tier, notes, last_updated, is_active)
VALUES
(get_member_id('Osvandré'), get_program_id('Turkish'), '164786073', '164786073', '122436', '122436', 0, NULL, NULL, '2025-07-07', true),
(get_member_id('Marilise'), get_program_id('Turkish'), '382486138', '382486138', '122436', '122436', 0, NULL, NULL, '2025-07-07', true);

-- American Airlines accounts
INSERT INTO member_programs (member_id, program_id, account_number, login, site_password, miles_password, points_balance, elite_tier, notes, last_updated, is_active)
VALUES
(get_member_id('Osvandré'), get_program_id('American'), '48U8B80', '48U8B80', '122436', NULL, 0, NULL, NULL, NOW(), true),
(get_member_id('Marilise'), get_program_id('American'), '49U6B98', '49U6B98', '122436', NULL, 0, NULL, NULL, NOW(), true),
(get_member_id('Leonardo'), get_program_id('American'), '069MX2', '069MX2', '122436', NULL, 0, NULL, NULL, NOW(), true);

-- Copa Airlines account
INSERT INTO member_programs (member_id, program_id, account_number, login, site_password, miles_password, points_balance, elite_tier, notes, last_updated, is_active)
VALUES
(get_member_id('Osvandré'), get_program_id('Copa'), '294500664', '294500664', 'Ol122436#', '2436', 0, NULL, NULL, '2025-07-07', true);

-- Azul accounts
INSERT INTO member_programs (member_id, program_id, account_number, login, site_password, miles_password, points_balance, elite_tier, notes, last_updated, is_active)
VALUES
(get_member_id('Osvandré'), get_program_id('Azul'), '5110011922', '5110011922', 'ol122436', NULL, 11114, 'DIAMANTE', NULL, '2025-07-07', true),
(get_member_id('Marilise'), get_program_id('Azul'), '4450011793', '4450011793', 'apiot30', NULL, 24437, 'SAFIRA', NULL, '2025-07-07', true),
(get_member_id('Graciela'), get_program_id('Azul'), '4270015190', '4270015190', 'marilise45', NULL, 4478, NULL, NULL, '2025-07-07', true),
(get_member_id('Leonardo'), get_program_id('Azul'), '2960015746', '2960015746', 'osvandre55', NULL, 285, NULL, NULL, '2025-07-07', true);

-- Update estimated values for all member programs
UPDATE member_programs mp
SET estimated_value = (
    SELECT 
        'R$ ' || TO_CHAR((mp.points_balance * CAST(lp.point_value AS NUMERIC)), 'FM999,999.00')
    FROM loyalty_programs lp
    WHERE lp.id = mp.program_id
)
WHERE mp.points_balance > 0;

-- Clean up temporary functions
DROP FUNCTION IF EXISTS get_member_id(TEXT);
DROP FUNCTION IF EXISTS get_program_id(TEXT);

-- Show summary
SELECT 
    fm.name as "Member",
    lp.name as "Program",
    mp.points_balance as "Points",
    mp.estimated_value as "Value (BRL)",
    mp.elite_tier as "Status"
FROM member_programs mp
JOIN family_members fm ON mp.member_id = fm.id
JOIN loyalty_programs lp ON mp.program_id = lp.id
ORDER BY fm.name, lp.name;