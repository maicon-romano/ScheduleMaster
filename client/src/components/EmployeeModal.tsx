import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, User } from "lucide-react";

const employeeFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  workDays: z.array(z.string()).min(1, "Selecione pelo menos um dia"),
  shiftStart: z.string().min(1, "Hora de início é obrigatória"),
  shiftEnd: z.string().min(1, "Hora de fim é obrigatória"),
  weekendRotation: z.boolean(),
  active: z.boolean().default(true),
  useCustomSchedule: z.boolean().default(false),
  customSchedule: z.record(z.string(), z.object({
    start: z.string(),
    end: z.string(),
  })).optional(),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: any;
}

export default function EmployeeModal({ isOpen, onClose, employee }: EmployeeModalProps) {
  const { toast } = useToast();
  const [useCustomSchedule, setUseCustomSchedule] = useState(false);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: "",
      workDays: [],
      shiftStart: "08:00",
      shiftEnd: "18:00",
      weekendRotation: false,
      active: true,
      useCustomSchedule: false,
      customSchedule: {},
    },
  });

  // Reset form when employee changes
  useEffect(() => {
    if (employee) {
      const hasCustomSchedule = employee.customSchedule && Object.keys(employee.customSchedule).length > 0;
      setUseCustomSchedule(hasCustomSchedule);
      form.reset({
        name: employee.name,
        workDays: employee.workDays,
        shiftStart: employee.shiftStart,
        shiftEnd: employee.shiftEnd,
        weekendRotation: employee.weekendRotation,
        active: employee.active,
        useCustomSchedule: hasCustomSchedule,
        customSchedule: employee.customSchedule || {},
      });
    } else {
      setUseCustomSchedule(false);
      form.reset({
        name: "",
        workDays: [],
        shiftStart: "08:00",
        shiftEnd: "18:00",
        weekendRotation: false,
        active: true,
        useCustomSchedule: false,
        customSchedule: {},
      });
    }
  }, [employee, form]);

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const response = await apiRequest("POST", "/api/employees", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Sucesso!",
        description: "Funcionário criado com sucesso.",
      });
      onClose();
    },
    onError: (error) => {
      console.error('Error creating employee:', error);
      toast({
        title: "Erro!",
        description: `Erro ao criar funcionário: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const response = await apiRequest("PUT", `/api/employees/${employee.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Sucesso!",
        description: "Funcionário atualizado com sucesso.",
      });
      onClose();
    },
    onError: (error) => {
      console.error('Error updating employee:', error);
      toast({
        title: "Erro!",
        description: `Erro ao atualizar funcionário: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    // Clean the data before sending
    const cleanData = {
      ...data,
      // Remove useCustomSchedule field that's not in the backend schema
      useCustomSchedule: undefined,
      // Only include customSchedule if it's being used and has data
      customSchedule: data.useCustomSchedule && data.customSchedule 
        ? Object.fromEntries(
            Object.entries(data.customSchedule).filter(([_, value]) => 
              value && value.start && value.end
            )
          )
        : undefined
    };

    // Remove undefined fields
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });

    console.log('Sending employee data:', cleanData);

    if (employee) {
      updateEmployeeMutation.mutate(cleanData);
    } else {
      createEmployeeMutation.mutate(cleanData);
    }
  };

  const workDaysOptions = [
    { id: 'monday', label: 'Segunda' },
    { id: 'tuesday', label: 'Terça' },
    { id: 'wednesday', label: 'Quarta' },
    { id: 'thursday', label: 'Quinta' },
    { id: 'friday', label: 'Sexta' },
    { id: 'saturday', label: 'Sábado' },
    { id: 'sunday', label: 'Domingo' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Digite o nome do funcionário" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dias de Trabalho</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {workDaysOptions.map((day) => (
                      <FormControl key={day.id}>
                        <label className="flex items-center space-x-2">
                          <Checkbox
                            checked={field.value?.includes(day.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, day.id]);
                              } else {
                                field.onChange(
                                  field.value?.filter((value) => value !== day.id)
                                );
                              }
                            }}
                          />
                          <span className="text-sm">{day.label}</span>
                        </label>
                      </FormControl>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Schedule Type Selection */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="useCustomSchedule"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={useCustomSchedule}
                        onCheckedChange={(checked) => {
                          setUseCustomSchedule(!!checked);
                          field.onChange(checked);
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Usar horários diferentes por dia da semana
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              {!useCustomSchedule ? (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="shiftStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora Início</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shiftEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora Fim</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <FormLabel className="text-sm font-medium">Horários por Dia da Semana</FormLabel>
                  <div className="grid gap-3">
                    {workDaysOptions.map((day) => {
                      const selectedWorkDays = form.watch("workDays") || [];
                      const isWorkDay = selectedWorkDays.includes(day.id);
                      
                      if (!isWorkDay) return null;
                      
                      return (
                        <div key={day.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">{day.label}</span>
                          </div>
                          <div className="flex gap-2 flex-1">
                            <FormField
                              control={form.control}
                              name={`customSchedule.${day.id}.start`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input 
                                      type="time" 
                                      placeholder="Início"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(e.target.value);
                                        // Update the form's customSchedule object
                                        const currentSchedule = form.getValues('customSchedule') || {};
                                        const daySchedule = currentSchedule[day.id] || {};
                                        form.setValue('customSchedule', {
                                          ...currentSchedule,
                                          [day.id]: {
                                            ...daySchedule,
                                            start: e.target.value
                                          }
                                        });
                                      }}
                                      value={field.value || form.getValues('shiftStart') || "08:00"}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <span className="text-gray-500 self-center">até</span>
                            <FormField
                              control={form.control}
                              name={`customSchedule.${day.id}.end`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input 
                                      type="time" 
                                      placeholder="Fim"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(e.target.value);
                                        // Update the form's customSchedule object
                                        const currentSchedule = form.getValues('customSchedule') || {};
                                        const daySchedule = currentSchedule[day.id] || {};
                                        form.setValue('customSchedule', {
                                          ...currentSchedule,
                                          [day.id]: {
                                            ...daySchedule,
                                            end: e.target.value
                                          }
                                        });
                                      }}
                                      value={field.value || form.getValues('shiftEnd') || "18:00"}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="weekendRotation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Participa do revezamento de fim de semana
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {employee ? 'Atualizar' : 'Salvar'} Funcionário
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
