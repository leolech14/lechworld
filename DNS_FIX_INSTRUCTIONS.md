# 🚨 URGENT: Fix lech.world DNS - Currently Broken!

## Problem
- **lech.world is NOT loading** - showing Vercel authentication page
- DNS is pointing to `76.76.21.21` (Vercel) instead of Railway
- The Railway API is running fine at: https://lechworld-api-production.up.railway.app

## Solution: Update DNS in Namecheap Dashboard

### Step 1: Login to Namecheap
1. Go to https://www.namecheap.com
2. Login to your account
3. Go to Domain List → Manage `lech.world`

### Step 2: Go to Advanced DNS Tab

### Step 3: Delete ALL Current Records
Remove all existing DNS records for a clean start

### Step 4: Add New Records for Railway

Add these DNS records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | @ | lechworld-api-production.up.railway.app | 5 min |
| CNAME | www | lechworld-api-production.up.railway.app | 5 min |

**OR** if CNAME for @ doesn't work (some providers don't support it):

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | Get from Railway Dashboard | 5 min |
| CNAME | www | lechworld-api-production.up.railway.app | 5 min |

### Step 5: Get the A Record IP from Railway
1. Go to https://railway.app/dashboard
2. Open your `lechworld-api` project
3. Go to Settings → Networking
4. Look for the IP address Railway provides for custom domains
5. Use that IP for the A record above

### Alternative: Use Railway's Generated Domain

If custom domain setup is too complex, just use:
**https://lechworld-api-production.up.railway.app**

This works perfectly right now without any DNS changes!

## Current Status

✅ **Working**: https://lechworld-api-production.up.railway.app
- `/health` - Returns healthy status
- `/` - Will show API info (after next deployment)
- `/api/auth/login` - Login endpoint

❌ **Broken**: https://lech.world
- Currently showing Vercel auth page
- Needs DNS fix as described above

## Why This Happened

The DNS was accidentally changed to point to Vercel (76.76.21.21) instead of Railway. This needs to be fixed manually in Namecheap dashboard since the API is IP-restricted.

## Quick Test After DNS Update

After updating DNS, wait 5-30 minutes, then test:

```bash
# Check DNS propagation
dig lech.world

# Test the API
curl https://lech.world/health
```

## Need Help?

The Railway API is working perfectly at its direct URL. For now, use:
**https://lechworld-api-production.up.railway.app**

This bypasses all DNS issues and works immediately!