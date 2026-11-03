"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useSyncExternalStore, type RefObject } from "react";
import { flushSync } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const THEMES = ["light", "dark", "system"] as const;

const noopSubscribe = () => () => {};

// next-themes can't know the resolved theme on the server, so both components
// below render a neutral placeholder until mounted client-side to avoid a
// hydration mismatch — useSyncExternalStore (rather than an effect-driven
// setState) gives the "has this hydrated yet" flag without a lint complaint
// about setting state synchronously inside an effect body.
function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

type Theme = (typeof THEMES)[number];

/**
 * Switching theme turns the hall lights on or off: the new theme spreads as a circle
 * from the control that was used (View Transitions API). Browsers without the API,
 * and visitors who prefer reduced motion, get the plain instant switch.
 */
function useLightsSwitch() {
  const { setTheme, resolvedTheme } = useTheme();
  return useCallback(
    (next: Theme, origin: RefObject<HTMLElement | null>) => {
      const dark =
        next === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
          : next === "dark";
      const unchanged = (resolvedTheme === "dark") === dark;
      if (
        unchanged ||
        !document.startViewTransition ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        setTheme(next);
        return;
      }
      const root = document.documentElement;
      const rect = origin.current?.getBoundingClientRect();
      const x = rect ? rect.left + rect.width / 2 : innerWidth / 2;
      const y = rect ? rect.top + rect.height / 2 : 0;
      root.style.setProperty("--lights-x", `${x}px`);
      root.style.setProperty("--lights-y", `${y}px`);
      root.style.setProperty(
        "--lights-r",
        `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`,
      );
      // Scopes the circle animation to theme switches; page navigations use their own.
      root.classList.add("lights-switch");
      const transition = document.startViewTransition(() => {
        // next-themes applies its class in an effect; flip it here so the "after"
        // snapshot is already in the new theme, then let next-themes record it.
        root.classList.toggle("dark", dark);
        root.classList.toggle("light", !dark);
        root.style.colorScheme = dark ? "dark" : "light";
        flushSync(() => setTheme(next));
      });
      void transition.finished.finally(() => root.classList.remove("lights-switch"));
    },
    [resolvedTheme, setTheme],
  );
}

/** Icon-only dropdown for the desktop header. next-themes can't know the
 * resolved theme on the server, so the icon renders a neutral placeholder
 * until mounted client-side to avoid a hydration mismatch. */
export function ThemeToggle() {
  const t = useTranslations("Theme");
  const { theme, resolvedTheme } = useTheme();
  const mounted = useMounted();
  const switchTheme = useLightsSwitch();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const icons = { light: Sun, dark: Moon, system: Monitor } as const;
  const Icon = mounted ? icons[(resolvedTheme as "light" | "dark") ?? "light"] : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button ref={triggerRef} variant="ghost" size="icon" aria-label={t("label")}>
          <Icon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map((value) => (
          <DropdownMenuItem
            key={value}
            onSelect={() => switchTheme(value, triggerRef)}
            aria-current={mounted && theme === value ? "true" : undefined}
          >
            {value === "light" && <Sun className="size-4" />}
            {value === "dark" && <Moon className="size-4" />}
            {value === "system" && <Monitor className="size-4" />}
            {t(value)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Three-way segmented control for the mobile Sheet, matching the LocaleSwitcher's
 * pill style rather than another dropdown stacked inside an already-open sheet. */
export function ThemeToggleSegmented() {
  const t = useTranslations("Theme");
  const { theme } = useTheme();
  const mounted = useMounted();
  const switchTheme = useLightsSwitch();
  const groupRef = useRef<HTMLDivElement>(null);

  const active = mounted ? (theme ?? "system") : "system";

  return (
    <div
      ref={groupRef}
      role="group"
      aria-label={t("label")}
      className="border-border flex gap-1 rounded-full border p-0.5"
    >
      {THEMES.map((value) => {
        const isActive = active === value;
        const Icon = value === "light" ? Sun : value === "dark" ? Moon : Monitor;
        return (
          <button
            key={value}
            type="button"
            aria-current={isActive ? "true" : undefined}
            onClick={() => switchTheme(value, groupRef)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {t(value)}
          </button>
        );
      })}
    </div>
  );
}
