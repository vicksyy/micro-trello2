"use client";

import TaskCard from "@/components/kanban/TaskCard";
import { Task, TaskStatus } from "@/types";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

type ColumnProps = {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
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
  showGodMode,
  godModeEditable = false,
  onSaveNotes,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <section
      ref={setNodeRef}
      className={`flex h-[480px] flex-col rounded-2xl border p-4 shadow-sm ${
        isOver
          ? "border-slate-400 bg-slate-100 dark:border-slate-500 dark:bg-slate-800"
          : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
      }`}
    >
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-100">
          {title}
        </h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-200">
          {tasks.length}
        </span>
      </header>
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
              No hay tareas aqui todavia.
            </div>
          ) : null}
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              showGodMode={showGodMode}
              godModeEditable={godModeEditable}
              onSaveNotes={onSaveNotes}
            />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}
