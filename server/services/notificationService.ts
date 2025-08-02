import { ExpirationService, ExpiringMiles } from './expirationService.js';
import { db } from '../index.js';
import { activityLog } from '../../shared/schemas/database.js';
import logger from '../logger.js';

export interface NotificationChannel {
  send(recipient: string, subject: string, content: string): Promise<boolean>;
}

// Console notifier for development
export class ConsoleNotifier implements NotificationChannel {
  async send(recipient: string, subject: string, content: string): Promise<boolean> {
    logger.info({ recipient, subject, content }, 'notification');
    return true;
  }
}

// Email notifier (to be implemented with actual email service)
export class EmailNotifier implements NotificationChannel {
  async send(recipient: string, subject: string, content: string): Promise<boolean> {
    // TODO: Implement with SendGrid, AWS SES, or similar
    logger.info({ recipient, subject }, '[EMAIL] Would send');
    return true;
  }
}

// WhatsApp notifier (to be implemented)
export class WhatsAppNotifier implements NotificationChannel {
  async send(recipient: string, subject: string, content: string): Promise<boolean> {
    // TODO: Implement with WhatsApp Business API
    logger.info({ recipient, subject }, '[WHATSAPP] Would send');
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
  async checkAndNotifyExpirations(daysAhead: number = 90): Promise<void> {
    try {
      // Get all expiring miles
      const expiringMiles = await this.expirationService.checkExpiringMiles(daysAhead);
      
      if (expiringMiles.length === 0) {
        logger.info('✅ No expiring miles found');
        return;
      }

      logger.info({ count: expiringMiles.length }, 'Found expiring mile entries');

      // Group by user
      const groupedByUser = this.expirationService.groupExpiringMilesByUser(expiringMiles);

      // Get notification preferences
      const notificationPrefs = await this.expirationService.getNotificationTargets(expiringMiles);

      // Send notifications for each user
      for (const [userId, userPrograms] of groupedByUser) {
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

        if (prefs.whatsappEnabled && prefs.whatsappNumber) {
          await this.channels.get('whatsapp')!.send(prefs.whatsappNumber, subject, content);
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
      }
    } catch (error) {
      logger.error({ err: error }, 'Error in notification service');
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
    await db.insert(activityLog).values({
      userId,
      action,
      description: `Sent ${action} notification`,
      metadata,
    });
  }

  /**
   * Send test notification
   */
  async sendTestNotification(userId: number): Promise<void> {
    const expiringMiles = await this.expirationService.getUserExpiringMiles(userId);
    
    if (expiringMiles.length === 0) {
      logger.info('No expiring miles for this user');
      return;
    }

    const grouped = this.expirationService.groupExpiringMilesByUser(expiringMiles);
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