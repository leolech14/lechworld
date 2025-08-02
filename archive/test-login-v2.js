import { chromium } from 'playwright';

async function testLogin() {
  console.log('🚀 Starting browser...');
  const browser = await chromium.launch({ 
    headless: false // Set to false to see what's happening
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('📍 Navigating to https://www.lech.world...');
    await page.goto('https://www.lech.world', { waitUntil: 'domcontentloaded' });
    
    // Wait for the page to be ready
    await page.waitForTimeout(2000);
    
    // Check current URL
    console.log('📍 Current URL:', page.url());
    
    // Check if we're on the login page by looking for username field
    const usernameField = page.locator('#username');
    const isLoginPage = await usernameField.isVisible();
    
    if (isLoginPage) {
      console.log('✅ Login page detected');
      
      // Fill in the login form
      console.log('📝 Filling login form...');
      await usernameField.fill('leonardo');
      await page.fill('#password', 'lech');
      
      // Take screenshot of filled form
      await page.screenshot({ path: 'login-filled.png' });
      console.log('📸 Screenshot saved: login-filled.png');
      
      // Find and click the login button with better selector
      console.log('🔐 Clicking login button...');
      await page.click('button:has-text("Login")', { timeout: 5000 });
      
      // Wait for navigation
      console.log('⏳ Waiting for response...');
      await Promise.race([
        page.waitForURL('**/dashboard', { timeout: 10000 }),
        page.waitForSelector('.text-red-500', { timeout: 10000 })
      ]).catch(() => {});
      
      // Check result
      const currentUrl = page.url();
      console.log('📍 New URL:', currentUrl);
      
      if (currentUrl.includes('dashboard')) {
        console.log('✅ Login successful! On dashboard');
        
        // Wait for content to load
        await page.waitForTimeout(3000);
        
        // Try to get dashboard data
        try {
          // Look for stats cards
          const statsCards = await page.$$('.bg-white.rounded-lg.shadow-sm, .dark\\:bg-gray-800.rounded-lg.shadow-sm');
          console.log(`\n📊 Found ${statsCards.length} stat cards`);
          
          // Get the stats text
          const statsText = await page.$$eval('.bg-white.rounded-lg.shadow-sm p.text-2xl, .dark\\:bg-gray-800.rounded-lg.shadow-sm p.text-2xl', 
            elements => elements.map(el => el.textContent)
          );
          
          if (statsText.length > 0) {
            console.log('📈 Dashboard values:', statsText);
          }
          
          // Look for the quote
          const quote = await page.$eval('blockquote', el => el.textContent).catch(() => null);
          if (quote) {
            console.log('\n💬 Quote found:', quote.substring(0, 50) + '...');
          }
          
        } catch (e) {
          console.log('⚠️ Could not extract dashboard data:', e.message);
        }
        
        // Take final screenshot
        await page.screenshot({ path: 'dashboard-final.png', fullPage: true });
        console.log('📸 Dashboard screenshot saved: dashboard-final.png');
        
      } else if (await page.locator('.text-red-500').isVisible()) {
        const error = await page.locator('.text-red-500').textContent();
        console.log('❌ Login failed with error:', error);
      } else {
        console.log('⚠️ Unexpected state. Taking screenshot...');
        await page.screenshot({ path: 'unexpected-state.png' });
      }
      
    } else {
      // Maybe already logged in?
      if (page.url().includes('dashboard')) {
        console.log('✅ Already on dashboard!');
      } else {
        console.log('⚠️ Not on login page. Current content:');
        const bodyText = await page.$eval('body', el => el.innerText.substring(0, 200));
        console.log(bodyText);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    
    // Take error screenshot
    await page.screenshot({ path: 'error-final.png' });
    console.log('📸 Error screenshot saved: error-final.png');
    
  } finally {
    console.log('\n🔄 Closing browser in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
    console.log('✅ Test completed');
  }
}

// Run the test
testLogin().catch(console.error);