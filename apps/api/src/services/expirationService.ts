import { eq, and, lte, gte, sql } from 'drizzle-orm';
import { db } from '../database/connection';
import { addDays, format, differenceInDays } from 'date-fns';

export interface ExpiringMiles {
  userId: number;
  userEmail: string;
  userName: string;
  memberName: string;
  airline: string;
  program: string;
  miles: number;
  expirationDate: Date;
  daysUntilExpiration: number;
  memberProgramId: number;
}

export class ExpirationService {
  /**
   * Check for expiring miles across all users and programs
   */
  async checkExpiringMiles(familyId: number, daysAhead: number = 90): Promise<ExpiringMiles[]> {
    const today = new Date();
    const cutoffDate = addDays(today, daysAhead);
    const todayStr = today.toISOString();
    const cutoffStr = cutoffDate.toISOString();

    try {
      // Use raw SQL for complex queries
      const result = await db.execute(sql`
        SELECT 
          u.id as user_id,
          u.email as user_email,
          u.name as user_name,
          fm.name as member_name,
          lp.company as airline_name,
          lp.name as program_name,
          t.miles,
          t.expiration_date,
          mp.id as member_program_id
        FROM mile_transactions t
        JOIN member_programs mp ON t.member_program_id = mp.id
        JOIN family_members fm ON mp.member_id = fm.id
        JOIN users u ON fm.user_id = u.id
        JOIN loyalty_programs lp ON mp.program_id = lp.id
        WHERE t.miles >= 0 
          AND t.expiration_date >= ${todayStr}
          AND t.expiration_date <= ${cutoffStr}
          AND u.family_id = ${familyId}
        ORDER BY t.expiration_date
      `);

      // Transform results
      const expiringMiles: ExpiringMiles[] = (result as any[]).map(row => ({
        userId: row.user_id,
        userEmail: row.user_email,
        userName: row.user_name,
        memberName: row.member_name,
        airline: row.airline_name,
        program: row.program_name,
        miles: row.miles,
        expirationDate: new Date(row.expiration_date),
        daysUntilExpiration: differenceInDays(new Date(row.expiration_date), today),
        memberProgramId: row.member_program_id,
      }));

      return expiringMiles;
    } catch (error) {
      console.error('Error checking expiring miles:', error);
      return [];
    }
  }

  /**
   * Get expiring miles for a specific family
   */
  async getFamilyExpiringMiles(familyId: number, daysAhead: number = 90): Promise<ExpiringMiles[]> {
    return this.checkExpiringMiles(familyId, daysAhead);
  }

  /**
   * Get notification preferences for users with expiring miles
   */
  async getNotificationTargets(expiringMiles: ExpiringMiles[]): Promise<Map<number, any>> {
    const userIds = Array.from(new Set(expiringMiles.map(item => item.userId)));
    
    try {
      const result = await db.execute(sql`
        SELECT * FROM notification_preferences
        WHERE user_id = ANY(${userIds})
      `);

      const prefsMap = new Map();
      (result as any[]).forEach(pref => {
        prefsMap.set(pref.user_id, pref);
      });

      return prefsMap;
    } catch (error) {
      console.error('Error getting notification targets:', error);
      return new Map();
    }
  }

  /**
   * Group expiring miles by user and program for notification
   */
  groupExpiringMilesByUser(expiringMiles: ExpiringMiles[]): Map<number, Map<string, ExpiringMiles[]>> {
    const grouped = new Map<number, Map<string, ExpiringMiles[]>>();

    expiringMiles.forEach(item => {
      if (!grouped.has(item.userId)) {
        grouped.set(item.userId, new Map());
      }

      const userMap = grouped.get(item.userId)!;
      const key = `${item.memberName}-${item.program}`;
      
      if (!userMap.has(key)) {
        userMap.set(key, []);
      }

      userMap.get(key)!.push(item);
    });

    return grouped;
  }

  /**
   * Calculate recommended actions to prevent expiration
   */
  getRecommendedActions(airline: string, miles: number, daysUntilExpiration: number): string[] {
    const actions: string[] = [];

    // Generic recommendations
    if (daysUntilExpiration <= 30) {
      actions.push('🚨 URGENT: Consider immediate redemption or transfer');
    }

    // Airline-specific recommendations
    switch (airline) {
      case 'LATAM Airlines':
        actions.push('✈️ Book a short flight to extend expiration by 36 months');
        actions.push('💳 Make a purchase with LATAM Pass credit card');
        if (miles >= 1000) {
          actions.push('🔄 Transfer miles to family member (1,000 points fee)');
        }
        break;

      case 'GOL Linhas Aéreas':
        actions.push('🛒 Shop through Smiles shopping portal');
        actions.push('✈️ Book any GOL flight to reset expiration');
        actions.push('💳 Use Smiles credit card for any purchase');
        break;

      case 'Azul Linhas Aéreas':
        actions.push('✈️ Take any Azul flight to extend by 24 months');
        actions.push('🏪 Shop with TudoAzul partners');
        if (miles >= 1000) {
          actions.push('🔄 Transfer to family member (fees apply)');
        }
        break;

      case 'United Airlines':
        actions.push('✈️ Any qualifying activity extends miles indefinitely');
        actions.push('💳 Use MileagePlus credit card');
        actions.push('🛒 Shop through MileagePlus shopping portal');
        break;

      case 'American Airlines':
        actions.push('✈️ Earn or redeem miles to extend by 18 months');
        actions.push('💳 Use AAdvantage credit card');
        actions.push('🚗 Rent a car through AA partners');
        break;

      default:
        actions.push('✈️ Book a flight to extend expiration');
        actions.push('💳 Use program credit card if available');
        actions.push('🛒 Shop through program partners');
    }

    // Redemption suggestions based on miles
    if (miles >= 40000) {
      actions.push('🎯 Sufficient for international flight redemption');
    } else if (miles >= 15000) {
      actions.push('🎯 Sufficient for domestic flight redemption');
    } else if (miles >= 5000) {
      actions.push('🎯 Consider magazine subscriptions or small redemptions');
    }

    return actions;
  }

  /**
   * Create expiration summary for notification
   */
  createExpirationSummary(groupedMiles: Map<string, ExpiringMiles[]>): string {
    let summary = '✈️ **Miles Expiration Alert** ✈️\n\n';

    groupedMiles.forEach((miles, key) => {
      const totalMiles = miles.reduce((sum, item) => sum + item.miles, 0);
      const soonestExpiration = miles.reduce((min, item) => 
        item.daysUntilExpiration < min ? item.daysUntilExpiration : min, 
        Infinity
      );

      summary += `**${key}**\n`;
      summary += `💰 Total expiring: ${totalMiles.toLocaleString()} miles\n`;
      summary += `⏰ Soonest expiration: ${soonestExpiration} days\n`;
      
      // Add details for each expiration
      miles.forEach(item => {
        const urgency = item.daysUntilExpiration <= 30 ? '🚨' : 
                       item.daysUntilExpiration <= 60 ? '⚠️' : 'ℹ️';
        summary += `  ${urgency} ${item.miles.toLocaleString()} miles expire ${format(item.expirationDate, 'MMM d, yyyy')}\n`;
      });

      summary += '\n';
    });

    return summary;
  }
}