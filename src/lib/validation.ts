import { z } from "zod";

const taskSchema = z.object({
  id: z.string().min(1),
  titulo: z.string().min(3),
  descripcion: z.string().optional(),
  prioridad: z.enum(["low", "medium", "high"]),
  tags: z.array(z.string()),
  estimacionMin: z.number().int().min(1),
  fechaCreacion: z.string().min(1),
  fechaLimite: z.string().optional(),
  estado: z.enum(["todo", "doing", "done"]),
  orden: z.number().int().min(1),
  observacionesJavi: z.string().optional(),
  rubricaScore: z.number().min(0).max(10).optional(),
  rubricaComentario: z.string().optional(),
});

const auditSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().min(1),
  accion: z.enum(["CREATE", "UPDATE", "DELETE", "MOVE"]),
  taskId: z.string().min(1),
  diff: z
    .object({
      before: z.record(z.string(), z.unknown()).optional(),
      after: z.record(z.string(), z.unknown()).optional(),
    })
    .optional()
    .default({}),
  userLabel: z.literal("Alumno/a"),
});

const godModeSchema = z.object({
  enabled: z.boolean(),
});

export const boardStateSchema = z.object({
  tasks: z.array(taskSchema),
  auditLog: z.array(auditSchema),
  godMode: godModeSchema,
});

export type BoardImport = z.infer<typeof boardStateSchema>;
