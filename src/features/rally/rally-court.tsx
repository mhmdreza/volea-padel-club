"use client";

import { ChevronLeft, ChevronRight, Pause, Play, Smartphone, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { courts } from "@/content/courts";
import { LOGO_DOTS } from "@/components/shared/section-dots";
import { Link } from "@/i18n/navigation";
import { readCssVar } from "@/lib/css-var";
import { cn } from "@/lib/utils";

import {
  drawCourt,
  fitViewport,
  toWorld,
  VIEW,
  type CourtColors,
  type Viewport,
} from "./lib/draw-court";
import {
  createSim,
  MATCH_POINTS,
  setMode,
  tick,
  type HumanInput,
  type MatchStats,
  type Mode,
} from "./lib/rally-sim";
import type { Call, PointReason, Side } from "./lib/referee";

// Real padel is fast; at full speed the ball is hard to follow on a page-sized
// court. A slight slow motion keeps it readable without changing the physics.
const TIME_SCALE = 0.75;
const MAX_FRAME_DT = 0.1;
// A touch shorter and stiller than this is a tap (jump), not a drag (run).
const TAP_MS = 220;
const TAP_SLOP_PX = 12;
const BEST_KEY = "volea-rally-best";
// Practice asks "keep going or play a match?" after this many good shots, then every
// PRACTICE_PROMPT_EVERY more.
const PRACTICE_PROMPT_AT = 5;
const PRACTICE_PROMPT_EVERY = 10;
// Distance to run before the "run" hint counts as learned.
const PRACTICE_RUN_DISTANCE = 1.2;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
// Phones and tablets play full screen with on-screen buttons.
const COARSE_POINTER = "(pointer: coarse)";
const PORTRAIT = "(orientation: portrait)";
const subscribeQuery = (query: string) => (onChange: () => void) => {
  const list = window.matchMedia(query);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
};
const useMediaQuery = (query: string) =>
  useSyncExternalStore(
    subscribeQuery(query),
    () => window.matchMedia(query).matches,
    () => false,
  );

// Small persisted values; storage can be blocked (private mode), so both are best-effort.
function readStored(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not persisted; the game still works.
  }
}

// The best rally lives in localStorage; reading it through useSyncExternalStore keeps
// the server render (0) and hydration consistent.
const bestListeners = new Set<() => void>();
const readBest = () => Number(readStored(BEST_KEY)) || 0;
function writeBest(score: number) {
  writeStored(BEST_KEY, String(score));
  bestListeners.forEach((notify) => notify());
}
const subscribeBest = (notify: () => void) => {
  bestListeners.add(notify);
  return () => bestListeners.delete(notify);
};

type Caption =
  | { kind: "call"; call: Call; id: number }
  | { kind: "point"; reason: PointReason; winner: Side; inPlay: boolean; id: number };

type Overlay = { kind: "none" } | { kind: "practiceDone" } | { kind: "result"; match: MatchStats };

/** Practice hints, in order: run, serve, hit; then free practice counting good shots. */
type PracticeStep = "run" | "serve" | "hit" | "free";

type Controls = {
  sync: () => void;
  setMode: (mode: Mode) => void;
  setPaused: (p: boolean) => void;
  /** On-screen run buttons: -1 left, 1 right, 0 released. */
  setHeld: (direction: -1 | 0 | 1) => void;
  jump: () => void;
};

function readColors(): CourtColors {
  return {
    ball: readCssVar("--primary"),
    line: readCssVar("--muted-foreground"),
    glass: readCssVar("--scene-glass"),
    light: readCssVar("--scene-light"),
    racket: readCssVar("--foreground"),
    face: readCssVar("--card"),
  };
}

// The rally is one-on-one, so the result card hands over a singles court.
const RALLY_COURT_ID = courts.find((court) => court.kind === "singles")?.id;

