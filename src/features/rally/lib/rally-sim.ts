import { BALL_RADIUS, COURT, COURT_SURFACES, isOutOfCourt, planShot } from "./court";
import { GRAVITY, step, type Ball, type Capsule, type RacketMotion, type Vec } from "./physics";
import {
  createReferee,
  judge,
  otherSide,
  sideOf,
  type Call,
  type PointResult,
  type Referee,
  type RefereeEvent,
  type Side,
} from "./referee";

/**
 * The rally simulation, independent of any renderer: physics at a fixed step, the
 * referee, and the players. It's a singles match — `demo` has the computer on both
 * sides, `play` puts the human on the left, first to MATCH_POINTS, and `practice` is
 * the same game without a score. The human serves their own serves. Both sides play
 * by the same rules: they run along the floor, jump, and their shot comes out of
 * how they were moving when they met the ball.
 */

export const PHYSICS_DT = 1 / 240;
export const POINT_PAUSE = 1.6;
// A rally can't last forever without a winner, but guard against a stuck ball anyway.
const MAX_POINT_TIME = 30;
export const MATCH_POINTS = 5;
// The human serves with Space; if they don't within this long, the serve goes anyway
// so a match can never stall.
const SERVE_TIMEOUT = 8;

// Movement, in court metres and seconds.
export const RUN_SPEED = 7;
const RUN_RESPONSE = 0.08;
/** Racket height while standing; jumping lifts it about a metre. */
export const HAND_HEIGHT = 1.0;
const JUMP_SPEED = Math.sqrt(2 * GRAVITY * 1.0);
const BOUNDS: Record<Side, [number, number]> = {
  left: [0.4, COURT.netX - 0.4],
  right: [COURT.netX + 0.4, COURT.length - 0.4],
};

// The hit zone around the racket head: more forgiving than the drawn racket, since
// meeting the ball at the right moment is the skill, not pixel-perfect aim.
export const RACKET = { axisHalf: 0.15, reach: 0.5 };

/**
 * How movement turns into a shot. Standing still only blocks the ball, which drops
 * short unless you're near the net; stepping into it towards the net adds pace and
 * depth (too much close to the net goes long), backing off drops it shorter still.
 * A higher contact — a jump — flattens the shot, like a bandeja: jumping is how you
 * reach a high ball, not a way to hit it further.
 */
export const SHOT = { forward: 4, perRun: 1, lift: 6, flattenPerMetre: 2.2, minLift: 1 };
// Share of the computer's shots played as a high lob, so the human sometimes has to jump.
const LOB_CHANCE = 0.3;
const LOB_LIFT = 2.5;

// The computer's mistakes are physical, not dice rolls: it reacts a moment late, can
// only run so fast, and its aim scatters more the faster the ball it's returning.
const REACTION_TIME = 0.25;
const AIM_SCATTER = 0.6;
const AIM_SCATTER_PER_SPEED = 0.18;

export type Mode = "demo" | "play" | "practice";

export type Player = {
  side: Side;
  human: boolean;
  /** Position along the court and run velocity. */
  x: number;
  vx: number;
  /** Height above standing and vertical velocity: non-zero while jumping. */
  jump: number;
  vy: number;
  /** Racket head centre and velocity, derived from the above — drawn and used to hit. */
  c: Vec;
  v: Vec;
  /** When the last swing started, for the swing animation. */
  swingAt: number;
  /** Computer only: it starts chasing the ball from this time, after reacting. */
  reactAt: number;
};

export type HumanInput = { run: -1 | 0 | 1; jump: boolean };

export type SimEvent =
  | { type: "call"; call: Call }
  | { type: "hit"; side: Side }
  | { type: "point"; result: PointResult }
  | { type: "match"; winner: Side };

export type MatchStats = {
  score: Record<Side, number>;
  winner: Side | null;
  /** Most returns the human made in a single point. */
  longestRally: number;
  porTres: number;
};

export type Sim = {
  mode: Mode;
  ball: Ball;
  prevBall: Ball;
  acc: number;
  time: number;
  ref: Referee;
  /** Shots in the current point, serve excluded. */
  rally: number;
  server: Side;
  pointStartedAt: number;
  nextServeAt: number | null;
  /** The human is holding the ball to serve, since this time; null otherwise. */
  awaitingServe: number | null;
  humanHits: number;
  match: MatchStats;
  players: Player[];
  trail: Vec[];
  ripples: { p: Vec; n: Vec; strength: number; t0: number }[];
  squash: { n: Vec; t0: number } | null;
  rand: () => number;
};

