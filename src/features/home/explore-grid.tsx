import { ArrowRight } from "lucide-react";
import { ViewTransition, type ReactNode } from "react";

import { CourtMotif } from "@/components/shared/court-motif";
import { LOGO_DOTS } from "@/components/shared/section-dots";
import { Link, type AppLinkHref } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type ExploreKey = "courts" | "training" | "events" | "lounge" | "sponsoring" | "vouchers";
export type ExploreItem = { key: ExploreKey; href: AppLinkHref; title: string; text: string };

// Bento placement on wide screens: the courts card is the hero of the grid.
const SPAN: Record<ExploreKey, string> = {
  courts: "lg:col-span-2 lg:row-span-2",
  training: "lg:col-span-2",
  events: "",
  lounge: "",
  sponsoring: "lg:col-span-2",
  vouchers: "lg:col-span-2",
};

// Each card's drawing, in the hero's court language. They're decorative, and only
// come alive on hover (motion-safe), so the grid reads calm while scrolling past.
function TrainingArt() {
  const stations = [40, 160, 280];
  return (
    <svg viewBox="0 0 320 80" aria-hidden="true" className="h-16 w-full">
      <path
        d="M20 60 Q100 0 160 40 T300 30"
        fill="none"
        className="stroke-primary"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 10"
      />
      {stations.map((x, i) => (
        <g key={x}>
          <circle
            cx={x}
            cy={[50, 38, 32][i]}
            r="16"
            className="fill-scene-light opacity-15 transition-opacity duration-500 group-hover:opacity-40"
          />
          <circle cx={x} cy={[50, 38, 32][i]} r="6" className="fill-scene-light" />
        </g>
      ))}
    </svg>
  );
}

function EventsArt() {
  return (
    <svg viewBox="0 0 120 40" aria-hidden="true" className="h-10 w-32">
      <line x1="8" y1="20" x2="112" y2="20" className="stroke-border" strokeWidth="2" />
      {[16, 48, 80].map((x) => (
        <circle key={x} cx={x} cy="20" r="5" className="fill-muted-foreground/40" />
      ))}
      <circle
        cx="104"
        cy="20"
        r="7"
        className="fill-primary origin-[104px_20px] transition-transform duration-500 group-hover:scale-125"
      />
    </svg>
  );
}

function LoungeArt() {
  return (
    <svg viewBox="0 0 120 50" aria-hidden="true" className="h-12 w-32">
      {[20, 60, 100].map((x) => (
        <g key={x}>
          <line x1={x} y1="0" x2={x} y2="14" className="stroke-border" strokeWidth="2" />
          <circle
            cx={x}
            cy="22"
            r="18"
            className="fill-scene-light opacity-10 transition-opacity duration-500 group-hover:opacity-35"
          />
          <circle cx={x} cy="20" r="6" className="fill-scene-light" />
        </g>
      ))}
    </svg>
  );
}

function VouchersArt() {
  return (
    <svg viewBox="0 0 200 60" aria-hidden="true" className="h-14 w-48">
      <rect
        x="4"
        y="6"
        width="192"
        height="48"
        rx="6"
        fill="none"
        className="stroke-primary transition-transform duration-500 group-hover:-rotate-2"
        strokeWidth="2"
      />
      {/* The perforation is the logo's top row of dots, repeated. */}
      {Array.from({ length: 6 }, (_, i) => (
        <circle key={i} cx="140" cy={12 + i * 7.5} r="2" className="fill-primary" />
      ))}
      <g transform="translate(150 18) scale(0.1)" className="fill-primary">
        {LOGO_DOTS.slice(0, 13).map(([cx, cy]) => (
          <circle key={`${cx},${cy}`} cx={cx - 280} cy={cy - 280} r="18" />
        ))}
      </g>
    </svg>
  );
}

const ART: Partial<Record<ExploreKey, () => ReactNode>> = {
  training: TrainingArt,
  events: EventsArt,
  lounge: LoungeArt,
  vouchers: VouchersArt,
};

/** "Everything you need to play" as a bento grid of drawn cards, courts first. */
export function ExploreGrid({ items }: { items: ExploreItem[] }) {
  return (
    <ul className="mt-10 grid auto-rows-[minmax(11rem,auto)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Art = ART[item.key];
        const big = item.key === "courts";
        return (
          <li key={item.key} className={SPAN[item.key]}>
            <Link
              href={item.href}
              className={cn(
                "group border-border bg-card/40 hover:border-primary/60 focus-visible:ring-ring focus-visible:ring-offset-background relative isolate flex h-full flex-col gap-3 overflow-hidden rounded-lg border p-6 backdrop-blur-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                big && "sm:p-8",
              )}
            >
              {big && (
                <ViewTransition name="courts-art" share="morph" default="none">
                  <CourtMotif
                    variant="lights"
                    className="pointer-events-none -mx-4 -mt-2 mb-2 transition-transform duration-700 motion-safe:group-hover:scale-[1.03]"
                  />
                </ViewTransition>
              )}
              {item.key === "sponsoring" && (
                <CourtMotif
                  variant="court"
                  highlight="boards"
                  ball={false}
                  className="pointer-events-none absolute right-4 bottom-4 -z-10 w-36 opacity-60 transition-opacity duration-500 group-hover:opacity-100 sm:w-56"
                />
              )}
              {Art && <Art />}
              {/* Morphs into the headline of the page this card opens (see PageHero). */}
              <ViewTransition name={`${item.key}-title`} share="morph" default="none">
                <span
                  className={cn(
                    "font-display w-fit font-bold tracking-tight [font-stretch:112%]",
                    big ? "text-3xl sm:text-4xl" : "text-xl",
                  )}
                >
                  {item.title}
                </span>
              </ViewTransition>
              <span className="text-muted-foreground max-w-xs text-sm">{item.text}</span>
              <ArrowRight
                aria-hidden="true"
                className="text-primary mt-auto size-5 transition-transform group-hover:translate-x-1"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
