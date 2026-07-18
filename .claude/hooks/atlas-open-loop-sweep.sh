#!/usr/bin/env bash
# Atlas open-loop sweep — the deterministic trigger for the extraction ritual
# (Eric, 2026-07-16: "a doc updated 80% of the time is less useful than no
# doc at all"). The hook owns the ASK; the agent keeps the judgment.
#
# Fires at most once per INTERVAL of activity, per repo, only in repos that
# carry an atlas. exit 2 re-wakes the agent with the sweep checklist; the
# debounce stamp prevents a refire on the post-sweep stop. First stop of a
# fresh window initializes the stamp silently so sessions don't open with a
# sweep of nothing.

ROOT="${CLAUDE_PROJECT_DIR:-.}"
[ -d "$ROOT/docs/atlas" ] || exit 0

INTERVAL_S=$((45 * 60))
KEY=$(echo "$ROOT" | md5 -q 2>/dev/null || echo "$ROOT" | md5sum | cut -d' ' -f1)
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
1. OPEN LOOPS — decisions pending on the owner, questions he must answer, ideas raised and dropped: file each to atlas_notes (source='extracted') on the right node; initiative-level items also go to docs/docket.md "Open — Unanswered".
2. DECISIONS MADE — anything ruled this session that changed a feature: confirm the owning node's Decisions got its append (same-commit rule).
3. TODOS RESOLVED — anything shipped or settled: mark the atlas_notes row done and promote the durable residue into the node.
If nothing needs filing, continue with one line: "Atlas sweep: clear."
MSG
exit 2
