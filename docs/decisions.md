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
