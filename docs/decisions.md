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
