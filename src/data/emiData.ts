import {
  format,
  addMonths,
  parseISO,
  differenceInMonths,
  isAfter,
  isSameDay,
} from 'date-fns';
import {emisCollection} from '../config/firebase';

export interface EMI {
  id: string;
  name: string;
  totalAmount: number;
  emiAmount: number;
  startDate: string;
  tenure: number;
  interestRate: number;
  status?: 'active' | 'completed';
  currentEMI?: number;
  lastPaymentDate?: string;
  lastUpdated?: string;
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
  private listeners: (() => void)[] = [];

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
          interestRate: Number(data.interestRate) || 0,
          status: data.status,
          currentEMI: data.currentEMI,
          lastPaymentDate: data.lastPaymentDate,
          lastUpdated: data.lastUpdated,
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
        interestRate: Number(newEmi.interestRate) || 0,
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

  async getEMIById(id: string): Promise<EMI | null> {
    try {
      const docRef = await emisCollection.doc(id).get();
      if (!docRef.exists) {
        return null;
      }
      const data = docRef.data();
      return {
        id: docRef.id,
        name: data?.name || '',
        totalAmount: Number(data?.totalAmount) || 0,
        emiAmount: Number(data?.emiAmount) || 0,
        startDate: data?.startDate || new Date().toISOString(),
        tenure: Number(data?.tenure) || 0,
        interestRate: Number(data?.interestRate) || 0,
        status: data?.status,
        currentEMI: data?.currentEMI,
        lastPaymentDate: data?.lastPaymentDate,
        lastUpdated: data?.lastUpdated,
      };
    } catch (error) {
      console.error('Error getting EMI:', error);
      throw error;
    }
  }

