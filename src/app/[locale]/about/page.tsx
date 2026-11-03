import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Note } from "@/components/shared/note";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { HallFootage } from "@/features/home/hall-footage";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  return buildMetadata({
    locale,
    path: "/about",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function AboutPage() {
  const t = await getTranslations("About");
  // Same footage and copy as the homepage's renovation part — one story, told once.
  const renovation = await getTranslations("Home.renovation");

  return (
    <>
      <PageHero motif="court" eyebrow={t("eyebrow")} title={t("title")} lead={t("subtitle")} />

      <Section className="pt-6 pb-14">
        <Reveal>
          <Container>
            <div className="max-w-2xl">
              <SectionHeading title={t("storyHeading")} lead={t("storyText")} />
              <Note className="mt-8">
                <p>{t("founderNote")}</p>
              </Note>
            </div>
          </Container>
        </Reveal>
      </Section>

      <Section className="relative isolate overflow-hidden pt-8 pb-24">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={renovation("eyebrow")}
              title={renovation("heading")}
              lead={renovation("text")}
              className="max-w-2xl"
            />
          </Reveal>
          <div className="mt-10">
            <HallFootage />
          </div>
        </Container>
      </Section>
    </>
  );
}
