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
import { FileDown, FileUp, Wand2 } from "lucide-react";

type IconButtonWithTooltipProps = {
  label: string;
  onClick?: () => void;
  pressed?: boolean;
  children: React.ReactNode;
  className?: string;
};

function IconButtonWithTooltip({
  label,
  onClick,
  pressed,
  children,
  className,
}: IconButtonWithTooltipProps) {
  return (
    <div className="relative group">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label={label}
        title={label}
        aria-pressed={pressed}
        onClick={onClick}
        className={className}
      >
        {children}
      </Button>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[#0f1f3d] bg-[#0f1f3d] px-2 py-1 text-xs text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 dark:border-slate-700 dark:bg-slate-100 dark:text-slate-900">
        {label}
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border border-[#0f1f3d] bg-[#0f1f3d] opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 dark:border-slate-700 dark:bg-slate-100" />
    </div>
  );
}

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
      <Tabs defaultValue="board" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="board">Tablero</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap items-center gap-3">
            <IconButtonWithTooltip
              label="Modo Dios"
              pressed={state.godMode.enabled}
              onClick={() =>
                setState((prev) =>
                  prev ? { ...prev, godMode: { enabled: !prev.godMode.enabled } } : prev
                )
              }
              className={`border border-slate-200 dark:border-slate-700 ${
                state.godMode.enabled
                  ? "bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-100 dark:text-slate-900"
                  : "dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              <Wand2 />
            </IconButtonWithTooltip>
            <IconButtonWithTooltip
              label="Exportar JSON"
              onClick={handleExport}
              className="border border-slate-200 bg-white/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <FileDown />
            </IconButtonWithTooltip>
            <label className="relative group inline-flex items-center">
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
                variant="ghost"
                size="icon"
                className="border border-slate-200 bg-white/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Importar JSON"
                title="Importar JSON"
              >
                <span>
                  <FileUp />
                </span>
              </Button>
              <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[#0f1f3d] bg-[#0f1f3d] px-2 py-1 text-xs text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 dark:border-slate-700 dark:bg-slate-100 dark:text-slate-900">
                Importar JSON
              </span>
              <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border border-[#0f1f3d] bg-[#0f1f3d] opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 dark:border-slate-700 dark:bg-slate-100" />
            </label>
          </div>
        </div>
        <TabsContent value="board">
          {state.godMode.enabled ? (
            <section className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3">
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
