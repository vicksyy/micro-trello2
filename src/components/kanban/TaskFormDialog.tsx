"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Task, TaskPriority, TaskStatus } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const taskFormSchema = z.object({
  titulo: z.string().min(3, "Minimo 3 caracteres"),
  descripcion: z.string().optional(),
  prioridad: z.enum(["low", "medium", "high"]),
  tags: z.string().optional(),
  estimacionMin: z.coerce.number().int().min(1, "Minimo 1 minuto"),
  fechaLimite: z.string().optional(),
  estado: z.enum(["todo", "doing", "done"]),
  rubricaScore: z.coerce.number().min(0).max(10).optional(),
  rubricaComentario: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

type TaskFormDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  initialTask?: Task;
  godModeEnabled: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
};

const defaultValues: TaskFormValues = {
  titulo: "",
  descripcion: "",
  prioridad: "medium",
  tags: "",
  estimacionMin: 30,
  fechaLimite: "",
  estado: "todo",
  rubricaScore: undefined,
  rubricaComentario: "",
};

export default function TaskFormDialog({
  open,
  title,
  description,
  initialTask,
  godModeEnabled,
  onClose,
  onSubmit,
}: TaskFormDialogProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) return;
    if (!initialTask) {
      form.reset(defaultValues);
      return;
    }
    form.reset({
      titulo: initialTask.titulo,
      descripcion: initialTask.descripcion ?? "",
      prioridad: initialTask.prioridad as TaskPriority,
      tags: initialTask.tags.join(", "),
      estimacionMin: initialTask.estimacionMin,
      fechaLimite: initialTask.fechaLimite ?? "",
      estado: initialTask.estado as TaskStatus,
      rubricaScore: initialTask.rubricaScore ?? undefined,
      rubricaComentario: initialTask.rubricaComentario ?? "",
    });
  }, [open, initialTask, form]);

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titulo</FormLabel>
                  <FormControl>
                    <Input placeholder="Titulo de la tarea" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripcion</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas opcionales"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="prioridad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona prioridad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todo">Todo</SelectItem>
                        <SelectItem value="doing">Doing</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimacionMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimacion (min)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fechaLimite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha limite</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ej: riesgo, macro, reporte"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Separados por coma.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {godModeEnabled ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="rubricaScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rubrica (0-10)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={10} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rubricaComentario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comentario de Javi</FormLabel>
                      <FormControl>
                        <Input placeholder="Observaciones rapidas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
