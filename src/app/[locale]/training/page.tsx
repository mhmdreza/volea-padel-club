import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { CtaBand } from "@/components/shared/cta-band";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { TrainingContent } from "@/features/training/training-content";
import { getTrainingServer, trainingQueryKey } from "@/features/training/use-training";
import { Link } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Training" });
  return buildMetadata({
    locale,
    path: "/training",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function TrainingPage() {
  const t = await getTranslations("Training");

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({ queryKey: trainingQueryKey, queryFn: getTrainingServer });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageHero
        morphName="training"
        motif="lights"
        eyebrow={t("eyebrow")}
        title={t("title")}
        lead={t("subtitle")}
        actions={
          <Button asChild size="lg">
            <Link href={{ pathname: "/contact", query: { type: "training" } }}>{t("cta")}</Link>
          </Button>
        }
      />

      <Section className="pt-6 pb-14">
        <Reveal>
          <Container>
            <TrainingContent />
          </Container>
        </Reveal>
      </Section>

      <CtaBand
        heading={t("ctaBand.heading")}
        text={t("ctaBand.text")}
        action={{ href: { pathname: "/contact", query: { type: "training" } }, label: t("cta") }}
      />
    </HydrationBoundary>
  );
}
