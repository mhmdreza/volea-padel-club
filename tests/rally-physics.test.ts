import { describe, expect, it } from "vitest";

import { BALL_RADIUS, COURT, COURT_SURFACES, planShot } from "@/features/rally/lib/court";
import {
  heightAtX,
  launchVelocity,
  length,
  step,
  type Ball,
  type Contact,
  type RacketMotion,
} from "@/features/rally/lib/physics";

const DT = 1 / 240;

function simulate(ball: Ball, seconds: number, onStep?: (b: Ball, c: Contact[]) => void) {
  let current = ball;
  for (let i = 0; i < seconds / DT; i++) {
    const { ball: next, contacts } = step(current, DT, COURT_SURFACES);
    current = next;
    onStep?.(current, contacts);
  }
  return current;
}

describe("rally physics", () => {
  it("passes the FIP bounce test: dropped from 2.54 m it rebounds to 1.35–1.45 m", () => {
    // Heights are measured at the bottom of the ball, as in the spec.
    let bounced = false;
    let apex = 0;
    simulate(
      { p: { x: 5, y: 2.54 + BALL_RADIUS }, v: { x: 0, y: 0 }, radius: BALL_RADIUS },
      2,
      (b, c) => {
        if (c.some((contact) => contact.kind === "floor")) bounced = true;
        if (bounced && b.v.y >= 0) apex = Math.max(apex, b.p.y - BALL_RADIUS);
      },
    );
    expect(apex).toBeGreaterThanOrEqual(1.35);
    expect(apex).toBeLessThanOrEqual(1.45);
  });

  it("keeps the ball alive off the glass but kills it off the mesh", () => {
    const speedAfter = (y: number) => {
      let after = 0;
      simulate({ p: { x: 1, y }, v: { x: -10, y: 0 }, radius: BALL_RADIUS }, 0.15, (b, c) => {
        if (c.some((contact) => contact.kind !== "floor") && after === 0) after = Math.abs(b.v.x);
      });
      return after;
    };
    expect(speedAfter(1.5)).toBeGreaterThan(6.5); // glass, e = 0.7
    expect(speedAfter(3.5)).toBeLessThan(2.5); // mesh absorbs > 75 %
  });

  it("does not tunnel through the back glass at maximum speed", () => {
    const end = simulate({ p: { x: 2, y: 1.5 }, v: { x: -40, y: 0 }, radius: BALL_RADIUS }, 0.1);
    expect(end.p.x).toBeGreaterThan(0);
  });

  it("transfers a fast swing's velocity into a resting ball without tunnelling", () => {
    const racketAt = (x: number) => ({
      a: { x, y: 1.2 },
      b: { x, y: 1.8 },
      radius: 0.15,
    });
    // The racket jumps 0.5 m in one 1/60 s frame (30 m/s) — far more than the
    // ball's radius — and must still hit it rather than pass through.
    const motion: RacketMotion = { from: racketAt(4.6), to: racketAt(5.1), v: { x: 30, y: 0 } };
    const { ball, contacts } = step(
      { p: { x: 5, y: 1.5 }, v: { x: 0, y: 0 }, radius: BALL_RADIUS },
      1 / 60,
      [],
      motion,
    );
    expect(contacts.some((c) => c.kind === "racket")).toBe(true);
    expect(ball.v.x).toBeGreaterThan(30); // ball leaves faster than the racket
  });

  it("caps ball speed after a racket hit", () => {
    const at = (x: number) => ({ a: { x, y: 1 }, b: { x, y: 2 }, radius: 0.15 });
    const { ball } = step(
      { p: { x: 5, y: 1.5 }, v: { x: -30, y: 0 }, radius: BALL_RADIUS },
      1 / 60,
      [],
      { from: at(4.3), to: at(5.2), v: { x: 60, y: 0 } },
    );
    expect(length(ball.v)).toBeLessThanOrEqual(40 + 1e-9);
  });

  it("solves a launch velocity that lands on the target", () => {
    const from = { x: 2, y: 1 };
    const v = launchVelocity(from, { x: 15, y: 0 }, 1.2);
    expect(heightAtX(from, v, 15)).toBeCloseTo(0, 6);
  });

  it("plans shots that clear the net", () => {
    for (const targetX of [11, 14, 18]) {
      const from = { x: 1.5, y: 0.6 };
      const v = planShot(from, targetX, 0.6);
      const y = heightAtX(from, v, COURT.netX);
      expect(y).not.toBeNull();
      expect(y! - BALL_RADIUS).toBeGreaterThan(COURT.netHeight);
    }
  });
});
