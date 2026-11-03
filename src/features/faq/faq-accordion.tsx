"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { localize } from "@/lib/i18n-content";

import { highlight, matches } from "./faq-search";
import { useFaq } from "./use-faq";

function Marked({ text, query }: { text: string; query: string }) {
  return highlight(text, query).map((segment, i) =>
    segment.match ? (
      <mark key={i} className="bg-primary/30 text-foreground rounded-sm">
        {segment.text}
      </mark>
    ) : (
      segment.text
    ),
  );
}

/** Searchable FAQ: filter + count in a sticky aside on large screens, answers on the right. */
export function FaqAccordion({ aside }: { aside?: ReactNode }) {
  const locale = useLocale();
  const t = useTranslations("Faq");
  const { data: items, isLoading, isError } = useFaq();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string[]>([]);
  const inputId = useId();

  const localized = (items ?? []).map((item) => ({
    id: item.id,
    question: localize(item.question, locale),
    answer: localize(item.answer, locale),
  }));
  const visible = localized.filter((item) => matches(query, item.question, item.answer));

  const search = (value: string) => {
    setQuery(value);
    // Open the matches so highlighted answers are visible; collapse all when cleared.
    setOpen(
      value.trim()
        ? localized.filter((i) => matches(value, i.question, i.answer)).map((i) => i.id)
        : [],
    );
  };

  let list: ReactNode;
  if (isLoading) {
    list = (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  } else if (isError || localized.length === 0) {
    list = <p className="text-muted-foreground text-sm">{t("loadError")}</p>;
  } else if (visible.length === 0) {
    list = (
      <div className="border-border flex flex-col items-start gap-3 rounded-lg border border-dashed px-6 py-8">
        <p className="font-semibold">{t("search.emptyTitle", { query: query.trim() })}</p>
        <p className="text-muted-foreground text-sm">{t("search.emptyText")}</p>
        <Button variant="outline" size="sm" onClick={() => search("")}>
          {t("search.clear")}
        </Button>
      </div>
    );
  } else {
    list = (
      <Accordion type="multiple" value={open} onValueChange={setOpen}>
        {visible.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger>
              <span>
                <Marked text={item.question} query={query} />
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <Marked text={item.answer} query={query} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
      <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-col gap-2">
          <label htmlFor={inputId} className="text-sm font-semibold">
            {t("search.label")}
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              id={inputId}
              type="search"
              value={query}
              onChange={(e) => search(e.target.value)}
              placeholder={t("search.placeholder")}
              className="border-border h-11 rounded-lg border pl-9"
            />
          </div>
          <p role="status" className="text-muted-foreground text-sm">
            {query.trim() && !isLoading ? t("search.count", { count: visible.length }) : ""}
          </p>
        </div>
        <div className="hidden lg:block">{aside}</div>
      </aside>
      <div>{list}</div>
      <div className="lg:hidden">{aside}</div>
    </div>
  );
}
