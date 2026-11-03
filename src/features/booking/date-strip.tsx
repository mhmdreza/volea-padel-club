"use client";

import { useFormatter, useTranslations } from "next-intl";

import { bookingConfig } from "@/content/booking";

import { addDays, toLabelDate, type PlainDate } from "./lib/berlin-time";

export function DateStrip({
  days,
  today,
  value,
  onChange,
  onPrefetch,
}: {
  days: PlainDate[];
  // Matched by date, not position: the window can start tomorrow, and the
  // visitor's day can differ from the club's.
  today: PlainDate;
  value: PlainDate;
  onChange: (date: PlainDate) => void;
  /** Hover/focus intent: warm the cache so the click renders instantly. */
  onPrefetch: (date: PlainDate) => void;
}) {
  const t = useTranslations("Book.date");
  const format = useFormatter();
  const timeZone = bookingConfig.timeZone;

  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-semibold">{t("legend")}</legend>
      {/* Bleeds to the screen edge on phones and scrolls on its own, so the page never does. */}
      <div className="-mx-4 mt-3 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:scroll-px-0 sm:px-0">
        {days.map((day) => {
          const date = toLabelDate(day);
          const relative =
            day === today
              ? t("today")
              : day === addDays(today, 1)
                ? t("tomorrow")
                : format.dateTime(date, { weekday: "short", timeZone });
          return (
            <label
              key={day}
              onPointerEnter={() => onPrefetch(day)}
              onFocus={() => onPrefetch(day)}
              className="border-border bg-card hover:border-primary/60 has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-background relative flex h-[5.5rem] w-[4.5rem] shrink-0 cursor-pointer snap-start flex-col items-center justify-center gap-1 rounded-md border transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2"
            >
              <input
                type="radio"
                name="booking-date"
                value={day}
                checked={day === value}
                onChange={() => onChange(day)}
                className="sr-only"
              />
              <span className="text-xs font-medium">{relative}</span>
              <span className="font-display text-2xl leading-none font-bold [font-stretch:115%]">
                {format.dateTime(date, { day: "numeric", timeZone })}
              </span>
              <span className="text-xs">{format.dateTime(date, { month: "short", timeZone })}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
