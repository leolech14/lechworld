import { chromium } from 'playwright';

async function testDashboard() {
  console.log('🚀 Starting dashboard test...');
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 50
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate and login
    console.log('📍 Navigating to website...');
    await page.goto('https://www.lech.world');
    await page.waitForLoadState('networkidle');
    
    // Login
    console.log('🔐 Logging in...');
    await page.fill('#username', 'leonardo');
    await page.fill('#password', 'lech');
    await page.press('#password', 'Enter');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ On dashboard!');
    
    // Wait for content to load
    console.log('⏳ Waiting for dashboard content...');
    await page.waitForTimeout(5000); // Give time for data to load
    
    // Try multiple selectors for stats
    const stats = await page.evaluate(() => {
      const results = {
        membros: null,
        programas: null,
        pontos: null,
        valor: null
      };
      
      // Try to find stats by looking for specific text patterns
      const allText = document.body.innerText;
      
      // Look for "MEMBROS DA FAMÍLIA"
      const membrosMatch = allText.match(/(\d+)\s*MEMBROS DA FAM[IÍ]LIA/i);
      if (membrosMatch) results.membros = membrosMatch[1];
      
      // Look for "PROGRAMAS ATIVOS"
      const programasMatch = allText.match(/(\d+)\s*PROGRAMAS ATIVOS/i);
      if (programasMatch) results.programas = programasMatch[1];
      
      // Look for "PONTOS TOTAIS"
      const pontosMatch = allText.match(/(\d+)\s*PONTOS TOTAIS/i);
      if (pontosMatch) results.pontos = pontosMatch[1];
      
      // Look for "VALOR ESTIMADO"
      const valorMatch = allText.match(/R\$\s*([\d,\.]+)\s*VALOR ESTIMADO/i);
      if (valorMatch) results.valor = valorMatch[1];
      
      // Also get any visible numbers in stat cards
      const statNumbers = Array.from(document.querySelectorAll('p.text-2xl, .text-2xl'))
        .map(el => el.textContent.trim())
        .filter(text => text);
      
      return { results, statNumbers, fullText: allText.substring(0, 500) };
    });
    
    console.log('\n📊 Dashboard Statistics:');
    console.log('Membros da Família:', stats.results.membros || 'Not found');
    console.log('Programas Ativos:', stats.results.programas || 'Not found');
    console.log('Pontos Totais:', stats.results.pontos || 'Not found');
    console.log('Valor Estimado:', stats.results.valor || 'Not found');
    
    if (stats.statNumbers.length > 0) {
      console.log('\n📈 Found numbers:', stats.statNumbers);
    }
    
    // Check for family members
    const members = await page.evaluate(() => {
      // Look for member names
      const names = ['Leonardo', 'Graciela', 'Osvandré', 'Marilise'];
      const found = [];
      
      names.forEach(name => {
        if (document.body.innerText.includes(name)) {
          found.push(name);
        }
      });
      
      return found;
    });
    
    if (members.length > 0) {
      console.log('\n👥 Family members found:', members.join(', '));
    }
    
    // Check for loyalty programs
    const programs = await page.evaluate(() => {
      const programNames = ['LATAM', 'Smiles', 'GOL', 'Azul', 'Turkish', 'American', 'Copa'];
      const found = [];
      
      programNames.forEach(name => {
        if (document.body.innerText.includes(name)) {
          found.push(name);
        }
      });
      
      return found;
    });
    
    if (programs.length > 0) {
      console.log('✈️  Programs found:', programs.join(', '));
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'dashboard-final-test.png', fullPage: true });
    console.log('\n📸 Full dashboard screenshot saved: dashboard-final-test.png');
    
    // Print a sample of the page text to debug
    console.log('\n📄 Page sample:', stats.fullText);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'error-dashboard.png' });
  } finally {
    console.log('\n⏸️  Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
    console.log('✅ Test completed');
  }
}

testDashboard().catch(console.error);