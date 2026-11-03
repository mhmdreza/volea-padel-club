import { describe, expect, it } from "vitest";

import { BODY, posePlayer, solveJoint, type PoseInput } from "@/features/rally/lib/pose";

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const base: PoseInput = {
  racket: { x: 3, y: 1 },
  dir: 1,
  x: 3,
  vx: 0,
  jump: 0,
  sinceSwing: 5,
  afterPoint: null,
};

describe("player pose", () => {
  it("solves a two-bone limb that keeps its bone lengths", () => {
    const root = { x: 0, y: 1 };
    const target = { x: 0.3, y: 0.3 };
    const joint = solveJoint(root, target, 0.42, 0.42, 1);
    expect(dist(root, joint)).toBeCloseTo(0.42, 6);
    expect(dist(joint, target)).toBeCloseTo(0.42, 6);
  });

  it("keeps the legs and arm at their real lengths while running, jumping and swinging", () => {
    for (const input of [
      base,
      { ...base, vx: 7, x: 4.37 },
      { ...base, jump: 0.6 },
      { ...base, sinceSwing: 0.1 },
    ]) {
      const pose = posePlayer(input);
      pose.knees.forEach((knee, i) => {
        expect(dist(pose.hip, knee)).toBeCloseTo(BODY.thigh, 3);
        expect(dist(knee, pose.feet[i]!)).toBeLessThanOrEqual(BODY.shin + 1e-3);
      });
      expect(dist(pose.shoulder, pose.elbow)).toBeCloseTo(BODY.upperArm, 3);
    }
  });

  it("keeps feet on or above the floor and lifts them in a jump", () => {
    for (let x = 0; x < 3; x += 0.1) {
      const pose = posePlayer({ ...base, x, vx: 7 });
      pose.feet.forEach((foot) => expect(foot.y).toBeGreaterThanOrEqual(0));
    }
    const jumping = posePlayer({ ...base, jump: 0.8 });
    jumping.feet.forEach((foot) => expect(foot.y).toBeGreaterThan(0.5));
  });

  it("holds the racket by the handle and raises it to celebrate a point", () => {
    const pose = posePlayer(base);
    expect(dist(pose.hand, pose.racketHead)).toBeCloseTo(BODY.racketHalfHeight + BODY.handle, 6);
    const won = posePlayer({ ...base, afterPoint: { seconds: 0.5, won: true } });
    expect(won.racketHead.y).toBeGreaterThan(won.head.y);
  });

  it("faces the net from either side", () => {
    const left = posePlayer(base);
    const right = posePlayer({ ...base, dir: -1, racket: { x: 17, y: 1 }, x: 17 });
    expect(left.hip.x).toBeLessThan(left.racketHead.x);
    expect(right.hip.x).toBeGreaterThan(right.racketHead.x);
  });
});
