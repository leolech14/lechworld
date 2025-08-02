// Test the application's sync functionality
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testAppSync() {
  console.log('🔍 Testing application sync functionality...\n');
  
  try {
    // 1. First, login to get a session
    console.log('1. Logging in to get session...');
    const loginResponse = await fetch('http://localhost:4444/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'lech@lechworld.com',
        password: 'lech123'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', await loginResponse.text());
      return;
    }
    
    // Extract session cookie
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful');
    
    // 2. Get current members to find one to update
    console.log('\n2. Fetching current members...');
    const membersResponse = await fetch('http://localhost:4444/api/members', {
      headers: {
        'Cookie': cookies
      }
    });
    
    if (!membersResponse.ok) {
      console.error('❌ Failed to fetch members:', await membersResponse.text());
      return;
    }
    
    const { members } = await membersResponse.json();
    if (members.length === 0) {
      console.log('⚠️  No members found');
      return;
    }
    
    const testMember = members[0];
    console.log(`✅ Found member to test: ${testMember.name} (ID: ${testMember.id})`);
    
    // 3. Check current state in Supabase
    console.log('\n3. Checking current state in Supabase...');
    const { data: supabaseBefore } = await supabase
      .from('family_members')
      .select('frame_color, frame_border_color, profile_emoji')
      .eq('id', testMember.id)
      .single();
    
    console.log('Current Supabase state:', {
      frame_color: supabaseBefore.frame_color,
      frame_border_color: supabaseBefore.frame_border_color,
      profile_emoji: supabaseBefore.profile_emoji
    });
    
    // 4. Update the member through the API (this should trigger sync)
    console.log('\n4. Updating member through API...');
    const newFrameColor = '#00FF00'; // Green
    const newBorderColor = '#008000'; // Dark green
    const newEmoji = '🔥';
    
    const updateResponse = await fetch(`http://localhost:4444/api/members/${testMember.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        frameColor: newFrameColor,
        frameBorderColor: newBorderColor,
        profileEmoji: newEmoji
      })
    });
    
    if (!updateResponse.ok) {
      console.error('❌ Update failed:', await updateResponse.text());
      return;
    }
    
    const updateResult = await updateResponse.json();
    console.log('✅ API update successful');
    console.log('Local update result:', {
      frameColor: updateResult.member.frameColor,
      frameBorderColor: updateResult.member.frameBorderColor,
      profileEmoji: updateResult.member.profileEmoji
    });
    
    // 5. Wait a moment for sync to complete
    console.log('\n5. Waiting for sync to complete...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 6. Check if the change was synced to Supabase
    console.log('\n6. Verifying sync to Supabase...');
    const { data: supabaseAfter } = await supabase
      .from('family_members')
      .select('frame_color, frame_border_color, profile_emoji')
      .eq('id', testMember.id)
      .single();
    
    console.log('Supabase state after sync:', {
      frame_color: supabaseAfter.frame_color,
      frame_border_color: supabaseAfter.frame_border_color,
      profile_emoji: supabaseAfter.profile_emoji
    });
    
    // 7. Verify the sync worked
    const syncSuccess = 
      supabaseAfter.frame_color === newFrameColor &&
      supabaseAfter.frame_border_color === newBorderColor &&
      supabaseAfter.profile_emoji === newEmoji;
    
    if (syncSuccess) {
      console.log('\n✅ 🎉 SYNC TEST SUCCESSFUL! 🎉');
      console.log('Changes made through the application API were successfully synced to Supabase!');
    } else {
      console.log('\n❌ SYNC TEST FAILED!');
      console.log('Expected:', { newFrameColor, newBorderColor, newEmoji });
      console.log('Actual in Supabase:', {
        frame_color: supabaseAfter.frame_color,
        frame_border_color: supabaseAfter.frame_border_color,
        profile_emoji: supabaseAfter.profile_emoji
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testAppSync();