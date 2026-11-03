import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SectionDots } from "@/components/shared/section-dots";
import { Booker } from "@/features/booking/booker";
import { BookingSkeleton } from "@/features/booking/booking-skeleton";
import { courtsQueryKey, getCourtsServer } from "@/features/courts/use-courts";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Book" });
  return buildMetadata({
    locale,
    path: "/book",
    title: t("meta.title"),
    description: t("meta.description"),
  });
}

export default async function BookPage() {
  const t = await getTranslations("Book");

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({ queryKey: courtsQueryKey, queryFn: getCourtsServer });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <section className="relative isolate overflow-hidden pt-12 pb-10 sm:pt-16">
        {/* Below lg the heading and demo notice run under the dots, so they only show beside it. */}
        <div className="hidden lg:contents">
          <SectionDots side="right" />
        </div>
        <Container className="flex flex-col items-start gap-4">
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="font-display text-4xl leading-none font-bold tracking-tight text-balance [font-stretch:112%] sm:text-6xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg text-pretty">{t("subtitle")}</p>
          <div className="flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-2">
            <span className="border-primary/60 rounded-sm border px-3 py-1.5 text-xs font-semibold tracking-[0.16em] uppercase">
              {t("demoBadge")}
            </span>
            <p className="text-muted-foreground flex-1 basis-64 text-sm">{t("demoNotice")}</p>
          </div>
        </Container>
      </section>

      {/* Only the picker depends on the URL and the clock, so only it waits for the
          client; everything above is in the static HTML. The skeleton matches its
          layout, so nothing shifts when it swaps in. */}
      <Section className="pt-0 pb-36 lg:pb-24">
        <Container>
          <Suspense fallback={<BookingSkeleton />}>
            <Booker />
          </Suspense>
        </Container>
      </Section>
    </HydrationBoundary>
  );
}
