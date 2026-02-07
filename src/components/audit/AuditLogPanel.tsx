"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { AuditAction, AuditEvent } from "@/types";
import { ArrowRight, Check, ChevronDown, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { useCallback, useMemo, useState } from "react";

type AuditLogPanelProps = {
  auditLog: AuditEvent[];
  tasks: { id: string; titulo: string }[];
};

type ActionFilter = "ALL" | AuditAction;
type DiffFilter = "ALL" | "WITH_CHANGES" | "NO_CHANGES";
type SortOrder = "newest" | "oldest";

const actionLabels: Record<AuditAction, string> = {
  CREATE: "Create",
  UPDATE: "Update",
  DELETE: "Delete",
  MOVE: "Move",
};

const actionVariant: Record<
  AuditAction,
  "default" | "secondary" | "destructive" | "outline"
> = {
  CREATE: "outline",
  UPDATE: "outline",
  MOVE: "outline",
  DELETE: "outline",
};

const actionClass: Record<AuditAction, string> = {
  CREATE:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200",
  UPDATE:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/20 dark:text-sky-200",
  MOVE:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/40 dark:bg-violet-500/20 dark:text-violet-200",
  DELETE:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-200",
};

export default function AuditLogPanel({ auditLog, tasks }: AuditLogPanelProps) {
  const [actionFilter, setActionFilter] = useState<ActionFilter>("ALL");
  const [taskFilter, setTaskFilter] = useState("");
  const [diffFilter, setDiffFilter] = useState<DiffFilter>("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [openFilter, setOpenFilter] = useState<
    "timestamp" | "action" | "diff" | null
  >(null);

  const titleById = useMemo(() => {
    return new Map(tasks.map((task) => [task.id, task.titulo]));
  }, [tasks]);

  const shortId = (id: string) => id.slice(0, 8);

  const getTitleFromEvent = useCallback((event: AuditEvent) => {
    const before = event.diff.before as Partial<Record<string, unknown>> | undefined;
    const after = event.diff.after as Partial<Record<string, unknown>> | undefined;
    const beforeTitle = typeof before?.titulo === "string" ? before.titulo : "";
    const afterTitle = typeof after?.titulo === "string" ? after.titulo : "";
    return afterTitle || beforeTitle || titleById.get(event.taskId) || "";
  }, [titleById]);

  const getDiffKeys = useCallback((event: AuditEvent) => {
    if (event.accion === "DELETE" || event.accion === "CREATE") {
      return ["__event__"];
    }
    const before = event.diff.before ?? {};
    const after = event.diff.after ?? {};
    return Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).filter(
      (key) => {
        const beforeValue = (before as Record<string, unknown>)[key];
        const afterValue = (after as Record<string, unknown>)[key];
        return JSON.stringify(beforeValue) !== JSON.stringify(afterValue);
      }
    );
  }, []);

  const filteredLog = useMemo(() => {
    const hasDiffChanges = (event: AuditEvent) => getDiffKeys(event).length > 0;
    const filtered = auditLog.filter((event) => {
      const matchAction =
        actionFilter === "ALL" ? true : event.accion === actionFilter;
      const title = getTitleFromEvent(event);
      const haystack = `${event.taskId} ${shortId(event.taskId)} ${title}`.toLowerCase();
      const matchTask = taskFilter ? haystack.includes(taskFilter.toLowerCase()) : true;
      const matchDiff =
        diffFilter === "ALL"
          ? true
          : diffFilter === "WITH_CHANGES"
            ? hasDiffChanges(event)
            : !hasDiffChanges(event);
      return matchAction && matchTask && matchDiff;
    });
    return [...filtered].sort((a, b) => {
      const diff =
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return sortOrder === "oldest" ? diff : -diff;
    });
  }, [
    auditLog,
    actionFilter,
    taskFilter,
    diffFilter,
    sortOrder,
    getTitleFromEvent,
    getDiffKeys,
  ]);


  const summaryText = useMemo(() => {
    const counts = auditLog.reduce<Record<AuditAction, number>>(
      (acc, event) => {
        acc[event.accion] += 1;
        return acc;
      },
      { CREATE: 0, UPDATE: 0, DELETE: 0, MOVE: 0 }
    );
    const lines = [
      `Reporte de auditoría - ${new Date().toLocaleString()}`,
      `Total eventos: ${auditLog.length}`,
      `CREATE: ${counts.CREATE}`,
      `UPDATE: ${counts.UPDATE}`,
      `DELETE: ${counts.DELETE}`,
      `MOVE: ${counts.MOVE}`,
      "",
      "Últimos eventos:",
      ...auditLog.slice(0, 5).map(
        (event) =>
          `- ${event.accion} | ${event.taskId} | ${new Date(
            event.timestamp
          ).toLocaleString()}`
      ),
    ];
    return lines.join("\n");
  }, [auditLog]);


  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      toast.success("Resumen copiado");
    } catch {
      toast.error("No se pudo copiar el resumen");
    }
  };

  const renderValue = (value: unknown) => {
    if (value === undefined) return "—";
    if (value === null) return "—";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const renderDiff = (event: AuditEvent) => {
    const before = event.diff.before ?? {};
    const after = event.diff.after ?? {};
    if (event.accion === "CREATE") {
      const keys = Object.keys(after);
      if (keys.length === 0) {
        return <span className="text-xs dark:text-slate-300">—</span>;
      }
      return (
        <div className="space-y-2">
          {keys.map((key) => (
            <div
              key={key}
              className="grid grid-cols-[60px_1fr_auto_1fr] items-center gap-1 text-xs"
            >
              <span className="truncate font-medium text-slate-600 dark:text-slate-300">
                {key}
              </span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                —
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/50 dark:text-emerald-200">
                {renderValue((after as Record<string, unknown>)[key])}
              </span>
            </div>
          ))}
        </div>
      );
    }
    if (event.accion === "DELETE") {
      const keys = Object.keys(before);
      if (keys.length === 0) {
        return <span className="text-xs dark:text-slate-300">—</span>;
      }
      return (
        <div className="space-y-2">
          {keys.map((key) => (
            <div
              key={key}
              className="grid grid-cols-[60px_1fr_auto_1fr] items-center gap-1 text-xs"
            >
              <span className="truncate font-medium text-slate-600 dark:text-slate-300">
                {key}
              </span>
              <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-200">
                {renderValue((before as Record<string, unknown>)[key])}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                —
              </span>
            </div>
          ))}
        </div>
      );
    }
    const keys = getDiffKeys(event).filter((key) => key !== "__event__");
    if (keys.length === 0) {
      return <span className="text-xs dark:text-slate-300">—</span>;
    }
    return (
      <div className="space-y-2">
        {keys.map((key) => (
          <div
            key={key}
            className="grid grid-cols-[60px_1fr_auto_1fr] items-center gap-1 text-xs"
          >
            <span className="truncate font-medium text-slate-600 dark:text-slate-300">
              {key}
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {renderValue((before as Record<string, unknown>)[key])}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/50 dark:text-emerald-200">
              {renderValue((after as Record<string, unknown>)[key])}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Log de auditoría
          </h3>
        </div>
        <div className="h-px w-full rounded-full bg-[#0f1f3d] dark:bg-slate-200" />
      </header>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="w-64 border-slate-300 bg-white shadow-sm placeholder:text-slate-400 focus-visible:ring-[#0f1f3d]/30 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500"
          placeholder="Buscar y filtrar..."
          value={taskFilter}
          onChange={(event) => setTaskFilter(event.target.value)}
          aria-label="Buscar tareas"
        />
        <Button
          variant="secondary"
          onClick={handleCopy}
          className="ml-auto border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <Copy className="h-4 w-4" />
          Copiar resumen
        </Button>
        {null}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="rounded-tl-xl bg-slate-100 pl-6 text-slate-700 dark:bg-slate-800/70 dark:text-slate-100">
                <Popover
                  open={openFilter === "timestamp"}
                  onOpenChange={(open) => setOpenFilter(open ? "timestamp" : null)}
                >
                  <div className="inline-flex items-center gap-1">
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-100 dark:hover:text-white"
                      >
                        Timestamp
                        {sortOrder === "newest" ? (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        ) : null}
                      </button>
                    </PopoverTrigger>
                    {sortOrder !== "newest" ? (
                      <button
                        type="button"
                        className="inline-flex h-4 w-4 items-center justify-center rounded text-slate-500 hover:text-slate-700 dark:text-slate-300"
                        onClick={() => setSortOrder("newest")}
                        aria-label="Quitar filtro de timestamp"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>
                  <PopoverContent
                    className="w-52 border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                    align="start"
                  >
                    <div className="space-y-0.5">
                      {[
                        { value: "newest", label: "Más nuevo primero" },
                        { value: "oldest", label: "Más viejo primero" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                          onClick={() => {
                            setSortOrder(option.value as SortOrder);
                            setOpenFilter(null);
                          }}
                        >
                          <span>{option.label}</span>
                          {sortOrder === option.value ? (
                            <Check className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </TableHead>
              <TableHead className="bg-slate-100 text-slate-700 dark:bg-slate-800/70 dark:text-slate-100">
                <Popover
                  open={openFilter === "action"}
                  onOpenChange={(open) => setOpenFilter(open ? "action" : null)}
                >
                  <div className="inline-flex items-center gap-1">
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-100 dark:hover:text-white"
                      >
                        Acción
                        {actionFilter === "ALL" ? (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        ) : null}
                      </button>
                    </PopoverTrigger>
                    {actionFilter !== "ALL" ? (
                      <button
                        type="button"
                        className="inline-flex h-4 w-4 items-center justify-center rounded text-slate-500 hover:text-slate-700 dark:text-slate-300"
                        onClick={() => setActionFilter("ALL")}
                        aria-label="Quitar filtro de accion"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>
                  <PopoverContent
                    className="w-48 border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                    align="start"
                  >
                    <div className="space-y-0.5">
                      {(["ALL", "CREATE", "UPDATE", "DELETE", "MOVE"] as const).map(
                        (action) => {
                          const label =
                            action === "ALL"
                              ? "Todas"
                              : actionLabels[action as AuditAction];
                          return (
                            <button
                              key={action}
                              type="button"
                              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                              onClick={() => {
                                setActionFilter(
                                  action === "ALL" ? "ALL" : (action as AuditAction)
                                );
                                setOpenFilter(null);
                              }}
                            >
                              <span>{label}</span>
                              {actionFilter ===
                              (action === "ALL" ? "ALL" : action) ? (
                                <Check className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                              ) : null}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </TableHead>
              <TableHead className="bg-slate-100 text-slate-700 dark:bg-slate-800/70 dark:text-slate-100">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                  TaskId
                </span>
              </TableHead>
              <TableHead className="bg-slate-100 text-slate-700 dark:bg-slate-800/70 dark:text-slate-100">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                  Tarea
                </span>
              </TableHead>
              <TableHead className="rounded-tr-xl bg-slate-100 pr-6 text-slate-700 dark:bg-slate-800/70 dark:text-slate-100">
                <Popover
                  open={openFilter === "diff"}
                  onOpenChange={(open) => setOpenFilter(open ? "diff" : null)}
                >
                  <div className="inline-flex items-center gap-1">
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-100 dark:hover:text-white"
                      >
                        Diff
                        {diffFilter === "ALL" ? (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        ) : null}
                      </button>
                    </PopoverTrigger>
                    {diffFilter !== "ALL" ? (
                      <button
                        type="button"
                        className="inline-flex h-4 w-4 items-center justify-center rounded text-slate-500 hover:text-slate-700 dark:text-slate-300"
                        onClick={() => setDiffFilter("ALL")}
                        aria-label="Quitar filtro de diff"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>
                  <PopoverContent
                    className="w-64 border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                    align="start"
                  >
                    <div className="space-y-0.5">
                      {[
                        { value: "ALL", label: "Todos" },
                        { value: "WITH_CHANGES", label: "Con cambios" },
                        { value: "NO_CHANGES", label: "Sin cambios" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                          onClick={() => {
                            setDiffFilter(option.value as DiffFilter);
                            setOpenFilter(null);
                          }}
                        >
                          <span>{option.label}</span>
                          {diffFilter === option.value ? (
                            <Check className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLog.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm">
                  Sin eventos para estos filtros.
                </TableCell>
              </TableRow>
            ) : (
              filteredLog.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="pl-6 text-xs text-slate-600 dark:text-slate-300">
                    {new Date(event.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={actionVariant[event.accion]}
                      className={actionClass[event.accion]}
                    >
                      {actionLabels[event.accion]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                    {shortId(event.taskId)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                    {getTitleFromEvent(event) || "—"}
                  </TableCell>
                  <TableCell className="pr-6 text-xs text-slate-600 dark:text-slate-300">
                    {renderDiff(event)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
