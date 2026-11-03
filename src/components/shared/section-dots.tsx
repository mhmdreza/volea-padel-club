import { cn } from "@/lib/utils";

import { Parallax } from "./parallax";

// The logo's 21 dots (rows 3-5-5-5-3), from src/app/icon.svg.
export const LOGO_DOTS = [
  [339.9, 283.4],
  [396.7, 283.4],
  [453.4, 283.4],
  [283.9, 344],
  [340.2, 344],
  [396.7, 344],
  [453.4, 344],
  [509.5, 344],
  [283.9, 404.6],
  [340.3, 404.6],
  [396.7, 404.6],
  [453.1, 404.6],
  [509.5, 404.6],
  [283.5, 465.6],
  [340, 465.6],
  [396.3, 465.6],
  [452.8, 465.6],
  [509.2, 465.6],
  [340.1, 526.6],
  [396.3, 526.6],
  [453.1, 526.6],
] as const;

/**
 * Background depth for a homepage part: the logo's dot grid, drifting slower than the
 * content. Purely decorative; the parent section must be `relative isolate
 * overflow-hidden`.
 */
export function SectionDots({ side = "right" }: { side?: "left" | "right" }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <Parallax
        speed={0.25}
        className={cn("absolute bottom-0", side === "right" ? "-right-16" : "-left-16")}
      >
        <svg viewBox="246.5 255 300 300" className="size-64 sm:size-80">
          <g fill="none" className="stroke-border" strokeWidth="2">
            {LOGO_DOTS.map(([cx, cy]) => (
              <circle key={`${cx},${cy}`} cx={cx} cy={cy} r="18" />
            ))}
          </g>
        </svg>
      </Parallax>
    </div>
  );
}
