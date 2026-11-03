import type { Coach, TrainingProgram } from "@/types/content";

// Generic format categories only — real schedules/prices are [[TBD]]. Coach
// names/bios are [[TBD]] pending client input; do not invent them.
export const trainingPrograms: TrainingProgram[] = [
  {
    id: "taster",
    title: { en: "Taster Session", de: "Schnupperkurs" },
    description: {
      en: "A one-off introduction to padel — no experience or equipment needed.",
      de: "Ein einmaliger Einstieg ins Padel — keine Erfahrung oder Ausrüstung nötig.",
    },
    level: "all-levels",
    format: "taster",
  },
  {
    id: "group",
    title: { en: "Group Training", de: "Gruppentraining" },
    description: {
      en: "Regular group sessions for beginners through advanced players.",
      de: "Regelmäßige Gruppenstunden für Anfänger bis Fortgeschrittene.",
    },
    level: "all-levels",
    format: "group",
  },
  {
    id: "private",
    title: { en: "Private Coaching", de: "Einzeltraining" },
    description: {
      en: "One-on-one coaching tailored to your game.",
      de: "Individuelles Coaching, abgestimmt auf dein Spiel.",
    },
    level: "all-levels",
    format: "private",
  },
];

export const coaches: Coach[] = [];
