"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { CourtMotif } from "@/components/shared/court-motif";
import { SlidingTabsList } from "@/components/shared/sliding-tabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";

const SURFACES = ["boards", "banners"] as const;
type Surface = (typeof SURFACES)[number];

/** Points out the ad surfaces named in the sponsoring copy on the hero's court drawing. */
export function AdSpaceExplorer() {
  const t = useTranslations("Sponsoring.surfaces");
  const [surface, setSurface] = useState<Surface>("boards");

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[2fr_3fr]">
      <Tabs
        value={surface}
        onValueChange={(value) => setSurface(value as Surface)}
        className="flex-col items-start"
      >
        <SlidingTabsList
          label={t("label")}
          items={SURFACES.map((s) => ({ value: s, label: t(`${s}.title`) }))}
          value={surface}
        />
        {/* Both descriptions share one grid cell and cross-fade, so the text never jumps;
            the hidden one stays out of the accessibility tree. */}
        <div className="mt-4 grid">
          {SURFACES.map((s) => (
            <TabsContent
              key={s}
              value={s}
              forceMount
              aria-hidden={surface !== s}
              tabIndex={surface === s ? 0 : -1}
              className="col-start-1 row-start-1 mt-0 transition-opacity duration-500 data-[state=inactive]:pointer-events-none data-[state=inactive]:opacity-0 motion-reduce:transition-none"
            >
              <p className="text-muted-foreground max-w-sm text-base text-pretty">
                {t(`${s}.text`)}
              </p>
            </TabsContent>
          ))}
        </div>
        <p className="text-muted-foreground mt-4 text-xs">{t("illustrative")}</p>
      </Tabs>
      <div className="border-border bg-card/40 rounded-lg border p-4 sm:p-8">
        <CourtMotif variant="court" highlight={surface} />
      </div>
    </div>
  );
}
