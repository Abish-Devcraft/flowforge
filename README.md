# FlowForge — AI Project Planner

A black, gradient-styled project planning and task manager built with React + Vite, with Gemini-powered automation.

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Gemini API key

Get a free key at https://aistudio.google.com/apikey, then either:

1. Click **Settings** in the app and paste it (stored in your browser's localStorage only), or
2. Copy `.env.example` to `.env` and set `VITE_GEMINI_API_KEY=...`

> Note: this is a client-side app, so the key lives in the browser. For a public deployment, put the Gemini calls behind your own small backend.

## Features

- Multiple projects, each with a Kanban board (To do / In progress / Done) with drag and drop
- Tasks with priority, due date, tags, notes and subtasks
- Search, filter by priority, progress bars per project
- Data saved automatically in localStorage, plus JSON export/import

### AI automation (Gemini)

| Action | What it does |
| --- | --- |
| **Plan from goal** | Describe a goal and Gemini generates a full task list with priorities, tags, estimates and subtasks |
| **Quick add** | Type "Send invoice to client by Friday, high priority" and it becomes a structured task |
| **Break down** | Splits any task into actionable subtasks |
| **Auto-organize** | Re-prioritizes, tags and re-orders the whole board, and suggests what to do first |

## Project structure

```
src/
  App.jsx               app shell and state wiring
  index.css             black + gradient theme
  lib/gemini.js         Gemini REST client + prompts
  lib/store.js          state, persistence, helpers
  components/           Sidebar, Board, TaskCard, TaskModal, AIPanel, SettingsModal
```

## Change the model

Set `VITE_GEMINI_MODEL` in `.env` (default `gemini-2.5-flash`) or edit it in Settings.
