import { describe, expect, it } from "vitest";

import { fold, highlight, matches } from "@/features/faq/faq-search";

describe("fold", () => {
  it("ignores case and diacritics", () => {
    expect(fold("Gebühr CAFÉ")).toBe("gebuhr cafe");
  });
});

describe("matches", () => {
  it("matches across case and umlauts, and treats an empty query as a match", () => {
    expect(matches("GEBUHR", "Was kostet die Gebühr?")).toBe(true);
    expect(matches("parking", "Gibt es Parkplätze?")).toBe(false);
    expect(matches("  ", "anything")).toBe(true);
  });
});

describe("highlight", () => {
  it("returns the original spelling of each match", () => {
    expect(highlight("Gebühr und gebuhr", "gebuhr")).toEqual([
      { text: "Gebühr", match: true },
      { text: " und ", match: false },
      { text: "gebuhr", match: true },
    ]);
  });

  it("keeps the text whole when nothing matches", () => {
    expect(highlight("Courts", "xyz")).toEqual([{ text: "Courts", match: false }]);
  });

  it("maps back correctly when a decomposed character precedes the match", () => {
    // "e" + combining acute (already decomposed) before the match.
    expect(highlight("Café Lounge", "lounge")).toEqual([
      { text: "Café ", match: false },
      { text: "Lounge", match: true },
    ]);
  });
});
