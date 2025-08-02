/**
 * @purpose Database access layer for managing users, members, programs, and activities
 * @connects-to shared/schema.ts
 * @connects-to server/miles-values.ts
 * @connects-to PostgreSQL database (via DATABASE_URL)
 */
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import type { 
  User, FamilyMember, LoyaltyProgram, MemberProgram, ActivityLog,
  InsertUser, InsertFamilyMember, InsertLoyaltyProgram, InsertMemberProgram
} from "@shared/schema";
import { calculateEstimatedValue } from './miles-values';

// Use Fly.io's DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const storage = {
  // Initialize database
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS family_members (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS loyalty_programs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        logo_color VARCHAR(7) DEFAULT '#000000',
        website VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS member_programs (
        id SERIAL PRIMARY KEY,
        member_id INTEGER REFERENCES family_members(id) ON DELETE CASCADE,
        program_id INTEGER REFERENCES loyalty_programs(id) ON DELETE CASCADE,
        account_number VARCHAR(255),
        login VARCHAR(255),
        password VARCHAR(255),
        cpf VARCHAR(14),
        points_balance INTEGER DEFAULT 0,
        elite_tier VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        notes TEXT,
        custom_fields JSONB DEFAULT '{}',
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(member_id, program_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_member_programs_member_id ON member_programs(member_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_member_programs_program_id ON member_programs(program_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)');
  },

  // Users
  async getUserByEmail(email: string): Promise<User | null> {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },
  
  async getUserByUsername(username: string): Promise<User | null> {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );
    return rows[0] || null;
  },

  async createUser(userData: InsertUser): Promise<User> {
    // Hash password before storing
    const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : null;
    
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [userData.name, userData.email, hashedPassword]
    );
    return rows[0];
  },
  
  async updateUserPassword(userId: number, newPassword: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { rows } = await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2 RETURNING *',
      [hashedPassword, userId]
    );
    return rows[0];
  },

  // Family Members
  async getFamilyMembers(userId: number): Promise<FamilyMember[]> {
    const { rows } = await pool.query(
      'SELECT * FROM family_members WHERE user_id = $1 ORDER BY name',
      [userId]
    );
    
    // Transform snake_case to camelCase
    return rows.map(member => ({
      ...member,
      userId: member.user_id,
      isActive: member.is_active,
      frameColor: member.frame_color,
      frameBorderColor: member.frame_border_color,
      profileEmoji: member.profile_emoji,
    }));
  },

  async getFamilyMember(id: number): Promise<FamilyMember | null> {
    const { rows } = await pool.query(
      'SELECT * FROM family_members WHERE id = $1',
      [id]
    );
    
    if (rows[0]) {
      const member = rows[0];
      return {
        ...member,
        userId: member.user_id,
        isActive: member.is_active,
        frameColor: member.frame_color,
        frameBorderColor: member.frame_border_color,
        profileEmoji: member.profile_emoji,
      };
    }
    
    return null;
  },

  async createFamilyMember(memberData: InsertFamilyMember): Promise<FamilyMember> {
    const { rows } = await pool.query(
      'INSERT INTO family_members (user_id, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING *',
      [memberData.userId, memberData.name, memberData.email, memberData.phone]
    );
    
    if (rows[0]) {
      const member = rows[0];
      return {
        ...member,
        userId: member.user_id,
        isActive: member.is_active,
        frameColor: member.frame_color,
        frameBorderColor: member.frame_border_color,
        profileEmoji: member.profile_emoji,
      };
    }
    
    return rows[0];
  },

  async updateFamilyMember(id: number, updates: Partial<FamilyMember>): Promise<FamilyMember> {
    const fields = [];
    const values = [];
    let index = 1;

    // Map JavaScript field names to database column names
    const fieldMap: Record<string, string> = {
      name: 'name',
      email: 'email',
      role: 'role',
      userId: 'user_id',
      isActive: 'is_active',
      cpf: 'cpf',
      phone: 'phone',
      birthdate: 'birthdate',
      frameColor: 'frame_color',
      frameBorderColor: 'frame_border_color',
      profileEmoji: 'profile_emoji'
    };

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && fieldMap[key]) {
        fields.push(`${fieldMap[key]} = $${index}`);
        values.push(value);
        index++;
      }
    }
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE family_members SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
      values
    );
    
    
    // Transform snake_case to camelCase for consistency
    if (rows[0]) {
      const member = rows[0];
      return {
        ...member,
        userId: member.user_id,
        isActive: member.is_active,
        frameColor: member.frame_color,
        frameBorderColor: member.frame_border_color,
        profileEmoji: member.profile_emoji,
      };
    }
    
    return rows[0];
  },

  async deleteFamilyMember(id: number): Promise<void> {
    await pool.query('DELETE FROM family_members WHERE id = $1', [id]);
  },

  // Loyalty Programs
  async getLoyaltyPrograms(): Promise<LoyaltyProgram[]> {
    const { rows } = await pool.query(
      'SELECT * FROM loyalty_programs ORDER BY company'
    );
    return rows;
  },

  async getLoyaltyProgram(id: number): Promise<LoyaltyProgram | null> {
    const { rows } = await pool.query(
      'SELECT * FROM loyalty_programs WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async createLoyaltyProgram(programData: InsertLoyaltyProgram): Promise<LoyaltyProgram> {
    const { rows } = await pool.query(
      'INSERT INTO loyalty_programs (name, company, logo_color, website) VALUES ($1, $2, $3, $4) RETURNING *',
      [programData.name, programData.company, programData.logoColor, programData.website]
    );
    return rows[0];
  },

  async updateLoyaltyProgram(id: number, updates: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> {
    const fields = [];
    const values = [];
    let index = 1;

    // Map JavaScript field names to database column names
    const fieldMap: Record<string, string> = {
      name: 'name',
      company: 'company',
      programType: 'program_type',
      logoColor: 'logo_color',
      transferPartners: 'transfer_partners',
      pointValue: 'point_value',
      category: 'category',
      website: 'website',
      phoneNumber: 'phone_number',
      isActive: 'is_active',
      iconUrl: 'icon_url'
    };

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && fieldMap[key]) {
        fields.push(`${fieldMap[key]} = $${index}`);
        values.push(value);
        index++;
      }
    }
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE loyalty_programs SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
      values
    );
    return rows[0];
  },

  async deleteLoyaltyProgram(id: number): Promise<void> {
    await pool.query('DELETE FROM loyalty_programs WHERE id = $1', [id]);
  },

  // Member Programs
  async getMemberPrograms(memberId: number): Promise<MemberProgram[]> {
    const { rows } = await pool.query(
      'SELECT * FROM member_programs WHERE member_id = $1',
      [memberId]
    );
    return rows;
  },

  async getMemberProgram(id: number): Promise<MemberProgram | null> {
    const { rows } = await pool.query(
      'SELECT * FROM member_programs WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async createMemberProgram(memberProgramData: InsertMemberProgram): Promise<MemberProgram> {
    const { rows } = await pool.query(
      `INSERT INTO member_programs 
       (member_id, program_id, account_number, login, password, cpf, points_balance, is_active, custom_fields, last_updated) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) 
       RETURNING *`,
      [
        memberProgramData.memberId,
        memberProgramData.programId,
        memberProgramData.accountNumber,
        memberProgramData.login || '',
        (memberProgramData as any).password || '',
        memberProgramData.cpf || '',
        memberProgramData.pointsBalance || 0,
        memberProgramData.isActive ?? true,
        JSON.stringify(memberProgramData.customFields || {})
      ]
    );
    return rows[0];
  },

  async updateMemberProgram(id: number, updates: Partial<MemberProgram>): Promise<MemberProgram> {
    const fields = [];
    const values = [];
    let index = 1;

    // Map JavaScript field names to database column names
    const fieldMap: Record<string, string> = {
      memberId: 'member_id',
      programId: 'program_id',
      accountNumber: 'account_number',
      login: 'login',
      password: 'password',
      cpf: 'cpf',
      pointsBalance: 'points_balance',
      eliteTier: 'elite_tier',
      isActive: 'is_active',
      notes: 'notes',
      customFields: 'custom_fields',
      lastUpdated: 'last_updated'
    };

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && fieldMap[key]) {
        if (key === 'customFields') {
          fields.push(`${fieldMap[key]} = $${index}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${fieldMap[key]} = $${index}`);
          values.push(value);
        }
        index++;
      }
    }
    
    fields.push(`last_updated = NOW()`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE member_programs SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
      values
    );
    return rows[0];
  },

  async deleteMemberProgram(id: number): Promise<void> {
    await pool.query('DELETE FROM member_programs WHERE id = $1', [id]);
  },

  async updateMemberProgramFields(memberId: number, companyId: string, fields: any): Promise<any> {
    const { rows: programs } = await pool.query(
      'SELECT id FROM loyalty_programs WHERE company = $1',
      [companyId]
    );
    
    if (!programs[0]) throw new Error('Program not found');
    
    const { rows } = await pool.query(
      `UPDATE member_programs 
       SET points_balance = $1, elite_tier = $2, notes = $3, last_updated = NOW()
       WHERE member_id = $4 AND program_id = $5 
       RETURNING *`,
      [fields.pointsBalance, fields.eliteTier, fields.notes, memberId, programs[0].id]
    );
    return rows[0];
  },

  async updateMemberProgramCustomFields(memberId: number, companyId: string, customFields: any): Promise<any> {
    const { rows: programs } = await pool.query(
      'SELECT id FROM loyalty_programs WHERE company = $1',
      [companyId]
    );
    
    if (!programs[0]) throw new Error('Program not found');
    
    const { rows } = await pool.query(
      `UPDATE member_programs 
       SET custom_fields = $1, last_updated = NOW()
       WHERE member_id = $2 AND program_id = $3 
       RETURNING *`,
      [JSON.stringify(customFields), memberId, programs[0].id]
    );
    return rows[0];
  },

  // Complex queries
  async getMembersWithPrograms(userId: number): Promise<any[]> {
    const query = `
      SELECT 
        fm.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', mp.id,
              'memberId', mp.member_id,
              'programId', mp.program_id,
              'accountNumber', mp.account_number,
              'pointsBalance', mp.points_balance,
              'eliteTier', mp.elite_tier,
              'isActive', mp.is_active,
              'lastUpdated', mp.last_updated,
              'login', mp.login,
              'password', mp.password,
              'customFields', mp.custom_fields,
              'program', json_build_object(
                'id', lp.id,
                'name', lp.name,
                'company', lp.company,
                'logoColor', lp.logo_color,
                'website', lp.website,
                'pointValue', lp.point_value
              )
            )
          ) FILTER (WHERE mp.id IS NOT NULL), 
          '[]'
        ) as programs
      FROM family_members fm
      LEFT JOIN member_programs mp ON fm.id = mp.member_id
      LEFT JOIN loyalty_programs lp ON mp.program_id = lp.id
      WHERE fm.user_id = $1
      GROUP BY fm.id
      ORDER BY fm.name
    `;
    
    const { rows } = await pool.query(query, [userId]);
    
    
    // Transform snake_case to camelCase and calculate estimated values
    return rows.map(member => ({
      ...member,
      userId: member.user_id,
      isActive: member.is_active,
      frameColor: member.frame_color,
      frameBorderColor: member.frame_border_color,
      profileEmoji: member.profile_emoji,
      createdAt: member.created_at,
      // Keep the original snake_case fields too for backward compatibility
      frame_color: member.frame_color,
      frame_border_color: member.frame_border_color,
      profile_emoji: member.profile_emoji,
      // Calculate estimated value for each program
      programs: member.programs.map((prog: any) => ({
        ...prog,
        estimatedValue: prog.pointsBalance > 0 
          ? new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(calculateEstimatedValue(prog.pointsBalance, prog.program.company))
          : 'R$ 0,00'
      }))
    }));
  },

  async getDashboardStats(userId: number): Promise<any> {
    const { rows: members } = await pool.query(
      'SELECT COUNT(*) as count FROM family_members WHERE user_id = $1',
      [userId]
    );
    
    const programsQuery = `
      SELECT COUNT(DISTINCT lp.id) as count
      FROM loyalty_programs lp
      JOIN member_programs mp ON lp.id = mp.program_id
      JOIN family_members fm ON mp.member_id = fm.id
      WHERE fm.user_id = $1
    `;
    
    const pointsQuery = `
      SELECT SUM(mp.points_balance) as total
      FROM member_programs mp
      JOIN family_members fm ON mp.member_id = fm.id
      WHERE fm.user_id = $1
    `;
    
    // Query para pegar pontos e programas para calcular valor estimado
    const pointsByProgramQuery = `
      SELECT lp.company, SUM(mp.points_balance) as points
      FROM member_programs mp
      JOIN family_members fm ON mp.member_id = fm.id
      JOIN loyalty_programs lp ON mp.program_id = lp.id
      WHERE fm.user_id = $1 AND mp.points_balance > 0
      GROUP BY lp.company
    `;
    
    const { rows: [programs] } = await pool.query(programsQuery, [userId]);
    const { rows: [points] } = await pool.query(pointsQuery, [userId]);
    const { rows: pointsByProgram } = await pool.query(pointsByProgramQuery, [userId]);
    
    // Calcula o valor total estimado
    let totalEstimatedValue = 0;
    pointsByProgram.forEach(row => {
      totalEstimatedValue += calculateEstimatedValue(parseInt(row.points) || 0, row.company);
    });
    
    // Formata o valor em reais
    const estimatedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(totalEstimatedValue);
    
    return {
      totalMembers: parseInt(members[0].count) || 0,
      totalPrograms: parseInt(programs.count) || 0,
      totalPoints: parseInt(points.total) || 0,
      activePrograms: parseInt(programs.count) || 0,
      estimatedValue
    };
  },

  // Activity logs
  async logActivity(activity: Partial<ActivityLog>): Promise<void> {
    await pool.query(
      'INSERT INTO activity_log (user_id, member_id, action, category, description, metadata) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        activity.userId, 
        activity.memberId || null,
        activity.action, 
        activity.category || 'general',
        activity.description, 
        JSON.stringify(activity.metadata || {})
      ]
    );
  },

  async getActivityLog(userId: number, limit: number = 10): Promise<ActivityLog[]> {
    const { rows } = await pool.query(
      'SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2',
      [userId, limit]
    );
    return rows;
  }
};