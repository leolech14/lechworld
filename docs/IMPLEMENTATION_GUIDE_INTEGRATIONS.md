# LechWorld Integration Implementation Guide

> Last Updated: 2025-01-28
> Version: 1.0.0
> Purpose: Technical implementation guide for airline program integrations

## 🎯 Quick Implementation Priorities

Based on research, here's the recommended implementation order:

### Phase 1: Enhanced Program Knowledge (1-2 weeks)
1. Update database schema to store new credential types
2. Add mile transfer cost calculator
3. Implement Google Wallet integration helpers
4. Create program-specific documentation in-app

### Phase 2: Semi-Automated Updates (2-3 weeks)
1. Email parsing for statement processing
2. Manual balance update with history tracking
3. Google Wallet QR code scanner
4. Transfer cost optimization calculator

### Phase 3: Real-time Integration (1-2 months)
1. Partner API integrations (start with Smiles)
2. Automated balance synchronization
3. Push notifications for balance changes
4. Webhook infrastructure

---

## 📊 Database Schema Updates

Add these fields to the existing schema:

```sql
-- Update member_programs table
ALTER TABLE member_programs ADD COLUMN member_number VARCHAR(20);
ALTER TABLE member_programs ADD COLUMN pin VARCHAR(10);
ALTER TABLE member_programs ADD COLUMN document_number VARCHAR(20); -- CPF/RUT/DNI
ALTER TABLE member_programs ADD COLUMN document_type VARCHAR(10); -- Type of document
ALTER TABLE member_programs ADD COLUMN google_wallet_enabled BOOLEAN DEFAULT false;
ALTER TABLE member_programs ADD COLUMN last_sync_date TIMESTAMP;
ALTER TABLE member_programs ADD COLUMN sync_method VARCHAR(20); -- 'manual', 'email', 'api', 'wallet'

-- New table for transfer rules
CREATE TABLE program_transfer_rules (
  id SERIAL PRIMARY KEY,
  program_id INTEGER REFERENCES loyalty_programs(id),
  transfer_enabled BOOLEAN DEFAULT false,
  min_transfer_amount INTEGER,
  max_transfer_amount INTEGER,
  fee_type VARCHAR(20), -- 'flat', 'percentage', 'tiered'
  fee_amount DECIMAL(10,2),
  fee_points INTEGER,
  transfer_delay_hours INTEGER DEFAULT 0,
  restrictions JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- New table for sync history
CREATE TABLE sync_history (
  id SERIAL PRIMARY KEY,
  member_program_id INTEGER REFERENCES member_programs(id),
  sync_method VARCHAR(20),
  old_balance INTEGER,
  new_balance INTEGER,
  sync_status VARCHAR(20),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert transfer rules for known programs
INSERT INTO program_transfer_rules (program_id, transfer_enabled, min_transfer_amount, fee_type, fee_points, transfer_delay_hours, restrictions) VALUES
-- LATAM Pass
(1, true, 1000, 'flat', 1000, 0, '{"max_frequency": "30_days", "min_account_age": "90_days"}'::jsonb),
-- Smiles
(2, true, 1000, 'tiered', 0, 72, '{"max_per_transaction": 50000, "annual_limit": 200000}'::jsonb),
-- TudoAzul
(3, true, 1000, 'tiered', 0, 48, '{"annual_limit": 100000, "min_account_age": "12_months"}'::jsonb);
```

---

## 🔧 Implementation Components

### 1. Mile Transfer Calculator Component

```typescript
// client/src/components/MileTransferCalculator.tsx
interface TransferCalculatorProps {
  fromProgram: Program;
  toProgram: Program;
  amount: number;
  memberStatus?: string;
}

export function MileTransferCalculator({ fromProgram, amount, memberStatus }: TransferCalculatorProps) {
  const calculateFee = () => {
    switch (fromProgram.name) {
      case 'LATAM Pass':
        return { points: 1000, currency: 0 };
      
      case 'Smiles':
        if (memberStatus === 'Diamond' || memberStatus === 'Gold') {
          return { points: 0, currency: 0 };
        }
        const rate = memberStatus === 'Silver' ? 0.01 : 0.02;
        return { points: 0, currency: amount * rate };
      
      case 'TudoAzul':
        const firstTier = Math.min(amount, 10000);
        const secondTier = Math.max(0, amount - 10000);
        const cost = (firstTier / 1000 * 10) + (secondTier / 1000 * 15);
        return { points: 0, currency: cost };
      
      default:
        return { points: 0, currency: 0 };
    }
  };

  const fee = calculateFee();
  const totalCost = amount + fee.points;

  return (
    <div className="transfer-calculator">
      <h3>Transfer Cost Analysis</h3>
      <div>Transfer Amount: {amount.toLocaleString()} miles</div>
      <div>Fee: {fee.points > 0 ? `${fee.points} points` : `R$ ${fee.currency.toFixed(2)}`}</div>
      <div>Total Deduction: {totalCost.toLocaleString()} miles</div>
      <div>You'll Receive: {amount.toLocaleString()} miles</div>
    </div>
  );
}
```

