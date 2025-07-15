import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertHolidaySchema, insertScheduleEntrySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Employee routes
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Error fetching employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Error fetching employee" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ message: "Invalid employee data" });
    }
  });

  app.put("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.updateEmployee(id, req.body);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Error updating employee" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEmployee(id);
      if (!deleted) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting employee" });
    }
  });

  // Holiday routes
  app.get("/api/holidays", async (req, res) => {
    try {
      const holidays = await storage.getHolidays();
      res.json(holidays);
    } catch (error) {
      res.status(500).json({ message: "Error fetching holidays" });
    }
  });

  app.post("/api/holidays", async (req, res) => {
    try {
      const validatedData = insertHolidaySchema.parse(req.body);
      const holiday = await storage.createHoliday(validatedData);
      res.status(201).json(holiday);
    } catch (error) {
      res.status(400).json({ message: "Invalid holiday data" });
    }
  });

  app.put("/api/holidays/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const holiday = await storage.updateHoliday(id, req.body);
      if (!holiday) {
        return res.status(404).json({ message: "Holiday not found" });
      }
      res.json(holiday);
    } catch (error) {
      res.status(500).json({ message: "Error updating holiday" });
    }
  });

  app.delete("/api/holidays/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteHoliday(id);
      if (!deleted) {
        return res.status(404).json({ message: "Holiday not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting holiday" });
    }
  });

  // Schedule routes
  app.get("/api/schedules", async (req, res) => {
    try {
      const schedules = await storage.getSchedules();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Error fetching schedules" });
    }
  });

  app.get("/api/schedules/week/:weekStart", async (req, res) => {
    try {
      const weekStart = req.params.weekStart;
      const schedule = await storage.getScheduleByWeek(weekStart);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Error fetching schedule" });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const schedule = await storage.createSchedule(req.body);
      res.status(201).json(schedule);
    } catch (error) {
      res.status(400).json({ message: "Invalid schedule data" });
    }
  });

  app.put("/api/schedules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const schedule = await storage.updateSchedule(id, req.body);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Error updating schedule" });
    }
  });

  // Generate new weekly schedule
  app.post("/api/schedules/generate", async (req, res) => {
    try {
      const { weekStart } = req.body;
      
      // Get employees and holidays
      const employees = await storage.getEmployees();
      const holidays = await storage.getHolidays();
      const rotationState = await storage.getWeekendRotationState();

      // Generate schedule logic
      const schedule = await generateWeeklySchedule(weekStart, employees, holidays, rotationState);
      
      // Save the schedule
      const savedSchedule = await storage.createSchedule(schedule);
      
      res.status(201).json(savedSchedule);
    } catch (error) {
      res.status(500).json({ message: "Error generating schedule" });
    }
  });

  // Monthly schedule routes
  app.get("/api/monthly-schedules", async (req, res) => {
    try {
      const schedules = await storage.getMonthlySchedules();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Error fetching monthly schedules" });
    }
  });

  app.get("/api/monthly-schedules/month/:monthStart", async (req, res) => {
    try {
      const monthStart = req.params.monthStart;
      let schedule = await storage.getScheduleByMonth(monthStart);
      
      // Auto-generate monthly schedule if it doesn't exist
      if (!schedule) {
        const employees = await storage.getEmployees();
        const holidays = await storage.getHolidays();
        const rotationState = await storage.getWeekendRotationState();
        
        const generatedSchedule = await generateMonthlySchedule(monthStart, employees, holidays, rotationState);
        schedule = await storage.createMonthlySchedule(generatedSchedule);
      }
      
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Error fetching monthly schedule" });
    }
  });

  app.put("/api/monthly-schedules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const schedule = await storage.updateMonthlySchedule(id, req.body);
      if (!schedule) {
        return res.status(404).json({ message: "Monthly schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Error updating monthly schedule" });
    }
  });

  // Weekend rotation state
  app.get("/api/rotation-state", async (req, res) => {
    try {
      const state = await storage.getWeekendRotationState();
      res.json(state);
    } catch (error) {
      res.status(500).json({ message: "Error fetching rotation state" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to generate monthly schedule
async function generateMonthlySchedule(monthStart: string, employees: any[], holidays: any[], rotationState: any) {
  const startDate = new Date(monthStart);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0); // Last day of month
  
  const entries = [];
  const weekendEmployees = employees.filter(emp => emp.weekendRotation);
  
  // Weekend rotation tracking
  let currentSaturdayEmployeeIndex = 0;
  let currentSundayEmployeeIndex = 0;
  
  if (weekendEmployees.length >= 2) {
    // Find current rotation position
    const lastSaturdayId = rotationState.lastSaturdayEmployeeId;
    const lastSundayId = rotationState.lastSundayEmployeeId;
    
    if (lastSaturdayId) {
      currentSaturdayEmployeeIndex = weekendEmployees.findIndex(emp => emp.id === lastSaturdayId);
      currentSaturdayEmployeeIndex = (currentSaturdayEmployeeIndex + 1) % weekendEmployees.length;
    }
    
    if (lastSundayId) {
      currentSundayEmployeeIndex = weekendEmployees.findIndex(emp => emp.id === lastSundayId);
      currentSundayEmployeeIndex = (currentSundayEmployeeIndex + 1) % weekendEmployees.length;
    }
  }
  
  // Generate entries for each day of the month
  for (let day = 1; day <= endDate.getDate(); day++) {
    const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), day);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const dayOfWeek = dayNames[currentDate.getDay()] as 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
    
    const dateStr = currentDate.toISOString().split('T')[0];
    const monthDay = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    
    // Check if it's a holiday
    const holiday = holidays.find(h => h.date === monthDay);
    const isHoliday = !!holiday;
    
    // Find employees for this day
    const morningEmployee = employees.find(emp => 
      emp.workDays.includes(dayOfWeek) && 
      emp.shiftStart === "08:00" && 
      emp.shiftEnd === "12:00"
    );
    
    const afternoonEmployee = employees.find(emp => 
      emp.workDays.includes(dayOfWeek) && 
      emp.shiftStart === "12:00" && 
      emp.shiftEnd === "18:00"
    );
    
    // Weekend rotation logic
    let oncallEmployee = null;
    if (dayOfWeek === 'saturday' && weekendEmployees.length >= 2) {
      oncallEmployee = weekendEmployees[currentSaturdayEmployeeIndex];
      currentSaturdayEmployeeIndex = (currentSaturdayEmployeeIndex + 1) % weekendEmployees.length;
    } else if (dayOfWeek === 'sunday' && weekendEmployees.length >= 2) {
      oncallEmployee = weekendEmployees[currentSundayEmployeeIndex];
      currentSundayEmployeeIndex = (currentSundayEmployeeIndex + 1) % weekendEmployees.length;
    }
    
    const status: 'holiday' | 'oncall' | 'normal' = isHoliday ? 'holiday' : (oncallEmployee ? 'oncall' : 'normal');
    
    entries.push({
      id: Date.now() + day,
      date: dateStr,
      dayOfWeek,
      assignments: [],
      morningEmployeeId: morningEmployee?.id || null,
      afternoonEmployeeId: afternoonEmployee?.id || null,
      oncallEmployeeId: oncallEmployee?.id || null,
      isHoliday,
      holidayName: holiday?.name || null,
      status
    });
  }
  
  // Update rotation state for the last weekend of the month
  if (weekendEmployees.length >= 2) {
    const lastSaturday = entries.filter(e => e.dayOfWeek === 'saturday').pop();
    const lastSunday = entries.filter(e => e.dayOfWeek === 'sunday').pop();
    
    if (lastSaturday?.oncallEmployeeId) {
      await storage.updateWeekendRotationState({
        lastSaturdayEmployeeId: lastSaturday.oncallEmployeeId,
        weekCount: rotationState.weekCount + 1
      });
    }
    
    if (lastSunday?.oncallEmployeeId) {
      await storage.updateWeekendRotationState({
        lastSundayEmployeeId: lastSunday.oncallEmployeeId
      });
    }
  }

  return {
    monthStart: monthStart,
    monthEnd: endDate.toISOString().split('T')[0],
    entries,
    createdAt: new Date()
  };
}

// Helper function to generate weekly schedule
async function generateWeeklySchedule(weekStart: string, employees: any[], holidays: any[], rotationState: any) {
  const startDate = new Date(weekStart);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const entries = [];
  const weekendEmployees = employees.filter(emp => emp.weekendRotation);
  
  // Generate rotation for weekend employees
  let saturdayEmployee = null;
  let sundayEmployee = null;
  
  if (weekendEmployees.length >= 2) {
    const nextSaturdayId = rotationState.lastSaturdayEmployeeId === weekendEmployees[0].id ? 
      weekendEmployees[1].id : weekendEmployees[0].id;
    const nextSundayId = rotationState.lastSundayEmployeeId === weekendEmployees[0].id ? 
      weekendEmployees[1].id : weekendEmployees[0].id;
    
    saturdayEmployee = weekendEmployees.find(emp => emp.id === nextSaturdayId);
    sundayEmployee = weekendEmployees.find(emp => emp.id === nextSundayId);
    
    // Update rotation state
    await storage.updateWeekendRotationState({
      lastSaturdayEmployeeId: nextSaturdayId,
      lastSundayEmployeeId: nextSundayId,
      weekCount: rotationState.weekCount + 1
    });
  }

  // Generate entries for each day
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const dayOfWeek = dayNames[currentDate.getDay()] as 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
    
    const dateStr = currentDate.toISOString().split('T')[0];
    const monthDay = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    
    // Check if it's a holiday
    const holiday = holidays.find(h => h.date === monthDay);
    const isHoliday = !!holiday;
    
    // Find employees for this day
    const morningEmployee = employees.find(emp => 
      emp.workDays.includes(dayOfWeek) && 
      emp.shiftStart === "08:00" && 
      emp.shiftEnd === "12:00"
    );
    
    const afternoonEmployee = employees.find(emp => 
      emp.workDays.includes(dayOfWeek) && 
      emp.shiftStart === "12:00" && 
      emp.shiftEnd === "18:00"
    );
    
    let oncallEmployee = null;
    if (dayOfWeek === 'saturday' && saturdayEmployee) {
      oncallEmployee = saturdayEmployee;
    } else if (dayOfWeek === 'sunday' && sundayEmployee) {
      oncallEmployee = sundayEmployee;
    }
    
    const status: 'holiday' | 'oncall' | 'normal' = isHoliday ? 'holiday' : (oncallEmployee ? 'oncall' : 'normal');
    
    entries.push({
      id: Date.now() + i, // Generate unique ID
      date: dateStr,
      dayOfWeek,
      assignments: [],
      morningEmployeeId: morningEmployee?.id || null,
      afternoonEmployeeId: afternoonEmployee?.id || null,
      oncallEmployeeId: oncallEmployee?.id || null,
      isHoliday,
      holidayName: holiday?.name || null,
      status
    });
  }

  return {
    weekStart: weekStart,
    weekEnd: endDate.toISOString().split('T')[0],
    entries,
    createdAt: new Date()
  };
}
