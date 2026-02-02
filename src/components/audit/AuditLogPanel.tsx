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
import { toast } from "sonner";
import { useMemo, useState } from "react";

type AuditLogPanelProps = {
  auditLog: AuditEvent[];
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

export default function AuditLogPanel({ auditLog }: AuditLogPanelProps) {
  const [actionFilter, setActionFilter] = useState<ActionFilter>("ALL");
  const [taskFilter, setTaskFilter] = useState("");

  const filteredLog = useMemo(() => {
    return auditLog.filter((event) => {
      const matchAction =
        actionFilter === "ALL" ? true : event.accion === actionFilter;
      const matchTask = taskFilter
        ? event.taskId.toLowerCase().includes(taskFilter.toLowerCase())
        : true;
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
    const before = event.diff.before ?? {};
    const after = event.diff.after ?? {};
    const keys = Array.from(
      new Set([...Object.keys(before), ...Object.keys(after)])
    );
    if (keys.length === 0) return <span className="text-xs">—</span>;
    return (
      <div className="space-y-2">
        {keys.map((key) => (
          <div
            key={key}
            className="grid grid-cols-[120px_1fr_1fr] gap-2 text-xs"
          >
            <span className="font-medium text-slate-600">{key}</span>
            <span className="rounded-md bg-slate-50 px-2 py-1 text-slate-600">
              {renderValue((before as Record<string, unknown>)[key])}
            </span>
            <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
              {renderValue((after as Record<string, unknown>)[key])}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Log de auditoria
          </h3>
          <p className="text-sm text-slate-500">
            Filtra por accion o por taskId para revisar cambios.
          </p>
        </div>
        <Button variant="secondary" onClick={handleCopy}>
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
          className="max-w-xs"
          placeholder="Filtrar por taskId"
          value={taskFilter}
          onChange={(event) => setTaskFilter(event.target.value)}
        />
        {(actionFilter !== "ALL" || taskFilter) && (
          <Button
            variant="ghost"
            onClick={() => {
              setActionFilter("ALL");
              setTaskFilter("");
            }}
          >
            Limpiar
          </Button>
        )}
      </div>
      <div className="rounded-xl border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Accion</TableHead>
              <TableHead>TaskId</TableHead>
              <TableHead>Diff</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLog.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm">
                  Sin eventos para estos filtros.
                </TableCell>
              </TableRow>
            ) : (
              filteredLog.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="text-xs text-slate-600">
                    {new Date(event.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionVariant[event.accion]}>
                      {actionLabels[event.accion]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {event.taskId}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
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
