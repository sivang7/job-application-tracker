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

- Backend: http://localhost:3001
  - `GET /health` → `{ "status": "ok" }`
  - `GET /applications/follow-ups` → `{ "reminders": [...], "asOf": "YYYY-MM-DD" }` (optional `?asOf=YYYY-MM-DD`)
- Frontend: http://localhost:5173 (Vite dev server; proxies `/api` → backend)

Other scripts: `npm run build`, `npm test` (Vitest; 20 tests in `backend/src/reminders.test.ts`).

## Repo layout

| Path | Purpose |
|------|---------|
| `shared/` | Shared TypeScript types (`Application`, `FollowUpReminder`, etc.) |
| `backend/` | Node + Express API (in-memory store; CRUD and features added by squad) |
| `frontend/` | React + Vite UI shell |
| `docs/decisions.md` | Append-only squad decision log (Scribe) |
| `PLAN.md` | Full learning roadmap and squad design |
| `STATUS.md` | Current step and what's next |

## Feature slices (backlog)

1. ~~**Reminder / follow-up logic** (backend)~~ — done (Step 3)
2. **Applications CRUD** (backend) — Step 4
3. **Status pipeline / kanban view** (frontend) — Step 4
4. **Stats dashboard** (frontend)

## Squad

7 roles: Lead, Architect, Backend, Frontend, Tester, Reviewer, Scribe.
Workflow is auto-loaded via `.cursor/rules/squad-overview.mdc`.
