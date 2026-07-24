<!-- TEMPLATE — instantiate as docs/atlas/notes-adapter.md in any host repo
     that runs a todos inbox. EVERYTHING here is LOCALIZE — the file's whole
     job is to pin THIS install's storage contract. A repo with no inbox
     does not create this file; its absence IS the no-inbox signal the
     sweep hook checks. NOTE: this file lives in docs/atlas/ but is
     convention prose, NOT a node — the seeded atlas-contract test already
     excludes it from node checks; a host with a RENDERER must skip it in
     node parsing too (the DigiEric install's readAtlas tripped on exactly
     this). -->

# Notes adapter — the pinned storage contract

This file exists so a sweep can run **cold in ~2 minutes**: an agent with no
memory of this install reads it and queries the inbox immediately — no
searching for adapter scripts, no guessing table or column names, no
re-deriving the connection. Born 2026-07-23: a sweep in the knownquantity
install burned 10+ minutes re-deriving exactly this plumbing (guessed
`node` for the real `node_slug`, hunted for a script that doesn't exist),
and paid the same tax on every long-context sweep because nothing persisted
it.

**The rule:** the sweep reads this file and runs the pinned query verbatim —
it never re-derives the plumbing. If this file drifts from reality (schema
migration, moved table), fixing THIS FILE is itself a sweep finding, in the
same commit as whatever moved.

## Store

Supabase table `atlas_notes` (project: <!-- project ref or name -->).

## Columns

`id, node_slug, body, source, status, created_at, resolved_at, verified_at`

- `node_slug` — the atlas node path the note anchors to (e.g. `kit/rituals`)
- `source` — `manual` | `extracted`
- `status` — `open` | `done` | `good_as_is`

## Open-notes query (canonical — run exactly this)

```sql
select id, node_slug, body, source, status, created_at, verified_at
from atlas_notes
where status = 'open'
order by verified_at asc nulls first;
```

## Connection route

<!-- Name the ONE way an agent runs the query in this install, e.g.:
     - MCP: mcp__supabase__execute_sql (project ref <ref>)
     - lib module: apps/web/lib/atlas-notes.ts (listOpen())
     - CLI: psql "$DATABASE_URL" -c "<query>"        -->

## Write routes

- **File:** insert with `status='open'`, `source`, `verified_at = now()`.
- **Resolve:** set `status` to `done` (residue promoted to the node) or
  `good_as_is`, and `resolved_at = now()`.
- **Re-affirm:** bump `verified_at = now()` — only after checking the note's
  claim against current code/docs, never from memory.

## Freshness budget

**14 days** — must match `BUDGET_DAYS` in the notes contract test.
