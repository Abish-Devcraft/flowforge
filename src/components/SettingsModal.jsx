import { useState } from "react";
import { getSettings, saveSettings } from "../lib/gemini.js";

const MODELS = ["gemini-3.8-flash"];

export default function SettingsModal({ onClose }) {
  const initial = getSettings();
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [model, setModel] = useState(initial.model);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <h2>Settings</h2>
        <div className="field">
          <label>Gemini API key</label>
          <input
            className="input"
            type="password"
            placeholder="AIza..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <span style={{ color: "var(--muted)", fontSize: 12 }}>
            Stored only in this browser. Get a free key at{" "}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: "var(--red-bright)" }}>
              aistudio.google.com/apikey
            </a>
            .
          </span>
        </div>
        <div className="field">
          <label>Model</label>
          <input className="input" list="models" value={model} onChange={(e) => setModel(e.target.value)} />
          <datalist id="models">
            {MODELS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>
        <div className="modal-actions">
          <span />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                saveSettings({ apiKey: apiKey.trim(), model: model.trim() || MODELS[0] });
                onClose();
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
