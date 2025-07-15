import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Plus, Trash2, Clock, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isHoliday, getHolidayName } from "@/lib/dateUtils";
import { getInitials } from "@/lib/scheduleUtils";

const dayEditFormSchema = z.object({
  assignments: z.array(z.object({
    employeeId: z.number(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:MM)"),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:MM)"),
    type: z.enum(['regular', 'oncall', 'holiday']).default('regular')
  }))
});

type DayEditFormData = z.infer<typeof dayEditFormSchema>;

interface DayEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string | null;
  schedule: any;
  employees: any[];
  holidays: any[];
}

export default function DayEditModal({ 
  isOpen, 
  onClose, 
  date, 
  schedule, 
  employees, 
  holidays 
}: DayEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DayEditFormData>({
    resolver: zodResolver(dayEditFormSchema),
    defaultValues: {
      assignments: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "assignments"
  });

  // Find the current day's entry
  const dayEntry = date ? schedule?.entries?.find((e: any) => e.date === date) : null;
  const dateObj = date ? new Date(date) : null;
  const isHolidayDay = date ? isHoliday(date, holidays) : false;
  const holidayName = date ? getHolidayName(date, holidays) : null;

  useEffect(() => {
    if (!dayEntry || !isOpen) return;

    // Load existing assignments or create from legacy fields
    const assignments = [];

    // Check if we have new-style assignments
    if (dayEntry.assignments && dayEntry.assignments.length > 0) {
      assignments.push(...dayEntry.assignments);
    } else {
      // Convert legacy fields to assignments
      if (dayEntry.morningEmployeeId) {
        assignments.push({
          employeeId: dayEntry.morningEmployeeId,
          startTime: "08:00",
          endTime: "12:00",
          type: 'regular'
        });
      }
      if (dayEntry.afternoonEmployeeId) {
        assignments.push({
          employeeId: dayEntry.afternoonEmployeeId,
          startTime: "12:00",
          endTime: "18:00",
          type: 'regular'
        });
      }
      if (dayEntry.oncallEmployeeId) {
        assignments.push({
          employeeId: dayEntry.oncallEmployeeId,
          startTime: "08:00",
          endTime: "18:00",
          type: 'oncall'
        });
      }
    }

    form.reset({ assignments });
  }, [dayEntry, form, isOpen]);

  const updateDayMutation = useMutation({
    mutationFn: async (data: DayEditFormData) => {
      if (!dayEntry) throw new Error("Day entry not found");
      
      const updatedEntry = {
        ...dayEntry,
        assignments: data.assignments,
        // Update legacy fields for backward compatibility
        morningEmployeeId: data.assignments.find(a => a.startTime === "08:00" && a.endTime === "12:00")?.employeeId || null,
        afternoonEmployeeId: data.assignments.find(a => a.startTime === "12:00" && a.endTime === "18:00")?.employeeId || null,
        oncallEmployeeId: data.assignments.find(a => a.type === "oncall")?.employeeId || null,
      };

      const response = await apiRequest("PUT", `/api/monthly-schedules/${schedule.id}/entries/${dayEntry.id}`, updatedEntry);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-schedules"] });
      toast({
        title: "Sucesso!",
        description: "Escalação atualizada com sucesso.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro!",
        description: "Erro ao atualizar escalação.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DayEditFormData) => {
    updateDayMutation.mutate(data);
  };

  const addAssignment = () => {
    append({
      employeeId: 0,
      startTime: "08:00",
      endTime: "18:00",
      type: 'regular'
    });
  };

  const getEmployeeName = (id: number) => {
    const employee = employees.find(emp => emp.id === id);
    return employee ? employee.name : 'Funcionário não encontrado';
  };

  const getAvailableEmployees = () => {
    return employees.filter(emp => emp.active);
  };

  const getWorkHours = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diff > 0 ? `${diff}h` : 'Inválido';
  };

  if (!date || !dateObj) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Editar Escalação - {dateObj.toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </DialogTitle>
          {isHolidayDay && holidayName && (
            <Badge className="bg-primary text-primary-foreground w-fit mt-2">
              Feriado: {holidayName}
            </Badge>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Funcionários Escalados</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAssignment}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>

              {fields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum funcionário escalado</p>
                  <p className="text-sm">Clique em "Adicionar" para escalar alguém</p>
                </div>
              )}

              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Escalação #{index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`assignments.${index}.employeeId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Funcionário</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar funcionário" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getAvailableEmployees().map((employee) => (
                                <SelectItem key={employee.id} value={employee.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                                      {getInitials(employee.name)}
                                    </div>
                                    {employee.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`assignments.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="regular">Regular</SelectItem>
                              <SelectItem value="oncall">Plantão</SelectItem>
                              <SelectItem value="holiday">Feriado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`assignments.${index}.startTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora Início</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="time" 
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`assignments.${index}.endTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora Fim</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="time" 
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 bg-white rounded px-3 py-2">
                    <span>Carga horária:</span>
                    <Badge variant="outline">
                      {getWorkHours(
                        form.watch(`assignments.${index}.startTime`),
                        form.watch(`assignments.${index}.endTime`)
                      )}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={updateDayMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {updateDayMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}