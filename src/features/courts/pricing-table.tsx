"use client";

import { useLocale, useTranslations } from "next-intl";

import { GlassPanel } from "@/components/shared/glass-panel";
import { SectionHeading } from "@/components/shared/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import { localize } from "@/lib/i18n-content";
import type { PricingTier } from "@/types/content";

import { usePricing } from "./use-pricing";

function TierRow({
  tier,
  locale,
  perPerson,
}: {
  tier: PricingTier;
  locale: string;
  perPerson: string;
}) {
  return (
    <li className="border-border flex items-end justify-between gap-4 border-t py-4 first:border-t-0">
      <div className="min-w-0">
        <p className="font-semibold">{localize(tier.label, locale)}</p>
        <p className="text-muted-foreground text-sm">{localize(tier.timeWindow, locale)}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-3xl leading-none font-extrabold tracking-tight whitespace-nowrap [font-stretch:115%]">
          {formatPrice(tier.priceCents, locale)}
          {tier.aiToolSurchargeCents ? (
            <span className="text-muted-foreground align-super text-base">*</span>
          ) : null}
        </p>
        <p className="text-muted-foreground mt-1 text-xs whitespace-nowrap">
          {formatPrice(tier.pricePerPersonCents, locale)} {perPerson}
        </p>
      </div>
    </li>
  );
}

export function PricingTable() {
  const locale = useLocale();
  const t = useTranslations("Courts");
  const { data, isLoading, isError } = usePricing();

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-lg" />;
  }

  if (isError || !data) {
    return <p className="text-muted-foreground text-sm">{t("pricingError")}</p>;
  }

  const doubles = data.tiers.filter((tier) => tier.courtKind === "doubles");
  const singles = data.tiers.filter((tier) => tier.courtKind === "singles");
  const hasAiToolSurcharge = data.tiers.some((tier) => tier.aiToolSurchargeCents);

  return (
    <div className="space-y-12">
      <SectionHeading eyebrow={t("pricing.eyebrow")} title={t("pricing.heading")} />

      <div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            { heading: t("doublesHeading"), tiers: doubles },
            { heading: t("singlesHeading"), tiers: singles },
          ].map((group) => (
            <GlassPanel key={group.heading} className="sm:p-8">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
                {group.heading}
              </h3>
              <ul className="mt-2">
                {group.tiers.map((tier) => (
                  <TierRow
                    key={tier.id}
                    tier={tier}
                    locale={locale}
                    perPerson={t("pricing.perPerson")}
                  />
                ))}
              </ul>
            </GlassPanel>
          ))}
        </div>
        {hasAiToolSurcharge && (
          <p className="text-muted-foreground mt-3 text-xs">{t("aiToolNote")}</p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {data.specials.length > 0 && (
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight [font-stretch:112%]">
              {t("specialsHeading")}
            </h3>
            <ul className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
              {data.specials.map((special) => (
                <GlassPanel as="li" key={special.id} tone="muted" className="p-5">
                  <p className="font-semibold">{localize(special.title, locale)}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {localize(special.description, locale)}
                  </p>
                </GlassPanel>
              ))}
            </ul>
          </div>
        )}

        {data.addOns.length > 0 && (
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight [font-stretch:112%]">
              {t("addOnsHeading")}
            </h3>
            <GlassPanel tone="muted" className="mt-4 p-5">
              <ul className="space-y-2 text-sm">
                {data.addOns.map((addOn) => (
                  <li key={addOn.id} className="flex justify-between gap-4">
                    <span>{localize(addOn.label, locale)}</span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {formatPrice(addOn.priceCents, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          </div>
        )}
      </div>
    </div>
  );
}
