"use client";

import { useLocale, useTranslations } from "next-intl";

import { GlassPanel } from "@/components/shared/glass-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { localize } from "@/lib/i18n-content";
import type { Court } from "@/types/content";

import { useCourts } from "./use-courts";

// Top-down outline at regulation proportions (20×10 m doubles, 20×6 m singles), so
// the lineup shows the difference between the two at a glance.
function CourtGlyph({ kind }: { kind: Court["kind"] }) {
  const height = kind === "doubles" ? 10 : 6;
  return (
    <svg
      viewBox="-1 -1 22 12"
      aria-hidden="true"
      focusable="false"
      className="stroke-scene-glass h-10 w-auto shrink-0 fill-none"
    >
      <rect x="0" y={(10 - height) / 2} width="20" height={height} strokeWidth="0.5" />
      <line x1="10" y1={(10 - height) / 2} x2="10" y2={(10 + height) / 2} strokeWidth="0.5" />
      <circle cx="10" cy="5" r="0.7" className="fill-primary stroke-none" />
    </svg>
  );
}

export function CourtOverview() {
  const locale = useLocale();
  const t = useTranslations("Courts");
  const { data: courts, isLoading, isError } = useCourts();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError || !courts || courts.length === 0) {
    return null;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {courts.map((court) => (
        <GlassPanel
          as="li"
          key={court.id}
          className="flex items-center gap-5 sm:flex-col sm:items-start sm:gap-4"
        >
          <CourtGlyph kind={court.kind} />
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
              {t(`kind.${court.kind}`)}
            </p>
            <p className="font-display mt-1 text-lg font-bold tracking-tight [font-stretch:112%]">
              {localize(court.name, locale)}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {localize(court.description, locale)}
            </p>
          </div>
        </GlassPanel>
      ))}
    </ul>
  );
}
