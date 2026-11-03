"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

/**
 * Scroll-driven hero: the stage pins while the visitor scrolls and the club
 * builds itself — logo dots → ceiling lights → steel & glass → the ball off the
 * glass. Every visual is a pure function of scroll progress, so scrolling back
 * reverses it exactly. Pure SVG coloured by the semantic tokens, so it follows the
 * theme: a night session in dark mode, a day session in light mode. With reduced
 * motion it shows the finished court, unpinned.
 */

export type StoryChapter = { id: string; short: string; label: string; text: string };

// Where each chapter starts, as scroll progress (0–1) through the pinned section.
const CHAPTER_STARTS = [0.14, 0.3, 0.5, 0.74];
// Pinned section height in viewports; ~1 viewport of scrolling per chapter.
const SECTION_VIEWPORTS = 4.6;

// The logo's 21 dots (rows 3-5-5-5-3, from src/app/icon.svg), floating mid-hall.
const LOGO_ROWS = [
  { y: 283.4, xs: [339.9, 396.7, 453.4] },
  { y: 344, xs: [283.9, 340.2, 396.7, 453.4, 509.5] },
  { y: 404.6, xs: [283.9, 340.3, 396.7, 453.1, 509.5] },
  { y: 465.6, xs: [283.5, 340, 396.3, 452.8, 509.2] },
  { y: 526.6, xs: [340.1, 396.3, 453.1] },
];
const LOGO_DOTS = LOGO_ROWS.flatMap(({ y, xs }) =>
  // Right of centre, clear of the headline; on narrow screens they fly in from the edge.
  xs.map((x) => ({ x: 1030 + (x - 396.7) * 0.55, y: 290 + (y - 405) * 0.55, r: 10 })),
);
// The same dots as ceiling lights in perspective: row order matches, top row → back row.
const CEILING_ROWS = [
  { y: 235, gap: 70, r: 5, count: 3 },
  { y: 205, gap: 95, r: 6, count: 5 },
  { y: 170, gap: 125, r: 7.5, count: 5 },
  { y: 130, gap: 165, r: 9, count: 5 },
  { y: 85, gap: 215, r: 11, count: 3 },
];
const CEILING_DOTS = CEILING_ROWS.flatMap(({ y, gap, r, count }) =>
  Array.from({ length: count }, (_, i) => ({ x: 720 + (i - (count - 1) / 2) * gap, y, r })),
);

// Side glass panels in perspective: 3 m high near the back wall, stepping to 2 m.
const SIDE_PANELS = [
  "470,470 470,320 401.6,318.6 401.6,509.6",
  "401.6,509.6 401.6,318.6 321.8,316.8 321.8,555.8",
  "321.8,555.8 321.8,396.8 230.6,412.8 230.6,608.6",
  "230.6,608.6 230.6,412.8 128,431 128,668",
];
const SIDE_MESH = "470,320 470,270 321.8,237.2 321.8,316.8";
const mirror = (points: string) =>
  points
    .split(" ")
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return `${1440 - x!},${y}`;
    })
    .join(" ");

const COURT_LINES = [
  [470, 470, 970, 470],
  [384.5, 519.5, 1055.5, 519.5],
  [720, 519.5, 720, 668],
  [470, 470, 128, 668],
  [970, 470, 1312, 668],
] as const;

const BALL_PATH = "M560 330 Q660 350 735 505 Q790 440 845 415 Q905 405 960 498";
const BOUNCE_POINT = { x: 735, y: 505 };
const GLASS_POINT = { x: 845, y: 415 };

