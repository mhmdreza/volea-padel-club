import { describe, expect, it } from "vitest";

import { formatPrice } from "@/lib/format";

describe("formatPrice", () => {
  it("formats cents as EUR with English locale conventions", () => {
    expect(formatPrice(3000, "en")).toBe("€30.00");
  });

  it("formats cents as EUR with German locale conventions", () => {
    // Intl inserts a non-breaking space (U+00A0) before the symbol, not a plain space.
    expect(formatPrice(3000, "de")).toBe("30,00 €");
  });

  it("handles non-round amounts (per-person prices)", () => {
    expect(formatPrice(750, "de")).toBe("7,50 €");
  });
});
