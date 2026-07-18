---
name: kit-update
description: Pull the latest atlas kit from its origin repo into this install — reviewable, byte-identical for portable files, agent judgment for localized ones. Use when the update-check hook reports a kit update available, or the user says "/kit-update" or "update the atlas kit".
---

# /kit-update — sync this install with the kit origin

The daily SessionStart hook only *detects* drift; this skill *applies* it.
The split is deliberate: updates are always reviewed by an agent in the
host repo's context, never auto-copied, so a kit regression can't silently
propagate to every install.

## 1. Fetch the origin

Read `origin` + installed `sha` from `.claude/atlas-kit.json`. Shallow-clone
the origin to the scratchpad (`git clone --depth 50 <origin> <scratch>/atlas-kit-update`),
then read the changelog: `git log --oneline <installed-sha>..HEAD` (if the
installed SHA is too old for the shallow history, deepen or note it).

## 2. Apply — two classes of file, two rules

**Byte-identical (copy verbatim, then diff to confirm what changed):**
- `.claude/hooks/atlas-open-loop-sweep.sh`
- `.claude/hooks/atlas-kit-update-check.sh`
- `.claude/skills/sweep/SKILL.md`
- `.claude/skills/rebrief/SKILL.md`
- `.claude/skills/kit-update/SKILL.md` (this file — yes, it updates itself)

**Localized (never overwrite; reconcile by judgment):**
- `docs/atlas/README.md` — if the origin's `templates/atlas-README.md`
  changed the CONVENTION (node format, maintenance rules, kit list), port
  those sections into the host's README while preserving its localized
  parts (Todos adapter, renderer notes, deep-dive doc links).
- `.claude/settings.json` — only touch if the kit added/changed a hook
  entry; merge, never replace (hosts carry their own unrelated hooks).
- Templates (`templates/*`) are install-time seeds — ignore on update.

## 3. Stamp, commit, report

- Update `.claude/atlas-kit.json`: new `sha`, `updated` date.
- Commit with EXPLICIT paths (never `git add -A`), message
  `chore(atlas-kit): update to <sha7> — <one-line summary of what changed>`.
- If `.claude/settings.json` changed, tell the owner: running sessions need
  a `/hooks` refresh (or restart) to honor hook changes; skills update
  automatically for new sessions.
- Report one screen: changelog since the old SHA, which files changed,
  anything localized that needs the owner's eye. Clean up the scratch clone.

## 4. Contributing back

If the host repo has locally improved a portable file (hook or skill), the
flow is reversed: the improvement is committed to the ORIGIN repo (with its
own atlas maintained — the kit documents itself), then every install picks
it up on its next daily check. Never let a portable file fork silently: a
local edit to one either goes upstream or gets reverted on next update.