export function RallyCourt() {
  const t = useTranslations("Home.rally");
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<Controls | null>(null);

  const reducedMotion = useMediaQuery(REDUCED_MOTION);
  const touch = useMediaQuery(COARSE_POINTER);
  const portrait = useMediaQuery(PORTRAIT);
  const [fullscreenWanted, setFullscreenWanted] = useState(false);
  // Reduced motion: the court starts paused (WCAG 2.3.3) — motion only on request.
  const [userRunning, setUserRunning] = useState<boolean | null>(null);
  const running = userRunning ?? !reducedMotion;
  const runningRef = useRef(running);
  const [mode, setModeState] = useState<Mode>("demo");
  const [score, setScore] = useState<Record<Side, number>>({ left: 0, right: 0 });
  const [rally, setRally] = useState(0);
  const best = useSyncExternalStore(subscribeBest, readBest, () => 0);
  const [caption, setCaption] = useState<Caption | null>(null);
  const [overlay, setOverlay] = useState<Overlay>({ kind: "none" });
  const [practiceStep, setPracticeStep] = useState<PracticeStep>("run");
  const [goodShots, setGoodShots] = useState(0);
  const [serving, setServing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const sim = createSim("demo");
    let colors = readColors();
    let viewport: Viewport = fitViewport(1, 1, 1);
    let raf = 0;
    let last = 0;
    let onScreen = true;
    let paused = false;
    let captionId = 0;
    // Input: held arrow keys, a queued jump, and where a dragging finger wants to go.
    const keys = new Set<string>();
    let jumpQueued = false;
    let touchX: number | null = null;
    let held: -1 | 0 | 1 = 0;
    let touchStart: { t: number; x: number; y: number } | null = null;
    // Practice progress, mirrored into React state only when it changes.
    let step: PracticeStep = "run";
    let good = 0;
    let promptAt = PRACTICE_PROMPT_AT;
    let startX = 0;
    let wasServing = false;
    // Set once the visitor has held the ball to serve, so "serve" only completes on a real serve.
    let servedOnce = false;

    function changeMode(next: Mode) {
      setMode(sim, next);
      keys.clear();
      jumpQueued = false;
      touchX = null;
      held = 0;
      step = "run";
      servedOnce = false;
      good = 0;
      promptAt = PRACTICE_PROMPT_AT;
      startX = sim.players.find((p) => p.human)?.x ?? 0;
      setPracticeStep(step);
      setGoodShots(0);
      setModeState(next);
      setScore({ left: 0, right: 0 });
      setRally(0);
      setCaption(null);
    }

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      viewport = fitViewport(canvas.width, canvas.height, dpr);
    }

    function frame(now: number) {
      const frameDt = Math.min(MAX_FRAME_DT, Math.max(0, (now - last) / 1000));
      last = now;
      const gameDt = paused ? 0 : frameDt * TIME_SCALE;

      const human = sim.players.find((p) => p.human);
      let run = ((keys.has("ArrowRight") ? 1 : 0) -
        (keys.has("ArrowLeft") ? 1 : 0)) as HumanInput["run"];
      if (held !== 0) run = held;
      else if (human && touchX !== null) {
        const gap = touchX - human.x;
        run = Math.abs(gap) < 0.15 ? 0 : gap > 0 ? 1 : -1;
      }
      // A jump is consumed once the game clock actually moves, so a paused frame can't eat it.
      const input: HumanInput = { run, jump: jumpQueued && gameDt > 0 };
      if (input.jump) jumpQueued = false;
      if (sim.mode === "practice" && human) {
        const advance = (next: PracticeStep) => {
          step = next;
          setPracticeStep(next);
        };
        if (step === "run" && Math.abs(human.x - startX) > PRACTICE_RUN_DISTANCE) advance("serve");
        else if (step === "serve" && sim.awaitingServe === null && servedOnce) advance("hit");
        if (sim.awaitingServe !== null) servedOnce = true;
      }
      for (const event of tick(sim, gameDt, input)) {
        // A good shot: the visitor's return (not their serve) bounced in on the other side.
        if (
          sim.mode === "practice" &&
          event.type === "call" &&
          event.call === "bounce" &&
          sim.ref.hitter === "left" &&
          sim.humanHits > 0
        ) {
          good += 1;
          setGoodShots(good);
          if (step === "hit") {
            step = "free";
            setPracticeStep(step);
          }
          if (good >= promptAt) {
            promptAt += PRACTICE_PROMPT_EVERY;
            setOverlay({ kind: "practiceDone" });
          }
        }
        if (event.type === "hit") setRally(sim.mode === "demo" ? sim.rally : sim.humanHits);
        if (event.type === "call" && event.call !== "bounce") {
          setCaption({ kind: "call", call: event.call, id: ++captionId });
        }
        if (event.type === "point") {
          const inPlay = sim.mode === "play";
          setCaption({ kind: "point", ...event.result, inPlay, id: ++captionId });
          if (inPlay) {
            setScore({ ...sim.match.score });
            if (sim.humanHits > readBest()) writeBest(sim.humanHits);
          }
        }
        if (event.type === "match") setOverlay({ kind: "result", match: { ...sim.match } });
      }
      const isServing = sim.mode !== "demo" && sim.awaitingServe !== null;
      if (isServing !== wasServing) {
        wasServing = isServing;
        setServing(isServing);
      }
      drawCourt(ctx!, sim, viewport, colors);
      raf = requestAnimationFrame(frame);
    }

    // Runs only while the user wants it, the court is on screen, and the tab is visible.
    function sync() {
      const shouldRun = runningRef.current && onScreen && !document.hidden;
      if (shouldRun && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!shouldRun && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
        drawCourt(ctx!, sim, viewport, colors);
      }
    }
    controlsRef.current = {
      sync,
      setMode: changeMode,
      setPaused: (p) => {
        paused = p;
      },
      setHeld: (direction) => {
        held = direction;
      },
      jump: () => {
        jumpQueued = true;
      },
    };

    // Touch: drag to run towards the finger, tap to jump. Only once a match is on, so
    // the demo never hijacks page scrolling.
    const courtX = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return toWorld(viewport, (e.clientX - rect.left) * viewport.dpr, 0).x;
    };
    const onPointerDown = (e: PointerEvent) => {
      if (sim.mode === "demo" || e.pointerType === "mouse") return;
      touchStart = { t: performance.now(), x: e.clientX, y: e.clientY };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!touchStart) return;
      const moved = Math.hypot(e.clientX - touchStart.x, e.clientY - touchStart.y);
      if (moved > TAP_SLOP_PX) touchX = courtX(e);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!touchStart) return;
      const moved = Math.hypot(e.clientX - touchStart.x, e.clientY - touchStart.y);
      if (performance.now() - touchStart.t < TAP_MS && moved < TAP_SLOP_PX) jumpQueued = true;
      touchStart = null;
      touchX = null;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (sim.mode === "demo" || paused) return;
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        keys.add(e.key);
        e.preventDefault();
      } else if (e.key === " ") {
        if (!e.repeat) jumpQueued = true;
        e.preventDefault();
      } else if (e.key === "Escape") {
        changeMode("demo");
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key);
    const onBlur = () => keys.clear();
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      drawCourt(ctx, sim, viewport, colors);
    });
    resizeObserver.observe(canvas);

    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = Boolean(entry?.isIntersecting);
      sync();
    });
    intersection.observe(canvas);

    // next-themes flips the `dark` class on <html>; re-read the tokens when it does.
    const themeObserver = new MutationObserver(() => {
      colors = readColors();
      if (!raf) drawCourt(ctx, sim, viewport, colors);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    document.addEventListener("visibilitychange", sync);

    resize();
    drawCourt(ctx, sim, viewport, colors);
    sync();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      resizeObserver.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      controlsRef.current = null;
    };
  }, []);

  useEffect(() => {
    runningRef.current = running;
    controlsRef.current?.sync();
  }, [running]);

  const active = mode !== "demo";
  // Leaving a match (Escape, the result card, "back to the demo") also leaves full screen.
  const fullscreen = fullscreenWanted && active;
  // Full-screen play is landscape only: a portrait phone gets a "turn sideways" screen.
  const needsRotation = fullscreen && portrait;

  // The game clock stops while a card is open or the phone is upright, so nobody
  // loses a point reading or turning.
  useEffect(() => {
    controlsRef.current?.setPaused(overlay.kind !== "none" || needsRotation);
  }, [overlay, needsRotation]);

  useEffect(() => {
    if (!fullscreen) return;
    // The page underneath must not scroll while thumbs are on the court.
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    // Leaving the browser's own full screen (Android back gesture) ends the game too.
    const onFullscreenChange = () => {
      if (document.fullscreenElement) return;
      controlsRef.current?.setMode("demo");
      setOverlay({ kind: "none" });
      setFullscreenWanted(false);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      root.style.overflow = previous;
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [fullscreen]);

  function start(next: Mode) {
    setUserRunning(true);
    controlsRef.current?.setMode(next);
    setOverlay({ kind: "none" });
    if (touch && !fullscreen) enterFullscreen();
  }
  function enterFullscreen() {
    setFullscreenWanted(true);
    // Real full screen and a landscape lock where the browser allows it (Android);
    // iPhone Safari has neither, so the fixed overlay is the fallback.
    const root = rootRef.current;
    root
      ?.requestFullscreen?.()
      .then(() => {
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (o: string) => Promise<void>;
        };
        return orientation.lock?.("landscape");
      })
      .catch(() => {});
  }
  function backToDemo() {
    controlsRef.current?.setMode("demo");
    setOverlay({ kind: "none" });
    setFullscreenWanted(false);
  }

  const captionText = !caption
    ? ""
    : caption.kind === "call"
      ? t(`calls.${caption.call}`)
      : caption.inPlay
        ? `${t(`reasons.${caption.reason}`)} · ${t(caption.winner === "left" ? "yourPoint" : "theirPoint")}`
        : t(`reasons.${caption.reason}`);

  return (
    <div
      ref={rootRef}
      className={cn(
        fullscreen &&
          "bg-background fixed inset-0 z-[60] flex flex-col gap-1 pt-[max(0.5rem,env(safe-area-inset-top))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))]",
      )}
    >
      <div
        className={cn(
          // Game info on the left, controls on the right.
          "flex flex-wrap items-center justify-between gap-x-6 gap-y-3",
          // Full screen: both float in the empty sky above the court.
          fullscreen &&
            "absolute inset-x-[max(0.5rem,env(safe-area-inset-left))] top-[max(0.5rem,env(safe-area-inset-top))] z-10 flex-nowrap",
        )}
      >
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-4 gap-y-2",
            // A short full-screen court has no room for both; the card shows the final score.
            fullscreen && overlay.kind !== "none" && "invisible",
          )}
        >
          {mode === "play" ? (
            <>
              <Scoreboard
                label={t("scoreLabel", { you: score.left, them: score.right })}
                sides={[
                  { name: t("you"), points: score.left },
                  { name: t("them"), points: score.right },
                ]}
                target={MATCH_POINTS}
              />
              {/* Secondary to the score: the current rally and the record it feeds. */}
              <div
                className={cn(
                  "text-muted-foreground flex flex-col gap-1 text-xs",
                  fullscreen && "max-sm:hidden",
                )}
              >
                <p className="flex items-center gap-3 font-semibold tracking-[0.2em] uppercase">
                  <span className="flex items-center gap-1.5">
                    {t("rallyLabel")}
                    <span className="text-foreground font-display text-base tracking-normal">
                      <RollingNumber value={rally} />
                    </span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1.5">
                    {t("bestLabel")}
                    <span className="text-foreground dark:text-primary font-display text-base tracking-normal">
                      <RollingNumber value={best} pop />
                    </span>
                  </span>
                </p>
                {!fullscreen && <p>{t("firstTo", { points: MATCH_POINTS })}</p>}
              </div>
            </>
          ) : mode === "practice" ? (
            <ScoreChip label={t("goodShots")} value={goodShots} highlight pop />
          ) : (
            <>
              <ScoreChip label={t("rallyLabel")} value={rally} />
              <ScoreChip label={t("bestLabel")} value={best} highlight pop />
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!fullscreen && mode !== "practice" && (
            <Button
              variant={mode === "demo" ? "outline" : "ghost"}
              size="lg"
              onClick={() => start("practice")}
            >
              {t("practice")}
            </Button>
          )}
          {!fullscreen && mode !== "play" && (
            <Button size="lg" onClick={() => start("play")}>
              <Play aria-hidden="true" />
              {t("playMatch")}
            </Button>
          )}
          {active && !fullscreen && (
            <Button variant="outline" size="lg" onClick={backToDemo}>
              {t("stop")}
            </Button>
          )}
          <Button
            variant="outline"
            size="icon-lg"
            aria-label={running ? t("pause") : t("play")}
            onClick={() => setUserRunning(!running)}
          >
            {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          </Button>
          {fullscreen && (
            <Button
              variant="outline"
              size="icon-lg"
              aria-label={t("fullscreen.exit")}
              onClick={backToDemo}
            >
              <X aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "relative",
          fullscreen ? "min-h-0 flex-1" : "mt-4",
          // A card can be taller than the court on wide, short layouts; give it room.
          !fullscreen && overlay.kind !== "none" && "min-h-[22rem]",
        )}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={t("canvasLabel")}
          aria-describedby="rally-controls"
          style={
            {
              "--court-aspect": `${VIEW.maxX - VIEW.minX} / ${VIEW.maxY - VIEW.minY}`,
            } as CSSProperties
          }
          className={cn(
            "block w-full rounded-lg",
            // Phones: edge to edge and taller than the court's own shape, so the demo
            // reads as a stage rather than a thin strip.
            fullscreen
              ? "h-full"
              : "aspect-(--court-aspect) max-sm:-mx-4 max-sm:aspect-[2/1] max-sm:w-[calc(100%+2rem)] max-sm:max-w-none max-sm:rounded-none",
            active ? "touch-none" : "touch-pan-y",
          )}
        />
        <p
          aria-live="polite"
          className={cn(
            "text-muted-foreground pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 text-xs font-semibold tracking-widest whitespace-nowrap uppercase",
            // Full screen: under the floating scoreboard and the hint, not beside them.
            fullscreen && "top-[8rem]",
          )}
        >
          <span key={caption?.id} className="animate-in fade-in duration-300">
            {captionText}
          </span>
        </p>

        {/* Practice hints sit on the court itself: learn by doing, one step at a time. */}
        {active && overlay.kind === "none" && (mode === "practice" || serving) && (
          <div
            aria-live="polite"
            className={cn(
              "pointer-events-none absolute inset-x-0 top-10 flex justify-center px-3",
              fullscreen && "top-[4.5rem]",
            )}
          >
            <p
              key={practiceStep}
              className="border-primary/50 bg-background/85 animate-in fade-in slide-in-from-top-2 flex flex-wrap items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur duration-300"
            >
              {mode === "practice" && practiceStep !== "free" && (
                <span className="text-primary text-xs tracking-widest uppercase">
                  {t("tutorial.step", { n: ["run", "serve", "hit"].indexOf(practiceStep) + 1 })}
                </span>
              )}
              {mode === "practice" && practiceStep === "run" ? (
                <>
                  <Key>{touch ? "◀" : "←"}</Key>
                  <Key>{touch ? "▶" : "→"}</Key>
                  {t(touch ? "tutorial.runTouch" : "tutorial.run")}
                </>
              ) : serving ? (
                <>
                  <Key>{touch ? t("fullscreen.action") : t("tutorial.space")}</Key>
                  {t(touch ? "tutorial.serveTouch" : "tutorial.serve")}
                </>
              ) : practiceStep === "hit" ? (
                t("tutorial.hit")
              ) : (
                t("tutorial.free")
              )}
            </p>
          </div>
        )}

        {overlay.kind !== "none" && (
          <div className="absolute inset-0 flex items-center justify-center p-3">
            {overlay.kind === "result" && <ResultMoment won={overlay.match.winner === "left"} />}
            <div
              role="dialog"
              aria-labelledby="rally-dialog-title"
              className="border-border bg-background/90 max-h-full w-full max-w-md overflow-y-auto rounded-lg border p-5 shadow-2xl backdrop-blur sm:p-7"
            >
              {overlay.kind === "practiceDone" ? (
                <>
                  <h3
                    id="rally-dialog-title"
                    className="font-display text-2xl font-bold [font-stretch:112%]"
                  >
                    {t("practiceDone.title")}
                  </h3>
                  <p className="text-muted-foreground mt-3 text-sm">
                    {t("practiceDone.text", { shots: goodShots, points: MATCH_POINTS })}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button autoFocus size="lg" onClick={() => start("play")}>
                      {t("playMatch")}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setOverlay({ kind: "none" })}
                    >
                      {t("practiceDone.more")}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground text-xs tracking-widest uppercase">
                    {t("result.final", {
                      you: overlay.match.score.left,
                      them: overlay.match.score.right,
                    })}
                  </p>
                  <h3
                    id="rally-dialog-title"
                    className={cn(
                      "font-display mt-2 flex items-end gap-3 text-3xl font-bold [font-stretch:112%]",
                      overlay.match.winner === "left" && "dark:text-primary",
                    )}
                  >
                    {overlay.match.winner === "left" ? t("result.won") : t("result.lost")}
                    {/* A lost point's ball drops beside the verdict and settles. */}
                    {overlay.match.winner !== "left" && (
                      <span
                        aria-hidden="true"
                        className="bg-primary motion-safe:animate-ball-drop mb-1.5 size-4 shrink-0 rounded-full"
                      />
                    )}
                  </h3>
                  <dl className="mt-4 flex gap-6 text-sm">
                    <div>
                      <dt className="text-muted-foreground">{t("result.longest")}</dt>
                      <dd className="font-display text-2xl font-bold tabular-nums">
                        {overlay.match.longestRally}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("result.porTres")}</dt>
                      <dd className="font-display text-2xl font-bold tabular-nums">
                        {overlay.match.porTres}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-5 font-semibold">{t("result.cta")}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="lg">
                      <Link
                        href={{
                          pathname: "/book",
                          query: { court: RALLY_COURT_ID, from: "rally" },
                        }}
                      >
                        {t("result.book")}
                      </Link>
                    </Button>
                    <Button autoFocus variant="outline" size="lg" onClick={() => start("play")}>
                      {t("result.again")}
                    </Button>
                    <Button variant="ghost" size="lg" onClick={() => start("practice")}>
                      {t("practice")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Below the court, never on it, so no thumb hides a player or the glass. */}
      {fullscreen && (
        <ThumbControls
          disabled={overlay.kind !== "none"}
          labels={{
            left: t("fullscreen.left"),
            right: t("fullscreen.right"),
            action: t("fullscreen.action"),
          }}
          onHeld={(direction) => controlsRef.current?.setHeld(direction)}
          onAction={() => controlsRef.current?.jump()}
        />
      )}
      {needsRotation && (
        <div
          role="alert"
          className="bg-background absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 p-8 text-center"
        >
          <Smartphone aria-hidden="true" className="text-primary size-14 rotate-90" />
          <p className="font-display text-2xl font-bold text-balance [font-stretch:112%]">
            {t("fullscreen.rotate")}
          </p>
          <p className="text-muted-foreground max-w-xs text-sm">{t("fullscreen.rotateText")}</p>
          <Button variant="outline" size="lg" onClick={backToDemo}>
            {t("fullscreen.exit")}
          </Button>
        </div>
      )}
      <p
        id="rally-controls"
        className={cn("text-muted-foreground mt-3 text-xs", fullscreen && "sr-only")}
      >
        {t(touch ? "controlsTouch" : "controls")}
      </p>
    </div>
  );
}

/** Thumb buttons over the court: run with the left thumb, serve and jump with the right. */
function ThumbControls({
  disabled,
  labels,
  onHeld,
  onAction,
}: {
  disabled: boolean;
  labels: Record<"left" | "right" | "action", string>;
  onHeld: (direction: -1 | 0 | 1) => void;
  onAction: () => void;
}) {
  const hold = (direction: -1 | 1) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      // Keeps the run going if the thumb slides off the button; not every pointer can be captured.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
      onHeld(direction);
    },
    onPointerUp: () => onHeld(0),
    onPointerCancel: () => onHeld(0),
    // Stops the long-press menu from appearing while a thumb rests on a button.
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });
  const round =
    "border-border bg-background/80 flex touch-none items-center justify-center rounded-full border shadow-lg backdrop-blur select-none active:bg-muted";

  return (
    <div className="flex shrink-0 items-center justify-between px-1">
      <div className="flex gap-3">
        <button
          type="button"
          aria-label={labels.left}
          disabled={disabled}
          className={cn(round, "size-14")}
          {...hold(-1)}
        >
          <ChevronLeft aria-hidden="true" className="size-7" />
        </button>
        <button
          type="button"
          aria-label={labels.right}
          disabled={disabled}
          className={cn(round, "size-14")}
          {...hold(1)}
        >
          <ChevronRight aria-hidden="true" className="size-7" />
        </button>
      </div>
      <button
        type="button"
        disabled={disabled}
        onPointerDown={onAction}
        onContextMenu={(e) => e.preventDefault()}
        className="bg-primary text-primary-foreground flex h-14 min-w-32 touch-none items-center justify-center rounded-full px-5 text-center text-sm leading-tight font-bold shadow-lg select-none active:scale-95"
      >
        {labels.action}
      </button>
    </div>
  );
}

