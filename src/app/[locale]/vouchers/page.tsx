import { Gift } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { CourtMotif } from "@/components/shared/court-motif";
import { GlassPanel } from "@/components/shared/glass-panel";
import { PageHero } from "@/components/shared/page-hero";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Vouchers" });
  return buildMetadata({
    locale,
    path: "/vouchers",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function VouchersPage() {
  const t = await getTranslations("Vouchers");

  return (
    <>
      <PageHero
        morphName="vouchers"
        motif="dots"
        eyebrow={t("eyebrow")}
        title={t("title")}
        lead={t("text")}
      />
      <Section className="pt-0 pb-16">
        <Container>
          {/* A padel ticket: the stub is torn off along a perforation of the logo's dots. */}
          <GlassPanel
            as="article"
            className="relative flex max-w-3xl flex-col overflow-hidden p-0 md:flex-row"
          >
            <div className="flex flex-1 flex-col items-start gap-4 p-8 sm:p-10">
              <p className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase">
                <Gift className="dark:text-primary size-4" aria-hidden="true" />
                {t("ticket.label")}
              </p>
              <h2 className="font-display text-3xl leading-none font-extrabold tracking-tight [font-stretch:118%] sm:text-4xl">
                {t("subtitle")}
              </h2>
              <Button asChild size="lg" className="mt-2">
                <Link href="/contact">{t("cta")}</Link>
              </Button>
            </div>

            <div
              aria-hidden="true"
              className="flex justify-between px-4 md:flex-col md:px-0 md:py-4"
            >
              {Array.from({ length: 9 }, (_, i) => (
                <span
                  key={i}
                  className={
                    i === 4
                      ? "bg-primary size-2.5 rounded-full"
                      : "border-border size-2.5 rounded-full border-2"
                  }
                />
              ))}
            </div>

            <div className="flex flex-col justify-between gap-6 p-8 md:w-64">
              <CourtMotif variant="court" className="w-full max-w-56" />
              <p className="font-display text-lg leading-tight font-bold tracking-tight [font-stretch:112%]">
                Volea Padel
                <span className="text-muted-foreground block text-sm font-normal tracking-normal">
                  Lindenau
                </span>
              </p>
            </div>
          </GlassPanel>
        </Container>
      </Section>
    </>
  );
}
