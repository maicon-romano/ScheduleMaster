import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Edit, Trash2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import EmployeeModal from "@/components/EmployeeModal";
import { apiRequest } from "@/lib/queryClient";

export default function EmployeesPage() {
  const { toast } = useToast();
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["/api/employees"],
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Sucesso!",
        description: "Funcionário removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro!",
        description: "Erro ao remover funcionário.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
    setIsEmployeeModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este funcionário?")) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsEmployeeModalOpen(false);
    setEditingEmployee(null);
  };

  const weekendEmployees = employees.filter((emp: any) => emp.weekendRotation);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center">
              <Users className="mr-3" />
              Gerenciar Funcionários
            </h1>
            <Button
              onClick={() => setIsEmployeeModalOpen(true)}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Funcionário
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Sidebar 
            activeEmployees={employees.length}
            weekendShifts={weekendEmployees.length}
            holidaysThisMonth={0}
            onAddEmployee={() => setIsEmployeeModalOpen(true)}
          />

          <main className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Lista de Funcionários</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Nome</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Dias de Trabalho</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Horário</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Fim de Semana</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          Carregando...
                        </td>
                      </tr>
                    ) : employees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          Nenhum funcionário cadastrado
                        </td>
                      </tr>
                    ) : (
                      employees.map((employee: any) => (
                        <tr key={employee.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {employee.name}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {employee.workDays.map((day: string) => {
                              const dayNames = {
                                monday: 'Seg',
                                tuesday: 'Ter',
                                wednesday: 'Qua',
                                thursday: 'Qui',
                                friday: 'Sex',
                                saturday: 'Sáb',
                                sunday: 'Dom'
                              };
                              return dayNames[day as keyof typeof dayNames];
                            }).join(', ')}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {employee.shiftStart} - {employee.shiftEnd}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              employee.weekendRotation 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {employee.weekendRotation ? 'Sim' : 'Não'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleEdit(employee)}
                                variant="outline"
                                size="sm"
                                className="border-blue-500 text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(employee.id)}
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-600 hover:bg-red-50"
                                disabled={deleteEmployeeMutation.isPending}
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

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={handleCloseModal}
        employee={editingEmployee}
      />
    </div>
  );
}
