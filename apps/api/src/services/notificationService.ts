import { ExpirationService, ExpiringMiles } from './expirationService';
import { db } from '../database/connection';
import { sql } from 'drizzle-orm';

export interface NotificationChannel {
  send(recipient: string, subject: string, content: string): Promise<boolean>;
}

// Console notifier for development
export class ConsoleNotifier implements NotificationChannel {
  async send(recipient: string, subject: string, content: string): Promise<boolean> {
    console.log('='.repeat(60));
    console.log(`📧 NOTIFICATION TO: ${recipient}`);
    console.log(`📋 SUBJECT: ${subject}`);
    console.log('-'.repeat(60));
    console.log(content);
    console.log('='.repeat(60));
    return true;
  }
}

// Email notifier (to be implemented with actual email service)
export class EmailNotifier implements NotificationChannel {
  async send(recipient: string, subject: string, content: string): Promise<boolean> {
    // TODO: Implement with SendGrid, AWS SES, or similar
    console.log(`[EMAIL] Would send to ${recipient}: ${subject}`);
    return true;
  }
}

// WhatsApp notifier (to be implemented)
export class WhatsAppNotifier implements NotificationChannel {
  async send(recipient: string, subject: string, content: string): Promise<boolean> {
    // TODO: Implement with WhatsApp Business API
    console.log(`[WHATSAPP] Would send to ${recipient}: ${subject}`);
    return true;
  }
}

export class NotificationService {
  private expirationService: ExpirationService;
  private channels: Map<string, NotificationChannel>;

  constructor() {
    this.expirationService = new ExpirationService();
    this.channels = new Map();
    
    // Register notification channels
    this.channels.set('console', new ConsoleNotifier());
    this.channels.set('email', new EmailNotifier());
    this.channels.set('whatsapp', new WhatsAppNotifier());
  }

  /**
   * Check and send expiration notifications
   */
  async checkAndNotifyExpirations(familyId: number, daysAhead: number = 90): Promise<void> {
    try {
      // Get all expiring miles
      const expiringMiles = await this.expirationService.checkExpiringMiles(familyId, daysAhead);
      
      if (expiringMiles.length === 0) {
        console.log('✅ No expiring miles found');
        return;
      }

      console.log(`Found ${expiringMiles.length} expiring mile entries`);

      // Group by user
      const groupedByUser = this.expirationService.groupExpiringMilesByUser(expiringMiles);

      // Get notification preferences
      const notificationPrefs = await this.expirationService.getNotificationTargets(expiringMiles);

      // Send notifications for each user
      groupedByUser.forEach(async (userPrograms, userId) => {
        const userExpiring = expiringMiles.filter(item => item.userId === userId);
        const userEmail = userExpiring[0].userEmail;
        const userName = userExpiring[0].userName;

        // Create notification content
        const subject = `🚨 Miles Expiration Alert - Action Required`;
        const content = this.createNotificationContent(userName, userPrograms);

        // Get user preferences
        const prefs = notificationPrefs.get(userId) || {
          emailEnabled: true,
          whatsappEnabled: false,
        };

        // Send through enabled channels
        if (prefs.emailEnabled) {
          await this.channels.get('email')!.send(userEmail, subject, content);
        }

        if (prefs.whatsappEnabled && (prefs as any).whatsappNumber) {
          await this.channels.get('whatsapp')!.send((prefs as any).whatsappNumber, subject, content);
        }

        // Always log to console in development
        if (process.env.NODE_ENV === 'development') {
          await this.channels.get('console')!.send(userEmail, subject, content);
        }

        // Log activity
        await this.logNotification(userId, 'expiration_alert', {
          programs: Array.from(userPrograms.keys()),
          totalPrograms: userPrograms.size,
          channels: ['email', prefs.whatsappEnabled ? 'whatsapp' : null].filter(Boolean),
        });
      });
    } catch (error) {
      console.error('Error in notification service:', error);
      throw error;
    }
  }

  /**
   * Create formatted notification content
   */
  private createNotificationContent(userName: string, programs: Map<string, ExpiringMiles[]>): string {
    let content = `Hello ${userName},\n\n`;
    content += `We wanted to alert you about miles that will expire soon:\n\n`;

    programs.forEach((miles, programKey) => {
      const totalMiles = miles.reduce((sum, item) => sum + item.miles, 0);
      const airline = miles[0].airline;
      
      content += `📍 ${programKey}\n`;
      content += `   Total expiring: ${totalMiles.toLocaleString()} miles\n\n`;

      // Sort by expiration date
      miles.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);

      miles.forEach(item => {
        const urgencyEmoji = item.daysUntilExpiration <= 30 ? '🚨' : 
                           item.daysUntilExpiration <= 60 ? '⚠️' : 'ℹ️';
        
        content += `   ${urgencyEmoji} ${item.miles.toLocaleString()} miles expire in ${item.daysUntilExpiration} days\n`;
      });

      // Add recommendations
      const recommendations = this.expirationService.getRecommendedActions(
        airline, 
        totalMiles, 
        miles[0].daysUntilExpiration
      );

      content += `\n   💡 Recommended Actions:\n`;
      recommendations.forEach(action => {
        content += `      ${action}\n`;
      });

      content += '\n';
    });

    content += `\nLog in to your account to manage your miles:\n`;
    content += `https://lechworld.fly.dev\n\n`;
    content += `Best regards,\nThe LechWorld Team`;

    return content;
  }

  /**
   * Log notification activity
   */
  private async logNotification(userId: number, action: string, metadata: any): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO activity_log (user_id, action, description, metadata, created_at)
        VALUES (${userId}, ${action}, ${`Sent ${action} notification`}, ${JSON.stringify(metadata)}, NOW())
      `);
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(userId: number, familyId: number): Promise<void> {
    const familyMiles = await this.expirationService.getFamilyExpiringMiles(familyId);
    const expiringMiles = familyMiles.filter(m => m.userId === userId);

    if (expiringMiles.length === 0) {
      console.log('No expiring miles for this user');
      return;
    }

    const grouped = this.expirationService.groupExpiringMilesByUser(familyMiles);
    const userPrograms = grouped.get(userId)!;
    
    const subject = '🧪 TEST: Miles Expiration Alert';
    const content = this.createNotificationContent(
      expiringMiles[0].userName,
      userPrograms
    );

    await this.channels.get('console')!.send(
      expiringMiles[0].userEmail,
      subject,
      content
    );
  }
}