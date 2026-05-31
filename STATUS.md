# Status

Single source of truth for where the squad left off. The Scribe keeps this in sync
with the **Current status** block in `.cursor/rules/squad-overview.mdc`.

## Current step

**Step 4** — applications CRUD (backend) + status pipeline / kanban view (frontend)

## Last commit

*(uncommitted)* — Step 3 reminder / follow-up logic

## Done

- Step 0: container + `PLAN.md`
- Step 1: 7 role charters in `.cursor/rules/`
- Step 2: thin skeleton (Backend + Frontend parallel subagents); Reviewer approved; `npm run dev` works
- Step 2.5: project docs (`START_SQUAD.md`, `STATUS.md`, `README.md`, `docs/decisions.md`)
- Step 3: reminder / follow-up logic — pure `getFollowUpReminders()`, `GET /applications/follow-ups`, seeded store, 20 Vitest tests; Reviewer approved

## Next

Full ceremony for applications CRUD + kanban (parallel Backend + Frontend):

Lead → Architect → Reviewer → Backend + Frontend (parallel) → Tester → Reviewer → Lead → Scribe

## Blocked

Nothing.
