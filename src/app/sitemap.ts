import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/metadata";

// Routing pathnames are identical across locales (see CLAUDE.md), so URLs are a
// plain concatenation — no pathname translation lookup needed.
const paths = Object.keys(routing.pathnames);

function localizedUrl(locale: string, path: string) {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const suffix = path === "/" ? "" : path;
  return `${SITE_URL}${prefix}${suffix}` || SITE_URL;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({
    url: localizedUrl(routing.defaultLocale, path),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [locale, localizedUrl(locale, path)]),
      ),
    },
  }));
}
