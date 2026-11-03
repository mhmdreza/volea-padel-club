import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Note } from "@/components/shared/note";
import { PageHero } from "@/components/shared/page-hero";
import { Parallax } from "@/components/shared/parallax";
import { Reveal } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Lounge" });
  return buildMetadata({
    locale,
    path: "/lounge",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function LoungePage() {
  const t = await getTranslations("Lounge");

  return (
    <>
      <PageHero
        morphName="lounge"
        motif="lights"
        eyebrow={t("eyebrow")}
        title={t("title")}
        lead={t("subtitle")}
      />

      {/* The tagline as three huge lines drifting at different speeds, under a warm
          lamp glow — the lounge after the lights of the hall. */}
      <Section className="relative isolate overflow-hidden py-16 sm:py-24">
        <div
          aria-hidden="true"
          className="bg-scene-light/15 pointer-events-none absolute top-1/2 left-1/3 -z-10 size-[min(32rem,80vw)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        />
        <div
          aria-hidden="true"
          className="bg-primary/10 pointer-events-none absolute top-2/3 left-1/2 -z-10 size-[min(24rem,60vw)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        />
        <Container>
          <h2 className="sr-only">{t("heading")}</h2>
          <div
            aria-hidden="true"
            className="font-display flex flex-col text-[clamp(3rem,13vw,9.5rem)] leading-[0.9] font-extrabold tracking-tight [font-stretch:125%]"
          >
            {(["play", "connect", "repeat"] as const).map((word, i) => (
              <Parallax
                key={word}
                speed={[0.15, -0.05, -0.25][i]}
                className={cn(i === 1 && "sm:ml-[12%]", i === 2 && "sm:ml-[24%]")}
              >
                <span
                  className={cn(
                    i === 2 &&
                      "decoration-primary dark:text-primary underline decoration-[0.08em] underline-offset-[0.12em] [text-decoration-skip-ink:none] dark:no-underline",
                  )}
                >
                  {t(`words.${word}`)}
                </span>
              </Parallax>
            ))}
          </div>
          <p className="text-muted-foreground mt-12 max-w-xl text-lg text-pretty sm:ml-[24%]">
            {t("text")}
          </p>
        </Container>
      </Section>

      <Section className="pt-0 pb-14">
        <Reveal>
          <Container>
            <Note link={{ href: "/hausordnung", label: t("ruleLink") }}>
              <p>{t("ruleNote")}</p>
            </Note>
          </Container>
        </Reveal>
      </Section>
    </>
  );
}
