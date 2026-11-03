import type { PricingAddOn, PricingSpecial, PricingTier } from "@/types/content";

// Sample prices for the fictional club. The +2€ AI-tool surcharge applies to doubles courts only.
export const pricingTiers: PricingTier[] = [
  {
    id: "doubles-early-bird",
    courtKind: "doubles",
    label: { en: "Early Bird", de: "Early Bird" },
    timeWindow: { en: "Mon–Fri 06:00–09:00", de: "Mo–Fr 06:00–09:00" },
    priceCents: 3000,
    pricePerPersonCents: 750,
    aiToolSurchargeCents: 200,
  },
  {
    id: "doubles-day-deal",
    courtKind: "doubles",
    label: { en: "Day Deal", de: "Day Deal" },
    timeWindow: { en: "Mon–Fri 09:00–16:00", de: "Mo–Fr 09:00–16:00" },
    priceCents: 3400,
    pricePerPersonCents: 850,
    aiToolSurchargeCents: 200,
  },
  {
    id: "doubles-prime-time",
    courtKind: "doubles",
    label: { en: "Prime Time", de: "Prime Time" },
    timeWindow: {
      en: "Mon–Fri 16:00–23:00, plus Sat/Sun & holidays",
      de: "Mo–Fr 16:00–23:00, sowie Sa/So & Feiertage",
    },
    priceCents: 4000,
    pricePerPersonCents: 1000,
    aiToolSurchargeCents: 200,
  },
  {
    id: "singles-day-deal",
    courtKind: "singles",
    label: { en: "Day Deal", de: "Day Deal" },
    timeWindow: { en: "Mon–Fri 06:00–16:00", de: "Mo–Fr 06:00–16:00" },
    priceCents: 2200,
    pricePerPersonCents: 1100,
  },
  {
    id: "singles-prime-time",
    courtKind: "singles",
    label: { en: "Prime Time", de: "Prime Time" },
    timeWindow: {
      en: "Mon–Fri 16:00–23:00, plus Sat/Sun & holidays",
      de: "Mo–Fr 16:00–23:00, sowie Sa/So & Feiertage",
    },
    priceCents: 2800,
    pricePerPersonCents: 1400,
  },
];

export const pricingSpecials: PricingSpecial[] = [
  {
    id: "student-discount",
    title: { en: "Student Discount", de: "Schüler- & Studentenrabatt" },
    description: {
      en: "20% off for pupils, students, and apprentices, Mon–Fri 06:00–16:00.",
      de: "20% Rabatt für Schüler, Studenten und Azubis, Mo–Fr 06:00–16:00 Uhr.",
    },
  },
  {
    id: "volea-wallet",
    title: { en: "Volea Wallet", de: "Volea Wallet" },
    description: {
      en: "Top up €100 and get €110, €250 → €285, or €500 → €600 in court credit.",
      de: "Lade 100 € auf und erhalte 110 €, 250 € → 285 €, oder 500 € → 600 € Guthaben.",
    },
  },
  {
    id: "opening-special",
    title: { en: "Opening Special", de: "Eröffnungs-Special" },
    description: {
      en: "2-for-1 court bookings in our opening month, Mon–Fri 06:00–16:00.",
      de: "2-für-1-Buchungen im Eröffnungsmonat, Mo–Fr 06:00–16:00 Uhr.",
    },
  },
];

export const pricingAddOns: PricingAddOn[] = [
  {
    id: "premium-racket",
    label: {
      en: "Premium racket rental (per booking)",
      de: "Premium-Schläger-Verleih (pro Buchung)",
    },
    priceCents: 350,
  },
  {
    id: "ball-can",
    label: { en: "Ball can (3-pack)", de: "Balldose (3er-Pack)" },
    priceCents: 750,
  },
  {
    id: "practice-balls",
    label: { en: "Practice ball rental", de: "Trainingsball-Verleih" },
    priceCents: 200,
  },
];
