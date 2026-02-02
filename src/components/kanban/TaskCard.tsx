"use client";

import { Task } from "@/types";

type TaskCardProps = {
  task: Task;
};

const priorityStyles: Record<Task["prioridad"], string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  high: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{task.titulo}</h3>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${priorityStyles[task.prioridad]}`}
        >
          {task.prioridad}
        </span>
      </div>
      {task.descripcion ? (
        <p className="mt-2 text-sm text-slate-600">{task.descripcion}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {task.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
          >
            #{tag}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{task.estimacionMin} min</span>
        {task.fechaLimite ? (
          <span>Limite: {new Date(task.fechaLimite).toLocaleDateString()}</span>
        ) : (
          <span>Sin limite</span>
        )}
      </div>
    </article>
  );
}
