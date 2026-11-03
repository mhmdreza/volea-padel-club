import type { LocalizedText } from "@/types/content";

/** Renders a bilingual content field for the current locale, falling back to English. */
export function localize(text: LocalizedText, locale: string): string {
  return locale === "de" ? text.de : text.en;
}
