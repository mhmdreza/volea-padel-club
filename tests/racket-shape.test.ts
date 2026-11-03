import { describe, expect, it } from "vitest";

import {
  HEAD,
  halfWidthAt,
  headHoles,
  headOutline,
  isInsideHead,
} from "@/features/racket/lib/racket-shape";

describe("racket head shape", () => {
  it("has real padel proportions: about 2.6 dm wide, narrowing to the throat", () => {
    expect(halfWidthAt(HEAD.centreY) * 2).toBeCloseTo(2.6, 5);
    expect(halfWidthAt(HEAD.throatY)).toBeCloseTo(HEAD.throatHalfWidth, 2);
    expect(halfWidthAt(HEAD.centreY + HEAD.radius + 0.01)).toBe(0);
  });

  it("produces a closed outline whose points all lie on the head's edge", () => {
    for (const p of headOutline(48)) {
      expect(Math.abs(Math.abs(p.x) - halfWidthAt(p.y))).toBeLessThan(0.02);
    }
  });

  it("perforates the face with the 21 logo holes and keeps every hole off the rim", () => {
    const holes = headHoles();
    expect(holes.filter((h) => h.logo)).toHaveLength(21);
    expect(holes.length).toBeGreaterThan(40);
    for (const h of holes) expect(isInsideHead(h, 0.1)).toBe(true);
  });

  it("never lets two holes overlap", () => {
    const holes = headHoles();
    for (let i = 0; i < holes.length; i++) {
      for (let j = i + 1; j < holes.length; j++) {
        const a = holes[i]!;
        const b = holes[j]!;
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(a.r + b.r);
      }
    }
  });
});
