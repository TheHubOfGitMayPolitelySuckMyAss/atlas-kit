# Docket — open work

The atlas's sibling: what's moving, what's waiting on the owner, what's done.
Same same-commit maintenance rule as the atlas.

## In Flight

## Open — Unanswered

- **ON AGENT:** build the docket fold artifact — ALL sessions (default branch
  included) write one-note-per-file to `docs/docket-inbox/`; a fold step renders
  `docs/docket.md`; the single-writer guard then blocks direct docket edits
  everywhere. [2026-08-04] Ungated from the Team Atlas decision: two concurrent
  sessions on `main` in one osa-dev clone both passed the branch-only guard, and
  a contract-failing docket edit reached a production deploy (osa-dev 5627bf5,
  repaired d154faa). Design in `docs/atlas/kit/for-teams.md` §How, item 1.
- **ON ERIC:** multi-user / "Team Atlas" — pursue the rest, and how to hand it
  to the client? [2026-07-24] A client is about to put AI on his whole team;
  Eric weighed sending this repo as the single-owner starting point.
  Feasibility, the six-point architecture, and the volume risk live in the
  parked node `docs/atlas/kit/for-teams.md` (the client's on-ramp; committed
  2026-08-04, fold-artifact item split out above). Open on Eric: (a) send repo
  as-is now that the map ships in it, (b) also spec/build the remaining items
  (identity-based ask-routing, note attribution, team memory, cross-author
  rebrief).
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
