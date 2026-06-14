# Decisions log

Append-only record of squad and user decisions. The Scribe maintains this file.

---

## 2026-05-31 — Project setup

**Decision:** Use built-in Cursor squad (role charters + subagent delegation) for learning, not the `@bradygaster/squad-cli` library (runs on GitHub Copilot). Library remains optional Phase 2.

**Why:** User already pays for Cursor; learn the concept natively first.

---

## 2026-05-31 — Squad roles

**Decision:** 7 roles — Lead, Architect, Backend, Frontend, Tester, Reviewer/Critic, Scribe — defined in `.cursor/rules/*.mdc`.

**Why:** Mirrors a real dev squad; Lead owns requirements; Reviewer gates plan and code; Scribe preserves memory across sessions.

---

## 2026-05-31 — Step 2 scaffold

**Decision:** Lead skipped Architect for boilerplate; Backend + Frontend subagents built skeleton in parallel; Reviewer sanity-checked (APPROVED).

**Outcome:** npm workspaces monorepo, Express `/health`, Vite React shell, shared `Application` types. Commit `6acc14f`.

---

## 2026-05-31 — Step 2.5 project docs

**Decision:** Add `START_SQUAD.md`, `STATUS.md`, `README.md`, and this log. Merge "Start here" + "Current status" into `squad-overview.mdc` (alwaysApply) so new agents need only: "You are the Lead. Execute the current step."

**Why:** Avoid long handoff prompts in every new agent window; keep PLAN and full STATUS out of always-loaded context.

---

## 2026-05-31 — Step 3 reminder / follow-up logic

**Decision:** Status-based follow-up thresholds with pure, testable logic and a read-only API endpoint. No CRUD or UI in this slice.

**Rules:**
- `applied` → remind after **7** days; `interviewing` → **3** days
- `wishlist`, `rejected`, `offer` → never remind
- Anchor date: `lastContactDate` if set, else `appliedDate`; skip if neither exists or date is invalid
- Boundary: exclusive — exactly on threshold day is **not** due (`daysSinceAnchor > threshold`)
- `daysOverdue = daysSinceAnchor - threshold`; urgency: low (1–3), medium (4–7), high (8+)

**Implementation:** `backend/src/reminders.ts` (pure logic + `DEFAULT_FOLLOW_UP_CONFIG`), `GET /applications/follow-ups` with optional `?asOf=`, seeded store for demo. Shared types: `FollowUpReminder`, `FollowUpConfig`, `FollowUpRemindersResponse`. Config constant lives in backend (not shared) to avoid tsx workspace value-export issues.

**Outcome:** 20 Vitest tests; Reviewer approved plan and diff.

---

## 2026-06-01 — Step 4 applications CRUD + kanban + JSON persistence

**Decision:** Full applications REST CRUD, JSON file persistence (option A), and kanban UI with `@dnd-kit/core`.

**Persistence:**
- Default file: `backend/data/applications.json` (gitignored); atomic write via temp + rename
- First run seeds five demo apps; restart keeps user data
- Override path with `APPLICATIONS_DATA_FILE` (Vitest uses isolated temp file via `vitest.setup.ts`)
- Corrupt/invalid file → fail fast on startup

**API:** `GET/POST /applications`, `GET/PATCH/DELETE /applications/:id`; validation in pure `applicationsValidation.ts`; `{ error: string }` on 400/404.

**Frontend:** Five status columns (`APPLICATION_STATUS_ORDER`); drag card to column → `PATCH { status }`; create form + delete with confirm; `App.css` for layout.

**Why JSON not SQLite:** Single-user local sandbox; matches `Application[]` model with minimal deps; SQLite deferred until multi-user or heavy querying needed.

**Outcome:** 41 Vitest tests; `npm run build` passes.

---

## 2026-06-14 — Step 5 stats dashboard (frontend)

**Decision:** Frontend-only stats dashboard with client-side aggregation from existing APIs. No new backend endpoint.

**Approach:**
- Routes via `react-router-dom`: `/board` (kanban + create form), `/stats` (dashboard); `/` and unknown paths redirect to `/board`
- Metrics computed in pure `frontend/src/stats.ts` from `GET /applications`; follow-up counts from existing `GET /applications/follow-ups` via new `fetchFollowUps()` client wrapper in `api.ts` (reminder rules stay on backend)
- Charts via `recharts` (bar charts); key numbers in stat cards first, charts supplementary
- Per-route `RouteErrorBoundary` so a render crash on one view does not unmount the app shell
- Stats fetch: `Promise.allSettled` + unmount cancellation; refetch on `/stats` mount and when `refreshKey` changes; partial failure shows app stats even if follow-ups fails

**Deferred (acceptable at 2 views / small dataset):** React Query/SWR, global context, lazy route code-splitting, shared fetch cache between Board and Stats.

**Why client-side stats:** Single-user JSON store; all applications already loaded for kanban pattern; matches PLAN Step 5 as frontend-focused slice.

**Outcome:** 49 Vitest tests (8 new in `frontend/src/stats.test.ts`); Reviewer Gate 2 APPROVED; `npm run build` passes.
