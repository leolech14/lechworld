# 🔄 Migrating lech.world from GitHub Pages to Firebase Hosting

## Current Status
- ✅ Firebase Hosting is deployed at: https://lechworld-daeb7.web.app
- ✅ Custom hosting site created: https://lech-world.web.app
- ⏳ Domain migration needed: www.lech.world & lech.world

## 📋 Step-by-Step DNS Migration Guide

### Step 1: Access Firebase Console
1. Go to: https://console.firebase.google.com/project/lechworld-daeb7/hosting/sites
2. Click on "lechworld-daeb7" site
3. Click "Add custom domain" button
4. Enter: `www.lech.world` first (primary domain)
5. Firebase will show you verification records

### Step 2: Get DNS Records from Firebase
Firebase will provide you with:
1. **TXT Record** for verification (looks like: `google-site-verification=...`)
2. **A Records** for the domain (typically 2 IP addresses)

**IMPORTANT**: Use the EXACT records Firebase shows you, not generic ones.

### Step 3: Update Namecheap DNS Settings

#### Remove Old GitHub Pages Records:
1. Log in to Namecheap: https://www.namecheap.com
2. Go to Domain List → Manage → Advanced DNS
3. **DELETE these records**:
   - A Record → @ → 185.199.108.153
   - A Record → @ → 185.199.109.153  
   - A Record → @ → 185.199.110.153
   - A Record → @ → 185.199.111.153
   - CNAME Record → www → leolech14.github.io (if exists)

#### Add Firebase Records:
1. **Add TXT Record** (for verification):
   ```
   Type: TXT Record
   Host: @
   Value: [paste the google-site-verification value from Firebase]
   TTL: Automatic
   ```

2. **Wait 5-30 minutes** for TXT record to propagate

3. **Return to Firebase Console** and click "Verify" 

4. **After verification**, Firebase will show A records

5. **Add A Records** (Firebase will show 2 IPs):
   ```
   Type: A Record
   Host: @
   Value: [First IP from Firebase]
   TTL: Automatic
   ```
   ```
   Type: A Record
   Host: @
   Value: [Second IP from Firebase]
   TTL: Automatic
   ```

6. **Add CNAME for www**:
   ```
   Type: CNAME Record
   Host: www
   Value: lech.world
   TTL: Automatic
   ```

### Step 4: Complete Firebase Setup
1. After adding DNS records, return to Firebase Console
2. Click "Finish" on the domain setup
3. Repeat process for `lech.world` (without www)

### Step 5: Wait for Propagation
- **Domain Verification**: 5-30 minutes
- **DNS Propagation**: 1-48 hours (usually faster)
- **SSL Certificate**: 1-24 hours (automatic)

## 🔍 Verify DNS Changes

### Check DNS Propagation:
```bash
# Check A records
nslookup lech.world
nslookup www.lech.world

# Check TXT records
nslookup -type=txt lech.world

# Or use online tool
# https://www.whatsmydns.net/#A/lech.world
```

### Expected Results After Migration:
- `lech.world` → Points to Firebase IPs (not 185.199.x.x)
- `www.lech.world` → Points to Firebase IPs
- Both domains show green "Connected" in Firebase Console
- SSL certificates automatically provisioned

## 🚨 Important Notes

1. **DO NOT delete the CNAME file** from your GitHub repo yet - keep it as backup
2. **DNS propagation varies** - some users see changes in minutes, others in hours
3. **SSL certificates** are automatic but can take up to 24 hours
4. **Both domains needed** - Set up both www and non-www versions

## 📱 Testing After Migration

Once DNS propagates:
1. Visit https://www.lech.world - Should load Firebase version
2. Visit https://lech.world - Should load Firebase version
3. Check Firebase Console → Hosting - Both domains show "Connected"
4. Test on mobile/different network to confirm propagation

## 🆘 Troubleshooting

**Domain not verifying?**
- Ensure TXT record is exactly as Firebase provided
- Wait 30 minutes and try again
- Use `nslookup -type=txt lech.world` to confirm record exists

**Site not loading after DNS change?**
- DNS can take up to 48 hours to fully propagate
- Clear browser cache and cookies
- Try incognito/private browsing mode
- Check from different device/network

**SSL Certificate error?**
- Certificates provision automatically within 24 hours
- If still not working after 24h, re-verify domain in Firebase

## 📞 Support Resources

- **Firebase Hosting Docs**: https://firebase.google.com/docs/hosting/custom-domain
- **Namecheap Support**: https://www.namecheap.com/support/
- **DNS Checker**: https://www.whatsmydns.net/
- **Firebase Console**: https://console.firebase.google.com/project/lechworld-daeb7/hosting

## ✅ Success Indicators

You'll know the migration is complete when:
1. ✅ Both domains show "Connected" in Firebase Console
2. ✅ Green lock (SSL) appears in browser for both domains
3. ✅ Site loads from www.lech.world and lech.world
4. ✅ No more GitHub Pages 404 errors
5. ✅ Firebase Analytics shows traffic (if enabled)

---

**Current Deployment URLs:**
- GitHub Pages (old): https://leolech14.github.io/lechworld
- Firebase Hosting (new): https://lechworld-daeb7.web.app
- Custom Domain (migrating): https://www.lech.world