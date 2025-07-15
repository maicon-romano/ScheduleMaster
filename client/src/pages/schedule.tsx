import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck, Plus, Save, Edit } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ScheduleTable from "@/components/ScheduleTable";
import EmployeeModal from "@/components/EmployeeModal";
import { getCurrentWeekStart, formatDateRange } from "@/lib/dateUtils";
import { apiRequest } from "@/lib/queryClient";

export default function SchedulePage() {
  const { toast } = useToast();
  const [currentWeekStart, setCurrentWeekStart] = useState(getCurrentWeekStart());
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/employees"],
  });

  const { data: currentSchedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ["/api/schedules/week", currentWeekStart],
  });

  const { data: holidays = [] } = useQuery({
    queryKey: ["/api/holidays"],
  });

  const { data: rotationState } = useQuery({
    queryKey: ["/api/rotation-state"],
  });

  const generateScheduleMutation = useMutation({
    mutationFn: async (weekStart: string) => {
      const response = await apiRequest("POST", "/api/schedules/generate", { weekStart });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({
        title: "Sucesso!",
        description: "Nova escala gerada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro!",
        description: "Erro ao gerar nova escala.",
        variant: "destructive",
      });
    },
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async (schedule: any) => {
      const response = await apiRequest("PUT", `/api/schedules/${schedule.id}`, schedule);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
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

  const handleGenerateNewWeek = () => {
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStart = nextWeek.toISOString().split('T')[0];
    setCurrentWeekStart(nextWeekStart);
    generateScheduleMutation.mutate(nextWeekStart);
  };

  const handleSaveSchedule = () => {
    if (currentSchedule) {
      saveScheduleMutation.mutate(currentSchedule);
    }
  };

  const weekendEmployees = employees.filter((emp: any) => emp.weekendRotation);
  const nextSaturday = rotationState?.lastSaturdayEmployeeId === weekendEmployees[0]?.id ? 
    weekendEmployees[1]?.name : weekendEmployees[0]?.name;
  const nextSunday = rotationState?.lastSundayEmployeeId === weekendEmployees[0]?.id ? 
    weekendEmployees[1]?.name : weekendEmployees[0]?.name;

  const upcomingHolidays = holidays.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center">
              <CalendarCheck className="mr-3" />
              Sistema de Escala de Suporte
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm">
                Semana de {formatDateRange(currentWeekStart)}
              </span>
              <Button
                onClick={handleGenerateNewWeek}
                className="bg-white text-blue-600 hover:bg-gray-100"
                disabled={generateScheduleMutation.isPending}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Semana
              </Button>
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
            {/* Weekly Schedule */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Escala Semanal</h2>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSaveSchedule}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={saveScheduleMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Escala
                    </Button>
                    <Button
                      onClick={() => setIsEditMode(!isEditMode)}
                      variant="outline"
                      className="border-gray-500 text-gray-600 hover:bg-gray-50"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                </div>
              </div>

              <ScheduleTable
                schedule={currentSchedule}
                employees={employees}
                holidays={holidays}
                isLoading={scheduleLoading || employeesLoading}
                isEditMode={isEditMode}
              />
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
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Funcionário
                  </Button>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Feriado
                  </Button>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <i className="fas fa-download mr-2"></i>
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
    </div>
  );
}
