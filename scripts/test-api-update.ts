import fetch from 'node-fetch';

async function testMemberUpdate() {
  // First, login
  const loginResponse = await fetch('http://localhost:4444/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'lech',
      password: 'lechworld'
    }),
  });

  const cookies = loginResponse.headers.get('set-cookie');
  console.log('Login response:', loginResponse.status);

  if (!cookies) {
    console.error('No cookies received');
    return;
  }

  // Get members
  const membersResponse = await fetch('http://localhost:4444/api/members', {
    headers: {
      'Cookie': cookies,
    },
  });

  const { members } = await membersResponse.json();
  console.log('Members:', members);

  if (members && members.length > 0) {
    const member = members[0];
    console.log('\nFirst member:', {
      id: member.id,
      name: member.name,
      frameColor: member.frameColor,
      frameBorderColor: member.frameBorderColor,
      profileEmoji: member.profileEmoji,
    });

    // Try to update
    const updateData = {
      ...member,
      frameColor: '#FF0000',
      frameBorderColor: '#00FF00',
      profileEmoji: '🎨',
    };

    console.log('\nSending update:', updateData);

    const updateResponse = await fetch(`http://localhost:4444/api/members/${member.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
      },
      body: JSON.stringify(updateData),
    });

    const updateResult = await updateResponse.json();
    console.log('\nUpdate response:', updateResponse.status);
    console.log('Updated member:', updateResult);
  }
}

testMemberUpdate().catch(console.error);