# Airline Loyalty Programs Knowledge Base

> Last Updated: 2025-01-28
> Version: 1.0.0
> Purpose: Comprehensive reference for airline program features and integration capabilities

## 📋 Table of Contents

1. [Mile Transfer Capabilities](#mile-transfer-capabilities)
2. [Google Wallet Integration](#google-wallet-integration)
3. [Credential Types and Identifiers](#credential-types-and-identifiers)
4. [Real-time Integration Options](#real-time-integration-options)
5. [API Documentation References](#api-documentation-references)

---

## 1. Mile Transfer Capabilities

### LATAM Pass

- **Transfer Between Accounts**: ✅ YES
- **Cost**: 1,000 points flat fee
- **Minimum Transfer**: 1,000 points
- **Maximum Transfer**: No limit
- **Family Pooling**: Available for up to 7 family members
- **Transfer Time**: Immediate
- **Restrictions**: 
  - Can only transfer once every 30 days
  - Both accounts must be active for at least 90 days

### Smiles (GOL)

- **Transfer Between Accounts**: ✅ YES
- **Cost**: 
  - Diamond/Gold members: Free
  - Silver members: 0.01 BRL per mile
  - Basic members: 0.02 BRL per mile
- **Minimum Transfer**: 1,000 miles
- **Maximum Transfer**: 50,0 00 miles per transaction
- **Family Club**: Share miles with up to 6 members
- **Transfer Time**: Up to 72 hours
- **Annual Limit**: 200,000 miles per year

### TudoAzul (Azul)

- **Transfer Between Accounts**: ✅ YES
- **Cost**: 
  - 10 BRL per 1,000 points for first 10,000 points
  - 15 BRL per 1,000 points above 10,000
- **Minimum Transfer**: 1,000 points
- **Maximum Transfer**: 100,000 points per year
- **Family Account**: Can create family pools
- **Transfer Time**: Up to 48 hours
- **Requirements**: Account must be at least 12 months old

### TAP Miles&Go

- **Transfer Between Accounts**: ✅ YES
- **Cost**: 17 EUR per transaction + 2 EUR per 1,000 miles
- **Minimum Transfer**: 1,000 miles
- **Maximum Transfer**: 50,000 miles per transaction
- **Family Sharing**: Available with TAP Family program
- **Transfer Time**: Immediate

### United MileagePlus

- **Transfer Between Accounts**: ✅ YES
- **Cost**: $7.50 USD per 500 miles + $30 processing fee
- **Minimum Transfer**: 500 miles
- **Maximum Transfer**: 100,000 miles per year
- **Transfer Time**: Immediate
- **Restrictions**: Both accounts must be open for 90+ days

### American Airlines AAdvantage

- **Transfer Between Accounts**: ✅ YES
- **Cost**: $15 USD per 1,000 miles
- **Minimum Transfer**: 1,000 miles
- **Maximum Transfer**: 200,000 miles per year
- **Transfer Time**: Immediate
- **Restrictions**: Receiving account limit of 300,000 miles per year

---

## 2. Google Wallet Integration

### LATAM Pass

- **Google Wallet Support**: ✅ YES
- **Required Information**:
  - **Número de Socio** (Member Number): 10-digit number
  - Full name as registered
  - Email address
- **Features in Wallet**:
  - Current miles balance
  - Elite status display
  - Digital membership card
  - QR code for airport use

### Smiles (GOL)

- **Google Wallet Support**: ✅ YES
- **Required Information**:
  - **Número Smiles**: 10-digit member number
  - CPF (for Brazilian members)
  - Registered email
- **Features in Wallet**:
  - Miles balance
  - Category status
  - Digital card with barcode

### TudoAzul (Azul)

- **Google Wallet Support**: ✅ YES
- **Required Information**:
  - **Número TudoAzul**: Member ID
  - CPF or passport number
  - Date of birth
- **Features in Wallet**:
  - Points balance
  - Sapphire/Topázio/Diamante status
  - Digital membership card

### TAP Miles&Go

- **Google Wallet Support**: ✅ YES
- **Required Information**:
  - **Member Number**: 9-digit TAP number
  - PIN or password
  - Email address
- **Features in Wallet**:
  - Miles balance
  - Status level
  - Digital card

### United MileagePlus

- **Google Wallet Support**: ✅ YES
- **Required Information**:
  - **MileagePlus Number**: Account number
  - Last name
  - Password or PIN
- **Features in Wallet**:
  - Miles balance
  - Premier status
  - Digital card with QR code

### American Airlines AAdvantage

- **Google Wallet Support**: ✅ YES
- **Required Information**:
  - **AAdvantage Number**: Member number
  - Last name
  - Password
- **Features in Wallet**:
  - Miles balance
  - Elite status
  - Digital membership card

---

## 3. Credential Types and Identifiers

### LATAM Pass

1. **Número de Socio (Member Number)**
   - Format: 10 digits (e.g., 1234567890)
   - Location: Membership card, email communications, app profile
   - Purpose: Primary identifier for all transactions

2. **RUT/CPF/DNI**
   - Format: Varies by country
   - Purpose: Tax identification, required for some countries

3. **Login Credentials**
   - Email address
   - Password (8+ characters, must include numbers and letters)
   - Optional: 2FA via SMS or app

4. **PIN**
   - Format: 4-6 digits
   - Purpose: Call center verification, some redemptions

### Smiles (GOL)

1. **Número Smiles**
   - Format: 10 digits
   - Location: Welcome email, app home screen, physical card
   - Auto-generated upon registration

2. **CPF (Brazilian Tax ID)**
   - Format: XXX.XXX.XXX-XX
   - Required for Brazilian residents
   - Used as secondary identifier

3. **Login Credentials**
   - CPF or email
   - Password
   - Security questions for recovery

4. **Cliente GOL Number**
   - Different from Smiles number
   - Used for flight bookings

### TudoAzul (Azul)

1. **Número TudoAzul**
   - Format: Variable length (usually 9-10 digits)
   - Provided upon registration
   - Required for all point transactions

2. **CPF/Passport**
   - Primary document for identification
   - Must match booking records

3. **Login Methods**
   - Email + password
   - CPF + password
   - Social login (Facebook/Google)

4. **Booking Reference**
   - Format: 6 characters (letters/numbers)
   - Links flights to account

### Additional Programs

**ALL - Accor Live Limitless**
- Member Number: 9 digits
- PIN: 4 digits
- Card Level: Classic/Silver/Gold/Platinum/Diamond

**Marriott Bonvoy**
- Member Number: 9 digits
- Password: Complex requirements
- Elite Status Number: Separate for status matching

**Hilton Honors**
- Member Number: 9 digits
- Password + optional PIN
- Digital Key access code

---

## 4. Real-time Integration Options

### Official APIs

1. **LATAM Pass API**
   - Status: Limited partner access
   - Requirements: Business partnership agreement
   - Features: Balance check, transaction history, status verification
   - Rate limits: Varies by partnership tier

2. **Smiles API**
   - Status: Partner program available
   - Documentation: developers.smiles.com.br
   - OAuth 2.0 authentication
   - Webhooks for balance changes

3. **United MileagePlus**
   - Enterprise API available
   - REST API with JSON responses
   - Real-time balance updates
   - Requires business agreement

### Open Source Alternatives

1. **Headless Browser Automation**
   ```javascript
   // Puppeteer/Playwright approach
   - Pros: Works with any program
   - Cons: Fragile, requires maintenance
   - Example: github.com/loyalty-tracker/scrapers
   ```

2. **Browser Extensions**
   - Auto-fill credentials
   - Capture balance updates
   - Export to webhook/API
   - Examples: 
     - AwardWallet Auto-Import
     - MileagePlus X extension

3. **Email Parsing Services**
   - Monitor statement emails
   - Extract balance changes
   - Services:
     - Zapier Email Parser
     - Mailgun Routes
     - SendGrid Inbound Parse

4. **Third-Party Aggregators**
   - **AwardWallet**: REST API for partners
   - **TripIt Pro**: Email forwarding integration
   - **Points.com**: Exchange and tracking API

### Recommended Architecture

```yaml
Real-time Updates Strategy:
  
  Primary:
    - Official APIs where available
    - OAuth tokens stored encrypted
    - Webhook listeners for push updates
    
  Secondary:
    - Email parsing for statements
    - Pattern: airline@email.com → parser → webhook
    
  Fallback:
    - Scheduled browser automation
    - Run during off-peak hours
    - Cache results for 24 hours
    
  Open Source Stack:
    - Node.js + Puppeteer for scraping
    - Bull queue for job management  
    - Redis for caching
    - PostgreSQL for state storage
```

---

## 5. API Documentation References

### Official Documentation

1. **LATAM Developer Portal**
   - URL: https://developer.latam.com (requires partner access)
   - Contact: api-partners@latam.com

2. **Smiles Developers**
   - URL: https://developers.smiles.com.br
   - Public docs available after registration

3. **United MileagePlus**
   - URL: https://developer.united.com
   - Requires business partnership

4. **American Airlines**
   - URL: https://developer.aa.com
   - Partner program application required

### Integration Best Practices

1. **Security**
   - Never store passwords in plain text
   - Use OAuth when available
   - Implement rate limiting
   - Log access attempts

2. **Reliability**
   - Implement retry logic
   - Cache responses appropriately
   - Handle API downtime gracefully
   - Monitor for HTML changes (scrapers)

3. **Compliance**
   - Respect robots.txt
   - Follow API terms of service
   - Implement user consent flows
   - Handle data deletion requests

### Community Resources

- **FlyerTalk Forums**: Technical discussions about airline APIs
- **MileagePlus Hacks GitHub**: Open source tools collection
- **Reddit r/awardtravel**: Integration experiences and tips
- **Stack Overflow**: Tagged questions for airline APIs

---

## 📝 Notes for Implementation

1. **Priority Integration Order**:
   - LATAM Pass (most users, best documentation)
   - Smiles (good API availability)
   - TudoAzul (important for Brazilian market)

2. **MVP Approach**:
   - Start with email parsing (most reliable)
   - Add Google Wallet for manual updates
   - Implement APIs as partnerships develop

3. **User Experience**:
   - Allow manual balance updates always
   - Show last sync timestamp
   - Provide clear error messages
   - Enable notification preferences

4. **Future Considerations**:
   - blockchain-based loyalty programs emerging
   - Open banking regulations may help
   - Consider joining airline partner networks