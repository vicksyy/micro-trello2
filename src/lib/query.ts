import { Task } from "@/types";

export type QueryFilters = {
  text: string;
  tags: string[];
  priority?: Task["prioridad"];
  due?: "overdue" | "week";
  est?: {
    op: "<" | "<=" | ">" | ">=" | "=";
    value: number;
  };
};

const OP_RE = /^(<=|>=|=|<|>)(\d+)$/;

export const parseQuery = (input: string): QueryFilters => {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  const filters: QueryFilters = {
    text: "",
    tags: [],
  };

  const textParts: string[] = [];

  tokens.forEach((token) => {
    if (token.startsWith("tag:")) {
      const tag = token.slice(4).trim().toLowerCase();
      if (tag) filters.tags.push(tag);
      return;
    }
    if (token.startsWith("p:")) {
      const value = token.slice(2).trim().toLowerCase();
      if (value === "low" || value === "medium" || value === "high") {
        filters.priority = value;
      }
      return;
    }
    if (token.startsWith("due:")) {
      const value = token.slice(4).trim().toLowerCase();
      if (value === "overdue" || value === "week") {
        filters.due = value;
      }
      return;
    }
    if (token.startsWith("est:")) {
      const value = token.slice(4).trim();
      const match = OP_RE.exec(value);
      if (match) {
        filters.est = {
          op: match[1] as QueryFilters["est"]["op"],
          value: Number(match[2]),
        };
      }
      return;
    }
    textParts.push(token);
  });

  filters.text = textParts.join(" ").trim().toLowerCase();
  return filters;
};

const isDueThisWeek = (dateString: string) => {
  const today = new Date();
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return date >= start && date <= end;
};

const isOverdue = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;
  return date < new Date();
};

const matchesEst = (est: QueryFilters["est"], value: number) => {
  if (!est) return true;
  const target = est.value;
  switch (est.op) {
    case "<":
      return value < target;
    case "<=":
      return value <= target;
    case ">":
      return value > target;
    case ">=":
      return value >= target;
    case "=":
      return value === target;
    default:
      return true;
  }
};

export const filterTasks = (tasks: Task[], query: string) => {
  const filters = parseQuery(query);
  return tasks.filter((task) => {
    if (filters.priority && task.prioridad !== filters.priority) return false;
    if (filters.tags.length > 0) {
      const taskTags = task.tags.map((tag) => tag.toLowerCase());
      const hasAll = filters.tags.every((tag) => taskTags.includes(tag));
      if (!hasAll) return false;
    }
    if (filters.due) {
      if (!task.fechaLimite) return false;
      if (filters.due === "overdue" && !isOverdue(task.fechaLimite)) {
        return false;
      }
      if (filters.due === "week" && !isDueThisWeek(task.fechaLimite)) {
        return false;
      }
    }
    if (filters.est && !matchesEst(filters.est, task.estimacionMin)) {
      return false;
    }
    if (filters.text) {
      const haystack = `${task.titulo} ${task.descripcion ?? ""}`.toLowerCase();
      if (!haystack.includes(filters.text)) return false;
    }
    return true;
  });
};
