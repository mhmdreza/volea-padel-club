"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * A two-or-more-way tab switch with one orange pill sliding to the active tab, for use
 * inside a Radix `Tabs`. The generated trigger styles key off data-active, which Radix
 * doesn't set, so the states are styled here off data-state.
 */
export function SlidingTabsList<T extends string>({
  label,
  items,
  value,
}: {
  label: string;
  items: readonly { value: T; label: string }[];
  value: T;
}) {
  const index = Math.max(
    0,
    items.findIndex((item) => item.value === value),
  );
  const share = 100 / items.length;

  return (
    <TabsList
      aria-label={label}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      className="relative grid h-auto rounded-md"
    >
      <span
        aria-hidden="true"
        style={{
          width: `calc(${share}% - ${0.5 / items.length}rem)`,
          transform: `translateX(${index * 100}%)`,
        }}
        className="bg-primary absolute inset-y-1 left-1 rounded-sm shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none"
      />
      {items.map((item) => (
        <TabsTrigger
          key={item.value}
          value={item.value}
          className="text-foreground dark:text-foreground data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground relative z-10 rounded-sm px-4 py-1.5 transition-colors duration-300"
        >
          {item.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
