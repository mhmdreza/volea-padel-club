"use client";

import { useCallback, useMemo } from "react";

import type { BookingDuration } from "@/content/booking";
import { useSearchParams } from "@/i18n/navigation";

import type { PlainDate } from "./lib/berlin-time";
import { bookingSearchSchema } from "./schema";

export type BookingParams = {
  court?: string;
  date: PlainDate;
  duration: BookingDuration;
  time?: string;
  from?: "rally";
};

const KEYS = ["court", "date", "duration", "time", "from"] as const;

function normalize(search: URLSearchParams, days: PlainDate[]): BookingParams {
  const parsed = bookingSearchSchema.parse(Object.fromEntries(search));
  const date = parsed.date && days.includes(parsed.date) ? parsed.date : days[0]!;
  return { ...parsed, date };
}

/**
 * The booking selection, read from and written to the URL — the only source of
 * truth, so a link restores the exact slot. `days` is the bookable window; a date
 * outside it falls back to its first bookable day.
 */
export function useBookingParams(days: PlainDate[]) {
  const searchParams = useSearchParams();
  const params = useMemo(
    () => normalize(new URLSearchParams(searchParams.toString()), days),
    [searchParams, days],
  );

  const setParams = useCallback(
    (patch: Partial<BookingParams>) => {
      // Merge onto the live URL rather than this render's copy, so two updates in
      // one event don't overwrite each other.
      const next = { ...normalize(new URLSearchParams(window.location.search), days), ...patch };
      const query = new URLSearchParams();
      for (const key of KEYS) {
        const value = next[key];
        if (value !== undefined) query.set(key, String(value));
      }
      // Next syncs replaceState with useSearchParams without a server round trip.
      window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
    },
    [days],
  );

  return { ...params, setParams };
}
