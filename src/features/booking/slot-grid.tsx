"use client";

import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { wallTimeToMinutes } from "./lib/berlin-time";
import type { AvailabilityResponse } from "./schema";

type Slot = AvailabilityResponse["courts"][number]["slots"][number];

const PERIODS = [
  { id: "morning", until: 12 * 60 },
  { id: "afternoon", until: 17 * 60 },
  { id: "evening", until: 24 * 60 },
] as const;

const gridClass = "grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2";

export function SlotGrid({
  hasCourt,
  slots,
  isError,
  onRetry,
  value,
  onChange,
  onHover,
  noLongerFree,
  alsoFree,
  onPickCourt,
  animationKey,
}: {
  hasCourt: boolean;
  /** Undefined while loading. */
  slots?: Slot[];
  isError: boolean;
  onRetry: () => void;
  value?: string;
  onChange: (time: string) => void;
  /** The time under the pointer or focus, so the plan can light every court free then. */
  onHover: (time: string | undefined) => void;
  noLongerFree: boolean;
  alsoFree: { id: string; name: string }[];
  onPickCourt: (courtId: string) => void;
  /** Changes with court/date/duration so a new set of slots staggers in afresh. */
  animationKey: string;
}) {
  const t = useTranslations("Book");
  // Past starts can't be chosen and only crowd today's grid, so they're left out.
  const upcoming = slots?.filter((slot) => slot.status !== "past") ?? [];
  const anyFree = upcoming.some((slot) => slot.status === "available");

  return (
    <fieldset className="min-w-0" aria-busy={hasCourt && !slots && !isError}>
      <legend className="text-sm font-semibold">{t("time.legend")}</legend>

      {noLongerFree && (
        <p
          role="status"
          className="border-primary/50 bg-primary/10 mt-3 rounded-md border px-3 py-2 text-sm"
        >
          {t("time.noLongerFree")}
        </p>
      )}

      {!hasCourt ? (
        <p className="text-muted-foreground mt-3 text-sm">{t("plan.choose")}</p>
      ) : isError ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <p>{t("time.error")}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            {t("time.retry")}
          </Button>
        </div>
      ) : !slots ? (
        <div className={cn(gridClass, "mt-3")}>
          <span className="sr-only">{t("time.loading")}</span>
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className="h-11 rounded-md" />
          ))}
        </div>
      ) : !anyFree ? (
        <p className="text-muted-foreground mt-3 text-sm">{t("time.empty")}</p>
      ) : (
        <div key={animationKey} className="mt-3 flex flex-col gap-5">
          {PERIODS.map((period, p) => {
            const from = p === 0 ? 0 : PERIODS[p - 1]!.until;
            const inPeriod = upcoming.filter((slot) => {
              const start = wallTimeToMinutes(slot.start);
              return start >= from && start < period.until;
            });
            if (inPeriod.length === 0) return null;
            return (
              <div key={period.id} role="group" aria-labelledby={`slots-${period.id}`}>
                <p
                  id={`slots-${period.id}`}
                  className="text-muted-foreground mb-2 text-xs font-semibold tracking-[0.16em] uppercase"
                >
                  {t(`time.${period.id}`)}
                </p>
                <div className={gridClass}>
                  {inPeriod.map((slot, i) => {
                    const booked = slot.status !== "available";
                    return (
                      <label
                        key={slot.start}
                        onPointerEnter={() => !booked && onHover(slot.start)}
                        onPointerLeave={() => onHover(undefined)}
                        onFocus={() => onHover(slot.start)}
                        onBlur={() => onHover(undefined)}
                        style={{ "--i": i } as CSSProperties}
                        className={cn(
                          "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:fill-mode-backwards motion-safe:animation-duration-300 [animation-delay:calc(var(--i)*18ms)]",
                          "has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-background flex h-11 items-center justify-center rounded-md border text-sm font-medium tabular-nums transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2",
                          booked
                            ? "bg-muted text-muted-foreground cursor-not-allowed border-transparent line-through"
                            : "border-border bg-card hover:border-primary/60 has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground cursor-pointer",
                        )}
                      >
                        <input
                          type="radio"
                          name="booking-time"
                          value={slot.start}
                          disabled={booked}
                          checked={slot.start === value}
                          onChange={() => onChange(slot.start)}
                          className="sr-only"
                        />
                        {slot.start}
                        {booked && <span className="sr-only"> ({t("time.booked")})</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {value && alsoFree.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("time.alsoFree", { time: value })}</span>
          {alsoFree.map((court) => (
            <Button
              key={court.id}
              variant="outline"
              size="sm"
              onClick={() => onPickCourt(court.id)}
            >
              {court.name}
            </Button>
          ))}
        </div>
      )}
    </fieldset>
  );
}
