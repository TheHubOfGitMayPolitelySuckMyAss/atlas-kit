<!-- TEMPLATE — instantiate as docs/atlas/README.md in the host repo.
     Sections marked LOCALIZE are the only ones expected to differ per host;
     everything else is the convention and should track the kit origin. -->

# Atlas — the project's living map

**What this is.** A fractal, just-in-time map of every functional feature in this
project: why it exists, what it does, how it currently works, every decision that
shaped it (including reversals), and the ideas that were considered and killed.
It exists because AI-assisted building removes the cost of *creating* systems but
not the cost of *remembering* them — the management tax.

**Files-first.** The atlas is these markdown files; they are the product, not a
build input. A renderer is optional per host, and nothing here depends on one.
The map versions with the territory, shipping with the commits that change it.
Humans read the map one bounded screen at a time; agents read the files before
touching anything.

**The core rule: bounded levels, unbounded depth.** The total corpus may grow
forever; every individual screen may not. A card is two sentences. A node's How
fits on one screen. When a node outgrows its budget, split it into child nodes —
never let it sprawl in place.

## Structure

```
docs/atlas/<domain>/_domain.md          domain node (the top-level card)
docs/atlas/<domain>/<feature>.md        feature node
docs/atlas/<domain>/<feature>/<sub>.md  sub-feature node (when a feature outgrows)
```

Directory tree = feature tree. A feature with children keeps its own `.md` file
as the parent node AND gains a directory of the same name for children.

## Node format

```markdown
---
title: Stint-level embeddings
why: One or two sentences — WHY does this exist. The problem, not the mechanism.
what: One or two sentences — WHAT does success look like. Never a restatement of the mechanism (that's How's job). Locked at every level, domain and feature.
status: live            # live | parked | deprecated
---

## How

HOW do we do the work: current mechanics, present tense, rewritten IN PLACE
when behavior changes. Budget: one screen (~40 lines).

**Audience: the OWNER, not the agent.** The owner reads How to answer "how
does this work, again?" without having to ask — then checks Decisions to see
if a change he's considering retreads settled ground. So: plain language, his
vocabulary; what triggers it, what it does, what comes out; parameters with
their knob names. Code pointers are parenthetical anchors
`(lib/embeddings/embed.ts)`, never the spine of a sentence. Agents don't need
How for mechanics — they read the code, which is authoritative; nodes give them
the intent and history that code can't carry (Why/What/Decisions/Graveyard).

## Decisions

Append-only, newest last. Each entry: date, the decision, the why, an anchor
(SHA / migration / deep-dive-doc §). Reversals reference the entry they reverse.

- **2026-07-09** — Person-level embeddings replaced by stint-level; a perfect
  hit was buried at ~#500 by career dilution. (§1)

## Graveyard

Ideas considered and rejected, with the why. This is the anti-relitigation
section — check it before proposing something clever.

- **One vector per person** — buried a perfect hit at ~#500. Do not rebuild
  without new evidence. (§1)
```

**Parameters never appear in Why or What.** Tunable values (windows, thresholds,
cadences, caps) drift; principles don't. Why/What state the principle ("under the
result cap", "at the account's measured limits"); How carries the current value
WITH its knob name (`HARD_CAP=40`) so a knob change is one grep away from every
node that mentions it. Historical facts (incident dates, quoted anecdotes) are
immutable and exempt. Verbatim quotes containing parameters are how staleness
sneaks in — trim to the principle or date the quote.

## Maintenance contract

1. **Same-commit rule.** A commit that changes a feature's behavior updates that
   feature's node (How rewritten, Decisions appended) in the same commit.
2. **Decisions are append-only.** Never edit history; append the reversal.
3. **Graveyard before proposal.** Re-opening a buried idea requires arguing
   against the recorded reason, not from scratch.
