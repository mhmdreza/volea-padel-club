"use client";

import { useEffect, useState } from "react";

import { ScrollLink } from "@/components/shared/scroll-link";
import { cn } from "@/lib/utils";

export type TimelineItem = { id: string; label: string };

/**
 * The page's parts as a timeline on the right, continuing the hero's own chapter nav:
 * it appears once the hero has scrolled away, highlights the part in the middle of
 * the screen, jumps to any part, and leaves once `endId` reaches the middle. Only on
 * screens wide enough to leave a margin beside the 1280px content column (labels
 * included), so it never covers anything.
 */
export function PageTimeline({
  items,
  label,
  endId,
}: {
  items: TimelineItem[];
  label: string;
  endId: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const [past, setPast] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("story");
    const heroObserver = new IntersectionObserver(([entry]) =>
      setHeroVisible(Boolean(entry?.isIntersecting)),
    );
    if (hero) heroObserver.observe(hero);

    // The current part is the last one whose anchor has reached the middle of the
    // screen. Anchors, not the parts themselves: stacked cards stay stuck on screen
    // while the next one covers them, so "the part in the middle" is ambiguous.
    let frame = 0;
    const update = () => {
      frame = 0;
      const middle = window.innerHeight / 2;
      const reached = (id: string) => {
        const el = document.getElementById(id);
        return el !== null && el.getBoundingClientRect().top <= middle;
      };
      setActive(items.findLast((item) => reached(item.id))?.id ?? null);
      setPast(reached(endId));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      heroObserver.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items, endId]);

  const hidden = heroVisible || past;

  return (
    <nav
      aria-label={label}
      className={cn(
        "fixed top-1/2 right-2 z-40 hidden -translate-y-1/2 flex-col items-end gap-3 text-[11px] tracking-[0.14em] uppercase transition-opacity duration-500 min-[1520px]:flex",
        hidden ? "pointer-events-none opacity-0" : "opacity-100",
      )}
      aria-hidden={hidden || undefined}
    >
      {items.map((item) => {
        const current = item.id === active;
        return (
          <ScrollLink
            key={item.id}
            href={`#${item.id}`}
            tabIndex={hidden ? -1 : undefined}
            aria-current={current ? "location" : undefined}
            className={cn(
              "group hover:text-foreground flex items-center gap-2 rounded-full px-2 py-1 transition-colors",
              current ? "text-foreground dark:text-primary" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "bg-background/80 rounded px-1 backdrop-blur",
                current
                  ? "inline"
                  : "sr-only group-hover:not-sr-only group-focus-visible:not-sr-only",
              )}
            >
              {item.label}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "size-2 rounded-full border transition-colors",
                current ? "bg-primary border-primary" : "border-muted-foreground",
              )}
            />
          </ScrollLink>
        );
      })}
    </nav>
  );
}
