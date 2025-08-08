#!/usr/bin/env python3
"""
Update Namecheap DNS records to point to Railway deployment
"""
import requests
import xml.etree.ElementTree as ET
import os

# Namecheap API credentials from Doppler
API_USER = "leolech14"
API_KEY = "4753835aafd34b90b8f298cf2c25ef39"
USERNAME = "leolech14"
DOMAIN = "lech.world"
RAILWAY_CNAME = "gogifay2.up.railway.app"

# Namecheap API endpoints
BASE_URL = "https://api.namecheap.com/xml.response"

def get_current_dns_records():
    """Get current DNS records for the domain"""
    params = {
        'ApiUser': API_USER,
        'ApiKey': API_KEY,
        'UserName': USERNAME,
        'Command': 'namecheap.domains.dns.getHosts',
        'ClientIp': '138.197.238.178',  # Your whitelisted IP
        'SLD': 'lech',
        'TLD': 'world'
    }
    
    response = requests.get(BASE_URL, params=params)
    print(f"Current DNS Records Response: {response.status_code}")
    print(f"Response content: {response.text}")
    
    return response.text

def update_dns_records():
    """Update DNS records to point to Railway"""
    # Define the DNS records we want to set
    records = [
        {
            'HostName': '@',
            'RecordType': 'CNAME',
            'Address': RAILWAY_CNAME,
            'TTL': '1800'
        },
        {
            'HostName': 'www',
            'RecordType': 'CNAME', 
            'Address': RAILWAY_CNAME,
            'TTL': '1800'
        }
    ]
    
    # Prepare parameters for the API call
    params = {
        'ApiUser': API_USER,
        'ApiKey': API_KEY,
        'UserName': USERNAME,
        'Command': 'namecheap.domains.dns.setHosts',
        'ClientIp': '138.197.238.178',  # Your whitelisted IP
        'SLD': 'lech',
        'TLD': 'world'
    }
    
    # Add each record to the parameters
    for i, record in enumerate(records, 1):
        params[f'HostName{i}'] = record['HostName']
        params[f'RecordType{i}'] = record['RecordType']
        params[f'Address{i}'] = record['Address']
        params[f'TTL{i}'] = record['TTL']
    
    response = requests.post(BASE_URL, data=params)
    print(f"DNS Update Response: {response.status_code}")
    print(f"Response content: {response.text}")
    
    # Parse XML response
    try:
        root = ET.fromstring(response.text)
        status = root.get('Status')
        
        if status == 'OK':
            print("✅ DNS records updated successfully!")
            print("🚀 Domain configuration:")
            print(f"   lech.world → {RAILWAY_CNAME}")
            print(f"   www.lech.world → {RAILWAY_CNAME}")
            print("⏳ DNS propagation can take up to 72 hours")
        else:
            error_elem = root.find('.//Error')
            if error_elem is not None:
                print(f"❌ API Error: {error_elem.text}")
            else:
                print(f"❌ API returned status: {status}")
    except ET.ParseError as e:
        print(f"❌ Failed to parse XML response: {e}")
    
    return response.text

if __name__ == "__main__":
    print("🔍 Checking current DNS records...")
    current_records = get_current_dns_records()
    
    print("\n🔧 Updating DNS records...")
    update_result = update_dns_records()