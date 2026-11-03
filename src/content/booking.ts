// Demo booking configuration for the /book prototype. There is no real booking
// backend yet (Playtomic link is [[TBD]], see site.ts): availability is generated
// and every view of it is labelled as a demo.
// [[TBD: real/weekend opening hours]] — 06:00–23:00 daily is a placeholder.
export const bookingConfig = {
  timeZone: "Europe/Berlin",
  horizonDays: 7,
  durations: [60, 90, 120],
  slotStepMinutes: 30,
  opensAt: "06:00",
  closesAt: "23:00",
  isDemo: true,
} as const;

export type BookingDuration = (typeof bookingConfig.durations)[number];
