"use client";

import { Sparkles, User, Users } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

import { localize } from "@/lib/i18n-content";
import type { TrainingProgram } from "@/types/content";

const FORMAT_ICONS: Record<TrainingProgram["format"], typeof Sparkles> = {
  taster: Sparkles,
  group: Users,
  private: User,
};

// The dashed ball trail is revealed through a mask whose stroke draws in, so the
// dashes stay put while the line grows. Reduced motion: shown complete, no transition.
const DRAW =
  "motion-safe:transition-[stroke-dashoffset] motion-safe:duration-[1600ms] motion-safe:ease-out motion-reduce:[stroke-dashoffset:0]";

function Trail({
  d,
  viewBox,
  drawn,
  className,
}: {
  d: string;
  viewBox: string;
  drawn: boolean;
  className: string;
}) {
  const maskId = useId();
  return (
    <svg viewBox={viewBox} preserveAspectRatio="none" aria-hidden="true" className={className}>
      <mask id={maskId} maskUnits="userSpaceOnUse">
        <path
          d={d}
          fill="none"
          stroke="white"
          strokeWidth="12"
          pathLength={1}
          strokeDasharray="1"
          className={DRAW}
          style={{ strokeDashoffset: drawn ? 0 : 1 }}
        />
      </mask>
      <path
        d={d}
        fill="none"
        mask={`url(#${maskId})`}
        className="stroke-primary"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="2 9"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function CeilingDot() {
  return (
    <svg viewBox="-20 -20 40 40" aria-hidden="true" className="size-10 shrink-0">
      <circle r="18" className="fill-scene-light" opacity="0.2" />
      <circle r="10" className="fill-scene-light" opacity="0.35" />
      <circle r="6" className="fill-scene-light" />
    </svg>
  );
}

/**
 * Taster → Group → Private as stations on the ball's trail: one way into the game,
 * each step lit by one of the hall's ceiling lights. Vertical on phones, a rally
 * across the page on large screens.
 */
export function TrainingPath({ programs }: { programs: TrainingProgram[] }) {
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setDrawn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Dot centres: left-5 on phones (size-10 dots), column centres on lg. */}
      <Trail
        d="M20 0 L20 300"
        viewBox="0 0 40 300"
        drawn={drawn}
        className="absolute top-5 bottom-5 left-0 h-[calc(100%-2.5rem)] w-10 lg:hidden"
      />
      <Trail
        d="M50 20 C83 -4 117 44 150 20 S217 -4 250 20"
        viewBox="0 0 300 40"
        drawn={drawn}
        className="absolute inset-x-0 top-0 hidden h-10 w-full lg:block"
      />
      <ol className="relative grid gap-10 lg:grid-cols-3 lg:gap-6">
        {programs.map((program) => {
          const Icon = FORMAT_ICONS[program.format];
          return (
            <li key={program.id} className="flex gap-5 lg:flex-col lg:items-center lg:text-center">
              <CeilingDot />
              <div className="border-border bg-card/40 flex-1 rounded-lg border p-6 backdrop-blur-sm lg:mt-4 lg:w-full">
                <Icon className="dark:text-primary size-6 lg:mx-auto" aria-hidden="true" />
                <h3 className="font-display mt-3 text-xl font-bold tracking-tight [font-stretch:112%]">
                  {localize(program.title, locale)}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {localize(program.description, locale)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