const stop = (color: string, opacity: number) => ({
  stopColor: `var(${color})`,
  stopOpacity: opacity,
});

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
// Phones get the whole court framed above the text instead of a cropped backdrop.
const COMPACT = "(max-width: 639px)";
const subscribeMedia = (query: string) => (onChange: () => void) => {
  const list = window.matchMedia(query);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
};
const subscribeReducedMotion = subscribeMedia(REDUCED_MOTION);
const subscribeCompact = subscribeMedia(COMPACT);
// Full-bleed backdrop on wide screens; on phones, just the court and its lights.
const FRAMES = {
  // On screens wider than the drawing, crop from the bottom (faded floor), never the
  // top — the ceiling lights must stay clear of the header.
  wide: { viewBox: "0 0 1440 900", fit: "xMidYMin slice" },
  compact: { viewBox: "100 0 1240 700", fit: "xMidYMid meet" },
};
// Autoplay pace for "Play the story", for the whole pinned range.
const AUTOPLAY_MS = 22000;
// Rest points (scroll progress) where each chapter's build has finished. One scroll
// gesture moves to the next one, so every flick plays exactly one chapter.
const STEPS = [0, 0.27, 0.49, 0.73, 1];
// A gentle scroll plays the chapter slowly; a strong flick moves through it faster.
const STEP_SLOW_MS = 2600;
const STEP_FAST_MS = 1200;
// Trackpads keep firing wheel events after a flick; ignore them briefly so one
// gesture can't skip two chapters — short enough that the next scroll still responds.
const STEP_COOLDOWN_MS = 200;
// Momentum only ever fades: within this window an event no stronger than the last one
// is still the tail, even if the page was too busy to receive them evenly.
const MOMENTUM_WINDOW_MS = 1000;
// Equal-sized wheel events this large are mouse-wheel notches, not a momentum tail.
const MOUSE_NOTCH_PX = 40;
// Still scrolling this recently when a step lands means "keep going".
const CONTINUE_WINDOW_MS = 250;
// After gliding out of the story the momentum tail is at its strongest; hold the
// landing a little longer so it can't carry the page past the next section.
const EXIT_SETTLE_MS = 700;
// Ease-out: the move starts the instant you scroll, then settles into the chapter.
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export function HeroStory({
  intro,
  chapters,
  eyebrow,
  navLabel,
  scrollHint,
  playLabel,
  nextLabels,
  continueLabel,
}: {
  intro: ReactNode;
  chapters: StoryChapter[];
  eyebrow: string;
  navLabel: string;
  scrollHint: string;
  playLabel: string;
  /** "Next: <chapter>" for every chapter but the last. */
  nextLabels: string[];
  continueLabel: string;
}) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
  const animated = !reducedMotion;
  const compact = useSyncExternalStore(
    subscribeCompact,
    () => window.matchMedia(COMPACT).matches,
    () => false,
  );
  const frame = compact ? FRAMES.compact : FRAMES.wide;
  const playRef = useRef<(() => void) | null>(null);
  const controlsRef = useRef<{ next: () => void } | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState(-1);

  const rootRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(SVGGElement | null)[]>([]);
  const floorRef = useRef<SVGGElement>(null);
  const outlineRef = useRef<SVGPolygonElement>(null);
  const backGlassRef = useRef<SVGGElement>(null);
  const sideGlassRef = useRef<SVGGElement>(null);
  const meshRef = useRef<SVGGElement>(null);
  const linesRef = useRef<SVGGElement>(null);
  const netRef = useRef<SVGGElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const ballRef = useRef<SVGGElement>(null);
  const bounceRef = useRef<SVGEllipseElement>(null);
  const rippleRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const trail = trailRef.current;
    if (!root || !trail) return;

    // Where along the ball's path it bounces and meets the glass (as 0–1 fractions).
    const total = trail.getTotalLength();
    const fractionNear = (target: { x: number; y: number }) => {
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i <= 200; i++) {
        const pt = trail.getPointAtLength((i / 200) * total);
        const dist = Math.hypot(pt.x - target.x, pt.y - target.y);
        if (dist < bestDist) [best, bestDist] = [i / 200, dist];
      }
      return best;
    };
    const bounceAt = fractionNear(BOUNCE_POINT);
    const glassAt = fractionNear(GLASS_POINT);

    const fade = (el: SVGElement | HTMLElement | null, t: number, rise = 0) => {
      if (!el) return;
      el.style.opacity = String(t);
      el.style.transform = rise ? `translateY(${(1 - t) * rise}px)` : "";
    };

    const apply = (p: number) => {
      const seg = (a: number, b: number) => smooth(clamp01((p - a) / (b - a)));

      fade(introRef.current, animated ? 1 - seg(0.04, 0.12) : 1);
      if (introRef.current)
        introRef.current.style.visibility = p > 0.13 && animated ? "hidden" : "";
      fade(hintRef.current, animated ? 1 - seg(0, 0.05) : 0);
      if (hintRef.current) hintRef.current.style.visibility = p > 0.05 ? "hidden" : "";
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`;

      // 02 Lights on: each dot flies from the logo to its ceiling slot, slightly staggered.
      dotRefs.current.forEach((dot, i) => {
        if (!dot) return;
        const from = LOGO_DOTS[i]!;
        const to = CEILING_DOTS[i]!;
        const t = seg(0.3 + i * 0.003, 0.42 + i * 0.003);
        const x = lerp(from.x, to.x, t);
        const y = lerp(from.y, to.y, t);
        dot.setAttribute("transform", `translate(${x} ${y}) scale(${lerp(from.r, to.r, t)})`);
        const [halo, orange, white] = Array.from(dot.children) as SVGElement[];
        halo!.style.opacity = String(t);
        orange!.style.opacity = String(1 - t);
        white!.style.opacity = String(t);
      });
      fade(floorRef.current, seg(0.34, 0.46));
      fade(outlineRef.current, 1 - seg(0.34, 0.46));

      // 03 Steel & glass: back wall, then the sides, then mesh, lines and net.
      fade(backGlassRef.current, seg(0.51, 0.59), 140);
      fade(sideGlassRef.current, seg(0.55, 0.63), 140);
      fade(meshRef.current, seg(0.59, 0.66), 60);
      const lines = seg(0.6, 0.7);
      linesRef.current?.querySelectorAll("line").forEach((line) => {
        line.style.strokeDashoffset = String(1 - lines);
      });
      fade(netRef.current, seg(0.65, 0.72), 50);

      // 04 The rally: the trail draws behind the ball as it travels the path.
      const r = seg(0.75, 0.97);
      trail.style.strokeDashoffset = String(1 - r);
      // A zero-length dash with a round cap still paints a dot: hide it until it draws.
      trail.style.opacity = r > 0 ? "1" : "0";
      const pt = trail.getPointAtLength(r * total);
      ballRef.current?.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
      if (ballRef.current) ballRef.current.style.opacity = r > 0 ? "1" : "0";
      if (bounceRef.current) bounceRef.current.style.opacity = r >= bounceAt ? "0.5" : "0";
      const ripple = clamp01((r - glassAt) / 0.2);
      if (rippleRef.current) {
        rippleRef.current.style.opacity = r >= glassAt ? String(1 - ripple * 0.4) : "0";
        rippleRef.current.setAttribute(
          "transform",
          `translate(845 415) scale(${0.3 + 0.7 * ripple})`,
        );
      }

      let current = -1;
      CHAPTER_STARTS.forEach((start, i) => {
        if (p >= start) current = i;
      });
      setChapter(animated ? current : -1);
    };

    if (!animated) {
      apply(1);
      return;
    }

    // Scroll sets the target; the drawn progress eases towards it so the build has
    // weight instead of snapping with every wheel tick.
    let shown = 0;
    let raf = 0;
    let last = 0;
    const target = () => {
      const rect = root.getBoundingClientRect();
      return clamp01(-rect.top / Math.max(1, rect.height - window.innerHeight));
    };
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const goal = target();
      shown += (goal - shown) * (1 - Math.exp(-dt / 0.12));
      if (Math.abs(goal - shown) < 0.0005) shown = goal;
      apply(shown);
      raf = shown === goal ? 0 : requestAnimationFrame(frame);
    };
    const onScroll = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    // "Play the story": scroll through the pinned range for visitors who don't
    // realise they should. Any input of their own hands control straight back.
    let autoplay = 0;
    const stopAutoplay = () => {
      cancelAnimationFrame(autoplay);
      autoplay = 0;
      for (const type of ["wheel", "touchstart", "keydown", "pointerdown"]) {
        window.removeEventListener(type, stopAutoplay);
      }
    };
    playRef.current = () => {
      stopAutoplay();
      const rect = root.getBoundingClientRect();
      const range = Math.max(1, rect.height - window.innerHeight);
      const from = window.scrollY;
      const to = window.scrollY + rect.top + range;
      const duration = AUTOPLAY_MS * clamp01((to - from) / range);
      const started = performance.now();
      const step = (now: number) => {
        const k = clamp01((now - started) / duration);
        window.scrollTo({ top: lerp(from, to, k), behavior: "instant" });
        autoplay = k < 1 ? requestAnimationFrame(step) : 0;
        if (!autoplay) stopAutoplay();
      };
      autoplay = requestAnimationFrame(step);
      // Registered after the click that started it, so that click doesn't cancel it.
      setTimeout(() => {
        for (const type of ["wheel", "touchstart", "keydown", "pointerdown"]) {
          window.addEventListener(type, stopAutoplay, { passive: true });
        }
      });
    };

    // Chapter stepping: inside the pinned range a scroll gesture becomes "go to the
    // next (or previous) chapter". Past either end, the page scrolls normally.
    let stepAnim = 0;
    let lockedUntil = 0;
    const pinnedProgress = () => {
      const rect = root.getBoundingClientRect();
      const range = Math.max(1, rect.height - window.innerHeight);
      return { p: -rect.top / range, top: window.scrollY + rect.top, range };
    };
    /** Scroll position that puts the section after the story just under the header. */
    const landingY = () => {
      // By id, not DOM position: wrappers around the homepage parts must not move it.
      const after = document.getElementById("racket");
      if (!after) return null;
      const header = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
      return window.scrollY + after.getBoundingClientRect().top - header;
    };
    const busy = () => stepAnim !== 0 || performance.now() < lockedUntil;
    // Inside: the pinned stage fills the screen — from the top of the page, where the
    // section starts below the header, to the end of the last chapter.
    // …and on to the landing point below it, so scrolling up from the next section
    // steps back into the last chapter.
    const insidePinned = () => {
      const rect = root.getBoundingClientRect();
      const landing = landingY();
      const beforeLanding = landing === null || window.scrollY <= landing + 4;
      return rect.top <= window.innerHeight * 0.25 && beforeLanding;
    };
    /** `strength` (0–1) is how hard the gesture was: it sets how quickly the step plays. */
    const step = (dir: 1 | -1, strength: number) => {
      const { p, top, range } = pinnedProgress();
      if (!insidePinned()) return false;
      // At the very top the story sits just under the header (p slightly below 0):
      // that still counts as chapter 0, so the first scroll goes straight to chapter 1.
      const at = Math.max(0, p);
      const next =
        dir > 0
          ? STEPS.find((s) => s > at + 0.02)
          : [...STEPS].reverse().find((s) => s < at - 0.02);
      const duration = lerp(STEP_SLOW_MS, STEP_FAST_MS, clamp01(strength));
      if (next === undefined) {
        // Past the last chapter, one more controlled glide lands on the next section,
        // instead of letting the gesture's momentum fling the page past it.
        const landing = landingY();
        if (dir < 0 || at < 0.99 || landing === null || window.scrollY >= landing - 4) return false;
        glide(landing, duration, EXIT_SETTLE_MS);
        return true;
      }
      glide(top + next * range, duration, STEP_COOLDOWN_MS);
      return true;
    };
    function glide(to: number, duration: number, settle: number) {
      stopAutoplay();
      cancelAnimationFrame(stepAnim);
      const from = window.scrollY;
      const started = performance.now();
      const tick = (now: number) => {
        const k = clamp01((now - started) / duration);
        window.scrollTo({ top: lerp(from, to, easeOutCubic(k)), behavior: "instant" });
        if (k < 1) {
          stepAnim = requestAnimationFrame(tick);
        } else {
          stepAnim = 0;
          lockedUntil = performance.now() + settle;
          // The visitor kept scrolling through this step: carry straight on to the next.
          const queued = pending;
          pending = null;
          if (queued && performance.now() - queued.at < CONTINUE_WINDOW_MS) step(queued.dir, 0.5);
        }
      };
      stepAnim = requestAnimationFrame(tick);
    }
    controlsRef.current = { next: () => step(1, 0.4) };

    let lastWheelAt = 0;
    let lastWheelSize = 0;
    // Whether the current gesture already took a step; its momentum tail is then
    // swallowed wherever the page is — including after the exit glide.
    let gestureOwned = false;
    // Set while the visitor is still actively scrolling during a step.
    let pending: { dir: 1 | -1; at: number } | null = null;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 2) return;
      // Line-based wheels report rows, not pixels.
      const pixels = Math.abs(e.deltaY) * (e.deltaMode === 1 ? 40 : 1);
      const dir = e.deltaY > 0 ? 1 : -1;
      // The event's own timestamp, not "now": if the page was busy (say, the 3D racket
      // loading), queued momentum events must not look like a new gesture.
      const now = e.timeStamp;
      const gap = now - lastWheelAt;
      // Momentum only ever fades. Steady or rising input — mouse-wheel notches, fingers
      // still moving — is the visitor actively scrolling.
      const fading =
        gap < MOMENTUM_WINDOW_MS &&
        (pixels < lastWheelSize * 0.97 || (pixels <= lastWheelSize && pixels < MOUSE_NOTCH_PX));
      lastWheelAt = now;
      lastWheelSize = pixels;
      // While a glide runs (and briefly after) every wheel event is ours, wherever the
      // page now is — the exit glide moves it out of the story section.
      if (busy()) {
        e.preventDefault();
        gestureOwned = true;
        if (!fading) pending = { dir, at: now };
        return;
      }
      if (gestureOwned && fading) {
        e.preventDefault();
        return;
      }
      gestureOwned = false;
      if (step(dir, pixels / 200)) {
        e.preventDefault();
        gestureOwned = true;
      }
    };
    let touchStartY: number | null = null;
    let touchStartAt = 0;
    let touchHandled = false;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? null;
      touchStartAt = performance.now();
      touchHandled = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY === null) return;
      const dy = touchStartY - (e.touches[0]?.clientY ?? touchStartY);
      if (touchHandled || busy()) {
        e.preventDefault();
        return;
      }
      if (Math.abs(dy) < 12) return;
      // Swipe speed in px/ms: a quick swipe is a strong gesture.
      const speed = Math.abs(dy) / Math.max(1, performance.now() - touchStartAt);
      if (step(dy > 0 ? 1 : -1, speed / 1.5)) {
        touchHandled = true;
        e.preventDefault();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable], [role=application]")) return;
      const dir = ["ArrowDown", "PageDown", " "].includes(e.key)
        ? 1
        : ["ArrowUp", "PageUp"].includes(e.key)
          ? -1
          : 0;
      if (!dir) return;
      if (busy()) {
        e.preventDefault();
        return;
      }
      if (step(dir, 0.4)) e.preventDefault();
    };

    shown = target();
    apply(shown);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(stepAnim);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
      stopAutoplay();
      playRef.current = null;
      controlsRef.current = null;
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [animated]);

  return (
    <section
      ref={rootRef}
      id="story"
      className="relative"
      style={animated ? { height: `${SECTION_VIEWPORTS * 100}svh` } : undefined}
    >
      {/* Jump targets for the chapter nav, placed where each chapter is on screen. */}
      {animated &&
        chapters.map((c, i) => (
          <span
            key={c.id}
            id={`story-${c.id}`}
            aria-hidden="true"
            className="absolute left-0 h-px w-px"
            style={{ top: `${(CHAPTER_STARTS[i]! + 0.04) * (1 - 1 / SECTION_VIEWPORTS) * 100}%` }}
          />
        ))}

      <div className="sticky top-16 isolate h-[calc(100svh-4rem)] min-h-[560px] overflow-hidden">
        <svg
          viewBox={frame.viewBox}
          preserveAspectRatio={frame.fit}
          aria-hidden="true"
          className={cn(
            "absolute -z-10 w-full",
            compact ? "inset-x-0 top-4 h-[42%]" : "inset-0 h-full",
          )}
        >
          <defs>
            <radialGradient id="hero-halo">
              <stop offset="0" style={stop("--scene-light", 0.55)} />
              <stop offset="1" style={stop("--scene-light", 0)} />
            </radialGradient>
            <radialGradient id="hero-pool">
              <stop offset="0" style={stop("--scene-light", 0.13)} />
              <stop offset="1" style={stop("--scene-light", 0)} />
            </radialGradient>
            <radialGradient id="hero-ball-glow">
              <stop offset="0" style={stop("--primary", 0.65)} />
              <stop offset="1" style={stop("--primary", 0)} />
            </radialGradient>
            <linearGradient
              id="hero-floor"
              x1="0"
              y1="470"
              x2="0"
              y2="900"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" style={stop("--secondary", 1)} />
              <stop offset="1" style={stop("--muted", 1)} />
            </linearGradient>
            <linearGradient id="hero-glass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={stop("--scene-glass", 0.16)} />
              <stop offset="1" style={stop("--scene-glass", 0.04)} />
            </linearGradient>
            <linearGradient
              id="hero-trail"
              x1="560"
              y1="0"
              x2="960"
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" style={stop("--primary", 0)} />
              <stop offset="1" style={stop("--primary", 0.95)} />
            </linearGradient>
            {/* Fades out before the phone framing crops the floor, so it never ends in an edge. */}
            <linearGradient
              id="hero-hall"
              x1="0"
              y1="470"
              x2="0"
              y2="700"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" style={stop("--scene-glass", 0.1)} />
              <stop offset="1" style={stop("--scene-glass", 0)} />
            </linearGradient>
            <linearGradient id="hero-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0.45" style={stop("--background", 0)} />
              <stop offset="1" style={stop("--background", 0.96)} />
            </linearGradient>
            <pattern
              id="hero-mesh"
              width="7"
              height="7"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="7"
                className="stroke-scene-glass"
                strokeOpacity="0.22"
              />
            </pattern>
            <pattern id="hero-net" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect
                width="6"
                height="6"
                fill="none"
                className="stroke-foreground"
                strokeOpacity="0.13"
                strokeWidth="0.8"
              />
            </pattern>
          </defs>

          <rect width="1440" height="900" className="fill-background" />

          {/* 01: an empty hall, the floor only outlined over a faint tint, so the
              space reads before the lights come on and warm it up. */}
          <polygon points="470,470 970,470 1712.7,900 -272.7,900" fill="url(#hero-hall)" />
          <polygon
            ref={outlineRef}
            points="470,470 970,470 1712.7,900 -272.7,900"
            fill="none"
            className="stroke-muted-foreground"
            strokeOpacity="0.55"
            strokeDasharray="6 8"
          />
          <g ref={floorRef} style={{ opacity: 0 }}>
            <polygon points="470,470 970,470 1712.7,900 -272.7,900" fill="url(#hero-floor)" />
            <ellipse cx="720" cy="560" rx="400" ry="70" fill="url(#hero-pool)" />
            <ellipse cx="720" cy="660" rx="560" ry="100" fill="url(#hero-pool)" />
          </g>

          <g
            ref={linesRef}
            className="stroke-foreground"
            strokeOpacity="0.55"
            strokeWidth="1.5"
            fill="none"
          >
            {COURT_LINES.map(([x1, y1, x2, y2]) => (
              <line
                key={`${x1},${y1}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                pathLength={1}
                strokeDasharray="1"
                style={{ strokeDashoffset: 1 }}
              />
            ))}
          </g>

          {/* 03: back wall (3 m glass in 2 m panels, 1 m mesh above), then the sides. */}
          <g ref={backGlassRef} style={{ opacity: 0 }}>
            <rect
              x="470"
              y="320"
              width="500"
              height="150"
              fill="url(#hero-glass)"
              className="stroke-scene-glass"
              strokeOpacity="0.7"
            />
            <g className="stroke-muted-foreground" strokeOpacity="0.6">
              {[570, 670, 770, 870].map((x) => (
                <line key={x} x1={x} y1="320" x2={x} y2="470" />
              ))}
            </g>
          </g>
          <g
            ref={sideGlassRef}
            style={{ opacity: 0 }}
            fill="url(#hero-glass)"
            className="stroke-scene-glass"
            strokeOpacity="0.6"
          >
            {SIDE_PANELS.map((points) => (
              <polygon key={points} points={points} />
            ))}
            {SIDE_PANELS.map((points) => (
              <polygon key={`m${points}`} points={mirror(points)} />
            ))}
          </g>
          <g
            ref={meshRef}
            style={{ opacity: 0 }}
            fill="url(#hero-mesh)"
            className="stroke-scene-glass"
            strokeOpacity="0.25"
          >
            <rect x="470" y="270" width="500" height="50" />
            <polygon points={SIDE_MESH} />
            <polygon points={mirror(SIDE_MESH)} />
          </g>

          {/* 01→02: the logo's dots, which become the ceiling lights. They drift
              gently until then, so the scene reads as alive before anyone scrolls. */}
          <g className={cn(chapter < 1 && animated && "animate-float")}>
            {LOGO_DOTS.map((dot, i) => (
              <g
                key={`${dot.x},${dot.y}`}
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
                transform={`translate(${dot.x} ${dot.y}) scale(${dot.r})`}
              >
                <circle r="4" fill="url(#hero-halo)" style={{ opacity: 0 }} />
                <circle r="1" className="fill-primary" />
                <circle r="1" className="fill-scene-light" style={{ opacity: 0 }} />
              </g>
            ))}
          </g>

          {/* 04: serve, bounce, off the back glass, coming back. */}
          <path
            ref={trailRef}
            d={BALL_PATH}
            fill="none"
            stroke="url(#hero-trail)"
            strokeWidth="3.5"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            style={{ strokeDashoffset: 1, opacity: 0 }}
          />
          <ellipse
            ref={bounceRef}
            cx="735"
            cy="507"
            rx="12"
            ry="3"
            className="fill-primary"
            style={{ opacity: 0 }}
          />
          <g
            ref={rippleRef}
            fill="none"
            className="stroke-scene-glass"
            style={{ opacity: 0 }}
            transform="translate(845 415)"
          >
            <ellipse rx="14" ry="10" strokeOpacity="0.9" strokeWidth="2" />
            <ellipse rx="30" ry="21" strokeOpacity="0.5" strokeWidth="1.5" />
            <ellipse rx="48" ry="33" strokeOpacity="0.22" />
          </g>
          <g ref={ballRef} style={{ opacity: 0 }} transform="translate(560 330)">
            <circle r="34" fill="url(#hero-ball-glow)" />
            <circle r="10" className="fill-primary" />
            <circle cx="-3" cy="-3" r="3" className="fill-scene-light" fillOpacity="0.7" />
          </g>

          {/* Net in the foreground: we watch from behind it. */}
          <g ref={netRef} style={{ opacity: 0 }}>
            <rect x="128" y="564" width="1184" height="104" fill="url(#hero-net)" />
            <line
              x1="128"
              y1="564"
              x2="1312"
              y2="564"
              className="stroke-foreground"
              strokeOpacity="0.8"
              strokeWidth="3"
            />
            <g className="stroke-muted-foreground" strokeWidth="4">
              <line x1="128" y1="556" x2="128" y2="668" />
              <line x1="1312" y1="556" x2="1312" y2="668" />
            </g>
          </g>
          <rect width="1440" height="900" fill="url(#hero-fade)" />
        </svg>

        <Container className="relative h-full">
          <div
            ref={introRef}
            // Phones start the copy near the top instead of leaving the space under the header empty.
            className="flex h-full flex-col justify-end gap-6 pb-24 max-sm:justify-start max-sm:pt-[10svh]"
          >
            {intro}
          </div>

          {/* Chapter captions: all in the DOM for screen readers, one shown at a time. */}
          <ol className="pointer-events-none absolute inset-x-4 bottom-24 sm:inset-x-6 lg:inset-x-8">
            {chapters.map((c, i) => (
              <li
                key={c.id}
                className={cn(
                  "absolute bottom-0 left-0 max-w-xl transition-all duration-300",
                  // The outgoing caption clears before the next one arrives, so two never overlap.
                  chapter === i ? "translate-y-0 opacity-100 delay-300" : "translate-y-4 opacity-0",
                )}
              >
                <p className="text-foreground dark:text-primary text-xs font-semibold tracking-[0.2em] uppercase">
                  {eyebrow}
                </p>
                <h2 className="font-display mt-3 text-4xl leading-none font-bold tracking-tight [font-stretch:112%] sm:text-6xl">
                  {c.label}
                </h2>
                <p className="text-muted-foreground mt-4 text-lg text-pretty">{c.text}</p>
              </li>
            ))}
          </ol>
        </Container>

        {animated && (
          <nav
            aria-label={navLabel}
            className="absolute top-1/2 right-4 hidden -translate-y-1/2 flex-col gap-3.5 text-[11px] tracking-[0.14em] uppercase sm:right-8 md:flex"
          >
            {chapters.map((c, i) => (
              <a
                key={c.id}
                href={`#story-${c.id}`}
                aria-current={chapter === i ? "step" : undefined}
                className={cn(
                  "hover:text-primary flex items-center gap-2.5 transition-colors",
                  chapter === i ? "text-foreground dark:text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2 rounded-full border transition-colors",
                    chapter === i ? "bg-primary border-primary" : "border-muted-foreground",
                  )}
                />
                {c.short}
              </a>
            ))}
          </nav>
        )}

        {animated && (
          <>
            <div aria-hidden="true" className="bg-border absolute inset-x-0 top-0 h-0.5">
              <div ref={progressRef} className="bg-primary h-full origin-left scale-x-0" />
            </div>
            <div
              ref={hintRef}
              className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-2"
            >
              <button
                type="button"
                onClick={() => playRef.current?.()}
                className="border-border bg-background/60 hover:border-primary focus-visible:ring-ring flex min-h-11 items-center gap-2.5 rounded-full border px-5 text-xs font-semibold tracking-[0.16em] uppercase backdrop-blur transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <span
                  aria-hidden="true"
                  className="bg-primary size-2.5 animate-bounce rounded-full"
                />
                {playLabel}
              </button>
              <span className="text-muted-foreground text-[11px] tracking-[0.2em] uppercase">
                {scrollHint}
              </span>
            </div>
            {/* Once the story is under way: an explicit way on, for anyone who doesn't
                scroll — and at the end, a way out to the next section. */}
            {chapter >= 0 && (
              <div className="absolute inset-x-0 bottom-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => controlsRef.current?.next()}
                  className="border-border bg-background/60 hover:border-primary focus-visible:ring-ring animate-in fade-in flex min-h-11 items-center gap-2 rounded-full border px-5 text-xs font-semibold tracking-[0.16em] uppercase backdrop-blur transition-colors duration-500 focus-visible:ring-2 focus-visible:outline-none"
                >
                  {chapter < chapters.length - 1 ? nextLabels[chapter] : continueLabel}
                  {chapter < chapters.length - 1 ? (
                    <ArrowRight aria-hidden="true" className="size-4" />
                  ) : (
                    <ArrowDown aria-hidden="true" className="size-4" />
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
