---
name: sweep
description: Session-close ritual — run the atlas open-loop sweep plus the handoff layers (docket, memory, uncommitted work) so the session can be closed or /clear-ed at any moment with nothing lost. Use when the user says /sweep, "write the handoff", or signals they're about to close the session.
---

# /sweep — close the session with nothing in your head

The 45-minute Stop hook (`.claude/hooks/atlas-open-loop-sweep.sh`) owns the
*periodic* ask; this skill is the *on-demand* superset for session close. The
promise: after a clean sweep, Memories + Atlas + repo docs fully reconstruct
this session's context — the terminal window holds nothing.

Review the whole conversation since the last sweep (hook-fired or manual) and
work the layers in order. Each layer names its store; file to the RIGHT one —
duplicating across stores is as bad as dropping.

## 0. One sweep at a time (the lock)

Two simultaneous sweeps in one checkout write the same shared stores (docket,
git index, memory); the loser commits the winner's half-written state. Before
touching anything, acquire the lock:

```bash
ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"
KEY=$(echo "$ROOT" | md5 -q 2>/dev/null || echo "$ROOT" | md5sum | cut -d' ' -f1)
LOCK="/tmp/claude-atlas-sweep-lock-$KEY"
now=$(date +%s)
if [ -f "$LOCK" ] && [ $((now - $(cat "$LOCK"))) -lt 1800 ]; then
  echo "LOCKED: another sweep started $(( (now - $(cat "$LOCK")) / 60 ))m ago"
else
  echo "$now" > "$LOCK" && echo "lock acquired"
fi
```

- **LOCKED** (fresh, <30 min): another session is mid-sweep. Stop gracefully —
  tell the owner which repo is locked and since when, do NOT proceed to any
  layer, and suggest re-running /sweep when the other session's receipt lands.
- **Stale** (≥30 min): a sweep that died without releasing. Take the lock and
  proceed, noting the takeover in the receipt.

The lock is released in step 5, alongside the debounce stamp.

## 1. Atlas sweep (same checklist the hook fires)

- **Open loops** — decisions pending on the owner, questions he must answer,
  ideas raised and dropped: file each to the node's todo inbox as
  source='extracted' — the Todos section of `docs/atlas/README.md` names the
  host's adapter (here an `atlas_notes` table; SQL insert via the Supabase
  MCP). A repo with no inbox files open loops to the docket instead.
  Initiative-level items also go to `docs/docket.md` "Open — Unanswered".
- **Decisions made** — anything ruled this session that changed a feature:
  confirm the owning node's Decisions got its append (same-commit rule); a
  reframe of Why/What is a decision too (convention rule 5).
- **Todos resolved** — anything shipped or settled: mark the `atlas_notes`
  row done and promote the durable residue into the node.

## 2. Docket handoff

- Every **In Flight** item touched this session reflects its CURRENT state
  and concrete next step.
- Work that is genuinely mid-task gets a handoff note on its docket item:
  where it stands, what's next, and any live reasoning a fresh session could
  not reconstruct from files (why we're mid-way into an odd approach, what
  was already tried). External state the repo can't confirm gets the
  ⚠unverified tag.

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
  same-commit atlas/docket updates) or explicitly named in the docket handoff
  as intentionally uncommitted, with why. Nothing dangles silently.
- **Shared-checkout guard:** before committing a shared doc (docket, atlas
  nodes, README), `git diff` it and check whether its dirty content is YOURS.
  Another session's mid-flight edits → leave the file uncommitted and name it
  in the receipt. A foreign handoff that is clearly finished and marked
  keep-regardless may ride along — named in the commit message, never
  silently.

## 5. The closing question, then the receipt

Ask literally: **"Is there anything in this conversation a fresh session
could not reconstruct from files?"** If yes, it goes to the docket (open
work), decisions.md (a ruling), or memory (state/preference) — then re-ask.

Reset the hook's debounce stamp and release the sweep lock:

```bash
ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"
KEY=$(echo "$ROOT" | md5 -q 2>/dev/null || echo "$ROOT" | md5sum | cut -d' ' -f1)
date +%s > "/tmp/claude-atlas-sweep-$KEY"      # debounce stamp
rm -f "/tmp/claude-atlas-sweep-lock-$KEY"      # release the lock (step 0)
```

Close with a one-screen receipt: what was filed where (or "clear" per layer),
ending with the verdict line — **"Sweep complete — safe to close."** Never
emit the verdict while any layer has an unfiled item.
