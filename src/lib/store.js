import { useEffect, useState } from "react";

export const STATUSES = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "In progress" },
  { id: "done", label: "Done" },
];

export const PRIORITIES = ["low", "medium", "high", "urgent"];

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

const STORAGE_KEY = "ff_state_v1";

export const PROJECT_COLORS = [
  ["#f04452", "#b81424"],
  ["#e11d2e", "#75121b"],
  ["#fa5964", "#9e1b27"],
  ["#bd2835", "#51151b"],
  ["#ff737b", "#a81725"],
];

export function newTask(partial = {}) {
  return {
    id: uid(),
    title: "Untitled task",
    notes: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
    tags: [],
    estimateHours: 0,
    subtasks: [],
    order: Date.now(),
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

/** Convert an AI task payload into a real task. */
export function taskFromAI(ai, extra = {}) {
  return newTask({
    title: ai.title || "Untitled task",
    notes: ai.notes || "",
    priority: PRIORITIES.includes(ai.priority) ? ai.priority : "medium",
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(ai.dueDate || "") ? ai.dueDate : "",
    tags: (ai.tags || []).map((t) => String(t).toLowerCase()).slice(0, 4),
    estimateHours: Number(ai.estimateHours) || 0,
    subtasks: (ai.subtasks || []).map((s) => ({ id: uid(), title: s, done: false })),
    ...extra,
  });
}

function seed() {
  const projectId = uid();
  const now = Date.now();
  return {
    activeProjectId: projectId,
    projects: [
      {
        id: projectId,
        name: "My First Project",
        description: "Try the AI buttons: Plan from goal, Quick add, Auto-organize.",
        colorIndex: 0,
        tasks: [
          newTask({
            title: "Add your Gemini API key in Settings",
            priority: "high",
            tags: ["setup"],
            order: now,
          }),
          newTask({
            title: "Click 'Plan from goal' and describe a project",
            priority: "medium",
            tags: ["ai"],
            order: now + 1,
          }),
          newTask({
            title: "Drag cards between columns",
            status: "doing",
            priority: "low",
            tags: ["tutorial"],
            order: now + 2,
          }),
        ],
      },
    ],
  };
}

export function useAppState() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.projects?.length) return parsed;
      }
    } catch {}
    return seed();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  return [state, setState];
}

export function projectProgress(project) {
  const total = project.tasks.length;
  if (!total) return 0;
  return Math.round((project.tasks.filter((t) => t.status === "done").length / total) * 100);
}

export function isOverdue(task) {
  if (!task.dueDate || task.status === "done") return false;
  return task.dueDate < new Date().toISOString().slice(0, 10);
}

export function formatDate(d) {
  if (!d) return "";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
