/**
 * The padel racket's head, as plain numbers (no three.js) so the shape can be tested.
 * Units are decimetres: a real padel racket is about 2.6 wide and 4.55 long, the head
 * about 3 of that. Padel rackets have no strings — the face is solid and perforated —
 * and here the larger holes trace the Volea logo's 21-dot grid.
 */

export type Point = { x: number; y: number };
export type Hole = Point & { r: number; logo: boolean };

export const HEAD = {
  /** Radius of the round top and the centre it's drawn around. */
  radius: 1.3,
  centreY: 0.35,
  /** Where the head narrows into the throat. */
  throatY: -1.55,
  throatHalfWidth: 0.35,
  /** Bezier control point for the sides between the round top and the throat. */
  sideControl: { x: 1.25, y: -0.9 },
  thickness: 0.38,
};

export const HANDLE = { length: 1.6, radius: 0.17 };

// Logo rows 3-5-5-5-3, matching src/app/icon.svg, on a 0.32 grid.
const LOGO_ROWS = [3, 5, 5, 5, 3];
const LOGO_GAP = 0.32;
const LOGO_CENTRE_Y = 0.42;
const LOGO_HOLE_R = 0.085;
// Smaller holes fill the rest of the face on an offset grid, keeping clear of the
// logo so its pattern stays readable, and of the rim.
const FILL_GAP = 0.26;
const FILL_HOLE_R = 0.045;
const EDGE_MARGIN = 0.22;
const LOGO_CLEARANCE = 0.2;

const quad = (a: number, c: number, b: number, t: number) =>
  (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

/** Closed outline of the head, anticlockwise from the right side of the round top. */
export function headOutline(segments = 64): Point[] {
  const { radius, centreY, throatY, throatHalfWidth, sideControl } = HEAD;
  const pts: Point[] = [];
  // Round top: from the right, over the top, to the left.
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI;
    pts.push({ x: Math.cos(a) * radius, y: centreY + Math.sin(a) * radius });
  }
  // Left side down to the throat, across, and the right side back up.
  for (let i = 1; i <= segments / 2; i++) {
    const t = i / (segments / 2);
    pts.push({
      x: -quad(radius, sideControl.x, throatHalfWidth, t),
      y: quad(centreY, sideControl.y, throatY, t),
    });
  }
  for (let i = segments / 2 - 1; i > 0; i--) {
    const t = i / (segments / 2);
    pts.push({
      x: quad(radius, sideControl.x, throatHalfWidth, t),
      y: quad(centreY, sideControl.y, throatY, t),
    });
  }
  return pts;
}

/** Half the head's width at height `y` (0 outside it). */
export function halfWidthAt(y: number): number {
  const { radius, centreY, throatY, throatHalfWidth, sideControl } = HEAD;
  if (y > centreY + radius || y < throatY) return 0;
  if (y >= centreY) return Math.sqrt(radius * radius - (y - centreY) ** 2);
  // The side curve is monotonic in y, so a bisection finds its t for this height.
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (quad(centreY, sideControl.y, throatY, mid) > y) lo = mid;
    else hi = mid;
  }
  return quad(radius, sideControl.x, throatHalfWidth, (lo + hi) / 2);
}

export const isInsideHead = (p: Point, margin = 0) => Math.abs(p.x) <= halfWidthAt(p.y) - margin;

/** The face's perforations: the 21 logo holes, then the smaller fill holes. */
export function headHoles(): Hole[] {
  const logo: Hole[] = LOGO_ROWS.flatMap((count, row) => {
    const y = LOGO_CENTRE_Y + ((LOGO_ROWS.length - 1) / 2 - row) * LOGO_GAP;
    return Array.from({ length: count }, (_, i) => ({
      x: (i - (count - 1) / 2) * LOGO_GAP,
      y,
      r: LOGO_HOLE_R,
      logo: true,
    }));
  });

  const fill: Hole[] = [];
  const top = HEAD.centreY + HEAD.radius;
  for (let row = 0, y = top - EDGE_MARGIN; y > HEAD.throatY + 0.5; row++, y -= FILL_GAP * 0.87) {
    const offset = row % 2 ? FILL_GAP / 2 : 0;
    for (let x = -HEAD.radius + offset; x <= HEAD.radius; x += FILL_GAP) {
      const p = { x, y };
      if (!isInsideHead(p, EDGE_MARGIN)) continue;
      if (logo.some((h) => Math.hypot(h.x - x, h.y - y) < LOGO_CLEARANCE + h.r)) continue;
      fill.push({ x, y, r: FILL_HOLE_R, logo: false });
    }
  }
  return [...logo, ...fill];
}