export const dirToNet = (side: Side) => (side === "left" ? 1 : -1);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const homeX = (side: Side) => (side === "left" ? 2.2 : COURT.length - 2.2);

function makePlayer(side: Side, human: boolean): Player {
  const x = homeX(side);
  return {
    side,
    human,
    x,
    vx: 0,
    jump: 0,
    vy: 0,
    c: { x, y: HAND_HEIGHT },
    v: { x: 0, y: 0 },
    swingAt: -1,
    reactAt: 0,
  };
}

const newMatch = (): MatchStats => ({
  score: { left: 0, right: 0 },
  winner: null,
  longestRally: 0,
  porTres: 0,
});

export function createSim(mode: Mode, rand: () => number = Math.random): Sim {
  const sim: Sim = {
    mode,
    ball: { p: { x: 0, y: 0 }, v: { x: 0, y: 0 }, radius: BALL_RADIUS },
    prevBall: { p: { x: 0, y: 0 }, v: { x: 0, y: 0 }, radius: BALL_RADIUS },
    acc: 0,
    time: 0,
    ref: createReferee("left"),
    rally: 0,
    server: "right",
    pointStartedAt: 0,
    nextServeAt: null,
    awaitingServe: null,
    humanHits: 0,
    match: newMatch(),
    players: [],
    trail: [],
    ripples: [],
    squash: null,
    rand,
  };
  setMode(sim, mode);
  return sim;
}

/** Switches mode and starts afresh: computer vs computer, or a new match to play. */
export function setMode(sim: Sim, mode: Mode) {
  sim.mode = mode;
  sim.match = newMatch();
  sim.players = [makePlayer("left", mode !== "demo"), makePlayer("right", false)];
  // Every new practice or match opens with the left side's serve — the visitor's.
  sim.server = "right";
  serve(sim);
}

/** Upward speed of a shot met at height `contactY`: lower the higher the contact. */
export const liftAt = (contactY: number) =>
  Math.max(SHOT.minLift, SHOT.lift - SHOT.flattenPerMetre * (contactY - HAND_HEIGHT));

/** The shot a player makes from how they were moving when they met the ball, at `contactY`. */
export function shotFromMovement(side: Side, racketV: Vec, contactY = HAND_HEIGHT): Vec {
  const dir = dirToNet(side);
  const forward = Math.max(0.5, SHOT.forward + SHOT.perRun * racketV.x * dir);
  return { x: forward * dir, y: liftAt(contactY) };
}

/** The run speed (towards the net positive) the computer lunges with to land near `targetX`. */
function runFor(side: Side, from: Vec, targetX: number, vy: number) {
  const drop = from.y - BALL_RADIUS;
  const flight = (vy + Math.sqrt(vy * vy + 2 * GRAVITY * drop)) / GRAVITY;
  const forward = ((targetX - from.x) * dirToNet(side)) / flight;
  return clamp((forward - SHOT.forward) / SHOT.perRun, -RUN_SPEED, RUN_SPEED);
}

/** Starts the next point: the computer serves straight away, the human gets the ball. */
function serve(sim: Sim) {
  sim.server = otherSide(sim.server);
  const side = sim.server;
  sim.ref = createReferee(side);
  sim.rally = 0;
  sim.trail = [];
  sim.pointStartedAt = sim.time;
  sim.nextServeAt = null;
  sim.humanHits = 0;
  for (const p of sim.players) {
    if (p.human) continue;
    p.x = p.side === side ? (side === "left" ? 1.5 : COURT.length - 1.5) : homeX(p.side);
    p.vx = 0;
    p.reactAt = sim.time + REACTION_TIME;
  }
  const server = sim.players.find((p) => p.side === side)!;
  if (server.human) {
    sim.awaitingServe = sim.time;
    holdBall(sim, server);
  } else {
    launchServe(sim, server);
  }
}

/** While waiting to serve, the ball sits just in front of the server's racket. */
function holdBall(sim: Sim, p: Player) {
  const at = { x: p.x + dirToNet(p.side) * 0.3, y: HAND_HEIGHT + 0.1 };
  sim.ball = { p: at, v: { x: 0, y: 0 }, radius: BALL_RADIUS };
  sim.prevBall = sim.ball;
}

/** An underhand serve deep into the receiver's half (serve rules are simplified). */
function launchServe(sim: Sim, p: Player) {
  sim.awaitingServe = null;
  const from = { x: p.x + dirToNet(p.side) * 0.3, y: HAND_HEIGHT };
  const targetX = COURT.netX + dirToNet(p.side) * (3.5 + sim.rand() * 3);
  sim.ball = { p: from, v: planShot(from, targetX, 1.3), radius: BALL_RADIUS };
  sim.prevBall = sim.ball;
  p.swingAt = sim.time;
}

