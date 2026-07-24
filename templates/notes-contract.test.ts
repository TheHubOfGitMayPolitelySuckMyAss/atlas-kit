import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Notes contract test — guards the todos-inbox convention (docs/atlas/README.md,
// Todos section): the inbox is STATE, not a log. An open note is a claim that
// re-earns its place — within the freshness budget it is resolved or
// re-affirmed against current evidence (verified_at bumped). Without this
// tripwire, write pressure alone turns the inbox into a midden (the founding
// incident: 41 open notes 4 days after install, 26 of them rot — ad-hoc
// resolution never queried the list and couldn't keep pace).
//
// Install note: seed from templates/notes-contract.test.ts. LOCALIZE two
// things: fetchOpenNotes() for the host's adapter, and BUDGET_DAYS (default
// 14; a repo shipping daily wants ~7). The test SKIPS when the inbox is
// unreachable (no credentials — e.g. network-free CI); local runs, where
// agents live, are the enforcement surface.

const BUDGET_DAYS = 14; // LOCALIZE: freshness budget

interface OpenNote {
  id: string;
  node_slug: string;
  body: string;
  created_at: string;
  verified_at: string;
}

// LOCALIZE: return all status='open' notes via the host's adapter, or null
// when the inbox is unreachable (missing credentials → the suite skips).
// Example (Supabase host): read env from .env.local, query atlas_notes with
// the service-role key via the same table the lib adapter wraps.
async function fetchOpenNotes(): Promise<OpenNote[] | null> {
  return null; // template stub — a fresh install with no inbox skips
}

// LOCALIZE if the repo root isn't the vitest cwd (e.g. a monorepo package).
const ADAPTER_CONTRACT = "docs/atlas/notes-adapter.md";

const notes = await fetchOpenNotes();

describe.skipIf(notes === null)("atlas notes contract", () => {
  it("the storage contract is pinned in docs/atlas/notes-adapter.md", () => {
    // A reachable inbox without its pinned contract taxes every sweep with
    // re-derived plumbing (table? columns? connection?) — 10+ min per sweep
    // in the founding incident. Seed from templates/notes-adapter.md.
    expect(
      existsSync(ADAPTER_CONTRACT),
      `${ADAPTER_CONTRACT} missing — the inbox is reachable but its storage ` +
        `contract (store, columns, canonical open-notes query, connection ` +
        `route) is not pinned; sweeps will re-derive plumbing every time`
    ).toBe(true);
  });

  it(`every open note was verified within ${BUDGET_DAYS} days`, () => {
    const cutoff = Date.now() - BUDGET_DAYS * 24 * 60 * 60 * 1000;
    const overdue = (notes ?? []).filter(
      (n) => new Date(n.verified_at ?? n.created_at).getTime() < cutoff
    );
    expect(
      overdue.length,
      `over-budget notes — resolve or re-affirm each against CURRENT evidence ` +
        `(query code/docs, not memory; bump verified_at):\n` +
        overdue
          .map((n) => `  [${n.node_slug}] ${n.id} — ${n.body.slice(0, 90)}`)
          .join("\n")
    ).toBe(0);
  });

  it("no note restates docket status — a fact has one writer", () => {
    const dupes = (notes ?? []).filter((n) =>
      /also in (the )?docket|docketed/i.test(n.body)
    );
    expect(
      dupes.length,
      `notes double-filing with the docket — the docket entry is the single ` +
        `writer; the note either dies or carries only the feature-anchored ` +
        `detail with a pointer:\n` +
        dupes
          .map((n) => `  [${n.node_slug}] ${n.id} — ${n.body.slice(0, 90)}`)
          .join("\n")
    ).toBe(0);
  });
});
