---
name: sweep
description: Session-close ritual — run the atlas open-loop sweep plus the handoff layers (open work, memory, uncommitted work) so the session can be closed or /clear-ed at any moment with nothing lost. Use when the user says /sweep, "write the handoff", or signals they're about to close the session.
---

# /sweep — close the session with nothing in your head

The 45-minute Stop hook (`.claude/hooks/atlas-open-loop-sweep.sh`) owns the
*periodic* ask; this skill is the *on-demand* superset for session close. The
promise: after a clean sweep, Memories + Atlas + repo docs fully reconstruct
this session's context — the terminal window holds nothing.

Review the whole conversation since the last sweep (hook-fired or manual) and
work the layers in order. Each layer names its store; file to the RIGHT one —
duplicating across stores is as bad as dropping.

The sweep is a DIFF, not a re-audit: filings, resolutions, and Decisions
appends already made during the session count — never re-file or re-confirm
them. And it runs on a budget: the atlas layer (1) is ~2 minutes cold, end to
end. Plumbing time — hunting for where notes live, guessing schemas,
re-deriving connections — is failure, not thoroughness; the storage contract
is pinned (below) precisely so none of it recurs.

## Where open work goes — read this install's setting first

`"work"` in `.claude/atlas-kit.json` names this install's open-work store:

- **`docket`** — `docs/docket.md`, the kit's single-writer state file.
- **`tickets`** — the host's ticket system. `"ticketRitual"` in the same file
  names the doc that defines its flow (filing, approval, branches); absent,
  `docs/atlas/README.md` "Open work" names it.

Unset means inferred: `docs/docket.md` present = `docket`, absent =
`tickets`. Every layer below says what each mode does. Never hand-edit this
file to fit one mode — it is portable and `/kit-update` copies it
byte-identical; the setting is the per-install switch (v11).

## 0. One sweep at a time (the lock)

Two simultaneous sweeps in one repo write the same shared stores (git index,
memory, and in docket installs the docket); the loser commits the winner's
half-written state. Worktrees share those stores, so they share this lock.
Before touching anything, acquire it:

```bash
# Key on the repo's SHARED root, so a worktree session and a main-checkout
# session contend for ONE lock (osa-dev #30, upstreamed v11). --git-common-dir
# answers an absolute path in a worktree and a relative ".git" in a main
# checkout, so it has to be resolved. CLAUDE_PROJECT_DIR is the no-git
# fallback only: inside a worktree it points at the worktree, not the root.
GITDIR=$(git rev-parse --git-common-dir 2>/dev/null)
if [ -n "$GITDIR" ]; then
  SHARED_ROOT=$(cd "$GITDIR/.." && pwd)
else
  SHARED_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
fi
KEY=$(echo "$SHARED_ROOT" | md5 -q 2>/dev/null || echo "$SHARED_ROOT" | md5sum | cut -d' ' -f1)
LOCK="/tmp/claude-atlas-sweep-lock-$KEY"
now=$(date +%s)
if [ -f "$LOCK" ] && [ $((now - $(cut -d' ' -f1 "$LOCK"))) -lt 1800 ]; then
  echo "LOCKED: another sweep started $(( (now - $(cut -d' ' -f1 "$LOCK")) / 60 ))m ago"
else
  echo "$now ${CLAUDE_CODE_SESSION_ID:-nosession}" > "$LOCK" && echo "lock acquired"
fi
```

The lock file carries `<epoch> <session-id>`. In docket installs it doubles
as the **docket write lock**: the guard hook admits `docs/docket.md` edits
only from the session named in a fresh lock, on the default branch (see
step 2).

- **LOCKED** (fresh, <30 min): another session is mid-sweep. Stop gracefully —
  tell the owner which repo is locked and since when, do NOT proceed to any
  layer, and suggest re-running /sweep when the other session's receipt lands.
- **Stale** (≥30 min): a sweep that died without releasing. Take the lock and
  proceed, noting the takeover in the receipt.

The lock is released in step 5, alongside the debounce stamp.

## 1. Atlas sweep (same checklist the hook fires)

