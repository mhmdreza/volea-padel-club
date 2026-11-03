import { NextResponse } from "next/server";

import { coaches, trainingPrograms } from "@/content/training";

export function GET() {
  return NextResponse.json({ coaches, programs: trainingPrograms });
}
