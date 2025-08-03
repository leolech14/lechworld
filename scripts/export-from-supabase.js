import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Use the Supabase credentials from .env
const supabaseUrl = 'https://ixzwjmbvmrefsivcmirz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4endqbWJ2bXJlZnNpdmNtaXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjk3NjI4OSwiZXhwIjoyMDY4NTUyMjg5fQ.xz_TEASFWMReLnVM76_U0JQ4DWXys6JUHBHlHXRJCyM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function exportData() {
  console.log('🚀 Starting Supabase data export...');
  
  const exportData = {
    users: [],
    family_members: [],
    loyalty_programs: [],
    member_programs: [],
    // Add more tables as needed
  };

  try {
    // Skip families table for now as it might not exist in current Supabase

    // Export users
    console.log('📥 Exporting users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    if (usersError) throw usersError;
    exportData.users = users || [];
    console.log(`✅ Exported ${exportData.users.length} users`);

    // Export family_members
    console.log('📥 Exporting family members...');
    const { data: familyMembers, error: membersError } = await supabase
      .from('family_members')
      .select('*');
    if (membersError) throw membersError;
    exportData.family_members = familyMembers || [];
    console.log(`✅ Exported ${exportData.family_members.length} family members`);

    // Export loyalty_programs (airlines)
    console.log('📥 Exporting loyalty programs...');
    const { data: loyaltyPrograms, error: programsError } = await supabase
      .from('loyalty_programs')
      .select('*');
    if (programsError) throw programsError;
    exportData.loyalty_programs = loyaltyPrograms || [];
    console.log(`✅ Exported ${exportData.loyalty_programs.length} loyalty programs`);

    // Export member_programs
    console.log('📥 Exporting member programs...');
    const { data: memberPrograms, error: memberProgramsError } = await supabase
      .from('member_programs')
      .select('*');
    if (memberProgramsError) throw memberProgramsError;
    exportData.member_programs = memberPrograms || [];
    console.log(`✅ Exported ${exportData.member_programs.length} member programs`);

    // Save to file
    const exportPath = path.join(process.cwd(), 'supabase-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`\n✅ Data exported to ${exportPath}`);
    
    // Summary
    console.log('\n📊 Export Summary:');
    Object.entries(exportData).forEach(([table, data]) => {
      console.log(`   ${table}: ${data.length} records`);
    });

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

exportData();