import { useState } from "react";
import { STATUSES } from "../lib/store.js";
import TaskCard from "./TaskCard.jsx";
import { Plus } from "lucide-react";

export default function Board({ tasks, onOpen, onMove, onAddTo }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  return (
    <div className="board">
      {STATUSES.map((col) => {
        const items = tasks.filter((t) => t.status === col.id).sort((a, b) => a.order - b.order);
        return (
          <div
            key={col.id}
            className={`column column-${col.id} ${overCol === col.id ? "over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (overCol !== col.id) setOverCol(col.id);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setOverCol(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId) onMove(dragId, col.id, null);
              setDragId(null);
              setOverCol(null);
            }}
          >
            <div className="col-head">
              <div className="col-title">
                <span className="col-marker" />
                <span>{col.label}</span>
                <span className="count">{items.length}</span>
              </div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onAddTo(col.id)} title="Add task" aria-label={`Add task to ${col.label}`}>
                <Plus size={16} />
              </button>
            </div>
            <div className="col-body">
              {items.length === 0 && <div className="empty">Drop tasks here</div>}
              {items.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  dragging={dragId === t.id}
                  onOpen={onOpen}
                  onDragStart={setDragId}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverCol(null);
                  }}
                  onDropOn={(target) => {
                    if (dragId && dragId !== target.id) onMove(dragId, target.status, target);
                    setDragId(null);
                    setOverCol(null);
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
