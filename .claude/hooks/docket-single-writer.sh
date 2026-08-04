#!/usr/bin/env bash
# Docket write-lock guard — docs/docket.md has ONE writer at a time: the
# session holding a fresh write lock, on the default branch. A state file
# with N concurrent writers accretes contradictions: each session truthfully
# updates its copy, every other copy goes stale, and merges keep both sides
# because neither is wrong (Eric, 2026-07-22, after the KQ docket rotted to
# 780 lines). Branch checks alone proved insufficient 2026-08-04 (osa-dev):
# two concurrent sessions on main in the SAME clone both passed the old
# branch-only guard and a contract-failing docket edit reached a production
# deploy. Any session may instead file one-note-per-file updates in
# docs/docket-inbox/ — conflict-free by construction; the fold (sweep skill,
# docket step) applies them under the lock and deletes them.
#
# The lock file is the sweep lock (sweep skill step 0), format
# "<epoch> <session_id>": a sweep holds it for its whole run; a quick
# same-commit docket update takes it, edits, releases. Stale (>30m) means a
# dead session — takeable. The lock stays LOCAL-filesystem on purpose:
# cross-machine coordination is the parked team slice (docs/atlas/kit/
# for-teams.md), and the Graveyard there buries distributed locking.
#
# PreToolUse on Edit|Write. exit 2 blocks the call and shows stderr to the
# agent. The branch and lock key are read from the TARGET FILE's checkout,
# not the session's project dir — a worktree session editing the primary
# checkout's docket must hold THAT checkout's lock.

INPUT=$(cat 2>/dev/null)
FILE=$(echo "$INPUT" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
case "$FILE" in
  */docs/docket.md | docs/docket.md) ;;
  *) exit 0 ;;
esac
SID=$(echo "$INPUT" | sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)

DIR=$(dirname "$FILE")
[ -d "$DIR" ] || DIR="${CLAUDE_PROJECT_DIR:-.}"
BRANCH=$(git -C "$DIR" branch --show-current 2>/dev/null)
[ -z "$BRANCH" ] && exit 0 # detached HEAD / not a repo — not an editing session
DEFAULT=$(git -C "$DIR" symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')
DEFAULT="${DEFAULT:-main}"

ROOT=$(git -C "$DIR" rev-parse --show-toplevel 2>/dev/null || echo "$DIR")
KEY=$(echo "$ROOT" | md5 -q 2>/dev/null || echo "$ROOT" | md5sum | cut -d' ' -f1)
LOCK="/tmp/claude-atlas-sweep-lock-$KEY"

now=$(date +%s)
LOCKSTATE="no lock held"
if [ "$BRANCH" = "$DEFAULT" ] && [ -f "$LOCK" ]; then
  read -r LOCKTS LOCKSID < "$LOCK"
  AGE=$((now - ${LOCKTS:-0}))
  if [ "$AGE" -lt 1800 ] && [ -n "$LOCKSID" ] && [ "$LOCKSID" = "${SID:-nosession}" ]; then
    exit 0
  fi
  if [ "$AGE" -lt 1800 ]; then
    LOCKSTATE="lock held by another session ($((AGE / 60))m ago)"
  else
    LOCKSTATE="stale lock ($((AGE / 60))m old — takeable)"
  fi
fi

cat >&2 <<MSG
BLOCKED: docs/docket.md has ONE writer at a time — the session holding the write lock, on '$DEFAULT'.
(Branch checks alone failed 2026-08-04: two sessions on main in one clone clobbered a docket.)
PREFERRED: file the update as a note instead — docs/docket-inbox/<short-slug>.md (one note per
item), stating the docket item, its new state (in-flight/open/done), its ON <owner> / ON AGENT /
BLOCKED ask line, and pointers (decisions §, atlas node, commit). The next fold (sweep skill,
docket step) applies it. To edit directly on '$DEFAULT' (folding, or an immediate update):
  echo "\$(date +%s) \${CLAUDE_CODE_SESSION_ID:-nosession}" > $LOCK   # take (only if absent/stale)
  rm -f $LOCK                                                        # release when done
This checkout: branch '$BRANCH'; $LOCKSTATE.
MSG
exit 2
