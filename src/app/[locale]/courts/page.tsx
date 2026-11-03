import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Note } from "@/components/shared/note";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { SectionDivider } from "@/components/shared/section-divider";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { CourtOverview } from "@/features/courts/court-overview";
import { CourtSpecDrawing } from "@/features/courts/court-spec-drawing";
import { courtsQueryKey, getCourtsServer } from "@/features/courts/use-courts";
import { getPricingServer, pricingQueryKey } from "@/features/courts/use-pricing";
import { PricingTable } from "@/features/courts/pricing-table";
import { Link } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Courts" });
  return buildMetadata({
    locale,
    path: "/courts",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function CourtsPage() {
  const t = await getTranslations("Courts");

  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery({ queryKey: courtsQueryKey, queryFn: getCourtsServer }),
    queryClient.prefetchQuery({ queryKey: pricingQueryKey, queryFn: getPricingServer }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageHero
        morphName="courts"
        motif="court"
        eyebrow={t("eyebrow")}
        title={t("title")}
        lead={t("subtitle")}
        actions={
          <Button asChild size="lg">
            <Link href="/book">{t("bookCta")}</Link>
          </Button>
        }
      />

      <Section className="py-8">
        <Reveal>
          <Container>
            <SectionHeading title={t("courtsHeading")} size="small" />
            <div className="mt-6">
              <CourtOverview />
            </div>
          </Container>
        </Reveal>
      </Section>

      <Section className="py-16">
        <Reveal>
          <Container className="grid items-center gap-10 lg:grid-cols-[2fr_3fr]">
            <SectionHeading
              eyebrow={t("spec.eyebrow")}
              title={t("spec.heading")}
              lead={t("spec.lead")}
            />
            <CourtSpecDrawing />
          </Container>
        </Reveal>
      </Section>

      <SectionDivider />

      <Section className="py-8">
        <Reveal>
          <Container>
            <PricingTable />
          </Container>
        </Reveal>
      </Section>

      <Section className="pt-0 pb-14">
        <Reveal>
          <Container>
            <Note link={{ href: "/agb", label: t("cancellationLink") }}>
              <p>{t("cancellationNote")}</p>
            </Note>
          </Container>
        </Reveal>
      </Section>
    </HydrationBoundary>
  );
}
