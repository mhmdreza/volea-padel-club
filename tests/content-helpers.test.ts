import { describe, expect, it } from "vitest";

import { mapsSearchUrl } from "@/lib/maps";
import { isPlaceholder } from "@/lib/placeholder";

describe("isPlaceholder", () => {
  it("flags the [[TBD]] convention and nothing else", () => {
    expect(isPlaceholder("[[TBD: phone number]]")).toBe(true);
    expect(isPlaceholder("+49 7243 000000")).toBe(false);
  });
});

describe("mapsSearchUrl", () => {
  it("encodes the full address into a Maps search query", () => {
    expect(
      mapsSearchUrl({ street: "Musterstraße 12", postalCode: "12345", city: "Lindenau" }),
    ).toBe(
      "https://www.google.com/maps/search/?api=1&query=Musterstra%C3%9Fe%2012%2C%2012345%20Lindenau",
    );
  });
});
