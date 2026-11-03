import type { Court } from "@/types/content";

// The fictional club has 3 doubles + 2 singles courts, with generic labels.
export const courts: Court[] = [
  {
    id: "doubles-1",
    kind: "doubles",
    name: { en: "Doubles Court 1", de: "Doppel-Court 1" },
    description: {
      en: "Indoor doubles court, panoramic glass.",
      de: "Indoor-Doppel-Court mit Panoramaglas.",
    },
  },
  {
    id: "doubles-2",
    kind: "doubles",
    name: { en: "Doubles Court 2", de: "Doppel-Court 2" },
    description: {
      en: "Indoor doubles court, panoramic glass.",
      de: "Indoor-Doppel-Court mit Panoramaglas.",
    },
  },
  {
    id: "doubles-3",
    kind: "doubles",
    name: { en: "Doubles Court 3", de: "Doppel-Court 3" },
    description: {
      en: "Indoor doubles court, panoramic glass.",
      de: "Indoor-Doppel-Court mit Panoramaglas.",
    },
  },
  {
    id: "singles-1",
    kind: "singles",
    name: { en: "Singles Court 1", de: "Einzel-Court 1" },
    description: { en: "Indoor singles court.", de: "Indoor-Einzel-Court." },
  },
  {
    id: "singles-2",
    kind: "singles",
    name: { en: "Singles Court 2", de: "Einzel-Court 2" },
    description: { en: "Indoor singles court.", de: "Indoor-Einzel-Court." },
  },
];
