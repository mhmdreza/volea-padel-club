"use client";

import type { ComponentPropsWithoutRef } from "react";

/**
 * An in-page `#anchor` link that glides to its target instead of jumping, without
 * turning on smooth scrolling for the whole document (which would also slow down the
 * hero's own scroll stepping). Jumps instantly under reduced motion; without JS it's
 * a plain anchor link.
 */
export function ScrollLink({
  href,
  onClick,
  ...props
}: ComponentPropsWithoutRef<"a"> & { href: `#${string}` }) {
  return (
    <a
      href={href}
      onClick={(e) => {
        onClick?.(e);
        const target = document.getElementById(href.slice(1));
        if (!target || e.defaultPrevented) return;
        e.preventDefault();
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        history.replaceState(null, "", href);
      }}
      {...props}
    />
  );
}
