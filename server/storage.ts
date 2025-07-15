import { 
  Employee, 
  InsertEmployee, 
  Holiday, 
  InsertHoliday, 
  ScheduleEntry, 
  InsertScheduleEntry,
  WeeklySchedule,
  InsertWeeklySchedule,
  WeekendRotationState,
  InsertWeekendRotationState
} from "@shared/schema";
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const EMPLOYEES_FILE = path.join(DATA_DIR, 'funcionarios.json');
const HOLIDAYS_FILE = path.join(DATA_DIR, 'feriados.json');
const SCHEDULES_FILE = path.join(DATA_DIR, 'escalas.json');
const ROTATION_FILE = path.join(DATA_DIR, 'revezamento.json');

export interface IStorage {
  // Employee operations
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<Employee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;

  // Holiday operations
  getHolidays(): Promise<Holiday[]>;
  getHoliday(id: number): Promise<Holiday | undefined>;
  createHoliday(holiday: InsertHoliday): Promise<Holiday>;
  updateHoliday(id: number, holiday: Partial<Holiday>): Promise<Holiday | undefined>;
  deleteHoliday(id: number): Promise<boolean>;

  // Schedule operations
  getSchedules(): Promise<WeeklySchedule[]>;
  getSchedule(id: number): Promise<WeeklySchedule | undefined>;
  getScheduleByWeek(weekStart: string): Promise<WeeklySchedule | undefined>;
  createSchedule(schedule: InsertWeeklySchedule): Promise<WeeklySchedule>;
  updateSchedule(id: number, schedule: Partial<WeeklySchedule>): Promise<WeeklySchedule | undefined>;
  deleteSchedule(id: number): Promise<boolean>;

  // Weekend rotation state
  getWeekendRotationState(): Promise<WeekendRotationState>;
  updateWeekendRotationState(state: Partial<WeekendRotationState>): Promise<WeekendRotationState>;
}

export class FileStorage implements IStorage {
  private employees: Map<number, Employee> = new Map();
  private holidays: Map<number, Holiday> = new Map();
  private schedules: Map<number, WeeklySchedule> = new Map();
  private rotationState: WeekendRotationState = {
    id: 1,
    lastSaturdayEmployeeId: null,
    lastSundayEmployeeId: null,
    weekCount: 0
  };

