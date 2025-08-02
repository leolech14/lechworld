import fetch from 'node-fetch';

async function testAPI() {
  console.log('Testing API directly...\n');
  
  // First login to get token
  const loginResponse = await fetch('https://www.lech.world/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'leonardo',
      password: 'lech'
    })
  });
  
  const loginData = await loginResponse.json();
  console.log('Login response:', loginData);
  
  if (loginData.token) {
    // Get dashboard data
    const dashboardResponse = await fetch('https://www.lech.world/api/dashboard', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Cookie': `token=${loginData.token}`
      }
    });
    
    const dashboardData = await dashboardResponse.json();
    console.log('\nDashboard API response:');
    console.log('- Family Members:', dashboardData.familyMembers?.length || 0);
    console.log('- Programs:', dashboardData.programs?.length || 0);
    console.log('- Member Programs:', dashboardData.memberPrograms?.length || 0);
    console.log('- Stats:', dashboardData.stats);
    
    if (dashboardData.familyMembers) {
      console.log('\nFamily members:', dashboardData.familyMembers.map(m => m.name));
    }
  }
}

testAPI();