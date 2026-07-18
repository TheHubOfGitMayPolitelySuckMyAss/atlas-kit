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

const nodeFiles = walkMarkdown(ATLAS_DIR).filter(
  (f) => path.basename(f) !== "README.md"
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
