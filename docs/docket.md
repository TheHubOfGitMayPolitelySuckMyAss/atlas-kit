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
