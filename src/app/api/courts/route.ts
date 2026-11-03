import { NextResponse } from "next/server";

import { courts } from "@/content/courts";

export function GET() {
  return NextResponse.json({ courts });
}
