# Docket — open work

The atlas's sibling: what's moving, what's waiting on the owner, what's done.
Same same-commit maintenance rule as the atlas.

## In Flight

## Open — Unanswered

- **ON ERIC:** should kit updates ask you before applying, or stay
  silent-but-committed? [2026-07-23] Raised when Eric noticed he has never
  seen the "run /kit-update" nudge — the SessionStart notice targets the
  agent, which applies updates mid-session; the audit surface is the
  `chore(atlas-kit)` commit trail. Working fine in practice (v2→v6 all
  landed), so status quo holds until ruled. If "ask first": one-line change
  to the hook's nudge text.
- **ON AGENT:** revisit contract-test template portability at install #3.
  [2026-07-18] It's KQ's self-contained vitest file copied verbatim; first
  non-vitest host will reveal what actually needs adapting.

## Done

- **2026-08-04** — Docket write-lock shipped (v8): editing `docs/docket.md`
  now requires the default branch AND the sweep lock, which carries the
  editing session's id; every other session — same clone included — files
  `docs/docket-inbox/` notes, folded at the next sweep. Closes the solo hole
  osa-dev hit this morning (5627bf5/d154faa); the cross-machine/CI-fold team
  slice stays parked in `for-teams.md`.
- **2026-08-04** — Team Atlas hand-off question (open since 2026-07-24) closed
  by events: Eric had already sent the repo to the client — as-is, with the
  note that the client's own Claude Code would make the small multi-user
  changes; `for-teams.md` is their on-ramp. Remaining team items stay parked
  in that node until an install needs them; the fold-artifact work continues
  above (ON AGENT). Lesson: the entry outlived the real world by days and
  cost Eric an email dig when resurfaced — a stale ON ERIC ask is a question,
  never a reminder.
- **2026-08-04** — Install ritual: renderer default-on for admin-surface
  hosts (`/admin/atlas`), ask only without an obvious mount point, "optional"
  reserved for nowhere-to-render hosts — v7, flowed back from the
  ThunderviewOS install (its own renderer port happens on that side).
- **2026-07-18** — MIT LICENSE added on Eric's ask, same day the repo went
  public — closes the no-license loop; anyone now has a formal grant to
  use/copy/modify. Going public also closed the private-repo auth loop:
  anonymous ls-remote works, so installs need no credentials for the origin
  (reopen only if the origin ever goes private again).
- **2026-07-18** — Repo born: extracted from DigiEric (origin) + KQ (second
  consumer, whose port proved what's portable) on Eric's go. Carries the
  convention template, the two hooks (sweep, update-check), three skills
  (/sweep, /rebrief, /kit-update), seeds, and its own recursive atlas.
  Amends the 7/15 "skill + template, not a repo" packaging ruling — the
  daily-update requirement is what forced a repo (a skill can't be a
  distribution channel; a repo with ls-remote drift detection can).
