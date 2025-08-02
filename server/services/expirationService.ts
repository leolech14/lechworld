import { eq, and, lte, gte, sql } from 'drizzle-orm';
import { db } from '../index.js';
import { mileTransactions, memberPrograms, familyMembers, airlines, users, notificationPreferences } from '../../shared/schemas/database.js';
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
  async checkExpiringMiles(daysAhead: number = 90): Promise<ExpiringMiles[]> {
    const today = new Date();
    const cutoffDate = addDays(today, daysAhead);

    // Query for all expiring miles
    const expiringData = await db.select({
      userId: users.id,
      userEmail: users.email,
      userName: users.name,
      memberName: familyMembers.name,
      airlineName: airlines.name,
      programName: airlines.programName,
      transaction: mileTransactions,
      memberProgramId: memberPrograms.id,
    })
    .from(mileTransactions)
    .innerJoin(memberPrograms, eq(mileTransactions.memberProgramId, memberPrograms.id))
    .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
    .innerJoin(users, eq(familyMembers.userId, users.id))
    .innerJoin(airlines, eq(memberPrograms.airlineId, airlines.id))
    .where(and(
      gte(mileTransactions.miles, 0), // Only positive miles
      gte(mileTransactions.expirationDate, today), // Not already expired
      lte(mileTransactions.expirationDate, cutoffDate) // Expiring within cutoff
    ))
    .orderBy(mileTransactions.expirationDate);

    // Transform and aggregate results
    const expiringMiles: ExpiringMiles[] = expiringData.map(row => ({
      userId: row.userId,
      userEmail: row.userEmail,
      userName: row.userName,
      memberName: row.memberName,
      airline: row.airlineName,
      program: row.programName,
      miles: row.transaction.miles,
      expirationDate: row.transaction.expirationDate!,
      daysUntilExpiration: differenceInDays(row.transaction.expirationDate!, today),
      memberProgramId: row.memberProgramId,
    }));

    return expiringMiles;
  }

  /**
   * Get expiring miles for a specific user
   */
  async getUserExpiringMiles(userId: number, daysAhead: number = 90): Promise<ExpiringMiles[]> {
    const allExpiring = await this.checkExpiringMiles(daysAhead);
    return allExpiring.filter(item => item.userId === userId);
  }

  /**
   * Get notification preferences for users with expiring miles
   */
  async getNotificationTargets(expiringMiles: ExpiringMiles[]): Promise<Map<number, any>> {
    const userIds = [...new Set(expiringMiles.map(item => item.userId))];
    
    const preferences = await db.select()
      .from(notificationPreferences)
      .where(sql`${notificationPreferences.userId} IN ${userIds}`);

    const prefsMap = new Map();
    preferences.forEach(pref => {
      prefsMap.set(pref.userId, pref);
    });

    return prefsMap;
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