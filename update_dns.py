#!/usr/bin/env python3
"""
Direct DNS update script for Namecheap
No interaction required - pass credentials as arguments or env vars
"""

import requests
import xml.etree.ElementTree as ET
import sys
import os

# Domain settings
DOMAIN = "lech.world"
SLD = "lech"
TLD = "world"

# GitHub Pages IPs
GITHUB_IPS = [
    "185.199.108.153",
    "185.199.109.153",
    "185.199.110.153",
    "185.199.111.153"
]

def update_dns(api_user, api_key):
    # Get client IP
    try:
        client_ip = requests.get('https://api.ipify.org', timeout=5).text.strip()
    except:
        client_ip = "8.8.8.8"
    
    print(f"🌐 Updating DNS for {DOMAIN}")
    print(f"📍 Client IP: {client_ip}")
    
    # Build parameters for setting DNS records
    params = {
        'ApiUser': api_user,
        'ApiKey': api_key,
        'UserName': api_user,
        'Command': 'namecheap.domains.dns.setHosts',
        'ClientIp': client_ip,
        'SLD': SLD,
        'TLD': TLD
    }
    
    # Add A records for GitHub Pages
    for i, ip in enumerate(GITHUB_IPS, 1):
        params[f'HostName{i}'] = '@'
        params[f'RecordType{i}'] = 'A'
        params[f'Address{i}'] = ip
        params[f'TTL{i}'] = '1800'
    
    # Add CNAME for www
    params['HostName5'] = 'www'
    params['RecordType5'] = 'CNAME'
    params['Address5'] = 'leolech14.github.io'
    params['TTL5'] = '1800'
    
    print("\n📝 Setting DNS records:")
    print("  A    @    → 185.199.108.153")
    print("  A    @    → 185.199.109.153")
    print("  A    @    → 185.199.110.153")
    print("  A    @    → 185.199.111.153")
    print("  CNAME www → leolech14.github.io")
    
    # Make API request
    print("\n🚀 Sending to Namecheap API...")
    
    try:
        response = requests.post(
            'https://api.namecheap.com/xml.response',
            data=params,
            timeout=30
        )
        
        root = ET.fromstring(response.text)
        
        if root.get('Status') == 'OK':
            print("✅ DNS updated successfully!")
            print("\n🎉 Your site will be available at:")
            print("   https://www.lech.world (wait 5-30 minutes)")
            return True
        else:
            errors = root.findall('.//Error')
            if errors:
                print("❌ Error:")
                for error in errors:
                    print(f"   {error.text}")
                    if "2050900" in str(error.get('Number', '')):
                        print(f"\n⚠️  Add your IP to whitelist: {client_ip}")
                        print("   https://ap.www.namecheap.com/settings/tools/apiaccess/")
            else:
                print(f"❌ API Error: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    # Try to get credentials from command line or environment
    api_user = sys.argv[1] if len(sys.argv) > 1 else os.getenv('NAMECHEAP_API_USER')
    api_key = sys.argv[2] if len(sys.argv) > 2 else os.getenv('NAMECHEAP_API_KEY')
    
    if not api_user or not api_key:
        print("Usage: python3 update_dns.py <API_USER> <API_KEY>")
        print("Or set environment variables: NAMECHEAP_API_USER and NAMECHEAP_API_KEY")
        print("\nGet credentials at: https://ap.www.namecheap.com/settings/tools/apiaccess/")
        sys.exit(1)
    
    update_dns(api_user, api_key)