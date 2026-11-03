/**
 * Minimal 2D padel physics for the side-elevation court: one ball against static
 * line segments plus one moving racket capsule. Hand-written instead of matter.js
 * because the scope is tiny, per-surface materials are one-liners, and generic
 * engines let a fast racket tunnel through a small ball without tuning.
 *
 * Units are metres, seconds, m/s. x runs along the court (net at 10 m), y is up.
 */

export type Vec = { x: number; y: number };

export type SurfaceKind = "floor" | "glass" | "mesh" | "net";

export type Material = { restitution: number; friction: number };

export const GRAVITY = 9.81;

export const MATERIALS: Record<SurfaceKind, Material> = {
  // FIP ball spec: dropped from 2.54 m it must rebound to 1.35–1.45 m,
  // so e = sqrt(1.40 / 2.54) ≈ 0.74.
  floor: { restitution: 0.74, friction: 0.05 },
  // Tuned, not from a spec: glass keeps the ball alive, the mesh above it kills it —
  // which is exactly the difference players feel on court.
  glass: { restitution: 0.7, friction: 0.1 },
  mesh: { restitution: 0.2, friction: 0.5 },
  net: { restitution: 0.1, friction: 0.6 },
};

export const RACKET_RESTITUTION = 0.85;
// Keeps a wild mouse flick from launching the ball into numerical nonsense.
export const MAX_BALL_SPEED = 40;

export type Segment = { a: Vec; b: Vec; kind: SurfaceKind };
export type Capsule = { a: Vec; b: Vec; radius: number };
export type Ball = { p: Vec; v: Vec; radius: number };

/** Racket pose at the start and end of the step — interpolated across sub-steps so a
 * fast swing sweeps through the ball — plus the velocity used for the hit impulse. */
export type RacketMotion = { from: Capsule; to: Capsule; v: Vec };

export type Contact = { kind: SurfaceKind | "racket"; p: Vec; n: Vec; speed: number };

const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
const scale = (a: Vec, s: number): Vec => ({ x: a.x * s, y: a.y * s });
const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y;
const lerp = (a: Vec, b: Vec, t: number): Vec => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
export const length = (a: Vec) => Math.hypot(a.x, a.y);

export function closestPointOnSegment(p: Vec, a: Vec, b: Vec): Vec {
  const ab = sub(b, a);
  const lenSq = dot(ab, ab);
  if (lenSq === 0) return a;
  const t = Math.min(1, Math.max(0, dot(sub(p, a), ab) / lenSq));
  return add(a, scale(ab, t));
}

/** Pushes the ball out of contact and returns the outward normal, or null if not touching. */
function resolvePenetration(ball: Ball, closest: Vec, minDist: number, fallback: Vec): Vec | null {
  const d = sub(ball.p, closest);
  const dist = length(d);
  if (dist >= minDist) return null;
  // Centre exactly on the surface: no direction to push along, so use the given one.
  const n = dist === 0 ? fallback : scale(d, 1 / dist);
  ball.p = add(closest, scale(n, minDist));
  return n;
}

// Below this impact speed the ball is resting or rolling, not bouncing; applying
// friction on every sub-step there would stop a rolling ball almost instantly.
const FRICTION_MIN_IMPACT = 0.3;

function bounce(v: Vec, n: Vec, { restitution, friction }: Material): Vec {
  const vn = dot(v, n);
  const vt = sub(v, scale(n, vn));
  const f = -vn > FRICTION_MIN_IMPACT ? friction : 0;
  return sub(scale(vt, 1 - f), scale(n, vn * restitution));
}

function clampSpeed(v: Vec): Vec {
  const speed = length(v);
  return speed > MAX_BALL_SPEED ? scale(v, MAX_BALL_SPEED / speed) : v;
}

function collideSurfaces(ball: Ball, surfaces: readonly Segment[], contacts: Contact[]) {
  for (const seg of surfaces) {
    const closest = closestPointOnSegment(ball.p, seg.a, seg.b);
    // Fallback for a centre exactly on the segment: push back the way it came.
    const speed = length(ball.v) || 1;
    const n = resolvePenetration(ball, closest, ball.radius, scale(ball.v, -1 / speed));
    if (!n) continue;
    const vn = dot(ball.v, n);
    if (vn >= 0) continue;
    ball.v = bounce(ball.v, n, MATERIALS[seg.kind]);
    contacts.push({ kind: seg.kind, p: { ...ball.p }, n, speed: -vn });
  }
}

/**
 * Advances the ball by `dt`. Splits the step so neither the ball nor the racket
 * moves more than half a ball radius per sub-step — the walls are zero-thickness
 * segments, so a bigger jump could skip through them. The racket's real swept
 * distance counts, not its (smoothed) velocity, which can lag a fast flick.
 */
export function step(
  input: Ball,
  dt: number,
  surfaces: readonly Segment[],
  racket?: RacketMotion,
): { ball: Ball; contacts: Contact[] } {
  const ball: Ball = { p: { ...input.p }, v: { ...input.v }, radius: input.radius };
  const contacts: Contact[] = [];

  const racketTravel = racket
    ? Math.max(length(sub(racket.to.a, racket.from.a)), length(sub(racket.to.b, racket.from.b)))
    : 0;
  const travel = length(ball.v) * dt + racketTravel;
  const subSteps = Math.max(1, Math.ceil(travel / (ball.radius * 0.5)));
  const h = dt / subSteps;

  for (let i = 0; i < subSteps; i++) {
    // Semi-implicit Euler: update velocity first, then position with the new velocity.
    ball.v = { x: ball.v.x, y: ball.v.y - GRAVITY * h };
    ball.p = add(ball.p, scale(ball.v, h));

    collideSurfaces(ball, surfaces, contacts);

    if (racket) {
      const t = (i + 1) / subSteps;
      const a = lerp(racket.from.a, racket.to.a, t);
      const b = lerp(racket.from.b, racket.to.b, t);
      const n = resolvePenetration(
        ball,
        closestPointOnSegment(ball.p, a, b),
        ball.radius + racket.to.radius,
        { x: Math.sign(racket.v.x) || 1, y: 0 },
      );
      if (n) {
        // Solve in the racket's frame, then add its velocity back: that is what
        // transfers the swing's speed into the ball.
        const rel = sub(ball.v, racket.v);
        const vn = dot(rel, n);
        if (vn < 0) {
          ball.v = clampSpeed(add(sub(rel, scale(n, (1 + RACKET_RESTITUTION) * vn)), racket.v));
          contacts.push({ kind: "racket", p: { ...ball.p }, n, speed: -vn });
        }
        // The racket push can shove the ball into the floor or a wall; resolve again
        // so it can never end up on the far side of a surface.
        collideSurfaces(ball, surfaces, contacts);
      }
    }
  }

  return { ball, contacts };
}

/** Launch velocity that lands a drag-free projectile on `to` after `flightTime` seconds. */
export function launchVelocity(from: Vec, to: Vec, flightTime: number): Vec {
  return {
    x: (to.x - from.x) / flightTime,
    y: (to.y - from.y) / flightTime + 0.5 * GRAVITY * flightTime,
  };
}

/** Height of a projectile when it crosses `x`, or null if it never does. */
export function heightAtX(from: Vec, v: Vec, x: number): number | null {
  if (v.x === 0) return null;
  const t = (x - from.x) / v.x;
  if (t < 0) return null;
  return from.y + v.y * t - 0.5 * GRAVITY * t * t;
}
