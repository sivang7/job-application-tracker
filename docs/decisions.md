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
- `applied` → remind after **7** days; `interviewing` → **4** days
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

---

## 2026-06-14 — Review & lessons (PLAN Step 5)

**Source:** User reflection (subjective process feedback — not inferable from git alone).

**What worked:**
- Lead stayed out of implementation.

**Gaps observed:**
- Reviewer Gate 1 was not always run until the user explicitly asked (rules existed; Lead enforcement was the gap).
- Best-practice lens was not used proactively by Architect/Coders until the user prompted; role charters were updated together afterward.
- Backend + Frontend ran in parallel only once, on unrelated slices — not a true same-feature coordination test.

**Overall:** Squad still felt generic; user wants roles to behave like strong senior engineers by default.

**Follow-ups chosen:**
1. Tighten role charters (persona, Lead checklist, parallel protocol, good vs lazy examples) — see next entry.

---

## 2026-06-14 — Charter tightening (post-review)

**Decision:** Strengthen role charters so senior behavior and parallel coordination are defaults, not user-prompted.

**Changes (`.cursor/rules/`):**
- **Persona** line on Architect, Backend, Frontend, Reviewer, Tester, Lead.
- **Lead pre-dispatch checklist** — Gate 1 before Coders, Gate 2 before commit; user "go" does not skip gates.
- **Parallel coordination protocol** — contract in `shared/` first, Gate 1, then Backend + Frontend in parallel with same contract excerpt; stop on ambiguity.
- **Good vs lazy examples** in Architect, Backend, Frontend charters.
- **Reviewer mandatory headings** — `## Reviewer Gate N: APPROVED` / `CHANGES REQUESTED`.
- **Tester** — challenge thin coverage, not only happy path.
- **squad-overview** — parallel protocol + note that Review & lessons requires human input.

**Why:** Address enforcement and senior-behavior gaps without adding new gates.

**Outcome:** Docs-only change; no commit in this run (user request).

**Corrections (same day):**
- **Tester persona** — distinct test-engineer identity (writes tests); not a copy of Coders' senior-engineer persona.
- **Reviewer two hats** — Gate 1 plan critique + Gate 2 code review before commit (not a separate "QA engineer" role).
- **Current status format** — `Feature` + `Phase` in `squad-overview.mdc` and `STATUS.md`; removed workflow echo from status (ceremony stays in squad definitions).

---

## 2026-06-14 — Application details (modals + fields + card badges)

**Decision:** Extend applications with `link` and `description`; expose existing `notes`, dates, and `contacts` in UI; add optional `Contact.phone`.

**UX:**
- **+ Add application** opens create modal (replaces inline form)
- Click card body opens edit modal; drag handle (`⠿`) preserves kanban DnD
- Card badges: relative **date** pill + **urgency** pill when app appears in follow-ups API
- Contacts editor: repeatable rows (name, email, phone, title)

**Backend:** `link` validated as http/https URL (max 2000); `description` max 5000; `phone` on contacts max 200. No reminder logic changes.

**Frontend:** Reusable `Modal`, shared `ApplicationFormFields`, `ContactsEditor`, `cardDateLabel.ts` for badge text. Board loads applications + follow-ups in parallel.

**Outcome:** 58 Vitest tests; Reviewer Gate 2 APPROVED; `npm run build` passes.

---

## 2026-06-14 — Form polish (validation, focus fix, trash icon, threshold)

**Decision:** Fix modal focus-loss bug; add client-side form validation on submit; trash icon delete; interviewing threshold 3 → 4 days.

**Focus fix:** `Modal` effect depended on unstable `onClose` — re-ran `dialogRef.focus()` every keystroke in create modal. Fixed: `onClose` ref + effect deps `[isOpen]` only.

**Validation:** `frontend/src/validateApplicationForm.ts` mirrors backend rules; inline field errors on submit; contact email/phone format when set. Backend aligned for contact email/phone format.

**UX:** Delete → top-right trash icon with `title="Delete application"`.

**Threshold:** `DEFAULT_FOLLOW_UP_CONFIG.interviewing` = 4. `reminders.test.ts` derives test dates from config via `addUtcDays(anchor, threshold + n)` — no hardcoded magic dates.

**Lessons (user feedback):**
- Frontend should have added validation without being asked — Lead acceptance criteria for forms must require client-side validation.
- Tester should use manual modal smoke checklist (type full sentence in each field) until interaction tests exist.

**Outcome:** 69 Vitest tests; `npm run build` passes.

---

## 2026-06-15 — CV Tracker

**Decision:** Add versioned CV profiles (PDF/DOCX) with immutable snapshots on job applications, a full tracker UI at `/cvs`, in-app file viewing, and drill-down into which applications used each profile or version.

**Data model:**
- `CvProfile` — description of when the CV is relevant
- `CvVersion` — immutable PDF/DOCX file (`backend/data/cvs/{versionId}.ext`)
- `Application.cvVersionId` + `cvSnapshotDescription` — snapshot at link time; never auto-updated on new upload
- API write: `cvProfileId` on create/PATCH resolves to current version; `null` clears link
- API read: optional `cv` snapshot on `ApplicationWithCv`

**Backend:**
- `multer` multipart upload; magic-byte validation (PDF/DOCX, 5 MB cap); `cv-profiles.json` metadata with atomic writes
- `GET /cv-versions/:id`, `GET /cv-versions/:id/file` (`?download=1` for attachment)
- `GET /cv-profiles/:id/applications` and `GET /cv-versions/:id/applications` — linked apps as `{ id, company, role, status }`
- Delete version only when zero applications reference it

**Frontend:**
- `/cvs` nav tab; `CvCreateModal` (matches Board add-modal pattern); version history with per-version reference counts
- `/cvs/view/:versionId` — PDF via blob iframe; DOCX via `docx-preview`; Download button
- Profile header: `X versions · Used by Y applications` (clickable when Y > 0 → `CvApplicationsModal`)
- Version history View links; board CV selector; card icon and edit-modal link open viewer
- `CvApplicationsModal` — company, role, status table for profile- or version-level usage

**Why immutable versions:** Jobs already applied keep the CV that was sent even after uploading a newer file to the same profile.

**Outcome:** 93 Vitest tests; Reviewer Gate 2 APPROVED; `npm run build` passes.
