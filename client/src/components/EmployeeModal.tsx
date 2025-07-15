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

const employeeFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  workDays: z.array(z.string()).min(1, "Selecione pelo menos um dia"),
  shiftStart: z.string().min(1, "Hora de início é obrigatória"),
  shiftEnd: z.string().min(1, "Hora de fim é obrigatória"),
  weekendRotation: z.boolean(),
  active: z.boolean().default(true),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: any;
}

export default function EmployeeModal({ isOpen, onClose, employee }: EmployeeModalProps) {
  const { toast } = useToast();

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: "",
      workDays: [],
      shiftStart: "08:00",
      shiftEnd: "18:00",
      weekendRotation: false,
      active: true,
    },
  });

  // Reset form when employee changes
  useEffect(() => {
    if (employee) {
      form.reset({
        name: employee.name,
        workDays: employee.workDays,
        shiftStart: employee.shiftStart,
        shiftEnd: employee.shiftEnd,
        weekendRotation: employee.weekendRotation,
        active: employee.active,
      });
    } else {
      form.reset({
        name: "",
        workDays: [],
        shiftStart: "08:00",
        shiftEnd: "18:00",
        weekendRotation: false,
        active: true,
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
    onError: () => {
      toast({
        title: "Erro!",
        description: "Erro ao criar funcionário.",
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
    onError: () => {
      toast({
        title: "Erro!",
        description: "Erro ao atualizar funcionário.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    if (employee) {
      updateEmployeeMutation.mutate(data);
    } else {
      createEmployeeMutation.mutate(data);
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
      <DialogContent className="max-w-md">
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
                className="bg-blue-600 hover:bg-blue-700"
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
