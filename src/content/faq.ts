import type { FaqItem } from "@/types/content";

// Only facts stated elsewhere on the site — opening hours,
// exact opening date, and other details are [[TBD]] and left out rather than guessed.
export const faqItems: FaqItem[] = [
  {
    id: "how-to-book",
    question: { en: "How do I book a court?", de: "Wie buche ich einen Platz?" },
    answer: {
      en: "Courts are booked online via Playtomic. You can also reach us by phone or email.",
      de: "Plätze werden online über Playtomic gebucht. Du erreichst uns auch telefonisch oder per E-Mail.",
    },
  },
  {
    id: "cancellation",
    question: {
      en: "What's your cancellation policy?",
      de: "Wie sind eure Stornierungsbedingungen?",
    },
    answer: {
      en: "Free cancellation is available up to 24 hours before your booking. Playtomic's own booking and cancellation terms also apply.",
      de: "Eine kostenfreie Stornierung ist bis 24 Stunden vor deiner Buchung möglich. Zusätzlich gelten die Buchungs- und Stornierungsbedingungen von Playtomic.",
    },
  },
  {
    id: "shoes",
    question: { en: "What shoes can I wear on the courts?", de: "Welche Schuhe darf ich tragen?" },
    answer: {
      en: "Courts may only be used with clean, suitable indoor sports shoes — street shoes are not permitted.",
      de: "Die Courts dürfen nur mit sauberen, geeigneten Sportschuhen betreten werden — Straßenschuhe sind nicht zulässig.",
    },
  },
  {
    id: "fitness-partners",
    question: {
      en: "Do you work with corporate fitness programmes?",
      de: "Arbeitet ihr mit Firmenfitness-Programmen zusammen?",
    },
    answer: {
      en: "We're planning partnerships with corporate fitness programmes — details to follow closer to opening.",
      de: "Wir planen Partnerschaften mit Firmenfitness-Programmen — Details folgen näher zur Eröffnung.",
    },
  },
  {
    id: "opening",
    question: { en: "When are you opening?", de: "Wann eröffnet ihr?" },
    answer: {
      en: "We're opening in Lindenau in November 2026.",
      de: "Wir eröffnen im November 2026 in Lindenau.",
    },
  },
];
