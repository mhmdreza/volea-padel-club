"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { bookingConfig } from "@/content/booking";
import { useCourts } from "@/features/courts/use-courts";
import { localize } from "@/lib/i18n-content";

import { BookingSummary } from "./booking-summary";
import { CourtPlan, type PlanCourt } from "./court-plan";
import { DateStrip } from "./date-strip";
import { DurationSwitch } from "./duration-switch";
import { bookableDays, localDate, toLabelDate, type PlainDate } from "./lib/berlin-time";
import { SlotGrid } from "./slot-grid";
import { availabilityQueryOptions, useAvailability } from "./use-availability";
import { useBookingParams, type BookingParams } from "./use-booking-params";

/**
 * The interactive picker. The only part of /book that reads the URL or the clock,
 * which is why it sits behind the page's Suspense boundary.
 */
export function Booker() {
  const t = useTranslations("Book");
  const format = useFormatter();
  const locale = useLocale();
  const queryClient = useQueryClient();
  // Read once: the 7-day window shouldn't roll over mid-session under the visitor.
  const [now] = useState(() => new Date());
  // "Today"/"Tomorrow" are the visitor's words, so they follow the device's calendar;
  // which days are bookable stays on the club's clock.
  const today = localDate(now);
  const days = useMemo(() => bookableDays(now), [now]);

  const { court, date, duration, time, from, setParams } = useBookingParams(days);
  const { data: courts = [] } = useCourts();
  const availability = useAvailability({ date, duration });
  const [hoverTime, setHoverTime] = useState<string>();
  // Until the visitor changes something, the URL came from a link they followed.
  const [touched, setTouched] = useState(false);
  const [staleNotice, setStaleNotice] = useState(false);

  const courtData = availability.data?.courts;
  // keepPreviousData shows the last day while the next loads; it can't confirm a slot.
  const confirmed = Boolean(availability.data) && !availability.isPlaceholderData;
  const courtSlots = court ? courtData?.find((c) => c.courtId === court)?.slots : undefined;
  const isFree = (courtId: string, start: string) =>
    courtData
      ?.find((c) => c.courtId === courtId)
      ?.slots.some((slot) => slot.start === start && slot.status === "available") ?? false;

  const timeIsFree = Boolean(court && time && isFree(court, time));
  const isStale = confirmed && Boolean(court && time) && !timeIsFree;
  // Adjusting state during render (not in an effect) so the notice appears in the
  // same paint that drops the slot.
  if (isStale && !touched && !staleNotice) setStaleNotice(true);

  useEffect(() => {
    // A slot that's booked, past, or gone with a new court/date/duration is cleared
    // from the URL, so a reload or shared link never carries it.
    if (isStale) setParams({ time: undefined });
  }, [isStale, setParams]);

  function update(patch: Partial<BookingParams>) {
    setTouched(true);
    setStaleNotice(false);
    setParams(patch);
  }

  function prefetch(day: PlainDate) {
    void queryClient.prefetchQuery(availabilityQueryOptions(day, duration));
  }

  const selectedTime = confirmed && timeIsFree ? time : undefined;
  const courtName = (id: string) => {
    const match = courts.find((c) => c.id === id);
    return match ? localize(match.name, locale) : id;
  };
  const selectedCourt = courts.find((c) => c.id === court);

  const planCourts: PlanCourt[] = courts.map((c) => {
    const available = courtData?.find((a) => a.courtId === c.id);
    return {
      id: c.id,
      kind: c.kind,
      name: localize(c.name, locale),
      freeCount: available?.freeCount,
      slotCount: available?.slots.length,
    };
  });
  const highlightIds = new Set(
    hoverTime ? courts.filter((c) => isFree(c.id, hoverTime)).map((c) => c.id) : [],
  );
  const alsoFree = selectedTime
    ? courts
        .filter((c) => c.id !== court && isFree(c.id, selectedTime))
        .map((c) => ({ id: c.id, name: localize(c.name, locale) }))
    : [];

  const freeCount = courtData
    ? court
      ? (courtData.find((c) => c.courtId === court)?.freeCount ?? 0)
      : courtData.reduce((sum, c) => sum + c.freeCount, 0)
    : undefined;
  const dateLabel = format.dateTime(toLabelDate(date), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: bookingConfig.timeZone,
  });

  const selectedSlot = selectedTime ? courtSlots?.find((s) => s.start === selectedTime) : undefined;
  const dateShort = format.dateTime(toLabelDate(date), {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: bookingConfig.timeZone,
  });
  const requestMessage =
    selectedCourt && selectedSlot
      ? t("handoff.requestMessage", {
          court: courtName(selectedCourt.id),
          date: dateLabel,
          start: selectedSlot.start,
          end: selectedSlot.end,
          minutes: duration,
        })
      : undefined;

  function focusPlan() {
    document.getElementById("court-plan")?.querySelector<SVGElement>('[tabindex="0"]')?.focus();
  }

  return (
    <div className="flex flex-col gap-8">
      {from === "rally" && selectedCourt && (
        <p className="border-primary/50 bg-primary/10 rounded-lg border px-4 py-3 text-sm font-medium">
          {t("fromRally", { court: courtName(selectedCourt.id) })}
        </p>
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-10">
          <CourtPlan
            courts={planCourts}
            selectedId={court}
            highlightIds={highlightIds}
            onSelect={(id) => update({ court: id })}
          />
          <DateStrip
            days={days}
            today={today}
            value={date}
            onChange={(day) => update({ date: day })}
            onPrefetch={prefetch}
          />
          <DurationSwitch value={duration} onChange={(minutes) => update({ duration: minutes })} />
          <SlotGrid
            hasCourt={Boolean(court)}
            slots={courtSlots}
            isError={availability.isError && !availability.data}
            onRetry={() => void availability.refetch()}
            value={selectedTime}
            onChange={(start) => update({ time: start })}
            onHover={setHoverTime}
            noLongerFree={staleNotice}
            alsoFree={alsoFree}
            onPickCourt={(id) => update({ court: id })}
            animationKey={`${court}-${date}-${duration}`}
          />
        </div>
        <BookingSummary
          selection={{
            courtName: selectedCourt && courtName(selectedCourt.id),
            dateShort,
            start: selectedSlot?.start,
            end: selectedSlot?.end,
            duration,
            requestMessage,
          }}
          onChangeCourt={focusPlan}
        />
      </div>

      <p aria-live="polite" className="sr-only">
        {freeCount !== undefined && t("time.announce", { count: freeCount, date: dateLabel })}
      </p>
    </div>
  );
}
