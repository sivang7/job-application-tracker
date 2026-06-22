# Status

Single source of truth for where the squad left off. The Scribe keeps this in sync
with the **Current status** block in `.cursor/rules/squad-overview.mdc`.

## Feature

CV version compare — git-style text diff between any two CV versions (same profile or across profiles).

## Phase

Complete.

## Last commit

`8031602` — Add CV version compare with git-style text diff

## Done

- Step 0: container + `PLAN.md`
- Step 1: 7 role charters in `.cursor/rules/`
- Step 2: thin skeleton (Backend + Frontend parallel subagents); Reviewer approved; `npm run dev` works
- Step 2.5: project docs (`START_SQUAD.md`, `STATUS.md`, `README.md`, `docs/decisions.md`)
- Step 3: reminder / follow-up logic — pure `getFollowUpReminders()`, `GET /applications/follow-ups`, seeded store, 20 Vitest tests; Reviewer approved
- Step 4: applications CRUD + JSON file persistence + kanban UI (`@dnd-kit/core`); 41 Vitest tests; `npm run build` passes
- Step 5: stats dashboard — `react-router-dom` routes, `recharts` charts, client-side `stats.ts`, per-route error boundaries; 49 Vitest tests; Reviewer Gate 2 APPROVED
- Review & lessons: user feedback captured in `docs/decisions.md`
- Charter tightening: senior persona, Lead checklist, parallel protocol, good vs lazy examples
- **Application details slice:** modals, extended fields, card badges
- **Form polish slice:** client-side validation, modal focus fix, trash delete icon, interviewing threshold 4; 69 Vitest tests; Reviewer Gate 2 APPROVED
- **CV Tracker:** versioned PDF/DOCX profiles (`/cvs`); immutable application snapshots; delete guards; `/cvs/view/:id` viewer (PDF iframe + docx-preview); `CvCreateModal`; profile/version usage counts; clickable "Used by N applications" modal (company, role, status); CV selector + card icon on board; 93 Vitest tests; Reviewer Gate 2 APPROVED
- **Job source:** optional `jobSource` on applications; four default suggestions (LinkedIn, Friend / referral, Company careers page, Cold outreach) plus free-text custom values; datalist in create/edit modals; bar chart on `/stats`; 98 Vitest tests; Reviewer Gate 2 APPROVED
- **CV compare:** backend text extraction (`pdf-parse`, `mammoth`); `GET /cv-versions/compare`; cross-profile checkbox selection on tracker; `/cvs/compare` page with `react-diff-viewer-continued` (split/unified); 110 Vitest tests; Reviewer Gate 2 APPROVED

## Blocked

Nothing.
