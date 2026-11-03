import { ViewTransition, type ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { cn } from "@/lib/utils";

import { CourtMotif, type CourtMotifVariant } from "./court-motif";
import { Parallax } from "./parallax";
import { LOGO_DOTS } from "./section-dots";
import { SectionHeading } from "./section-heading";

type Motif = CourtMotifVariant | "dots" | "none";

// A few of the logo's dots lit, like the hero's lights coming on one by one.
const LIT_DOTS = new Set([2, 8, 16, 19]);
const BALL_DOT = 10;

function LogoDotsMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="246.5 255 300 300" aria-hidden="true" focusable="false" className={className}>
      {LOGO_DOTS.map(([cx, cy], i) => (
        <circle
          key={`${cx},${cy}`}
          cx={cx}
          cy={cy}
          r="18"
          strokeWidth="2"
          className={
            i === BALL_DOT
              ? "fill-primary stroke-primary"
              : LIT_DOTS.has(i)
                ? "fill-scene-light stroke-scene-light"
                : "stroke-border fill-none"
          }
        />
      ))}
    </svg>
  );
}

function MotifArt({ motif, className }: { motif: Exclude<Motif, "none">; className?: string }) {
  return motif === "dots" ? (
    <LogoDotsMotif className={className} />
  ) : (
    <CourtMotif variant={motif} className={className} />
  );
}

/**
 * Inner-page opener in the homepage's language: eyebrow, the orange ball-trail rule,
 * display headline, and a motif drifting behind on the right. No Reveal here — the
 * headline is the page's LCP element.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  actions,
  motif = "court",
  morphName,
  children,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  lead: ReactNode;
  actions?: ReactNode;
  motif?: Motif;
  /** Pairs the headline (and drawing) with the homepage explore card that links here,
   * so following that card morphs one into the other. */
  morphName?: string;
  children?: ReactNode;
}) {
  const heading = morphName ? (
    <ViewTransition name={`${morphName}-title`} share="morph" default="none">
      <span className="inline-block">{title}</span>
    </ViewTransition>
  ) : (
    title
  );
  const art =
    motif === "none" ? null : (
      <MotifArt motif={motif} className={cn("w-full max-w-xl", motif === "dots" && "max-w-xs")} />
    );
  return (
    <Section className="relative isolate overflow-hidden pt-10 pb-12 sm:pt-20 sm:pb-16">
      {motif !== "none" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[55%] items-center md:flex"
        >
          <Parallax speed={0.2} className="w-full" innerClassName="flex justify-end pr-4 lg:pr-10">
            {morphName ? (
              <ViewTransition name={`${morphName}-art`} share="morph" default="none">
                {art}
              </ViewTransition>
            ) : (
              art
            )}
          </Parallax>
          {/* Fades the drawing into the page so the headline always sits on background. */}
          <div className="from-background via-background/50 absolute inset-0 bg-linear-to-r to-transparent" />
        </div>
      )}
      <Container>
        {motif !== "none" && (
          <div
            aria-hidden="true"
            className={cn("mb-6 md:hidden", motif === "dots" ? "w-20" : "w-44")}
          >
            <MotifArt motif={motif} />
          </div>
        )}
        <div className="flex max-w-2xl flex-col items-start gap-6">
          <SectionHeading as="h1" size="page" eyebrow={eyebrow} title={heading} lead={lead} trail />
          {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
          {children}
        </div>
      </Container>
    </Section>
  );
}