  private nextEmployeeId = 1;
  private nextHolidayId = 1;
  private nextScheduleId = 1;

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await this.loadEmployees();
      await this.loadHolidays();
      await this.loadSchedules();
      await this.loadRotationState();
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }

  private async loadEmployees() {
    try {
      const data = await fs.readFile(EMPLOYEES_FILE, 'utf-8');
      const employees: Employee[] = JSON.parse(data);
      this.employees.clear();
      employees.forEach(emp => {
        this.employees.set(emp.id, emp);
        this.nextEmployeeId = Math.max(this.nextEmployeeId, emp.id + 1);
      });
    } catch (error) {
      // File doesn't exist, initialize with default data
      await this.initializeDefaultEmployees();
    }
  }

  private async initializeDefaultEmployees() {
    const defaultEmployees: InsertEmployee[] = [
      {
        name: "João Miranda",
        workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        shiftStart: "08:00",
        shiftEnd: "12:00",
        weekendRotation: false,
        active: true
      },
      {
        name: "Ana Silva",
        workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        shiftStart: "12:00",
        shiftEnd: "18:00",
        weekendRotation: false,
        active: true
      },
      {
        name: "Marcos Costa",
        workDays: ['tuesday', 'wednesday', 'thursday', 'friday'],
        shiftStart: "08:00",
        shiftEnd: "12:00",
        weekendRotation: false,
        active: true
      },
      {
        name: "Lucas Ferreira",
        workDays: ['tuesday', 'wednesday', 'thursday', 'friday'],
        shiftStart: "12:00",
        shiftEnd: "18:00",
        weekendRotation: false,
        active: true
      },
      {
        name: "Kellen Silva",
        workDays: ['saturday', 'sunday'],
        shiftStart: "08:00",
        shiftEnd: "18:00",
        weekendRotation: true,
        active: true
      },
      {
        name: "Maicon Rocha",
        workDays: ['saturday', 'sunday'],
        shiftStart: "08:00",
        shiftEnd: "18:00",
        weekendRotation: true,
        active: true
      }
    ];

    for (const emp of defaultEmployees) {
      await this.createEmployee(emp);
    }
  }

  private async loadHolidays() {
    try {
      const data = await fs.readFile(HOLIDAYS_FILE, 'utf-8');
      const holidays: Holiday[] = JSON.parse(data);
      this.holidays.clear();
      holidays.forEach(holiday => {
        this.holidays.set(holiday.id, holiday);
        this.nextHolidayId = Math.max(this.nextHolidayId, holiday.id + 1);
      });
    } catch (error) {
      // File doesn't exist, initialize with default data
      await this.initializeDefaultHolidays();
    }
  }

  private async initializeDefaultHolidays() {
    const defaultHolidays: InsertHoliday[] = [
      { date: "01-01", name: "Confraternização Universal", type: "national", active: true },
      { date: "24-06", name: "São João", type: "recife", active: true },
      { date: "07-09", name: "Independência do Brasil", type: "national", active: true },
      { date: "12-10", name: "Nossa Senhora Aparecida", type: "national", active: true },
      { date: "02-11", name: "Finados", type: "national", active: true },
      { date: "15-11", name: "Proclamação da República", type: "national", active: true },
      { date: "25-12", name: "Natal", type: "national", active: true }
    ];

    for (const holiday of defaultHolidays) {
      await this.createHoliday(holiday);
    }
  }

  private async loadSchedules() {
    try {
      const data = await fs.readFile(SCHEDULES_FILE, 'utf-8');
      const schedules: WeeklySchedule[] = JSON.parse(data);
      this.schedules.clear();
      schedules.forEach(schedule => {
        this.schedules.set(schedule.id, {
          ...schedule,
          createdAt: new Date(schedule.createdAt)
        });
        this.nextScheduleId = Math.max(this.nextScheduleId, schedule.id + 1);
      });
    } catch (error) {
      // File doesn't exist, start with empty schedules
    }
  }

  private async loadRotationState() {
    try {
      const data = await fs.readFile(ROTATION_FILE, 'utf-8');
      this.rotationState = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, use default state
      await this.saveRotationState();
    }
  }

  private async saveEmployees() {
    const employees = Array.from(this.employees.values());
    await fs.writeFile(EMPLOYEES_FILE, JSON.stringify(employees, null, 2));
  }

  private async saveHolidays() {
    const holidays = Array.from(this.holidays.values());
    await fs.writeFile(HOLIDAYS_FILE, JSON.stringify(holidays, null, 2));
  }

  private async saveSchedules() {
    const schedules = Array.from(this.schedules.values());
    await fs.writeFile(SCHEDULES_FILE, JSON.stringify(schedules, null, 2));
  }

  private async saveRotationState() {
    await fs.writeFile(ROTATION_FILE, JSON.stringify(this.rotationState, null, 2));
  }

  // Employee operations
  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(emp => emp.active);
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const employee: Employee = {
      ...insertEmployee,
      id: this.nextEmployeeId++
    };
    this.employees.set(employee.id, employee);
    await this.saveEmployees();
    return employee;
  }

  async updateEmployee(id: number, updates: Partial<Employee>): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;

    const updated = { ...employee, ...updates };
    this.employees.set(id, updated);
    await this.saveEmployees();
    return updated;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const employee = this.employees.get(id);
    if (!employee) return false;

    employee.active = false;
    await this.saveEmployees();
    return true;
  }

  // Holiday operations
  async getHolidays(): Promise<Holiday[]> {
    return Array.from(this.holidays.values()).filter(h => h.active);
  }

  async getHoliday(id: number): Promise<Holiday | undefined> {
    return this.holidays.get(id);
  }

  async createHoliday(insertHoliday: InsertHoliday): Promise<Holiday> {
    const holiday: Holiday = {
      ...insertHoliday,
      id: this.nextHolidayId++
    };
    this.holidays.set(holiday.id, holiday);
    await this.saveHolidays();
    return holiday;
  }

  async updateHoliday(id: number, updates: Partial<Holiday>): Promise<Holiday | undefined> {
    const holiday = this.holidays.get(id);
    if (!holiday) return undefined;

    const updated = { ...holiday, ...updates };
    this.holidays.set(id, updated);
    await this.saveHolidays();
    return updated;
  }

  async deleteHoliday(id: number): Promise<boolean> {
    const holiday = this.holidays.get(id);
    if (!holiday) return false;

    holiday.active = false;
    await this.saveHolidays();
    return true;
  }

  // Schedule operations
  async getSchedules(): Promise<WeeklySchedule[]> {
    return Array.from(this.schedules.values());
  }

  async getSchedule(id: number): Promise<WeeklySchedule | undefined> {
    return this.schedules.get(id);
  }

  async getScheduleByWeek(weekStart: string): Promise<WeeklySchedule | undefined> {
    return Array.from(this.schedules.values()).find(s => s.weekStart === weekStart);
  }

  async createSchedule(insertSchedule: InsertWeeklySchedule): Promise<WeeklySchedule> {
    const schedule: WeeklySchedule = {
      ...insertSchedule,
      id: this.nextScheduleId++
    };
    this.schedules.set(schedule.id, schedule);
    await this.saveSchedules();
    return schedule;
  }

  async updateSchedule(id: number, updates: Partial<WeeklySchedule>): Promise<WeeklySchedule | undefined> {
    const schedule = this.schedules.get(id);
    if (!schedule) return undefined;

    const updated = { ...schedule, ...updates };
    this.schedules.set(id, updated);
    await this.saveSchedules();
    return updated;
  }

  async deleteSchedule(id: number): Promise<boolean> {
    const deleted = this.schedules.delete(id);
    if (deleted) {
      await this.saveSchedules();
    }
    return deleted;
  }

  // Weekend rotation state
  async getWeekendRotationState(): Promise<WeekendRotationState> {
    return this.rotationState;
  }

  async updateWeekendRotationState(updates: Partial<WeekendRotationState>): Promise<WeekendRotationState> {
    this.rotationState = { ...this.rotationState, ...updates };
    await this.saveRotationState();
    return this.rotationState;
  }
}

export const storage = new FileStorage();
