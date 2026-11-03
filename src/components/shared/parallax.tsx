"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Scroll parallax: the content drifts relative to its place on the page as it passes
 * through the viewport — positive `speed` lags behind (background), negative leads
 * (foreground). One shared scroll listener drives every layer, only layers on screen
 * are updated, and only `transform` changes, so it stays cheap. Off under reduced
 * motion; half strength on narrow screens.
 */

type Layer = {
  outer: HTMLElement;
  inner: HTMLElement;
  speed: number;
  axis: "x" | "y";
  rotate: number;
  scale: number;
  visible: boolean;
};

const layers = new Set<Layer>();
let frame = 0;

function update() {
  frame = 0;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const strength = window.innerWidth < 640 ? 0.5 : 1;
  const vh = window.innerHeight;
  for (const layer of layers) {
    if (!layer.visible) continue;
    if (reduced) {
      layer.inner.style.transform = "";
      continue;
    }
    // -1 when the layer's centre is a screen below the viewport centre, +1 a screen above.
    const rect = layer.outer.getBoundingClientRect();
    const progress = (vh / 2 - (rect.top + rect.height / 2)) / vh;
    const shift = progress * layer.speed * 120 * strength;
    const move = layer.axis === "x" ? `translate3d(${shift}px,0,0)` : `translate3d(0,${shift}px,0)`;
    const tilt = layer.rotate ? ` rotate(${progress * layer.rotate}deg)` : "";
    // Full size at the centre of the screen, smaller towards either edge.
    const size = layer.scale
      ? ` scale(${Math.max(0.5, 1 - Math.abs(progress) * layer.scale)})`
      : "";
    layer.inner.style.transform = move + tilt + size;
  }
}

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(update);
};

function register(layer: Layer) {
  if (layers.size === 0) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  }
  layers.add(layer);
  schedule();
  return () => {
    layers.delete(layer);
    if (layers.size === 0) {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    }
  };
}

export function Parallax({
  speed = 0.3,
  axis = "y",
  rotate = 0,
  scale = 0,
  className,
  innerClassName,
  children,
}: {
  speed?: number;
  axis?: "x" | "y";
  /** Degrees of rotation per screen of travel, e.g. a tilt that settles as it passes. */
  rotate?: number;
  /** How much it shrinks per screen away from the viewport centre (0 = never). */
  scale?: number;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const layer: Layer = { outer, inner, speed, axis, rotate, scale, visible: false };
    // A margin so layers are already in place as they scroll into view.
    const observer = new IntersectionObserver(
      ([entry]) => {
        layer.visible = Boolean(entry?.isIntersecting);
        schedule();
      },
      { rootMargin: "25% 0px" },
    );
    observer.observe(outer);
    const unregister = register(layer);
    return () => {
      observer.disconnect();
      unregister();
    };
  }, [speed, axis, rotate, scale]);

  return (
    <div ref={outerRef} className={className}>
      <div ref={innerRef} className={cn("will-change-transform", innerClassName)}>
        {children}
      </div>
    </div>
  );
}
