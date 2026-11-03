import { useQuery } from "@tanstack/react-query";

import { sponsors, sponsorTiers } from "@/content/sponsors";
import type { Sponsor, SponsorTier } from "@/types/content";

export type SponsorsResponse = { tiers: SponsorTier[]; sponsors: Sponsor[] };

export const sponsorsQueryKey = ["sponsors"] as const;

export async function fetchSponsors(): Promise<SponsorsResponse> {
  const res = await fetch("/api/sponsors");
  if (!res.ok) throw new Error("Failed to load sponsors");
  return (await res.json()) as SponsorsResponse;
}

/** Server Component prefetch: read content directly, no self-HTTP round-trip. */
export async function getSponsorsServer(): Promise<SponsorsResponse> {
  return { tiers: sponsorTiers, sponsors };
}

export function useSponsors() {
  return useQuery({ queryKey: sponsorsQueryKey, queryFn: fetchSponsors });
}
