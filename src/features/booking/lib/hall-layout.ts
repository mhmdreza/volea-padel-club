// Top-down hall plan, 1 m = 10 units. Court sizes are real (doubles 10×20 m,
// singles 6×20 m); their arrangement in the hall is illustrative only — the real
// floor plan isn't published yet.
export type Rect = { x: number; y: number; w: number; h: number };
export type Segment = readonly [x1: number, y1: number, x2: number, y2: number];

// The band under the courts carries each court's free-slot label, clear of the lights.
export const HALL = { width: 500, height: 250 } as const;

const COURT_RECTS: Record<string, Rect> = {
  "doubles-1": { x: 10, y: 10, w: 100, h: 200 },
  "doubles-2": { x: 125, y: 10, w: 100, h: 200 },
  "doubles-3": { x: 240, y: 10, w: 100, h: 200 },
  "singles-1": { x: 355, y: 10, w: 60, h: 200 },
  "singles-2": { x: 430, y: 10, w: 60, h: 200 },
};

// Placement order, left to right — also the keyboard order of the plan.
export const PLAN_ORDER = Object.keys(COURT_RECTS);

export function courtRect(courtId: string): Rect {
  const rect = COURT_RECTS[courtId];
  if (!rect) throw new Error(`No hall position for court "${courtId}"`);
  return rect;
}

// Service lines sit 6.95 m either side of the net; the centre line joins them.
const SERVICE = 69.5;

export function courtLines({ x, y, w, h }: Rect): Segment[] {
  const net = y + h / 2;
  return [
    [x, net - SERVICE, x + w, net - SERVICE],
    [x, net + SERVICE, x + w, net + SERVICE],
    [x + w / 2, net - SERVICE, x + w / 2, net + SERVICE],
  ];
}

export function netLine({ x, y, w, h }: Rect): Segment {
  return [x - 3, y + h / 2, x + w + 3, y + h / 2];
}

// Glass runs along both back walls and the first 4 m of each side; the middle
// of each side is mesh.
const GLASS_RETURN = 40;

export function glassWalls({ x, y, w, h }: Rect): string[] {
  return [
    `M${x} ${y + GLASS_RETURN} V${y} H${x + w} V${y + GLASS_RETURN}`,
    `M${x} ${y + h - GLASS_RETURN} V${y + h} H${x + w} V${y + h - GLASS_RETURN}`,
  ];
}

export function meshStrips({ x, y, w, h }: Rect): Rect[] {
  const length = h - 2 * GLASS_RETURN;
  return [
    { x: x - 3, y: y + GLASS_RETURN, w: 3, h: length },
    { x: x + w, y: y + GLASS_RETURN, w: 3, h: length },
  ];
}

// The logo's 21 dots (rows 3-5-5-5-3) as ceiling lights: one column per court,
// so the short top and bottom rows hang over the middle three courts.
export const CEILING_LIGHTS = [3, 5, 5, 5, 3].flatMap((count, row) => {
  const first = (5 - count) / 2;
  return Array.from({ length: count }, (_, i) => {
    const courtId = PLAN_ORDER[first + i]!;
    const rect = courtRect(courtId);
    return { courtId, x: rect.x + rect.w / 2, y: rect.y + (rect.h * (row + 0.5)) / 5 };
  });
});
