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
  - `POST /applications` → create (body: `company`, `role`, optional `status`, dates, `link`, `jobSource`, `description`, `notes`, `contacts` with optional `phone`)
  - `PATCH /applications/:id` → partial update
  - `DELETE /applications/:id` → 204 or 404
  - `GET /applications/follow-ups` → `{ "reminders": [...], "asOf": "YYYY-MM-DD" }` (optional `?asOf=YYYY-MM-DD`)
  - `GET /cv-profiles` → `CvProfileSummary[]`
  - `POST /cv-profiles` → multipart create (description + PDF/DOCX file)
  - `PATCH /cv-profiles/:id` → update description
  - `POST /cv-profiles/:id/versions` → upload new version
  - `GET /cv-profiles/:id/versions` → version history with reference counts
  - `GET /cv-profiles/:id/applications` → linked applications (company, role, status)
  - `GET /cv-versions/:id/applications` → applications using that version
  - `GET /cv-versions/:id/file` → inline file for viewer (`?download=1` forces download)
  - `DELETE /cv-versions/:id` → 204 or 409 if referenced by applications
- Frontend: http://localhost:5173 — board (`/board`), stats (`/stats`, includes job-source chart), **CV Tracker** (`/cvs`), **CV viewer** (`/cvs/view/:versionId`); kanban with drag handle, click card to edit, date + overdue badges, CV icon opens viewer, **+ Add application** modal (optional job source with suggestions)

**Persistence:** applications are stored in `backend/data/applications.json` (gitignored). CV metadata in `backend/data/cv-profiles.json`; binary files in `backend/data/cvs/` (gitignored). Data survives backend restarts. On first run, five demo applications are seeded. To reset to demo data, stop the backend and delete that file.

Override paths with `APPLICATIONS_DATA_FILE`, `CV_METADATA_FILE`, or `CVS_DATA_DIR` (used by tests).

Other scripts: `npm run build`, `npm test` (Vitest; 98 tests — backend + frontend).

## Repo layout

| Path | Purpose |
|------|---------|
| `shared/` | Shared TypeScript types (`Application`, CRUD inputs, etc.) |
| `backend/` | Node + Express API + JSON file persistence |
| `frontend/` | React + Vite board + stats UI (`@dnd-kit/core`, `react-router-dom`, `recharts`) |
| `docs/decisions.md` | Append-only squad decision log (Scribe) |
| `PLAN.md` | Full learning roadmap and squad design |
| `STATUS.md` | Current step and what's next |

## Feature slices

Planned learning-track slices are complete. Post-track enhancement:

5. ~~**Application details** (modals + extended fields + card badges)~~ — done (2026-06-14)
6. ~~**CV Tracker** (versioned resumes, application linking, in-app viewer, linked-apps modal)~~ — done (2026-06-15)
7. ~~**Job source** (where you found the job — presets + custom values, stats chart)~~ — done (2026-06-18)

Earlier slices:

1. ~~**Reminder / follow-up logic** (backend)~~ — done (Step 3)
2. ~~**Applications CRUD** (backend)~~ — done (Step 4)
3. ~~**Status pipeline / kanban view** (frontend)~~ — done (Step 4)
4. ~~**Stats dashboard** (frontend)~~ — done (Step 5)

## Squad

7 roles: Lead, Architect, Backend, Frontend, Tester, Reviewer, Scribe.
Workflow is auto-loaded via `.cursor/rules/squad-overview.mdc`.
