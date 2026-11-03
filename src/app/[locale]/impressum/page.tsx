import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { LegalHeading, LegalPage, LegalParagraph } from "@/components/shared/legal-page";
import { buildLegalMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLegalMetadata({ locale, path: "/impressum", footerKey: "impressum" });
}

export default async function ImpressumPage() {
  const t = await getTranslations("Footer");

  return (
    <LegalPage title={t("impressum")}>
      <LegalHeading>Angaben gemäß § 5 DDG</LegalHeading>
      <LegalParagraph>
        Volea Sport GmbH
        <br />
        Musterstraße 12
        <br />
        12345 Lindenau
        <br />
        Deutschland
      </LegalParagraph>

      <LegalHeading>Vertreten durch</LegalHeading>
      <LegalParagraph>Geschäftsführer: Max Mustermann</LegalParagraph>

      <LegalHeading>Kontakt</LegalHeading>
      <LegalParagraph>
        E-Mail: hello@volea-padel.example
        <br />
        Telefon: [[TBD: Telefonnummer]]
      </LegalParagraph>

      <LegalHeading>Handelsregister</LegalHeading>
      <LegalParagraph>
        Eintragung im Handelsregister.
        <br />
        Registergericht: [[TBD: zuständiges Amtsgericht]]
        <br />
        Registernummer: [[TBD: HRB]]
      </LegalParagraph>

      <LegalHeading>Umsatzsteuer</LegalHeading>
      <LegalParagraph>
        Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: [[TBD: USt-IdNr.]]
      </LegalParagraph>

      <LegalHeading>Verantwortlich für den Inhalt</LegalHeading>
      <LegalParagraph>
        [[TBD: Angabe einer verantwortlichen natürlichen Person gemäß § 18 Abs. 2 MStV — vor
        Veröffentlichung rechtlich zu prüfen]]
      </LegalParagraph>
    </LegalPage>
  );
}
