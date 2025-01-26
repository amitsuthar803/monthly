import {format, addMonths, parseISO, differenceInMonths, isAfter, isSameDay} from 'date-fns';
import {emisCollection} from '../config/firebase';

export interface EMI {
  id: string;
  name: string;
  totalAmount: number;
  emiAmount: number;
  startDate: string;
  tenure: number;
  interestRate: number;
}

export interface EMIWithStatus extends EMI {
  nextPaymentDate: string;
  lastPaymentDate: string;
  remainingEMIs: number;
  currentEMI: number;
  status: 'active' | 'completed';
  totalPaid: number;
}

export interface NewEMI {
  name: string;
  totalAmount: number;
  emiAmount: number;
  startDate: string;
  tenure: number;
  interestRate: number;
}

class EMIDataStore {
  private emis: EMI[] = [];
  private initialized = false;

  constructor() {
    this.loadFromFirestore();
  }

  private async loadFromFirestore() {
    try {
      const snapshot = await emisCollection.get();
      this.emis = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          totalAmount: Number(data.totalAmount) || 0,
          emiAmount: Number(data.emiAmount) || 0,
          startDate: data.startDate || new Date().toISOString().split('T')[0],
          tenure: Number(data.tenure) || 0,
          interestRate: Number(data.interestRate) || 0
        };
      });
      this.initialized = true;
    } catch (error) {
      console.error('Error loading EMIs:', error);
      this.emis = [];
      this.initialized = true;
    }
  }

  async addEMI(newEmi: NewEMI): Promise<EMI> {
    try {
      // Ensure all numeric values are properly converted
      const sanitizedEmi = {
        ...newEmi,
        totalAmount: Number(newEmi.totalAmount) || 0,
        emiAmount: Number(newEmi.emiAmount) || 0,
        tenure: Number(newEmi.tenure) || 0,
        interestRate: Number(newEmi.interestRate) || 0
      };
      
      const docRef = await emisCollection.add(sanitizedEmi);
      const emi: EMI = {
        ...sanitizedEmi,
        id: docRef.id,
      };
      this.updateLocalEMI(emi);
      return emi;
    } catch (error) {
      console.error('Error adding EMI:', error);
      throw error;
    }
  }

  async updateEMI(emi: EMI): Promise<void> {
    try {
      await emisCollection.doc(emi.id).update(emi);
      this.updateLocalEMI(emi);
    } catch (error) {
      console.error('Error updating EMI:', error);
      throw error;
    }
  }

  async deleteEMI(id: string): Promise<void> {
    try {
      await emisCollection.doc(id).delete();
      this.removeLocalEMI(id);
    } catch (error) {
      console.error('Error deleting EMI:', error);
      throw error;
    }
  }

  // Local state management methods
  updateLocalEMI(emi: EMI): void {
    const index = this.emis.findIndex(e => e.id === emi.id);
    if (index !== -1) {
      this.emis[index] = emi;
    } else {
      this.emis.push(emi);
    }
  }

  removeLocalEMI(id: string): void {
    this.emis = this.emis.filter(emi => emi.id !== id);
  }

  /**
   * Calculates the first EMI due date
   * @param startDate The loan start date
   * @returns Date of first EMI
   */
  private getFirstEMIDate(startDate: Date): Date {
    return addMonths(startDate, 1);
  }

  /**
   * Calculates the number of EMIs paid based on start date and current date
   * @param startDate Loan start date
   * @param today Current date
   * @returns Number of EMIs paid
   */
  private calculateEMIsPaid(startDate: Date, today: Date): number {
    try {
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(today.getTime())) {
        throw new Error('Invalid date values');
      }

      // If today is before start date, no EMIs paid
      if (isAfter(startDate, today)) {
        return 0;
      }

      // Calculate months since start date
      const monthsSinceStart = differenceInMonths(today, startDate);

      // Check if we've passed the EMI day in current month
      const isAfterEMIDay = today.getDate() >= startDate.getDate();

      // For start date, first EMI is due next month
      // So we start counting from 0 and add months passed
      let emisPaid = monthsSinceStart;

      // If we haven't reached EMI day in current month, subtract 1
      if (!isAfterEMIDay) {
        emisPaid--;
      }

      return Math.max(0, emisPaid);
    } catch (error) {
      console.error('Error calculating EMIs paid:', error);
      return 0;
    }
  }

  /**
   * Gets the next EMI payment date based on current progress
   * @param emi EMI details
   * @param currentEMI Current EMI number
   * @returns Next payment date in YYYY-MM-DD format
   */
  private getNextPaymentDate(emi: EMI, currentEMI: number): string {
    try {
      if (!emi.startDate) {
        throw new Error('Start date is missing for EMI: ' + emi.id);
      }

      // Parse and validate start date
      const startDate = new Date(emi.startDate);
      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid start date for EMI: ' + emi.id);
      }
      
      // Next EMI is currentEMI + 1 months after start date
      const nextPaymentDate = addMonths(startDate, currentEMI + 1);
      return format(nextPaymentDate, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Error calculating next payment date:', error);
      return format(new Date(), 'yyyy-MM-dd');
    }
  }

  /**
   * Gets the final EMI payment date
   * @param emi EMI details
   * @returns Last payment date in YYYY-MM-DD format
   */
  private getLastPaymentDate(emi: EMI): string {
    try {
      if (!emi.startDate) {
        throw new Error('Start date is missing for EMI: ' + emi.id);
      }

      // Parse and validate start date
      const startDate = new Date(emi.startDate);
      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid start date for EMI: ' + emi.id);
      }
      
      // Last EMI is (tenure - 1) months after start date since first payment starts after 1 month
      const lastPaymentDate = addMonths(startDate, emi.tenure - 1);
      return format(lastPaymentDate, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Error calculating last payment date:', error);
      return format(new Date(), 'yyyy-MM-dd');
    }
  }

  /**
   * Gets EMI with current status and progress
   * @param emi Base EMI details
   * @returns EMI with calculated status
   */
  getEMIWithStatus(emi: EMI): EMIWithStatus {
    try {
      if (!emi.startDate) {
        throw new Error('Start date is missing for EMI: ' + emi.id);
      }

      const today = new Date();
      const startDate = new Date(emi.startDate);
      
      // Validate dates
      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid start date for EMI: ' + emi.id);
      }

      const emisPaid = this.calculateEMIsPaid(startDate, today);
      const tenure = Number(emi.tenure) || 0;
      const emiAmount = Number(emi.emiAmount) || 0;

      // Ensure all calculations use numbers with fallbacks to 0
      const currentEMI = Math.min(emisPaid, tenure);
      const remainingEMIs = Math.max(0, tenure - currentEMI);
      const totalPaid = currentEMI * emiAmount;
      const nextPaymentDate = this.getNextPaymentDate(emi, currentEMI);
      const lastPaymentDate = this.getLastPaymentDate(emi);
      const status = currentEMI >= tenure ? 'completed' : 'active';

      // Sync status with database if it has changed
      this.syncEMIStatus(emi.id, status);

      return {
        ...emi,
        nextPaymentDate,
        lastPaymentDate,
        remainingEMIs,
        currentEMI,
        status,
        totalPaid,
      };
    } catch (error) {
      console.error('Error calculating EMI status:', error);
      // Return a safe fallback with the original EMI data
      return {
        ...emi,
        nextPaymentDate: format(new Date(), 'yyyy-MM-dd'),
        lastPaymentDate: format(new Date(), 'yyyy-MM-dd'),
        remainingEMIs: Number(emi.tenure) || 0,
        currentEMI: 0,
        status: 'active',
        totalPaid: 0,
      };
    }
  }

  async syncEMIStatus(emiId: string, newStatus: 'active' | 'completed'): Promise<void> {
    try {
      const emi = this.emis.find(e => e.id === emiId);
      if (emi) {
        await emisCollection.doc(emiId).update({status: newStatus});
      }
    } catch (error) {
      console.error('Error syncing EMI status:', error);
    }
  }

  getEMIById(id: string): EMIWithStatus | undefined {
    const emi = this.emis.find(e => e.id === id);
    return emi ? this.getEMIWithStatus(emi) : undefined;
  }

  getAllEMIs(): EMIWithStatus[] {
    return this.emis.map(emi => this.getEMIWithStatus(emi));
  }

  getActiveEMIs(): EMIWithStatus[] {
    return this.getAllEMIs().filter(emi => emi.status === 'active');
  }

  getCompletedEMIs(): EMIWithStatus[] {
    return this.getAllEMIs().filter(emi => emi.status === 'completed');
  }

  getUpcomingEMIs(): EMIWithStatus[] {
    try {
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // If it's after 31st, show next month's EMIs
      const targetMonth = currentDay > 31 ? currentMonth + 1 : currentMonth;
      const targetYear = targetMonth === 12 ? currentYear + 1 : currentYear;
      const targetDate = new Date(targetYear, targetMonth, 1);

      return this.getActiveEMIs()
        .filter(emi => {
          const nextPaymentDate = new Date(emi.nextPaymentDate);
          return (
            nextPaymentDate.getMonth() === targetMonth &&
            nextPaymentDate.getFullYear() === targetYear
          );
        })
        .sort((a, b) => {
          return new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime();
        });
    } catch (error) {
      console.error('Error getting upcoming EMIs:', error);
      return [];
    }
  }

  getTotalMonthlyEMI(): number {
    return this.getActiveEMIs().reduce((total, emi) => total + emi.emiAmount, 0);
  }
}

export const emiDataStore = new EMIDataStore();
