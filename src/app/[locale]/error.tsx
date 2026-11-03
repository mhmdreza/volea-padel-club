"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { StatusPage } from "@/components/shared/status-page";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ErrorPage");

  useEffect(() => {
    // Logged client-side for now; a real error-tracking service (e.g. Sentry) can
    // hook in here later without changing the rest of this component.
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      word="LET"
      scene="let"
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      actions={
        <>
          <Button onClick={() => reset()} size="lg">
            {t("retry")}
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">{t("cta")}</Link>
          </Button>
        </>
      }
    />
  );
}
