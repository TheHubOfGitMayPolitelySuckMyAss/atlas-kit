---
title: Kit
why: AI-assisted building removes the cost of creating systems but not the cost of remembering them; the atlas answers that in one repo, but Eric runs many — the tax multiplies per repo unless the tooling travels as one maintained thing.
what: Every install runs the same rituals from the same canonical files, learns about improvements within a day, and updates through a reviewable ritual — no install ever forks silently or rots quietly.
status: live
---

## How

The kit is this repo's `.claude/` tree (hooks + skills, byte-identical
across installs) plus `templates/` (install-time seeds that hosts localize).
Two feature nodes carry the mechanics: [rituals](rituals.md) — what the
hooks and skills do; [distribution](distribution.md) — how installs detect
and apply updates. Current installs: DigiEric (the origin repo the kit was
extracted from), knownquantity, and this repo itself (dogfood — the kit's
own atlas is maintained by the kit's own sweep hook).

## Decisions

- **2026-07-18** — Extracted to a standalone repo, amending the 7/15 ruling
  that packaging would be "a Claude Code skill + template, NOT a repo": the
  daily-update requirement forced it — a skill can't be a distribution
  channel, a repo with drift detection can. (Born this commit.)

## Graveyard

- **npm package / service packaging** — rejected 2026-07-15; the kit is
  files + rituals, not code with a runtime. A package manager adds a build
  step to what is fundamentally "copy these files and follow the README."
