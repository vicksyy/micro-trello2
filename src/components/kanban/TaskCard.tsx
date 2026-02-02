"use client";

import { Button } from "@/components/ui/button";
import { Task } from "@/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2 } from "lucide-react";

type TaskCardProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

const priorityStyles: Record<Task["prioridad"], string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  high: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
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

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        isDragging ? "border-slate-400 opacity-70" : "border-slate-200"
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{task.titulo}</h3>
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
              onClick={() => onEdit(task)}
            >
              <Pencil />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Borrar tarea"
              onClick={() => onDelete(task)}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
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
