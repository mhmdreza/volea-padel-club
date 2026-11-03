import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Link, type AppLinkHref } from "@/i18n/navigation";

import { Parallax } from "./parallax";
import { SectionDots } from "./section-dots";

/**
 * Closing call to action. `primary` is the homepage's full-bleed orange band with an
 * outlined word sliding behind it — one per page at most, so it stays a moment;
 * `quiet` is a bordered band for secondary asks.
 */
export function CtaBand({
  heading,
  text,
  action,
  word = "PADEL ·",
  tone = "quiet",
}: {
  heading: ReactNode;
  text?: ReactNode;
  action: { href: AppLinkHref; label: string };
  word?: string;
  tone?: "primary" | "quiet";
}) {
  if (tone === "primary") {
    return (
      <section className="bg-primary text-primary-foreground relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 flex items-center max-sm:items-end"
        >
          <Parallax axis="x" speed={-1.6} innerClassName="whitespace-nowrap">
            <span className="font-display text-[10rem] leading-none font-extrabold text-transparent [font-stretch:125%] opacity-25 [-webkit-text-stroke:2px_var(--primary-foreground)] max-sm:translate-y-1/2 max-sm:text-[6rem] max-sm:opacity-15">
              {Array.from({ length: 5 }, () => word).join(" ")}
            </span>
          </Parallax>
        </div>
        <Container className="flex flex-wrap items-center justify-between gap-8 py-20">
          <div>
            <h2 className="font-display text-4xl leading-none font-extrabold tracking-tight text-balance [font-stretch:118%] sm:text-6xl">
              {heading}
            </h2>
            {text && <p className="mt-4 max-w-xl text-lg text-pretty">{text}</p>}
          </div>
          <Button
            asChild
            size="lg"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/85 h-12 px-6"
          >
            <Link href={action.href}>{action.label}</Link>
          </Button>
        </Container>
      </section>
    );
  }

  return (
    <Section className="py-12">
      <Container>
        <div className="border-border bg-card/40 relative isolate flex flex-col items-start gap-6 overflow-hidden rounded-lg border px-6 py-10 sm:px-10">
          <div className="hidden md:contents">
            <SectionDots side="right" />
          </div>
          <div className="max-w-xl">
            <h2 className="font-display text-2xl leading-tight font-bold tracking-tight text-balance [font-stretch:112%] sm:text-3xl">
              {heading}
            </h2>
            {text && <p className="text-muted-foreground mt-2 text-pretty">{text}</p>}
          </div>
          <Button asChild size="lg" className="h-12 px-6">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}
