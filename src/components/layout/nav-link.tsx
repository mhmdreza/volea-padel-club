"use client";

import type { ComponentProps } from "react";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** A nav link that marks the page you're on (aria-current plus `activeClassName`). */
export function NavLink({
  href,
  className,
  activeClassName,
  ...props
}: ComponentProps<typeof Link> & { activeClassName?: string }) {
  const pathname = usePathname();
  const target = typeof href === "string" ? href : href.pathname;
  const active = pathname === target || pathname.startsWith(`${target}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(className, active && activeClassName)}
      {...props}
    />
  );
}
