import { defineRouting } from "next-intl/routing";

export const locales = ["en", "de"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/courts": "/courts",
    "/book": "/book",
    "/training": "/training",
    "/events": "/events",
    "/lounge": "/lounge",
    "/sponsoring": "/sponsoring",
    "/contact": "/contact",
    "/about": "/about",
    "/faq": "/faq",
    "/vouchers": "/vouchers",
    "/impressum": "/impressum",
    "/agb": "/agb",
    "/hausordnung": "/hausordnung",
    "/datenschutz": "/datenschutz",
    "/widerruf": "/widerruf",
  },
});
