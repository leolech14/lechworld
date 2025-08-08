# Fix www.lech.world SSL Certificate Issue

## Problem
- `www.lech.world` shows SSL certificate error
- Railway's free plan only supports ONE custom domain
- The certificate is for `*.up.railway.app`, not for `www.lech.world`

## Solution: Use Namecheap's URL Redirect Feature

### Option 1: Namecheap Dashboard (Recommended)

1. **Login to Namecheap**
   - Go to https://www.namecheap.com
   - Login to your account

2. **Navigate to Domain Settings**
   - Go to Domain List
   - Click "Manage" next to `lech.world`

3. **Set up URL Redirect**
   - Click on "Advanced DNS" tab
   - In the "Host Records" section:
     - Keep the @ record pointing to Railway (A record → 76.76.21.21)
     - Remove the www CNAME record
   - Click "Add New Record"
   - Select Type: "URL Redirect Record"
   - Host: `www`
   - Value: `https://lech.world`
   - Select: "Permanent (301)"
   - Save changes

4. **Wait for Propagation**
   - Takes 5-30 minutes
   - After propagation, www.lech.world will redirect to lech.world
   - No more SSL errors!

### Option 2: Alternative - Remove www subdomain

If URL redirect doesn't work, simply remove the www record entirely:
- Users will need to use `lech.world` directly
- This is the simplest solution for Railway's free plan limitation

### Option 3: Upgrade Railway Plan

- Railway's paid plans support multiple custom domains
- This would allow proper SSL certificates for both domains

## Current Status

✅ `lech.world` - Working perfectly with SSL
❌ `www.lech.world` - SSL certificate error (being fixed)

## Verification

After making changes:
```bash
# Wait 5-30 minutes for DNS propagation
# Then test:
curl -I https://www.lech.world

# Should show 301 redirect to https://lech.world
```

## Technical Explanation

The issue occurs because:
1. Railway provides SSL cert for ONE custom domain only on free plan
2. The cert covers `lech.world` but NOT `www.lech.world`
3. CNAME records don't solve this - the SSL handshake still fails
4. Solution: Use HTTP redirect BEFORE SSL handshake (via Namecheap's redirect service)

This way, users typing www.lech.world get redirected to lech.world at the DNS level, avoiding the SSL issue entirely.