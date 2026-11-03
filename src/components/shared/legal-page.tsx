import { getTranslations } from "next-intl/server";
import { locale as getRootLocale } from "next/root-params";
import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";

import { Note } from "./note";
import { SectionHeading } from "./section-heading";

// Legal text (Impressum/AGB/Hausordnung/Datenschutz/Widerruf) is sample German copy for
// the fictional club and is German-authoritative — see CLAUDE.md's i18n section. The English
// route shows the same German text with a disclaimer rather than a casual translation.
export async function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const t = await getTranslations("Legal");
  const locale = await getRootLocale();

  return (
    <Section className="pt-10 pb-16 sm:pt-20">
      <Container>
        <div className="max-w-prose">
          <SectionHeading as="h1" size="page" eyebrow={t("eyebrow")} title={title} trail />

          <Note className="mt-8">
            {locale === "en" && <p className="mb-2">{t("englishDisclaimer")}</p>}
            <p className="text-muted-foreground italic">{t("draftNotice")}</p>
          </Note>

          {/* The body stays German on /en too, so screen readers and hyphenation need
              to know it's German. */}
          <div lang={locale === "en" ? "de" : undefined} className="mt-10 text-pretty hyphens-auto">
            {children}
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function LegalHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display mt-10 scroll-mt-20 text-xl font-bold tracking-tight [font-stretch:112%] first:mt-0">
      {children}
    </h2>
  );
}

export function LegalParagraph({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground mt-2 leading-relaxed">{children}</p>;
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">{children}</ul>;
}
