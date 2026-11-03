"use client";

import { useTranslations } from "next-intl";

import { bookingConfig, type BookingDuration } from "@/content/booking";

export function DurationSwitch({
  value,
  onChange,
}: {
  value: BookingDuration;
  onChange: (duration: BookingDuration) => void;
}) {
  const t = useTranslations("Book.duration");
  const index = bookingConfig.durations.indexOf(value);

  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-semibold">{t("legend")}</legend>
      <div className="border-border bg-card relative mt-3 grid w-full max-w-xs grid-cols-3 rounded-full border p-1">
        <span
          aria-hidden="true"
          className="bg-primary absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(${index * 100}%)` }}
        />
        {bookingConfig.durations.map((minutes) => (
          <label
            key={minutes}
            className="text-muted-foreground hover:text-foreground has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-ring relative z-10 flex h-11 cursor-pointer items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors has-[:focus-visible]:ring-2"
          >
            <input
              type="radio"
              name="booking-duration"
              value={minutes}
              checked={minutes === value}
              onChange={() => onChange(minutes)}
              className="sr-only"
            />
            {t("option", { minutes })}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
