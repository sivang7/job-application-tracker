# Start Squad

Human-facing entry point for new agent sessions in this repo.

## Auto-loaded onboarding

Squad workflow and current step are **auto-loaded** on every agent via
[`.cursor/rules/squad-overview.mdc`](.cursor/rules/squad-overview.mdc) (`alwaysApply: true`).
You do not need to paste a long handoff prompt.

## New agent — minimal prompt

```
You are the Lead. Execute the current step.
```

## Read when you need more detail

- [`STATUS.md`](STATUS.md) — full current state (step, done, next, blocked)
- [`PLAN.md`](PLAN.md) — full roadmap and squad design
- [`.cursor/rules/role-*.mdc`](.cursor/rules/) — role charters (pull in when delegating)

Optional: `@START_SQUAD.md` or `@STATUS.md` to pull these into context explicitly.

## End of each run

The Lead engages the **Scribe** to update `docs/decisions.md`, `STATUS.md`, and the
**Current status** block in `squad-overview.mdc`.

## Note (Windows)

`git commit` may hang in the agent terminal. Stage changes and give the user the
one-line commit command if needed.
