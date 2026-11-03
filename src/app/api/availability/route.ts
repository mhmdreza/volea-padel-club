import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { courts } from "@/content/courts";
import { generateAvailability } from "@/features/booking/lib/availability";
import { bookableDays } from "@/features/booking/lib/berlin-time";
import { availabilityQuerySchema } from "@/features/booking/schema";

// Demo availability, generated on request. Reading the query makes this handler
// dynamic; a short public cache absorbs date-chip prefetches without serving
// "past" slots for long.
export function GET(request: NextRequest) {
  const query = availabilityQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!query.success) {
    return NextResponse.json(
      { error: "invalid_query", issues: z.treeifyError(query.error) },
      { status: 400 },
    );
  }

  const now = new Date();
  const bookable = bookableDays(now);
  if (!bookable.includes(query.data.date)) {
    return NextResponse.json({ error: "out_of_range" }, { status: 400 });
  }

  const availability = generateAvailability({
    date: query.data.date,
    durationMinutes: query.data.duration,
    now,
    courts,
  });
  return NextResponse.json(availability, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
