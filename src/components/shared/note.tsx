import type { ReactNode } from "react";

import { Link, type AppLinkHref } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** A quiet aside — policy pointers, disclaimers, small print with an optional link. */
export function Note({
  children,
  link,
  className,
}: {
  children: ReactNode;
  link?: { href: AppLinkHref; label: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border bg-muted/40 flex flex-col gap-2 rounded-lg border px-6 py-5 text-sm",
        className,
      )}
    >
      <div className="text-pretty">{children}</div>
      {link && (
        <Link
          href={link.href}
          className="text-foreground hover:text-primary w-fit font-medium underline underline-offset-2"
        >
          {link.label}
        </Link>
      )}
    </div>
  );
}