const theirBall = (p: Player, sim: Sim) =>
  !sim.ref.result && sim.ref.hitter !== p.side && !sim.match.winner;

/** Whether the computer plays the ball now: after the bounce, once it's coming back
 * off the glass (or dropping low), and only if the racket can actually reach it. */
export function wantsToHit(player: Player, ball: Ball, ref: Referee) {
  if (ref.result || ref.hitter === player.side || sideOf(ball.p.x) !== player.side) return false;
  const towardNet = ball.v.x * dirToNet(player.side) > 0;
  const inReach =
    Math.hypot(ball.p.x - player.c.x, ball.p.y - player.c.y) < RACKET.reach + ball.radius;
  return inReach && ref.bounces === 1 && ball.v.y < 0 && (towardNet || ball.p.y < 0.7);
}

/** Steering for a computer player: run behind the ball when it's theirs, home otherwise;
 * jump for a ball that would pass over the racket. */
function computerControl(p: Player, sim: Sim): HumanInput {
  const { ball } = sim;
  const mine = theirBall(p, sim) && sim.time >= p.reactAt;
  const targetX = mine ? ball.p.x - dirToNet(p.side) * 0.3 : homeX(p.side);
  const gap = targetX - p.x;
  const run = Math.abs(gap) < 0.15 ? 0 : gap > 0 ? 1 : -1;
  const overhead = ball.p.y > HAND_HEIGHT + RACKET.reach && ball.p.y < HAND_HEIGHT + 1.6;
  const jump = mine && sideOf(ball.p.x) === p.side && Math.abs(ball.p.x - p.x) < 0.8 && overhead;
  return { run, jump };
}

/** Moves a player one physics step: run with a short ramp, jump under gravity. */
function movePlayer(p: Player, input: HumanInput, dt: number) {
  const [min, max] = BOUNDS[p.side];
  p.vx += (input.run * RUN_SPEED - p.vx) * (1 - Math.exp(-dt / RUN_RESPONSE));
  p.x = clamp(p.x + p.vx * dt, min, max);
  if (p.x === min || p.x === max) p.vx = 0;
  if (input.jump && p.jump === 0) p.vy = JUMP_SPEED;
  if (p.jump > 0 || p.vy > 0) {
    p.vy -= GRAVITY * dt;
    p.jump = Math.max(0, p.jump + p.vy * dt);
    if (p.jump === 0) p.vy = 0;
  }
  p.c = { x: p.x, y: HAND_HEIGHT + p.jump };
  p.v = { x: p.vx, y: p.vy };
}

function capsuleAt(c: Vec): Capsule {
  return {
    a: { x: c.x, y: c.y - RACKET.axisHalf },
    b: { x: c.x, y: c.y + RACKET.axisHalf },
    radius: RACKET.reach,
  };
}

/**
 * Advances the simulation by one rendered frame. Mutates `sim` — it runs every
 * frame, so it avoids allocating a new world each time.
 */
