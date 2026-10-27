import { PROJECT_COLORS, projectProgress } from "../lib/store.js";
import { Download, Plus, Settings2, Upload, Zap } from "lucide-react";

export default function Sidebar({ projects, activeId, onSelect, onAdd, onSettings, onExport, onImport }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo"><Zap size={18} fill="currentColor" strokeWidth={2.2} /></div>
        <span>
          Flow<span className="gradient-text">Forge</span>
        </span>
      </div>

      <div>
        <div className="side-label">
          <span>Projects</span>
          <button className="btn btn-ghost btn-sm" onClick={onAdd} title="New project">
            <Plus size={14} /> New
          </button>
        </div>
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          {projects.map((p) => {
            const [c1, c2] = PROJECT_COLORS[p.colorIndex % PROJECT_COLORS.length];
            const pct = projectProgress(p);
            return (
              <button
                key={p.id}
                className={`project-item ${p.id === activeId ? "active" : ""}`}
                onClick={() => onSelect(p.id)}
              >
                <div className="project-row">
                  <span className="dot" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }} />
                  <span className="project-name">{p.name}</span>
                  <span className="project-pct">{pct}%</span>
                </div>
                <div className="mini-bar">
                  <div style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c1}, ${c2})` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="side-footer">
        <button className="btn btn-wide" onClick={onSettings}>
          <Settings2 size={15} /> Settings &amp; API key
        </button>
        <button className="btn btn-ghost btn-wide btn-sm" onClick={onExport}>
          <Download size={14} /> Export JSON
        </button>
        <label className="btn btn-ghost btn-wide btn-sm" style={{ justifyContent: "center", cursor: "pointer" }}>
          <Upload size={14} /> Import JSON
          <input
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </aside>
  );
}
