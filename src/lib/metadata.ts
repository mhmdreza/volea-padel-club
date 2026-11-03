import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { routing } from "@/i18n/routing";

// NEXT_PUBLIC_SITE_URL wins; on Vercel the production domain is known at build time.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
export const SITE_NAME = "Volea Padel";

// Routing pathnames are currently identical across locales (no localized German
// slugs — see CLAUDE.md), so building a locale URL is a plain concatenation, no
// pathname translation lookup needed.
function localizedUrl(locale: string, path: string) {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const suffix = path === "/" ? "" : path;
  return `${SITE_URL}${prefix}${suffix}` || SITE_URL;
}

export function buildMetadata({
  locale,
  path,
  title,
  description,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
}): Metadata {
  const canonical = localizedUrl(locale, path);
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = localizedUrl(loc, path);
  }
  languages["x-default"] = localizedUrl(routing.defaultLocale, path);

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: locale === "de" ? "de_DE" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// Shared by the 5 legal pages: title comes from the existing Footer.<key> label
// (already translated), description reuses the "draft, pending legal review"
// notice shown on the page itself — accurate rather than inventing new SEO copy
// for content that's explicitly marked as a draft.
export async function buildLegalMetadata({
  locale,
  path,
  footerKey,
}: {
  locale: string;
  path: string;
  footerKey: string;
}): Promise<Metadata> {
  const [footerT, legalT] = await Promise.all([
    getTranslations({ locale, namespace: "Footer" }),
    getTranslations({ locale, namespace: "Legal" }),
  ]);
  return buildMetadata({
    locale,
    path,
    title: footerT(footerKey),
    description: legalT("draftNotice"),
  });
}
