"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { NavLink } from "@/components/layout/nav-link";
import { Link } from "@/i18n/navigation";
import type { AppLinkHref } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggleSegmented } from "@/components/layout/theme-toggle";

export type MobileNavLink = { href: AppLinkHref; label: string };

export function MobileNav({
  navLinks,
  openMenuLabel,
  bookCourtLabel,
}: {
  navLinks: MobileNavLink[];
  openMenuLabel: string;
  bookCourtLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu />
          <span className="sr-only">{openMenuLabel}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Volea Padel</SheetTitle>
        </SheetHeader>
        <div className="px-6 pb-2">
          <ThemeToggleSegmented />
        </div>
        <nav className="flex flex-col gap-1 px-6">
          {navLinks.map((item) => (
            <NavLink
              key={item.href.toString()}
              href={item.href}
              onClick={() => setOpen(false)}
              className="text-foreground hover:bg-muted rounded-md px-2 py-2.5 text-sm font-medium"
              activeClassName="bg-muted border-primary rounded-l-none border-l-2"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto p-6">
          <Button asChild className="w-full">
            <Link href="/book" onClick={() => setOpen(false)}>
              {bookCourtLabel}
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
