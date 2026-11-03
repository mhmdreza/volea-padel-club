import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";

import { CourtMotif } from "./court-motif";
import { NET } from "./court-geometry";

/** Quick-link chips under a status page's actions. */
export const STATUS_LINK_CLASS =
  "border-border bg-card/40 hover:border-primary/60 focus-visible:ring-ring flex min-h-11 items-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none";

// Both scenes share the court motif's viewBox so the ball lines up with its drawing.
const VIEW_BOX = "100 40 1240 680";

/** Out: the ball clears the back glass and leaves the frame. */
function OutScene() {
  return (
    <>
      <path
        d="M520 640 Q760 120 1330 60"
        fill="none"
        className="stroke-primary"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="2 14"
      />
      <g className="motion-safe:animate-float">
        <circle cx="1300" cy="66" r="16" className="fill-primary" />
      </g>
      <text
        x="1180"
        y="170"
        className="fill-primary font-display text-[44px] font-bold tracking-[0.2em]"
      >
        OUT
      </text>
    </>
  );
}

/** Let: the ball sits on the net tape, waiting for the point to be replayed. */
function LetScene() {
  const x = 860;
  return (
    <>
      <path
        d={`M560 640 Q700 380 ${x} ${NET.y - 18}`}
        fill="none"
        className="stroke-primary"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="2 14"
      />
      <g className="motion-safe:animate-float">
        <circle cx={x} cy={NET.y - 18} r="16" className="fill-primary" />
      </g>
    </>
  );
}

/**
 * 404 and error pages in the court language: an outlined word behind, the copy on the
 * left, and the court with the ball telling what happened. Server-only markup with
 * strings passed in, so the locale-free global pages can use it too.
 */
export function StatusPage({
  word,
  eyebrow,
  title,
  description,
  actions,
  scene,
  children,
}: {
  /** The outlined backdrop word, e.g. "404". */
  word: string;
  eyebrow: string;
  title: string;
  description: string;
  actions: ReactNode;
  scene: "out" | "let";
  children?: ReactNode;
}) {
  return (
    <Section className="relative isolate overflow-hidden py-16 sm:py-24">
      <p
        aria-hidden="true"
        className="font-display pointer-events-none absolute inset-x-0 top-6 -z-10 text-center text-[28vw] leading-none font-bold text-transparent [font-stretch:125%] select-none [-webkit-text-stroke:1px_var(--border)] lg:text-[20rem]"
      >
        {word}
      </p>
      <Container className="grid items-center gap-10 lg:grid-cols-[5fr_6fr]">
        <div className="flex flex-col items-start gap-5">
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
              {eyebrow}
            </p>
            <span aria-hidden="true" className="bg-primary h-0.5 w-16" />
          </div>
          <h1 className="font-display text-4xl leading-[0.95] font-bold tracking-tight text-balance [font-stretch:115%] sm:text-6xl">
            {title}
          </h1>
          <p className="text-muted-foreground max-w-md text-lg text-pretty">{description}</p>
          <div className="flex flex-wrap gap-3">{actions}</div>
          {children}
        </div>
        <div className="relative">
          <CourtMotif variant={scene === "out" ? "lights" : "court"} ball={false} />
          <svg
            viewBox={VIEW_BOX}
            aria-hidden="true"
            focusable="false"
            className="absolute inset-0 h-auto w-full overflow-visible"
          >
            {scene === "out" ? <OutScene /> : <LetScene />}
          </svg>
        </div>
      </Container>
    </Section>
  );
}
