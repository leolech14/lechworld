# 🔍 Data Persistence Bug Investigation Report

## 🚨 Executive Summary

**Critical Finding**: Data persistence fails due to **schema mismatches** between frontend (camelCase), API (mixed), and database (snake_case). The system has **dual competing API systems** causing confusion and silent failures.

## 📊 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE                             │
│  edit-member-modal.tsx → Forms with camelCase fields              │
│  (frameColor, frameBorderColor, profileEmoji)                     │
└───────────────────────────┬─────────────────────────────────────────┘
                           │
                           │ PUT /api/members/:id
                           │ Payload: { frameColor: "#FF0000" }
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FRONTEND API LAYER                             │
│  use-auto-save.ts → 300ms debounce → React Query mutation         │
│  ⚠️ Sends camelCase field names                                   │
└───────────────────────────┬─────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND ROUTER                                 │
│  server/index.ts → DUAL SYSTEM CONFLICT!                          │
│  ❌ Route 1: app.use('/api/members', membersRoutes)              │
│  ❌ Route 2: routes.ts also defines member endpoints              │
└───────────────────────────┬─────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API ENDPOINT HANDLER                             │
│  server/api/members.ts → PUT endpoint                             │
│  ⚠️ Attempts field mapping: frameColor || frame_color            │
│  ❌ But database expects snake_case only!                         │
└───────────────────────────┬─────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                                 │
│  PostgreSQL with Drizzle ORM                                      │
│  ❌ Schema expects: frame_color, frame_border_color              │
│  ❌ Receives: frameColor, frameBorderColor                        │
│  Result: SILENT FAILURE or incorrect mapping                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 🐛 Identified Failure Points

### 1. **Schema Mismatch (CRITICAL)**
- **Frontend**: Uses `frameColor` (camelCase)
- **Database**: Expects `frame_color` (snake_case)
- **API**: Inconsistent mapping attempts

### 2. **Dual API System (CRITICAL)**
- Two competing API registration points
- Unclear which handler actually processes requests
- Potential for requests to hit wrong endpoint

### 3. **Missing Database Columns (HIGH)**
- Some schema files missing appearance fields
- CPF, phone, birthdate fields inconsistent
- No proper migration ensuring all columns exist

### 4. **Silent Failures (HIGH)**
```typescript
// server/api/members.ts:101-107
catch (error) {
  console.error('Update member error:', error);
  // Generic error - doesn't reveal field name issues
  res.status(500).json({ error: 'Failed to update member' });
}
```

### 5. **Race Conditions (MODERATE)**
- Auto-save can skip updates during rapid typing
- No queue mechanism for pending saves

## 🔄 Reproduction Steps

### Scenario 1: Frame Color Not Persisting
1. Open member edit modal
2. Change frame color to red (#FF0000)
3. See "Saving..." indicator
4. Close modal (appears successful)
5. Refresh page
6. Open same member - frame color reverted

**Why it fails**: Frontend sends `frameColor`, database expects `frame_color`

### Scenario 2: Multiple Field Updates Lost
1. Edit member profile
2. Quickly update: name, emoji, and frame color
3. Auto-save triggers for first change
4. Subsequent changes queued/skipped
5. Only first change persists (if at all)

**Why it fails**: Race condition in auto-save + field name issues

### Scenario 3: Partial Data Persistence
1. Update member with all fields
2. Some fields save (e.g., name)
3. Others don't (e.g., appearance fields)
4. No error shown to user

**Why it fails**: Only fields with matching names persist

## 🛠️ Recommended Fixes (Priority Order)

### IMMEDIATE Actions (Fix the bleeding)

1. **Standardize Field Names**
```sql
-- Add migration to ensure consistent column names
ALTER TABLE members 
  RENAME COLUMN frameColor TO frame_color,
  RENAME COLUMN frameBorderColor TO frame_border_color,
  RENAME COLUMN profileEmoji TO profile_emoji;
```

2. **Pick ONE API System**
```typescript
// In server/index.ts - Remove duplicate registration
// EITHER use modular API:
app.use('/api/members', membersRoutes);
// OR use routes.ts - NOT BOTH
```

3. **Fix Field Mapping**
```typescript
// In server/api/members.ts
const updates = {
  // Map frontend names to database names explicitly
  frame_color: req.body.frameColor,
  frame_border_color: req.body.frameBorderColor,
  profile_emoji: req.body.profileEmoji,
  // ... other fields
};
```

### HIGH Priority (Prevent recurrence)

4. **Add Field Validation**
```typescript
// Validate all expected fields exist in request
const requiredFields = ['frame_color', 'frame_border_color'];
const missingFields = requiredFields.filter(f => !(f in updates));
if (missingFields.length > 0) {
  return res.status(400).json({ 
    error: 'Missing fields', 
    fields: missingFields 
  });
}
```

5. **Improve Error Messages**
```typescript
catch (error) {
  if (error.code === '42703') { // PostgreSQL unknown column
    return res.status(400).json({ 
      error: 'Database schema mismatch',
      details: error.column 
    });
  }
  // ... handle other specific errors
}
```

### MEDIUM Priority (Long-term stability)

6. **Add Integration Tests**
```typescript
test('member appearance fields persist correctly', async () => {
  const update = { frameColor: '#FF0000' };
  await api.put('/api/members/1', update);
  const member = await api.get('/api/members/1');
  expect(member.frameColor).toBe('#FF0000');
});
```

7. **Implement Save Queue**
```typescript
// Queue saves to prevent race conditions
const saveQueue = new SaveQueue();
saveQueue.enqueue(memberId, updates);
```

## 📋 Verification Checklist

After implementing fixes, verify:

- [ ] Edit member appearance fields
- [ ] Changes persist after page refresh
- [ ] No console errors about missing columns
- [ ] Auto-save indicator shows success
- [ ] Database has correct column names
- [ ] API uses consistent field naming
- [ ] Error messages are specific
- [ ] Integration tests pass

## 🎯 Root Cause Summary

The persistence bug stems from **architectural debt** - the system evolved from one schema design to another without properly migrating all layers. The frontend speaks one language (camelCase), the database speaks another (snake_case), and the API tries to translate but fails silently. Combined with dual API systems, this creates a perfect storm for data loss.

**The fix is straightforward**: Pick one naming convention, apply it consistently across all layers, and add proper error handling to catch mismatches early.