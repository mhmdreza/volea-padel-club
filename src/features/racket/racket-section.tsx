import { ArrowDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { Container } from "@/components/layout/container";
import { ScrollLink } from "@/components/shared/scroll-link";
import { SectionDots } from "@/components/shared/section-dots";
import { Button } from "@/components/ui/button";

import { RacketStage } from "./racket-stage";

/** "Pick up the racket": the 3D racket, introducing the playable court below it. */
export function RacketSection() {
  const t = useTranslations("Home.racket");

  return (
    <section id="racket" className="relative isolate scroll-mt-16 overflow-hidden py-16 sm:py-24">
      {/* Behind the racket, clear of the text and its button. */}
      <SectionDots side="right" />
      <Container className="grid items-center gap-10 lg:grid-cols-[2fr_3fr]">
        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
            {t("eyebrow")}
          </p>
          <h2 className="font-display text-4xl leading-none font-bold tracking-tight text-balance [font-stretch:112%] sm:text-6xl">
            {t("heading")}
          </h2>
          <p className="text-muted-foreground max-w-md text-lg text-pretty">{t("text")}</p>
          <Button asChild variant="outline" size="lg" className="mt-2 w-fit">
            <ScrollLink href="#rally">
              {t("cta")}
              <ArrowDown aria-hidden="true" />
            </ScrollLink>
          </Button>
        </div>
        <RacketStage />
      </Container>
    </section>
  );
}
