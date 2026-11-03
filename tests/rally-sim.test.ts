import { describe, expect, it } from "vitest";

import { COURT } from "@/features/rally/lib/court";
import {
  createSim,
  dirToNet,
  HAND_HEIGHT,
  MATCH_POINTS,
  RUN_SPEED,
  shotFromMovement,
  tick,
  type HumanInput,
  type Mode,
  type Sim,
  type SimEvent,
} from "@/features/rally/lib/rally-sim";

// Deterministic PRNG so the rallies replay identically.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A simple human stand-in: wait a step behind the ball, then run into it towards the
 * net as it arrives (which is what makes a good shot); jump if it's overhead. */
function bot(sim: Sim): HumanInput {
  const me = sim.players.find((p) => p.human)!;
  const { p } = sim.ball;
  if (p.x > COURT.netX) return { run: 0, jump: false };
  const near = Math.abs(p.x - me.x) < 1 && p.y < HAND_HEIGHT + 1.6;
  const gap = p.x - 0.9 - me.x;
  const run = near ? 1 : Math.abs(gap) < 0.15 ? 0 : gap > 0 ? 1 : -1;
  return { run, jump: near && p.y > HAND_HEIGHT + 0.6 };
}

function runFor(
  seconds: number,
  mode: Mode,
  input: (sim: Sim) => HumanInput = () => ({ run: 0, jump: false }),
  seed = 7,
) {
  const sim = createSim(mode, mulberry32(seed));
  const events: SimEvent[] = [];
  for (let i = 0; i < seconds * 60; i++) events.push(...tick(sim, 1 / 60, input(sim)));
  return { sim, events };
}

