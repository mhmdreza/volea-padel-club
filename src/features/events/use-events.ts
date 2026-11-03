import { useQuery } from "@tanstack/react-query";

import { events } from "@/content/events";
import type { ClubEvent } from "@/types/content";

export const eventsQueryKey = ["events"] as const;

export async function fetchEvents(): Promise<ClubEvent[]> {
  const res = await fetch("/api/events");
  if (!res.ok) throw new Error("Failed to load events");
  const data = (await res.json()) as { events: ClubEvent[] };
  return data.events;
}

/** Server Component prefetch: read content directly, no self-HTTP round-trip. */
export async function getEventsServer(): Promise<ClubEvent[]> {
  return events;
}

export function useEvents() {
  return useQuery({ queryKey: eventsQueryKey, queryFn: fetchEvents });
}
