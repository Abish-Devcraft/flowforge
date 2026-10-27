import { useState } from "react";
import { Sparkles, X } from "lucide-react";

/** "Plan from goal": describe a goal, preview Gemini's tasks, then add them to the board. */
export default function AIPanel({ projectName, onGenerate, onAccept, onClose }) {
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [preview, setPreview] = useState(null);
  const [selected, setSelected] = useState({});

  const generate = async () => {
    if (!goal.trim()) return;
    setBusy(true);
    setErr("");
    try {
      const tasks = await onGenerate(goal.trim());
      setPreview(tasks);
      setSelected(Object.fromEntries(tasks.map((_, i) => [i, true])));
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const chosen = preview ? preview.filter((_, i) => selected[i]) : [];

  return (
    <div className="ai-box">
      <h3>
        <span className="gradient-text"><Sparkles size={15} /> Plan from goal</span>
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={onClose}>
          <X size={15} />
        </button>
      </h3>
      <p className="ai-sub">
        Describe what you want to achieve in “{projectName}” and Gemini will build the task list.
      </p>

      <textarea
        className="textarea"
        placeholder="e.g. Launch a portfolio website for my photography business in 3 weeks"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && generate()}
      />

      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
        <button className="btn btn-primary" onClick={generate} disabled={busy || !goal.trim()}>
          {busy ? <span className="spinner" /> : <Sparkles size={15} />} {preview ? "Regenerate" : "Generate plan"}
        </button>
        <span style={{ color: "var(--muted)", fontSize: 12 }}>Ctrl + Enter</span>
      </div>

      {err && <div className="notice error" style={{ margin: "12px 0 0" }}>{err}</div>}

      {preview && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" }}>
            {preview.map((t, i) => (
              <label
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "8px 10px",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  background: "var(--bg-2)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  style={{ accentColor: "var(--red)", marginTop: 3 }}
                  checked={!!selected[i]}
                  onChange={(e) => setSelected({ ...selected, [i]: e.target.checked })}
                />
                <span style={{ flex: 1 }}>
                  <b>{t.title}</b>
                  <span style={{ display: "block", color: "var(--muted)", fontSize: 12 }}>
                    {t.priority} {t.dueDate ? `· due ${t.dueDate}` : ""} {t.estimateHours ? `· ${t.estimateHours}h` : ""}{" "}
                    {t.subtasks?.length ? `· ${t.subtasks.length} subtasks` : ""}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 12 }}
            disabled={!chosen.length}
            onClick={() => onAccept(chosen)}
          >
            Add {chosen.length} task{chosen.length === 1 ? "" : "s"} to board
          </button>
        </div>
      )}
    </div>
  );
}
