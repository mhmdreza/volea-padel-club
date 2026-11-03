import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { LegalHeading, LegalList, LegalPage, LegalParagraph } from "@/components/shared/legal-page";
import { buildLegalMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLegalMetadata({ locale, path: "/datenschutz", footerKey: "datenschutz" });
}

export default async function DatenschutzPage() {
  const t = await getTranslations("Footer");

  return (
    <LegalPage title={t("datenschutz")}>
      <LegalParagraph>
        Die folgende Übersicht beschreibt die geplante Struktur der Datenschutzerklärung. Sie ist
        noch keine finale Fassung — die vollständige, rechtlich geprüfte Datenschutzerklärung wird
        vor Go-live ergänzt und hängt insbesondere davon ab, welche der unten genannten externen
        Dienste tatsächlich eingesetzt werden.
      </LegalParagraph>

      <LegalHeading>Verantwortlicher</LegalHeading>
      <LegalParagraph>
        Volea Sport GmbH
        <br />
        Musterstraße 12, 12345 Lindenau
        <br />
        hello@volea-padel.example
      </LegalParagraph>

      <LegalHeading>Verarbeitete Daten</LegalHeading>
      <LegalParagraph>
        Je nach Nutzung der Website können insbesondere verarbeitet werden:
      </LegalParagraph>
      <LegalList>
        <li>Name</li>
        <li>Kontaktdaten</li>
        <li>E-Mail-Adresse</li>
        <li>Buchungsinformationen</li>
        <li>Zahlungsinformationen</li>
        <li>IP-Adresse</li>
        <li>Geräte-/Browserinformationen</li>
        <li>Nutzungsdaten</li>
        <li>Daten aus Kontaktformularen</li>
      </LegalList>

      <LegalHeading>Zwecke</LegalHeading>
      <LegalList>
        <li>Betrieb der Website</li>
        <li>Bearbeitung von Kontaktanfragen</li>
        <li>Courtbuchungen</li>
        <li>Durchführung von Verträgen</li>
        <li>Kundenkommunikation</li>
        <li>Sicherheit der Website</li>
        <li>ggf. Newsletter</li>
        <li>ggf. Marketing und Reichweitenmessung</li>
      </LegalList>

      <LegalHeading>Externe Dienste</LegalHeading>
      <LegalParagraph>
        Es dürfen nur tatsächlich eingesetzte Dienste aufgeführt werden. [[TBD: finale Auswahl
        bestätigen]]
      </LegalParagraph>
      <LegalList>
        <li>Playtomic</li>
        <li>Hostinganbieter [[TBD]]</li>
        <li>IONOS für E-Mail</li>
        <li>Google Maps [[TBD: ja/nein]]</li>
        <li>Google Analytics bzw. anderes Tracking [[TBD]]</li>
        <li>Google Search Console</li>
        <li>Meta / Instagram [[TBD: Meta Pixel ja/nein]]</li>
        <li>Cookie-Consent-Tool [[TBD]]</li>
        <li>Newsletteranbieter [[TBD: ja/nein]]</li>
        <li>ggf. Zahlungsdienstleister [[TBD]]</li>
        <li>ggf. WhatsApp</li>
      </LegalList>

      <LegalHeading>Cookies und Consent</LegalHeading>
      <LegalParagraph>
        Auf der Website ist ein DSGVO-konformes Consent-Management vorgesehen, das zwischen
        technisch notwendigen Cookies, Statistik-/Analyse-Cookies, Marketing-Cookies und sonstigen
        optionalen Technologien unterscheidet. Nicht zwingend erforderliche Dienste werden erst nach
        entsprechender Einwilligung geladen, sofern dies rechtlich erforderlich ist.
      </LegalParagraph>

      <LegalHeading>Videoüberwachung</LegalHeading>
      <LegalParagraph>
        Sofern Bereiche der Anlage videoüberwacht werden, erfolgt dies ausschließlich im Rahmen der
        geltenden datenschutzrechtlichen Vorschriften. Eine Videoüberwachung von Sanitär- oder
        Umkleidebereichen findet nicht statt. [[TBD: Zweck, Speicherdauer, Rechtsgrundlage und
        Betroffenenrechte im Detail]]
      </LegalParagraph>
    </LegalPage>
  );
}
