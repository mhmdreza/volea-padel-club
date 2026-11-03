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
  return buildLegalMetadata({ locale, path: "/hausordnung", footerKey: "hausordnung" });
}

export default async function HausordnungPage() {
  const t = await getTranslations("Footer");

  return (
    <LegalPage title={t("hausordnung")}>
      <LegalHeading>1. Allgemeines</LegalHeading>
      <LegalParagraph>
        Mit dem Betreten der Anlage verpflichtet sich jeder Nutzer zur Einhaltung dieser
        Hausordnung. Die Hausordnung dient dem sicheren, fairen und angenehmen Betrieb der Anlage.
      </LegalParagraph>

      <LegalHeading>2. Courts</LegalHeading>
      <LegalParagraph>
        Courts dürfen nur innerhalb der gebuchten bzw. zugewiesenen Zeit genutzt werden. Nach Ablauf
        der Spielzeit ist der Court unverzüglich zu verlassen.
      </LegalParagraph>

      <LegalHeading>3. Schuhe</LegalHeading>
      <LegalParagraph>
        Die Courts dürfen nur mit geeigneten, sauberen Sportschuhen betreten werden.
      </LegalParagraph>

      <LegalHeading>4. Verhalten</LegalHeading>
      <LegalParagraph>
        Aufeinander ist Rücksicht zu nehmen. Gefährliches, aggressives oder grob störendes Verhalten
        ist untersagt. Den Anweisungen des Personals ist Folge zu leisten.
      </LegalParagraph>

      <LegalHeading>5. Schäden</LegalHeading>
      <LegalParagraph>
        Schäden an Courts oder sonstigen Einrichtungen sind unverzüglich zu melden. Mutwillige oder
        grob fahrlässige Beschädigungen können dem Verursacher in Rechnung gestellt werden.
      </LegalParagraph>

      <LegalHeading>6. Sauberkeit</LegalHeading>
      <LegalParagraph>
        Die gesamte Anlage ist sauber und ordentlich zu hinterlassen. Abfälle sind in den
        vorgesehenen Behältern zu entsorgen.
      </LegalParagraph>

      <LegalHeading>7. Hausrecht</LegalHeading>
      <LegalParagraph>
        Volea Padel übt das Hausrecht aus. Bei Verstößen gegen die Hausordnung, Gefährdung anderer
        Personen oder Beschädigung der Anlage kann ein Hausverbot ausgesprochen werden.
      </LegalParagraph>
    </LegalPage>
  );
}
