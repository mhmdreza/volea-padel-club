import type { ReactNode } from "react";

import { Link, type AppLinkHref } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TONES = {
  glass: "border-border bg-card/40 backdrop-blur-sm",
  muted: "border-border bg-muted/40",
} as const;

/**
 * The homepage teaser-card surface (sharp radius, translucent card, thin border) for
 * inner pages, instead of shadcn's rounder, shadowed Card.
 */
export function GlassPanel({
  as: Tag = "div",
  href,
  tone = "glass",
  className,
  children,
}: {
  as?: "div" | "li" | "article";
  href?: AppLinkHref;
  tone?: keyof typeof TONES;
  className?: string;
  children: ReactNode;
}) {
  const surface = cn("rounded-lg border p-6", TONES[tone]);

  if (!href) return <Tag className={cn(surface, className)}>{children}</Tag>;

  return (
    <Tag>
      <Link
        href={href}
        className={cn(
          surface,
          "group hover:border-primary/60 focus-visible:ring-ring focus-visible:ring-offset-background block h-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          className,
        )}
      >
        {children}
      </Link>
    </Tag>
  );
}
