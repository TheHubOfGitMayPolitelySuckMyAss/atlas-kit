import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// Docket contract test — guards the docket convention (docs/atlas/README.md):
// the docket is STATE, not a log. Every open entry leads with an owner+ask
// line, stays short (history lives in decision docs / atlas nodes / git, the
// entry carries pointers), and done things MOVE to Done instead of being
// annotated in place. Sibling of the atlas contract test; same
// no-dependencies style.
//
// Install note: seed from templates/docket-contract.test.ts, adapt the test
// runner imports and the OWNER label for the host (default "ON ERIC").

const ROOT = path.resolve(__dirname, "..");
const DOCKET = path.join(ROOT, "docs", "docket.md");

const OWNER = "ON ERIC"; // the human owner's label in ask lines
const AGENT = "ON AGENT";
const BLOCKED = "BLOCKED";

// Uppercase state-change stamps that mean "this entry belongs in Done".
const STALE_TOKENS =
  /\b(SHIPPED|BUILT|RESOLVED|CLOSED|DEAD|DEFERRED|RULED|PASSED)\b/;

const OPEN_ENTRY_MAX_LINES = 12;
const DONE_ENTRY_MAX_LINES = 10;

interface Section {
  title: string;
  entries: string[][]; // each entry = its lines
}

function parseSections(raw: string): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;
  let entry: string[] | null = null;
  for (const line of raw.split(/\r?\n/)) {
    const heading = line.match(/^## +(.+?)\s*$/);
    if (heading) {
      current = { title: heading[1], entries: [] };
      sections.push(current);
      entry = null;
      continue;
    }
    if (!current) continue;
    if (/^- /.test(line)) {
      entry = [line];
      current.entries.push(entry);
    } else if (entry && line.trim() !== "") {
      entry.push(line);
    } else if (line.trim() === "") {
      entry = null; // blank line ends an entry
    }
  }
  return sections;
}

const raw = readFileSync(DOCKET, "utf8");
const sections = parseSections(raw);
const byTitle = (t: string) => sections.find((s) => s.title === t);

describe("docket contract", () => {
  it("keeps the three states in order", () => {
    const titles = sections.map((s) => s.title);
    expect(titles[0]).toBe("In Flight");
    expect(titles).toContain("Open — Unanswered");
    expect(titles[titles.length - 1]).toBe("Done");
  });

  for (const title of ["In Flight", "Open — Unanswered"]) {
    describe(title, () => {
      const section = byTitle(title);

      it("every entry leads with an owner+ask line", () => {
        for (const entry of section?.entries ?? []) {
          expect(
            new RegExp(
              `^- \\*\\*(${OWNER}|${AGENT}|${BLOCKED}):\\*\\* \\S`
            ).test(entry[0]),
            `${title}: entry must start '- **${OWNER}:** <ask>' | '- **${AGENT}:** …' | '- **${BLOCKED}:** …'\n  got: ${entry[0].slice(0, 100)}`
          ).toBe(true);
        }
      });

      it(`entries stay under ${OPEN_ENTRY_MAX_LINES} lines (history = pointers, not prose)`, () => {
        for (const entry of section?.entries ?? []) {
          expect(
            entry.length,
            `${title}: entry over ${OPEN_ENTRY_MAX_LINES} lines — cut history to pointers (decisions §, atlas node, commit)\n  entry: ${entry[0].slice(0, 100)}`
          ).toBeLessThanOrEqual(OPEN_ENTRY_MAX_LINES);
        }
      });

      it("no done-stamps in open entries — done things move to Done", () => {
        for (const entry of section?.entries ?? []) {
          expect(
            STALE_TOKENS.test(entry[0]),
            `${title}: first line carries a done-stamp (${STALE_TOKENS}) — move the entry to Done\n  entry: ${entry[0].slice(0, 100)}`
          ).toBe(false);
        }
      });

      it(`${OWNER} entries come first — the owner's queue tops the section`, () => {
        const entries = section?.entries ?? [];
        const firstOther = entries.findIndex(
          (e) => !e[0].startsWith(`- **${OWNER}:**`)
        );
        if (firstOther === -1) return;
        for (const entry of entries.slice(firstOther)) {
          expect(
            entry[0].startsWith(`- **${OWNER}:**`),
            `${title}: '${entry[0].slice(0, 80)}' — ${OWNER} entries sort before ${AGENT}/${BLOCKED}`
          ).toBe(false);
        }
      });
    });
  }

  describe("Done", () => {
    it(`entries stay under ${DONE_ENTRY_MAX_LINES} lines`, () => {
      for (const entry of byTitle("Done")?.entries ?? []) {
        expect(
          entry.length,
          `Done: entry over ${DONE_ENTRY_MAX_LINES} lines — it's a receipt, not a report\n  entry: ${entry[0].slice(0, 100)}`
        ).toBeLessThanOrEqual(DONE_ENTRY_MAX_LINES);
      }
    });
  });
});
