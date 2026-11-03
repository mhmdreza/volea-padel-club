import { useQuery } from "@tanstack/react-query";

import { pricingAddOns, pricingSpecials, pricingTiers } from "@/content/pricing";
import type { PricingAddOn, PricingSpecial, PricingTier } from "@/types/content";

export type PricingResponse = {
  tiers: PricingTier[];
  specials: PricingSpecial[];
  addOns: PricingAddOn[];
};

export const pricingQueryKey = ["pricing"] as const;

export async function fetchPricing(): Promise<PricingResponse> {
  const res = await fetch("/api/pricing");
  if (!res.ok) throw new Error("Failed to load pricing");
  return (await res.json()) as PricingResponse;
}

/** Server Component prefetch: read content directly, no self-HTTP round-trip. */
export async function getPricingServer(): Promise<PricingResponse> {
  return { tiers: pricingTiers, specials: pricingSpecials, addOns: pricingAddOns };
}

export function usePricing() {
  return useQuery({ queryKey: pricingQueryKey, queryFn: fetchPricing });
}
