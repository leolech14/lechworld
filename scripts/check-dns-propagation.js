#!/usr/bin/env node

/**
 * Check DNS propagation status for www.lech.world fix
 */

const { exec } = require('child_process');
const https = require('https');
const util = require('util');
const execAsync = util.promisify(exec);

async function checkDNS(domain) {
    try {
        const { stdout } = await execAsync(`dig ${domain} +short`);
        return stdout.trim().split('\n').filter(line => line.length > 0);
    } catch (error) {
        return [`Error: ${error.message}`];
    }
}

async function checkHTTPS(url) {
    return new Promise((resolve) => {
        const request = https.get(url, (res) => {
            resolve({
                status: res.statusCode,
                headers: {
                    'strict-transport-security': res.headers['strict-transport-security'],
                    'server': res.headers.server,
                    'x-railway-edge': res.headers['x-railway-edge']
                }
            });
        }).on('error', (error) => {
            resolve({
                error: error.message,
                code: error.code
            });
        });
        
        request.setTimeout(5000, () => {
            request.destroy();
            resolve({ error: 'Timeout after 5s' });
        });
    });
}

async function main() {
    console.log('🔍 Checking DNS propagation status for www.lech.world fix\n');

    // Check DNS records
    console.log('📋 DNS Resolution:');
    const apexDNS = await checkDNS('lech.world');
    const wwwDNS = await checkDNS('www.lech.world');
    
    console.log(`   lech.world     → ${apexDNS.join(', ')}`);
    console.log(`   www.lech.world → ${wwwDNS.join(', ')}\n`);

    // Check HTTPS connectivity
    console.log('🔒 HTTPS Status:');
    
    const apexHTTPS = await checkHTTPS('https://lech.world');
    console.log('   lech.world:');
    if (apexHTTPS.error) {
        console.log(`      ❌ Error: ${apexHTTPS.error}`);
    } else {
        console.log(`      ✅ Status: ${apexHTTPS.status}`);
        console.log(`      🚀 Server: ${apexHTTPS.headers.server || 'Unknown'}`);
    }

    const wwwHTTPS = await checkHTTPS('https://www.lech.world');
    console.log('   www.lech.world:');
    if (wwwHTTPS.error) {
        if (wwwHTTPS.code === 'CERT_HAS_EXPIRED' || wwwHTTPS.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
            console.log(`      ⏳ SSL Error (expected during propagation): ${wwwHTTPS.error}`);
        } else {
            console.log(`      ❌ Error: ${wwwHTTPS.error}`);
        }
    } else {
        console.log(`      ✅ Status: ${wwwHTTPS.status}`);
        console.log(`      🚀 Server: ${wwwHTTPS.headers.server || 'Unknown'}`);
    }

    // Determine status
    console.log('\n📊 Propagation Status:');
    
    const isWWWCNAME = wwwDNS.some(record => record.includes('lech.world') || record.includes('railway'));
    const isApexWorking = !apexHTTPS.error;
    
    if (isWWWCNAME && isApexWorking) {
        console.log('   ✅ DNS records configured correctly');
        if (wwwHTTPS.error) {
            console.log('   ⏳ Waiting for full SSL propagation (normal, can take up to 30 minutes)');
            console.log('   💡 The www subdomain will use the apex domain SSL certificate');
        } else {
            console.log('   🎉 www.lech.world SSL issue resolved!');
        }
    } else {
        console.log('   ⏳ DNS propagation still in progress...');
    }

    console.log('\n🔄 To check again: node scripts/check-dns-propagation.js');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { checkDNS, checkHTTPS };