"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { HandoffActions } from "./handoff-actions";

export type SummarySelection = {
  courtName?: string;
  /** e.g. "Sat, 10 Oct". */
  dateShort: string;
  start?: string;
  end?: string;
  duration: number;
  /** Set only when court, date and time are all chosen. */
  requestMessage?: string;
};

const PERFORATION = Array.from({ length: 21 }, (_, i) => i);

/**
 * The selection as a ticket: sticky beside the pickers on large screens, inline
 * after them on smaller ones, plus a fixed bottom bar there so the next step is
 * always in reach.
 */
export function BookingSummary({
  selection,
  onChangeCourt,
}: {
  selection: SummarySelection;
  onChangeCourt: () => void;
}) {
  const t = useTranslations("Book.summary");
  const tDuration = useTranslations("Book.duration");
  const { courtName, dateShort, start, end, duration, requestMessage } = selection;
  const timeRange = start && end ? `${start}–${end}` : "––:––";

  return (
    <>
      <aside aria-labelledby="booking-summary-heading" className="lg:sticky lg:top-24">
        <div className="border-border bg-card relative rounded-lg border">
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <h2
                id="booking-summary-heading"
                className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
              >
                {t("heading")}
              </h2>
              <span
                aria-hidden="true"
                className="border-primary font-display -rotate-6 rounded-sm border-2 px-2 py-0.5 text-xs font-extrabold tracking-[0.2em] [font-stretch:115%]"
              >
                DEMO
              </span>
            </div>
            <p className="font-display mt-4 text-3xl leading-none font-extrabold uppercase [font-stretch:115%]">
              {dateShort}
            </p>
            <p className="font-display mt-2 text-3xl leading-none font-extrabold [font-stretch:115%] tabular-nums">
              {timeRange}
            </p>
          </div>

          {/* Perforation: the logo's 21 dots, with the ticket's notches either side. */}
          <div aria-hidden="true" className="relative flex items-center px-6">
            <span className="border-border bg-background absolute -left-3 size-6 rounded-full border" />
            <span className="flex w-full justify-between">
              {PERFORATION.map((i) => (
                <span key={i} className="bg-border size-1.5 rounded-full" />
              ))}
            </span>
            <span className="border-border bg-background absolute -right-3 size-6 rounded-full border" />
          </div>

          <dl className="grid gap-3 p-6 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">{t("court")}</dt>
              <dd className="flex items-baseline gap-2 text-right font-medium">
                {courtName ?? "—"}
                <button
                  type="button"
                  onClick={onChangeCourt}
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm text-xs underline underline-offset-2 focus-visible:ring-2 focus-visible:outline-none"
                >
                  {t("change")}
                </button>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">{t("duration")}</dt>
              <dd className="font-medium tabular-nums">
                {tDuration("option", { minutes: duration })}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">{t("price")}</dt>
              <dd className="text-right">
                <span className="font-medium">{t("priceTbc")}</span>
                <br />
                <Link
                  href="/courts"
                  className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
                >
                  {t("pricesLink")}
                </Link>
              </dd>
            </div>
          </dl>

          <div className="px-6 pb-6">
            {!requestMessage && (
              <p className="text-muted-foreground mb-3 text-sm">{t("incomplete")}</p>
            )}
            <HandoffActions requestMessage={requestMessage} />
          </div>
        </div>
      </aside>

      <div
        data-testid="booking-bar"
        className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] supports-backdrop-filter:backdrop-blur lg:hidden"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <p className="min-w-0 flex-1 truncate text-sm">
            {requestMessage ? (
              <>
                <span className="font-display block text-base leading-tight font-bold [font-stretch:112%] tabular-nums">
                  {timeRange}
                </span>
                <span className="text-muted-foreground block truncate text-xs">
                  {dateShort} · {courtName}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">{t("incomplete")}</span>
            )}
          </p>
          <HandoffActions requestMessage={requestMessage} compact className="w-auto shrink-0" />
        </div>
      </div>
    </>
  );
}
