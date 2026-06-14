# Job Application Tracker

A hands-on sandbox for learning AI agent "squads" in Cursor, built as a useful
**job-search tool** and portfolio piece (React + TypeScript + Node).

The squad itself builds this app. Role charters live in [`.cursor/rules/`](.cursor/rules/).
New agent sessions: see [`START_SQUAD.md`](START_SQUAD.md).

## Run locally

```bash
npm install
npm run dev
```

(`dev:backend` builds `shared/` first, then starts the API.)

- Backend: http://localhost:3001
  - `GET /health` → `{ "status": "ok" }`
  - `GET /applications` → `Application[]`
  - `GET /applications/:id` → `Application` or 404
  - `POST /applications` → create (body: `company`, `role`, optional `status`, dates, `notes`, `contacts`)
  - `PATCH /applications/:id` → partial update
  - `DELETE /applications/:id` → 204 or 404
  - `GET /applications/follow-ups` → `{ "reminders": [...], "asOf": "YYYY-MM-DD" }` (optional `?asOf=YYYY-MM-DD`)
- Frontend: http://localhost:5173 — board (`/board`) + stats dashboard (`/stats`) with drag-and-drop status changes (proxies `/api` → backend)

**Persistence:** applications are stored in `backend/data/applications.json` (gitignored). Data survives backend restarts. On first run, five demo applications are seeded. To reset to demo data, stop the backend and delete that file.

Override the data path with `APPLICATIONS_DATA_FILE` (used by tests).

Other scripts: `npm run build`, `npm test` (Vitest; 49 tests — backend + `frontend/src/stats.test.ts`).

## Repo layout

| Path | Purpose |
|------|---------|
| `shared/` | Shared TypeScript types (`Application`, CRUD inputs, etc.) |
| `backend/` | Node + Express API + JSON file persistence |
| `frontend/` | React + Vite board + stats UI (`@dnd-kit/core`, `react-router-dom`, `recharts`) |
| `docs/decisions.md` | Append-only squad decision log (Scribe) |
| `PLAN.md` | Full learning roadmap and squad design |
| `STATUS.md` | Current step and what's next |

## Feature slices (backlog)

1. ~~**Reminder / follow-up logic** (backend)~~ — done (Step 3)
2. ~~**Applications CRUD** (backend)~~ — done (Step 4)
3. ~~**Status pipeline / kanban view** (frontend)~~ — done (Step 4)
4. ~~**Stats dashboard** (frontend)~~ — done (Step 5)

## Squad

7 roles: Lead, Architect, Backend, Frontend, Tester, Reviewer, Scribe.
Workflow is auto-loaded via `.cursor/rules/squad-overview.mdc`.
