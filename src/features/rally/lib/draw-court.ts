import { COURT } from "./court";
import type { Vec } from "./physics";
import { BODY, posePlayer, type Pose } from "./pose";
import { dirToNet, PHYSICS_DT, POINT_PAUSE, RACKET, type Sim } from "./rally-sim";

export type ViewWindow = { minX: number; maxX: number; minY: number; maxY: number };

/** Court window drawn on the canvas, in metres: the court plus air for high balls. */
export const VIEW: ViewWindow = { minX: -0.9, maxX: 20.9, minY: -0.5, maxY: 5.4 };

export type CourtColors = Record<"ball" | "line" | "glass" | "light" | "racket" | "face", string>;

/** Canvas pixel mapping for a window onto the court, recomputed on resize. */
export type Viewport = { s: number; ox: number; oy: number; dpr: number; win: ViewWindow };

export function fitViewport(width: number, height: number, dpr: number, win = VIEW): Viewport {
  const w = win.maxX - win.minX;
  const h = win.maxY - win.minY;
  const s = Math.min(width / w, height / h);
  // Spare height goes above the court as sky, so the floor always sits on the bottom
  // edge rather than floating mid-canvas.
  return { s, dpr, win, ox: (width - w * s) / 2, oy: height - h * s };
}

export function toWorld(v: Viewport, px: number, py: number): Vec {
  return { x: (px - v.ox) / v.s + v.win.minX, y: v.win.maxY - (py - v.oy) / v.s };
}

const RIPPLE_LIFETIME = 0.9;
const SQUASH_TIME = 0.08;
const GLASS_DEPTH = 0.18;

