"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AuditAction, AuditEvent } from "@/types";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";

type AuditLogPanelProps = {
  auditLog: AuditEvent[];
  tasks: { id: string; titulo: string }[];
};

type ActionFilter = "ALL" | AuditAction;

const actionLabels: Record<AuditAction, string> = {
  CREATE: "Create",
  UPDATE: "Update",
  DELETE: "Delete",
  MOVE: "Move",
};

const actionVariant: Record<AuditAction, "default" | "secondary" | "destructive"> =
  {
    CREATE: "secondary",
    UPDATE: "default",
    MOVE: "secondary",
    DELETE: "destructive",
  };

export default function AuditLogPanel({ auditLog, tasks }: AuditLogPanelProps) {
  const [actionFilter, setActionFilter] = useState<ActionFilter>("ALL");
  const [taskFilter, setTaskFilter] = useState("");

  const titleById = useMemo(() => {
    return new Map(tasks.map((task) => [task.id, task.titulo]));
  }, [tasks]);

  const shortId = (id: string) => id.slice(0, 8);

  const getTitleFromEvent = (event: AuditEvent) => {
    const before = event.diff.before as Partial<Record<string, unknown>> | undefined;
    const after = event.diff.after as Partial<Record<string, unknown>> | undefined;
    const beforeTitle = typeof before?.titulo === "string" ? before.titulo : "";
    const afterTitle = typeof after?.titulo === "string" ? after.titulo : "";
    return afterTitle || beforeTitle || titleById.get(event.taskId) || "";
  };

  const filteredLog = useMemo(() => {
    return auditLog.filter((event) => {
      const matchAction =
        actionFilter === "ALL" ? true : event.accion === actionFilter;
      const title = getTitleFromEvent(event);
      const haystack = `${event.taskId} ${shortId(event.taskId)} ${title}`.toLowerCase();
      const matchTask = taskFilter ? haystack.includes(taskFilter.toLowerCase()) : true;
      return matchAction && matchTask;
    });
  }, [auditLog, actionFilter, taskFilter]);

  const summaryText = useMemo(() => {
    const counts = auditLog.reduce<Record<AuditAction, number>>(
      (acc, event) => {
        acc[event.accion] += 1;
        return acc;
      },
      { CREATE: 0, UPDATE: 0, DELETE: 0, MOVE: 0 }
    );
    const lines = [
      `Reporte de auditoria - ${new Date().toLocaleString()}`,
      `Total eventos: ${auditLog.length}`,
      `CREATE: ${counts.CREATE}`,
      `UPDATE: ${counts.UPDATE}`,
      `DELETE: ${counts.DELETE}`,
      `MOVE: ${counts.MOVE}`,
      "",
      "Ultimos eventos:",
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
    if (event.accion === "DELETE") {
      return (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          Tarea eliminada.
        </span>
      );
    }
    if (event.accion === "CREATE") {
      return (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          Tarea creada.
        </span>
      );
    }
    const before = event.diff.before ?? {};
    const after = event.diff.after ?? {};
    const keys = Array.from(
      new Set([...Object.keys(before), ...Object.keys(after)])
    );
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
            <span className="rounded-md bg-slate-50 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              {renderValue((before as Record<string, unknown>)[key])}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
              {renderValue((after as Record<string, unknown>)[key])}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Log de auditoria
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Filtra por accion o por taskId para revisar cambios.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleCopy}
          className="dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Copiar resumen
        </Button>
      </header>
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[180px]">
          <Select
            value={actionFilter}
            onValueChange={(value) => setActionFilter(value as ActionFilter)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar accion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              <SelectItem value="CREATE">Create</SelectItem>
              <SelectItem value="UPDATE">Update</SelectItem>
              <SelectItem value="DELETE">Delete</SelectItem>
              <SelectItem value="MOVE">Move</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          className="max-w-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          placeholder="Filtrar por taskId o titulo"
          value={taskFilter}
          onChange={(event) => setTaskFilter(event.target.value)}
        />
        {(actionFilter !== "ALL" || taskFilter) && (
          <Button
            variant="ghost"
            className="dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => {
              setActionFilter("ALL");
              setTaskFilter("");
            }}
          >
            Limpiar
          </Button>
        )}
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="dark:text-slate-200">Timestamp</TableHead>
              <TableHead className="dark:text-slate-200">Accion</TableHead>
              <TableHead className="dark:text-slate-200">TaskId</TableHead>
              <TableHead className="dark:text-slate-200">Tarea</TableHead>
              <TableHead className="dark:text-slate-200">Diff</TableHead>
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
                  <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                    {new Date(event.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionVariant[event.accion]}>
                      {actionLabels[event.accion]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                    {shortId(event.taskId)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                    {getTitleFromEvent(event) || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-300">
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
