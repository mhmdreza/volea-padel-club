"use client";

import { Shuffle, Trophy, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { localize } from "@/lib/i18n-content";

import { useEvents } from "./use-events";

// Keyed by the known content ids (src/content/events.ts); Trophy is the
// sensible fallback for any future event id that isn't one of these three.
const EVENT_ICONS: Record<string, typeof Trophy> = {
  americano: Shuffle,
  mexicano: Zap,
  "club-tournament": Trophy,
};

export function EventsContent() {
  const locale = useLocale();
  const t = useTranslations("Events");
  const { data: events, isLoading, isError } = useEvents();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-muted-foreground text-sm">{t("loadError")}</p>;
  }

  if (!events || events.length === 0) {
    return <p className="text-muted-foreground text-sm">{t("comingSoon")}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* The formats run from social to competitive, left to right. */}
      <div
        aria-hidden="true"
        className="text-muted-foreground hidden items-center gap-4 text-xs font-semibold tracking-[0.2em] uppercase sm:flex"
      >
        <span>{t("formats.social")}</span>
        <span className="from-scene-glass to-primary h-0.5 flex-1 rounded-full bg-linear-to-r" />
        <span>{t("formats.competitive")}</span>
      </div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {events.map((event) => {
          const Icon = EVENT_ICONS[event.id] ?? Trophy;
          return (
            <GlassPanel as="li" key={event.id}>
              <Icon className="dark:text-primary size-7" aria-hidden="true" />
              <Badge variant="outline" className="mt-4">
                {localize(event.format, locale)}
              </Badge>
              <h3 className="font-display mt-2 text-xl font-bold tracking-tight [font-stretch:112%]">
                {localize(event.title, locale)}
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {localize(event.description, locale)}
              </p>
            </GlassPanel>
          );
        })}
      </ul>
    </div>
  );
}
