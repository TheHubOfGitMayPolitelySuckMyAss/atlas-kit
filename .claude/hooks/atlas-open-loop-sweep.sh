#!/usr/bin/env bash
# Atlas open-loop sweep — the deterministic trigger for the extraction ritual
# (Eric, 2026-07-16: "a doc updated 80% of the time is less useful than no
# doc at all"). The hook owns the ASK; the agent keeps the judgment.
#
# Fires at most once per INTERVAL of activity, per repo PER SESSION, only in
# repos that carry an atlas. The checklist goes back as Stop
# additionalContext, which re-wakes the agent; the debounce stamp prevents a refire on the post-sweep stop.
# First stop of a fresh window initializes the stamp silently so sessions
# don't open with a sweep of nothing.
#
# The stamp key includes the session id (from the hook's stdin JSON): a
# repo-only key made concurrent sessions share one cooldown, so whichever
# session swept first muted the others for 45m and their work went unreviewed.
#
# Todos triage runs against the PINNED contract in docs/atlas/notes-adapter.md
# — never re-derived plumbing. Before the contract file existed, "adapter, not
# memory" pointed at nothing: a knownquantity sweep (2026-07-23) burned 10+
# minutes hunting a nonexistent adapter script and guessing column names, on
# every long-context sweep. Absence of the file = the repo runs no inbox.
#
# Where open work goes is a per-install SETTING, never an edited copy of this
# file (v11): "work" in .claude/atlas-kit.json, "docket" or "tickets". osa-dev
# hand-edited this file for tickets (2026-10-05), and every /kit-update would
# have reverted it, because portable files copy byte-identical (osa-dev #164).
# Unset = inferred: docs/docket.md present means docket, absent means tickets.
# "ticketRitual" names the host doc that defines its ticket flow. Docket output
# is unchanged from v10, so docket installs see no difference.

ROOT="${CLAUDE_PROJECT_DIR:-.}"
[ -d "$ROOT/docs/atlas" ] || exit 0

KITCFG="$ROOT/.claude/atlas-kit.json"
WORK=$(sed -n 's/.*"work"[[:space:]]*:[[:space:]]*"\([a-z]*\)".*/\1/p' "$KITCFG" 2>/dev/null | head -1)
if [ "$WORK" != "docket" ] && [ "$WORK" != "tickets" ]; then
  if [ -f "$ROOT/docs/docket.md" ]; then WORK=docket; else WORK=tickets; fi
fi
RITUAL=$(sed -n 's/.*"ticketRitual"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$KITCFG" 2>/dev/null | head -1)
RITUAL="${RITUAL:-the ticket flow named in docs/atlas/README.md, \"Open work\"}"

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

if [ -f "$ROOT/docs/atlas/notes-adapter.md" ]; then
  TODOS='3. TODOS TRIAGE — read docs/atlas/notes-adapter.md and run its pinned open-notes query VERBATIM via its named connection route (never re-derive table/columns/connection; if the contract has drifted from reality, fixing that file is itself a finding). Disposition every note on a node touched since the last sweep plus every note near/past the freshness budget: resolve (done/good_as_is, residue promoted to the node) or re-affirm against current evidence and bump verified_at.'
else
  if [ "$WORK" = "tickets" ]; then DEST='go through the ticket ritual too'; else DEST='go to the docket'; fi
  TODOS='3. TODOS — no docs/atlas/notes-adapter.md, so this repo runs no inbox: open loops from step 1 '"$DEST"'. If an inbox DOES exist here, the missing contract file is the finding — seed it from the kit'"'"'s templates/notes-adapter.md.'
fi

if [ "$WORK" = "tickets" ]; then
  STORE="feature-anchored to the node's inbox (source='extracted'); cross-cutting or initiative-level = a CANDIDATE TICKET: draft the WHY/WHAT/HOW in chat, and the ticket exists only on his \"file it\" — the chat conversation IS the approval, there is no parked half-approved state. TICKETS CHANGE THE PRODUCT, NEVER OPERATE THE BUSINESS — a follow-up, a filing, a thing he must send is not a ticket; if the product has no home for a business todo, the GAP is the ticket. A NULL ANSWER MEANS DROP IT, not file-it-anyway — most open loops are questions the AGENT raised."
  SPEC="Full spec: docs/atlas/README.md, \"Open loops — how to ask\"; ticket ritual: $RITUAL."
else
  STORE="feature-anchored to the node's inbox (source='extracted'), cross-cutting to docs/docket.md \"Open — Unanswered\" INSTEAD; never both, never restate docket status in a note. A NULL ANSWER MEANS DROP IT, not file-it-anyway — most open loops are questions the AGENT raised, and filing a null makes a permanent entry nobody will remember the context for."
  SPEC="Full spec: docs/atlas/README.md, \"Open loops — how to ask\"."
fi

# read, not $(cat <<MSG): bash 3.2 (macOS) scans a heredoc inside $( ) for
# quotes, so an odd count of apostrophes in the text breaks the script.
IFS= read -r -d '' SWEEP <<MSG || true
ATLAS SWEEP (debounced ~45m): review the conversation SINCE THE LAST SWEEP — a diff, not a re-audit: filings and resolutions already made during the session count; never re-file them. Budget ~2 minutes end to end — if plumbing (finding the store, connecting, querying) is eating the budget, that is a failure to report, not thoroughness.
1. OPEN LOOPS — do NOT file these on your own judgment. ASK FIRST, FILE AFTER. List the candidates in chat, let the owner rule, and write ONLY what he keeps — $STORE If the owner is not present to answer (unattended or cron run), file nothing that turns on his judgment — carry the candidates to the next sweep; only verified facts with no decision attached may be filed unattended. ASK IN THIS SHAPE, every time, plain words and short sentences — no file paths, no function names, no jargon: (a) THE QUESTION, in one sentence a non-developer can answer. (b) WHY IT MATTERS — exactly one of "this affects you today" or "this will affect you later", and nothing else. (c) THE TRADEOFF — what each way actually costs him, concretely. $SPEC
2. DECISIONS MADE — anything ruled this session that changed a feature: confirm the owning node's Decisions got its append (same-commit rule).
$TODOS
If nothing needs filing, continue with one line: "Atlas sweep: clear."
MSG
SWEEP=${SWEEP%$'\n'}

# Delivered as Stop additionalContext with exit 0, not stderr + exit 2: Claude
# Code labels an exit-2 message "Stop hook error", and teammates read that as
# a failure (osa-dev #159, 2026-10-08). additionalContext shows as "Stop hook
# feedback" and still continues the conversation (Claude Code 2.1.295 schema).
esc=${SWEEP//\\/\\\\}
esc=${esc//\"/\\\"}
esc=${esc//$'\n'/\\n}
esc=${esc//$'\t'/\\t}
esc=${esc//$'\r'/}
printf '{"hookSpecificOutput":{"hookEventName":"Stop","additionalContext":"%s"}}\n' "$esc"
exit 0
