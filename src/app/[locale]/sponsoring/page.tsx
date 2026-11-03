import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Dumbbell } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { CtaBand } from "@/components/shared/cta-band";
import { GlassPanel } from "@/components/shared/glass-panel";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { AdSpaceExplorer } from "@/features/sponsoring/ad-space-explorer";
import { SponsorsGrid } from "@/features/sponsoring/sponsors-grid";
import { getSponsorsServer, sponsorsQueryKey } from "@/features/sponsoring/use-sponsors";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Sponsoring" });
  return buildMetadata({
    locale,
    path: "/sponsoring",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function SponsoringPage() {
  const t = await getTranslations("Sponsoring");

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({ queryKey: sponsorsQueryKey, queryFn: getSponsorsServer });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageHero
        morphName="sponsoring"
        motif="dots"
        eyebrow={t("eyebrow")}
        title={t("title")}
        lead={t("subtitle")}
      />

      <Section className="py-12">
        <Reveal>
          <Container>
            <SectionHeading
              eyebrow={t("surfaces.eyebrow")}
              title={t("surfaces.heading")}
              lead={t("adSpaceText")}
              className="mb-10"
            />
            <AdSpaceExplorer />
          </Container>
        </Reveal>
      </Section>

      <Section className="py-12">
        <Reveal>
          <Container className="grid gap-10 lg:grid-cols-2">
            <div>
              <SectionHeading title={t("sponsorsHeading")} size="small" />
              <div className="mt-6">
                <SponsorsGrid />
              </div>
            </div>
            <div>
              <SectionHeading title={t("fitnessHeading")} size="small" />
              <GlassPanel className="mt-6 flex items-start gap-4">
                <Dumbbell className="dark:text-primary size-6 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-muted-foreground text-sm">{t("fitnessText")}</p>
                </div>
              </GlassPanel>
            </div>
          </Container>
        </Reveal>
      </Section>

      <CtaBand
        tone="primary"
        word="YOUR BRAND ·"
        heading={t("adSpaceHeading")}
        text={t("ctaBandText")}
        action={{
          href: { pathname: "/contact", query: { type: "sponsorship" } },
          label: t("adSpaceCta"),
        }}
      />
    </HydrationBoundary>
  );
}
