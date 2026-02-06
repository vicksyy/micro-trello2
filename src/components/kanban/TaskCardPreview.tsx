"use client";

import { Task } from "@/types";

type TaskCardPreviewProps = {
  task: Task | null;
  width?: number;
  height?: number;
  showGodMode?: boolean;
};

const priorityStyles: Record<Task["prioridad"], string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40",
  medium: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40",
  high: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-500/40",
};

export default function TaskCardPreview({
  task,
  width,
  height,
  showGodMode = false,
}: TaskCardPreviewProps) {
  if (!task) return null;
  return (
    <article
      style={{
        width: width ?? undefined,
        height: height ?? undefined,
      }}
      className="rounded-xl border border-slate-300 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900/90"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {task.titulo}
        </h3>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${priorityStyles[task.prioridad]}`}
        >
          {task.prioridad}
        </span>
      </div>
      {task.descripcion ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {task.descripcion}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {task.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800/80 dark:text-slate-200"
          >
            #{tag}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{task.estimacionMin} min</span>
        {task.fechaLimite ? (
          <span>Limite: {new Date(task.fechaLimite).toLocaleDateString()}</span>
        ) : (
          <span>Sin limite</span>
        )}
      </div>
      {showGodMode ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            Observaciones de Javi
          </p>
          <p className="mt-1">
            {task.rubricaComentario?.trim() || "Sin observaciones de Javi."}
          </p>
          <p className="mt-2">
            Nota:{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-50">
              {task.rubricaScore ?? "—"}
            </span>
          </p>
        </div>
      ) : null}
    </article>
  );
}