function Key({ children }: { children: string }) {
  return (
    <kbd className="border-border bg-muted rounded border px-1.5 py-0.5 font-sans text-xs">
      {children}
    </kbd>
  );
}

// The logo's 21 dots, as offsets from its centre: a win bursts them out into a big,
// wide halo of the logo around the result card. Offsets are in container units of
// the court area, so the outermost dots always land inside it, whatever its size.
const BURST = LOGO_DOTS.map(([x, y], i) => ({
  dx: `${(((x - 396.5) / 113) * 44).toFixed(1)}cqw`,
  dy: `${(((y - 405) / 121.6) * 40).toFixed(1)}cqh`,
  delay: `${(i % 7) * 30}ms`,
}));

/**
 * The match's ending, behind the result card. A win turns the lights on: a floodlight
 * glow swells and the logo's dots burst out around the card. A loss dims the court.
 * Decorative only; reduced motion shows neither.
 */
function ResultMoment({ won }: { won: boolean }) {
  if (!won) {
    return (
      <div
        aria-hidden="true"
        className="bg-background/50 animate-in fade-in pointer-events-none absolute inset-0 rounded-lg duration-700 motion-reduce:hidden"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="[container-type:size] pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
    >
      <div className="motion-safe:animate-glow-in absolute top-1/2 left-1/2 size-[30rem] rounded-full bg-[radial-gradient(closest-side,var(--scene-light),transparent)] opacity-0" />
      {BURST.map((dot) => (
        <span
          key={`${dot.dx},${dot.dy}`}
          style={{ "--dx": dot.dx, "--dy": dot.dy, animationDelay: dot.delay } as CSSProperties}
          className="bg-primary motion-safe:animate-burst absolute top-1/2 left-1/2 size-4 rounded-full opacity-0"
        />
      ))}
    </div>
  );
}

/**
 * A number that rolls like a scoreboard: the old value slides up and out of a clipped
 * window while the new one rolls in from below. With `pop`, a rise also flashes the
 * new value in orange. Under reduced motion it simply changes.
 */
function RollingNumber({ value, pop }: { value: number; pop?: boolean }) {
  const [shown, setShown] = useState<{ current: number; previous: number | null }>({
    current: value,
    previous: null,
  });
  // Adjusting state during render (not in an effect), so the roll starts in the same paint.
  if (shown.current !== value) setShown({ current: value, previous: shown.current });
  const rose = shown.previous !== null && value > shown.previous;

  return (
    <span className="relative inline-flex overflow-hidden px-px tabular-nums">
      {shown.previous !== null && (
        <span
          key={`out-${shown.previous}`}
          aria-hidden="true"
          className="motion-safe:animate-digit-out absolute inset-0 opacity-0 motion-reduce:hidden"
        >
          {shown.previous}
        </span>
      )}
      <span key={`in-${shown.current}`} className="motion-safe:animate-digit-in inline-block">
        <span className={cn("inline-block", pop && rose && "motion-safe:animate-score-pop")}>
          {shown.current}
        </span>
      </span>
    </span>
  );
}

/**
 * The match score as a padel-style board: each side's name over "first to N" pips
 * that fill as points are won, and a big rolling number. The side that just scored
 * pops in orange.
 */
function Scoreboard({
  label,
  sides,
  target,
}: {
  label: string;
  sides: [{ name: string; points: number }, { name: string; points: number }];
  target: number;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="border-border bg-card/80 flex h-14 shrink-0 items-stretch overflow-hidden rounded-md border shadow-sm backdrop-blur"
    >
      {sides.map((side, i) => (
        <div
          key={side.name}
          aria-hidden="true"
          className={cn(
            "flex items-center gap-3.5 px-4",
            i === 1 && "border-border flex-row-reverse border-l",
          )}
        >
          <div className={cn("flex flex-col gap-1", i === 1 && "items-end")}>
            <span className="text-muted-foreground text-[10px] leading-none font-semibold tracking-[0.2em] uppercase">
              {side.name}
            </span>
            <span className="flex gap-1.5">
              {Array.from({ length: target }, (_, p) => (
                <span
                  key={p}
                  className={cn(
                    "size-2 rounded-full transition-colors duration-500",
                    p < side.points ? "bg-primary" : "bg-border",
                  )}
                />
              ))}
            </span>
          </div>
          <span className="font-display text-3xl leading-none font-bold [font-stretch:112%]">
            <RollingNumber value={side.points} pop />
          </span>
        </div>
      ))}
    </div>
  );
}

function ScoreChip({
  label,
  value,
  highlight,
  pop,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  pop?: boolean;
}) {
  return (
    <div className="border-border bg-card/80 flex h-10 items-center gap-2.5 rounded-md border px-4 backdrop-blur">
      <span className="text-muted-foreground text-[11px] tracking-widest uppercase">{label}</span>
      <span
        className={cn(
          "font-display text-xl leading-none font-bold [font-stretch:112%]",
          highlight && "dark:text-primary",
        )}
      >
        <RollingNumber value={value} pop={pop} />
      </span>
    </div>
  );
}
