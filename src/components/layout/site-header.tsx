import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { locale as getRootLocale } from "next/root-params";

import { Container } from "@/components/layout/container";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavLink } from "@/components/layout/nav-link";
import type { MobileNavLink } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppLinkHref } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";

export async function SiteHeader() {
  const t = await getTranslations("Nav");
  const locale = await getRootLocale();

  const offerLinks: { href: AppLinkHref; label: string }[] = [
    { href: "/training", label: t("training") },
    { href: "/events", label: t("events") },
    { href: "/vouchers", label: t("vouchers") },
  ];

  const mobileNavLinks: MobileNavLink[] = [
    { href: "/courts", label: t("courts") },
    ...offerLinks,
    { href: "/lounge", label: t("lounge") },
    { href: "/sponsoring", label: t("sponsoring") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <header className="border-border bg-background/90 sticky top-0 z-50 border-b supports-backdrop-filter:backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="font-display flex items-center gap-2 text-lg font-bold tracking-tight whitespace-nowrap [font-stretch:112%]"
        >
          {/* The logo's top row of dots, as a small mark. */}
          <svg viewBox="0 0 30 8" aria-hidden="true" className="fill-primary h-2 w-auto">
            <circle cx="4" cy="4" r="3.2" />
            <circle cx="15" cy="4" r="3.2" />
            <circle cx="26" cy="4" r="3.2" />
          </svg>
          Volea Padel
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
          <NavLink
            href="/courts"
            className="hover:text-primary"
            activeClassName="decoration-primary underline decoration-2 underline-offset-8"
          >
            {t("courts")}
          </NavLink>

          <DropdownMenu>
            <DropdownMenuTrigger className="hover:text-primary flex items-center gap-1 outline-none">
              {t("offers")}
              <ChevronDown className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {offerLinks.map((item) => (
                <DropdownMenuItem key={item.href.toString()} asChild>
                  <NavLink href={item.href} activeClassName="text-primary font-semibold">
                    {item.label}
                  </NavLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <NavLink
            href="/lounge"
            className="hover:text-primary"
            activeClassName="decoration-primary underline decoration-2 underline-offset-8"
          >
            {t("lounge")}
          </NavLink>
          <NavLink
            href="/sponsoring"
            className="hover:text-primary"
            activeClassName="decoration-primary underline decoration-2 underline-offset-8"
          >
            {t("sponsoring")}
          </NavLink>
          <NavLink
            href="/contact"
            className="hover:text-primary"
            activeClassName="decoration-primary underline decoration-2 underline-offset-8"
          >
            {t("contact")}
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher currentLocale={locale ?? "en"} />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/book">{t("bookCourt")}</Link>
          </Button>
          <MobileNav
            navLinks={mobileNavLinks}
            openMenuLabel={t("openMenu")}
            bookCourtLabel={t("bookCourt")}
          />
        </div>
      </Container>
    </header>
  );
}
