# atlas-kit

The canonical origin for the **atlas** — a convention + toolkit that keeps
AI-built projects bounded and remembered: a fractal living map of every
feature (why / what / how / decisions / graveyard), an open-work docket, and
the agent rituals that maintain both automatically.

Born in [DigiEric] 2026-07-15, ported to a second consumer 2026-07-17,
extracted here 2026-07-18. This repo documents itself with its own atlas —
start at `docs/atlas/README.md` (the convention) and `docs/atlas/kit/`
(how the kit itself works).

## Install

Point a Claude Code session at the target repo and say:

> Install the atlas kit from https://github.com/TheHubOfGitMayPolitelySuckMyAss/atlas-kit

The ritual (kit list in `docs/atlas/README.md`, "The kit" section):

1. Copy `.claude/hooks/*` and `.claude/skills/{sweep,rebrief,kit-update}`
   byte-identical; merge the Stop + SessionStart hook entries into the
   host's `.claude/settings.json`.
2. Instantiate `templates/atlas-README.md` → `docs/atlas/README.md`
   (adapt the LOCALIZE-marked sections) and `templates/docket.md` →
   `docs/docket.md`.
3. Write `.claude/atlas-kit.json`:
   `{"origin": "<this repo's git URL>", "sha": "<HEAD at install>", "installed": "<date>"}`.
4. Optionally seed the CI contract from `templates/atlas-contract.test.ts`.
5. Mine the codebase for the first domain nodes; if the project was born
   inside another repo's sessions, mine THAT repo for the incubation
   decision history — "born elsewhere" is a mining problem, not an
   accepted loss.

From then on the maintenance contract and the daily update check take over.

## Update

Installs check this repo's HEAD once a day (SessionStart hook, ls-remote,
detect-only) and apply through `/kit-update` — reviewable, never automatic.
Improvements made in any install flow BACK here first; portable files never
fork silently.

[DigiEric]: https://github.com/TheHubOfGitMayPolitelySuckMyAss/DigiEric
