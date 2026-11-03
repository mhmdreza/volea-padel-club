// Kept apart from the 3D scene so the page can create and update these without
// pulling three.js into the main bundle.

/** Live inputs from the page, read every frame without re-rendering React. */
export type RacketInputs = {
  /** Extra turn from the keyboard buttons, in radians. */
  nudge: number;
  /** Section scroll position, -1 (below the viewport) … 1 (above). */
  scroll: number;
  /** Turn and tilt added by dragging, radians; spin speed carried after letting go. */
  dragYaw: number;
  dragPitch: number;
  velocity: number;
  dragging: boolean;
  /** performance.now() of the last drag movement, to bring the idle sway back later. */
  lastDrag: number;
};

export const initialInputs = (): RacketInputs => ({
  nudge: 0,
  scroll: 0,
  dragYaw: 0,
  dragPitch: 0,
  velocity: 0,
  dragging: false,
  lastDrag: -Infinity,
});
