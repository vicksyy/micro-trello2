"use client";

import AuditLogPanel from "@/components/audit/AuditLogPanel";
import Board from "@/components/kanban/Board";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitialState } from "@/lib/storage";
import { BoardState } from "@/types";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { boardStateSchema } from "@/lib/validation";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

export default function KanbanApp() {
  const [state, setState] = useState<BoardState | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  useEffect(() => {
    setState(getInitialState());
  }, []);

  const handleExport = () => {
    if (!state) return;
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "micro-kanban-export.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    setImportErrors([]);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = boardStateSchema.safeParse(parsed);
      if (!result.success) {
        const errors = result.error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`
        );
        setImportErrors(errors);
        return;
      }

      const incoming = result.data;
      const seen = new Set<string>();
      const auditEntries: BoardState["auditLog"] = [];
      const updatedTasks = incoming.tasks.map((task) => {
        if (!seen.has(task.id)) {
          seen.add(task.id);
          return task;
        }
        const newId = uuidv4();
        seen.add(newId);
        auditEntries.push({
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          accion: "UPDATE" as const,
          taskId: task.id,
          diff: {
            before: { id: task.id },
            after: { id: newId },
          },
          userLabel: "Alumno/a" as const,
        });
        return { ...task, id: newId };
      });

      setState({
        ...incoming,
        tasks: updatedTasks,
        auditLog: [...auditEntries, ...incoming.auditLog],
      });
      toast.success("Importacion completada");
    } catch (error) {
      setImportErrors(["No se pudo leer el archivo JSON."]);
    }
  };

  if (!state) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
        Cargando tablero...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Operaciones del tablero
          </h2>
          <p className="text-sm text-slate-500">
            Exporta o importa el estado completo del tablero.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={handleExport}>
            Exportar JSON
          </Button>
          <label className="inline-flex items-center gap-2">
            <Input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleImport(file);
                event.currentTarget.value = "";
              }}
            />
            <Button asChild>
              <span>Importar JSON</span>
            </Button>
          </label>
        </div>
      </div>
      {importErrors.length > 0 ? (
        <Alert variant="destructive">
          <AlertTitle>Errores de importacion</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {importErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
      <Tabs defaultValue="board" className="space-y-6">
        <TabsList>
          <TabsTrigger value="board">Tablero</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>
        <TabsContent value="board">
          <Board state={state} setState={setState} />
        </TabsContent>
        <TabsContent value="audit">
          <AuditLogPanel auditLog={state.auditLog} tasks={state.tasks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
