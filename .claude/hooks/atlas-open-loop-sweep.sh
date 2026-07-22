#!/usr/bin/env bash
# Atlas open-loop sweep — the deterministic trigger for the extraction ritual
# (Eric, 2026-07-16: "a doc updated 80% of the time is less useful than no
# doc at all"). The hook owns the ASK; the agent keeps the judgment.
#
# Fires at most once per INTERVAL of activity, per repo PER SESSION, only in
# repos that carry an atlas. exit 2 re-wakes the agent with the sweep
# checklist; the debounce stamp prevents a refire on the post-sweep stop.
# First stop of a fresh window initializes the stamp silently so sessions
# don't open with a sweep of nothing.
#
# The stamp key includes the session id (from the hook's stdin JSON): a
# repo-only key made concurrent sessions share one cooldown, so whichever
# session swept first muted the others for 45m and their work went unreviewed.

ROOT="${CLAUDE_PROJECT_DIR:-.}"
[ -d "$ROOT/docs/atlas" ] || exit 0

INTERVAL_S=$((45 * 60))
SID=$(cat 2>/dev/null | sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
KEY=$(echo "$ROOT|${SID:-nosession}" | md5 -q 2>/dev/null || echo "$ROOT|${SID:-nosession}" | md5sum | cut -d' ' -f1)
STATE="/tmp/claude-atlas-sweep-$KEY"

now=$(date +%s)
if [ ! -f "$STATE" ]; then
  echo "$now" > "$STATE"
  exit 0
fi
last=$(cat "$STATE" 2>/dev/null || echo 0)
[ $((now - last)) -lt $INTERVAL_S ] && exit 0
echo "$now" > "$STATE"

cat >&2 <<'MSG'
ATLAS SWEEP (debounced ~45m): before ending, review the conversation since the last sweep:
1. OPEN LOOPS — decisions pending on the owner, questions he must answer, ideas raised and dropped: file each to ONE store — feature-anchored to the node's inbox (source='extracted'), cross-cutting/initiative-level to docs/docket.md "Open — Unanswered" INSTEAD. Never both; never restate docket status in a note.
2. DECISIONS MADE — anything ruled this session that changed a feature: confirm the owning node's Decisions got its append (same-commit rule).
3. TODOS TRIAGE — QUERY the full open-notes list (adapter, not memory) and disposition every note on a node touched since the last sweep plus every note near/past the freshness budget: resolve (done/good_as_is, residue promoted to the node) or re-affirm against current evidence and bump verified_at.
If nothing needs filing, continue with one line: "Atlas sweep: clear."
MSG
exit 2
