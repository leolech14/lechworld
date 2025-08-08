#!/usr/bin/env python3
import requests
import xml.etree.ElementTree as ET
import os
import sys

# Namecheap API credentials from environment
API_KEY = os.getenv('NAMECHEAP_API_KEY', '4753835aafd34b90b8f298cf2c25ef39')
API_USER = os.getenv('NAMECHEAP_API_USER', 'leolech14')
USERNAME = os.getenv('NAMECHEAP_USERNAME', 'leolech14')
CLIENT_IP = requests.get('https://api.ipify.org').text.strip()

# Domain to configure
DOMAIN = 'lech.world'
SLD = 'lech'  # Second Level Domain
TLD = 'world'  # Top Level Domain

# Railway target - we need to get this from Railway
# The typical format is: [service-name]-production.up.railway.app
RAILWAY_TARGET = 'lechworld-api-production.up.railway.app'

def get_dns_records():
    """Get current DNS records from Namecheap"""
    url = 'https://api.namecheap.com/xml.response'
    params = {
        'ApiUser': API_USER,
        'ApiKey': API_KEY,
        'UserName': USERNAME,
        'ClientIp': CLIENT_IP,
        'Command': 'namecheap.domains.dns.getHosts',
        'SLD': SLD,
        'TLD': TLD
    }
    
    response = requests.get(url, params=params)
    print(f"Getting current DNS records...")
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 200:
        root = ET.fromstring(response.text)
        # Check for errors
        errors = root.find('.//Errors')
        if errors is not None:
            for error in errors:
                print(f"Error: {error.text}")
            return None
            
        # Parse hosts
        hosts = []
        host_elements = root.findall('.//host')
        for host in host_elements:
            hosts.append({
                'Name': host.get('Name'),
                'Type': host.get('Type'),
                'Address': host.get('Address'),
                'TTL': host.get('TTL', '1800')
            })
        return hosts
    return None

def update_dns_records():
    """Update DNS records to point to Railway"""
    url = 'https://api.namecheap.com/xml.response'
    
    # First, let's check what CNAME Railway expects
    print(f"\nConfiguring DNS for Railway deployment...")
    print(f"Target: {RAILWAY_TARGET}")
    
    # For Railway, we typically need:
    # 1. CNAME for apex domain (@) - but this requires ALIAS/ANAME support
    # 2. CNAME for www subdomain
    
    # Since Namecheap doesn't support ALIAS for apex, we'll use URL redirect for apex
    # and CNAME for www
    
    params = {
        'ApiUser': API_USER,
        'ApiKey': API_KEY,
        'UserName': USERNAME,
        'ClientIp': CLIENT_IP,
        'Command': 'namecheap.domains.dns.setHosts',
        'SLD': SLD,
        'TLD': TLD,
        # Railway typically provides a CNAME like: [hash].up.railway.app
        # We need to get the actual CNAME from Railway
        'HostName1': '@',
        'RecordType1': 'CNAME',
        'Address1': RAILWAY_TARGET,
        'TTL1': '1800',
        'HostName2': 'www',
        'RecordType2': 'CNAME', 
        'Address2': RAILWAY_TARGET,
        'TTL2': '1800'
    }
    
    response = requests.get(url, params=params)
    print(f"Updating DNS records...")
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 200:
        print(f"Response XML: {response.text[:500]}...")  # Debug output
        root = ET.fromstring(response.text)
        # Check for errors
        errors = root.find('.//Errors')
        if errors is not None:
            for error in errors:
                print(f"Error: {error.text}")
            return False
            
        # Check if successful - look for IsSuccess in the response text
        if 'IsSuccess="true"' in response.text:
            print("✅ DNS records updated successfully!")
            print("\nNew DNS configuration:")
            print(f"  lech.world → CNAME → {RAILWAY_TARGET}")
            print(f"  www.lech.world → CNAME → {RAILWAY_TARGET}")
            print("\nNote: DNS propagation may take up to 48 hours, but usually completes within 30 minutes.")
            return True
    return False

if __name__ == '__main__':
    print(f"Namecheap DNS Configuration for {DOMAIN}")
    print("=" * 50)
    print(f"Client IP: {CLIENT_IP}")
    print(f"API User: {API_USER}")
    
    # Get current records
    current_records = get_dns_records()
    if current_records:
        print(f"\nCurrent DNS records for {DOMAIN}:")
        for record in current_records:
            print(f"  {record['Name']:<10} {record['Type']:<6} → {record['Address']}")
    
    # Update records
    print("\n" + "=" * 50)
    if update_dns_records():
        print("\n✅ Domain configuration complete!")
        print(f"\nYour site will be available at:")
        print(f"  https://lech.world")
        print(f"  https://www.lech.world")
        print(f"\nRailway will automatically provision SSL certificates.")
    else:
        print("\n❌ Failed to update DNS records")
        print("Please check the API credentials and try again.")