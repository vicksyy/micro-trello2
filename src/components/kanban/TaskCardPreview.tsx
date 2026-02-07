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
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-md dark:border-slate-700 dark:bg-slate-900/90"
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
      <div className="-mx-4 mt-3 border-t border-slate-200/70 dark:border-slate-800" />
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
          <span className="flex items-center gap-2">
            <span>
              Límite: {new Date(task.fechaLimite).toLocaleDateString()}
            </span>
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const due = new Date(task.fechaLimite);
              due.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil(
                (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );
              if (diffDays < 0) {
                return (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                    Vencida
                  </span>
                );
              }
              return diffDays <= 7 ? (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-200">
                  {diffDays === 0 ? "Vence hoy" : `${diffDays} días`}
                </span>
              ) : null;
            })()}
          </span>
        ) : (
          <span>Sin límite</span>
        )}
      </div>
      {showGodMode ? (
        <div className="mt-4 -mx-4 -mb-4 rounded-b-xl border-t border-slate-200 bg-slate-50 px-4 py-3 pb-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            Observaciones de Javi:
          </p>
          <p className="mt-1">
            {task.rubricaComentario?.trim() || "Sin observaciones"}
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
