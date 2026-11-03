import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { LegalHeading, LegalPage, LegalParagraph } from "@/components/shared/legal-page";
import { Link } from "@/i18n/navigation";
import { buildLegalMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLegalMetadata({ locale, path: "/widerruf", footerKey: "widerruf" });
}

export default async function WiderrufPage() {
  const t = await getTranslations("Footer");

  return (
    <LegalPage title={t("widerruf")}>
      <LegalParagraph>
        Für Courtbuchungen ist zu berücksichtigen, dass es sich um eine terminierte
        Freizeitdienstleistung handeln kann. [[TBD: rechtliche Prüfung, ob und in welchem Umfang das
        gesetzliche Widerrufsrecht ausgeschlossen ist]]
      </LegalParagraph>

      <LegalHeading>Stornierung von Courtbuchungen</LegalHeading>
      <LegalParagraph>
        Die Stornierung einer Buchung ist bis zu 24 Stunden vor der getätigten Reservierung
        kostenfrei möglich. Für die konkrete Abwicklung über Playtomic gelten ergänzend die dort
        hinterlegten Bedingungen — siehe auch unsere{" "}
        <Link
          href="/agb"
          className="text-foreground hover:text-primary underline underline-offset-2"
        >
          AGB
        </Link>
        .
      </LegalParagraph>
    </LegalPage>
  );
}
