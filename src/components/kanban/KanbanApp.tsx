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
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";

export default function KanbanApp() {
  const [state, setState] = useState<BoardState | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setState(getInitialState());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("micro-kanban-theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")
      .matches;
    const enabled = stored ? stored === "dark" : Boolean(prefersDark);
    setDarkMode(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem(
      "micro-kanban-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

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
    <div className="space-y-5">
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
      {state.godMode.enabled ? (
        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Promedio rubricado
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {state.tasks.filter((task) => typeof task.rubricaScore === "number")
                .length > 0
                ? (
                    state.tasks.reduce((acc, task) => {
                      return acc + (typeof task.rubricaScore === "number" ? task.rubricaScore : 0);
                    }, 0) /
                    state.tasks.filter((task) => typeof task.rubricaScore === "number")
                      .length
                  ).toFixed(1)
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tareas sin evaluar
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {
                state.tasks.filter((task) => typeof task.rubricaScore !== "number")
                  .length
              }
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total tareas
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {state.tasks.length}
            </p>
          </div>
        </section>
      ) : null}
      <Tabs defaultValue="board" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="board">Tablero</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => setDarkMode((prev) => !prev)}
              className="dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
            >
              {darkMode ? <Sun /> : <Moon />}
            </Button>
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Modo Dios
              </p>
              <Switch
                checked={state.godMode.enabled}
                onCheckedChange={(checked) =>
                  setState((prev) =>
                    prev ? { ...prev, godMode: { enabled: checked } } : prev
                  )
                }
                aria-label="Activar modo dios"
              />
            </div>
            <Button
              variant="secondary"
              onClick={handleExport}
              className="dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
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
              <Button
                asChild
                className="dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                <span>Importar JSON</span>
              </Button>
            </label>
          </div>
        </div>
        <TabsContent value="board">
          <Board
            state={state}
            setState={setState}
            godModeEnabled={state.godMode.enabled}
          />
        </TabsContent>
        <TabsContent value="audit">
          <AuditLogPanel auditLog={state.auditLog} tasks={state.tasks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
