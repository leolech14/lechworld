import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../index.js';
import { notificationPreferences } from '../../shared/schemas/database.js';
import { requireAuth } from '../middleware/auth.js';
import { NotificationService } from '../services/notificationService.js';
import { ExpirationService } from '../services/expirationService.js';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Get notification preferences
router.get('/preferences', async (req, res) => {
  try {
    const userId = req.session.userId!;
    
    const [prefs] = await db.select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    // Return default preferences if none exist
    const preferences = prefs || {
      emailEnabled: true,
      emailFrequency: 'weekly',
      expirationAlertDays: 90,
      whatsappEnabled: false,
      whatsappNumber: null,
      pushEnabled: false,
    };

    res.json({ preferences });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update notification preferences
router.put('/preferences', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const {
      emailEnabled,
      emailFrequency,
      expirationAlertDays,
      whatsappEnabled,
      whatsappNumber,
      pushEnabled,
    } = req.body;

    // Check if preferences exist
    const [existing] = await db.select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    let preferences;
    if (existing) {
      // Update existing
      [preferences] = await db.update(notificationPreferences)
        .set({
          emailEnabled,
          emailFrequency,
          expirationAlertDays,
          whatsappEnabled,
          whatsappNumber,
          pushEnabled,
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.userId, userId))
        .returning();
    } else {
      // Create new
      [preferences] = await db.insert(notificationPreferences)
        .values({
          userId,
          emailEnabled: emailEnabled ?? true,
          emailFrequency: emailFrequency || 'weekly',
          expirationAlertDays: expirationAlertDays || 90,
          whatsappEnabled: whatsappEnabled ?? false,
          whatsappNumber,
          pushEnabled: pushEnabled ?? false,
        })
        .returning();
    }

    res.json({ preferences });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Test notification for current user
router.post('/test', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const notificationService = new NotificationService();
    
    await notificationService.sendTestNotification(userId);
    
    res.json({ message: 'Test notification sent (check console)' });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Get expiring miles preview
router.get('/expiring-preview', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const days = parseInt(req.query.days as string) || 90;
    
    const expirationService = new ExpirationService();
    const expiringMiles = await expirationService.getUserExpiringMiles(userId, days);
    
    // Group by program
    const grouped = expirationService.groupExpiringMilesByUser(expiringMiles);
    const userPrograms = grouped.get(userId) || new Map();
    
    // Calculate summary
    const summary = {
      totalPrograms: userPrograms.size,
      totalExpiringMiles: expiringMiles.reduce((sum, item) => sum + item.miles, 0),
      soonestExpiration: expiringMiles.length > 0 
        ? Math.min(...expiringMiles.map(item => item.daysUntilExpiration))
        : null,
      programs: Array.from(userPrograms.entries()).map(([key, miles]) => ({
        key,
        totalMiles: miles.reduce((sum, item) => sum + item.miles, 0),
        expirations: miles.map(item => ({
          miles: item.miles,
          date: item.expirationDate,
          daysUntil: item.daysUntilExpiration,
        })),
      })),
    };
    
    res.json({ summary });
  } catch (error) {
    console.error('Get expiring preview error:', error);
    res.status(500).json({ error: 'Failed to get expiring miles preview' });
  }
});

// Manual trigger for checking all expirations (admin only in production)
router.post('/check-all', async (req, res) => {
  try {
    // In production, this should be admin-only
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const notificationService = new NotificationService();
    await notificationService.checkAndNotifyExpirations();
    
    res.json({ message: 'Expiration check completed' });
  } catch (error) {
    console.error('Check all error:', error);
    res.status(500).json({ error: 'Failed to check expirations' });
  }
});

export default router;