#!/usr/bin/env python3
"""
Namecheap DNS Configuration Script for www.lech.world
Updates DNS records to point to GitHub Pages instead of Vercel
"""

import requests
import xml.etree.ElementTree as ET
import sys
import time
import os
from datetime import datetime

# Domain configuration
DOMAIN = "lech.world"
SLD = "lech"
TLD = "world"

# GitHub Pages IPs (required for apex domain)
GITHUB_IPS = [
    "185.199.108.153",
    "185.199.109.153",
    "185.199.110.153",
    "185.199.111.153"
]

# GitHub Pages username
GITHUB_USERNAME = "leolech14"

def get_client_ip():
    """Get the public IP of the client"""
    try:
        response = requests.get('https://api.ipify.org', timeout=5)
        return response.text.strip()
    except:
        print("⚠️  Could not detect your IP automatically")
        return input("Enter your IP address (for whitelist): ").strip()

def check_current_dns():
    """Check current DNS configuration"""
    print("\n🔍 Checking current DNS configuration...")
    print("-" * 60)
    
    # Check www subdomain
    import subprocess
    try:
        result = subprocess.run(['nslookup', 'www.lech.world'], 
                              capture_output=True, text=True, timeout=5)
        if "vercel" in result.stdout.lower():
            print("⚠️  DNS currently points to Vercel (old project)")
            print("   Need to update to GitHub Pages")
        elif "github" in result.stdout.lower() or "185.199" in result.stdout:
            print("✅ DNS already points to GitHub Pages")
        else:
            print("❓ Current DNS configuration unclear")
        print(result.stdout[:300])
    except:
        print("Could not check current DNS")
    
    print("-" * 60)

def delete_existing_records(api_user, api_key, client_ip):
    """First, get and display existing records"""
    print("\n📋 Fetching existing DNS records...")
    
    params = {
        'ApiUser': api_user,
        'ApiKey': api_key,
        'UserName': api_user,
        'Command': 'namecheap.domains.dns.getHosts',
        'ClientIp': client_ip,
        'SLD': SLD,
        'TLD': TLD
    }
    
    try:
        response = requests.post(
            'https://api.namecheap.com/xml.response',
            data=params,
            timeout=30
        )
        
        root = ET.fromstring(response.text)
        status = root.get('Status')
        
        if status == 'OK':
            # Find all host records
            hosts = root.findall('.//{http://api.namecheap.com/xml.response}host')
            if hosts:
                print("\n⚠️  Found existing records (will be replaced):")
                for host in hosts:
                    name = host.get('Name')
                    type_ = host.get('Type')
                    address = host.get('Address')
                    print(f"   - {type_:6} {name:10} → {address}")
            return True
        else:
            errors = root.findall('.//Error')
            if errors:
                for error in errors:
                    if "2019166" in str(error.get('Number', '')):
                        print("ℹ️  No existing DNS records found")
                        return True
                    print(f"Error: {error.text}")
            return False
    except Exception as e:
        print(f"Error checking existing records: {e}")
        return False

def setup_dns_records(api_user, api_key, client_ip):
    """Configure DNS records for GitHub Pages"""
    
    print("\n🚀 Configuring new DNS records for GitHub Pages...")
    
    # Build DNS records
    dns_records = []
    
    # A Records for apex domain (lech.world)
    for ip in GITHUB_IPS:
        dns_records.append({
            'HostName': '@',
            'RecordType': 'A',
            'Address': ip,
            'TTL': '1800'
        })
    
    # CNAME for www subdomain
    dns_records.append({
        'HostName': 'www',
        'RecordType': 'CNAME',
        'Address': f'{GITHUB_USERNAME}.github.io',
        'TTL': '1800'
    })
    
    # Build API parameters
    params = {
        'ApiUser': api_user,
        'ApiKey': api_key,
        'UserName': api_user,
        'Command': 'namecheap.domains.dns.setHosts',
        'ClientIp': client_ip,
        'SLD': SLD,
        'TLD': TLD
    }
    
    # Add each DNS record to parameters
    for i, record in enumerate(dns_records, 1):
        params[f'HostName{i}'] = record['HostName']
        params[f'RecordType{i}'] = record['RecordType']
        params[f'Address{i}'] = record['Address']
        params[f'TTL{i}'] = record['TTL']
    
    print("\n📝 Setting up the following records:")
    print("-" * 60)
    for record in dns_records:
        print(f"  {record['RecordType']:6} {record['HostName']:10} → {record['Address']}")
    print("-" * 60)
    
    # Make the API request
    print("\n🔄 Sending configuration to Namecheap...")
    
    try:
        response = requests.post(
            'https://api.namecheap.com/xml.response',
            data=params,
            timeout=30
        )
        
        # Parse XML response
        root = ET.fromstring(response.text)
        status = root.get('Status')
        
        if status == 'OK':
            print("\n✅ DNS records configured successfully!")
            return True
        else:
            # Get error messages
            errors = root.findall('.//Error')
            if errors:
                print("\n❌ Error configuring DNS:")
                for error in errors:
                    error_num = error.get('Number', '')
                    error_text = error.text or ''
                    print(f"   Error {error_num}: {error_text}")
                    
                    # Common error handling
                    if "2050900" in error_num:
                        print("\n⚠️  API access not enabled or IP not whitelisted")
                        print("   1. Go to: https://ap.www.namecheap.com/settings/tools/apiaccess/")
                        print("   2. Enable API Access")
                        print(f"   3. Whitelist your IP: {client_ip}")
                    elif "2011170" in error_num:
                        print("\n⚠️  Invalid API credentials")
                        print("   Check your API User and API Key")
            else:
                print("\n❌ Unknown error occurred")
                print(f"Response: {response.text[:500]}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Connection error: {e}")
        return False
    except ET.ParseError as e:
        print(f"\n❌ Error parsing response: {e}")
        return False

