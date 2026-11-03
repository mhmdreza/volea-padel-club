// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/availability/route";
import { availabilityResponseSchema } from "@/features/booking/schema";

const request = (query: string) =>
  new NextRequest(`http://localhost/api/availability${query ? `?${query}` : ""}`);

describe("GET /api/availability", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 10:00 in Berlin on Monday 2026-10-12.
    vi.setSystemTime(new Date("2026-10-12T08:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns demo availability for all five courts", async () => {
    const res = GET(request("date=2026-10-13&duration=90"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=60");
    const body = availabilityResponseSchema.parse(await res.json());
    expect(body.courts).toHaveLength(5);
    expect(body.date).toBe("2026-10-13");
    expect(body.durationMinutes).toBe(90);
  });

  it("accepts the last day of the 7-day window", () => {
    expect(GET(request("date=2026-10-18&duration=60")).status).toBe(200);
  });

  it.each(["", "date=2026-10-13", "date=2026-02-30&duration=90", "date=2026-10-13&duration=45"])(
    "rejects the invalid query %j with 400",
    async (query) => {
      const res = GET(request(query));
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: "invalid_query" });
    },
  );

  it.each(["2026-10-11", "2026-10-19"])("rejects %s as out of range", async (date) => {
    const res = GET(request(`date=${date}&duration=90`));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "out_of_range" });
  });
});