/** Night-court rendering: glowing glass, floodlight pools, a lit ball trail. */
export function drawCourt(ctx: CanvasRenderingContext2D, sim: Sim, v: Viewport, c: CourtColors) {
  const P = (x: number, y: number) => ({
    x: v.ox + (x - v.win.minX) * v.s,
    y: v.oy + (v.win.maxY - y) * v.s,
  });
  const m = (metres: number) => metres * v.s;
  const d = v.dpr;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.lineCap = "round";

  // Floodlight pools on the floor.
  for (const x of [2, 6, 10, 14, 18]) {
    const f = P(x, 0);
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(1, 0.22);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, m(2.6));
    g.addColorStop(0, c.light);
    g.addColorStop(1, "transparent");
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, m(2.6), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Floor line fading out past the court, and the court surface.
  const fl = P(v.win.minX, 0);
  const fr = P(v.win.maxX, 0);
  const floor = ctx.createLinearGradient(fl.x, 0, fr.x, 0);
  floor.addColorStop(0, "transparent");
  floor.addColorStop(0.5, c.line);
  floor.addColorStop(1, "transparent");
  ctx.strokeStyle = floor;
  ctx.lineWidth = d;
  line(ctx, fl, fr);
  const court = P(0, 0);
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = c.line;
  ctx.fillRect(court.x, court.y, m(COURT.length), m(0.1));
  ctx.globalAlpha = 1;

  // Back walls: glass slab with a glowing inner edge, mesh hatching above.
  for (const [x0, edge] of [
    [-GLASS_DEPTH, 0],
    [COURT.length, COURT.length],
  ] as const) {
    const top = P(x0, COURT.glassHeight);
    const glass = ctx.createLinearGradient(0, top.y, 0, top.y + m(COURT.glassHeight));
    glass.addColorStop(0, c.glass);
    glass.addColorStop(1, "transparent");
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = glass;
    ctx.fillRect(top.x, top.y, m(GLASS_DEPTH), m(COURT.glassHeight));
    ctx.globalAlpha = 0.85;
    ctx.save();
    ctx.shadowColor = c.glass;
    ctx.shadowBlur = 14 * d;
    ctx.strokeStyle = c.glass;
    ctx.lineWidth = 1.5 * d;
    line(ctx, P(edge, 0.05), P(edge, COURT.glassHeight - 0.05));
    ctx.restore();

    const mesh = P(x0, COURT.meshTop);
    const meshH = m(COURT.meshTop - COURT.glassHeight);
    ctx.save();
    ctx.beginPath();
    ctx.rect(mesh.x, mesh.y, m(GLASS_DEPTH), meshH);
    ctx.clip();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = c.glass;
    ctx.lineWidth = d;
    for (let y = -m(GLASS_DEPTH); y < meshH; y += 4 * d) {
      line(
        ctx,
        { x: mesh.x, y: mesh.y + y },
        { x: mesh.x + m(GLASS_DEPTH), y: mesh.y + y + m(GLASS_DEPTH) },
      );
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // Net.
  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = c.racket;
  ctx.lineWidth = 2 * d;
  line(ctx, P(COURT.netX, 0), P(COURT.netX, COURT.netHeight));
  ctx.globalAlpha = 1;

  // Glass ripples spreading into the court from each impact.
  for (const r of sim.ripples) {
    const age = (sim.time - r.t0) / RIPPLE_LIFETIME;
    const at = P(r.p.x, r.p.y);
    const facing = Math.atan2(-r.n.y, r.n.x);
    ctx.save();
    ctx.shadowColor = c.glass;
    ctx.shadowBlur = 10 * d;
    ctx.strokeStyle = c.glass;
    ctx.lineWidth = 1.5 * d;
    for (let k = 0; k < 3; k++) {
      ctx.globalAlpha = Math.max(0, (1 - age) * r.strength * (1 - k * 0.3));
      ctx.beginPath();
      ctx.arc(
        at.x,
        at.y,
        m(0.2 + age * 1.3 + k * 0.22),
        facing - Math.PI / 2,
        facing + Math.PI / 2,
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  const pointOver =
    sim.ref.result && sim.nextServeAt !== null ? sim.time - (sim.nextServeAt - POINT_PAUSE) : null;
  for (const p of sim.players) {
    // A soft shadow on the floor shows where the player stands, and how high a jump goes.
    const foot = P(p.x, 0);
    ctx.save();
    ctx.globalAlpha = Math.max(0.08, 0.3 - p.jump * 0.2);
    ctx.fillStyle = c.racket;
    ctx.beginPath();
    ctx.ellipse(foot.x, foot.y, m(0.4), m(0.06), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const pose = posePlayer({
      racket: p.c,
      dir: dirToNet(p.side),
      x: p.x,
      vx: p.vx,
      jump: p.jump,
      sinceSwing: sim.time - p.swingAt,
      afterPoint:
        pointOver !== null && sim.ref.result
          ? { seconds: pointOver, won: sim.ref.result.winner === p.side }
          : null,
    });
    // The human's racket lights up when the ball is theirs and within reach: the cue
    // that this is the moment to meet it.
    const inReach =
      p.human &&
      !sim.ref.result &&
      sim.ref.hitter !== p.side &&
      Math.hypot(sim.ball.p.x - p.c.x, sim.ball.p.y - p.c.y) < RACKET.reach + sim.ball.radius + 0.5;
    drawPlayer(ctx, pose, P, m, c, d, p.human, inReach);
  }

  // Trail, tapering and fading towards its tail.
  const R = sim.ball.radius;
  ctx.strokeStyle = c.ball;
  for (let i = 1; i < sim.trail.length; i++) {
    const f = i / sim.trail.length;
    ctx.globalAlpha = f * 0.55;
    ctx.lineWidth = m(R) * 1.6 * f;
    line(ctx, P(sim.trail[i - 1]!.x, sim.trail[i - 1]!.y), P(sim.trail[i]!.x, sim.trail[i]!.y));
  }
  ctx.globalAlpha = 1;

  // Ball, interpolated between the last two physics states and squashed briefly on impact.
  const alpha = sim.acc / PHYSICS_DT;
  const bp = P(
    sim.prevBall.p.x + (sim.ball.p.x - sim.prevBall.p.x) * alpha,
    sim.prevBall.p.y + (sim.ball.p.y - sim.prevBall.p.y) * alpha,
  );
  const squashAge = sim.squash ? (sim.time - sim.squash.t0) / SQUASH_TIME : 1;
  const amount = squashAge < 1 ? 0.25 * (1 - squashAge) : 0;
  ctx.save();
  ctx.translate(bp.x, bp.y);
  if (sim.squash && amount > 0) ctx.rotate(Math.atan2(-sim.squash.n.y, sim.squash.n.x));
  ctx.scale(1 - amount, 1 + amount);
  ctx.shadowColor = c.ball;
  ctx.shadowBlur = 22 * d;
  ctx.fillStyle = c.ball;
  ctx.beginPath();
  ctx.arc(0, 0, m(R), 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = c.light;
  ctx.beginPath();
  ctx.arc(-m(R) * 0.3, -m(R) * 0.3, m(R) * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A line-drawn player in the court's drawing style. The computer is a ghost, so the
 * visitor's own player is always the one that stands out. */
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  P: (x: number, y: number) => Vec,
  m: (metres: number) => number,
  c: CourtColors,
  d: number,
  human: boolean,
  inReach: boolean,
) {
  const at = (v: Vec) => P(v.x, v.y);
  const limb = (points: Vec[], width: number) => {
    ctx.lineWidth = m(width);
    ctx.beginPath();
    const [first, ...rest] = points.map(at);
    ctx.moveTo(first!.x, first!.y);
    for (const pt of rest) ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  if (inReach) {
    const head = at(pose.racketHead);
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = c.ball;
    ctx.beginPath();
    ctx.arc(head.x, head.y, m(RACKET.reach + 0.1), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = human ? 1 : 0.45;
  ctx.strokeStyle = c.racket;
  ctx.fillStyle = c.racket;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Far leg a touch fainter, for depth.
  ctx.globalAlpha *= 0.7;
  limb([pose.hip, pose.knees[1], pose.feet[1]], 0.075);
  ctx.globalAlpha = human ? 1 : 0.45;
  limb([pose.hip, pose.knees[0], pose.feet[0]], 0.075);
  limb([pose.hip, pose.shoulder], 0.12);
  limb([pose.shoulder, pose.neck], 0.07);
  limb([pose.shoulder, pose.elbow, pose.hand], 0.065);

  const head = at(pose.head);
  ctx.beginPath();
  ctx.arc(head.x, head.y, m(BODY.headRadius), 0, Math.PI * 2);
  ctx.fill();
  if (human) {
    // The brand-orange headband marks the visitor's player.
    ctx.strokeStyle = c.ball;
    ctx.lineWidth = m(0.045);
    ctx.beginPath();
    ctx.arc(head.x, head.y, m(BODY.headRadius), Math.PI * 0.95, Math.PI * 2.05);
    ctx.stroke();
    ctx.strokeStyle = c.racket;
  }

  // Racket, face-on so its perforations — the logo's dot grid — stay visible.
  const rh = at(pose.racketHead);
  const hw = m(BODY.racketHalfWidth);
  const hh = m(BODY.racketHalfHeight);
  limb(
    [
      pose.hand,
      {
        x: pose.racketHead.x - Math.sin(pose.racketTilt) * BODY.racketHalfHeight,
        y: pose.racketHead.y - Math.cos(pose.racketTilt) * BODY.racketHalfHeight,
      },
    ],
    0.05,
  );
  ctx.translate(rh.x, rh.y);
  ctx.rotate(pose.racketTilt);
  ctx.beginPath();
  ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
  ctx.fillStyle = c.face;
  ctx.fill();
  ctx.lineWidth = human ? 2.5 * d : 1.5 * d;
  ctx.strokeStyle = human ? c.ball : c.racket;
  ctx.stroke();
  ctx.fillStyle = c.racket;
  const gap = m(0.07);
  const r = Math.max(0.7 * d, m(0.014));
  for (let y = -hh + gap; y < hh; y += gap) {
    for (let x = -hw + gap; x < hw; x += gap) {
      if ((x / (hw * 0.8)) ** 2 + (y / (hh * 0.8)) ** 2 > 1) continue;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function line(ctx: CanvasRenderingContext2D, a: Vec, b: Vec) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}
