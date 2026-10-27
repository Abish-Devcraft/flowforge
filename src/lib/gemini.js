// Gemini REST client. No SDK needed — one fetch call with structured JSON output.

const DEFAULT_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";

export function getSettings() {
  try {
    const s = JSON.parse(localStorage.getItem("ff_settings") || "{}");
    return {
      apiKey: s.apiKey || import.meta.env.VITE_GEMINI_API_KEY || "",
      model: s.model || DEFAULT_MODEL,
    };
  } catch {
    return { apiKey: import.meta.env.VITE_GEMINI_API_KEY || "", model: DEFAULT_MODEL };
  }
}

export function saveSettings(settings) {
  localStorage.setItem("ff_settings", JSON.stringify(settings));
}

async function callGemini(prompt, schema) {
  const { apiKey, model } = getSettings();
  if (!apiKey) {
    throw new Error("No Gemini API key set. Open Settings and paste your key.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const err = await res.json();
      detail = err?.error?.message || "";
    } catch {}
    throw new Error(`Gemini error ${res.status}${detail ? `: ${detail}` : ""}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  if (!text) throw new Error("Gemini returned an empty response.");
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Could not read Gemini's response as JSON. Try again.");
  }
}

const PRIORITY = { type: "STRING", enum: ["low", "medium", "high", "urgent"] };

const TASK_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    notes: { type: "STRING" },
    priority: PRIORITY,
    dueDate: { type: "STRING", description: "YYYY-MM-DD or empty string" },
    tags: { type: "ARRAY", items: { type: "STRING" } },
    estimateHours: { type: "NUMBER" },
    subtasks: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["title", "priority"],
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Turn a goal into a full task plan. */
export async function generatePlan(goal, projectName) {
  const prompt = `You are an expert project manager. Today is ${today()}.
Project: "${projectName}"
Goal: ${goal}

Create a practical, ordered plan of 6-12 tasks. For each task give a short title, brief notes, a priority,
a realistic due date (YYYY-MM-DD, spread sensibly from today, or empty string), 1-3 lowercase tags,
an hour estimate, and 2-5 concrete subtasks. Earlier tasks should be those that must happen first.`;

  const out = await callGemini(prompt, {
    type: "OBJECT",
    properties: { tasks: { type: "ARRAY", items: TASK_SCHEMA } },
    required: ["tasks"],
  });
  return out.tasks || [];
}

/** Parse one natural-language line into a structured task. */
export async function parseQuickTask(text) {
  const prompt = `Today is ${today()} (${new Date().toLocaleDateString("en-US", { weekday: "long" })}).
Convert this into one structured task. Resolve relative dates like "tomorrow" or "Friday" into YYYY-MM-DD.
If no priority is implied use "medium". If no date is implied use an empty string.
Input: "${text}"`;
  return callGemini(prompt, TASK_SCHEMA);
}

/** Break a task into subtasks. */
export async function breakDownTask(task) {
  const prompt = `Break this task into 3-7 small, concrete, actionable subtasks in a sensible order.
Task: ${task.title}
Notes: ${task.notes || "(none)"}
Existing subtasks: ${(task.subtasks || []).map((s) => s.title).join("; ") || "(none)"}
Do not repeat existing subtasks.`;
  const out = await callGemini(prompt, {
    type: "OBJECT",
    properties: { subtasks: { type: "ARRAY", items: { type: "STRING" } } },
    required: ["subtasks"],
  });
  return out.subtasks || [];
}

/** Re-prioritise, tag and order every open task on a board. */
export async function organizeBoard(tasks, projectName) {
  const compact = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate || "",
    tags: t.tags,
  }));
  const prompt = `You are a productivity coach. Today is ${today()}.
Project: "${projectName}". Here are the tasks as JSON:
${JSON.stringify(compact)}

For each task return: its id, a recommended priority, 1-3 lowercase tags (reuse tags consistently),
and a "rank" (1 = do first) reflecting deadlines, dependencies and importance across the whole list.
Every id must appear exactly once. Also write a short "summary" (max 3 sentences) of what to focus on first.`;

  return callGemini(prompt, {
    type: "OBJECT",
    properties: {
      summary: { type: "STRING" },
      tasks: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING" },
            priority: PRIORITY,
            tags: { type: "ARRAY", items: { type: "STRING" } },
            rank: { type: "INTEGER" },
          },
          required: ["id", "priority", "rank"],
        },
      },
    },
    required: ["tasks", "summary"],
  });
}