def verify_dns_propagation():
    """Check if DNS has propagated"""
    print("\n🔍 Checking DNS propagation...")
    
    import subprocess
    
    # Check www subdomain
    try:
        result = subprocess.run(['nslookup', 'www.lech.world'], 
                              capture_output=True, text=True, timeout=5)
        if GITHUB_USERNAME in result.stdout.lower() or "185.199" in result.stdout:
            print("✅ DNS is propagating correctly!")
            return True
        else:
            print("⏳ DNS is still propagating (this can take up to 24 hours)")
            return False
    except:
        print("Could not verify DNS propagation")
        return False

def print_manual_instructions():
    """Print manual configuration instructions"""
    print("\n" + "="*70)
    print("📋 MANUAL CONFIGURATION INSTRUCTIONS")
    print("="*70)
    print("""
If the automated script doesn't work, follow these steps:

1. LOG INTO NAMECHEAP:
   https://www.namecheap.com
   
2. GO TO YOUR DOMAIN:
   Dashboard → Domain List → "lech.world" → MANAGE

3. CLICK "Advanced DNS"

4. DELETE ALL EXISTING RECORDS
   (Especially any pointing to Vercel)

5. ADD THESE EXACT RECORDS:

   Type        Host    Value                   TTL
   ─────────────────────────────────────────────────
   A Record    @       185.199.108.153         Automatic
   A Record    @       185.199.109.153         Automatic  
   A Record    @       185.199.110.153         Automatic
   A Record    @       185.199.111.153         Automatic
   CNAME       www     leolech14.github.io     Automatic

6. CLICK "SAVE ALL CHANGES" (green checkmark button)

7. WAIT 5-30 minutes and test:
   https://www.lech.world
   
⚠️ IMPORTANT: The @ symbol means the root domain (lech.world)
""")
    print("="*70)

def main():
    print("="*70)
    print(" 🌐 NAMECHEAP DNS CONFIGURATION FOR GITHUB PAGES")
    print("     Updating www.lech.world → GitHub Pages")
    print("="*70)
    
    # Check current DNS
    check_current_dns()
    
    print("\n⚡ This script will:")
    print("  1. Remove old Vercel DNS records")
    print("  2. Add GitHub Pages DNS records")
    print("  3. Enable www.lech.world to work with your GitHub Pages site")
    
    print("\n🔑 REQUIREMENTS:")
    print("  • Namecheap API access enabled")
    print("  • Your IP whitelisted in Namecheap")
    print("  • API credentials (User & Key)")
    
    choice = input("\nProceed with automated configuration? (y/n): ").strip().lower()
    
    if choice != 'y':
        print_manual_instructions()
        return
    
    # Get client IP
    client_ip = get_client_ip()
    print(f"\n📍 Your IP address: {client_ip}")
    print("   (This needs to be whitelisted in Namecheap)")
    
    # Get API credentials
    print("\n🔐 Enter your Namecheap API credentials:")
    print("   (Find them at: https://ap.www.namecheap.com/settings/tools/apiaccess/)")
    
    api_user = input("\nAPI User (usually your username): ").strip()
    if not api_user:
        print("❌ API User is required!")
        print_manual_instructions()
        return
    
    api_key = input("API Key: ").strip()
    if not api_key:
        print("❌ API Key is required!")
        print_manual_instructions()
        return
    
    # Check existing records
    print("\n" + "="*60)
    if delete_existing_records(api_user, api_key, client_ip):
        # Configure new DNS records
        success = setup_dns_records(api_user, api_key, client_ip)
        
        if success:
            print("\n" + "🎉"*20)
            print("\n✅ SUCCESS! DNS configuration complete!")
            print("\n📊 What happens next:")
            print("  • 5-10 minutes: Initial propagation")
            print("  • 30-60 minutes: Most locations updated")
            print("  • Up to 24 hours: Full global propagation")
            
            print("\n🌐 Your site will be available at:")
            print("  • https://www.lech.world (primary)")
            print("  • https://lech.world (redirects to www)")
            
            print("\n✨ Test your site:")
            print(f"  1. Wait 5-10 minutes")
            print(f"  2. Visit: https://www.lech.world")
            print(f"  3. You should see: LechWorld - Sistema Premium de Gestão de Milhas")
            
            print("\n💡 Quick verification commands:")
            print("  nslookup www.lech.world")
            print("  curl -I https://www.lech.world")
            
            # Wait and verify
            print("\n⏳ Waiting 30 seconds before checking propagation...")
            time.sleep(30)
            verify_dns_propagation()
            
        else:
            print("\n⚠️ Automated configuration failed")
            print_manual_instructions()
    else:
        print("\n⚠️ Could not access Namecheap API")
        print_manual_instructions()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Configuration cancelled")
        print_manual_instructions()
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        print_manual_instructions()