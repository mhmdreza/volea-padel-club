import { describe, expect, it } from "vitest";

import { courts } from "@/content/courts";
import { generateAvailability } from "@/features/booking/lib/availability";
import {
  availabilityQuerySchema,
  availabilityResponseSchema,
  bookingSearchSchema,
} from "@/features/booking/schema";

describe("bookingSearchSchema", () => {
  it("parses a complete, valid URL state", () => {
    expect(
      bookingSearchSchema.parse({
        court: "singles-1",
        date: "2026-10-12",
        duration: "120",
        time: "18:30",
        from: "rally",
      }),
    ).toEqual({
      court: "singles-1",
      date: "2026-10-12",
      duration: 120,
      time: "18:30",
      from: "rally",
    });
  });

  it("defaults to 90 minutes and nothing else when the URL is empty", () => {
    expect(bookingSearchSchema.parse({})).toEqual({ duration: 90 });
  });

  it.each([
    ["court", { court: "centre-court" }],
    ["date", { date: "2026-02-30" }],
    ["date", { date: "12.10.2026" }],
    ["time", { time: "18:15" }],
    ["time", { time: "25:00" }],
    ["from", { from: "newsletter" }],
  ])("drops an invalid %s without throwing", (field, input) => {
    const result = bookingSearchSchema.parse({ ...input, duration: "60" });
    expect(result).not.toHaveProperty(field, expect.anything());
    expect(result.duration).toBe(60);
  });

  it("falls back to 90 minutes for an unsupported duration", () => {
    expect(bookingSearchSchema.parse({ duration: "45" }).duration).toBe(90);
    expect(bookingSearchSchema.parse({ duration: "abc" }).duration).toBe(90);
  });

  it("keeps the valid fields when another one is broken", () => {
    expect(
      bookingSearchSchema.parse({ court: "doubles-2", date: "2026-02-30", time: "07:00" }),
    ).toEqual({ court: "doubles-2", duration: 90, time: "07:00" });
  });
});

describe("availabilityQuerySchema", () => {
  it("accepts a date and a supported duration", () => {
    expect(availabilityQuerySchema.parse({ date: "2026-10-12", duration: "90" })).toEqual({
      date: "2026-10-12",
      duration: 90,
    });
  });

  it.each([
    [{ duration: "90" }],
    [{ date: "2026-02-30", duration: "90" }],
    [{ date: "2026-10-12", duration: "45" }],
    [{ date: "2026-10-12" }],
  ])("rejects %j", (query) => {
    expect(availabilityQuerySchema.safeParse(query).success).toBe(false);
  });
});

describe("availabilityResponseSchema", () => {
  it("accepts the generator's output", () => {
    const availability = generateAvailability({
      date: "2026-10-12",
      durationMinutes: 90,
      now: new Date("2026-10-12T08:00:00Z"),
      courts,
    });
    expect(availabilityResponseSchema.safeParse(availability).success).toBe(true);
  });

  it("rejects a response that isn't flagged as demo data", () => {
    const availability = generateAvailability({
      date: "2026-10-12",
      durationMinutes: 90,
      now: new Date("2026-10-12T08:00:00Z"),
      courts,
    });
    expect(availabilityResponseSchema.safeParse({ ...availability, demo: false }).success).toBe(
      false,
    );
  });
});
