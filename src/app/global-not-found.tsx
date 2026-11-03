import Link from "next/link";
import { Archivo, Inter } from "next/font/google";
import type { Metadata } from "next";

import { STATUS_LINK_CLASS, StatusPage } from "@/components/shared/status-page";
import { Button } from "@/components/ui/button";
import "@/styles/globals.css";

// Bypasses the [locale] layout entirely (per Next's docs, a dynamic-segment root
// layout can't reliably compose with a normal not-found.tsx), so it must import
// its own styles/fonts and can't use next-intl — this is the true last-resort
// fallback (invalid locale codes, garbage paths), kept in English only.
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "Out of Bounds — Volea Padel Club Lindenau",
  description: "The page you're looking for doesn't exist or has moved.",
};

// Mirrors next-themes' own anti-flash script (same "theme" localStorage key) since
// this page bypasses ThemeProvider entirely and would otherwise always render light,
// ignoring both the visitor's saved preference and the OS color scheme.
// English routes have no prefix, so plain links work without next-intl here.
const LINKS = [
  { href: "/courts", label: "Courts & Pricing" },
  { href: "/book", label: "Book a Court" },
  { href: "/faq", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

const THEME_SCRIPT = `(function(){try{var e=localStorage.getItem("theme");var d=e==="dark"||(e!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(t){}})();`;

export default function GlobalNotFound() {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${archivo.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="bg-background text-foreground flex min-h-screen flex-col justify-center font-sans">
        <StatusPage
          word="404"
          scene="out"
          eyebrow="404 · Page not found"
          title="Out of Bounds"
          description="That ball flew right out of the court — the page you're looking for doesn't exist or has moved."
          actions={
            <Button asChild size="lg">
              <Link href="/">Back to Home</Link>
            </Button>
          }
        >
          <nav aria-labelledby="global-not-found-links" className="mt-4 w-full max-w-md">
            <h2 id="global-not-found-links" className="text-sm font-semibold">
              Maybe you were looking for
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={STATUS_LINK_CLASS}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </StatusPage>
      </body>
    </html>
  );
}
