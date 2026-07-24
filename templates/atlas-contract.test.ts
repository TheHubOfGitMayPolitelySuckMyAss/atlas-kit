import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";

// Atlas contract test — fully self-contained (no gray-matter dep; frontmatter
// is parsed with a tolerant hand-rolled parser). Guards the convention in
// docs/atlas/README.md: every node parses, carries a non-empty title/why/what,
// a valid status, and (for feature nodes) a ## How section; the docket keeps
// its three states.

const ROOT = path.resolve(__dirname, "..");
const ATLAS_DIR = path.join(ROOT, "docs", "atlas");
const DOCKET = path.join(ROOT, "docs", "docket.md");

const VALID_STATUS = new Set(["live", "parked", "deprecated"]);

interface Frontmatter {
  [key: string]: string;
}

// Tolerant frontmatter parser: the block between the first two `---` lines,
// each entry split on the FIRST ": "; lines without a separator are treated
// as continuations of the previous key.
function parseFrontmatter(raw: string, file: string): Frontmatter {
  const lines = raw.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") {
    throw new Error(`${file}: no frontmatter opening ---`);
  }
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (end === -1) {
    throw new Error(`${file}: frontmatter never closes`);
  }
  const fm: Frontmatter = {};
  let lastKey: string | null = null;
  for (const line of lines.slice(1, end)) {
    if (!line.trim()) continue;
    const sep = line.indexOf(": ");
    if (sep > 0 && !/^\s/.test(line)) {
      const key = line.slice(0, sep).trim();
      let value = line.slice(sep + 2).trim();
      // Strip a trailing inline comment on simple scalar lines (e.g. status).
      value = value.replace(/\s+#.*$/, "");
      fm[key] = value;
      lastKey = key;
    } else if (lastKey) {
      fm[lastKey] = `${fm[lastKey]} ${line.trim()}`.trim();
    } else {
      throw new Error(`${file}: unparseable frontmatter line: ${line}`);
    }
  }
  return fm;
}

function walkMarkdown(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walkMarkdown(full));
    } else if (entry.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

// notes-adapter.md is the pinned inbox storage contract (kit v6), convention
// prose like the README — not a node.
const nodeFiles = walkMarkdown(ATLAS_DIR).filter(
  (f) => !["README.md", "notes-adapter.md"].includes(path.basename(f))
);

describe("atlas contract", () => {
  it("has at least one node", () => {
    expect(nodeFiles.length).toBeGreaterThan(0);
  });

  for (const file of nodeFiles) {
    const rel = path.relative(ROOT, file);

    describe(rel, () => {
      const raw = readFileSync(file, "utf8");

      it("parses frontmatter with non-empty title/why/what", () => {
        const fm = parseFrontmatter(raw, rel);
        for (const key of ["title", "why", "what"]) {
          expect(fm[key], `${rel}: missing/empty '${key}'`).toBeTruthy();
          expect(fm[key]!.trim().length, `${rel}: empty '${key}'`).toBeGreaterThan(0);
        }
      });

      it("has a valid status", () => {
        const fm = parseFrontmatter(raw, rel);
        expect(
          VALID_STATUS.has(fm.status ?? ""),
          `${rel}: status '${fm.status}' not in live|parked|deprecated`
        ).toBe(true);
      });

      if (path.basename(file) !== "_domain.md") {
        it("feature node has a ## How section", () => {
          expect(/^## How\s*$/m.test(raw), `${rel}: no '## How' heading`).toBe(true);
        });
      }
    });
  }

  it("docket has its three sections", () => {
    const raw = readFileSync(DOCKET, "utf8");
    expect(/^## In Flight\s*$/m.test(raw), "docket: missing '## In Flight'").toBe(true);
    expect(
      /^## Open — Unanswered\s*$/m.test(raw),
      "docket: missing '## Open — Unanswered'"
    ).toBe(true);
    expect(/^## Done\s*$/m.test(raw), "docket: missing '## Done'").toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Provenance receipts (maintenance contract rule 8). Any block attributing a
// ruling to the owner — a parenthetical tag ("(Owner)", "(Owner, 7/19: …)",
// "(§31, Owner)") or ruling-verb prose ("Owner ruled/confirmed …") — must
// carry the receipt IN THE SAME bullet/paragraph: the owner's verbatim words
// in quotes AND a date. The quote is greppable in session transcripts; that
// is the receipt. Possessives ("Owner's …") and prepositional objects
// ("replied to Owner") are not attributions and are exempt.
// Born 2026-07-22 (KQ): a 7/20 audit found 3/17 owner-attributions had no
// receipt — one doctrine the owner never stated wore his name for days.

const OWNER_NAME = "Eric"; // LOCALIZE: the human owner's first name

const ATTRIB_TAG = new RegExp(
  `\\((?:${OWNER_NAME}\\b(?!['’]s)|[^()]*,\\s*${OWNER_NAME}\\b(?!['’]s))[^()]*\\)`
);
const ATTRIB_VERB = new RegExp(
  `\\b${OWNER_NAME}(?:\\s+then)?\\s+(?:ruled|confirmed|commissioned|blessed|ordered|selected|chose|killed|halted|deferred|punted|ratified)\\b`,
  "i"
);
const RECEIPT_QUOTE = /["“][^"”]{2,}["”]/;
const RECEIPT_DATE = /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\b/;

function receiptViolations(raw: string): { line: number; excerpt: string }[] {
  const out: { line: number; excerpt: string }[] = [];
  const lines = raw.split(/\r?\n/);
  let buf: string[] = [];
  let bufStart = 0;
  const flush = () => {
    if (!buf.length) return;
    const text = buf.join("\n");
    if (
      (ATTRIB_TAG.test(text) || ATTRIB_VERB.test(text)) &&
      !(RECEIPT_QUOTE.test(text) && RECEIPT_DATE.test(text))
    ) {
      out.push({
        line: bufStart + 1,
        excerpt: text.trim().replace(/\s+/g, " ").slice(0, 110),
      });
    }
    buf = [];
  };
  lines.forEach((l, i) => {
    if (!l.trim()) {
      flush();
      return;
    }
    if (/^\s*- /.test(l)) flush(); // each bullet carries its own receipt
    if (!buf.length) bufStart = i;
    buf.push(l);
  });
  flush();
  return out;
}

describe("provenance receipts", () => {
  // README included on purpose: convention prose makes claims too.
  for (const file of walkMarkdown(ATLAS_DIR)) {
    const rel = path.relative(ROOT, file);
    it(`${rel}: every ${OWNER_NAME}-attribution carries a receipt (verbatim quote + date)`, () => {
      const v = receiptViolations(readFileSync(file, "utf8"));
      expect(
        v.length,
        `${rel}: attribution without receipt —\n` +
          v.map((x) => `  L${x.line}: ${x.excerpt}`).join("\n")
      ).toBe(0);
    });
  }
});
