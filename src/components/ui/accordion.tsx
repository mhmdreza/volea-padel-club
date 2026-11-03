"use client";

import * as React from "react";
import { cn } from "cn";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { PlusIcon } from "lucide-react";

function Accordion({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  );
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        "border-border bg-card data-open:border-primary/40 overflow-hidden rounded-xl border transition-colors",
        className,
      )}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger hover:bg-muted/50 relative flex flex-1 items-center justify-between gap-6 p-5 text-left text-base font-semibold transition-colors outline-none disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
        <span
          data-slot="accordion-trigger-icon"
          className="border-border text-primary group-data-open/accordion-trigger:bg-primary group-data-open/accordion-trigger:text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors"
        >
          <PlusIcon className="size-4 transition-transform group-aria-expanded/accordion-trigger:rotate-45" />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-open:animate-accordion-down data-closed:animate-accordion-up overflow-hidden px-5 text-sm"
      {...props}
    >
      <div
        className={cn(
          // No explicit height here — AccordionPrimitive.Content already animates
          // its own height via this CSS var; also pinning the inner div to it
          // creates a circular measurement that can desync from the actual content
          // height when the viewport width changes (different text wrapping) while open.
          "text-muted-foreground [&_a]:hover:text-foreground pt-0 pb-5 leading-relaxed [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
