import { chromium } from 'playwright';

async function testLogin() {
  console.log('🚀 Starting browser...');
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 // Slow down actions to see what's happening
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('📍 Navigating to https://www.lech.world...');
    await page.goto('https://www.lech.world');
    
    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    console.log('📍 Current URL:', page.url());
    
    // Fill login form
    console.log('📝 Filling login form...');
    await page.fill('#username', 'leonardo');
    await page.fill('#password', 'lech');
    
    // Take screenshot
    await page.screenshot({ path: 'before-login.png' });
    
    // Try submitting the form directly with Enter key
    console.log('🔐 Submitting form with Enter key...');
    await page.press('#password', 'Enter');
    
    // Wait for navigation or error
    console.log('⏳ Waiting for response...');
    
    // Wait for either dashboard or error
    const response = await Promise.race([
      page.waitForURL('**/dashboard', { timeout: 15000 }).then(() => 'dashboard'),
      page.waitForSelector('text=Invalid credentials', { timeout: 15000 }).then(() => 'error'),
      page.waitForSelector('text=Login failed', { timeout: 15000 }).then(() => 'error'),
      page.waitForTimeout(15000).then(() => 'timeout')
    ]);
    
    console.log('📍 Result:', response);
    console.log('📍 Final URL:', page.url());
    
    if (response === 'dashboard' || page.url().includes('dashboard')) {
      console.log('✅ Login successful!');
      
      // Wait for dashboard to load
      await page.waitForTimeout(3000);
      
      // Extract dashboard data
      const dashboardData = await page.evaluate(() => {
        const data = {
          stats: {},
          quote: '',
          hasContent: false
        };
        
        // Get stats
        const statCards = document.querySelectorAll('.bg-white.rounded-lg.shadow-sm, .dark\\:bg-gray-800.rounded-lg.shadow-sm');
        statCards.forEach(card => {
          const label = card.querySelector('p.text-sm')?.textContent?.trim();
          const value = card.querySelector('p.text-2xl')?.textContent?.trim();
          if (label && value) {
            data.stats[label] = value;
            data.hasContent = true;
          }
        });
        
        // Get quote
        const quote = document.querySelector('blockquote');
        if (quote) {
          data.quote = quote.textContent.trim();
        }
        
        return data;
      });
      
      console.log('\n📊 Dashboard Data:');
      console.log('Stats:', dashboardData.stats);
      if (dashboardData.quote) {
        console.log('Quote:', dashboardData.quote.substring(0, 60) + '...');
      }
      
      // Take final screenshot
      await page.screenshot({ path: 'dashboard-success.png', fullPage: true });
      console.log('📸 Dashboard screenshot saved');
      
    } else if (response === 'error') {
      const errorText = await page.textContent('.text-red-500, [role="alert"]');
      console.log('❌ Login failed:', errorText);
      await page.screenshot({ path: 'login-error.png' });
    } else {
      console.log('⚠️ Login timed out or unexpected state');
      await page.screenshot({ path: 'timeout-state.png' });
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    console.log('\n⏸️  Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
    console.log('✅ Test completed');
  }
}

// Run the test
testLogin().catch(console.error);