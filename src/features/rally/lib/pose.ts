import type { Vec } from "./physics";

/**
 * Procedural pose for a side-view padel player: a crouched ready stance, a run cycle
 * driven by distance travelled, a tucked jump, a swing through the ball, and a short
 * celebration or slump after a point. Pure — the renderer draws whatever this returns.
 * Units are court metres; `dir` is +1 when facing right (towards the net from the left).
 */

export const BODY = {
  thigh: 0.42,
  shin: 0.42,
  upperArm: 0.3,
  forearm: 0.28,
  /** Hip → shoulder, and shoulder → head centre. */
  torso: 0.5,
  neck: 0.2,
  headRadius: 0.12,
  /** Racket: handle length below the head, head half-height and half-width. */
  handle: 0.22,
  racketHalfHeight: 0.2,
  racketHalfWidth: 0.14,
  /** Hips sit this far behind the racket head (away from the net). */
  bodyOffset: 0.38,
};

const STRIDE = 1.3;

export type PoseInput = {
  /** Racket head centre and facing direction. */
  racket: Vec;
  dir: 1 | -1;
  /** Floor position under the player, run speed and height off the floor. */
  x: number;
  vx: number;
  jump: number;
  /** Seconds since the last swing started, and since the last point ended (null if live). */
  sinceSwing: number;
  afterPoint: { seconds: number; won: boolean } | null;
};

export type Pose = {
  head: Vec;
  neck: Vec;
  shoulder: Vec;
  hip: Vec;
  elbow: Vec;
  hand: Vec;
  knees: [Vec, Vec];
  feet: [Vec, Vec];
  /** Racket tilt from upright, radians, and where its head is drawn. */
  racketTilt: number;
  racketHead: Vec;
};

/**
 * Two-bone inverse kinematics: the middle joint for a limb from `root` towards
 * `target`. `bend` picks which side the joint folds to. Out-of-reach targets get a
 * straight limb pointing at them.
 */
export function solveJoint(
  root: Vec,
  target: Vec,
  upper: number,
  lower: number,
  bend: 1 | -1,
): Vec {
  const dx = target.x - root.x;
  const dy = target.y - root.y;
  const dist = Math.min(Math.hypot(dx, dy), upper + lower - 1e-6);
  const base = Math.atan2(dy, dx);
  // Law of cosines for the angle at the root between the limb and the root→target line.
  const cos = (upper * upper + dist * dist - lower * lower) / (2 * upper * dist || 1);
  const angle = base + bend * Math.acos(Math.max(-1, Math.min(1, cos)));
  return { x: root.x + Math.cos(angle) * upper, y: root.y + Math.sin(angle) * upper };
}

const ease = (t: number) => 1 - (1 - t) ** 3;

/** Pulls `target` in towards `root` until a limb of `length` can reach it. */
function reachable(root: Vec, target: Vec, length: number): Vec {
  const d = Math.hypot(target.x - root.x, target.y - root.y);
  if (d <= length) return target;
  const k = (length - 1e-6) / d;
  return { x: root.x + (target.x - root.x) * k, y: root.y + (target.y - root.y) * k };
}

export function posePlayer(input: PoseInput): Pose {
  const { dir, x, vx, jump, sinceSwing, afterPoint } = input;
  const running = Math.min(1, Math.abs(vx) / 4);
  const phase = (x / STRIDE) * Math.PI * 2;

  // Crouch lower while waiting, a little taller while running; a small bob each step.
  const bob = running * Math.abs(Math.sin(phase)) * 0.05;
  const hipY = 0.72 + running * 0.06 + bob + jump;
  const hip = { x: x - dir * BODY.bodyOffset, y: hipY };
  const lean = dir * (0.12 + running * 0.15) * Math.sign(vx * dir || 1);
  const shoulder = { x: hip.x + lean, y: hip.y + BODY.torso };

  // Racket: upright and slightly cocked back in the ready stance; it whips through
  // forwards on a swing, and goes up in celebration.
  const swing = sinceSwing < 0.3 ? ease(sinceSwing / 0.3) : 1;
  const swingTilt = sinceSwing < 0.3 ? dir * (-0.9 + swing * 1.8) : 0;
  let racketTilt = dir * -0.15 + swingTilt;
  let racketHead = input.racket;
  let headDrop = 0;
  if (afterPoint && afterPoint.seconds < 1.2) {
    const t = Math.min(1, afterPoint.seconds / 0.25);
    if (afterPoint.won) {
      racketHead = { x: shoulder.x + dir * 0.15, y: shoulder.y + 0.25 + t * 0.35 };
      racketTilt = 0;
    } else {
      headDrop = t * 0.08;
    }
  }

  const hand = {
    x: racketHead.x - Math.sin(racketTilt) * (BODY.racketHalfHeight + BODY.handle),
    y: racketHead.y - Math.cos(racketTilt) * (BODY.racketHalfHeight + BODY.handle),
  };
  const elbow = solveJoint(shoulder, hand, BODY.upperArm, BODY.forearm, dir === 1 ? -1 : 1);

  const neck = { x: shoulder.x + lean * 0.3, y: shoulder.y + 0.06 };
  const head = { x: neck.x + dir * headDrop, y: shoulder.y + BODY.neck - headDrop };

  // Feet: planted apart when still, cycling when running, tucked up in a jump.
  const feet = [0, Math.PI].map((offset) => {
    const p = phase + offset;
    if (jump > 0.05) return { x: hip.x + Math.sin(p) * 0.12, y: hip.y - 0.62 };
    const stride = Math.sin(p) * 0.35 * running;
    const lift = Math.max(0, Math.cos(p)) * 0.14 * running;
    const stance = (offset ? -1 : 1) * 0.2 * (1 - running);
    return reachable(hip, { x: hip.x + stride + stance, y: lift }, BODY.thigh + BODY.shin);
  }) as [Vec, Vec];
  const knees = feet.map((foot) =>
    solveJoint(hip, foot, BODY.thigh, BODY.shin, dir === 1 ? 1 : -1),
  ) as [Vec, Vec];

  return { head, neck, shoulder, hip, elbow, hand, knees, feet, racketTilt, racketHead };
}
