import { Task } from "@/types";

const PRIORITIES: Task["prioridad"][] = ["low", "medium", "high"];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const parseSimpleQuery = (input: string) => {
  const normalized = normalizeText(input);
  if (!normalized) {
    return {
      priorities: [] as Task["prioridad"][],
      minEst: undefined as number | undefined,
      terms: [] as string[],
    };
  }

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const priorities: Task["prioridad"][] = [];
  const numbers: number[] = [];
  const terms: string[] = [];

  tokens.forEach((token) => {
    if (PRIORITIES.includes(token as Task["prioridad"])) {
      priorities.push(token as Task["prioridad"]);
      return;
    }
    if (/^\d+$/.test(token)) {
      numbers.push(Number(token));
      return;
    }
    terms.push(token);
  });

  return {
    priorities,
    minEst: numbers.length > 0 ? Math.max(...numbers) : undefined,
    terms,
  };
};

export const filterTasks = (tasks: Task[], query: string) => {
  const filters = parseSimpleQuery(query);
  return tasks.filter((task) => {
    if (filters.priorities.length > 0) {
      if (!filters.priorities.includes(task.prioridad)) return false;
    }
    if (typeof filters.minEst === "number") {
      if (task.estimacionMin < filters.minEst) return false;
    }
    if (filters.terms.length > 0) {
      const haystack = normalizeText(
        `${task.titulo} ${task.descripcion ?? ""}`
      );
      const hasAll = filters.terms.every((term) => haystack.includes(term));
      if (!hasAll) return false;
    }
    return true;
  });
};
