"use client";

import TaskCard from "@/components/kanban/TaskCard";
import { Task, TaskStatus } from "@/types";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CheckCircle2, ClipboardList, Loader2 } from "lucide-react";

type ColumnProps = {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onMoveTaskStatus?: (taskId: string, direction: "left" | "right") => void;
  highlightTaskId?: string | null;
  onCreateTask?: (status: TaskStatus) => void;
  showGodMode: boolean;
  godModeEditable?: boolean;
  onSaveNotes?: (
    taskId: string,
    nota: number | undefined,
    observaciones: string
  ) => void;
};

export default function Column({
  title,
  status,
  tasks,
  onEditTask,
  onDeleteTask,
  onMoveTaskStatus,
  highlightTaskId,
  onCreateTask,
  showGodMode,
  godModeEditable = false,
  onSaveNotes,
}: ColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  const HeaderIcon =
    status === "todo" ? ClipboardList : status === "doing" ? Loader2 : CheckCircle2;

  return (
    <section ref={setNodeRef} className="flex h-[520px] flex-col">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          <HeaderIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <span>{title}</span>
          <span className="text-slate-400 dark:text-slate-500">
            ({tasks.length})
          </span>
        </div>
        <div
          className={`h-0.5 w-full rounded-full ${
            status === "todo"
              ? "bg-rose-500"
              : status === "doing"
              ? "bg-sky-500"
              : "bg-emerald-500"
          }`}
        />
      </header>
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="mt-4 flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
          {tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
              No hay tareas aquí todavía.
            </div>
          ) : null}
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onMoveStatus={onMoveTaskStatus}
              highlightMove={highlightTaskId === task.id}
              showGodMode={showGodMode}
              godModeEditable={godModeEditable}
              onSaveNotes={onSaveNotes}
            />
          ))}
          <button
            type="button"
            onClick={() => onCreateTask?.(status)}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-xs font-semibold text-emerald-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-emerald-300"
          >
            + Añadir tarea
          </button>
        </div>
      </SortableContext>
    </section>
  );
}
