"use client";

import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import type { ReactNode } from "react";

import { QueryProvider } from "@/components/layout/query-provider";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

// All client-side context providers for the app, composed in one place so
// `layout.tsx` stays declarative as more providers get added (e.g. cookie consent).
export function Providers({
  locale,
  messages,
  timeZone,
  children,
}: {
  locale: string;
  messages: AbstractIntlMessages;
  timeZone: string;
  children: ReactNode;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
      <QueryProvider>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </QueryProvider>
    </NextIntlClientProvider>
  );
}
