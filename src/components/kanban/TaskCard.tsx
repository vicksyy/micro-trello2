"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Task } from "@/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type TaskCardProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  showGodMode: boolean;
  godModeEditable?: boolean;
  onSaveNotes?: (
    taskId: string,
    nota: number | undefined,
    observaciones: string
  ) => void;
};

const priorityStyles: Record<Task["prioridad"], string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40",
  medium: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40",
  high: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-500/40",
};

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  showGodMode,
  godModeEditable = false,
  onSaveNotes,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [nota, setNota] = useState<string>(
    typeof task.rubricaScore === "number" ? String(task.rubricaScore) : ""
  );
  const [observaciones, setObservaciones] = useState(
    task.rubricaComentario ?? ""
  );

  useEffect(() => {
    setNota(
      typeof task.rubricaScore === "number" ? String(task.rubricaScore) : ""
    );
    setObservaciones(task.rubricaComentario ?? "");
  }, [task.rubricaScore, task.rubricaComentario]);

  const dirty =
    nota.trim() !==
      (typeof task.rubricaScore === "number" ? String(task.rubricaScore) : "") ||
    observaciones.trim() !== (task.rubricaComentario ?? "").trim();

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border bg-white p-4 shadow-md dark:bg-slate-900/70 ${
        isDragging
          ? "border-slate-400 opacity-70 dark:border-slate-500"
          : "border-slate-200 dark:border-slate-700"
      }`}
      {...attributes}
    >
      <div
        className="cursor-grab"
        {...listeners}
        aria-label="Arrastrar tarea"
      >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          {task.titulo}
        </h3>
        <div className="flex items-center gap-2">
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${priorityStyles[task.prioridad]}`}
          >
            {task.prioridad}
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Editar tarea"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onEdit(task)}
            >
              <Pencil />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Borrar tarea"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onDelete(task)}
              className="text-rose-600 hover:text-rose-700"
            >
              <Trash2 />
            </Button>
          </div>
        </div>
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
      {godModeEditable ? (
        <div
          className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-300"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              Nota (0-10)
            </p>
            <input
              className="mt-2 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
              type="number"
              min={0}
              max={10}
              value={nota}
              onChange={(event) => {
                const raw = event.target.value;
                if (raw.trim() === "") {
                  setNota("");
                  return;
                }
                const parsed = Number(raw);
                if (Number.isNaN(parsed)) return;
                const clamped = Math.min(10, Math.max(0, parsed));
                setNota(String(clamped));
              }}
              onBlur={() => {
                if (nota.trim() === "") return;
                const parsed = Number(nota);
                if (Number.isNaN(parsed)) {
                  setNota("");
                  return;
                }
                const clamped = Math.min(10, Math.max(0, parsed));
                setNota(String(clamped));
              }}
              placeholder="0-10"
            />
          </div>
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              Observaciones de Javi
            </p>
            <Textarea
              className="mt-2 min-h-[80px] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              placeholder="Observaciones de Javi"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {dirty ? "Cambios sin guardar" : "Sin cambios pendientes"}
            </p>
            <Button
              size="sm"
              className="bg-[#0f1f3d] text-white hover:bg-[#0c1931] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              onClick={() =>
                onSaveNotes?.(
                  task.id,
                  nota.trim() === "" ? undefined : Number(nota),
                  observaciones.trim()
                )
              }
              disabled={!dirty}
            >
              Guardar
            </Button>
          </div>
        </div>
      ) : null}
      </div>
    </article>
  );
}
