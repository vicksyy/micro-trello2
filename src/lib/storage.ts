import { BoardState } from "@/types";

const STORAGE_KEY = "micro-kanban-state";

const seedState: BoardState = {
  tasks: [
    {
      id: "seed-1",
      titulo: "Revisar apertura de mercado Asia",
      descripcion: "Validar gaps y liquidez en pares principales.",
      prioridad: "high",
      tags: ["trading", "asia"],
      estimacionMin: 35,
      fechaCreacion: "2026-02-02T08:10:00.000Z",
      fechaLimite: "2026-02-02T12:00:00.000Z",
      estado: "todo",
      orden: 1,
    },
    {
      id: "seed-2",
      titulo: "Actualizar niveles de riesgo semanal",
      descripcion: "Recalcular exposición por sector y beta.",
      prioridad: "medium",
      tags: ["riesgo", "portfolio"],
      estimacionMin: 60,
      fechaCreacion: "2026-02-02T08:15:00.000Z",
      estado: "todo",
      orden: 2,
    },
    {
      id: "seed-3",
      titulo: "Preparar reporte de volatilidad",
      descripcion: "Incluye VIX, skew y correlaciones clave.",
      prioridad: "high",
      tags: ["reporte", "volatilidad"],
      estimacionMin: 90,
      fechaCreacion: "2026-02-02T08:20:00.000Z",
      fechaLimite: "2026-02-03T16:00:00.000Z",
      estado: "doing",
      orden: 1,
    },
    {
      id: "seed-4",
      titulo: "Revisión de alertas macro",
      descripcion: "Chequear CPI, PMI y comentarios de la Fed.",
      prioridad: "low",
      tags: ["macro", "alertas"],
      estimacionMin: 20,
      fechaCreacion: "2026-02-02T08:25:00.000Z",
      estado: "doing",
      orden: 2,
    },
    {
      id: "seed-5",
      titulo: "Enviar resumen diario al equipo",
      descripcion: "Incluye top movers y riesgos abiertos.",
      prioridad: "medium",
      tags: ["comunicacion"],
      estimacionMin: 25,
      fechaCreacion: "2026-02-02T08:30:00.000Z",
      estado: "done",
      orden: 1,
    },
    {
      id: "seed-6",
      titulo: "Auditar cambios de stops",
      descripcion: "Verificar ejecuciones y slippage.",
      prioridad: "low",
      tags: ["auditoria"],
      estimacionMin: 40,
      fechaCreacion: "2026-02-02T08:32:00.000Z",
      estado: "done",
      orden: 2,
    },
  ],
  auditLog: [],
  godMode: {
    enabled: false,
  },
};

const isBrowser = () => typeof window !== "undefined";

export const getInitialState = (): BoardState => {
  if (!isBrowser()) return seedState;
  const stored = readState();
  return stored ?? seedState;
};

export const readState = (): BoardState | null => {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BoardState;
  } catch {
    return null;
  }
};

export const writeState = (state: BoardState) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const clearState = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
};
