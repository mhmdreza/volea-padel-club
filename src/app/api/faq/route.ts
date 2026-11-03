import { NextResponse } from "next/server";

import { faqItems } from "@/content/faq";

export function GET() {
  return NextResponse.json({ items: faqItems });
}
