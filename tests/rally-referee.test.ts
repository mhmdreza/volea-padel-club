import { describe, expect, it } from "vitest";

import {
  createReferee,
  judge,
  type Referee,
  type RefereeEvent,
} from "@/features/rally/lib/referee";

// Left team hits first; x < 10 is the left half, x > 10 the right.
function run(events: RefereeEvent[], ref: Referee = createReferee("left")) {
  return events.reduce((r, e) => judge(r, e).ref, ref);
}

describe("padel referee", () => {
  it("keeps the ball in play off the glass after one bounce", () => {
    const ref = run([
      { type: "floor", x: 15 },
      { type: "wall", x: 20 },
    ]);
    expect(ref.result).toBeNull();
    expect(judge(run([{ type: "floor", x: 15 }]), { type: "wall", x: 20 }).call).toBe(
      "offTheGlass",
    );
  });

  it("faults a ball that hits the receivers' glass before bouncing", () => {
    expect(run([{ type: "wall", x: 20 }]).result).toEqual({ winner: "right", reason: "wallFirst" });
  });

  it("lets a team play the ball off its own glass", () => {
    const ref = run([{ type: "wall", x: 0 }]);
    expect(ref.result).toBeNull();
  });

  it("gives the point to the hitter on a double bounce", () => {
    const ref = run([
      { type: "floor", x: 15 },
      { type: "floor", x: 17 },
    ]);
    expect(ref.result).toEqual({ winner: "left", reason: "doubleBounce" });
  });

  it("faults a ball that lands on the hitter's own side (net)", () => {
    expect(run([{ type: "floor", x: 8 }]).result).toEqual({ winner: "right", reason: "net" });
  });

  it("calls por tres when the ball bounces then leaves over the receivers' wall", () => {
    const ref = run([
      { type: "floor", x: 15 },
      { type: "out", x: 20.2 },
    ]);
    expect(ref.result).toEqual({ winner: "left", reason: "porTres" });
  });

  it("faults a ball that goes out without bouncing", () => {
    expect(run([{ type: "out", x: 20.2 }]).result).toEqual({ winner: "right", reason: "out" });
  });

  it("allows one hit per team and resets the bounce count on a return", () => {
    const ref = run([
      { type: "floor", x: 15 },
      { type: "hit", by: "right" },
      { type: "hit", by: "right" },
      { type: "floor", x: 4 },
    ]);
    expect(ref.hitter).toBe("right");
    expect(ref.bounces).toBe(1);
    expect(ref.result).toBeNull();
  });

  it("calls a volley when the return comes before any bounce", () => {
    expect(judge(createReferee("left"), { type: "hit", by: "right" }).call).toBe("volley");
  });

  it("ignores everything once the point is decided", () => {
    const over = run([{ type: "wall", x: 20 }]);
    expect(judge(over, { type: "floor", x: 15 }).ref).toBe(over);
  });
});