export function tick(
  sim: Sim,
  frameDt: number,
  input: HumanInput = { run: 0, jump: false },
): SimEvent[] {
  const events: SimEvent[] = [];
  // A Space press either serves or jumps, never both in one frame.
  let jump = input.jump;
  sim.acc += frameDt;
  const steps = Math.floor(sim.acc / PHYSICS_DT);

  for (let i = 0; i < steps; i++) {
    sim.acc -= PHYSICS_DT;
    sim.time += PHYSICS_DT;
    sim.prevBall = sim.ball;

    if (sim.nextServeAt !== null && sim.time >= sim.nextServeAt) serve(sim);
    const live = sim.awaitingServe === null;
    if (live && !sim.ref.result && sim.time - sim.pointStartedAt > MAX_POINT_TIME) {
      serve(sim);
    }

    const human = sim.players.find((p) => p.human);
    const humanFrom = human ? { ...human.c } : null;
    if (sim.awaitingServe !== null && human) {
      // Space serves instead of jumping; the human can still walk to pick a spot.
      const timedOut = sim.time - sim.awaitingServe > SERVE_TIMEOUT;
      movePlayer(human, { run: input.run, jump: false }, PHYSICS_DT);
      for (const p of sim.players) if (!p.human) movePlayer(p, computerControl(p, sim), PHYSICS_DT);
      if (jump || timedOut) {
        launchServe(sim, human);
        jump = false;
      } else {
        holdBall(sim, human);
      }
      continue;
    }
    for (const p of sim.players) {
      movePlayer(p, p.human ? { run: input.run, jump } : computerControl(p, sim), PHYSICS_DT);
    }

    // One hit per team: the racket only touches the ball when it's that side's turn,
    // so a second contact can't spoil the shot that was just played.
    const motion: RacketMotion | undefined =
      human && humanFrom && theirBall(human, sim)
        ? { from: capsuleAt(humanFrom), to: capsuleAt(human.c), v: human.v }
        : undefined;

    const { ball, contacts } = step(sim.ball, PHYSICS_DT, COURT_SURFACES, motion);
    sim.ball = ball;
    // Once the match is decided the ball just finishes its flight.
    if (sim.match.winner) continue;

    for (const contact of contacts) {
      let event: RefereeEvent | null = null;
      if (contact.kind === "racket") event = { type: "hit", by: "left" };
      else if (contact.kind === "floor" && contact.speed > 0.05)
        event = { type: "floor", x: contact.p.x };
      else if (contact.kind === "glass" || contact.kind === "mesh")
        event = { type: "wall", x: contact.p.x };
      if (contact.kind === "glass" && contact.speed > 1) {
        sim.ripples.push({
          p: contact.p,
          n: contact.n,
          strength: Math.min(1, contact.speed / 8),
          t0: sim.time,
        });
      }
      if (contact.speed > 1) sim.squash = { n: contact.n, t0: sim.time };
      if (!event) continue;
      const hitterBefore = sim.ref.hitter;
      referee(sim, event, events);
      // The racket contact only decides *that* the ball was met; the shot itself
      // comes from how the player was moving.
      if (event.type === "hit" && human && sim.ref.hitter !== hitterBefore) {
        playShot(sim, human, shotFromMovement(human.side, human.v, sim.ball.p.y));
        sim.humanHits += 1;
      }
    }

    if (isOutOfCourt(sim.ball.p)) referee(sim, { type: "out", x: sim.ball.p.x }, events);

    for (const p of sim.players) {
      if (p.human || !wantsToHit(p, sim.ball, sim.ref)) continue;
      const dir = dirToNet(p.side);
      const incoming = Math.hypot(sim.ball.v.x, sim.ball.v.y);
      const scatter = (sim.rand() * 2 - 1) * (AIM_SCATTER + incoming * AIM_SCATTER_PER_SPEED);
      const aimX = COURT.netX + dir * (2.5 + sim.rand() * 5) + scatter;
      const lob = sim.rand() < LOB_CHANCE ? LOB_LIFT : 0;
      const shot = shotFromMovement(p.side, { x: 0, y: 0 }, sim.ball.p.y);
      const vy = shot.y + lob;
      p.vx = runFor(p.side, sim.ball.p, aimX, vy) * dir;
      referee(sim, { type: "hit", by: p.side }, events);
      const v = shotFromMovement(p.side, { x: p.vx, y: p.vy }, sim.ball.p.y);
      playShot(sim, p, { x: v.x, y: v.y + lob });
      break;
    }
  }

  sim.trail.push(sim.ball.p);
  if (sim.trail.length > 28) sim.trail.shift();
  while (sim.ripples[0] && sim.time - sim.ripples[0].t0 > 0.9) sim.ripples.shift();
  return events;
}

function playShot(sim: Sim, player: Player, v: Vec) {
  sim.ball = { ...sim.ball, v };
  sim.squash = { n: { x: dirToNet(player.side), y: 0 }, t0: sim.time };
  player.swingAt = sim.time;
  for (const p of sim.players) if (p !== player) p.reactAt = sim.time + REACTION_TIME;
}

function referee(sim: Sim, event: RefereeEvent, events: SimEvent[]) {
  const before = sim.ref;
  const { ref, call } = judge(before, event);
  sim.ref = ref;
  if (ref.hitter !== before.hitter) {
    sim.rally += 1;
    events.push({ type: "hit", side: ref.hitter });
  }
  if (call) events.push({ type: "call", call });
  if (ref.result && !before.result) {
    events.push({ type: "point", result: ref.result });
    sim.nextServeAt = sim.time + POINT_PAUSE;
    if (sim.mode === "play") scorePoint(sim, ref.result, events);
  }
}

function scorePoint(sim: Sim, result: PointResult, events: SimEvent[]) {
  const { match } = sim;
  match.score[result.winner] += 1;
  match.longestRally = Math.max(match.longestRally, sim.humanHits);
  if (result.winner === "left" && result.reason === "porTres") match.porTres += 1;
  if (match.score[result.winner] >= MATCH_POINTS) {
    match.winner = result.winner;
    sim.nextServeAt = null;
    events.push({ type: "match", winner: result.winner });
  }
}
