import { heightAtX, launchVelocity, type Segment, type Vec } from "./physics";

/** Real padel dimensions (FIP), seen from the side: back glass at both ends, mesh above it. */
export const COURT = {
  length: 20,
  netX: 10,
  netHeight: 0.88,
  glassHeight: 3,
  meshTop: 4,
  serviceLineFromNet: 6.95,
} as const;

// Drawn ~4x real size (a padel ball is 6.5 cm across) so it's visible on a 20 m court.
export const BALL_RADIUS = 0.14;

const { length, netX, netHeight, glassHeight, meshTop } = COURT;

export const COURT_SURFACES: readonly Segment[] = [
  { kind: "floor", a: { x: -3, y: 0 }, b: { x: length + 3, y: 0 } },
  { kind: "glass", a: { x: 0, y: 0 }, b: { x: 0, y: glassHeight } },
  { kind: "mesh", a: { x: 0, y: glassHeight }, b: { x: 0, y: meshTop } },
  { kind: "glass", a: { x: length, y: 0 }, b: { x: length, y: glassHeight } },
  { kind: "mesh", a: { x: length, y: glassHeight }, b: { x: length, y: meshTop } },
  { kind: "net", a: { x: netX, y: 0 }, b: { x: netX, y: netHeight } },
];

// Past either back wall means the ball left the court over it (or through a gap).
export const isOutOfCourt = (p: Vec) => p.x < 0 || p.x > length;

/**
 * Velocity for a shot from `from` that lands at `targetX` and clears the net with
 * `clearance` to spare. Starts at `minFlightTime` and lofts the ball (longer
 * flight = higher arc) until it clears.
 */
export function planShot(from: Vec, targetX: number, minFlightTime: number, clearance = 0.3): Vec {
  const to = { x: targetX, y: BALL_RADIUS };
  let v = launchVelocity(from, to, minFlightTime);
  for (let t = minFlightTime; t < 3; t += 0.05) {
    v = launchVelocity(from, to, t);
    const y = heightAtX(from, v, netX);
    if (y === null || y - BALL_RADIUS > netHeight + clearance) break;
  }
  return v;
}
