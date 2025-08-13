import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  limit,
  addDoc,
  serverTimestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import { AppData, ActivityLog, Account, MemberAccounts } from '@/types';

export class FirestoreService {
  private static instance: FirestoreService;
  private unsubscribers: (() => void)[] = [];

  static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  // Collection references
  private getAppDataDocRef() {
    return doc(db, 'app', 'data');
  }

  private getActivityLogCollectionRef() {
    return collection(db, 'activityLog');
  }

  // Initialize app data in Firestore
  async initializeAppData(initialData: AppData): Promise<void> {
    try {
      const docRef = this.getAppDataDocRef();
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          accounts: initialData.accounts,
          milesValue: initialData.milesValue,
          lastUpdated: serverTimestamp(),
          version: '1.0'
        });
        console.log('App data initialized in Firestore');
      }
    } catch (error) {
      console.error('Error initializing app data:', error);
      throw error;
    }
  }

  // Get app data from Firestore
  async getAppData(): Promise<Partial<AppData> | null> {
    try {
      const docRef = this.getAppDataDocRef();
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          accounts: data.accounts || {},
          milesValue: data.milesValue || {}
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting app data:', error);
      throw error;
    }
  }

  // Subscribe to real-time app data updates
  subscribeToAppData(callback: (data: Partial<AppData>) => void): () => void {
    const docRef = this.getAppDataDocRef();
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          accounts: data.accounts || {},
          milesValue: data.milesValue || {}
        });
      }
    }, (error) => {
      console.error('Error listening to app data:', error);
    });

    this.unsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  // Update account data
  async updateAccount(member: string, program: string, accountData: Partial<Account>): Promise<void> {
    try {
      const docRef = this.getAppDataDocRef();
      const updateData = {
        [`accounts.${member}.${program}`]: {
          ...accountData,
          lastUpdated: new Date().toLocaleDateString('pt-BR')
        },
        lastUpdated: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  }

  // Update entire member accounts
  async updateMemberAccounts(member: string, accounts: MemberAccounts): Promise<void> {
    try {
      const docRef = this.getAppDataDocRef();
      const updateData = {
        [`accounts.${member}`]: accounts,
        lastUpdated: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating member accounts:', error);
      throw error;
    }
  }

  // Update miles value for a program
  async updateMilesValue(program: string, value: number): Promise<void> {
    try {
      const docRef = this.getAppDataDocRef();
      const updateData = {
        [`milesValue.${program}`]: value,
        lastUpdated: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating miles value:', error);
      throw error;
    }
  }

  // Add activity log entry
  async addActivityLog(activity: Omit<ActivityLog, 'timestamp'>): Promise<void> {
    try {
      const collectionRef = this.getActivityLogCollectionRef();
      await addDoc(collectionRef, {
        ...activity,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adding activity log:', error);
      throw error;
    }
  }

  // Get recent activity logs
  async getActivityLogs(limitCount: number = 100): Promise<ActivityLog[]> {
    try {
      const collectionRef = this.getActivityLogCollectionRef();
      const q = query(
        collectionRef, 
        orderBy('timestamp', 'desc'), 
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as ActivityLog[];
    } catch (error) {
      console.error('Error getting activity logs:', error);
      throw error;
    }
  }

  // Subscribe to real-time activity logs
  subscribeToActivityLogs(
    callback: (logs: ActivityLog[]) => void, 
    limitCount: number = 100
  ): () => void {
    const collectionRef = this.getActivityLogCollectionRef();
    const q = query(
      collectionRef, 
      orderBy('timestamp', 'desc'), 
      limit(limitCount)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const logs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as ActivityLog[];
      callback(logs);
    }, (error) => {
      console.error('Error listening to activity logs:', error);
    });

    this.unsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  // Bulk import data (for migration)
  async importData(data: AppData): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Update main app data
      const appDataRef = this.getAppDataDocRef();
      batch.set(appDataRef, {
        accounts: data.accounts,
        milesValue: data.milesValue,
        lastUpdated: serverTimestamp(),
        version: '1.0'
      });

      // Add activity logs
      const activityLogRef = this.getActivityLogCollectionRef();
      data.activityLog?.forEach((activity) => {
        const docRef = doc(activityLogRef);
        batch.set(docRef, {
          ...activity,
          timestamp: serverTimestamp(),
          imported: true
        });
      });

      await batch.commit();
      console.log('Data imported successfully');
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  // Export all data
  async exportData(): Promise<AppData> {
    try {
      const [appData, activityLogs] = await Promise.all([
        this.getAppData(),
        this.getActivityLogs(1000) // Get more logs for export
      ]);

      return {
        accounts: appData?.accounts || {},
        milesValue: appData?.milesValue || {},
        activityLog: activityLogs
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Clean up all subscriptions
  cleanup(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const docRef = this.getAppDataDocRef();
      await getDoc(docRef);
      return true;
    } catch (error) {
      console.error('Firestore health check failed:', error);
      return false;
    }
  }
}

export const firestoreService = FirestoreService.getInstance();