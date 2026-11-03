import { bookingConfig } from "@/content/booking";
import type { Court } from "@/types/content";

import {
  berlinNow,
  dayOfWeek,
  minutesToWallTime,
  wallTimeToMinutes,
  type PlainDate,
} from "./berlin-time";

export type SlotStatus = "available" | "booked" | "past";
export type Slot = { start: string; end: string; status: SlotStatus };
export type CourtAvailability = {
  courtId: string;
  kind: Court["kind"];
  freeCount: number;
  slots: Slot[];
};
export type Availability = {
  demo: true;
  timeZone: typeof bookingConfig.timeZone;
  date: PlainDate;
  durationMinutes: number;
  generatedAt: string;
  courts: CourtAvailability[];
};

type Booking = { start: number; end: number };

const OPENS = wallTimeToMinutes(bookingConfig.opensAt);
const CLOSES = wallTimeToMinutes(bookingConfig.closesAt);
const STEP = bookingConfig.slotStepMinutes;
const EXISTING_LENGTHS = [60, 90, 120];

// FNV-1a: a stable 32-bit seed from "court:date", so a day looks the same on
// every request and every server instance.
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

// Invented demand curve for the demo only: busier after work and at weekends.
function demand(minutes: number, weekend: boolean): number {
  const hour = minutes / 60;
  if (hour >= 17 && hour < 21) return weekend ? 0.45 : 0.4;
  if (hour < 9) return weekend ? 0.1 : 0.2;
  if (hour >= 21) return 0.2;
  return weekend ? 0.3 : 0.1;
}

// Existing bookings depend only on court and date, never on the requested
// duration, so a start that is free for 120 minutes is also free for 60 and 90.
function existingBookings(courtId: string, date: PlainDate): Booking[] {
  const random = mulberry32(fnv1a(`${courtId}:${date}`));
  const weekend = [0, 6].includes(dayOfWeek(date));
  const bookings: Booking[] = [];
  let t = OPENS;
  while (t < CLOSES) {
    if (random() < demand(t, weekend)) {
      const length = EXISTING_LENGTHS[Math.floor(random() * EXISTING_LENGTHS.length)]!;
      const end = Math.min(t + length, CLOSES);
      bookings.push({ start: t, end });
      t = end;
    } else {
      t += STEP;
    }
  }
  return bookings;
}

export function generateAvailability({
  date,
  durationMinutes,
  now,
  courts,
}: {
  date: PlainDate;
  durationMinutes: number;
  now: Date;
  courts: Pick<Court, "id" | "kind">[];
}): Availability {
  const today = berlinNow(now);

  return {
    demo: true,
    timeZone: bookingConfig.timeZone,
    date,
    durationMinutes,
    generatedAt: now.toISOString(),
    courts: courts.map((court) => {
      const bookings = existingBookings(court.id, date);
      const slots: Slot[] = [];
      for (let start = OPENS; start + durationMinutes <= CLOSES; start += STEP) {
        const end = start + durationMinutes;
        const past = date < today.date || (date === today.date && start < today.minutes);
        const overlaps = bookings.some((b) => start < b.end && b.start < end);
        slots.push({
          start: minutesToWallTime(start),
          end: minutesToWallTime(end),
          status: past ? "past" : overlaps ? "booked" : "available",
        });
      }
      return {
        courtId: court.id,
        kind: court.kind,
        freeCount: slots.filter((slot) => slot.status === "available").length,
        slots,
      };
    }),
  };
}
