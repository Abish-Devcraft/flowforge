import { formatDate, isOverdue } from "../lib/store.js";
import { CalendarDays, Clock3, ListChecks, TriangleAlert } from "lucide-react";

const PRIO_COLOR = {
  low: "#777176",
  medium: "#d69f57",
  high: "#f04452",
  urgent: "#e11d2e",
};

export default function TaskCard({ task, dragging, onOpen, onDragStart, onDragEnd, onDropOn }) {
  const subs = task.subtasks || [];
  const subDone = subs.filter((s) => s.done).length;
  const overdue = isOverdue(task);

  return (
    <div
      className={`card ${task.status === "done" ? "done" : ""} ${dragging ? "dragging" : ""}`}
      style={{ "--prio": PRIO_COLOR[task.priority] }}
      draggable
      onClick={() => onOpen(task)}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id);
        onDragStart(task.id);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDropOn(task);
      }}
    >
      <div className="card-title">{task.title}</div>
      <div className="meta">
        <span className={`chip p-${task.priority}`}>{task.priority}</span>
        {task.dueDate && (
          <span className={`chip ${overdue ? "overdue" : ""}`}>
            {overdue ? <TriangleAlert size={12} /> : <CalendarDays size={12} />}
            {formatDate(task.dueDate)}
          </span>
        )}
        {task.estimateHours > 0 && <span className="chip"><Clock3 size={12} /> {task.estimateHours}h</span>}
        {task.tags.map((t) => (
          <span key={t} className="chip tag">
            #{t}
          </span>
        ))}
        {subs.length > 0 && (
          <span className="chip">
            <ListChecks size={12} /> {subDone}/{subs.length}
          </span>
        )}
      </div>
      {subs.length > 0 && (
        <div className="sub-progress">
          <div style={{ width: `${(subDone / subs.length) * 100}%` }} />
        </div>
      )}
    </div>
  );
}
