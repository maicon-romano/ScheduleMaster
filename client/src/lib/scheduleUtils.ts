export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateEmployeeColor(employeeId: number): string {
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-yellow-100 text-yellow-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800',
    'bg-orange-100 text-orange-800',
    'bg-red-100 text-red-800',
    'bg-gray-100 text-gray-800'
  ];
  
  return colors[employeeId % colors.length];
}

export function getDayOfWeekName(dayOfWeek: string): string {
  const names = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };
  return names[dayOfWeek as keyof typeof names] || dayOfWeek;
}

export function getWeekendRotation(employees: any[], rotationState: any): {
  nextSaturday: any;
  nextSunday: any;
} {
  const weekendEmployees = employees.filter(emp => emp.weekendRotation);
  
  if (weekendEmployees.length < 2) {
    return { nextSaturday: null, nextSunday: null };
  }

  const nextSaturday = rotationState?.lastSaturdayEmployeeId === weekendEmployees[0].id 
    ? weekendEmployees[1] 
    : weekendEmployees[0];
    
  const nextSunday = rotationState?.lastSundayEmployeeId === weekendEmployees[0].id 
    ? weekendEmployees[1] 
    : weekendEmployees[0];

  return { nextSaturday, nextSunday };
}

export function isWorkingDay(employee: any, dayOfWeek: string): boolean {
  return employee.workDays.includes(dayOfWeek);
}

export function getEmployeeForShift(employees: any[], dayOfWeek: string, shiftType: 'morning' | 'afternoon'): any {
  return employees.find(emp => 
    emp.workDays.includes(dayOfWeek) && 
    ((shiftType === 'morning' && emp.shiftStart === '08:00' && emp.shiftEnd === '12:00') ||
     (shiftType === 'afternoon' && emp.shiftStart === '12:00' && emp.shiftEnd === '18:00'))
  );
}