### 2. Google Wallet Integration

```typescript
// client/src/utils/googleWallet.ts
interface WalletCredentials {
  programName: string;
  memberNumber: string;
  memberName: string;
  balance?: number;
  status?: string;
}

export class GoogleWalletHelper {
  static generateWalletLink(credentials: WalletCredentials): string {
    // Generate deep link for Google Wallet
    const baseUrl = 'https://pay.google.com/gp/v/save/';
    const jwt = this.createJWT(credentials);
    return `${baseUrl}${jwt}`;
  }

  static parseWalletQR(qrData: string): WalletCredentials | null {
    try {
      // Parse QR codes from Google Wallet cards
      const decoded = atob(qrData);
      const data = JSON.parse(decoded);
      
      return {
        programName: data.issuer,
        memberNumber: data.accountId,
        memberName: data.accountName,
        balance: data.balance,
        status: data.tierLevel
      };
    } catch (error) {
      console.error('Failed to parse wallet QR:', error);
      return null;
    }
  }

  private static createJWT(credentials: WalletCredentials): string {
    // This is a simplified version - real implementation needs proper JWT signing
    const payload = {
      iss: 'lechworld@flyio.app',
      aud: 'google',
      typ: 'savetowallet',
      origins: ['https://lechworld.fly.dev'],
      payload: {
        loyaltyCards: [{
          id: `${credentials.programName}_${credentials.memberNumber}`,
          classId: 'lechworld.loyalty.cards',
          accountId: credentials.memberNumber,
          accountName: credentials.memberName,
          balance: {
            string: credentials.balance?.toLocaleString(),
            int: credentials.balance
          }
        }]
      }
    };
    
    // In production, sign this with your Google Wallet API key
    return btoa(JSON.stringify(payload));
  }
}
```

### 3. Email Parser for Statements

```typescript
// server/emailParser.ts
import { createMimeMessage } from 'mimetext';

interface ParsedStatement {
  programName: string;
  memberNumber: string;
  balance: number;
  expiringMiles?: number;
  expirationDate?: Date;
  transactions: Transaction[];
}

export class EmailStatementParser {
  private patterns = {
    'LATAM Pass': {
      balance: /Saldo atual[:\s]+([0-9,.]+)\s*pontos/i,
      memberNumber: /Número de socio[:\s]+(\d{10})/i,
      expiring: /(\d+)\s*pontos expiram em\s+(\d{2}\/\d{2}\/\d{4})/i
    },
    'Smiles': {
      balance: /Saldo[:\s]+([0-9,.]+)\s*milhas/i,
      memberNumber: /Número Smiles[:\s]+(\d{10})/i,
      expiring: /(\d+)\s*milhas vencem em\s+(\d{2}\/\d{2}\/\d{4})/i
    },
    'TudoAzul': {
      balance: /Seus pontos[:\s]+([0-9,.]+)/i,
      memberNumber: /Número TudoAzul[:\s]+(\d+)/i,
      expiring: /(\d+)\s*pontos expiram\s+(\d{2}\/\d{2}\/\d{4})/i
    }
  };

  async parseEmail(emailContent: string, program: string): Promise<ParsedStatement | null> {
    const pattern = this.patterns[program];
    if (!pattern) return null;

    const result: Partial<ParsedStatement> = {
      programName: program,
      transactions: []
    };

    // Extract balance
    const balanceMatch = emailContent.match(pattern.balance);
    if (balanceMatch) {
      result.balance = parseInt(balanceMatch[1].replace(/[,.\s]/g, ''));
    }

    // Extract member number
    const memberMatch = emailContent.match(pattern.memberNumber);
    if (memberMatch) {
      result.memberNumber = memberMatch[1];
    }

    // Extract expiring miles
    const expiringMatch = emailContent.match(pattern.expiring);
    if (expiringMatch) {
      result.expiringMiles = parseInt(expiringMatch[1].replace(/[,.\s]/g, ''));
      result.expirationDate = this.parseDate(expiringMatch[2]);
    }

    // Extract transactions (simplified)
    const transactionPattern = /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\+\-])\s*([0-9,.]+)/g;
    let match;
    while ((match = transactionPattern.exec(emailContent)) !== null) {
      result.transactions.push({
        date: this.parseDate(match[1]),
        description: match[2].trim(),
        type: match[3] === '+' ? 'earn' : 'redeem',
        amount: parseInt(match[4].replace(/[,.\s]/g, ''))
      });
    }

    return result as ParsedStatement;
  }

  private parseDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }
}
```

