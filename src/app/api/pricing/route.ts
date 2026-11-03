import { NextResponse } from "next/server";

import { pricingAddOns, pricingSpecials, pricingTiers } from "@/content/pricing";

export function GET() {
  return NextResponse.json({
    tiers: pricingTiers,
    specials: pricingSpecials,
    addOns: pricingAddOns,
  });
}
