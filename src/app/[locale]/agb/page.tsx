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
  return buildLegalMetadata({ locale, path: "/agb", footerKey: "agb" });
}

export default async function AgbPage() {
  const t = await getTranslations("Footer");

  return (
    <LegalPage title={t("agb")}>
      <LegalHeading>§ 1 Geltungsbereich und Vertragspartner</LegalHeading>
      <LegalParagraph>
        Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der von der Volea Sport GmbH
        betriebenen Padelanlage „Volea Padel“ sowie für Courtbuchungen, Veranstaltungen, Turniere
        und sonstige Leistungen der Volea Sport GmbH.
      </LegalParagraph>
      <LegalParagraph>
        Vertragspartner des Kunden ist: Volea Sport GmbH, Musterstraße 12, 12345
        Lindenau, nachfolgend „Volea Padel“, „Betreiber“ oder „wir“ genannt.
      </LegalParagraph>
      <LegalParagraph>
        Mit der Buchung eines Courts oder der Nutzung der Anlage erkennt der Kunde diese Bedingungen
        an. Abweichende Bedingungen des Kunden gelten nur, wenn diese ausdrücklich durch den
        Betreiber bestätigt wurden.
      </LegalParagraph>

      <LegalHeading>§ 2 Angebot und Nutzung der Anlage</LegalHeading>
      <LegalParagraph>Volea Padel betreibt eine Padelanlage mit:</LegalParagraph>
      <LegalList>
        <li>drei Doppel-Courts</li>
        <li>zwei Einzel-Courts</li>
        <li>Aufenthalts- und Lounge-Bereichen</li>
        <li>Sanitär-/Umkleidebereichen</li>
        <li>weiteren gemeinschaftlich genutzten Bereichen</li>
      </LegalList>
      <LegalParagraph>
        Die Nutzung der Anlage ist ausschließlich im Rahmen der jeweils gebuchten bzw. freigegebenen
        Zeiten und unter Beachtung der Hausordnung zulässig.
      </LegalParagraph>

      <LegalHeading>§ 3 Courtbuchungen</LegalHeading>
      <LegalParagraph>
        Die Buchung der Padel-Courts erfolgt über das von Volea Padel eingesetzte Buchungssystem,
        insbesondere Playtomic. Für die Nutzung des Buchungssystems können die zusätzlichen
        Bedingungen des jeweiligen Plattformbetreibers gelten.
      </LegalParagraph>
      <LegalParagraph>
        Mit Abschluss einer verbindlichen Buchung kommt ein Vertrag über die Nutzung des gebuchten
        Courts für den angegebenen Zeitraum zustande. Die jeweils gültigen Preise werden im
        Buchungssystem bzw. auf der Website angezeigt.
      </LegalParagraph>

      <LegalHeading>§ 4 Buchungszeit und verspätetes Erscheinen</LegalHeading>
      <LegalParagraph>
        Die gebuchte Zeit umfasst die vollständige Nutzung des Courts innerhalb des gebuchten
        Zeitfensters. Die Spieler sind verpflichtet, den Court rechtzeitig zu betreten und nach
        Ablauf der gebuchten Zeit unverzüglich zu verlassen.
      </LegalParagraph>
      <LegalParagraph>
        Bei verspätetem Erscheinen besteht grundsätzlich kein Anspruch auf Verlängerung der
        gebuchten Spielzeit. Eine eigenständige Verlängerung oder Nutzung über das gebuchte
        Zeitfenster hinaus ist nicht gestattet, sofern der Court nicht erneut bzw. ausdrücklich
        freigegeben wurde.
      </LegalParagraph>

      <LegalHeading>§ 5 Stornierung und Nicht-Erscheinen</LegalHeading>
      <LegalParagraph>
        Die für eine Buchung geltenden Stornierungsbedingungen werden im Buchungssystem angezeigt.
        Eine kostenfreie Stornierung ist innerhalb der dort angegebenen Frist möglich.
      </LegalParagraph>
      <LegalParagraph>
        Bei einer verspäteten Stornierung oder einem Nichterscheinen („No-Show“) kann die
        vereinbarte Courtgebühr entsprechend den zum Zeitpunkt der Buchung geltenden Bedingungen
        berechnet werden. Für die konkrete Abwicklung über Playtomic gelten ergänzend die dort
        hinterlegten Bedingungen.
      </LegalParagraph>

      <LegalHeading>§ 6 Hausordnung und Verhalten</LegalHeading>
      <LegalParagraph>
        Die Hausordnung gilt für sämtliche Bereiche der Anlage. Alle Nutzer sind verpflichtet,
      </LegalParagraph>
      <LegalList>
        <li>auf andere Spieler und Besucher Rücksicht zu nehmen,</li>
        <li>die Anlage und deren Einrichtungen pfleglich zu behandeln,</li>
        <li>Anweisungen des Personals zu befolgen,</li>
        <li>Gefährdungen anderer Personen zu vermeiden,</li>
        <li>Abfälle ordnungsgemäß zu entsorgen,</li>
        <li>Schäden unverzüglich dem Betreiber zu melden.</li>
      </LegalList>
      <LegalParagraph>
        Aggressives, gefährliches, beleidigendes oder anderweitig störendes Verhalten ist untersagt.
        Der Betreiber kann Personen bei erheblichen oder wiederholten Verstößen von der Nutzung der
        Anlage ausschließen und gegebenenfalls ein Hausverbot aussprechen.
      </LegalParagraph>

      <LegalHeading>§ 7 Nutzung der Padel-Courts</LegalHeading>
      <LegalParagraph>
        Die Courts dürfen ausschließlich mit geeigneter Sportbekleidung und sauberen, für den
        jeweiligen Court geeigneten Sportschuhen betreten werden. Straßenschuhe oder ungeeignetes
        Schuhwerk sind nicht zulässig.
      </LegalParagraph>
      <LegalParagraph>
        Die Courtanlagen, insbesondere Glasflächen, Bodenflächen und Bandelemente, dürfen nicht
        mutwillig oder unsachgemäß beschädigt werden. Das Schlagen gegen Glasflächen oder andere
        Teile des Courts außerhalb der bestimmungsgemäßen Nutzung ist untersagt.
      </LegalParagraph>

      <LegalHeading>§ 8 Schäden an der Anlage</LegalHeading>
      <LegalParagraph>
        Festgestellte Schäden oder technische Störungen sind unverzüglich dem Betreiber mitzuteilen.
        Wer einen Schaden vorsätzlich oder fahrlässig verursacht, kann hierfür nach den gesetzlichen
        Vorschriften haftbar gemacht werden. Dies gilt insbesondere für Schäden an:
      </LegalParagraph>
      <LegalList>
        <li>Courtanlagen</li>
        <li>Glasflächen</li>
        <li>Netzen</li>
        <li>Bodenbelägen</li>
        <li>Bandelementen</li>
        <li>Beleuchtung</li>
        <li>Mobiliar</li>
        <li>sonstigen Einrichtungen der Anlage</li>
      </LegalList>
      <LegalParagraph>
        Beschädigte Einrichtungen dürfen nicht weiter benutzt werden, sofern dadurch eine Gefährdung
        entstehen kann.
      </LegalParagraph>

      <LegalHeading>§ 9 Persönliche Gegenstände</LegalHeading>
      <LegalParagraph>
        Persönliche Gegenstände sind grundsätzlich eigenverantwortlich aufzubewahren. Eine Haftung
        des Betreibers für Verlust, Diebstahl oder Beschädigung persönlicher Gegenstände besteht nur
        im Rahmen der gesetzlichen Vorschriften. Dies gilt insbesondere für Kleidung, Taschen,
        Wertsachen, Mobiltelefone und Sportausrüstung.
      </LegalParagraph>

      <LegalHeading>§ 10 Minderjährige</LegalHeading>
      <LegalParagraph>
        Minderjährige dürfen die Anlage im Rahmen der gesetzlichen Bestimmungen und der jeweils
        geltenden Nutzungsbedingungen nutzen. Für bestimmte Angebote, Veranstaltungen oder
        Nutzungszeiten kann eine Zustimmung der Erziehungsberechtigten erforderlich sein. Der
        Betreiber kann für einzelne Angebote Altersbeschränkungen festlegen.
      </LegalParagraph>

      <LegalHeading>§ 11 Getränke und Speisen</LegalHeading>
      <LegalParagraph>
        Getränke und Speisen dürfen ausschließlich in den hierfür vorgesehenen Bereichen konsumiert
        werden. Auf den Courts sind insbesondere Glasbehälter nicht gestattet. Den Anweisungen des
        Personals hinsichtlich der Mitnahme und des Konsums von Speisen und Getränken ist Folge zu
        leisten.
      </LegalParagraph>

      <LegalHeading>§ 12 Veranstaltungen und Turniere</LegalHeading>
      <LegalParagraph>
        Für Turniere, Events, Firmenveranstaltungen und sonstige Sonderveranstaltungen können
        zusätzliche Teilnahmebedingungen gelten. Diese werden den Teilnehmern vor bzw. bei der
        Anmeldung mitgeteilt. Bei Veranstaltungen können abweichende Regelungen hinsichtlich Beginn,
        Ende, Teilnahmegebühren, Stornierung und Teilnahmevoraussetzungen gelten.
      </LegalParagraph>

      <LegalHeading>§ 13 Haftung</LegalHeading>
      <LegalParagraph>
        Der Betreiber haftet nach den gesetzlichen Vorschriften. Für Schäden aufgrund von Vorsatz
        oder grober Fahrlässigkeit sowie für Schäden aus der Verletzung von Leben, Körper oder
        Gesundheit gelten die gesetzlichen Haftungsbestimmungen.
      </LegalParagraph>
      <LegalParagraph>
        Bei leicht fahrlässigen Pflichtverletzungen haftet der Betreiber – soweit gesetzlich
        zulässig – nur bei Verletzung wesentlicher Vertragspflichten und beschränkt auf den
        vorhersehbaren, typischerweise eintretenden Schaden. Die gesetzlichen Vorschriften über die
        Haftung bleiben unberührt.
      </LegalParagraph>

      <LegalHeading>§ 14 Videoüberwachung</LegalHeading>
      <LegalParagraph>
        Sofern Bereiche der Anlage videoüberwacht werden, erfolgt die Videoüberwachung
        ausschließlich im Rahmen der geltenden datenschutzrechtlichen Vorschriften. Eine
        Videoüberwachung von Sanitär- oder Umkleidebereichen findet nicht statt.
      </LegalParagraph>
      <LegalParagraph>
        Zweck und Umfang der Videoüberwachung sowie Informationen über Speicherdauer,
        Rechtsgrundlage und Betroffenenrechte werden in der Datenschutzerklärung und den
        entsprechenden Hinweisen vor Ort erläutert. [[TBD: Angaben zur Videoüberwachung]]
      </LegalParagraph>

      <LegalHeading>§ 15 Datenschutz</LegalHeading>
      <LegalParagraph>
        Informationen über die Verarbeitung personenbezogener Daten finden sich in der
        Datenschutzerklärung von Volea Padel. Bei Nutzung externer Dienste, insbesondere des
        Buchungssystems Playtomic, können zusätzlich die Datenschutzbestimmungen des jeweiligen
        Anbieters gelten.
      </LegalParagraph>

      <LegalHeading>§ 16 Schlussbestimmungen</LegalHeading>
      <LegalParagraph>
        Es gilt das Recht der Bundesrepublik Deutschland unter Beachtung der zwingenden
        Verbraucherschutzvorschriften. Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder
        werden, bleiben die übrigen Bestimmungen hiervon unberührt.
      </LegalParagraph>
    </LegalPage>
  );
}
