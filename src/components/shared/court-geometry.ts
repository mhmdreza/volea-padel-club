// The hero's court in perspective (1440×900 space), copied from
// src/features/home/hero-story.tsx so the small motifs match it exactly without
// coupling to the animated hero. Keep the two in step if the hero's court changes.

export const FLOOR = "470,470 970,470 1712.7,900 -272.7,900";

export const COURT_LINES = [
  [470, 470, 970, 470],
  [384.5, 519.5, 1055.5, 519.5],
  [720, 519.5, 720, 668],
  [470, 470, 128, 668],
  [970, 470, 1312, 668],
] as const;

// Back wall: 3 m of glass in 2 m panels, 1 m of mesh above.
export const BACK_GLASS = { x: 470, y: 320, width: 500, height: 150 } as const;
export const BACK_GLASS_JOINTS = [570, 670, 770, 870] as const;
export const BACK_MESH = { x: 470, y: 270, width: 500, height: 50 } as const;

// Side glass in perspective: 3 m high near the back wall, stepping to 2 m.
const SIDE_PANELS_LEFT = [
  "470,470 470,320 401.6,318.6 401.6,509.6",
  "401.6,509.6 401.6,318.6 321.8,316.8 321.8,555.8",
  "321.8,555.8 321.8,396.8 230.6,412.8 230.6,608.6",
  "230.6,608.6 230.6,412.8 128,431 128,668",
];
const SIDE_MESH_LEFT = "470,320 470,270 321.8,237.2 321.8,316.8";

export const mirror = (points: string) =>
  points
    .split(" ")
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return `${1440 - x!},${y}`;
    })
    .join(" ");

export const SIDE_PANELS = [...SIDE_PANELS_LEFT, ...SIDE_PANELS_LEFT.map(mirror)];
export const SIDE_MESH = [SIDE_MESH_LEFT, mirror(SIDE_MESH_LEFT)];

// Board strips along the foot of the glass (about the bottom eighth of each panel),
// where in-hall advertising usually sits. Illustrative, not a plan of the real hall.
const BOARDS_LEFT = [
  "470,470 470,450 401.6,484.1 401.6,509.6",
  "401.6,509.6 401.6,484.1 321.8,523.9 321.8,555.8",
];
export const BOARDS = {
  back: { x: 470, y: 450, width: 500, height: 20 },
  sides: [...BOARDS_LEFT, ...BOARDS_LEFT.map(mirror)],
} as const;

export const NET = { x1: 128, x2: 1312, y: 564, bottom: 668 } as const;

// The logo's dots as ceiling lights in perspective, top row → back row.
export const CEILING_ROWS = [
  { y: 235, gap: 70, r: 5, count: 3 },
  { y: 205, gap: 95, r: 6, count: 5 },
  { y: 170, gap: 125, r: 7.5, count: 5 },
  { y: 130, gap: 165, r: 9, count: 5 },
  { y: 85, gap: 215, r: 11, count: 3 },
] as const;

export const ceilingDots = (rows: readonly (typeof CEILING_ROWS)[number][]) =>
  rows.flatMap(({ y, gap, r, count }) =>
    Array.from({ length: count }, (_, i) => ({ x: 720 + (i - (count - 1) / 2) * gap, y, r })),
  );

export const BALL_PATH = "M560 330 Q660 350 735 505 Q790 440 845 415 Q905 405 960 498";
export const GLASS_POINT = { x: 845, y: 415 } as const;
