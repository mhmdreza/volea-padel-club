import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { locale as getRootLocale } from "next/root-params";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { GlassPanel } from "@/components/shared/glass-panel";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { faqItems } from "@/content/faq";
import { FaqAccordion } from "@/features/faq/faq-accordion";
import { faqQueryKey, getFaqServer } from "@/features/faq/use-faq";
import { localize } from "@/lib/i18n-content";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Faq" });
  return buildMetadata({ locale, path: "/faq", title: t("title"), description: t("subtitle") });
}

export default async function FaqPage() {
  const t = await getTranslations("Faq");
  const locale = (await getRootLocale()) ?? "en";

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({ queryKey: faqQueryKey, queryFn: getFaqServer });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: localize(item.question, locale),
      acceptedAnswer: {
        "@type": "Answer",
        text: localize(item.answer, locale),
      },
    })),
  };

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <JsonLd data={jsonLd} />
      <PageHero motif="dots" eyebrow={t("eyebrow")} title={t("title")} lead={t("subtitle")} />

      <Section className="pt-6 pb-14">
        <Reveal>
          <Container>
            <FaqAccordion
              aside={
                <GlassPanel href="/contact" className="flex flex-col gap-2">
                  <h2 className="font-display text-xl font-bold tracking-tight [font-stretch:112%]">
                    {t("ask.heading")}
                  </h2>
                  <p className="text-muted-foreground text-sm">{t("ask.text")}</p>
                  <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold">
                    {t("ask.cta")}
                    <ArrowRight
                      aria-hidden="true"
                      className="dark:text-primary size-4 transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </GlassPanel>
              }
            />
          </Container>
        </Reveal>
      </Section>
    </HydrationBoundary>
  );
}