describe("rally simulation", () => {
  it("plays real rallies in demo mode: both sides return the ball and points get decided", () => {
    const { events } = runFor(60, "demo");
    const hits = events.filter((e) => e.type === "hit");
    expect(hits.length).toBeGreaterThan(10);
    expect(events.some((e) => e.type === "point")).toBe(true);
    expect(new Set(hits.map((e) => e.type === "hit" && e.side))).toEqual(
      new Set(["left", "right"]),
    );
  });

  it("shows the glass in play: some balls are returned after coming off the glass", () => {
    const { events } = runFor(60, "demo");
    expect(events.some((e) => e.type === "call" && e.call === "offTheGlass")).toBe(true);
  });

  it("is singles in both modes", () => {
    expect(createSim("demo").players).toHaveLength(2);
    expect(createSim("play").players).toHaveLength(2);
  });

  it("never lets the ball sink through the floor", () => {
    const sim = createSim("demo", mulberry32(3));
    for (let i = 0; i < 60 * 60; i++) {
      tick(sim, 1 / 60);
      expect(sim.ball.p.y).toBeGreaterThan(-0.01);
    }
  });

  it("keeps players on their own side and on the floor unless jumping", () => {
    const { sim } = runFor(3, "play", () => ({ run: 1, jump: false }));
    const human = sim.players.find((p) => p.human)!;
    expect(human.x).toBeLessThan(COURT.netX);
    expect(human.c.y).toBe(HAND_HEIGHT);
  });

  it("limits every player to running speed — nobody teleports to the ball", () => {
    const sim = createSim("demo", mulberry32(9));
    let prev = sim.players.map((p) => p.x);
    for (let i = 0; i < 40 * 60; i++) {
      tick(sim, 1 / 60);
      const served = sim.time - sim.pointStartedAt < 1 / 60;
      sim.players.forEach((p, k) => {
        if (!served) expect(Math.abs(p.x - prev[k]!) * 60).toBeLessThanOrEqual(RUN_SPEED + 1e-6);
      });
      prev = sim.players.map((p) => p.x);
    }
  });

  it("turns movement into the shot: running at the net hits deeper, backing off drops short", () => {
    const flat = shotFromMovement("left", { x: 0, y: 0 });
    const attack = shotFromMovement("left", { x: RUN_SPEED, y: 0 });
    const retreat = shotFromMovement("left", { x: -RUN_SPEED, y: 0 });
    expect(attack.x).toBeGreaterThan(flat.x);
    expect(retreat.x).toBeLessThan(flat.x);
    // A jumping (higher) contact is flatter, so it doesn't sail long: from the back of
    // the court a jumping hit while moving in still lands in the opponent's half.
    const jumpShot = shotFromMovement("left", { x: 3, y: 0 }, HAND_HEIGHT + 1);
    const g = 9.81;
    const h = HAND_HEIGHT + 1;
    const flight = (jumpShot.y + Math.sqrt(jumpShot.y ** 2 + 2 * g * h)) / g;
    const landing = 3 + jumpShot.x * flight;
    expect(landing).toBeGreaterThan(COURT.netX);
    expect(landing).toBeLessThan(COURT.length);
    expect(shotFromMovement("left", { x: 0, y: 3 }, HAND_HEIGHT + 1).y).toBeLessThan(flat.y);
    // Same rules for the other side, mirrored.
    expect(shotFromMovement("right", { x: -RUN_SPEED, y: 0 }).x).toBe(-attack.x);
    expect(dirToNet("right")).toBe(-1);
  });

  it("loses the point when nobody plays the ball", () => {
    const { events } = runFor(20, "play");
    const points = events.flatMap((e) => (e.type === "point" ? [e.result] : []));
    expect(points.some((r) => r.winner === "right")).toBe(true);
  });

  it("lets a player who meets the ball win points", () => {
    const { events } = runFor(240, "play", bot, 11);
    const ourHits = events.filter((e) => e.type === "hit" && e.side === "left").length;
    const wins = events.filter((e) => e.type === "point" && e.result.winner === "left").length;
    expect(ourHits).toBeGreaterThan(3);
    expect(wins).toBeGreaterThan(0);
  });

  it("plays a match to the target score and then stops serving", () => {
    const sim = createSim("play", mulberry32(2));
    let over = false;
    for (let i = 0; i < 400 * 60 && !over; i++) {
      over = tick(sim, 1 / 60).some((e) => e.type === "match");
    }
    expect(over).toBe(true);
    expect(Math.max(sim.match.score.left, sim.match.score.right)).toBe(MATCH_POINTS);
    const points = () => sim.match.score.left + sim.match.score.right;
    const before = points();
    for (let i = 0; i < 10 * 60; i++) tick(sim, 1 / 60);
    expect(points()).toBe(before);
  });

  it("practice is the same game without a score: the computer plays, nothing is counted", () => {
    const { sim, events } = runFor(60, "practice", bot, 4);
    expect(events.some((e) => e.type === "hit" && e.side === "right")).toBe(true);
    expect(events.some((e) => e.type === "point")).toBe(true);
    expect(sim.match.score).toEqual({ left: 0, right: 0 });
  });

  it("lets the human serve with Space, holding the ball until then", () => {
    const sim = createSim("play", mulberry32(1));
    // The human serves first.
    expect(sim.awaitingServe).not.toBeNull();
    const held = { ...sim.ball.p };
    for (let i = 0; i < 60; i++) tick(sim, 1 / 60, { run: 0, jump: false });
    expect(sim.ball.p).toEqual(held);
    tick(sim, 1 / 60, { run: 0, jump: true });
    expect(sim.awaitingServe).toBeNull();
    expect(sim.ball.v.x).toBeGreaterThan(0);
    // Space served the ball; it didn't also make the player jump.
    expect(sim.players.find((p) => p.human)!.jump).toBe(0);
  });

  it("serves automatically if the human waits too long", () => {
    const sim = createSim("play", mulberry32(1));
    for (let i = 0; i < 10 * 60; i++) tick(sim, 1 / 60);
    expect(sim.awaitingServe).toBeNull();
  });
});
