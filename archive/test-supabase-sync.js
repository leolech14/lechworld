// Test script to verify Supabase sync functionality
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testSupabaseSync() {
  console.log('🔍 Testing Supabase sync functionality...\n');
  
  try {
    // 1. Check current data in Supabase
    console.log('1. Fetching current family members from Supabase:');
    const { data: members, error } = await supabase
      .from('family_members')
      .select('*')
      .order('id');
    
    if (error) {
      console.error('❌ Error fetching members:', error);
      return;
    }
    
    if (members.length === 0) {
      console.log('⚠️  No members found in Supabase');
      return;
    }
    
    console.log(`✅ Found ${members.length} members in Supabase:`);
    members.forEach(member => {
      console.log(`   - ${member.name} (ID: ${member.id})`);
      console.log(`     Frame Color: ${member.frame_color || 'not set'}`);
      console.log(`     Border Color: ${member.frame_border_color || 'not set'}`);
      console.log(`     Emoji: ${member.profile_emoji || 'not set'}`);
    });
    
    // 2. Test update functionality
    console.log('\n2. Testing update sync...');
    const testMember = members[0];
    const newFrameColor = '#FF5733'; // Orange color
    const newBorderColor = '#C70039'; // Red color
    const newEmoji = '🚀';
    
    console.log(`Updating member: ${testMember.name} (ID: ${testMember.id})`);
    console.log(`New frame color: ${newFrameColor}`);
    console.log(`New border color: ${newBorderColor}`);
    console.log(`New emoji: ${newEmoji}`);
    
    const { data: updatedMember, error: updateError } = await supabase
      .from('family_members')
      .update({
        frame_color: newFrameColor,
        frame_border_color: newBorderColor,
        profile_emoji: newEmoji
      })
      .eq('id', testMember.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating member:', updateError);
      return;
    }
    
    console.log('✅ Member updated successfully in Supabase!');
    console.log('Updated data:', {
      id: updatedMember.id,
      name: updatedMember.name,
      frame_color: updatedMember.frame_color,
      frame_border_color: updatedMember.frame_border_color,
      profile_emoji: updatedMember.profile_emoji
    });
    
    // 3. Verify the update persisted
    console.log('\n3. Verifying update persistence...');
    const { data: verifyMember, error: verifyError } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', testMember.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }
    
    const updateSuccess = 
      verifyMember.frame_color === newFrameColor &&
      verifyMember.frame_border_color === newBorderColor &&
      verifyMember.profile_emoji === newEmoji;
    
    if (updateSuccess) {
      console.log('✅ Update verification successful! Changes persisted in Supabase.');
    } else {
      console.log('❌ Update verification failed! Changes did not persist.');
      console.log('Expected:', { newFrameColor, newBorderColor, newEmoji });
      console.log('Actual:', { 
        frame_color: verifyMember.frame_color,
        frame_border_color: verifyMember.frame_border_color,
        profile_emoji: verifyMember.profile_emoji
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testSupabaseSync();