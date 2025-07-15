import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/scheduleUtils";

interface ScheduleTableProps {
  schedule: any;
  employees: any[];
  holidays: any[];
  isLoading: boolean;
  isEditMode: boolean;
}

export default function ScheduleTable({ 
  schedule, 
  employees, 
  holidays, 
  isLoading, 
  isEditMode 
}: ScheduleTableProps) {
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!schedule || !schedule.entries) {
    return (
      <div className="p-6 text-center text-gray-500">
        Nenhuma escala encontrada para este mês
      </div>
    );
  }

  const getEmployeeById = (id: number | null) => {
    if (!id) return null;
    return employees.find(emp => emp.id === id);
  };

  const getDayName = (dayOfWeek: string) => {
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
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const getEmployeeInitials = (employee: any) => {
    if (!employee) return '';
    return getInitials(employee.name);
  };

  const getEmployeeColor = (employee: any) => {
    if (!employee) return 'bg-gray-100';
    
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-yellow-100 text-yellow-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-orange-100 text-orange-800'
    ];
    
    return colors[employee.id % colors.length];
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left font-semibold text-gray-700">Dia</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700">Data</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700">Turno Manhã</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700">Turno Tarde</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700">Plantão</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {schedule.entries.map((entry: any) => {
            const morningEmployee = getEmployeeById(entry.morningEmployeeId);
            const afternoonEmployee = getEmployeeById(entry.afternoonEmployeeId);
            const oncallEmployee = getEmployeeById(entry.oncallEmployeeId);
            
            const isWeekend = entry.dayOfWeek === 'saturday' || entry.dayOfWeek === 'sunday';
            const rowClass = isWeekend ? 'bg-orange-50' : 'hover:bg-gray-50';

            return (
              <tr key={entry.date} className={`${rowClass} transition-colors`}>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {getDayName(entry.dayOfWeek)}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {formatDate(entry.date)}
                </td>
                <td className="px-6 py-4">
                  {morningEmployee ? (
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getEmployeeColor(morningEmployee)}`}>
                        <span className="text-xs font-semibold">
                          {getEmployeeInitials(morningEmployee)}
                        </span>
                      </div>
                      <span className="text-gray-900">{morningEmployee.name}</span>
                      <span className="text-xs text-gray-500">
                        {morningEmployee.shiftStart}-{morningEmployee.shiftEnd}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {afternoonEmployee ? (
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getEmployeeColor(afternoonEmployee)}`}>
                        <span className="text-xs font-semibold">
                          {getEmployeeInitials(afternoonEmployee)}
                        </span>
                      </div>
                      <span className="text-gray-900">{afternoonEmployee.name}</span>
                      <span className="text-xs text-gray-500">
                        {afternoonEmployee.shiftStart}-{afternoonEmployee.shiftEnd}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {oncallEmployee ? (
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getEmployeeColor(oncallEmployee)}`}>
                        <span className="text-xs font-semibold">
                          {getEmployeeInitials(oncallEmployee)}
                        </span>
                      </div>
                      <span className="text-gray-900">{oncallEmployee.name}</span>
                      <span className="text-xs text-gray-500">
                        {oncallEmployee.shiftStart}-{oncallEmployee.shiftEnd}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    entry.status === 'holiday' 
                      ? 'bg-red-100 text-red-800' 
                      : entry.status === 'oncall'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {entry.status === 'holiday' ? 'Feriado' : 
                     entry.status === 'oncall' ? 'Plantão' : 'Normal'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