### 4. Real-time Sync Service

```typescript
// server/syncService.ts
interface SyncResult {
  success: boolean;
  oldBalance: number;
  newBalance: number;
  method: 'manual' | 'email' | 'api' | 'wallet';
  error?: string;
}

export class BalanceSyncService {
  async syncMemberProgram(memberProgramId: number): Promise<SyncResult> {
    const memberProgram = await this.getMemberProgram(memberProgramId);
    
    // Try methods in order of preference
    const methods = [
      this.syncViaAPI,
      this.syncViaEmail,
      this.syncViaWallet
    ];

    for (const method of methods) {
      try {
        const result = await method.call(this, memberProgram);
        if (result.success) {
          await this.updateBalance(memberProgramId, result);
          await this.logSync(memberProgramId, result);
          return result;
        }
      } catch (error) {
        console.error(`Sync method failed:`, error);
      }
    }

    return {
      success: false,
      oldBalance: memberProgram.current_miles,
      newBalance: memberProgram.current_miles,
      method: 'manual',
      error: 'All sync methods failed'
    };
  }

  private async syncViaAPI(memberProgram: any): Promise<SyncResult> {
    // Implementation depends on available APIs
    if (memberProgram.program_name === 'Smiles') {
      const api = new SmilesAPI();
      const balance = await api.getBalance(memberProgram.member_number);
      return {
        success: true,
        oldBalance: memberProgram.current_miles,
        newBalance: balance,
        method: 'api'
      };
    }
    
    throw new Error('API not available for this program');
  }

  private async syncViaEmail(memberProgram: any): Promise<SyncResult> {
    // Check for recent emails
    const recentEmail = await this.checkRecentEmails(memberProgram.email);
    if (recentEmail) {
      const parser = new EmailStatementParser();
      const parsed = await parser.parseEmail(recentEmail.content, memberProgram.program_name);
      
      if (parsed && parsed.balance) {
        return {
          success: true,
          oldBalance: memberProgram.current_miles,
          newBalance: parsed.balance,
          method: 'email'
        };
      }
    }
    
    throw new Error('No recent emails found');
  }

  private async syncViaWallet(memberProgram: any): Promise<SyncResult> {
    // This would integrate with Google Wallet API
    // For now, this is a placeholder
    throw new Error('Wallet sync not yet implemented');
  }
}
```

---

## 🚀 Quick Start Implementation Steps

### Step 1: Update Database (Immediate)
```bash
# Run the schema updates
npm run db:migrate
```

### Step 2: Add Transfer Calculator (Week 1)
1. Create the MileTransferCalculator component
2. Add to the member program details page
3. Show transfer costs and restrictions

### Step 3: Implement Credential Storage (Week 1)
1. Update forms to collect member numbers
2. Add secure storage for PINs
3. Create credential type documentation

### Step 4: Email Integration (Week 2)
1. Set up email forwarding address
2. Implement email parser
3. Add manual sync button with email check

### Step 5: Google Wallet Helper (Week 2)
1. Add "Import from Wallet" button
2. Implement QR scanner (using device camera)
3. Parse and update balances

---

## 📝 Important Implementation Notes

1. **Security First**
   - Never log credentials
   - Encrypt sensitive fields at rest
   - Use secure sessions for API tokens

2. **User Experience**
   - Always allow manual override
   - Show sync status and last update time
   - Provide clear error messages

3. **Compliance**
   - Get user consent for automated syncing
   - Respect program terms of service
   - Implement data deletion on request

4. **Testing**
   - Create test accounts for each program
   - Test with real statement emails
   - Verify transfer calculations

5. **Monitoring**
   - Track sync success rates
   - Alert on repeated failures
   - Monitor for API changes