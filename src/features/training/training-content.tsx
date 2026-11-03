"use client";

import { useLocale, useTranslations } from "next-intl";

import { GlassPanel } from "@/components/shared/glass-panel";
import { SectionHeading } from "@/components/shared/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { localize } from "@/lib/i18n-content";

import { TrainingPath } from "./training-path";
import { useTraining } from "./use-training";

// Outlined stand-ins until the coaching team is announced — no invented names or faces.
function CoachSilhouettes() {
  return (
    <svg viewBox="0 0 180 64" aria-hidden="true" className="h-16 w-auto">
      <g fill="none" className="stroke-muted-foreground" strokeWidth="1.5" strokeDasharray="3 4">
        {[30, 90, 150].map((x) => (
          <g key={x}>
            <circle cx={x} cy="20" r="11" />
            <path d={`M${x - 22} 62 Q${x - 22} 38 ${x} 38 Q${x + 22} 38 ${x + 22} 62`} />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function TrainingContent() {
  const locale = useLocale();
  const t = useTranslations("Training");
  const { data, isLoading, isError } = useTraining();

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-muted-foreground text-sm">{t("loadError")}</p>;
  }

  return (
    <div className="space-y-20">
      <div>
        <SectionHeading
          eyebrow={t("path.eyebrow")}
          title={t("programsHeading")}
          className="mb-10"
        />
        <TrainingPath programs={data.programs} />
      </div>

      <div>
        <SectionHeading title={t("coachesHeading")} size="small" />
        {data.coaches.length === 0 ? (
          <GlassPanel
            tone="muted"
            className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8"
          >
            <CoachSilhouettes />
            <p className="text-muted-foreground text-sm">{t("coachesComingSoon")}</p>
          </GlassPanel>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {data.coaches.map((coach) => (
              <GlassPanel key={coach.id}>
                <p className="font-semibold">{coach.name}</p>
                <p className="text-muted-foreground mt-1 text-sm">{localize(coach.bio, locale)}</p>
              </GlassPanel>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
