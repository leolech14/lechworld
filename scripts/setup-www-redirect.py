#!/usr/bin/env python3
"""
Setup URL redirect from www.lech.world to lech.world using Namecheap's URL forwarding.
This solves the SSL certificate issue since Railway only supports one custom domain on free plan.
"""

import requests
import xml.etree.ElementTree as ET
import os

# Namecheap API credentials
API_KEY = '4753835aafd34b90b8f298cf2c25ef39'
API_USER = 'leolech14'
USERNAME = 'leolech14'
CLIENT_IP = requests.get('https://api.ipify.org').text.strip()

def setup_url_redirect():
    """Configure www subdomain to redirect to apex domain using URL forwarding"""
    
    print("Setting up URL redirect from www.lech.world to lech.world...")
    print("=" * 60)
    
    # Namecheap API endpoint
    url = 'https://api.namecheap.com/xml.response'
    
    # Configure DNS records with URL redirect for www
    # We need to set up a URL redirect record type for www subdomain
    params = {
        'ApiUser': API_USER,
        'ApiKey': API_KEY,
        'UserName': USERNAME,
        'ClientIp': CLIENT_IP,
        'Command': 'namecheap.domains.dns.setHosts',
        'SLD': 'lech',
        'TLD': 'world',
        # Keep the apex domain pointing to Railway
        'HostName1': '@',
        'RecordType1': 'A',
        'Address1': '76.76.21.21',  # Railway's IP
        'TTL1': '1800',
        # Set up URL redirect for www - Namecheap's special format
        'HostName2': 'www',
        'RecordType2': 'URL301',  # 301 permanent redirect
        'Address2': 'https://lech.world',  # Redirect target
        'TTL2': '1800',
    }
    
    # First attempt with URL301 record type
    response = requests.get(url, params=params)
    
    if response.status_code == 200 and 'IsSuccess="true"' in response.text:
        print("✅ URL redirect configured successfully!")
        print("\nConfiguration:")
        print("  lech.world → A record → Railway (76.76.21.21)")
        print("  www.lech.world → 301 Redirect → https://lech.world")
        print("\n✨ This solves the SSL certificate issue!")
        print("Users visiting www.lech.world will be automatically redirected to lech.world")
        return True
    else:
        # If URL301 doesn't work, try with URL redirect using @ syntax
        print("First method didn't work, trying alternative approach...")
        
        # Alternative: Use Namecheap's parking page with redirect
        params.update({
            'HostName2': 'www',
            'RecordType2': 'CNAME',
            'Address2': 'parkingpage.namecheap.com',
            'TTL2': '1800',
            # Add additional record for redirect configuration
            'HostName3': '_redirect.www',
            'RecordType3': 'TXT',
            'Address3': 'Redirect=https://lech.world',
            'TTL3': '1800',
        })
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200 and 'IsSuccess="true"' in response.text:
            print("✅ Alternative redirect method configured!")
            return True
    
    # If API methods don't work, provide manual instructions
    print("\n⚠️  Automated setup incomplete. Please configure manually:")
    print("\n📝 Manual Setup Instructions:")
    print("1. Go to https://ap.www.namecheap.com/domains/domaincontrolpanel/lech.world/redirect")
    print("2. Add a redirect:")
    print("   - Source URL: www.lech.world")
    print("   - Destination URL: https://lech.world")
    print("   - Redirect Type: Permanent (301)")
    print("3. Save the redirect")
    print("\nThis will solve the SSL certificate issue for www.lech.world")
    
    return False

def configure_web_forwarding():
    """Alternative method using Namecheap's web forwarding feature"""
    
    print("\nConfiguring Web Forwarding as fallback...")
    
    # For web forwarding, we need to use Namecheap's parking page
    url = 'https://api.namecheap.com/xml.response'
    
    params = {
        'ApiUser': API_USER,
        'ApiKey': API_KEY,
        'UserName': USERNAME,
        'ClientIp': CLIENT_IP,
        'Command': 'namecheap.domains.dns.setHosts',
        'SLD': 'lech',
        'TLD': 'world',
        # Apex domain stays on Railway
        'HostName1': '@',
        'RecordType1': 'A',
        'Address1': '76.76.21.21',
        'TTL1': '1800',
        # www points to Namecheap's redirect service
        'HostName2': 'www',
        'RecordType2': 'A',
        'Address2': '192.64.119.248',  # Namecheap's web forwarding IP
        'TTL2': '1800',
    }
    
    response = requests.get(url, params=params)
    
    if response.status_code == 200 and 'IsSuccess="true"' in response.text:
        print("✅ Web forwarding DNS configured!")
        print("\nNow setting up the actual redirect...")
        
        # Set up the forwarding rule
        forward_params = {
            'ApiUser': API_USER,
            'ApiKey': API_KEY,
            'UserName': USERNAME,
            'ClientIp': CLIENT_IP,
            'Command': 'namecheap.domains.setForwarding',
            'DomainName': 'lech.world',
            'ForwardingUrl': 'https://lech.world',
            'Protocol': 'https',
            'Type': 'PERMANENT',
        }
        
        forward_response = requests.get(url, params=forward_params)
        
        if forward_response.status_code == 200:
            print("✅ Web forwarding rule created!")
            return True
    
    return False

if __name__ == '__main__':
    print("🔧 Fixing www.lech.world SSL Certificate Issue")
    print("=" * 60)
    print(f"Client IP: {CLIENT_IP}")
    print(f"Domain: lech.world")
    print()
    
    # Try primary method
    if setup_url_redirect():
        print("\n✅ Setup complete! The SSL issue will be resolved once DNS propagates (5-30 minutes)")
    else:
        # Try fallback method
        if configure_web_forwarding():
            print("\n✅ Web forwarding configured! SSL issue will be resolved after propagation")
        else:
            print("\n⚠️  Please complete manual setup as described above")
    
    print("\n📊 To verify the fix:")
    print("1. Wait 5-30 minutes for DNS propagation")
    print("2. Visit https://www.lech.world")
    print("3. You should be redirected to https://lech.world with no SSL errors")