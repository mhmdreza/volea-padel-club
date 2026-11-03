import { useQuery } from "@tanstack/react-query";

import { faqItems } from "@/content/faq";
import type { FaqItem } from "@/types/content";

export const faqQueryKey = ["faq"] as const;

export async function fetchFaq(): Promise<FaqItem[]> {
  const res = await fetch("/api/faq");
  if (!res.ok) throw new Error("Failed to load FAQ");
  const data = (await res.json()) as { items: FaqItem[] };
  return data.items;
}

/** Server Component prefetch: read content directly, no self-HTTP round-trip. */
export async function getFaqServer(): Promise<FaqItem[]> {
  return faqItems;
}

export function useFaq() {
  return useQuery({ queryKey: faqQueryKey, queryFn: fetchFaq });
}