- **Open loops** — decisions pending on the owner, questions he must answer,
  ideas raised and dropped. **ASK FIRST, FILE AFTER**: list the candidates in
  chat, let him rule, and write ONLY what he keeps. A **null answer means drop
  it**, not file-it-anyway — most open loops are questions the AGENT raised,
  and filing a null makes a permanent entry nobody will remember the context
  for. If he is not present to answer, file nothing that turns on his
  judgment: carry the candidates to the next sweep, and file only verified
  facts with no decision attached. Ask in the three-part shape the README
  pins ("Open loops — how to ask") — the question, why it matters, the
  tradeoff — in plain words a non-developer can answer.
  What he keeps goes to ONE store, never both.
  Feature-anchored → the node's todo inbox as source='extracted', via the
  write route pinned in `docs/atlas/notes-adapter.md`. A repo without that
  file runs no inbox and files open loops to its open-work store instead.
  Cross-cutting or initiative-level, by mode:
  - **docket** → the docket "Open — Unanswered" INSTEAD, with at most a
    pointer from the note side; a note that restates a docket entry's status
    is the N-writers disease the docket rules exist to kill, and the notes
    contract test hunts "also in docket" phrasing.
  - **tickets** → a CANDIDATE TICKET through the host's full ritual: draft
    the WHY/WHAT/HOW in chat, and the ticket exists only on his "file it" —
    the chat conversation IS the approval; there is no parked half-approved
    state. **Tickets change the product, never operate the business** — a
    follow-up, a filing, a thing he must send is not a ticket; when a
    business todo has no home in the product, the GAP is the ticket. A note
    that restates a ticket's status is the N-writers disease; at most a
    pointer from the note side.
- **Decisions made** — anything ruled this session that changed a feature:
  confirm the owning node's Decisions got its append (same-commit rule); a
  reframe of Why/What is a decision too (convention rule 5).
- **Todos triage** — LIST-DRIVEN, never memory-scoped: read
  `docs/atlas/notes-adapter.md` and run its pinned open-notes query VERBATIM
  via its named connection route — never re-derive the table, columns, or
  connection (if the contract has drifted from reality, fixing that file is
  itself a sweep finding, same commit as whatever moved). No
  `notes-adapter.md` → no inbox → this bullet is a no-op. Disposition every
  note that (a) anchors to a node whose feature was touched since the last
  sweep, or (b) is near or past the freshness budget (pinned in the same
  file; check `verified_at`). Disposition
  = resolve (`done` if acted on — promote the durable residue into the node;
  `good_as_is` if reviewed and nothing owed) or re-affirm against CURRENT
  evidence — read the code/doc the note makes claims about, then bump
  `verified_at`. Never re-affirm from memory: the session that ships a
  note's subject is usually not the one that filed it, and only the queried
  list catches those. The receipt carries the count line:
  "todos: N→M open (X resolved, Y re-affirmed, Z filed)". An over-budget
  list blocks the safe-to-close verdict exactly like a red docket or an
  unfiled item.

## 2. Open-work handoff

### docket installs — fold, prune, then update

The docket has ONE writer at a time (hook-enforced): editing `docs/docket.md`
requires the default branch AND the step-0 lock — the guard matches the
lock's session id. Branch checks alone let two concurrent `main` sessions in
one clone clobber a docket (osa-dev, 2026-08-04); the lock closes that hole.
Any session, on any branch, can always file a docket-shaped update as a note
file in `docs/docket-inbox/<slug>.md` instead — one note per item: the item,
its new state, its ask line, pointers.

On the default branch, holding the lock, in order:

- **Fold the inbox** — apply each `docs/docket-inbox/*.md` note to the
  docket, then delete the note. The inbox must be empty after a sweep.
- **Prune** — any entry whose work shipped/settled this session MOVES to
  Done as a one-liner (never a SHIPPED stamp left in place); surviving
  entries keep their `**ON <owner>:**` / `**ON AGENT:**` / `**BLOCKED:**`
  first line current, ≤12 lines, history as pointers.
- **Update** — every In Flight item touched this session reflects its
  CURRENT state and concrete next step. Genuinely mid-task work gets a
  handoff note on its item: where it stands, what's next, any live reasoning
  a fresh session could not reconstruct from files. External state the repo
  can't confirm gets the ⚠unverified tag.
- **Run the docket contract test** (if the host has one — seeded from
  `templates/docket-contract.test.ts`). A red docket blocks the safe-to-close
  verdict exactly like an unfiled item.

### ticket installs — update what this session touched

Tickets take concurrent writes natively — no folding, no inbox, no write
lock. In order:

- **Close** — a ticket whose work merged this session closed itself via its
  PR ("Closes #n"); verify it did. Never close a ticket whose merge didn't
  happen.
