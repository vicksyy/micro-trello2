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
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";

type IconButtonWithTooltipProps = {
  label: string;
  onClick?: () => void;
  pressed?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

function IconButtonWithTooltip({
  label,
  onClick,
  pressed,
  children,
  className,
  style,
}: IconButtonWithTooltipProps) {
  return (
    <div className="relative group">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
        className={className}
        style={style}
      >
        {children}
      </Button>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[#0f1f3d] bg-[#0f1f3d] px-2 py-1 text-xs text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-100 dark:text-slate-900">
        {label}
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border border-[#0f1f3d] bg-[#0f1f3d] opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-100" />
    </div>
  );
}

export default function KanbanApp() {
  const [state, setState] = useState<BoardState | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [tabValue, setTabValue] = useState("board");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setState(getInitialState());
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const setBoardState: React.Dispatch<React.SetStateAction<BoardState>> = (
    value
  ) => {
    setState((prev) => {
      if (!prev) return prev;
      return typeof value === "function"
        ? (value as (current: BoardState) => BoardState)(prev)
        : value;
    });
  };

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
      const tasksAreEqual = (a: BoardState["tasks"][number], b: BoardState["tasks"][number]) =>
        JSON.stringify(a) === JSON.stringify(b);

      setState((prev) => {
        const current = prev ?? incoming;
        const mergedTasks = new Map<string, BoardState["tasks"][number]>();
        const auditEntries: BoardState["auditLog"] = [];
        current.tasks.forEach((task) => {
          mergedTasks.set(task.id, task);
        });
        incoming.tasks.forEach((task) => {
          const existing = mergedTasks.get(task.id);
          if (!existing) {
            mergedTasks.set(task.id, task);
            auditEntries.push({
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              accion: "CREATE" as const,
              taskId: task.id,
              diff: {
                after: task,
              },
              userLabel: "Alumno/a" as const,
            });
            return;
          }
          if (!tasksAreEqual(existing, task)) {
            mergedTasks.set(task.id, task);
            auditEntries.push({
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              accion: "UPDATE" as const,
              taskId: task.id,
              diff: {
                before: existing,
                after: task,
              },
              userLabel: "Alumno/a" as const,
            });
          }
        });

        const mergedAudit = new Map<string, BoardState["auditLog"][number]>();
        current.auditLog.forEach((event) => {
          mergedAudit.set(event.id, event);
        });
        incoming.auditLog.forEach((event) => {
          if (!mergedAudit.has(event.id)) {
            mergedAudit.set(event.id, event);
          }
        });
        auditEntries.forEach((event) => {
          mergedAudit.set(event.id, event);
        });

        return {
          ...current,
          tasks: Array.from(mergedTasks.values()),
          auditLog: Array.from(mergedAudit.values()),
          godMode: prev?.godMode ?? incoming.godMode,
        };
      });
      toast.success("Importación completada");
    } catch {
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
          <AlertTitle>Errores de importación</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {importErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
      <Tabs
        value={tabValue}
        onValueChange={setTabValue}
        className="space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList
            variant="line"
            className="border-b border-slate-200 pb-1 dark:border-slate-700"
          >
            <TabsTrigger
              value="board"
              className="relative after:hidden"
            >
              Tablero
              {tabValue === "board" ? (
                <motion.span
                  layoutId="tabs-underline"
                  className="absolute inset-x-0 -bottom-[6px] h-0.5 rounded-full bg-[#0f1f3d] dark:bg-slate-100"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              ) : null}
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              className="relative after:hidden"
            >
              Auditoría
              {tabValue === "audit" ? (
                <motion.span
                  layoutId="tabs-underline"
                  className="absolute inset-x-0 -bottom-[6px] h-0.5 rounded-full bg-[#0f1f3d] dark:bg-slate-100"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              ) : null}
            </TabsTrigger>
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
              className={`border border-slate-200 bg-white/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800 ${
                state.godMode.enabled
                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-400/20 dark:text-amber-200 dark:hover:bg-amber-400/30"
                  : ""
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
              >
                <span>
                  <FileUp />
                </span>
              </Button>
              <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[#0f1f3d] bg-[#0f1f3d] px-2 py-1 text-xs text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-100 dark:text-slate-900">
                Importar JSON
              </span>
              <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border border-[#0f1f3d] bg-[#0f1f3d] opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-100" />
            </label>
          </div>
        </div>
        <TabsContent value="board">
          <LayoutGroup>
            <AnimatePresence mode="popLayout" initial={false}>
              {state.godMode.enabled ? (
                <motion.section
                  className="mb-6 grid gap-4 p-6 sm:grid-cols-3"
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.35, ease: "easeOut", delay: 0.1 },
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                    transition: { duration: 0.18, ease: "easeIn" },
                  }}
                >
                  <div className="text-center">
                    <p className="text-base font-medium text-slate-500 dark:text-slate-400">
                      Promedio rubricado
                    </p>
                    <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
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
                  <div className="text-center">
                    <p className="text-base font-medium text-slate-500 dark:text-slate-400">
                      Tareas sin evaluar
                    </p>
                    <p className="text-3xl font-semibold text-rose-600 dark:text-rose-400">
                      {
                        state.tasks.filter((task) => typeof task.rubricaScore !== "number")
                          .length
                      }
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-medium text-slate-500 dark:text-slate-400">
                      Total tareas
                    </p>
                    <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                      {state.tasks.length}
                    </p>
                  </div>
                </motion.section>
              ) : null}
            </AnimatePresence>
            <motion.div layout>
            <Board
              state={state}
              setState={setBoardState}
              godModeEnabled={state.godMode.enabled}
            />
            </motion.div>
          </LayoutGroup>
        </TabsContent>
        <TabsContent value="audit">
          <AuditLogPanel auditLog={state.auditLog} tasks={state.tasks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