  // Local state management methods
  addListener(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback());
  }

  updateLocalEMI(emi: EMI): void {
    const index = this.emis.findIndex(e => e.id === emi.id);
    if (index !== -1) {
      this.emis[index] = emi;
      this.notifyListeners();
    } else {
      this.emis.push(emi);
      this.notifyListeners();
    }
  }

  removeLocalEMI(id: string): void {
    this.emis = this.emis.filter(emi => emi.id !== id);
    this.notifyListeners();
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

      // Set start date to beginning of day and today to its actual time
      startDate = new Date(startDate);
      startDate.setHours(0, 0, 0, 0);
      today = new Date(today); // Keep actual time for today

      // If today is before start date, no EMIs paid
      if (today < startDate) {
        return 0;
      }

      // For first EMI, check if we've passed the entire day
      const firstEMIEndDay = new Date(startDate);
      firstEMIEndDay.setHours(23, 59, 59, 999);
      let emisPaid = today > firstEMIEndDay ? 1 : 0;

      // For each subsequent month until today, check if we've passed the EMI date
      let currentDate = startDate;
      while (true) {
        // Move to next month's EMI date and set to end of day
        currentDate = addMonths(currentDate, 1);
        const emiEndDay = new Date(currentDate);
        emiEndDay.setHours(23, 59, 59, 999);

        // If we've moved past today's month, stop counting
        if (
          currentDate.getFullYear() > today.getFullYear() ||
          (currentDate.getFullYear() === today.getFullYear() &&
            currentDate.getMonth() > today.getMonth())
        ) {
          break;
        }

        // If we've passed this EMI's end of day, count it
        if (today > emiEndDay) {
          emisPaid++;
        }
      }

      return emisPaid;
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

      const startDate = new Date(emi.startDate);
      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid start date for EMI: ' + emi.id);
      }

      // Simply add months to start date based on EMIs paid
      const nextPaymentDate = addMonths(startDate, currentEMI);
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

      // Last EMI is (tenure - 1) months after start date since start date is first EMI
      const lastPaymentDate = addMonths(startDate, emi.tenure - 1);
      return format(lastPaymentDate, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Error calculating last payment date:', error);
      return format(new Date(), 'yyyy-MM-dd');
    }
  }

  /**
   * Checks if an EMI has started
   * @param emi EMI to check
   * @returns boolean indicating if EMI has started
   */
  private hasEMIStarted(emi: EMI): boolean {
    try {
      if (!emi.startDate) return false;

      const today = new Date();
      today.setHours(0, 0, 0, 0);  // Set to start of day
      
      const startDate = new Date(emi.startDate);
      startDate.setHours(0, 0, 0, 0);  // Set to start of day

      return startDate <= today;
    } catch (error) {
      console.error('Error checking if EMI has started:', error);
      return false;
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

      // Use currentEMI from EMI object if it exists (manual payments), otherwise calculate
      const currentEMI = emi.currentEMI !== undefined ? 
        Number(emi.currentEMI) : 
        Math.min(this.calculateEMIsPaid(startDate, today), Number(emi.tenure) || 0);

      const tenure = Number(emi.tenure) || 0;
      const emiAmount = Number(emi.emiAmount) || 0;

      // Ensure all calculations use numbers with fallbacks to 0
      const remainingEMIs = Math.max(0, tenure - currentEMI);
      const totalPaid = currentEMI * emiAmount;
      const nextPaymentDate = this.getNextPaymentDate(emi, currentEMI);
      const lastPaymentDate = emi.lastPaymentDate || this.getLastPaymentDate(emi);
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
        lastPaymentDate: emi.lastPaymentDate || format(new Date(), 'yyyy-MM-dd'),
        remainingEMIs: Number(emi.tenure) || 0,
        currentEMI: emi.currentEMI || 0,
        status: 'active',
        totalPaid: 0,
      };
    }
  }

  async syncEMIStatus(
    emiId: string,
    newStatus: 'active' | 'completed',
  ): Promise<void> {
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
      today.setHours(0, 0, 0, 0);

      // Get current month and year
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      return this.getActiveEMIs()
        .filter(emi => {
          const nextPaymentDate = new Date(emi.nextPaymentDate);
          nextPaymentDate.setHours(0, 0, 0, 0);

          // Only show EMIs that:
          // 1. Are in the current month
          // 2. Are due today or in future days of this month
          return (
            nextPaymentDate.getMonth() === currentMonth &&
            nextPaymentDate.getFullYear() === currentYear &&
            nextPaymentDate >= today
          );
        })
        .sort((a, b) => {
          return (
            new Date(a.nextPaymentDate).getTime() -
            new Date(b.nextPaymentDate).getTime()
          );
        });
    } catch (error) {
      console.error('Error getting upcoming EMIs:', error);
      return [];
    }
  }

  getTotalMonthlyEMI(): number {
    return this.getActiveEMIs().reduce(
      (total, emi) => total + emi.emiAmount,
      0,
    );
  }

  getTotalEMIAmount(): number {
    return this.getAllEMIs().reduce(
      (total, emi) => total + emi.emiAmount * emi.tenure,
      0,
    );
  }

  getTotalPaidAmount(): number {
    return this.getAllEMIs().reduce((total, emi) => total + emi.totalPaid, 0);
  }

  getCurrentMonthTotalEMI(): number {
    try {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Sum of EMIs from both active and completed EMIs for this month
      const totalAmount = [...this.getActiveEMIs(), ...this.getCompletedEMIs()]
        .filter(emi => {
          // For active EMIs, check next payment date
          if (emi.status === 'active') {
            const nextPaymentDate = new Date(emi.nextPaymentDate);
            return (
              nextPaymentDate.getMonth() === currentMonth &&
              nextPaymentDate.getFullYear() === currentYear
            );
          }
          // For completed EMIs, check last payment date
          else {
            const lastPaymentDate = new Date(emi.lastPaymentDate);
            return (
              lastPaymentDate.getMonth() === currentMonth &&
              lastPaymentDate.getFullYear() === currentYear
            );
          }
        })
        .reduce((total, emi) => total + emi.emiAmount, 0);

      return totalAmount;
    } catch (error) {
      console.error('Error calculating current month total EMI:', error);
      return 0;
    }
  }

  getCurrentMonthPaidAmount(): number {
    try {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Sum of paid EMIs from both active and completed EMIs
      const paidAmount = [...this.getActiveEMIs(), ...this.getCompletedEMIs()]
        .filter(emi => {
          // For active EMIs, check if payment date has passed
          if (emi.status === 'active') {
            const nextPaymentDate = new Date(emi.nextPaymentDate);
            return (
              nextPaymentDate.getMonth() === currentMonth &&
              nextPaymentDate.getFullYear() === currentYear &&
              today.getDate() >= nextPaymentDate.getDate()
            );
          }
          // For completed EMIs, include if last payment was this month
          else {
            const lastPaymentDate = new Date(emi.lastPaymentDate);
            return (
              lastPaymentDate.getMonth() === currentMonth &&
              lastPaymentDate.getFullYear() === currentYear
            );
          }
        })
        .reduce((total, emi) => total + emi.emiAmount, 0);

      return paidAmount;
    } catch (error) {
      console.error('Error calculating current month paid amount:', error);
      return 0;
    }
  }

  /**
   * Checks if an EMI is paid for the current month
   * @param emi EMI to check
   * @returns boolean indicating if EMI is paid for current month
   */
  isEMIPaidForCurrentMonth(emi: EMI): boolean {
    try {
      if (!emi?.lastPaymentDate) return false;

      const today = new Date();
      const lastPaymentDate = new Date(emi.lastPaymentDate);

      // Check if payment was made in current month and year
      return (
        lastPaymentDate.getMonth() === today.getMonth() &&
        lastPaymentDate.getFullYear() === today.getFullYear()
      );
    } catch (error) {
      console.error('Error checking if EMI is paid for current month:', error);
      return false;
    }
  }

  /**
   * Manually marks an EMI as paid for the current month
   * @param emiId ID of the EMI to mark as paid
   * @returns Promise<boolean> indicating success
   */
  async markEMIAsPaid(emiId: string): Promise<boolean> {
    try {
      const emi = this.emis.find(e => e.id === emiId);
      if (!emi) throw new Error('EMI not found');

      // Check if EMI has started
      if (!this.hasEMIStarted(emi)) {
        throw new Error('EMI has not started yet');
      }

      // Get current status before marking as paid
      const currentStatus = this.getEMIWithStatus(emi);

      // Check if already paid for this month
      if (this.isEMIPaidForCurrentMonth(emi)) {
        throw new Error('EMI is already paid for this month');
      }

      // Check if next payment is due
      const nextPaymentDate = new Date(currentStatus.nextPaymentDate);
      const today = new Date();
      
      // Can only pay if we're in the same month as next payment date
      if (nextPaymentDate.getMonth() !== today.getMonth() || 
          nextPaymentDate.getFullYear() !== today.getFullYear()) {
        throw new Error('Next EMI payment is not due yet');
      }

      if (currentStatus.currentEMI >= Number(emi.tenure)) {
        throw new Error('EMI is already fully paid');
      }

      const now = new Date();
      const updates: any = {
        lastPaymentDate: now.toISOString(),
        lastUpdated: now.toISOString(),
        currentEMI: currentStatus.currentEMI + 1,
      };

      // If this will be the last EMI, mark as completed
      if (currentStatus.currentEMI + 1 >= Number(emi.tenure)) {
        updates.status = 'completed';
      }

      // Update in Firebase
      await emisCollection.doc(emiId).update(updates);

      // Update local state immediately and notify listeners
      const updatedEmi = {...emi, ...updates};
      this.updateLocalEMI(updatedEmi);

      return true;
    } catch (error) {
      console.error('Error marking EMI as paid:', error);
      throw error;
    }
  }

  /**
   * Checks if an EMI is due today
   * @param emi EMI to check
   * @returns boolean indicating if EMI is due today
   */
  isDueToday(emi: EMI): boolean {
    try {
      if (!emi.startDate) return false;

      // If EMI hasn't started yet, it's not due
      if (!this.hasEMIStarted(emi)) {
        return false;
      }

      const today = new Date();
      const startDate = new Date(emi.startDate);

      // Get current month and year
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Get the EMI date for current month
      const status = this.getEMIWithStatus(emi);
      const nextPaymentDate = new Date(status.nextPaymentDate);

      // Check if next payment date is today
      return (
        nextPaymentDate.getDate() === today.getDate() &&
        nextPaymentDate.getMonth() === currentMonth &&
        nextPaymentDate.getFullYear() === currentYear &&
        !this.isEMIPaidForCurrentMonth(emi)
      );
    } catch (error) {
      console.error('Error checking if EMI is due today:', error);
      return false;
    }
  }
}

export const emiDataStore = new EMIDataStore();
