"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Homepage parts as a stack of cards: each one slides up over the last and the
 * covered one dims. All cards must be direct children of this wrapper — a sticky
 * card stays stuck until its parent ends, so siblings keep stacking to the end.
 */
export function StackedSections({ children }: { children: ReactNode }) {
  return <div className="stack">{children}</div>;
}

const tones = {
  slab: "bg-section-slab text-foreground",
  sheet: "bg-section-sheet text-foreground",
  base: "bg-section-base text-foreground",
  primary: "bg-primary text-primary-foreground",
} as const;

// The sticky header's height (4rem): cards stick just under it.
const HEADER_LINE = 64;

/**
 * One card of the stack. Its anchor `id` sits on a zero-height sentinel before it,
 * not on the card: scrollIntoView on a stuck element does nothing. Never put a part
 * with live state (WebGL, a game loop, the pinned story) in here — a buried card
 * still counts as on screen, so its loop would keep running underneath.
 */
export function StackCard({
  id,
  tone,
  children,
}: {
  id?: string;
  tone: keyof typeof tones;
  children: ReactNode;
}) {
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const sentinel = sentinelRef.current;
    if (!card || !sentinel) return;

    // A card taller than the screen scrolls to its bottom first, then sticks (see
    // the `top` rule in globals.css).
    const resize = new ResizeObserver(() => {
      card.style.setProperty("--card-h", `${card.offsetHeight}px`);
    });
    resize.observe(card);

    // Covered once the next card's sentinel passes the header line. The observed
    // area is everything below that line, however far, so even an instant jump
    // (an anchor link) crosses its edge and reports.
    const next = card.nextElementSibling;
    let cover: IntersectionObserver | undefined;
    if (next instanceof HTMLElement && next.dataset.stackSentinel !== undefined) {
      cover = new IntersectionObserver(
        ([entry]) => {
          if (entry) card.toggleAttribute("data-covered", !entry.isIntersecting);
        },
        { rootMargin: `-${HEADER_LINE}px 0px 1000000px 0px` },
      );
      cover.observe(next);
    }

    // Tabbing into a buried card brings it back out rather than focusing something
    // hidden under the next one.
    const onFocus = (e: FocusEvent) => {
      if (!card.hasAttribute("data-covered")) return;
      sentinel.scrollIntoView({ block: "start" });
      if (e.target instanceof HTMLElement) e.target.scrollIntoView({ block: "nearest" });
    };
    card.addEventListener("focusin", onFocus);

    return () => {
      resize.disconnect();
      cover?.disconnect();
      card.removeEventListener("focusin", onFocus);
    };
  }, []);

  return (
    <>
      <span
        ref={sentinelRef}
        id={id}
        data-stack-sentinel=""
        aria-hidden="true"
        className="block scroll-mt-16"
      />
      <div ref={cardRef} className="stack-card">
        <div className={cn("stack-sheet", tones[tone])}>{children}</div>
      </div>
    </>
  );
}
