"use client";

import { RotateCcw, RotateCw } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { readCssVar } from "@/lib/css-var";
import { cn } from "@/lib/utils";

import { HEAD, headHoles, headOutline } from "./lib/racket-shape";
import { initialInputs } from "./lib/inputs";
import type { RacketColors } from "./scene/racket-canvas";

// three.js only loads in the browser, and only once the stage is about to be seen.
const RacketCanvas = dynamic(() => import("./scene/racket-canvas"), { ssr: false });

const NUDGE = Math.PI / 4;
// Radians of turn per pixel dragged.
const DRAG_SPEED = 0.01;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

function supportsWebGL() {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

const readColors = (): RacketColors => ({
  carbon: readCssVar("--scene-carbon"),
  accent: readCssVar("--primary"),
  light: readCssVar("--scene-light"),
});

// The same outline and holes as the 3D model, drawn flat: the loading state and the
// reduced-motion / no-WebGL fallback.
const OUTLINE_PATH =
  headOutline(64)
    .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(3)} ${(-p.y).toFixed(3)}`)
    .join(" ") + " Z";
const HOLES = headHoles();

function RacketDrawing({ className }: { className?: string }) {
  return (
    <svg viewBox="-1.8 -2.1 3.6 5.6" aria-hidden="true" className={className}>
      <path
        d={OUTLINE_PATH}
        className="fill-scene-carbon stroke-muted-foreground"
        strokeWidth="0.05"
      />
      {HOLES.map((h) => (
        <circle
          key={`${h.x},${h.y}`}
          cx={h.x}
          cy={-h.y}
          r={h.r}
          className={h.logo ? "fill-background stroke-primary" : "fill-background"}
          strokeWidth="0.03"
        />
      ))}
      <rect
        x={-0.17}
        y={-HEAD.throatY}
        width={0.34}
        height={1.6}
        rx={0.06}
        className="fill-scene-carbon stroke-primary"
        strokeWidth="0.04"
      />
    </svg>
  );
}

export function RacketStage() {
  const t = useTranslations("Home.racket");
  const stageRef = useRef<HTMLDivElement>(null);
  const inputs = useRef(initialInputs());
  const dragFrom = useRef<{ x: number; y: number; t: number } | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [colors, setColors] = useState<RacketColors | null>(null);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    // Start loading a screen ahead; render only while actually on screen.
    const ahead = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setWebgl(supportsWebGL());
          setColors(readColors());
          setNear(true);
        }
      },
      { rootMargin: "100% 0px" },
    );
    const onScreen = new IntersectionObserver(([entry]) =>
      setVisible(Boolean(entry?.isIntersecting)),
    );
    ahead.observe(stage);
    onScreen.observe(stage);

    const onScroll = () => {
      const rect = stage.getBoundingClientRect();
      inputs.current.scroll =
        (window.innerHeight / 2 - (rect.top + rect.height / 2)) / window.innerHeight;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // Materials follow the light/dark theme.
    const themeObserver = new MutationObserver(() => setColors(readColors()));
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      ahead.disconnect();
      onScreen.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const show3d = near && webgl && !reducedMotion && colors !== null;

  return (
    <div>
      <div
        ref={stageRef}
        role="img"
        aria-label={t("canvasLabel")}
        // pan-y: a vertical swipe still scrolls the page on phones; sideways turns it.
        className={cn(
          "relative h-[24rem] touch-pan-y sm:h-[32rem]",
          show3d && "cursor-grab active:cursor-grabbing",
        )}
        onPointerDown={(e) => {
          if (!show3d) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          dragFrom.current = { x: e.clientX, y: e.clientY, t: performance.now() };
          inputs.current.dragging = true;
          inputs.current.velocity = 0;
        }}
        onPointerMove={(e) => {
          const from = dragFrom.current;
          if (!from) return;
          const now = performance.now();
          const dx = e.clientX - from.x;
          const dy = e.clientY - from.y;
          const input = inputs.current;
          input.dragYaw += dx * DRAG_SPEED;
          input.dragPitch = Math.max(-0.5, Math.min(0.5, input.dragPitch + dy * DRAG_SPEED));
          input.velocity = (dx * DRAG_SPEED) / Math.max(0.008, (now - from.t) / 1000);
          input.lastDrag = now;
          dragFrom.current = { x: e.clientX, y: e.clientY, t: now };
        }}
        onPointerUp={() => {
          dragFrom.current = null;
          inputs.current.dragging = false;
        }}
        onPointerCancel={() => {
          dragFrom.current = null;
          inputs.current.dragging = false;
          inputs.current.velocity = 0;
        }}
      >
        <RacketDrawing
          className={cn(
            "absolute inset-0 m-auto h-[85%] transition-opacity duration-700",
            show3d && ready ? "opacity-0" : "opacity-100",
          )}
        />
        {show3d && (
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              ready ? "opacity-100" : "opacity-0",
            )}
          >
            <RacketCanvas
              colors={colors}
              inputs={inputs}
              active={visible}
              onReady={() => setReady(true)}
            />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon-lg"
          aria-label={t("turnLeft")}
          disabled={!show3d}
          onClick={() => (inputs.current.nudge -= NUDGE)}
        >
          <RotateCcw aria-hidden="true" />
        </Button>
        <p className="text-muted-foreground px-2 text-xs tracking-widest uppercase">
          {show3d ? t("dragHint") : t("staticHint")}
        </p>
        <Button
          variant="outline"
          size="icon-lg"
          aria-label={t("turnRight")}
          disabled={!show3d}
          onClick={() => (inputs.current.nudge += NUDGE)}
        >
          <RotateCw aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
