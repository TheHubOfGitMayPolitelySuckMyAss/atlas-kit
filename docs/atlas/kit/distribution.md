---
title: Distribution — installs and updates
why: Copied-file tooling forks silently — each repo's copy drifts as sessions improve one and not the others, and nobody notices until behavior differs.
what: Every install knows within a day that the origin moved, updates through one reviewable ritual, and local improvements flow back upstream instead of forking.
status: live
---

## How

An install is stamped by `.claude/atlas-kit.json` — `{origin, sha,
installed/updated, work, ticketRitual?}`. `work` is the install's open-work
store, `"docket"` or `"tickets"` (v11); the portable files branch on it, so
they stay byte-identical across both kinds of install. Three moving parts:

- **Detect** (`hooks/atlas-kit-update-check.sh`, SessionStart, debounced
  24h per repo): `git ls-remote <origin> HEAD` vs the stamped SHA — no
  clone, no file writes, silent when offline or when no stamp exists (the
  origin repo itself carries no stamp). On drift it emits one context line:
  "kit update available, run /kit-update".
- **Apply** (`skills/kit-update`): shallow-clone origin to scratch, copy
  the portable files byte-identical (three hooks, three skills — including
  itself; the docket guard only where `work` is `docket`), reconcile localized files by judgment (host atlas README,
  settings.json merges), advance the stamp, one explicit-paths commit.
- **Contribute back**: a local improvement to a portable file goes to the
  origin repo (whose own atlas records the decision), then reaches every
  install on their next daily check. Portable files never fork silently.

`VERSION` is a human-readable counter for changelogs; the SHA is the actual
version. Detect and apply are deliberately split: the hook can't write
files, so a kit regression can't propagate unreviewed.

## Decisions

- **2026-07-18** — Detect-only hook + agent-reviewed apply, split on
  purpose: auto-copying files from a remote on session start is a supply
  chain risk and un-reviewable; one context line + a skill keeps the owner's
  agent in the loop. (Born this commit.)
- **2026-07-18** — `ls-remote` over clone/fetch for the daily check: zero
  disk, zero working-tree risk, works with the keychain https creds already
  on the machine. (Born this commit.)
- **2026-07-18** — Repo made PUBLIC on Eric's call ("I'm fine making it
  public"), so anyone can install with one sentence and their daily check
  needs no credentials. Softens the 7/15 "just for me, open-source is a
  distant maybe" posture for DISTRIBUTION only — public repo ≠ open-source
  project: no license file yet, no issues triage, no contribution promise.
  Those become decisions if a stranger ever actually shows up.
- **2026-07-18** — MIT license added (Eric's ask, hours after going
  public): full open posture on the grant. What remains deliberately
  unpromised: issues triage, contribution review, any support expectation.
- **2026-08-04** — Install ritual: renderer flipped to DEFAULT-ON for hosts
  with an authenticated admin surface, mounted at `/admin/atlas`; the agent
  asks only when there is no obvious mount point, and "optional" is reserved
  for hosts with nowhere to render (CLIs, libraries). Flowed back from the
  ThunderviewOS install: the "host-specific and optional" bucket let the
  installing agent skip the renderer, and Eric's first post-install question
  was the atlas URL — the revealed default is renderer-on for web apps
  (marcoullier-com and knownquantity both mount `/admin/atlas`). (v7)

- **2026-10-08** — Open-work store became a per-install SETTING (`work` in
  `.claude/atlas-kit.json`: `docket` | `tickets`, inferred from
  `docs/docket.md` when unset; `ticketRitual` names a ticket host's flow
  doc). The sweep hook, `/sweep` and `/rebrief` carry both wordings and
  branch on it; `/kit-update` installs the docket guard only for docket
  installs, and the guard itself goes inert under `tickets`. Forced by
  osa-dev, which moved to GitHub tickets 2026-10-05 by hand-editing three
  portable files: every `/kit-update` would have reverted them and
  reinstalled the docket guard (osa-dev #164; the v10 push surfaced it).
  Docket-mode hook output is byte-identical to v10, verified by diff.
  Upstreamed in the same change: osa-dev's worktree-safe sweep lock (keyed
  on the repo's shared root, osa-dev #30), with the docket guard keyed the
  same way; identical to before for any checkout that isn't a worktree.
  Eric's ruling, in chat: fix it in the kit first, then osa-dev takes a
  normal update. Setting name and shape are the builder's choice. (v11)

## Graveyard

- **Auto-update on session start** — rejected at design: a kit bug would
  propagate to every install overnight with no review. The hook detects;
  only /kit-update writes.
- **Cron/launchd-based checking** — rejected: a daily SessionStart debounce
  gives the same cadence with zero infrastructure, and a check is only
  useful when a session is about to run anyway.
