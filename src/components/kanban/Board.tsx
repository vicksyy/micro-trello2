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
import { writeState } from "@/lib/storage";
import { AuditEvent, BoardState, Task, TaskStatus } from "@/types";
import {
  DndContext,
  DragCancelEvent,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useMemo, useState } from "react";
import TaskCardPreview from "@/components/kanban/TaskCardPreview";

const columnMeta: Array<{ title: string; status: TaskStatus }> = [
  { title: "Todo", status: "todo" },
  { title: "Doing", status: "doing" },
  { title: "Done", status: "done" },
];

type BoardProps = {
  state: BoardState;
  setState: React.Dispatch<React.SetStateAction<BoardState>>;
};

export default function Board({ state, setState }: BoardProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [overlaySize, setOverlaySize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

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
    const grouped = state.tasks.reduce((acc, task) => {
      acc[task.estado].push(task);
      return acc;
    }, base);
    (Object.keys(grouped) as TaskStatus[]).forEach((status) => {
      grouped[status].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    });
    return grouped;
  }, [state]);

  const getNextOrder = (status: TaskStatus) => {
    if (!state) return 1;
    const items = state.tasks.filter((task) => task.estado === status);
    if (items.length === 0) return 1;
    return Math.max(...items.map((task) => task.orden ?? 0)) + 1;
  };

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
      orden: getNextOrder(values.estado),
    };
    const auditEvent: AuditEvent = {
      id: uuidv4(),
      timestamp: now,
      accion: "CREATE",
      taskId: nextTask.id,
      diff: {
        after: nextTask,
      },
      userLabel: "Alumno/a",
    };
    setState({
      ...state,
      tasks: [nextTask, ...state.tasks],
      auditLog: [auditEvent, ...state.auditLog],
    });
    setCreateOpen(false);
  };

  const handleEdit = (values: TaskFormValues) => {
    if (!state || !editTask) return;
    const now = new Date().toISOString();
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
    const auditEvent: AuditEvent = {
      id: uuidv4(),
      timestamp: now,
      accion: "UPDATE",
      taskId: editTask.id,
      diff: {
        before: editTask,
        after: updated,
      },
      userLabel: "Alumno/a",
    };
    setState({
      ...state,
      tasks: state.tasks.map((task) =>
        task.id === editTask.id ? updated : task
      ),
      auditLog: [auditEvent, ...state.auditLog],
    });
    setEditTask(null);
  };

  const confirmDelete = () => {
    if (!state || !deleteTask) return;
    const auditEvent: AuditEvent = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      accion: "DELETE",
      taskId: deleteTask.id,
      diff: {
        before: deleteTask,
      },
      userLabel: "Alumno/a",
    };
    setState({
      ...state,
      tasks: state.tasks.filter((task) => task.id !== deleteTask.id),
      auditLog: [auditEvent, ...state.auditLog],
    });
    setDeleteTask(null);
  };

  const applyOrder = (tasks: Task[], orderedIds: string[]) => {
    const orderMap = new Map(
      orderedIds.map((id, index) => [id, index + 1])
    );
    return tasks.map((task) =>
      orderMap.has(task.id) ? { ...task, orden: orderMap.get(task.id)! } : task
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null);
    setOverlaySize(null);
    if (!state) return;
    const { active, over } = event;
    if (!over) return;
    const taskId = String(active.id);
    const activeTask = state.tasks.find((task) => task.id === taskId);
    if (!activeTask) return;
    const overId = String(over.id);
    const overTask = state.tasks.find((task) => task.id === overId);
    const nextStatus = overTask ? overTask.estado : (overId as TaskStatus);
    if (!nextStatus) return;

    if (activeTask.estado === nextStatus && overTask) {
      const columnTasks = tasksByStatus[nextStatus];
      const oldIndex = columnTasks.findIndex((task) => task.id === taskId);
      const newIndex = columnTasks.findIndex((task) => task.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const reordered = arrayMove(columnTasks, oldIndex, newIndex);
      const orderedIds = reordered.map((task) => task.id);
      setState({
        ...state,
        tasks: applyOrder(state.tasks, orderedIds),
      });
      return;
    }

    const previousTask = state.tasks.find((task) => task.id === taskId);
    if (!previousTask || previousTask.estado === nextStatus) return;
    const sourceTasks = tasksByStatus[previousTask.estado]
      .filter((task) => task.id !== taskId)
      .map((task) => task.id);
    let targetTasks = tasksByStatus[nextStatus].map((task) => task.id);
    if (overTask) {
      const overIndex = targetTasks.indexOf(overTask.id);
      if (overIndex >= 0) {
        targetTasks.splice(overIndex, 0, taskId);
      } else {
        targetTasks.push(taskId);
      }
    } else {
      targetTasks.push(taskId);
    }
    const movedTasks = state.tasks.map((task) =>
      task.id === taskId ? { ...task, estado: nextStatus } : task
    );
    const withSourceOrder = applyOrder(movedTasks, sourceTasks);
    const withTargetOrder = applyOrder(withSourceOrder, targetTasks);
    const updatedTask = withTargetOrder.find((task) => task.id === taskId);
    if (!updatedTask) return;
    const auditEvent: AuditEvent = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      accion: "MOVE",
      taskId,
      diff: {
        before: { estado: previousTask.estado },
        after: { estado: updatedTask.estado },
      },
      userLabel: "Alumno/a",
    };
    setState({
      ...state,
      tasks: withTargetOrder,
      auditLog: [auditEvent, ...state.auditLog],
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id));
    const rect = event.active.rect?.current?.initial;
    if (rect) {
      setOverlaySize({ width: rect.width, height: rect.height });
    }
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveTaskId(null);
    setOverlaySize(null);
  };

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
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
        <DragOverlay>
          {activeTaskId && state ? (
            <TaskCardPreview
              task={state.tasks.find((task) => task.id === activeTaskId) ?? null}
              width={overlaySize?.width}
              height={overlaySize?.height}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
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
