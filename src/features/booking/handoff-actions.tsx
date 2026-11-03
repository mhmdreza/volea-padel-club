"use client";

import { ArrowRight, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/content/site";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const isPlaceholderUrl = (url: string) => url.startsWith("[[");

/**
 * Where a chosen slot goes next. Playtomic only links to the club page (it has no
 * deep link to a slot), so the visitor confirms the slot there; until that link
 * exists, the slot becomes a prefilled contact request instead.
 */
export function HandoffActions({
  requestMessage,
  compact = false,
  className,
}: {
  /** Undefined until court, date and time are all chosen. */
  requestMessage?: string;
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("Book.handoff");
  const playtomicUrl = isPlaceholderUrl(siteConfig.playtomicUrl)
    ? undefined
    : siteConfig.playtomicUrl;
  const label = playtomicUrl ? t("playtomic") : t("request");
  const complete = requestMessage !== undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {!complete ? (
        <Button size="lg" disabled className="h-11 w-full">
          {label}
        </Button>
      ) : playtomicUrl ? (
        <Button asChild size="lg" className="h-11 w-full">
          <a href={playtomicUrl} target="_blank" rel="noopener noreferrer">
            {label}
            <ExternalLink aria-hidden="true" />
          </a>
        </Button>
      ) : (
        <Button asChild size="lg" className="h-11 w-full">
          <Link
            href={{ pathname: "/contact", query: { type: "booking", message: requestMessage } }}
          >
            {label}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      )}
      {!compact && (
        <p className="text-muted-foreground text-xs">
          {playtomicUrl ? t("playtomicNote") : t("requestNote")}
        </p>
      )}
    </div>
  );
}
