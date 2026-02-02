"use client";

import Column from "@/components/kanban/Column";
import { getInitialState } from "@/lib/storage";
import { BoardState, TaskStatus } from "@/types";
import { useEffect, useMemo, useState } from "react";

const columnMeta: Array<{ title: string; status: TaskStatus }> = [
  { title: "Todo", status: "todo" },
  { title: "Doing", status: "doing" },
  { title: "Done", status: "done" },
];

export default function Board() {
  const [state, setState] = useState<BoardState | null>(null);

  useEffect(() => {
    setState(getInitialState());
  }, []);

  const tasksByStatus = useMemo(() => {
    const base = {
      todo: [],
      doing: [],
      done: [],
    } as Record<TaskStatus, BoardState["tasks"]>;
    if (!state) return base;
    return state.tasks.reduce((acc, task) => {
      acc[task.estado].push(task);
      return acc;
    }, base);
  }, [state]);

  if (!state) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
        Cargando tablero...
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {columnMeta.map((column) => (
        <Column
          key={column.status}
          title={column.title}
          status={column.status}
          tasks={tasksByStatus[column.status]}
        />
      ))}
    </div>
  );
}
