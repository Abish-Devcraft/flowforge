import { useMemo, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Board from "./components/Board.jsx";
import TaskModal from "./components/TaskModal.jsx";
import SettingsModal from "./components/SettingsModal.jsx";
import AIPanel from "./components/AIPanel.jsx";
import { Plus, Sparkles, Trash2, WandSparkles } from "lucide-react";
import {
  PRIORITIES,
  PROJECT_COLORS,
  isOverdue,
  newTask,
  projectProgress,
  taskFromAI,
  uid,
  useAppState,
} from "./lib/store.js";
import { breakDownTask, generatePlan, organizeBoard, parseQuickTask } from "./lib/gemini.js";

export default function App() {
  const [state, setState] = useAppState();
  const [editing, setEditing] = useState(null); // { task, isNew }
  const [showSettings, setShowSettings] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [quick, setQuick] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState(null); // { type, text }
  const [search, setSearch] = useState("");
  const [prioFilter, setPrioFilter] = useState("all");

  const project = state.projects.find((p) => p.id === state.activeProjectId) || state.projects[0];

  /* ---------- state helpers ---------- */
  const updateProject = (id, fn) =>
    setState((s) => ({ ...s, projects: s.projects.map((p) => (p.id === id ? fn(p) : p)) }));

  const setTasks = (fn) => updateProject(project.id, (p) => ({ ...p, tasks: fn(p.tasks) }));

  const addProject = () => {
    const name = window.prompt("Project name?");
    if (!name?.trim()) return;
    const p = { id: uid(), name: name.trim(), description: "", colorIndex: state.projects.length, tasks: [] };
    setState((s) => ({ ...s, projects: [...s.projects, p], activeProjectId: p.id }));
  };

  const deleteProject = () => {
    if (state.projects.length === 1) {
      setNotice({ type: "error", text: "You need at least one project." });
      return;
    }
    if (!window.confirm(`Delete "${project.name}" and all its tasks?`)) return;
    setState((s) => {
      const projects = s.projects.filter((p) => p.id !== project.id);
      return { ...s, projects, activeProjectId: projects[0].id };
    });
  };

  const saveTask = (task) => {
    setTasks((tasks) => (tasks.some((t) => t.id === task.id) ? tasks.map((t) => (t.id === task.id ? task : t)) : [...tasks, task]));
    setEditing(null);
  };

  const deleteTask = (id) => {
    setTasks((tasks) => tasks.filter((t) => t.id !== id));
    setEditing(null);
  };

  const moveTask = (id, status, before) => {
    setTasks((tasks) => {
      const col = tasks.filter((t) => t.status === status && t.id !== id).sort((a, b) => a.order - b.order);
      let order;
      if (before) {
        const idx = col.findIndex((t) => t.id === before.id);
        const prev = col[idx - 1];
        order = prev ? (prev.order + before.order) / 2 : before.order - 1;
      } else {
        order = (col.length ? col[col.length - 1].order : Date.now()) + 1;
      }
      return tasks.map((t) => (t.id === id ? { ...t, status, order } : t));
    });
  };

  /* ---------- AI actions ---------- */
  const run = async (label, fn) => {
    setBusy(label);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setNotice({ type: "error", text: e.message });
    } finally {
      setBusy("");
    }
  };

  const quickAdd = (e) => {
    e.preventDefault();
    const text = quick.trim();
    if (!text) return;
    run("quick", async () => {
      const ai = await parseQuickTask(text);
      setTasks((tasks) => [...tasks, taskFromAI(ai)]);
      setQuick("");
      setNotice({ type: "info", text: `Added “${ai.title}” (${ai.priority}${ai.dueDate ? `, due ${ai.dueDate}` : ""}).` });
    });
  };

  const acceptPlan = (aiTasks) => {
    const base = Date.now();
    setTasks((tasks) => [...tasks, ...aiTasks.map((t, i) => taskFromAI(t, { order: base + i }))]);
    setShowPlan(false);
    setNotice({ type: "info", text: `Added ${aiTasks.length} tasks from your plan.` });
  };

  const organize = () =>
    run("organize", async () => {
      const open = project.tasks.filter((t) => t.status !== "done");
      if (!open.length) throw new Error("No open tasks to organize.");
      const result = await organizeBoard(open, project.name);
      const byId = new Map(result.tasks.map((r) => [r.id, r]));
      setTasks((tasks) =>
        tasks.map((t) => {
          const r = byId.get(t.id);
          if (!r) return t;
          return {
            ...t,
            priority: PRIORITIES.includes(r.priority) ? r.priority : t.priority,
            tags: r.tags?.length ? r.tags.map((x) => String(x).toLowerCase()).slice(0, 4) : t.tags,
            order: r.rank,
          };
        })
      );
      setNotice({ type: "info", text: result.summary });
    });

  /* ---------- import / export ---------- */
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "flowforge-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (file) => {
    try {
      const data = JSON.parse(await file.text());
      if (!data?.projects?.length) throw new Error();
      setState({ ...data, activeProjectId: data.activeProjectId || data.projects[0].id });
      setNotice({ type: "info", text: "Backup imported." });
    } catch {
      setNotice({ type: "error", text: "That file isn't a valid FlowForge backup." });
    }
  };

  /* ---------- derived ---------- */
  const visibleTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return project.tasks.filter((t) => {
      if (prioFilter !== "all" && t.priority !== prioFilter) return false;
      if (!q) return true;
      return t.title.toLowerCase().includes(q) || t.tags.some((g) => g.includes(q)) || t.notes.toLowerCase().includes(q);
    });
  }, [project.tasks, search, prioFilter]);

  const stats = {
    total: project.tasks.length,
    doing: project.tasks.filter((t) => t.status === "doing").length,
    overdue: project.tasks.filter(isOverdue).length,
    progress: projectProgress(project),
  };

  const [c1, c2] = PROJECT_COLORS[project.colorIndex % PROJECT_COLORS.length];

  return (
    <div className="app">
      <Sidebar
        projects={state.projects}
        activeId={project.id}
        onSelect={(id) => setState((s) => ({ ...s, activeProjectId: id }))}
        onAdd={addProject}
        onSettings={() => setShowSettings(true)}
        onExport={exportJson}
        onImport={importJson}
      />

      <main className="main">
        <header className="header">
          <div className="header-top">
            <div style={{ flex: 1, minWidth: 240 }}>
              <input
                className="title-input"
                value={project.name}
                onChange={(e) => updateProject(project.id, (p) => ({ ...p, name: e.target.value }))}
              />
              <input
                className="desc-input"
                placeholder="Add a project description…"
                value={project.description}
                onChange={(e) => updateProject(project.id, (p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="header-actions">
              <button className="btn" onClick={() => setShowPlan((v) => !v)}>
                <Sparkles size={15} /> Plan from goal
              </button>
              <button className="btn" onClick={organize} disabled={!!busy}>
                {busy === "organize" ? <span className="spinner" /> : <WandSparkles size={15} />} Auto-organize
              </button>
              <button className="btn btn-primary" onClick={() => setEditing({ task: newTask(), isNew: true })}>
                <Plus size={15} /> New task
              </button>
              <button className="btn btn-ghost btn-danger btn-icon" onClick={deleteProject} title="Delete project" aria-label="Delete project">
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <b className="gradient-text">{stats.progress}%</b>
              <span>Complete</span>
            </div>
            <div className="stat">
              <b>{stats.total}</b>
              <span>Tasks</span>
            </div>
            <div className="stat">
              <b>{stats.doing}</b>
              <span>In progress</span>
            </div>
            <div className="stat">
              <b style={{ color: stats.overdue ? "#fca5a5" : undefined }}>{stats.overdue}</b>
              <span>Overdue</span>
            </div>
            <div className="stat" style={{ flex: 1, minWidth: 160, display: "flex", alignItems: "center" }}>
              <div className="mini-bar" style={{ width: "100%", height: 8, marginTop: 0 }}>
                <div style={{ width: `${stats.progress}%`, background: `linear-gradient(90deg, ${c1}, ${c2})` }} />
              </div>
            </div>
          </div>

          <div className="toolbar">
            <form className="quick-add" onSubmit={quickAdd}>
              <span style={{ display: "grid", placeItems: "center", color: "var(--red-bright)", paddingLeft: 7 }} aria-hidden="true">
                <Sparkles size={15} />
              </span>
              <input
                placeholder="Quick add: “Send invoice to client by Friday, high priority”"
                value={quick}
                onChange={(e) => setQuick(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" disabled={!!busy || !quick.trim()}>
                {busy === "quick" ? <span className="spinner" /> : "Add"}
              </button>
            </form>
            <input className="input search" placeholder="Search tasks or tags…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="select" value={prioFilter} onChange={(e) => setPrioFilter(e.target.value)}>
              <option value="all">All priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </header>

        {notice && (
          <div className={`notice ${notice.type}`} onClick={() => setNotice(null)} style={{ cursor: "pointer" }}>
            {notice.text}
          </div>
        )}

        {showPlan && (
          <AIPanel
            projectName={project.name}
            onGenerate={(goal) => generatePlan(goal, project.name)}
            onAccept={acceptPlan}
            onClose={() => setShowPlan(false)}
          />
        )}

        <Board
          tasks={visibleTasks}
          onOpen={(task) => setEditing({ task, isNew: false })}
          onMove={moveTask}
          onAddTo={(status) => setEditing({ task: newTask({ status }), isNew: true })}
        />
      </main>

      {editing && (
        <TaskModal
          key={editing.task.id}
          task={editing.task}
          isNew={editing.isNew}
          onSave={saveTask}
          onDelete={deleteTask}
          onClose={() => setEditing(null)}
          onBreakdown={breakDownTask}
        />
      )}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
