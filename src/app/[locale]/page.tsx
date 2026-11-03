import { ArrowRight, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { JsonLd } from "@/components/shared/json-ld";
import { Parallax } from "@/components/shared/parallax";
import { Reveal } from "@/components/shared/reveal";
import { StackCard, StackedSections } from "@/components/shared/stacked-sections";
import { Button } from "@/components/ui/button";
import { siteConfig, socialLinks } from "@/content/site";
import { HeroStory } from "@/features/home/hero-story";
import { PageTimeline } from "@/features/home/page-timeline";
import { ExploreGrid, type ExploreItem } from "@/features/home/explore-grid";
import { HallFootage } from "@/features/home/hall-footage";
import { RacketSection } from "@/features/racket/racket-section";
import { RallySection } from "@/features/rally/rally-section";
import { Link } from "@/i18n/navigation";
import { mapsSearchUrl } from "@/lib/maps";
import { buildMetadata, SITE_NAME, SITE_URL } from "@/lib/metadata";
import { cn } from "@/lib/utils";

const isPlaceholderUrl = (url: string) => url.startsWith("[[");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });
  // The root layout's title.template can't reach the page in its own route segment
  // (see Next's docs on title.template) — the site name is appended explicitly here.
  return buildMetadata({
    locale,
    path: "/",
    title: `${t("title")} | ${SITE_NAME}`,
    description: t("subtitle"),
  });
}

const eyebrow = "text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase";
const displayHeading = "font-display font-bold tracking-tight text-balance [font-stretch:112%]";

