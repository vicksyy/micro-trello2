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
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import TaskCardPreview from "@/components/kanban/TaskCardPreview";
import { filterTasks } from "@/lib/query";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useHotkeys } from "react-hotkeys-hook";

const columnMeta: Array<{ title: string; status: TaskStatus }> = [
  { title: "To Do", status: "todo" },
  { title: "Doing", status: "doing" },
  { title: "Done", status: "done" },
];

type BoardProps = {
  state: BoardState;
  setState: React.Dispatch<React.SetStateAction<BoardState>>;
  godModeEnabled: boolean;
  godModeEditable?: boolean;
};

export default function Board({
  state,
  setState,
  godModeEnabled,
  godModeEditable = false,
}: BoardProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("todo");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [overlaySize, setOverlaySize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [flashTaskId, setFlashTaskId] = useState<string | null>(null);
  const flashTimer = useRef<number | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (!state) return;
    writeState(state);
  }, [state]);

  const compareByDueDate = (a: Task, b: Task) => {
    const aDate = a.fechaLimite ? new Date(a.fechaLimite) : null;
    const bDate = b.fechaLimite ? new Date(b.fechaLimite) : null;
    if (aDate && bDate) {
      const diff = aDate.getTime() - bDate.getTime();
      if (diff !== 0) return diff;
    } else if (aDate && !bDate) {
      return -1;
    } else if (!aDate && bDate) {
      return 1;
    }
    return (a.orden ?? 0) - (b.orden ?? 0);
  };

  const tasksByStatus = useMemo(() => {
    const base = {
      todo: [],
      doing: [],
      done: [],
    } as Record<TaskStatus, BoardState["tasks"]>;
    if (!state) return base;
    const filtered = query ? filterTasks(state.tasks, query) : state.tasks;
    const grouped = filtered.reduce((acc, task) => {
      acc[task.estado].push(task);
      return acc;
    }, base);
    (Object.keys(grouped) as TaskStatus[]).forEach((status) => {
      grouped[status].sort(compareByDueDate);
    });
    return grouped;
  }, [state, query]);


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
      rubricaScore:
        values.rubricaScore === undefined ? undefined : values.rubricaScore,
      rubricaComentario: values.rubricaComentario?.trim() || undefined,
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

  const handleCreateFromColumn = (status: TaskStatus) => {
    setCreateStatus(status);
    setCreateOpen(true);
  };

  useHotkeys(
    "n",
    (event) => {
      event.preventDefault();
      setCreateStatus("todo");
      setCreateOpen(true);
    },
    { enableOnFormTags: false, enableOnContentEditable: false }
  );

  useHotkeys(
    "/",
    (event) => {
      event.preventDefault();
      searchRef.current?.focus();
    },
    { enableOnFormTags: false, enableOnContentEditable: false }
  );

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
      rubricaScore:
        values.rubricaScore === undefined ? undefined : values.rubricaScore,
      rubricaComentario: values.rubricaComentario?.trim() || undefined,
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

  const handleSaveNotes = (
    taskId: string,
    nota: number | undefined,
    observaciones: string
  ) => {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return;
    const updatedTask: Task = {
      ...task,
      rubricaScore: typeof nota === "number" ? nota : undefined,
      rubricaComentario: observaciones ? observaciones : undefined,
    };
    const auditEvent: AuditEvent = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      accion: "UPDATE",
      taskId,
      diff: {
        before: {
          rubricaScore: task.rubricaScore,
          rubricaComentario: task.rubricaComentario,
        },
        after: {
          rubricaScore: updatedTask.rubricaScore,
          rubricaComentario: updatedTask.rubricaComentario,
        },
      },
      userLabel: "Alumno/a",
    };
    setState({
      ...state,
      tasks: state.tasks.map((item) =>
        item.id === taskId ? updatedTask : item
      ),
      auditLog: [auditEvent, ...state.auditLog],
    });
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
    const targetTasks = tasksByStatus[nextStatus].map((task) => task.id);
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

  const moveTaskByKeyboard = (taskId: string, direction: "left" | "right") => {
    if (!state) return;
    const current = state.tasks.find((task) => task.id === taskId);
    if (!current) return;
    const order = ["todo", "doing", "done"] as const;
    const currentIndex = order.indexOf(current.estado);
    const nextIndex =
      direction === "left" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= order.length) return;
    const nextStatus = order[nextIndex];
    const sourceTasks = tasksByStatus[current.estado]
      .filter((task) => task.id !== taskId)
      .map((task) => task.id);
    const targetTasks = [...tasksByStatus[nextStatus].map((task) => task.id), taskId];
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
        before: { estado: current.estado },
        after: { estado: updatedTask.estado },
      },
      userLabel: "Alumno/a",
    };
    setState({
      ...state,
      tasks: withTargetOrder,
      auditLog: [auditEvent, ...state.auditLog],
    });
    setFlashTaskId(taskId);
    if (flashTimer.current) {
      window.clearTimeout(flashTimer.current);
    }
    flashTimer.current = window.setTimeout(() => {
      setFlashTaskId((currentId) => (currentId === taskId ? null : currentId));
    }, 700);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id));
    const rect = event.active.rect?.current?.initial;
    if (rect) {
      setOverlaySize({ width: rect.width, height: rect.height });
    }
  };

  const handleDragCancel = () => {
    setActiveTaskId(null);
    setOverlaySize(null);
  };

  return (
    <motion.div
      className="space-y-6"
      layout
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <motion.div className="flex flex-wrap items-center gap-3" layout>
        <Input
          className="w-64 border-slate-300 bg-white shadow-sm placeholder:text-slate-400 focus-visible:ring-[#0f1f3d]/30 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500"
          placeholder="Buscar y filtrar..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Buscar tareas"
          ref={searchRef}
        />
        <Button
          onClick={() => {
            setCreateStatus("todo");
            setCreateOpen(true);
          }}
          className="bg-[#0f1f3d] text-white transition-colors duration-300 hover:bg-[#0c1931] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          <Plus />
          Nueva tarea
        </Button>
      </motion.div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <motion.div className="grid gap-6 lg:grid-cols-3" layout>
          {columnMeta.map((column) => (
            <Column
              key={column.status}
              title={column.title}
              status={column.status}
              tasks={tasksByStatus[column.status]}
              onEditTask={setEditTask}
              onDeleteTask={setDeleteTask}
              onMoveTaskStatus={moveTaskByKeyboard}
              onCreateTask={handleCreateFromColumn}
              showGodMode={godModeEnabled}
              godModeEditable={godModeEditable}
              onSaveNotes={handleSaveNotes}
              highlightTaskId={flashTaskId}
            />
          ))}
        </motion.div>
        <DragOverlay>
          {activeTaskId && state ? (
            <TaskCardPreview
              task={state.tasks.find((task) => task.id === activeTaskId) ?? null}
              width={overlaySize?.width}
              height={overlaySize?.height}
              showGodMode={godModeEnabled}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      <TaskFormDialog
        open={createOpen}
        title="Nueva tarea"
        description="Completa la información principal."
        initialTask={{
          id: "",
          titulo: "",
          prioridad: "medium",
          tags: [],
          estimacionMin: 30,
          fechaCreacion: "",
          estado: createStatus,
          orden: 1,
        }}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        godModeEnabled={godModeEnabled}
      />
      <TaskFormDialog
        open={Boolean(editTask)}
        title="Editar tarea"
        description="Actualiza los datos necesarios."
        initialTask={editTask ?? undefined}
        onClose={() => setEditTask(null)}
        onSubmit={handleEdit}
        godModeEnabled={godModeEnabled}
      />
      <AlertDialog open={Boolean(deleteTask)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar tarea</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
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
    </motion.div>
  );
}
