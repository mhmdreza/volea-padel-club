import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ArrowRight, MapPin } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { GlassPanel } from "@/components/shared/glass-panel";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/content/site";
import { ContactForm } from "@/features/contact/contact-form";
import { LocationMap } from "@/features/contact/location-map";
import { inquiryTypes, type InquiryType } from "@/features/contact/schema";
import { Link } from "@/i18n/navigation";
import { mapsSearchUrl } from "@/lib/maps";
import { buildMetadata } from "@/lib/metadata";
import { isPlaceholder } from "@/lib/placeholder";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });
  return buildMetadata({
    locale,
    path: "/contact",
    title: t("title"),
    description: t("subtitle"),
  });
}

// Booking requests arrive from /book with a prefilled slot, so they aren't offered here.
const CHOOSABLE_TYPES = ["general", "corporate", "sponsorship", "training"] as const;

// Prefilled from links such as /book's "Request this slot"; capped so a crafted
// URL can't stuff the form.
const MAX_PREFILL_LENGTH = 500;

function isInquiryType(value: unknown): value is InquiryType {
  return typeof value === "string" && (inquiryTypes as readonly string[]).includes(value);
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[]; message?: string | string[] }>;
}) {
  const t = await getTranslations("Contact");
  const { type, message } = await searchParams;
  const defaultInquiryType: InquiryType = isInquiryType(type) ? type : "general";
  const defaultMessage =
    typeof message === "string" ? message.trim().slice(0, MAX_PREFILL_LENGTH) : undefined;

  const { address } = siteConfig;

  return (
    <>
      <PageHero motif="none" eyebrow={t("eyebrow")} title={t("title")} lead={t("subtitle")} />

      <Section className="pt-0">
        <Container className="grid items-start gap-10 lg:grid-cols-[5fr_7fr]">
          <div className="flex flex-col gap-10">
            <GlassPanel className="overflow-hidden p-0">
              <LocationMap className="bg-muted/40 block w-full" />
              <div className="flex flex-col gap-3 p-6">
                <h2 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase">
                  <MapPin aria-hidden="true" className="size-4" />
                  {t("addressHeading")}
                </h2>
                <p className="font-display text-2xl leading-tight font-bold [font-stretch:112%]">
                  {address.street}
                  <br />
                  {address.postalCode} {address.city}
                </p>
                <p className="text-sm">
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="hover:text-primary underline-offset-4 hover:underline"
                  >
                    {siteConfig.email}
                  </a>
                </p>
                {!isPlaceholder(siteConfig.phone) && (
                  <p className="text-sm">
                    <a href={`tel:${siteConfig.phone}`} className="hover:text-primary">
                      {siteConfig.phone}
                    </a>
                  </p>
                )}
                <Button asChild variant="outline" className="mt-2 w-fit">
                  <a href={mapsSearchUrl(address)} target="_blank" rel="noopener noreferrer">
                    {t("mapCta")}
                  </a>
                </Button>
              </div>
            </GlassPanel>

            <nav aria-labelledby="inquiry-types">
              <SectionHeading
                as="h2"
                size="small"
                title={<span id="inquiry-types">{t("chooserHeading")}</span>}
              />
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {CHOOSABLE_TYPES.map((type) => {
                  const active = type === defaultInquiryType;
                  return (
                    <li key={type}>
                      <Link
                        href={{ pathname: "/contact", query: { type } }}
                        scroll={false}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "border-border bg-card/40 hover:border-primary/60 focus-visible:ring-ring focus-visible:ring-offset-background flex min-h-11 items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                          active &&
                            "border-primary bg-primary text-primary-foreground hover:border-primary",
                        )}
                      >
                        {t(`type.${type}`)}
                        <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          <GlassPanel className="p-6 sm:p-8">
            {/* The form reads its type once on mount; a new key remounts it when the chooser changes it. */}
            <ContactForm
              key={defaultInquiryType}
              defaultInquiryType={defaultInquiryType}
              defaultMessage={defaultMessage}
            />
          </GlassPanel>
        </Container>
      </Section>
    </>
  );
}
