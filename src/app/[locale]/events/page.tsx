import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { locale as getRootLocale } from "next/root-params";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { CtaBand } from "@/components/shared/cta-band";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { EventsContent } from "@/features/events/events-content";
import { EventsTimeline, type TimelineEntry } from "@/features/events/events-timeline";
import { eventsQueryKey, getEventsServer } from "@/features/events/use-events";
import { localize } from "@/lib/i18n-content";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Events" });
  return buildMetadata({
    locale,
    path: "/events",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function EventsPage() {
  const t = await getTranslations("Events");
  const locale = (await getRootLocale()) ?? "en";

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({ queryKey: eventsQueryKey, queryFn: getEventsServer });
  const events = await getEventsServer();

  const dateFormat = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "Europe/Berlin",
  });
  const timeline: TimelineEntry[] = [
    {
      id: "hall",
      when: t("timeline.hall.when"),
      title: t("timeline.hall.title"),
      text: t("timeline.hall.text"),
      now: true,
    },
    {
      id: "opening",
      when: t("timeline.opening.when"),
      title: t("timeline.opening.title"),
      text: t("timeline.opening.text"),
    },
    {
      id: "calendar",
      when: t("timeline.calendar.when"),
      title: t("timeline.calendar.title"),
      text: t("comingSoon"),
    },
    // Scheduled events slot in here as soon as they have a date.
    ...events
      .filter((event) => event.startsAt)
      .sort((a, b) => a.startsAt!.localeCompare(b.startsAt!))
      .map((event) => ({
        id: event.id,
        when: dateFormat.format(new Date(event.startsAt!)),
        title: localize(event.title, locale),
        text: localize(event.description, locale),
      })),
  ];

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageHero
        morphName="events"
        motif="glass"
        eyebrow={t("eyebrow")}
        title={t("title")}
        lead={t("subtitle")}
      />

      <Section className="py-12">
        <Reveal>
          <Container className="grid gap-10 lg:grid-cols-[2fr_3fr]">
            <SectionHeading eyebrow={t("timeline.eyebrow")} title={t("timeline.heading")} />
            <EventsTimeline entries={timeline} nowLabel={t("timeline.now")} />
          </Container>
        </Reveal>
      </Section>

      <Section className="pt-12 pb-20">
        <Reveal>
          <Container>
            <SectionHeading eyebrow={t("formats.eyebrow")} title={t("formats.heading")} />
            <div className="mt-10">
              <EventsContent />
            </div>
          </Container>
        </Reveal>
      </Section>

      <CtaBand
        tone="primary"
        word="AMERICANO · MEXICANO ·"
        heading={t("corporateHeading")}
        text={t("corporateText")}
        action={{
          href: { pathname: "/contact", query: { type: "corporate" } },
          label: t("corporateCta"),
        }}
      />
    </HydrationBoundary>
  );
}
