---
name: rebrief
description: Re-entry brief — get the owner immediately productive on paused work. Use when the user says "/rebrief <topic>", "pick X back up", "where were we on X", "get me back up to speed on X", or "what's the state of X".
---

# /rebrief — where you left off, one screen, first move first

The sweep (hook + `/sweep`) writes state down so nothing lives in a terminal
window; this skill reads it back. The promise: after days or weeks away from
a feature, one screen makes the owner immediately productive again. The
output contract is the feature — a rebrief that rambles has failed even if
every fact in it is right.

## 1. Resolve the topic

Match the request against, in order: atlas node filenames + titles
(`docs/atlas/*/*.md`), open work, memory topic files. Open work is
wherever this install keeps it — `"work"` in `.claude/atlas-kit.json`
(unset: `docs/docket.md` present = docket, absent = tickets): docket
entries in `docs/docket.md`, or open ticket titles + labels in the host's
ticket system (`"ticketRitual"` names the doc that defines it). Best match wins — NAME it in the brief's first line so a wrong guess
costs the owner one redirect message. NEVER an interactive picker. If
nothing matches, say so in one line and list the three nearest nodes.

The topic may span nodes (an initiative, not a feature). Fine — gather from
each owning node, still one brief.

## 2. Gather (parallel, read-only)

- **Node(s):** Why/What for orientation, the last ~5 Decisions entries, a
  Graveyard skim (so the brief can warn "we already tried X"). If the node
  links a deep-dive doc, read its tail.
- **Inbox:** open notes for the slug(s) — the host's Todos adapter is
  named in `docs/atlas/README.md`. Repo with no inbox: skip.
- **Open work**, by mode:
  - **docket** — In Flight + Open lines mentioning the topic, including any
    handoff notes from `/sweep`.
  - **tickets** — open tickets matching the topic (search, then read each
    hit with its comments): state, assignee, linked PR/branch, and the
    LATEST comments. Sweep handoffs land as ticket comments, so the tail
    comment is usually the freshest "where it stands." A closed ticket's
    body is the receipt for what shipped.
- **Git:** commits touching the feature's code paths since the owner last
  worked it (the node's SHA anchors date the last touch). Anything that
  changed behavior but isn't reflected in the node is **drift** — flag it.
- **Memory:** the project topic file, if one exists.

## 3. Compose — the hard format contract

One screen, ~150 words max, no preamble, omit any empty section:

- **Picking up:** `<node>` — one line on what it is. Skip when obvious.
- **First move:** THE single most productive next action, concrete enough
  to start typing. This is the payload; everything else is justification.
- **Where you left off:** last shipped thing (SHA + date) and last ruling.
- **Open on you:** what waits on the owner — questions waiting on them,
  and in ticket installs the open tickets assigned to them plus unanswered
  questions in ticket comments — max 3, one line each, ticket numbers
  named.
- **Changed while away:** commits/drift since the pause — only if real.
- **Graveyard warning:** one line, only if the likely path was already
  tried and buried.

Weigh recency: a 2-day pause needs two bullets; a 3-week pause earns the
full frame. Never pad a short answer to fill the format.

## 4. Read-only ritual

A rebrief never fixes, files, or commits anything — no docket edits, no
tickets, no comments; it is the ramp, not the work. One exception: drift
found in step 2 is named in the brief; offer to file or fix it as the
follow-up (in ticket installs, through the candidate-ticket ritual), after
the owner is moving.
