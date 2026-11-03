import { COURT } from "./court";

/** Teams by end of the court; the human plays on the left. */
export type Side = "left" | "right";

export const sideOf = (x: number): Side => (x < COURT.netX ? "left" : "right");
export const otherSide = (side: Side): Side => (side === "left" ? "right" : "left");

export type PointReason =
  /** Ball bounced on the hitter's own side — it never cleared the net. */
  | "net"
  /** Ball hit the receivers' glass or mesh before bouncing on their floor. */
  | "wallFirst"
  /** Ball bounced twice on the receivers' side. */
  | "doubleBounce"
  /** Ball left the court without bouncing on the receivers' side first. */
  | "out"
  /** Ball bounced, then left the court over the receivers' walls — a winner. */
  | "porTres";

export type PointResult = { winner: Side; reason: PointReason };

export type RefereeEvent =
  | { type: "hit"; by: Side }
  | { type: "floor"; x: number }
  | { type: "wall"; x: number }
  | { type: "out"; x: number };

/** Moments worth narrating while the point is still alive. */
export type Call = "bounce" | "offTheGlass" | "volley";

export type Referee = { hitter: Side; bounces: number; result: PointResult | null };

export const createReferee = (server: Side): Referee => ({
  hitter: server,
  bounces: 0,
  result: null,
});

/**
 * The padel rules that matter in a side view, as a pure state transition. Each
 * team gets one hit per crossing (a second touch by the same team is ignored, so
 * partners can't both hit). Serve-specific rules are left out on purpose.
 */
export function judge(ref: Referee, event: RefereeEvent): { ref: Referee; call: Call | null } {
  if (ref.result) return { ref, call: null };
  const receiver = otherSide(ref.hitter);
  const end = (winner: Side, reason: PointReason) => ({
    ref: { ...ref, result: { winner, reason } },
    call: null,
  });

  switch (event.type) {
    case "hit":
      if (event.by === ref.hitter) return { ref, call: null };
      return {
        ref: { hitter: event.by, bounces: 0, result: null },
        call: ref.bounces === 0 ? "volley" : null,
      };
    case "floor": {
      if (sideOf(event.x) === ref.hitter) return end(receiver, "net");
      const bounces = ref.bounces + 1;
      if (bounces === 2) return end(ref.hitter, "doubleBounce");
      return { ref: { ...ref, bounces }, call: "bounce" };
    }
    case "wall":
      // Playing the ball off your own wall is legal; the receivers' walls only
      // count once the ball has bounced on their floor.
      if (sideOf(event.x) === ref.hitter) return { ref, call: null };
      if (ref.bounces === 0) return end(receiver, "wallFirst");
      return { ref, call: "offTheGlass" };
    case "out": {
      const side: Side = event.x < COURT.netX ? "left" : "right";
      if (side === ref.hitter || ref.bounces === 0) return end(receiver, "out");
      return end(ref.hitter, "porTres");
    }
  }
}
