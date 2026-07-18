# Docket — open work

The atlas's sibling: what's moving, what's waiting on the owner, what's done.
Same same-commit maintenance rule as the atlas.

## In Flight

## Open — Unanswered

- **[2026-07-18] Contract-test template is untested as a template** — it's
  KQ's self-contained vitest file copied verbatim; first non-vitest host
  will reveal what actually needs adapting. Revisit at install #3.
- **[2026-07-18] Private-repo auth assumption** — the update check and
  /kit-update assume the host machine holds credentials for the origin
  (keychain https or gh). True for all current installs (one owner, one
  machine). Revisit if an install ever lives on a box without them.

## Done

- **2026-07-18** — MIT LICENSE added on Eric's ask, same day the repo went
  public — closes the no-license loop; anyone now has a formal grant to
  use/copy/modify.
- **2026-07-18** — Repo born: extracted from DigiEric (origin) + KQ (second
  consumer, whose port proved what's portable) on Eric's go. Carries the
  convention template, the two hooks (sweep, update-check), three skills
  (/sweep, /rebrief, /kit-update), seeds, and its own recursive atlas.
  Amends the 7/15 "skill + template, not a repo" packaging ruling — the
  daily-update requirement is what forced a repo (a skill can't be a
  distribution channel; a repo with ls-remote drift detection can).
