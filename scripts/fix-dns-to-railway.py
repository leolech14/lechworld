#!/usr/bin/env python3
"""
Fix DNS to point lech.world to Railway API instead of Vercel
"""

import requests
import xml.etree.ElementTree as ET
import os

# Namecheap API credentials
API_KEY = '4753835aafd34b90b8f298cf2c25ef39'
API_USER = 'leolech14'
USERNAME = 'leolech14'
CLIENT_IP = requests.get('https://api.ipify.org').text.strip()

def get_railway_cname():
    """Get the correct Railway CNAME for the deployment"""
    # Railway custom domain CNAME - we need to get this from Railway
    # Format is typically: [hash].up.railway.app
    # For lechworld-api it should be something like: gogifay2.up.railway.app
    return 'lechworld-api-production.up.railway.app'

def update_dns_to_railway():
    """Update DNS records to point to Railway instead of Vercel"""
    
    print("Fixing DNS to point to Railway API...")
    print("=" * 60)
    
    railway_target = get_railway_cname()
    
    # Namecheap API endpoint
    url = 'https://api.namecheap.com/xml.response'
    
    # Configure DNS records to point to Railway
    params = {
        'ApiUser': API_USER,
        'ApiKey': API_KEY,
        'UserName': USERNAME,
        'ClientIp': CLIENT_IP,
        'Command': 'namecheap.domains.dns.setHosts',
        'SLD': 'lech',
        'TLD': 'world',
        # Point apex domain to Railway via CNAME flattening
        'HostName1': '@',
        'RecordType1': 'CNAME',
        'Address1': railway_target,
        'TTL1': '300',  # 5 minutes for faster propagation
        # Set up www redirect
        'HostName2': 'www',
        'RecordType2': 'CNAME',
        'Address2': railway_target,
        'TTL2': '300',
    }
    
    response = requests.get(url, params=params)
    
    if response.status_code == 200 and 'IsSuccess="true"' in response.text:
        print("✅ DNS records updated successfully!")
        print("\nNew Configuration:")
        print(f"  lech.world → CNAME → {railway_target}")
        print(f"  www.lech.world → CNAME → {railway_target}")
        print("\n🚀 Railway API will be accessible at:")
        print("  https://lech.world (after DNS propagation)")
        print("\n⏱️  DNS propagation typically takes 5-30 minutes")
        return True
    else:
        print(f"❌ Failed to update DNS")
        print(f"Response: {response.text[:500]}")
        return False

def verify_current_dns():
    """Check current DNS configuration"""
    import subprocess
    
    print("\n📊 Current DNS Status:")
    print("-" * 40)
    
    # Check current DNS
    result = subprocess.run(['dig', 'lech.world', '+short'], capture_output=True, text=True)
    print(f"lech.world resolves to: {result.stdout.strip()}")
    
    # Check Railway API
    print("\n🔍 Railway API Status:")
    railway_url = 'https://lechworld-api-production.up.railway.app/health'
    try:
        r = requests.get(railway_url, timeout=5)
        if r.status_code == 200:
            print(f"✅ Railway API is running at: {railway_url}")
        else:
            print(f"⚠️  Railway API returned status: {r.status_code}")
    except:
        print("❌ Railway API is not responding")

if __name__ == '__main__':
    print("🔧 Fixing lech.world DNS Configuration")
    print("=" * 60)
    print(f"Client IP: {CLIENT_IP}")
    print()
    
    # Show current status
    verify_current_dns()
    
    print("\n🔄 Updating DNS records...")
    print("-" * 40)
    
    # Update DNS
    if update_dns_to_railway():
        print("\n✅ DNS fix complete!")
        print("\nIMPORTANT: The page won't load immediately!")
        print("DNS propagation takes 5-30 minutes.")
        print("\nIn the meantime, you can access the API directly at:")
        print("https://lechworld-api-production.up.railway.app")
    else:
        print("\n❌ DNS update failed. Please check Namecheap dashboard manually.")