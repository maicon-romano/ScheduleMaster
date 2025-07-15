export function getCurrentWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export function formatDateRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  const startFormatted = start.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit' 
  });
  const endFormatted = end.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit',
    year: 'numeric'
  });
  
  return `${startFormatted} - ${endFormatted}`;
}

export function getNextWeekStart(currentWeekStart: string): string {
  const current = new Date(currentWeekStart);
  current.setDate(current.getDate() + 7);
  return current.toISOString().split('T')[0];
}

export function getPreviousWeekStart(currentWeekStart: string): string {
  const current = new Date(currentWeekStart);
  current.setDate(current.getDate() - 7);
  return current.toISOString().split('T')[0];
}

export function isHoliday(date: string, holidays: any[]): boolean {
  const dateObj = new Date(date);
  const monthDay = `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  return holidays.some(holiday => holiday.date === monthDay);
}

export function getHolidayName(date: string, holidays: any[]): string | null {
  const dateObj = new Date(date);
  const monthDay = `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  const holiday = holidays.find(h => h.date === monthDay);
  return holiday ? holiday.name : null;
}
