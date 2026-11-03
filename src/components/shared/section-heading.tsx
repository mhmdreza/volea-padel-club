import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// Same eyebrow + display type as the homepage parts (racket-section.tsx), so the inner
// pages read as one system with it.
const TITLE_SIZES = {
  page: "text-4xl leading-[0.95] font-extrabold [font-stretch:115%] sm:text-6xl",
  section: "text-3xl leading-[1.05] font-bold [font-stretch:112%] sm:text-5xl",
  small: "text-2xl leading-tight font-bold [font-stretch:112%]",
} as const;

export function SectionHeading({
  eyebrow,
  title,
  lead,
  as: Heading = "h2",
  size = "section",
  align = "start",
  trail = false,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  as?: "h1" | "h2";
  size?: keyof typeof TITLE_SIZES;
  align?: "start" | "center";
  /** The orange ball-trail rule under the eyebrow — the page heroes' signature. */
  trail?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
          {eyebrow}
        </p>
      )}
      {trail && <span aria-hidden="true" className="bg-primary h-0.5 w-16 rounded-full" />}
      <Heading
        className={cn("font-display tracking-tight text-balance hyphens-auto", TITLE_SIZES[size])}
      >
        {title}
      </Heading>
      {lead && (
        <p
          className={cn(
            "text-muted-foreground max-w-xl text-pretty",
            size === "page" ? "mt-1 text-lg" : "leading-relaxed",
          )}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
