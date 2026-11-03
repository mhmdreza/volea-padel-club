import { hasLocale } from "next-intl";
import { getMessages, getTimeZone } from "next-intl/server";
import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Providers } from "@/components/layout/providers";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { routing } from "@/i18n/routing";
import { SITE_NAME, SITE_URL } from "@/lib/metadata";
import "@/styles/globals.css";

// Self-hosted via next/font (no runtime Google Fonts CDN request). latin-ext
// covers German umlauts/ß.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

// Display face for headlines and numbers: its width axis lets headlines run wide
// and architectural (font-stretch) while Inter stays the body text.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Volea Padel Club Lindenau", template: `%s | ${SITE_NAME}` },
  description: "A fictional padel club in Lindenau: a sample front-end project.",
  // A sample site for a fictional club: the sitemap/canonical/hreflang setup is real
  // and inspectable, but search indexing is intentionally suppressed. No per-page metadata overrides
  // this field, so it applies site-wide.
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// `[locale]` is the root layout itself (owns <html>/<body>), not nested under a
// separate app/layout.tsx. This makes `locale` a genuine root parameter, so pages
// can read it via `next/root-params` and the tree stays statically generated —
// the previous split-layout setup relied on `getLocale()`/`setRequestLocale()`,
// which are deprecated and forced dynamic rendering.
export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const [messages, timeZone] = await Promise.all([getMessages(), getTimeZone()]);

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${archivo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers locale={locale} messages={messages} timeZone={timeZone}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
