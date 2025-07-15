import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck, Calendar, Grid3X3, LayoutGrid, Plus, Save, Edit } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import CalendarView from "@/components/CalendarView";
import DayEditModal from "@/components/DayEditModal";
import EmployeeModal from "@/components/EmployeeModal";
import { getCurrentMonthStart, formatMonthYear, getFutureHolidays } from "@/lib/dateUtils";
import { apiRequest } from "@/lib/queryClient";

export default function SchedulePage() {
  const { toast } = useToast();
  const [currentMonthStart] = useState(getCurrentMonthStart());
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isDayEditModalOpen, setIsDayEditModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/employees"],
  });

  const { data: currentSchedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ["/api/monthly-schedules/month", currentMonthStart],
  });

  const { data: holidays = [] } = useQuery({
    queryKey: ["/api/holidays"],
  });

  const { data: rotationState } = useQuery({
    queryKey: ["/api/rotation-state"],
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async (schedule: any) => {
      const response = await apiRequest("PUT", `/api/monthly-schedules/${schedule.id}`, schedule);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-schedules"] });
      toast({
        title: "Sucesso!",
        description: "Escala salva com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro!",
        description: "Erro ao salvar escala.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSchedule = () => {
    if (currentSchedule) {
      saveScheduleMutation.mutate(currentSchedule);
    }
  };

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setIsDayEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDayEditModalOpen(false);
    setSelectedDate(null);
  };

  const weekendEmployees = employees.filter((emp: any) => emp.weekendRotation);
  const nextSaturday = rotationState?.lastSaturdayEmployeeId === weekendEmployees[0]?.id ? 
    weekendEmployees[1]?.name : weekendEmployees[0]?.name;
  const nextSunday = rotationState?.lastSundayEmployeeId === weekendEmployees[0]?.id ? 
    weekendEmployees[1]?.name : weekendEmployees[0]?.name;

  const upcomingHolidays = getFutureHolidays(holidays).slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center">
              <CalendarCheck className="mr-3" />
              Sistema de Escala de Suporte
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm">
                {formatMonthYear()}
              </span>
              {/* View Mode Toggle */}
              <div className="flex bg-white/20 rounded-lg p-1">
                <Button
                  variant={viewMode === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('day')}
                  className={viewMode === 'day' ? 'bg-white text-primary' : 'text-white hover:bg-white/20'}
                >
                  <Calendar className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className={viewMode === 'week' ? 'bg-white text-primary' : 'text-white hover:bg-white/20'}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className={viewMode === 'month' ? 'bg-white text-primary' : 'text-white hover:bg-white/20'}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <Sidebar 
            activeEmployees={employees.length}
            weekendShifts={weekendEmployees.length}
            holidaysThisMonth={holidays.length}
            onAddEmployee={() => setIsEmployeeModalOpen(true)}
          />

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Calendar Schedule */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Escala {viewMode === 'month' ? 'Mensal' : viewMode === 'week' ? 'Semanal' : 'Diária'}
                  </h2>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSaveSchedule}
                      className="bg-primary hover:bg-primary/90"
                      disabled={saveScheduleMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Escala
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <CalendarView
                  schedule={currentSchedule}
                  employees={employees}
                  holidays={holidays}
                  isLoading={scheduleLoading || employeesLoading}
                  viewMode={viewMode}
                  onDayClick={handleDayClick}
                />
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* Upcoming Holidays */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Próximos Feriados</h3>
                  <i className="fas fa-umbrella-beach text-orange-500 text-xl"></i>
                </div>
                <div className="space-y-3">
                  {upcomingHolidays.map((holiday: any) => (
                    <div key={holiday.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">{holiday.name}</span>
                      <span className="text-sm font-medium text-red-600">{holiday.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekend Rotation */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Revezamento</h3>
                  <i className="fas fa-sync-alt text-blue-600 text-xl"></i>
                </div>
                <div className="space-y-3">
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Próximo Sábado</div>
                    <div className="font-medium text-gray-900">{nextSaturday}</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Próximo Domingo</div>
                    <div className="font-medium text-gray-900">{nextSunday}</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Ações Rápidas</h3>
                  <i className="fas fa-bolt text-orange-500 text-xl"></i>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={() => setIsEmployeeModalOpen(true)}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Funcionário
                  </Button>
                  <Button
                    className="w-full border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Feriado
                  </Button>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Exportar Escala
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
      />

      <DayEditModal
        isOpen={isDayEditModalOpen}
        onClose={handleCloseModal}
        date={selectedDate}
        schedule={currentSchedule}
        employees={employees}
        holidays={holidays}
      />
    </div>
  );
}
