import { supabase } from './supabase';
import bcrypt from 'bcryptjs';
import type { 
  User, FamilyMember, LoyaltyProgram, MemberProgram, 
  ActivityLog, InsertUser, InsertFamilyMember, 
  InsertLoyaltyProgram, InsertMemberProgram 
} from '@shared/schema';

export class SupabaseStorage {
  // User operations
  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: userData.email,
        password_hash: hashedPassword,
        name: userData.name
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      email: data.email,
      password: '', // Don't return the hash
      name: data.name,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      email: data.email,
      password: data.password_hash, // Will be compared with bcrypt
      name: data.name,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // Family member operations
  async getFamilyMembers(userId: number): Promise<FamilyMember[]> {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    
    if (error) throw error;
    
    return data.map(member => ({
      id: member.id,
      userId: member.user_id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      cpf: member.cpf,
      birthdate: member.birthdate,
      frameColor: member.frame_color,
      frameBorderColor: member.frame_border_color,
      profileEmoji: member.profile_emoji,
      createdAt: new Date(member.created_at),
      updatedAt: new Date(member.updated_at)
    }));
  }

  async getFamilyMember(id: number): Promise<FamilyMember | null> {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      cpf: data.cpf,
      birthdate: data.birthdate,
      frameColor: data.frame_color,
      frameBorderColor: data.frame_border_color,
      profileEmoji: data.profile_emoji,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async createFamilyMember(memberData: InsertFamilyMember): Promise<FamilyMember> {
    const { data, error } = await supabase
      .from('family_members')
      .insert({
        user_id: memberData.userId!,
        name: memberData.name,
        email: memberData.email,
        phone: memberData.phone,
        cpf: memberData.cpf,
        birthdate: memberData.birthdate,
        frame_color: memberData.frameColor || '#FED7E2',
        frame_border_color: memberData.frameBorderColor || '#F687B3',
        profile_emoji: memberData.profileEmoji || '👤'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      cpf: data.cpf,
      birthdate: data.birthdate,
      frameColor: data.frame_color,
      frameBorderColor: data.frame_border_color,
      profileEmoji: data.profile_emoji,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async updateFamilyMember(id: number, updates: Partial<FamilyMember>): Promise<FamilyMember> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Map camelCase to snake_case and only include provided fields
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.cpf !== undefined) updateData.cpf = updates.cpf;
    if (updates.birthdate !== undefined) updateData.birthdate = updates.birthdate;
    if (updates.frameColor !== undefined) updateData.frame_color = updates.frameColor;
    if (updates.frameBorderColor !== undefined) updateData.frame_border_color = updates.frameBorderColor;
    if (updates.profileEmoji !== undefined) updateData.profile_emoji = updates.profileEmoji;
    
    const { data, error } = await supabase
      .from('family_members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      cpf: data.cpf,
      birthdate: data.birthdate,
      frameColor: data.frame_color,
      frameBorderColor: data.frame_border_color,
      profileEmoji: data.profile_emoji,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async deleteFamilyMember(id: number): Promise<void> {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Loyalty program operations
  async getLoyaltyPrograms(): Promise<LoyaltyProgram[]> {
    const { data, error } = await supabase
      .from('loyalty_programs')
      .select('*')
      .order('company');
    
    if (error) throw error;
    
    return data.map(program => ({
      id: program.id,
      name: program.name,
      company: program.company,
      logoColor: program.logo_color,
      createdAt: new Date(program.created_at),
      updatedAt: new Date(program.updated_at)
    }));
  }

  async getLoyaltyProgram(id: number): Promise<LoyaltyProgram | null> {
    const { data, error } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      name: data.name,
      company: data.company,
      logoColor: data.logo_color,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async createLoyaltyProgram(programData: InsertLoyaltyProgram): Promise<LoyaltyProgram> {
    const { data, error } = await supabase
      .from('loyalty_programs')
      .insert({
        name: programData.name,
        company: programData.company,
        logo_color: programData.logoColor || '#4A90E2'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      company: data.company,
      logoColor: data.logo_color,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async updateLoyaltyProgram(id: number, updates: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> {
    const { data, error } = await supabase
      .from('loyalty_programs')
      .update({
        name: updates.name,
        company: updates.company,
        logo_color: updates.logoColor,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      company: data.company,
      logoColor: data.logo_color,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async deleteLoyaltyProgram(id: number): Promise<void> {
    const { error } = await supabase
      .from('loyalty_programs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Member program operations
  async getMemberPrograms(memberId: number): Promise<MemberProgram[]> {
    const { data, error } = await supabase
      .from('member_programs')
      .select('*')
      .eq('member_id', memberId);
    
    if (error) throw error;
    
    return data.map(mp => ({
      id: mp.id,
      memberId: mp.member_id,
      programId: mp.program_id,
      memberNumber: mp.member_number,
      pointsBalance: mp.points_balance,
      isActive: mp.is_active,
      notes: mp.notes,
      customFields: mp.custom_fields,
      lastUpdated: new Date(mp.last_updated),
      createdAt: new Date(mp.created_at)
    }));
  }

  async getMemberProgram(id: number): Promise<MemberProgram | null> {
    const { data, error } = await supabase
      .from('member_programs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      memberId: data.member_id,
      programId: data.program_id,
      memberNumber: data.member_number,
      pointsBalance: data.points_balance,
      isActive: data.is_active,
      notes: data.notes,
      customFields: data.custom_fields,
      lastUpdated: new Date(data.last_updated),
      createdAt: new Date(data.created_at)
    };
  }

  async createMemberProgram(mpData: InsertMemberProgram): Promise<MemberProgram> {
    const { data, error } = await supabase
      .from('member_programs')
      .insert({
        member_id: mpData.memberId!,
        program_id: mpData.programId!,
        member_number: mpData.memberNumber,
        points_balance: mpData.pointsBalance || 0,
        is_active: mpData.isActive ?? true,
        notes: mpData.notes,
        custom_fields: mpData.customFields || {}
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      memberId: data.member_id,
      programId: data.program_id,
      memberNumber: data.member_number,
      pointsBalance: data.points_balance,
      isActive: data.is_active,
      notes: data.notes,
      customFields: data.custom_fields,
      lastUpdated: new Date(data.last_updated),
      createdAt: new Date(data.created_at)
    };
  }

  async updateMemberProgram(id: number, updates: Partial<MemberProgram>): Promise<MemberProgram> {
    const { data, error } = await supabase
      .from('member_programs')
      .update({
        member_number: updates.memberNumber,
        points_balance: updates.pointsBalance,
        is_active: updates.isActive,
        notes: updates.notes,
        custom_fields: updates.customFields,
        last_updated: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      memberId: data.member_id,
      programId: data.program_id,
      memberNumber: data.member_number,
      pointsBalance: data.points_balance,
      isActive: data.is_active,
      notes: data.notes,
      customFields: data.custom_fields,
      lastUpdated: new Date(data.last_updated),
      createdAt: new Date(data.created_at)
    };
  }

  async deleteMemberProgram(id: number): Promise<void> {
    const { error } = await supabase
      .from('member_programs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async updateMemberProgramFields(memberId: number, companyId: string, fields: any): Promise<any> {
    // First, get the program ID from company name/ID
    const { data: program } = await supabase
      .from('loyalty_programs')
      .select('id')
      .or(`company.eq.${companyId},id.eq.${companyId}`)
      .single();
    
    if (!program) throw new Error('Program not found');
    
    // Update the member program
    const { data, error } = await supabase
      .from('member_programs')
      .update({
        member_number: fields.memberNumber,
        points_balance: fields.pointsBalance,
        notes: fields.notes,
        last_updated: new Date().toISOString()
      })
      .eq('member_id', memberId)
      .eq('program_id', program.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  }

  async updateMemberProgramCustomFields(memberId: number, companyId: string, customFields: any): Promise<any> {
    // First, get the program ID from company name/ID
    const { data: program } = await supabase
      .from('loyalty_programs')
      .select('id')
      .or(`company.eq.${companyId},id.eq.${companyId}`)
      .single();
    
    if (!program) throw new Error('Program not found');
    
    // Update the custom fields
    const { data, error } = await supabase
      .from('member_programs')
      .update({
        custom_fields: customFields,
        last_updated: new Date().toISOString()
      })
      .eq('member_id', memberId)
      .eq('program_id', program.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  }

  // Dashboard operations
  async getDashboardStats(userId: number) {
    // Get counts
    const { count: totalMembers } = await supabase
      .from('family_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    const { count: totalPrograms } = await supabase
      .from('loyalty_programs')
      .select('*', { count: 'exact', head: true });
    
    // Get total points
    const { data: memberIds } = await supabase
      .from('family_members')
      .select('id')
      .eq('user_id', userId);
    
    let totalPoints = 0;
    if (memberIds && memberIds.length > 0) {
      const { data: points } = await supabase
        .from('member_programs')
        .select('points_balance')
        .in('member_id', memberIds.map(m => m.id));
      
      totalPoints = points?.reduce((sum, p) => sum + (p.points_balance || 0), 0) || 0;
    }
    
    // Recent activity
    const { count: recentActivity } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    return {
      totalMembers: totalMembers || 0,
      totalPrograms: totalPrograms || 0,
      totalPoints,
      recentActivity: recentActivity || 0
    };
  }

  async getMembersWithPrograms(userId: number) {
    const { data: members, error } = await supabase
      .from('family_members')
      .select(`
        *,
        member_programs (
          *,
          loyalty_programs (*)
        )
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return members.map(member => ({
      ...member,
      userId: member.user_id,
      frameColor: member.frame_color,
      frameBorderColor: member.frame_border_color,
      profileEmoji: member.profile_emoji,
      createdAt: new Date(member.created_at),
      updatedAt: new Date(member.updated_at),
      programs: member.member_programs.map((mp: any) => ({
        ...mp,
        program: {
          id: mp.loyalty_programs.id,
          name: mp.loyalty_programs.name,
          company: mp.loyalty_programs.company,
          logoColor: mp.loyalty_programs.logo_color,
          createdAt: new Date(mp.loyalty_programs.created_at),
          updatedAt: new Date(mp.loyalty_programs.updated_at)
        },
        memberId: mp.member_id,
        programId: mp.program_id,
        pointsBalance: mp.points_balance,
        memberNumber: mp.member_number,
        isActive: mp.is_active,
        lastUpdated: new Date(mp.last_updated),
        createdAt: new Date(mp.created_at),
        customFields: mp.custom_fields
      }))
    }));
  }

  // Activity logging
  async logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    await supabase
      .from('activity_logs')
      .insert({
        user_id: activity.userId!,
        action: activity.action,
        description: activity.description,
        metadata: activity.metadata
      });
  }

  async getActivityLog(userId: number, limit: number = 10): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return data.map(log => ({
      id: log.id,
      userId: log.user_id,
      action: log.action,
      description: log.description,
      metadata: log.metadata,
      timestamp: new Date(log.timestamp)
    }));
  }
}

export const storage = new SupabaseStorage();