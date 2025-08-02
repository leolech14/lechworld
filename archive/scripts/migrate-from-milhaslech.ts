import { MongoClient } from 'mongodb';
import { supabase } from '../server/supabase';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function migrate() {
  console.log('🚀 Starting migration from MongoDB to Supabase...');
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    const mongoClient = new MongoClient(process.env.MONGO_URL!);
    await mongoClient.connect();
    const db = mongoClient.db(process.env.DB_NAME);
    console.log('✅ Connected to MongoDB');
    
    // Step 1: Create default user
    console.log('Creating default user...');
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@lechworld.com')
      .single();
    
    let userId;
    if (existingUser) {
      console.log('User already exists');
      userId = existingUser.id;
    } else {
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          name: 'Lech Admin',
          email: 'admin@lechworld.com',
          password: 'lechworld2025' // Change this after migration!
        })
        .select()
        .single();
      
      if (userError) throw userError;
      userId = user.id;
      console.log('✅ Created user:', user.email);
    }
    
    // Step 2: Migrate companies to loyalty_programs
    console.log('Migrating companies...');
    const companies = await db.collection('companies').find({}).toArray();
    console.log(`Found ${companies.length} companies`);
    
    const companyMap = new Map();
    
    for (const company of companies) {
      // Check if program already exists
      const { data: existing } = await supabase
        .from('loyalty_programs')
        .select('*')
        .eq('name', company.name)
        .single();
      
      if (existing) {
        companyMap.set(company.id, existing.id);
        console.log(`Program ${company.name} already exists`);
      } else {
        const { data: program, error } = await supabase
          .from('loyalty_programs')
          .insert({
            name: company.name,
            company: company.name,
            logo_color: company.color || '#000000'
          })
          .select()
          .single();
        
        if (error) {
          console.error(`Error creating program ${company.name}:`, error);
          continue;
        }
        
        companyMap.set(company.id, program.id);
        console.log(`✅ Created program: ${company.name}`);
      }
    }
    
    // Step 3: Migrate members and their programs
    console.log('Migrating members...');
    const members = await db.collection('members').find({}).toArray();
    console.log(`Found ${members.length} members`);
    
    for (const member of members) {
      // Check if member already exists
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('*')
        .eq('name', member.name)
        .eq('user_id', userId)
        .single();
      
      let memberId;
      if (existingMember) {
        memberId = existingMember.id;
        console.log(`Member ${member.name} already exists`);
      } else {
        const { data: familyMember, error } = await supabase
          .from('family_members')
          .insert({
            user_id: userId,
            name: member.name,
            email: member.email || null,
            phone: member.phone || null
          })
          .select()
          .single();
        
        if (error) {
          console.error(`Error creating member ${member.name}:`, error);
          continue;
        }
        
        memberId = familyMember.id;
        console.log(`✅ Created member: ${member.name}`);
      }
      
      // Migrate programs for this member
      if (member.programs && typeof member.programs === 'object') {
        for (const [companyId, programData] of Object.entries(member.programs)) {
          const programId = companyMap.get(companyId);
          
          if (!programId) {
            console.warn(`Program not found for company ID: ${companyId}`);
            continue;
          }
          
          // Check if member program already exists
          const { data: existingMP } = await supabase
            .from('member_programs')
            .select('*')
            .eq('member_id', memberId)
            .eq('program_id', programId)
            .single();
          
          if (existingMP) {
            console.log(`Member program already exists for ${member.name}`);
            continue;
          }
          
          const mpData: any = programData;
          const { error } = await supabase
            .from('member_programs')
            .insert({
              member_id: memberId,
              program_id: programId,
              login: mpData.login || '',
              password: mpData.password || '',
              cpf: mpData.cpf || '',
              account_number: mpData.card_number || '',
              points_balance: parseInt(mpData.current_balance) || 0,
              elite_tier: mpData.elite_tier || '',
              notes: mpData.notes || '',
              last_updated: mpData.last_updated || new Date().toISOString()
            });
          
          if (error) {
            console.error(`Error creating member program:`, error);
          } else {
            console.log(`✅ Added program for ${member.name}`);
          }
        }
      }
    }
    
    // Step 4: Migrate activity logs (if exists)
    try {
      const logs = await db.collection('global_log').find({}).limit(100).toArray();
      console.log(`Found ${logs.length} activity logs`);
      
      for (const log of logs) {
        await supabase
          .from('activity_logs')
          .insert({
            user_id: userId,
            action: log.action || 'unknown',
            description: log.description || JSON.stringify(log),
            metadata: log.metadata || {},
            timestamp: log.timestamp || new Date().toISOString()
          });
      }
      console.log('✅ Migrated activity logs');
    } catch (e) {
      console.log('No activity logs to migrate');
    }
    
    await mongoClient.close();
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default password for admin@lechworld.com');
    console.log('Default password is: lechworld2025');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();