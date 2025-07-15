import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, Edit, Trash2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import HolidayModal from "@/components/HolidayModal";
import { apiRequest } from "@/lib/queryClient";

export default function HolidaysPage() {
  const { toast } = useToast();
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ["/api/holidays"],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/holidays/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      toast({
        title: "Sucesso!",
        description: "Feriado removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro!",
        description: "Erro ao remover feriado.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (holiday: any) => {
    setEditingHoliday(holiday);
    setIsHolidayModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este feriado?")) {
      deleteHolidayMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsHolidayModalOpen(false);
    setEditingHoliday(null);
  };

  const weekendEmployees = employees.filter((emp: any) => emp.weekendRotation);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center">
              <Calendar className="mr-3" />
              Gerenciar Feriados
            </h1>
            <Button
              onClick={() => setIsHolidayModalOpen(true)}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Feriado
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Sidebar 
            activeEmployees={employees.length}
            weekendShifts={weekendEmployees.length}
            holidaysThisMonth={holidays.length}
            onAddEmployee={() => {}}
          />

          <main className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Lista de Feriados</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Data</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Nome</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Tipo</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                          Carregando...
                        </td>
                      </tr>
                    ) : holidays.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                          Nenhum feriado cadastrado
                        </td>
                      </tr>
                    ) : (
                      holidays.map((holiday: any) => (
                        <tr key={holiday.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {holiday.date}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {holiday.name}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              holiday.type === 'national' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {holiday.type === 'national' ? 'Nacional' : 'Recife'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleEdit(holiday)}
                                variant="outline"
                                size="sm"
                                className="border-blue-500 text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(holiday.id)}
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-600 hover:bg-red-50"
                                disabled={deleteHolidayMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>

      <HolidayModal
        isOpen={isHolidayModalOpen}
        onClose={handleCloseModal}
        holiday={editingHoliday}
      />
    </div>
  );
}
