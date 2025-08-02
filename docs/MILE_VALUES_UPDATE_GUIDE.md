# Mile Values Update Guide

## Overview

Mile values (BRL per 1000 miles) are stored in the database in the `airlines.mile_value_brl` column. These values are used to calculate the total estimated value of all miles across programs.

## Current Storage Location

- **Database Table**: `airlines`
- **Column**: `mile_value_brl` (stores value per single mile)
- **Format**: Decimal value (e.g., 0.035 = R$35 per 1000 miles)

## How to Update Values

### Option 1: Using the TypeScript Helper Script

1. Edit the values in `scripts/update-mile-values-helper.ts`:
```typescript
const newValues: Record<string, number> = {
  'LATAM Pass': 40.00,        // New value: R$40 per 1000 miles
  'Smiles': 30.00,            // New value: R$30 per 1000 miles
  // ... add more as needed
};
```

2. Run the script:
```bash
npx tsx scripts/update-mile-values-helper.ts
```

### Option 2: Direct SQL Update

1. For a single airline:
```sql
UPDATE airlines 
SET mile_value_brl = 0.040 
WHERE program_name = 'LATAM Pass';
```

2. For multiple airlines:
```sql
UPDATE airlines 
SET mile_value_brl = CASE
    WHEN program_name = 'LATAM Pass' THEN 0.040
    WHEN program_name = 'Smiles' THEN 0.030
    WHEN program_name = 'TudoAzul' THEN 0.035
    ELSE mile_value_brl
END
WHERE program_name IN ('LATAM Pass', 'Smiles', 'TudoAzul');
```

### Option 3: Through Application UI (Future Feature)

A settings page will be implemented to allow admins to update these values through the UI.

## Important Notes

1. **Value Format**: The database stores values per single mile. To set R$35 per 1000 miles, use 0.035.

2. **Calculation**: The system automatically multiplies by each program's total miles to calculate the estimated value.

3. **Real-time Updates**: Changes take effect immediately - no server restart required.

4. **Validation**: Ensure values are reasonable (typically between R$15-50 per 1000 miles for airline programs).

## Current Values Reference

As of last update:
- LATAM Pass: R$35/1000 miles
- Smiles: R$25/1000 miles
- TudoAzul: R$30/1000 miles
- AAdvantage: R$45/1000 miles
- United MileagePlus: R$50/1000 miles
- TAP Miles&Go: R$40/1000 miles

## Where Values Are Used

1. **Dashboard API** (`/api/dashboard`): Calculates total estimated value
2. **Stats Cards**: Displays "Valor Estimado" with proper BRL formatting
3. **Future**: Export reports, analytics, and notifications

## Best Practices

1. **Research Current Market**: Check current mile trading values before updating
2. **Update Regularly**: Mile values fluctuate with promotions and market conditions
3. **Document Changes**: Keep a log of value changes for auditing
4. **Test After Updates**: Verify the dashboard shows correct calculations