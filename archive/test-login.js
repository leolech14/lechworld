import { chromium } from 'playwright';

async function testLogin() {
  console.log('🚀 Starting browser...');
  const browser = await chromium.launch({ 
    headless: true // Set to false if you want to see the browser
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('📍 Navigating to https://www.lech.world...');
    await page.goto('https://www.lech.world', { waitUntil: 'networkidle' });
    
    // Check if we're on the login page
    const loginForm = await page.locator('form').first();
    if (await loginForm.isVisible()) {
      console.log('✅ Login page loaded');
      
      // Fill in the login form
      console.log('📝 Filling login form...');
      await page.fill('#username', 'leonardo');
      await page.fill('#password', 'lech');
      
      // Take screenshot of login page
      await page.screenshot({ path: 'login-page.png' });
      console.log('📸 Screenshot saved: login-page.png');
      
      // Submit the form
      console.log('🔐 Submitting login...');
      await page.click('button[type="submit"]');
      
      // Wait for navigation or error
      await page.waitForLoadState('networkidle');
      
      // Check if login was successful by looking for dashboard elements
      const dashboardUrl = page.url();
      console.log('📍 Current URL:', dashboardUrl);
      
      if (dashboardUrl.includes('dashboard')) {
        console.log('✅ Login successful! Redirected to dashboard');
        
        // Wait for dashboard content to load
        await page.waitForTimeout(2000);
        
        // Get dashboard statistics
        const stats = await page.evaluate(() => {
          const cards = document.querySelectorAll('.rounded-lg.shadow-sm');
          const statsData = {};
          
          cards.forEach(card => {
            const label = card.querySelector('p.text-sm')?.textContent;
            const value = card.querySelector('p.text-2xl')?.textContent;
            if (label && value) {
              statsData[label] = value;
            }
          });
          
          return statsData;
        });
        
        console.log('\n📊 Dashboard Statistics:');
        Object.entries(stats).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
        
        // Look for family members
        const members = await page.$$eval('[data-member]', elements => 
          elements.map(el => el.textContent)
        );
        
        if (members.length > 0) {
          console.log('\n👥 Family Members Found:', members.length);
        }
        
        // Take screenshot of dashboard
        await page.screenshot({ path: 'dashboard.png', fullPage: true });
        console.log('📸 Dashboard screenshot saved: dashboard.png');
        
      } else {
        // Check for error messages
        const errorMessage = await page.locator('.text-red-500').textContent().catch(() => null);
        if (errorMessage) {
          console.log('❌ Login failed:', errorMessage);
        } else {
          console.log('⚠️ Login status unclear. Current URL:', dashboardUrl);
        }
      }
      
    } else {
      console.log('⚠️ Login form not found. Page might have changed.');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    
    // Take error screenshot
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('📸 Error screenshot saved: error-screenshot.png');
    
  } finally {
    await browser.close();
    console.log('\n✅ Test completed');
  }
}

// Run the test
testLogin().catch(console.error);