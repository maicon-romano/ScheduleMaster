import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/scheduleUtils";
import { isHoliday, getHolidayName } from "@/lib/dateUtils";

interface CalendarViewProps {
  schedule: any;
  employees: any[];
  holidays: any[];
  isLoading: boolean;
  viewMode: 'day' | 'week' | 'month';
  onDayClick: (date: string) => void;
}

export default function CalendarView({ 
  schedule, 
  employees, 
  holidays, 
  isLoading, 
  viewMode,
  onDayClick 
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  if (isLoading || !schedule?.entries) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getEmployeeById = (id: number | null) => {
    if (!id) return null;
    return employees.find(emp => emp.id === id);
  };

  const getEmployeeInitials = (employee: any) => {
    if (!employee) return '';
    return getInitials(employee.name);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };

  const getDayShifts = (entry: any) => {
    const shifts = [];
    
    // Morning shift
    if (entry.morningEmployeeId) {
      const emp = getEmployeeById(entry.morningEmployeeId);
      if (emp) {
        shifts.push({
          employee: emp,
          time: '08:00-12:00',
          type: 'morning'
        });
      }
    }

    // Afternoon shift
    if (entry.afternoonEmployeeId) {
      const emp = getEmployeeById(entry.afternoonEmployeeId);
      if (emp) {
        shifts.push({
          employee: emp,
          time: '12:00-18:00',
          type: 'afternoon'
        });
      }
    }

    // Oncall shift
    if (entry.oncallEmployeeId) {
      const emp = getEmployeeById(entry.oncallEmployeeId);
      if (emp) {
        shifts.push({
          employee: emp,
          time: 'Plantão',
          type: 'oncall'
        });
      }
    }

    return shifts;
  };

  const renderDayCard = (entry: any, isCompact = false) => {
    const date = new Date(entry.date);
    const isToday = date.toDateString() === new Date().toDateString();
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const entryIsHoliday = isHoliday(entry.date, holidays);
    const holidayName = getHolidayName(entry.date, holidays);
    const shifts = getDayShifts(entry);

    return (
      <Card 
        key={entry.id}
        className={`
          cursor-pointer transition-all hover:shadow-md
          ${isToday ? 'ring-2 ring-primary' : ''}
          ${entryIsHoliday ? 'bg-primary/10 border-primary/20' : ''}
          ${isWeekend && !entryIsHoliday ? 'bg-gray-50' : ''}
          ${isCompact ? 'min-h-[120px]' : 'min-h-[160px]'}
        `}
        onClick={() => onDayClick(entry.date)}
      >
        <CardHeader className={`pb-2 ${isCompact ? 'p-3' : ''}`}>
          <CardTitle className={`text-sm font-medium ${isCompact ? 'text-xs' : ''}`}>
            <div className="flex items-center justify-between">
              <span>{date.getDate()}</span>
              {entryIsHoliday && (
                <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs">
                  Feriado
                </Badge>
              )}
            </div>
            {entryIsHoliday && holidayName && (
              <div className="text-xs text-primary font-normal mt-1 truncate">
                {holidayName}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className={`pt-0 space-y-1 ${isCompact ? 'p-3 pt-0' : ''}`}>
          {shifts.map((shift, idx) => (
            <div 
              key={idx}
              className={`
                flex items-center gap-1 text-xs p-1 rounded
                ${shift.type === 'oncall' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}
                ${isCompact ? 'text-[10px]' : ''}
              `}
            >
              <User className="h-3 w-3" />
              <span className="font-medium">{getEmployeeInitials(shift.employee)}</span>
              <Clock className="h-2 w-2 ml-auto" />
              <span>{shift.time}</span>
            </div>
          ))}
          {shifts.length === 0 && !entryIsHoliday && (
            <div className="text-xs text-gray-400 italic">
              Sem escalação
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderMonthView = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startOfCalendar = new Date(startOfMonth);
    startOfCalendar.setDate(startOfCalendar.getDate() - startOfMonth.getDay());

    const days = [];
    const current = new Date(startOfCalendar);

    for (let i = 0; i < 42; i++) {
      const dateStr = current.toISOString().split('T')[0];
      const entry = schedule.entries.find((e: any) => e.date === dateStr);
      const isCurrentMonth = current.getMonth() === currentDate.getMonth();

      if (entry && isCurrentMonth) {
        days.push(renderDayCard(entry, true));
      } else {
        days.push(
          <div 
            key={dateStr}
            className={`
              min-h-[120px] p-2 border rounded-lg cursor-pointer
              ${isCurrentMonth ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-25 text-gray-400'}
            `}
            onClick={() => isCurrentMonth && onDayClick(dateStr)}
          >
            <div className="text-sm">{current.getDate()}</div>
          </div>
        );
      }
      current.setDate(current.getDate() + 1);
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-600">
          <div>Dom</div>
          <div>Seg</div>
          <div>Ter</div>
          <div>Qua</div>
          <div>Qui</div>
          <div>Sex</div>
          <div>Sáb</div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(startOfWeek);
      current.setDate(startOfWeek.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      const entry = schedule.entries.find((e: any) => e.date === dateStr);
      
      if (entry) {
        weekDays.push(renderDayCard(entry));
      } else {
        weekDays.push(
          <Card key={dateStr} className="min-h-[160px] cursor-pointer hover:shadow-md" onClick={() => onDayClick(dateStr)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{current.getDate()}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-gray-400 italic">Sem escalação</div>
            </CardContent>
          </Card>
        );
      }
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-600">
          <div>Dom</div>
          <div>Seg</div>
          <div>Ter</div>
          <div>Qua</div>
          <div>Qui</div>
          <div>Sex</div>
          <div>Sáb</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const entry = schedule.entries.find((e: any) => e.date === dateStr);
    
    if (!entry) {
      return (
        <Card className="p-6">
          <div className="text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Nenhuma escalação encontrada</h3>
            <p className="text-sm">Clique para criar uma escalação para este dia</p>
            <Button className="mt-4" onClick={() => onDayClick(dateStr)}>
              Criar Escalação
            </Button>
          </div>
        </Card>
      );
    }

    return (
      <div className="max-w-2xl mx-auto">
        {renderDayCard(entry)}
      </div>
    );
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  const getTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${endOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold capitalize">{getTitle()}</h2>
          <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setCurrentDate(new Date())}
          className="text-sm"
        >
          Hoje
        </Button>
      </div>

      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
    </div>
  );
}