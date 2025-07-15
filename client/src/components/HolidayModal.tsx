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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const holidayFormSchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(['national', 'recife']),
  active: z.boolean().default(true),
});

type HolidayFormData = z.infer<typeof holidayFormSchema>;

interface HolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  holiday?: any;
}

export default function HolidayModal({ isOpen, onClose, holiday }: HolidayModalProps) {
  const { toast } = useToast();

  const form = useForm<HolidayFormData>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: {
      date: "",
      name: "",
      type: "national",
      active: true,
    },
  });

  // Reset form when holiday changes
  useEffect(() => {
    if (holiday) {
      form.reset({
        date: holiday.date,
        name: holiday.name,
        type: holiday.type,
        active: holiday.active,
      });
    } else {
      form.reset({
        date: "",
        name: "",
        type: "national",
        active: true,
      });
    }
  }, [holiday, form]);

  const createHolidayMutation = useMutation({
    mutationFn: async (data: HolidayFormData) => {
      const response = await apiRequest("POST", "/api/holidays", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      toast({
        title: "Sucesso!",
        description: "Feriado criado com sucesso.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro!",
        description: "Erro ao criar feriado.",
        variant: "destructive",
      });
    },
  });

  const updateHolidayMutation = useMutation({
    mutationFn: async (data: HolidayFormData) => {
      const response = await apiRequest("PUT", `/api/holidays/${holiday.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      toast({
        title: "Sucesso!",
        description: "Feriado atualizado com sucesso.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro!",
        description: "Erro ao atualizar feriado.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: HolidayFormData) => {
    if (holiday) {
      updateHolidayMutation.mutate(data);
    } else {
      createHolidayMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {holiday ? 'Editar Feriado' : 'Novo Feriado'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data (MM-DD)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ex: 01-01, 24-06" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Feriado</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ex: Confraternização Universal" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="national">Nacional</SelectItem>
                      <SelectItem value="recife">Recife</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createHolidayMutation.isPending || updateHolidayMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {holiday ? 'Atualizar' : 'Salvar'} Feriado
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
