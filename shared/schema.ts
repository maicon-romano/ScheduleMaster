import { z } from "zod";

// Employee schema
export const employeeSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  workDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
  shiftStart: z.string(), // HH:MM format
  shiftEnd: z.string(), // HH:MM format
  weekendRotation: z.boolean(),
  active: z.boolean().default(true),
  weeklyHours: z.number().default(44).optional(), // Standard 44-hour workweek
  customSchedule: z.record(z.string(), z.object({
    start: z.string(),
    end: z.string(),
  })).optional(), // Custom schedule per day: { 'monday': { start: '08:00', end: '18:00' } }
});

export const insertEmployeeSchema = employeeSchema.omit({ id: true });
export type Employee = z.infer<typeof employeeSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

// Holiday schema
export const holidaySchema = z.object({
  id: z.number(),
  date: z.string(), // MM-DD format
  name: z.string().min(1),
  type: z.enum(['national', 'recife']),
  active: z.boolean().default(true)
});

export const insertHolidaySchema = holidaySchema.omit({ id: true });
export type Holiday = z.infer<typeof holidaySchema>;
export type InsertHoliday = z.infer<typeof insertHolidaySchema>;

// Schedule entry schema
export const scheduleEntrySchema = z.object({
  id: z.number(),
  date: z.string(), // YYYY-MM-DD format
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  assignments: z.array(z.object({
    employeeId: z.number(),
    startTime: z.string(), // HH:MM format
    endTime: z.string(), // HH:MM format
    type: z.enum(['regular', 'oncall', 'holiday']).default('regular')
  })).optional(),
  // Legacy fields for backward compatibility
  morningEmployeeId: z.number().nullable(),
  afternoonEmployeeId: z.number().nullable(),
  oncallEmployeeId: z.number().nullable(),
  isHoliday: z.boolean().default(false),
  holidayName: z.string().nullable(),
  status: z.enum(['normal', 'holiday', 'oncall']).default('normal')
});

// Day edit schema for the modal
export const dayEditSchema = z.object({
  date: z.string(),
  assignments: z.array(z.object({
    employeeId: z.number(),
    startTime: z.string(),
    endTime: z.string(),
    type: z.enum(['regular', 'oncall', 'holiday']).default('regular')
  }))
});

export const insertScheduleEntrySchema = scheduleEntrySchema.omit({ id: true });
export type ScheduleEntry = z.infer<typeof scheduleEntrySchema>;
export type InsertScheduleEntry = z.infer<typeof insertScheduleEntrySchema>;

// Weekly schedule schema
export const weeklyScheduleSchema = z.object({
  id: z.number(),
  weekStart: z.string(), // YYYY-MM-DD format
  weekEnd: z.string(), // YYYY-MM-DD format
  entries: z.array(scheduleEntrySchema),
  createdAt: z.date().default(() => new Date())
});

export const insertWeeklyScheduleSchema = weeklyScheduleSchema.omit({ id: true });
export type WeeklySchedule = z.infer<typeof weeklyScheduleSchema>;
export type InsertWeeklySchedule = z.infer<typeof insertWeeklyScheduleSchema>;

// Monthly schedule schema
export const monthlyScheduleSchema = z.object({
  id: z.number(),
  monthStart: z.string(), // YYYY-MM-DD format
  monthEnd: z.string(), // YYYY-MM-DD format
  entries: z.array(scheduleEntrySchema),
  createdAt: z.date().default(() => new Date())
});

export const insertMonthlyScheduleSchema = monthlyScheduleSchema.omit({ id: true });
export type MonthlySchedule = z.infer<typeof monthlyScheduleSchema>;
export type InsertMonthlySchedule = z.infer<typeof insertMonthlyScheduleSchema>;

// Weekend rotation state schema
export const weekendRotationStateSchema = z.object({
  id: z.number(),
  lastSaturdayEmployeeId: z.number().nullable(),
  lastSundayEmployeeId: z.number().nullable(),
  weekCount: z.number().default(0)
});

export const insertWeekendRotationStateSchema = weekendRotationStateSchema.omit({ id: true });
export type WeekendRotationState = z.infer<typeof weekendRotationStateSchema>;
export type InsertWeekendRotationState = z.infer<typeof insertWeekendRotationStateSchema>;
