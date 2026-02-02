"use client";

import AuditLogPanel from "@/components/audit/AuditLogPanel";
import Board from "@/components/kanban/Board";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitialState } from "@/lib/storage";
import { BoardState } from "@/types";
import { useEffect, useState } from "react";

export default function KanbanApp() {
  const [state, setState] = useState<BoardState | null>(null);

  useEffect(() => {
    setState(getInitialState());
  }, []);

  if (!state) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
        Cargando tablero...
      </div>
    );
  }

  return (
    <Tabs defaultValue="board" className="space-y-6">
      <TabsList>
        <TabsTrigger value="board">Tablero</TabsTrigger>
        <TabsTrigger value="audit">Auditoria</TabsTrigger>
      </TabsList>
      <TabsContent value="board">
        <Board state={state} setState={setState} />
      </TabsContent>
      <TabsContent value="audit">
        <AuditLogPanel auditLog={state.auditLog} />
      </TabsContent>
    </Tabs>
  );
}
