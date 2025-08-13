import { AppData } from '@/types';

export class MigrationService {
  private static readonly MIGRATION_KEY = 'lechworld-migration-status';
  private static readonly OLD_STORAGE_KEY = 'lechworld-storage';

  static getMigrationStatus(): { 
    completed: boolean; 
    timestamp?: string; 
    version?: string;
  } {
    if (typeof window === 'undefined') return { completed: false };
    
    try {
      const status = localStorage.getItem(this.MIGRATION_KEY);
      return status ? JSON.parse(status) : { completed: false };
    } catch {
      return { completed: false };
    }
  }

  static setMigrationCompleted(version: string = '1.0'): void {
    if (typeof window === 'undefined') return;
    
    const status = {
      completed: true,
      timestamp: new Date().toISOString(),
      version
    };
    
    localStorage.setItem(this.MIGRATION_KEY, JSON.stringify(status));
  }

  static getLegacyData(): AppData | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = localStorage.getItem(this.OLD_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          accounts: parsed.state?.accounts || {},
          milesValue: parsed.state?.milesValue || {},
          activityLog: parsed.state?.activityLog || []
        };
      }
    } catch (error) {
      console.error('Failed to parse legacy data:', error);
    }
    
    return null;
  }

  static backupLegacyData(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const legacyData = this.getLegacyData();
      if (legacyData) {
        const backupKey = `${this.OLD_STORAGE_KEY}-backup-${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(legacyData));
        console.log(`Legacy data backed up to ${backupKey}`);
        return true;
      }
    } catch (error) {
      console.error('Failed to backup legacy data:', error);
    }
    
    return false;
  }

  static cleanupLegacyData(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Don't actually remove the legacy data, just mark it as migrated
      const legacyData = localStorage.getItem(this.OLD_STORAGE_KEY);
      if (legacyData) {
        const parsed = JSON.parse(legacyData);
        parsed.migrated = true;
        parsed.migrationTimestamp = new Date().toISOString();
        localStorage.setItem(this.OLD_STORAGE_KEY, JSON.stringify(parsed));
        console.log('Legacy data marked as migrated');
      }
    } catch (error) {
      console.error('Failed to cleanup legacy data:', error);
    }
  }

  static validateMigrationData(data: AppData): { 
    valid: boolean; 
    errors: string[]; 
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required structure
    if (!data.accounts || typeof data.accounts !== 'object') {
      errors.push('Missing or invalid accounts data');
    }

    if (!data.milesValue || typeof data.milesValue !== 'object') {
      errors.push('Missing or invalid milesValue data');
    }

    if (!Array.isArray(data.activityLog)) {
      warnings.push('Missing or invalid activityLog - will be initialized as empty array');
    }

    // Validate accounts structure
    if (data.accounts) {
      Object.entries(data.accounts).forEach(([member, programs]) => {
        if (!programs || typeof programs !== 'object') {
          errors.push(`Invalid programs data for member: ${member}`);
          return;
        }

        Object.entries(programs).forEach(([program, account]) => {
          if (!account || typeof account !== 'object') {
            errors.push(`Invalid account data for ${member}.${program}`);
            return;
          }

          if (typeof account.miles !== 'number') {
            errors.push(`Invalid miles value for ${member}.${program}`);
          }
        });
      });
    }

    // Validate miles values
    if (data.milesValue) {
      Object.entries(data.milesValue).forEach(([program, value]) => {
        if (typeof value !== 'number' || value < 0) {
          errors.push(`Invalid miles value for program: ${program}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  static async performMigration(
    legacyData: AppData,
    onProgress?: (step: string, progress: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      onProgress?.('Validating data...', 10);
      
      // Validate data before migration
      const validation = this.validateMigrationData(legacyData);
      if (!validation.valid) {
        return { 
          success: false, 
          error: `Data validation failed: ${validation.errors.join(', ')}` 
        };
      }

      onProgress?.('Backing up legacy data...', 30);
      
      // Backup legacy data
      this.backupLegacyData();

      onProgress?.('Preparing Firestore...', 50);

      // Clean up any undefined or null values
      const cleanData: AppData = {
        accounts: legacyData.accounts || {},
        milesValue: legacyData.milesValue || {},
        activityLog: legacyData.activityLog || []
      };

      onProgress?.('Migrating to Firestore...', 70);

      // The actual migration will be handled by the store's migrateToFirestore method
      // This method just validates and prepares the data

      onProgress?.('Finalizing migration...', 90);

      // Mark migration as completed
      this.setMigrationCompleted();
      this.cleanupLegacyData();

      onProgress?.('Migration completed!', 100);

      return { success: true };
    } catch (error) {
      console.error('Migration failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown migration error' 
      };
    }
  }

  static generateMigrationReport(data: AppData): string {
    const totalMembers = Object.keys(data.accounts).length;
    const totalAccounts = Object.values(data.accounts).reduce(
      (sum, programs) => sum + Object.keys(programs).length, 
      0
    );
    const totalMiles = Object.values(data.accounts).reduce(
      (sum, programs) => sum + Object.values(programs).reduce(
        (memberSum, account) => memberSum + (account.miles || 0), 
        0
      ),
      0
    );
    const activityLogEntries = data.activityLog?.length || 0;

    return `
Migration Report
================

Data Summary:
- Members: ${totalMembers}
- Total Accounts: ${totalAccounts}
- Total Miles: ${totalMiles.toLocaleString()}
- Activity Log Entries: ${activityLogEntries}
- Miles Value Programs: ${Object.keys(data.milesValue).length}

Members:
${Object.keys(data.accounts).map(member => 
  `- ${member}: ${Object.keys(data.accounts[member]).length} accounts`
).join('\n')}

Programs:
${Object.entries(data.milesValue).map(([program, value]) => 
  `- ${program}: $${value} per mile`
).join('\n')}

Migration Date: ${new Date().toLocaleString()}
    `.trim();
  }
}

export default MigrationService;