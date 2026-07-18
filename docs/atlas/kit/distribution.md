---
title: Distribution — installs and updates
why: Copied-file tooling forks silently — each repo's copy drifts as sessions improve one and not the others, and nobody notices until behavior differs.
what: Every install knows within a day that the origin moved, updates through one reviewable ritual, and local improvements flow back upstream instead of forking.
status: live
---

## How

An install is stamped by `.claude/atlas-kit.json` — `{origin, sha,
installed/updated}`. Three moving parts:

- **Detect** (`hooks/atlas-kit-update-check.sh`, SessionStart, debounced
  24h per repo): `git ls-remote <origin> HEAD` vs the stamped SHA — no
  clone, no file writes, silent when offline or when no stamp exists (the
  origin repo itself carries no stamp). On drift it emits one context line:
  "kit update available, run /kit-update".
- **Apply** (`skills/kit-update`): shallow-clone origin to scratch, copy
  the portable files byte-identical (both hooks, three skills — including
  itself), reconcile localized files by judgment (host atlas README,
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

## Graveyard

- **Auto-update on session start** — rejected at design: a kit bug would
  propagate to every install overnight with no review. The hook detects;
  only /kit-update writes.
- **Cron/launchd-based checking** — rejected: a daily SessionStart debounce
  gives the same cadence with zero infrastructure, and a check is only
  useful when a session is about to run anyway.
