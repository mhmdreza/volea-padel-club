import type { ClubEvent } from "@/types/content";

// Generic example formats only — real event schedule is [[TBD]]. The AI demo's
// invented schedule (specific nights/prices) must not be reused as fact.
export const events: ClubEvent[] = [
  {
    id: "americano",
    title: { en: "Americano", de: "Americano" },
    description: {
      en: "A social rotating-partner format — meet other players and mix up your game.",
      de: "Ein geselliges Format mit wechselnden Partnern — lerne andere Spieler kennen.",
    },
    format: { en: "Community format", de: "Community-Format" },
  },
  {
    id: "mexicano",
    title: { en: "Mexicano", de: "Mexicano" },
    description: {
      en: "A dynamic, points-based format that keeps matches close and competitive.",
      de: "Ein dynamisches, punktebasiertes Format für knappe, spannende Matches.",
    },
    format: { en: "Community format", de: "Community-Format" },
  },
  {
    id: "club-tournament",
    title: { en: "Club Tournament", de: "Clubturnier" },
    description: {
      en: "Regular tournaments for all levels — register via Playtomic.",
      de: "Regelmäßige Turniere für alle Spielstärken — Anmeldung über Playtomic.",
    },
    format: { en: "Tournament", de: "Turnier" },
  },
];
