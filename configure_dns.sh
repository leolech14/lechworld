#!/bin/bash

# LechWorld DNS Configuration Script
# Configures www.lech.world to point to GitHub Pages

echo "======================================================================"
echo "       🌐 LECHWORLD DNS CONFIGURATION - NAMECHEAP TO GITHUB PAGES"
echo "======================================================================"
echo ""
echo "Current DNS Status:"
echo "-------------------"

# Check current DNS
echo "Checking www.lech.world..."
nslookup www.lech.world | head -n 10

if nslookup www.lech.world 2>/dev/null | grep -q "vercel"; then
    echo ""
    echo "⚠️  WARNING: DNS currently points to Vercel (old project)"
    echo "   This needs to be updated to GitHub Pages"
elif nslookup www.lech.world 2>/dev/null | grep -q "185.199"; then
    echo ""
    echo "✅ DNS already configured for GitHub Pages!"
    echo "   If the site isn't working, wait for propagation (up to 24h)"
else
    echo ""
    echo "❓ Current DNS configuration unclear"
fi

echo ""
echo "======================================================================"
echo "Choose configuration method:"
echo ""
echo "  1) Automated via Namecheap API (requires API access)"
echo "  2) Show manual instructions for Namecheap control panel"
echo "  3) Check DNS propagation status"
echo "  4) Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting automated configuration..."
        echo ""
        echo "Prerequisites:"
        echo "  1. Enable API access at: https://ap.www.namecheap.com/settings/tools/apiaccess/"
        echo "  2. Whitelist your IP address"
        echo "  3. Have your API credentials ready"
        echo ""
        read -p "Press Enter to continue..."
        python3 namecheap_dns_update.py
        ;;
        
    2)
        clear
        echo "======================================================================"
        echo "              📋 MANUAL DNS CONFIGURATION INSTRUCTIONS"
        echo "======================================================================"
        echo ""
        echo "Follow these steps EXACTLY:"
        echo ""
        echo "1️⃣  LOGIN TO NAMECHEAP"
        echo "    https://www.namecheap.com"
        echo ""
        echo "2️⃣  GO TO YOUR DOMAIN"
        echo "    Dashboard → Domain List → Find 'lech.world' → Click 'MANAGE'"
        echo ""
        echo "3️⃣  CLICK 'Advanced DNS' (in the top menu)"
        echo ""
        echo "4️⃣  DELETE ALL EXISTING RECORDS"
        echo "    ⚠️  Especially any CNAME pointing to vercel-dns.com"
        echo "    Click the trash icon next to each record"
        echo ""
        echo "5️⃣  ADD THESE EXACT RECORDS:"
        echo ""
        echo "    ┌──────────────┬────────┬─────────────────────┬───────────┐"
        echo "    │ Type         │ Host   │ Value               │ TTL       │"
        echo "    ├──────────────┼────────┼─────────────────────┼───────────┤"
        echo "    │ A Record     │ @      │ 185.199.108.153     │ Automatic │"
        echo "    │ A Record     │ @      │ 185.199.109.153     │ Automatic │"
        echo "    │ A Record     │ @      │ 185.199.110.153     │ Automatic │"
        echo "    │ A Record     │ @      │ 185.199.111.153     │ Automatic │"
        echo "    │ CNAME Record │ www    │ leolech14.github.io │ Automatic │"
        echo "    └──────────────┴────────┴─────────────────────┴───────────┘"
        echo ""
        echo "    ⚠️  The @ symbol means the root domain (lech.world)"
        echo "    ⚠️  Type EXACTLY as shown above"
        echo ""
        echo "6️⃣  CLICK 'SAVE ALL CHANGES' (green checkmark button ✓)"
        echo ""
        echo "7️⃣  WAIT AND TEST"
        echo "    • Wait 5-30 minutes for initial propagation"
        echo "    • Test at: https://www.lech.world"
        echo "    • Full propagation can take up to 24 hours"
        echo ""
        echo "======================================================================"
        echo ""
        echo "📱 Expected Result:"
        echo "   When you visit https://www.lech.world you should see:"
        echo "   • LechWorld logo"
        echo "   • Login screen with 'Sistema Premium de Gestão de Milhas Familiares'"
        echo "   • NOT 'Monorepo 5' or any Vercel content"
        echo ""
        ;;
        
    3)
        echo ""
        echo "🔍 Checking DNS propagation..."
        echo "--------------------------------"
        echo ""
        
        # Check www subdomain
        echo "1. Checking www.lech.world:"
        if nslookup www.lech.world 2>/dev/null | grep -q "leolech14.github.io"; then
            echo "   ✅ CNAME correctly points to leolech14.github.io"
        else
            echo "   ⏳ CNAME not yet propagated"
        fi
        
        # Check apex domain
        echo ""
        echo "2. Checking lech.world:"
        if nslookup lech.world 2>/dev/null | grep -q "185.199"; then
            echo "   ✅ A records correctly point to GitHub Pages IPs"
        else
            echo "   ⏳ A records not yet propagated"
        fi
        
        # Try to fetch the site
        echo ""
        echo "3. Testing HTTPS connection:"
        if curl -s -I https://www.lech.world | grep -q "200"; then
            echo "   ✅ Site is responding with HTTP 200"
        else
            echo "   ⏳ Site not yet accessible"
        fi
        
        echo ""
        echo "📊 Propagation Status:"
        echo "   DNS changes can take:"
        echo "   • 5-30 minutes for initial propagation"
        echo "   • Up to 24-48 hours for full global propagation"
        echo ""
        echo "💡 Check global propagation at:"
        echo "   https://dnschecker.org/#CNAME/www.lech.world"
        echo ""
        ;;
        
    4)
        echo "👋 Exiting..."
        exit 0
        ;;
        
    *)
        echo "Invalid choice. Please run the script again."
        ;;
esac

echo ""
echo "======================================================================"
echo "Need help? Check:"
echo "  • GitHub Pages status: https://github.com/leolech14/lechworld/settings/pages"
echo "  • Namecheap support: https://www.namecheap.com/support/"
echo "  • DNS propagation: https://dnschecker.org/#CNAME/www.lech.world"
echo "======================================================================"