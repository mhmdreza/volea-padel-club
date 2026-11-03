import { useQuery } from "@tanstack/react-query";

import { courts } from "@/content/courts";
import type { Court } from "@/types/content";

export const courtsQueryKey = ["courts"] as const;

export async function fetchCourts(): Promise<Court[]> {
  const res = await fetch("/api/courts");
  if (!res.ok) throw new Error("Failed to load courts");
  const data = (await res.json()) as { courts: Court[] };
  return data.courts;
}

/** Server Component prefetch: read content directly, no self-HTTP round-trip. */
export async function getCourtsServer(): Promise<Court[]> {
  return courts;
}

export function useCourts() {
  return useQuery({ queryKey: courtsQueryKey, queryFn: fetchCourts });
}
