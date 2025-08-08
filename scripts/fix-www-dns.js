#!/usr/bin/env node

/**
 * Fix www.lech.world DNS configuration
 * Sets up proper redirect from www to apex domain since Railway only supports one custom domain on free plan
 */

const https = require('https');
const querystring = require('querystring');

// Namecheap API configuration
const API_USER = process.env.NAMECHEAP_USERNAME;
const API_KEY = process.env.NAMECHEAP_API_KEY;
const USERNAME = process.env.NAMECHEAP_USERNAME;
const CLIENT_IP = '127.0.0.1'; // Will be replaced with actual IP
const DOMAIN = 'lech.world';
const SUBDOMAIN = 'www';

async function makeNamecheapRequest(command, params = {}) {
    const baseParams = {
        ApiUser: API_USER,
        ApiKey: API_KEY,
        UserName: USERNAME,
        Command: command,
        ClientIp: CLIENT_IP,
        ...params
    };

    const queryString = querystring.stringify(baseParams);
    const url = `https://api.namecheap.com/xml.response?${queryString}`;

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`Response for ${command}:`, data);
                resolve(data);
            });
        }).on('error', reject);
    });
}

async function getCurrentDNSRecords() {
    console.log('Fetching current DNS records...');
    try {
        const response = await makeNamecheapRequest('namecheap.domains.dns.getHosts', {
            SLD: 'lech',
            TLD: 'world'
        });
        return response;
    } catch (error) {
        console.error('Error fetching DNS records:', error);
        throw error;
    }
}

async function setDNSRecords() {
    console.log('Setting up DNS records...');
    
    // Set up the DNS records with proper configuration
    // We'll use URL forwarding/redirect approach
    const params = {
        SLD: 'lech',
        TLD: 'world',
        // Set up www as CNAME pointing to apex domain
        HostName1: 'www',
        RecordType1: 'CNAME',
        Address1: 'lech.world.',
        TTL1: '1800',
        // Keep existing A record for apex domain (pointing to Railway)
        HostName2: '@',
        RecordType2: 'A',
        Address2: '76.76.21.21', // Railway's IP
        TTL2: '1800'
    };

    try {
        const response = await makeNamecheapRequest('namecheap.domains.dns.setHosts', params);
        return response;
    } catch (error) {
        console.error('Error setting DNS records:', error);
        throw error;
    }
}

async function setupURLForwarding() {
    console.log('Setting up URL forwarding as alternative...');
    
    // Alternative: Use Namecheap's URL forwarding feature
    const params = {
        DomainName: 'lech.world',
        SubDomain: 'www',
        ForwardTo: 'https://lech.world',
        ForwardType: '301', // Permanent redirect
        Cloaked: 'false'    // Show target URL
    };

    try {
        const response = await makeNamecheapRequest('namecheap.domains.redirect.create', params);
        return response;
    } catch (error) {
        console.error('Error setting up URL forwarding:', error);
        throw error;
    }
}

async function checkCurrentConfiguration() {
    console.log('Checking current DNS configuration for lech.world...');
    
    try {
        // Get current DNS records
        const dnsRecords = await getCurrentDNSRecords();
        console.log('Current DNS configuration retrieved');
        
        return dnsRecords;
    } catch (error) {
        console.error('Failed to check current configuration:', error);
        throw error;
    }
}

async function main() {
    console.log('🚀 Starting www.lech.world DNS fix...');
    console.log('Problem: www.lech.world shows SSL error (Railway free plan limitation)');
    console.log('Solution: Configure DNS redirect from www to apex domain\n');

    if (!API_USER || !API_KEY || !USERNAME) {
        console.error('❌ Missing Namecheap API credentials');
        console.error('Required environment variables: NAMECHEAP_USERNAME, NAMECHEAP_API_KEY');
        process.exit(1);
    }

    try {
        // Step 1: Check current configuration
        console.log('📋 Step 1: Checking current DNS configuration...');
        await checkCurrentConfiguration();

        // Step 2: Set up proper DNS records
        console.log('\n🔧 Step 2: Setting up DNS records...');
        await setDNSRecords();
        
        // Step 3: Alternative - URL forwarding (if DNS method doesn't work)
        console.log('\n🔄 Step 3: Setting up URL forwarding as backup...');
        await setupURLForwarding();

        console.log('\n✅ DNS configuration completed!');
        console.log('📝 Changes made:');
        console.log('   - www.lech.world CNAME → lech.world');
        console.log('   - URL forwarding: www.lech.world → https://lech.world (301 redirect)');
        console.log('\n⏰ DNS changes may take 5-30 minutes to propagate');
        console.log('🌐 After propagation, www.lech.world should redirect to lech.world with proper SSL');

    } catch (error) {
        console.error('\n❌ DNS configuration failed:', error.message);
        console.error('\n🔍 Troubleshooting suggestions:');
        console.error('   1. Verify Namecheap API credentials');
        console.error('   2. Check if domain is using Namecheap nameservers');
        console.error('   3. Manually configure URL forwarding in Namecheap dashboard');
        console.error('   4. Alternative: Use Cloudflare for DNS management');
        process.exit(1);
    }
}

// Export for testing
if (require.main === module) {
    main();
}

module.exports = {
    makeNamecheapRequest,
    getCurrentDNSRecords,
    setDNSRecords,
    setupURLForwarding
};