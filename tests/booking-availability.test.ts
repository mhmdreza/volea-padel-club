import { describe, expect, it } from "vitest";

import { bookingConfig } from "@/content/booking";
import { courts } from "@/content/courts";
import { generateAvailability } from "@/features/booking/lib/availability";
import {
  berlinNow,
  bookableDays,
  isRealCalendarDate,
  nextDays,
  toLabelDate,
  wallTimeToMinutes,
} from "@/features/booking/lib/berlin-time";

// 2026-10-12 08:00 UTC = 10:00 in Berlin (CEST).
const NOW = new Date("2026-10-12T08:00:00Z");
const generate = (date: string, durationMinutes: number, now = NOW) =>
  generateAvailability({ date, durationMinutes, now, courts });

describe("berlinNow", () => {
  it("rolls over to the next Berlin day before UTC does", () => {
    expect(berlinNow(new Date("2026-10-11T22:30:00Z"))).toEqual({
      date: "2026-10-12",
      minutes: 30,
    });
  });

  it("uses winter time after the DST change", () => {
    expect(berlinNow(new Date("2026-10-26T12:00:00Z"))).toEqual({
      date: "2026-10-26",
      minutes: 13 * 60,
    });
  });
});

describe("nextDays", () => {
  it("crosses a month boundary", () => {
    expect(nextDays("2026-10-29", 4)).toEqual([
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
  });

  it("neither skips nor repeats a day across the 2026-10-25 DST change", () => {
    expect(nextDays("2026-10-24", 3)).toEqual(["2026-10-24", "2026-10-25", "2026-10-26"]);
  });

  it("labels a plain day at noon UTC, the same day in Berlin", () => {
    expect(toLabelDate("2026-10-25").toISOString()).toBe("2026-10-25T12:00:00.000Z");
    expect(berlinNow(toLabelDate("2026-10-25")).date).toBe("2026-10-25");
  });

  it("rejects dates that don't exist", () => {
    expect(isRealCalendarDate("2026-02-30")).toBe(false);
    expect(isRealCalendarDate("2028-02-29")).toBe(true);
  });
});

describe("bookableDays", () => {
  it("starts today while a game still fits before closing", () => {
    // 20:00 UTC = 22:00 in Berlin: the last 60-minute start.
    expect(bookableDays(new Date("2026-10-08T20:00:00Z"))[0]).toBe("2026-10-08");
  });

  it("starts tomorrow once nothing is left today", () => {
    // 21:36 UTC = 23:36 in Berlin; already the 9th for a visitor further east.
    const days = bookableDays(new Date("2026-10-08T21:36:00Z"));
    expect(days[0]).toBe("2026-10-09");
    expect(days).toHaveLength(bookingConfig.horizonDays);
  });
});

describe("generateAvailability", () => {
  it("is deterministic for the same date and duration", () => {
    expect(generate("2026-10-14", 90)).toEqual(generate("2026-10-14", 90));
  });

  it("returns every court", () => {
    expect(generate("2026-10-14", 90).courts.map((c) => c.courtId)).toEqual(
      courts.map((c) => c.id),
    );
  });

  it.each(bookingConfig.durations)("keeps %i-minute slots within opening hours", (duration) => {
    const opens = wallTimeToMinutes(bookingConfig.opensAt);
    const closes = wallTimeToMinutes(bookingConfig.closesAt);
    for (const court of generate("2026-10-14", duration).courts) {
      for (const slot of court.slots) {
        const start = wallTimeToMinutes(slot.start);
        expect(start).toBeGreaterThanOrEqual(opens);
        expect(start % bookingConfig.slotStepMinutes).toBe(0);
        expect(wallTimeToMinutes(slot.end)).toBe(start + duration);
        expect(wallTimeToMinutes(slot.end)).toBeLessThanOrEqual(closes);
      }
    }
  });

  it("keeps a start free for 120 minutes free for 60 and 90 too", () => {
    const byDuration = Object.fromEntries(
      bookingConfig.durations.map((d) => [d, generate("2026-10-17", d)]),
    );
    for (const [i, court] of byDuration[120]!.courts.entries()) {
      for (const slot of court.slots.filter((s) => s.status === "available")) {
        for (const shorter of [60, 90]) {
          const match = byDuration[shorter]!.courts[i]!.slots.find((s) => s.start === slot.start);
          expect(match?.status).toBe("available");
        }
      }
    }
  });

  it("marks starts before now as past today, and none on later days", () => {
    const today = generate("2026-10-12", 60);
    for (const court of today.courts) {
      for (const slot of court.slots) {
        const isPast = wallTimeToMinutes(slot.start) < 10 * 60;
        expect(slot.status === "past").toBe(isPast);
      }
    }
    const tomorrow = generate("2026-10-13", 60);
    expect(tomorrow.courts.flatMap((c) => c.slots).some((s) => s.status === "past")).toBe(false);
  });

  it("counts exactly the available slots as free", () => {
    for (const court of generate("2026-10-17", 90).courts) {
      expect(court.freeCount).toBe(court.slots.filter((s) => s.status === "available").length);
    }
  });

  it("has a mix of booked and free slots on a typical day", () => {
    const slots = generate("2026-10-14", 90).courts.flatMap((c) => c.slots);
    expect(slots.some((s) => s.status === "booked")).toBe(true);
    expect(slots.some((s) => s.status === "available")).toBe(true);
  });
});
