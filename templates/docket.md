# Docket — open work, one screen

The atlas's sibling: what's moving, what's waiting on the owner, what's done.
STATE, not a log. Rules (enforced by the docket contract test + the
single-writer hook):

- **One writer at a time:** edited on the default branch only, by the session
  holding the write lock (the sweep lock, hook-enforced — branch checks alone
  let two `main` sessions in one clone clobber a docket, 2026-08-04). Every
  other session files one-note-per-file updates in `docs/docket-inbox/`; the
  next fold applies them and deletes the notes.
- **Every In Flight / Open entry leads with its ask:** `**ON <OWNER>:**` /
  `**ON AGENT:**` / `**BLOCKED:**` + one line. Owner entries sort first.
- **Entries stay short** (≤12 lines): history is pointers (decision doc §,
  atlas node, commit), never inline prose.
- **Done things MOVE to Done** (one-liners, newest first) — never annotated
  in place with SHIPPED/RESOLVED stamps.

## In Flight

## Open — Unanswered

## Done
