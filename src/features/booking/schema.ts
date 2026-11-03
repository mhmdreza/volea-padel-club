import { z } from "zod";

import { bookingConfig } from "@/content/booking";
import { courts } from "@/content/courts";

import { isRealCalendarDate } from "./lib/berlin-time";

export const durationSchema = z.union([z.literal(60), z.literal(90), z.literal(120)]);

export const plainDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(isRealCalendarDate, "Not a real calendar date");

// Slots start on the half hour, so only :00 and :30 are valid.
export const wallTimeSchema = z.string().regex(/^([01]\d|2[0-3]):(00|30)$/);

export const courtIdSchema = z.enum(courts.map((court) => court.id) as [string, ...string[]]);

// URL state comes from links people share and edit by hand: each field degrades
// to its default on its own instead of failing the whole page.
export const bookingSearchSchema = z.object({
  court: courtIdSchema.optional().catch(undefined),
  date: plainDateSchema.optional().catch(undefined),
  duration: z.coerce.number().pipe(durationSchema).catch(90),
  time: wallTimeSchema.optional().catch(undefined),
  from: z.enum(["rally"]).optional().catch(undefined),
});
export type BookingSearch = z.infer<typeof bookingSearchSchema>;

// The API is strict: a bad query is a client bug worth a 400, not a silent default.
export const availabilityQuerySchema = z.object({
  date: plainDateSchema,
  duration: z.coerce.number().pipe(durationSchema),
});

export const slotSchema = z.object({
  start: wallTimeSchema,
  end: z.string(),
  status: z.enum(["available", "booked", "past"]),
});

export const availabilityResponseSchema = z.object({
  demo: z.literal(true),
  timeZone: z.literal(bookingConfig.timeZone),
  date: plainDateSchema,
  durationMinutes: durationSchema,
  generatedAt: z.iso.datetime(),
  courts: z.array(
    z.object({
      courtId: courtIdSchema,
      kind: z.enum(["doubles", "singles"]),
      freeCount: z.number().int().nonnegative(),
      slots: z.array(slotSchema),
    }),
  ),
});
export type AvailabilityResponse = z.infer<typeof availabilityResponseSchema>;
