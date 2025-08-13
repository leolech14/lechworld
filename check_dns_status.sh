#!/bin/bash

echo "🔍 DNS Configuration Check for www.lech.world"
echo "=============================================="
echo ""
echo "CURRENT STATUS:"
echo ""

# Check CNAME
echo "1. CNAME Record (www.lech.world):"
CNAME=$(dig +short www.lech.world CNAME)
if [[ $CNAME == *"github"* ]]; then
    echo "   ✅ $CNAME (GitHub Pages)"
elif [[ $CNAME == *"vercel"* ]]; then
    echo "   ❌ $CNAME (Still pointing to Vercel!)"
else
    echo "   ❓ $CNAME"
fi

echo ""
echo "2. A Records (lech.world):"
A_RECORDS=$(dig +short lech.world A)
if [[ $A_RECORDS == *"185.199"* ]]; then
    echo "   ✅ GitHub Pages IPs detected"
else
    echo "   ❌ Not pointing to GitHub Pages"
fi
echo "$A_RECORDS" | while read ip; do
    echo "   - $ip"
done

echo ""
echo "=============================================="
echo "REQUIRED CONFIGURATION IN NAMECHEAP:"
echo ""
echo "You need these EXACT records:"
echo ""
echo "Type        Host    Value                   TTL"
echo "------------------------------------------------"
echo "A Record    @       185.199.108.153         Automatic"
echo "A Record    @       185.199.109.153         Automatic"
echo "A Record    @       185.199.110.153         Automatic"
echo "A Record    @       185.199.111.153         Automatic"
echo "CNAME       www     leolech14.github.io     Automatic"
echo ""
echo "⚠️  DELETE all other records, especially:"
echo "   - CNAME www → cname.vercel-dns.com"
echo "   - A Record → 76.76.21.21"
echo ""
echo "📍 Go to: https://www.namecheap.com"
echo "   → Domain List → lech.world → MANAGE → Advanced DNS"
