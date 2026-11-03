import { NextResponse } from "next/server";

import { sponsors, sponsorTiers } from "@/content/sponsors";

export function GET() {
  return NextResponse.json({ tiers: sponsorTiers, sponsors });
}
