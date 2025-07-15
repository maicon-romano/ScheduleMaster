import { z } from "zod";

// Employee schema
export const employeeSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  workDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
  shiftStart: z.string(), // HH:MM format
  shiftEnd: z.string(), // HH:MM format
  weekendRotation: z.boolean(),
  active: z.boolean().default(true)
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
  morningEmployeeId: z.number().nullable(),
  afternoonEmployeeId: z.number().nullable(),
  oncallEmployeeId: z.number().nullable(),
  isHoliday: z.boolean().default(false),
  holidayName: z.string().nullable(),
  status: z.enum(['normal', 'holiday', 'oncall']).default('normal')
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
