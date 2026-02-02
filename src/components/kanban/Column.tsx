"use client";

import TaskCard from "@/components/kanban/TaskCard";
import { Task, TaskStatus } from "@/types";

type ColumnProps = {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
};

export default function Column({
  title,
  tasks,
  onEditTask,
  onDeleteTask,
}: ColumnProps) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          {title}
        </h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
          {tasks.length}
        </span>
      </header>
      <div className="mt-4 flex flex-1 flex-col gap-3">
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-500">
            No hay tareas aqui todavia.
          </div>
        ) : null}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
          />
        ))}
      </div>
    </section>
  );
}
