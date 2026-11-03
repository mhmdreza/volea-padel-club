import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function Container({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    // max-width will be revisited once design tokens land; 1280px matches the plan's container spec.
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />
  );
}
