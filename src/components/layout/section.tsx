import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function Section({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  // A single flat default (no sm:/lg: escalation) on purpose: tailwind-merge only
  // dedupes utilities within the same variant group, so a call-site override like
  // `className="py-8 sm:py-10"` would silently leave this default's `sm:`/`lg:`
  // steps in place and win at those breakpoints — which is exactly what happened
  // site-wide before this was caught (verified via computed styles, not guessed).
  return <section className={cn("py-16", className)} {...props} />;
}
