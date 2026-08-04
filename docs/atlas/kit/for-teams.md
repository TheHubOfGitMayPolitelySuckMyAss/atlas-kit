---
title: Multi-user (Team Atlas)
why: Atlas removes the cost of remembering a system, but only for ONE owner — asks route to one person, the docket guard keys off branch not identity, memory is per-user. A team sharing a codebase multiplies the coordination cost Atlas exists to kill, and Atlas's state already lives on git + a shared DB (both multi-writer), so the team version is an extension, not a rewrite.
what: A whole team's AI sessions read and write ONE shared Atlas — decisions, docket, todos — with no writer clobbering another and no human drowning in the review, so any teammate can resume any thread the way one owner resumes their own.
status: parked
---

<!-- Design sketch, not a built feature — status is `parked` because none of the
     mechanics below exist yet. This node is the on-ramp for anyone (human or
     agent) extending Atlas from single-owner to team use: the part you can't
     read off the code, because the single-owner assumptions are invisible
     until you hit them. Written 2026-07-24 for a team about to adopt the kit. -->

## How

**Single-owner in the bones (today).** Five spots assume one person on one
machine: (1) the docket guard keys off *branch*, not identity — three people on
`main` in three clones diverge exactly like the 780-line worktree rot it was
built to stop, **and this one is not team-only: it already bit solo** (osa-dev,
2026-08-04 — two concurrent sessions on `main` in the same clone both passed
the guard and hand-edited the docket; see Decisions); (2) the sweep locks are local-filesystem, so they mean nothing
across machines; (3) ask-routing hardcodes "ON ERIC"; (4) memory is per-user and
local — no team layer; (5) the inbox fold is "whoever merges, by hand."

**The pattern that already generalizes.** The docket-inbox move — never let N
writers edit one shared file; give each its own file/row and fold later — is
conflict-free *by construction* (CRDT-flavored) and already proven. Team Atlas is
mostly that one pattern applied everywhere, riding git's existing multi-writer
machinery (branches, PRs, review) instead of inventing coordination.

**Six-point architecture.**
1. Every store is append-only / one-file-or-row-per-item. The rendered
   `docket.md` becomes a **fold artifact** — ALL sessions (default branch
   included) write one-note-per-file to `docs/docket-inbox/`; a fold step
   renders the docket. **Ungated from the team decision** since 2026-08-04:
   it fixes a solo-mode failure that already happened (see Decisions).
2. Attribution on every note/row (who + which session).
3. `ON <name>` ask-routing resolved from git identity, not hardcoded.
4. Delete the locks — replace with append + CI fold (see Graveyard: do NOT build
   cross-machine locking).
5. Two-layer memory: personal (local, as now) + a small **curated team layer**,
   committed and reviewed like a decision.
6. Cross-author rebrief — "what did a teammate's AI decide that touches my work" —
   a read-side feature that doesn't exist yet.

**The risk that actually bites.** Not merge conflicts — the inbox pattern handles
those. It's **volume**: a team unleashing AI writes decisions/notes faster than
humans review them (KQ hit 41 notes in 4 days solo, 26 already stale when
audited). The list-driven triage + freshness budget become load-bearing; whether
a human keeps pace is what decides between lifesaver and midden. Design for review
throughput FIRST.

## Decisions

- **2026-07-24** — Multi-user ruled possible-but-unbuilt: the architecture
  supports it (state already on git + a shared DB; the docket-inbox is the
  multi-writer primitive), the implementation is single-owner. Six-point plan
  sketched. Raised when a client was about to put AI on a whole team and Eric
  weighed sending the repo as the single-owner starting point. (docket: Open —
  ON ERIC.)
- **2026-08-04** — Assumption (1) proven to bite SOLO, not just teams: two
  concurrent sessions on `main` in the same osa-dev clone both passed the
  branch-only docket guard and hand-edited `docket.md`; one shipped an edit
  that failed the docket contract test during a production deploy (osa-dev
  5627bf5, repaired by d154faa within minutes). Consequence: architecture
  item 1 (docket as fold artifact) is UNGATED from the team/client decision
  and filed as its own docket item. The rest of the six-point plan was
  compared against an independent derivation in the osa-dev session and held.

## Graveyard

- **Distributed cross-machine locking** — rejected at design 2026-07-24. Atlas
  needs no real-time mutual exclusion if every writer appends to its own
  file/row: git + a CI fold + append-only stores give safe concurrency without
  the distributed-systems tax. Do not rebuild without a store that genuinely
  can't be made append-only.
- **DB rows as the docket's multi-writer store** — the osa-dev session's
  independent derivation (2026-08-04), rejected against the fold artifact:
  appends to distinct files need no locks, no schema, and no connection
  plumbing, and ride git's existing merge/review machinery. Do not rebuild
  without a host that has no repo to append to.