export default function HomePage() {
  const t = useTranslations("Home");
  const nav = useTranslations("Nav");

  const teasers: ExploreItem[] = (
    ["courts", "training", "events", "lounge", "sponsoring", "vouchers"] as const
  ).map((key) => ({
    key,
    href: `/${key}` as const,
    title: t(`teasers.${key}Title`),
    text: t(`teasers.${key}Text`),
  }));

  const facts = (["courts", "opening", "lounge", "location"] as const).map((key) => ({
    key,
    value: t(`facts.${key}.value`),
    label: t(`facts.${key}.label`),
    text: t(`facts.${key}.text`),
  }));

  const mapsUrl = mapsSearchUrl(siteConfig.address);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: siteConfig.name,
    description: t("subtitle"),
    url: SITE_URL,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.street,
      postalCode: siteConfig.address.postalCode,
      addressLocality: siteConfig.address.city,
      addressCountry: "DE",
    },
    email: siteConfig.email,
    ...(isPlaceholderUrl(siteConfig.phone) ? {} : { telephone: siteConfig.phone }),
    sameAs: socialLinks.filter((s) => !isPlaceholderUrl(s.url)).map((s) => s.url),
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* The hero story follows the theme: night session in dark mode, day session in
          light mode. Orange text only in dark mode — on bone it's below contrast. */}
      <div className="bg-background text-foreground">
        <HeroStory
          eyebrow={t("story.eyebrow")}
          navLabel={t("story.navLabel")}
          scrollHint={t("scrollHint")}
          playLabel={t("playStory")}
          nextLabels={(["lights", "glass", "rebound"] as const).map((id) =>
            t("story.next", { chapter: t(`story.frames.${id}.label`) }),
          )}
          continueLabel={t("story.continue")}
          chapters={(["hall", "lights", "glass", "rebound"] as const).map((id) => ({
            id,
            short: t(`story.frames.${id}.short`),
            label: t(`story.frames.${id}.label`),
            text: t(`story.frames.${id}.text`),
          }))}
          intro={
            <>
              <span className="border-primary/60 text-foreground dark:text-primary w-fit rounded-sm border px-3 py-1.5 text-xs font-semibold tracking-[0.16em] uppercase">
                {t("openingBadge")}
              </span>
              <h1 className="font-display text-5xl leading-[0.92] font-extrabold tracking-tight [font-stretch:115%] sm:text-7xl lg:text-8xl">
                {t.rich("titleRich", {
                  accent: (chunks) => (
                    <span className="decoration-primary dark:text-primary block underline decoration-[0.12em] underline-offset-[0.12em] [text-decoration-skip-ink:none] dark:no-underline">
                      {chunks}
                    </span>
                  ),
                })}
              </h1>
              <p className="text-muted-foreground max-w-xl text-lg text-pretty">{t("subtitle")}</p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 px-6">
                  <Link href="/book">{nav("bookCourt")}</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-6">
                  <Link href="/about">
                    {t("ctaSecondary")}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </>
          }
        />
      </div>

      <RacketSection />

      <RallySection />

      {/* From here the parts stack like cards, each sliding up over the last. */}
      <StackedSections>
        {/* Key facts as big numbers, separated like columns on a drawing sheet; the
          columns drift at staggered speeds. */}
        <StackCard id="facts" tone="slab">
          <Section className="relative isolate overflow-hidden py-20 sm:py-24">
            <Container>
              <Reveal>
                <ul className="border-border grid border-y sm:grid-cols-2 lg:grid-cols-4">
                  {facts.map((fact, i) => (
                    <li
                      key={fact.key}
                      className={cn(
                        "border-border py-9 sm:px-6",
                        i > 0 && "border-t sm:border-t-0",
                        i % 2 === 1 && "sm:border-l",
                        i === 2 && "lg:border-l",
                      )}
                    >
                      <Parallax speed={0.08 + i * 0.1} innerClassName="flex flex-col gap-2">
                        <p
                          className={cn(
                            "font-display text-6xl leading-none font-extrabold [font-stretch:115%]",
                            fact.key === "opening" && "dark:text-primary",
                            fact.value.length > 5 && "text-4xl sm:text-5xl",
                          )}
                        >
                          {fact.value}
                        </p>
                        <p className="font-semibold">{fact.label}</p>
                        <p className="text-muted-foreground text-sm">{fact.text}</p>
                      </Parallax>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </Container>
          </Section>
        </StackCard>

        {/* The planned hall as a drawing sheet with "planned" callouts. */}
        <StackCard id="hall" tone="sheet">
          <Section className="relative isolate overflow-hidden py-20 sm:py-24">
            <Container>
              <Reveal className="max-w-2xl">
                <p className={eyebrow}>{t("renovation.eyebrow")}</p>
                <h2 className={cn(displayHeading, "mt-3 text-3xl leading-[1.05] sm:text-5xl")}>
                  {t("renovation.heading")}
                </h2>
                <p className="text-muted-foreground mt-4 max-w-md leading-relaxed">
                  {t("renovation.text")}
                </p>
              </Reveal>
              <div className="mt-10">
                <HallFootage />
              </div>
            </Container>
          </Section>
        </StackCard>

        <StackCard id="explore" tone="base">
          {/* overflow-clip, not hidden: a hidden section is a scroll container, which would
              trap the heading's view() timeline. */}
          <Section className="relative isolate overflow-clip py-20 sm:py-24">
            <Container>
              <Reveal>
                <h2 className={cn(displayHeading, "heading-stretch text-3xl sm:text-5xl")}>
                  {t("teasers.heading")}
                </h2>
              </Reveal>
              <ExploreGrid items={teasers} />
              <p className="text-muted-foreground mt-10 text-center text-sm">
                {t("partners.text")}
              </p>
            </Container>
          </Section>
        </StackCard>

        {/* B2B band — the one full-bleed orange moment on the page. A giant outlined
          word slides sideways behind it as the page scrolls. */}
        <StackCard id="partners" tone="primary">
          <section className="relative isolate overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 flex items-center max-sm:items-end"
            >
              <Parallax axis="x" speed={-1.6} innerClassName="whitespace-nowrap">
                <span className="font-display text-[10rem] leading-none font-extrabold text-transparent [font-stretch:125%] opacity-25 [-webkit-text-stroke:2px_var(--primary-foreground)] max-sm:translate-y-1/2 max-sm:text-[6rem] max-sm:opacity-15">
                  PADEL · PADEL · PADEL · PADEL · PADEL ·
                </span>
              </Parallax>
            </div>
            <Container className="flex flex-wrap items-center justify-between gap-8 py-20">
              <div>
                <h2 className="font-display text-4xl leading-none font-extrabold tracking-tight [font-stretch:118%] sm:text-6xl">
                  {t("b2b.heading")}
                </h2>
                <p className="mt-4 max-w-xl text-lg">{t("b2b.text")}</p>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/85 h-12 px-6"
              >
                <Link href={{ pathname: "/contact", query: { type: "corporate" } }}>
                  {t("b2b.cta")}
                </Link>
              </Button>
            </Container>
          </section>
        </StackCard>
      </StackedSections>

      <Section className="py-14">
        <Container className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className={cn(displayHeading, "text-2xl")}>{t("location.heading")}</h2>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <MapPin className="size-4" aria-hidden="true" />
              {t("location.text")}
            </p>
          </div>
          <Button asChild variant="outline">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              {t("location.cta")}
            </a>
          </Button>
        </Container>
      </Section>

      <PageTimeline
        label={t("parts.navLabel")}
        endId="partners"
        items={[
          { id: "story", label: t("parts.story") },
          { id: "racket", label: t("parts.racket") },
          { id: "rally", label: t("parts.rally") },
          { id: "facts", label: t("parts.facts") },
          { id: "hall", label: t("parts.hall") },
          { id: "explore", label: t("parts.explore") },
        ]}
      />
    </>
  );
}
