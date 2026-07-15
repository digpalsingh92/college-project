import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

export interface SurgeryData {
  surgeryType: string;
  department: string;
  priceRange: string;
  avgCost: string;
  recoveryTime: string;
  surgeryDuration: string;
  bedAvailability?: string;
}

export interface AppointmentData {
  appointment_id: string;
  appointment_date: string;
  patient_age: string;
  gender: string;
  department: string;
  appointment_type: string;
  scheduled_hour: string;
  waiting_time_minutes: string;
  reminder_sent: string;
  previous_no_shows: string;
  appointment_status: string;
}

export class CSVHelper {
  private static csvCache: Map<string, unknown[]> = new Map();

  /**
   * Read CSV file and return parsed data
   * @param filePath Path to CSV file (relative to project root)
   * @returns Promise with array of parsed objects
   */
  static async readCSV<T = unknown>(filePath: string): Promise<T[]> {
    const absolutePath = path.resolve(filePath);

    if (this.csvCache.has(absolutePath)) {
      return this.csvCache.get(absolutePath) as T[];
    }

    return new Promise((resolve, reject) => {
      const results: T[] = [];

      fs.createReadStream(absolutePath)
        .pipe(csv())
        .on('data', (data: T) => {
          results.push(data);
        })
        .on('end', () => {
          this.csvCache.set(absolutePath, results);
          resolve(results);
        })
        .on('error', (error: any) => {
          reject(error);
        });
    });
  }

  /**
   * Get surgery-specific data from CSV
   * @param surgeryType Type of surgery (e.g., 'cataract', 'heart')
   * @returns Surgery data or null if not found
   */
  static async getSurgeryData(surgeryType: string): Promise<SurgeryData | null> {
    try {
      const surgeries = await this.readCSV<SurgeryData>('src/Datasets/surgery_data.csv');
      const normalizedType = surgeryType.toLowerCase();

      return surgeries.find((s) => s.surgeryType.toLowerCase() === normalizedType) || null;
    } catch (error) {
      console.error('Error reading surgery data:', error);
      return null;
    }
  }

  /**
   * Get appointment/waiting time data by department
   * @param department Department name
   * @returns Array of matching appointments
   */
  static async getAppointmentsByDepartment(department: string): Promise<AppointmentData[]> {
    try {
      let appointments: AppointmentData[] = [];
      try {
        appointments = await this.readCSV<AppointmentData>('src/Datasets/appointments.csv');
      } catch {
        appointments = await this.readCSV<AppointmentData>('src/Datasets/wait_time_no_show_dataset_01.csv');
      }
      const normalizedDept = department.toLowerCase();

      return appointments.filter((a) => a.department.toLowerCase() === normalizedDept);
    } catch (error) {
      console.error('Error reading appointment data:', error);
      return [];
    }
  }

  /**
   * Calculate average waiting time for a department
   * @param department Department name
   * @returns Average waiting time in minutes
   */
  static async getAverageWaitingTime(department: string): Promise<number> {
    const appointments = await this.getAppointmentsByDepartment(department);
    if (appointments.length === 0) return 0;

    const total = appointments.reduce((sum, appointment) => {
      const waitingTime = Number.parseInt(appointment.waiting_time_minutes, 10);
      return sum + (Number.isNaN(waitingTime) ? 0 : waitingTime);
    }, 0);

    return total / appointments.length;
  }

  /**
   * Clear CSV cache (useful for testing or when data changes)
   */
  static clearCache(): void {
    this.csvCache.clear();
  }
}

export default CSVHelper;
