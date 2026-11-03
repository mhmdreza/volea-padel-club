# Rally feature

Playable side-elevation padel court on the homepage. Four computer rackets play
doubles; hovering with a mouse (or "Take the racket" for touch/keyboard) puts the
visitor on the left team.

- `lib/physics.ts` — small hand-written 2D engine: fixed timestep, sub-stepped
  collisions, per-surface materials (floor bounce from the FIP ball spec).
- `lib/court.ts` — real FIP court dimensions and shot planning.
- `lib/referee.ts` — padel rules as a pure state transition (wall before the bounce,
  double bounce, net, out, por tres; one hit per team).
- `lib/rally-sim.ts` — ties physics, referee and computer players together,
  renderer-independent.
- `lib/draw-court.ts` — Canvas 2D renderer, colours read from the CSS tokens.

The pure modules are covered by `tests/rally-*.test.ts`.