4. **Split at the budget.** How > ~40 lines → extract child nodes.
5. **A Why/What change is a REFRAME, and a reframe is a decision.** The card
   always shows current truth — edit Why/What freely — but the old framing is
   memorialized as a Decisions entry in the same commit ("Reframed: was X, now
   Y, because Z"). The purpose may change; the fact that it changed may not be
   erased.
6. **Restructures conserve history.** When features split, merge, or get
   replaced, nodes follow the code's lifecycle under the same-commit rule —
   but Decisions/Graveyard entries MOVE to the successor node, never vanish.
   A killed feature's node flips to `deprecated` as a tombstone while its code
   exists; when the code is deleted, the node's residue moves to the domain's
   Graveyard.
7. **Deep-dive decision histories stay where they are** <!-- LOCALIZE: name the
   host's decision docs here, if any -->; nodes carry the feature-scoped
   decisions citing them and link them for archaeology; never duplicate
   wholesale.

The open work docket is the atlas's sibling: `docs/docket.md` — three states
(In Flight / Open–Unanswered / Done), same same-commit maintenance rule.

## Todos — the capture inbox (pluggable)

<!-- LOCALIZE: name this host's adapter. Known adapters: a DB table behind a
     lib module (DigiEric: atlas_notes via apps/web/lib/atlas-notes.ts; KQ:
     atlas_notes via lib/atlas/notes.ts). A repo with NO inbox files open
     loops to the docket instead — that is a valid configuration. -->

The convention reserves a mutable **Todos** queue per node: raw thoughts and
open loops, source-tagged (`manual` vs `extracted`), that are **larval
decisions, not truths** — so unlike everything else in the atlas they belong in
a mutable inbox behind an adapter, not in these files. When a todo is acted on,
the durable residue is promoted into the node's Decisions/Graveyard in the same
commit; resolved rows are just the receipt trail. Cross-cutting open questions
still go to `docs/docket.md` (Open — Unanswered) — node todos are for thoughts
anchored to one feature.

## The kit — what "installing the atlas" means

The atlas travels as a small set of files, canonical in the **kit origin
repo** <!-- LOCALIZE: origin URL lives in .claude/atlas-kit.json -->.
Installing it in a new repo = point an agent at the origin and ask for the
kit:

1. `docs/atlas/README.md` — this convention (instantiated from
   `templates/atlas-README.md`; LOCALIZE-marked sections adapted). The only
   required reading.
2. `docs/docket.md` — seeded with the three empty states.
3. `.claude/hooks/atlas-open-loop-sweep.sh` + its Stop entry in
   `.claude/settings.json` — the debounced periodic sweep ask.
4. `.claude/skills/sweep/SKILL.md` — `/sweep`, the on-demand session-close
   ritual; supersets the hook so a session is closeable at any moment.
5. `.claude/skills/rebrief/SKILL.md` — `/rebrief <topic>`, the sweep's
   read-side twin: composes a one-screen re-entry brief (first move first)
   from the node, the inbox, the docket, and git, so paused work restarts
   productive. Read-only by contract.
6. `.claude/hooks/atlas-kit-update-check.sh` + its SessionStart entry +
   `.claude/atlas-kit.json` (origin URL + installed SHA) — the daily drift
   check against the origin. Detect-only; it never writes files.
7. `.claude/skills/kit-update/SKILL.md` — `/kit-update`, the reviewable
   update ritual: byte-identical portable files copied, localized files
   reconciled by judgment, stamp advanced, one commit.
8. An atlas-contract test enforcing the node format in CI (seed from
   `templates/atlas-contract.test.ts`, adapt to the host's runner).
9. Host-specific and optional: a renderer and a todos capture inbox behind
   an adapter (Todos section above). A repo can run with neither — open
   loops go to the docket until an inbox exists.

Hooks and skills are byte-identical across installs by design; what localizes
is this README's marked sections, the contract test's runner, and the
renderer. Seed the first domain nodes from the code, then the maintenance
contract takes over. Local improvements to portable files go UPSTREAM to the
origin (see `/kit-update` §4), never fork silently.
