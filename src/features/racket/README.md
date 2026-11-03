# Racket feature

"Pick up the racket": a 3D padel racket on the homepage, modelled entirely in code
with three.js / React Three Fiber — no downloaded models or HDR files.

- `lib/racket-shape.ts` — the head outline and hole layout as plain numbers (real
  proportions, the logo's 21-dot grid as the larger holes); tested in
  `tests/racket-shape.test.ts`.
- `scene/racket-canvas.tsx` — the 3D scene: extruded perforated carbon face, rim,
  wrapped grip, logo rings, Lightformer studio lighting, drag-to-turn.
- `racket-stage.tsx` — lazy loads the scene a screen ahead, renders only while on
  screen, and falls back to a flat drawing for reduced motion or no WebGL.
