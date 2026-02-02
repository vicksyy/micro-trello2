export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "doing" | "done";

export type Task = {
  id: string;
  titulo: string;
  descripcion?: string;
  prioridad: TaskPriority;
  tags: string[];
  estimacionMin: number;
  fechaCreacion: string;
  fechaLimite?: string;
  estado: TaskStatus;
  observacionesJavi?: string;
  rubricaScore?: number;
  rubricaComentario?: string;
};

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "MOVE";

export type AuditEvent = {
  id: string;
  timestamp: string;
  accion: AuditAction;
  taskId: string;
  diff: {
    before?: Partial<Task>;
    after?: Partial<Task>;
  };
  userLabel: "Alumno/a";
};

export type BoardState = {
  tasks: Task[];
  auditLog: AuditEvent[];
  godMode: {
    enabled: boolean;
  };
};
