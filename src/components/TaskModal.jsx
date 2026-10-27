import { useState } from "react";
import { PRIORITIES, STATUSES, uid } from "../lib/store.js";
import { Sparkles, X } from "lucide-react";

export default function TaskModal({ task, isNew, onSave, onDelete, onClose, onBreakdown }) {
  const [draft, setDraft] = useState({ ...task, subtasks: [...(task.subtasks || [])] });
  const [tagText, setTagText] = useState(task.tags.join(", "));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const setSub = (id, patch) =>
    set({ subtasks: draft.subtasks.map((s) => (s.id === id ? { ...s, ...patch } : s)) });

  const save = () => {
    const tags = tagText
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
      .filter(Boolean);
    onSave({
      ...draft,
      title: draft.title.trim() || "Untitled task",
      tags,
      estimateHours: Number(draft.estimateHours) || 0,
    });
  };

  const breakdown = async () => {
    setBusy(true);
    setErr("");
    try {
      const subs = await onBreakdown(draft);
      set({ subtasks: [...draft.subtasks, ...subs.map((title) => ({ id: uid(), title, done: false }))] });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{isNew ? "New task" : "Edit task"}</h2>

        <div className="field">
          <label>Title</label>
          <input className="input" autoFocus value={draft.title} onChange={(e) => set({ title: e.target.value })} />
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea className="textarea" value={draft.notes} onChange={(e) => set({ notes: e.target.value })} />
        </div>

        <div className="row">
          <div className="field">
            <label>Status</label>
            <select className="select" style={{ width: "100%" }} value={draft.status} onChange={(e) => set({ status: e.target.value })}>
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Priority</label>
            <select className="select" style={{ width: "100%" }} value={draft.priority} onChange={(e) => set({ priority: e.target.value })}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label>Due date</label>
            <input type="date" className="input" value={draft.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
          </div>
          <div className="field">
            <label>Estimate (hours)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              className="input"
              value={draft.estimateHours}
              onChange={(e) => set({ estimateHours: e.target.value })}
            />
          </div>
        </div>

        <div className="field">
          <label>Tags (comma separated)</label>
          <input className="input" value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="design, backend" />
        </div>

        <div className="field">
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Subtasks</span>
            <button className="btn btn-sm" onClick={breakdown} disabled={busy}>
              {busy ? <span className="spinner" /> : <Sparkles size={14} />} AI break down
            </button>
          </label>
          {draft.subtasks.map((s) => (
            <div key={s.id} className={`subtask ${s.done ? "done" : ""}`}>
              <input type="checkbox" checked={s.done} onChange={(e) => setSub(s.id, { done: e.target.checked })} />
              <input className="input" value={s.title} onChange={(e) => setSub(s.id, { title: e.target.value })} />
              <button className="btn btn-ghost btn-sm" onClick={() => set({ subtasks: draft.subtasks.filter((x) => x.id !== s.id) })}>
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            className="btn btn-ghost btn-sm"
            style={{ alignSelf: "flex-start" }}
            onClick={() => set({ subtasks: [...draft.subtasks, { id: uid(), title: "", done: false }] })}
          >
            + Add subtask
          </button>
          {err && <div className="notice error" style={{ margin: "8px 0 0" }}>{err}</div>}
        </div>

        <div className="modal-actions">
          <div>
            {!isNew && (
              <button className="btn btn-danger" onClick={() => onDelete(task.id)}>
                Delete
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={save}>
              Save task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
