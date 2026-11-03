import { NextResponse } from "next/server";

import { events } from "@/content/events";

export function GET() {
  return NextResponse.json({ events });
}
