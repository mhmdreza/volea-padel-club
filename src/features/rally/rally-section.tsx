import { useTranslations } from "next-intl";

import { Container } from "@/components/layout/container";

import { RallyCourt } from "./rally-court";

export function RallySection() {
  const t = useTranslations("Home.rally");

  return (
    // Full-bleed band: the court reads as a stage, not a widget inside a card. No
    // `isolate` (or transform) here: a stacking context would trap the game's fixed
    // full-screen fallback (iPhone Safari) under the sticky header.
    <section
      id="rally"
      className="from-background via-muted/50 to-background relative scroll-mt-16 overflow-hidden bg-gradient-to-b py-16 sm:py-20"
    >
      <Container>
        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
            {t("eyebrow")}
          </p>
          <h2 className="font-display text-4xl leading-none font-bold tracking-tight text-balance [font-stretch:112%] sm:text-6xl">
            {t("heading")}
          </h2>
          <p className="text-muted-foreground max-w-2xl text-lg text-pretty">{t("text")}</p>
        </div>
        <div className="mt-8">
          <RallyCourt />
        </div>
        <p className="text-muted-foreground mt-2 text-xs">{t("note")}</p>
      </Container>
    </section>
  );
}
