"use client";

import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton";

import { useSponsors } from "./use-sponsors";

export function SponsorsGrid() {
  const t = useTranslations("Sponsoring");
  const { data, isLoading, isError } = useSponsors();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-muted-foreground text-sm">{t("loadError")}</p>;
  }

  if (!data || data.sponsors.length === 0) {
    // Empty logo slots rather than a bare sentence: shows where partners will appear.
    return (
      <div className="border-border bg-card/40 rounded-lg border p-6 backdrop-blur-sm">
        <div aria-hidden="true" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-border h-14 rounded-md border border-dashed" />
          ))}
        </div>
        <p className="text-muted-foreground mt-4 text-sm">{t("sponsorsComingSoon")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {data.sponsors.map((sponsor) => (
        <div
          key={sponsor.id}
          className="border-border bg-card/40 flex items-center justify-center rounded-lg border p-4"
        >
          <span className="text-sm font-medium">{sponsor.name}</span>
        </div>
      ))}
    </div>
  );
}
