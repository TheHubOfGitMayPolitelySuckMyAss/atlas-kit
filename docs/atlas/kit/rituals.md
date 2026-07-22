---
title: Rituals — sweep, rebrief, kit-update
why: A doc updated 80% of the time is less useful than no doc at all (Eric, 2026-07-16); rituals only hold if something deterministic owns the ASK while the agent keeps the judgment.
what: State is written down continuously (sweep), read back on demand (rebrief), and the tooling that does both stays current (kit-update) — a session is closeable at any moment and paused work restarts productive in one screen.
status: live
---

## How

Three rituals, one pattern — deterministic trigger, agent judgment:

- **Sweep** (`hooks/atlas-open-loop-sweep.sh`, Stop hook, debounced
  `INTERVAL_S`=45m per repo): blocks the agent's stop with exit 2 and feeds
  it the checklist — file open loops (to ONE store: node inbox or docket,
  never both), confirm same-commit Decisions appends, and triage todos
  LIST-DRIVEN: query the full open-notes list, disposition every note on a
  touched node or near/past the freshness budget (resolve, or re-affirm and
  bump `verified_at`). Fires only in repos carrying `docs/atlas`. `/sweep`
  (skill) is the on-demand superset for session close: atlas sweep + docket
  handoff + memory + repo state, with a per-repo lock so two sessions can't
  sweep the same checkout at once.
- **Rebrief** (`skills/rebrief`): the read-side twin. Resolves a topic to
  its node(s), gathers Decisions/Graveyard + open todos + docket + git
  drift, composes one screen (~150 words), first move first. Read-only by
  contract; never an interactive picker.
- **Kit-update** (`skills/kit-update`): applies kit updates — see
  [distribution](distribution.md).

## Decisions

- **2026-07-16** — The sweep ask moved from convention to a Stop hook: the
  hook owns the ASK, the agent keeps the judgment. (DigiEric 4b8ec94)
- **2026-07-17** — `/sweep` skill added as the on-demand superset; sweep
  lock added so concurrent sessions can't corrupt shared stores. (DigiEric)
- **2026-07-18** — `/rebrief` built on Eric's confirmed felt need; hard
  format contract (one screen, first move first) IS the feature. (DigiEric
  56563f9)
- **2026-07-22** — Docket declared single-writer (default branch only,
  `hooks/docket-single-writer.sh` PreToolUse guard; branch sessions file
  `docs/docket-inbox/` notes) and its format machine-enforced
  (`templates/docket-contract.test.ts`: ask-first entries, ≤12 lines,
  done-stamps in open entries fail CI). Sweep's docket step gained
  fold-inbox + prune; step-5 debounce stamp fixed to the repo+session key
  (matches the hook). Forced by the KQ docket rotting to 780 lines under N
  worktree writers — Eric: worktrees are antithetical to a single global
  state file, so make it not one. (KQ session 2026-07-22)

- **2026-07-22** — Todos inbox given the docket treatment: freshness
  contract (`verified_at` + budget, default 14d), list-driven triage in the
  sweep (query the open list; "anything shipped this session" phrasing
  banned — it only ever resolves what the current session remembers), and a
  no-double-filing rule (docket is the single writer for cross-cutting
  items; "also in docket" notes fail the new
  `templates/notes-contract.test.ts`). Forced by the KQ inbox reaching 41
  open notes / 0 resolutions in 4 days — 26 of the 41 were already shipped,
  superseded, or docket dups when audited. (KQ session 2026-07-22)

## Graveyard

- **Auto-open re-entry brief at session start** — never built, deliberately:
  a brief that fires unasked on every session is noise (most sessions aren't
  re-entries), and violates the no-surprise-surfaces instinct. Rebrief is
  pull, not push; only the cheap update-check is push.
