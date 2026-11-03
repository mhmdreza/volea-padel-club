"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Language");
  const [isPending, startTransition] = useTransition();

  const activeIndex = routing.locales.indexOf(currentLocale as (typeof routing.locales)[number]);

  return (
    <div
      role="group"
      aria-label={t("label")}
      aria-busy={isPending}
      className="border-border relative flex w-[76px] items-center rounded-full border p-0.5"
    >
      <span
        aria-hidden="true"
        className={cn(
          "bg-primary absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full transition-transform duration-200 ease-out",
          activeIndex === 1 && "translate-x-[calc(100%+2px)]",
        )}
      />
      {routing.locales.map((locale) => {
        const active = locale === currentLocale;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-current={active ? "true" : undefined}
            onClick={() => {
              // `scroll: false` keeps scroll position — the App Router's default
              // scroll-to-top on navigation otherwise reads as a jarring jump when
              // switching language mid-page.
              // The query is read at click time, not via useSearchParams: this
              // sits in the root layout, where that hook would opt every static
              // page into client rendering up to a Suspense boundary.
              const query = Object.fromEntries(new URLSearchParams(window.location.search));
              startTransition(() => {
                router.replace({ pathname, query }, { locale, scroll: false });
              });
            }}
            className={cn(
              "relative z-10 flex-1 rounded-full py-1 text-center text-xs font-medium transition-colors",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {locale.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