- **Update** — every open ticket this session touched gets a COMMENT with its
  current state and concrete next step. Genuinely mid-task work gets a
  handoff comment: where it stands, what's next, any live reasoning a fresh
  session could not reconstruct from files. External state the repo can't
  confirm gets the ⚠unverified tag. (Post-merge, the body is a receipt —
  comments only, never body edits.)
- **New work surfaced this session** — through the candidate-ticket ritual in
  step 1, never filed solo.

## 3. Memory

- **Volatile state** (statuses, blockers, dated plans, "X not yet done"):
  update the project-state memory file; convert relative dates to absolute.
- **User/feedback facts** learned this session (preferences, corrections,
  how-to-work guidance): own memory file + MEMORY.md index line.
- **Stale entries**: anything this session proved wrong or overtook — update
  or delete. A memory that graduated into decisions.md/atlas becomes a
  pointer, not a copy.

## 4. Repo state

- `git status` — every uncommitted change is either committed now (with its
  same-commit atlas updates; in ticket installs, on its ticket's branch) or
  filed in the open-work store — a **docket entry** with an owner prefix, or
  a **ticket comment** (or a new ticket via the ritual) — naming the paths
  and what unblocks them. Nothing dangles silently.
- **Saying it in the receipt is NOT filing it.** The receipt is chat; chat is
  not a store. "Intentionally uncommitted" is only a real disposition when
  the open-work store carries it, because the next session reads the docket
  or the tickets and never reads this conversation. A sweep once listed four
  dirty paths in its receipt, wrote "already applied" in the docket, and
  declared safe-to-close; the work sat uncommitted for two days and was then
  swept into an unrelated commit by a `git add -A`. The docket said done, the
  tree said otherwise, and only the chat knew.
- **Do not emit the verdict over a dirty tree** unless every dirty path was
  committed this sweep or appears in a docket entry or ticket written or
  commented this sweep. Dirty files with neither are an unfiled item, and
  the verdict rule below applies.
- **Shared-checkout guard**, by mode:
  - **docket** — before committing a shared doc (docket, atlas nodes,
    README), `git diff` it and check whether its dirty content is YOURS.
    Another session's mid-flight edits → leave the file uncommitted and name
    it in the receipt. A foreign handoff that is clearly finished and marked
    keep-regardless may ride along — named in the commit message, never
    silently.
  - **tickets** — the shared checkout stays on the default branch and takes
    no commits; work ships from ticket branches. Dirty files there belong to
    no session — name them in the receipt and a ticket if they matter; never
    commit them from the shared checkout.

## 5. The closing question, then the receipt

Ask literally: **"Is there anything in this conversation a fresh session
could not reconstruct from files?"** If yes, it goes to the open-work store
(the docket, or a ticket via the ritual), the owning atlas node's Decisions
(a ruling), or memory (state/preference) — then re-ask.

Reset the hook's debounce stamp and release the sweep lock:

```bash
ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"
# TWO roots, on purpose (osa-dev #30). The debounce stamp is keyed per repo +
# SESSION and must stay keyed the way the hook keys it, so it uses ROOT. The
# lock is keyed on the repo's SHARED root, the same way step 0 keys it, so
# worktree and main-checkout sessions release the lock they acquired.
# Do not conflate the two keys.
GITDIR=$(git rev-parse --git-common-dir 2>/dev/null)
if [ -n "$GITDIR" ]; then
  SHARED_ROOT=$(cd "$GITDIR/.." && pwd)
else
  SHARED_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
fi
SID="${CLAUDE_CODE_SESSION_ID:-nosession}"
STAMPKEY=$(echo "$ROOT|$SID" | md5 -q 2>/dev/null || echo "$ROOT|$SID" | md5sum | cut -d' ' -f1)
LOCKKEY=$(echo "$SHARED_ROOT" | md5 -q 2>/dev/null || echo "$SHARED_ROOT" | md5sum | cut -d' ' -f1)
date +%s > "/tmp/claude-atlas-sweep-$STAMPKEY"   # debounce stamp
rm -f "/tmp/claude-atlas-sweep-lock-$LOCKKEY"    # release the lock (step 0)
```

Close with a one-screen receipt: what was filed where (or "clear" per layer),
ending with the verdict line — **"Sweep complete — safe to close."** Never
emit the verdict while any layer has an unfiled item.
