import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";

import type { PlainDate } from "./lib/berlin-time";
import { availabilityResponseSchema, type AvailabilityResponse } from "./schema";

export async function fetchAvailability(
  date: PlainDate,
  duration: number,
): Promise<AvailabilityResponse> {
  const query = new URLSearchParams({ date, duration: String(duration) });
  const res = await fetch(`/api/availability?${query}`);
  if (!res.ok) throw new Error("Failed to load availability");
  // Parsed, not cast: the UI trusts slot statuses to decide what can be selected.
  return availabilityResponseSchema.parse(await res.json());
}

export function availabilityQueryOptions(date: PlainDate, duration: number) {
  return queryOptions({
    queryKey: ["availability", date, duration] as const,
    queryFn: () => fetchAvailability(date, duration),
  });
}

export function useAvailability({ date, duration }: { date: PlainDate; duration: number }) {
  return useQuery({
    ...availabilityQueryOptions(date, duration),
    // Keep the previous day on screen while the next one loads, so the grid and
    // court plan don't collapse to a skeleton on every chip click.
    placeholderData: keepPreviousData,
  });
}
