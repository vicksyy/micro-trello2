"use client";

import Column from "@/components/kanban/Column";
import TaskFormDialog, {
  TaskFormValues,
} from "@/components/kanban/TaskFormDialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getInitialState, writeState } from "@/lib/storage";
import { BoardState, Task, TaskStatus } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useMemo, useState } from "react";

const columnMeta: Array<{ title: string; status: TaskStatus }> = [
  { title: "Todo", status: "todo" },
  { title: "Doing", status: "doing" },
  { title: "Done", status: "done" },
];

export default function Board() {
  const [state, setState] = useState<BoardState | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  useEffect(() => {
    setState(getInitialState());
  }, []);

  useEffect(() => {
    if (!state) return;
    writeState(state);
  }, [state]);

  const tasksByStatus = useMemo(() => {
    const base = {
      todo: [],
      doing: [],
      done: [],
    } as Record<TaskStatus, BoardState["tasks"]>;
    if (!state) return base;
    return state.tasks.reduce((acc, task) => {
      acc[task.estado].push(task);
      return acc;
    }, base);
  }, [state]);

  const handleCreate = (values: TaskFormValues) => {
    if (!state) return;
    const now = new Date().toISOString();
    const tags = values.tags
      ? values.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];
    const nextTask: Task = {
      id: uuidv4(),
      titulo: values.titulo,
      descripcion: values.descripcion?.trim() || undefined,
      prioridad: values.prioridad,
      tags,
      estimacionMin: values.estimacionMin,
      fechaCreacion: now,
      fechaLimite: values.fechaLimite || undefined,
      estado: values.estado,
    };
    setState({
      ...state,
      tasks: [nextTask, ...state.tasks],
    });
    setCreateOpen(false);
  };

  const handleEdit = (values: TaskFormValues) => {
    if (!state || !editTask) return;
    const tags = values.tags
      ? values.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];
    const updated: Task = {
      ...editTask,
      titulo: values.titulo,
      descripcion: values.descripcion?.trim() || undefined,
      prioridad: values.prioridad,
      tags,
      estimacionMin: values.estimacionMin,
      fechaLimite: values.fechaLimite || undefined,
      estado: values.estado,
    };
    setState({
      ...state,
      tasks: state.tasks.map((task) =>
        task.id === editTask.id ? updated : task
      ),
    });
    setEditTask(null);
  };

  const confirmDelete = () => {
    if (!state || !deleteTask) return;
    setState({
      ...state,
      tasks: state.tasks.filter((task) => task.id !== deleteTask.id),
    });
    setDeleteTask(null);
  };

  if (!state) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
        Cargando tablero...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Tablero operativo
          </h2>
          <p className="text-sm text-slate-500">
            Crea, edita y organiza tareas por columna.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Nueva tarea</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {columnMeta.map((column) => (
          <Column
            key={column.status}
            title={column.title}
            status={column.status}
            tasks={tasksByStatus[column.status]}
            onEditTask={setEditTask}
            onDeleteTask={setDeleteTask}
          />
        ))}
      </div>
      <TaskFormDialog
        open={createOpen}
        title="Nueva tarea"
        description="Completa la informacion principal."
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
      <TaskFormDialog
        open={Boolean(editTask)}
        title="Editar tarea"
        description="Actualiza los datos necesarios."
        initialTask={editTask ?? undefined}
        onClose={() => setEditTask(null)}
        onSubmit={handleEdit}
      />
      <AlertDialog open={Boolean(deleteTask)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar tarea</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTask(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
