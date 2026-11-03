import { cn } from "@/lib/utils";

export type TimelineEntry = {
  id: string;
  /** Free text ("November 2026") or a formatted `startsAt` date once events are scheduled. */
  when: string;
  title: string;
  text: string;
  now?: boolean;
};

/**
 * The road to opening as a vertical line of stops. Built from facts we already state;
 * dated club events (`ClubEvent.startsAt`) can be appended as more entries later.
 */
export function EventsTimeline({
  entries,
  nowLabel,
}: {
  entries: TimelineEntry[];
  nowLabel: string;
}) {
  return (
    <ol className="border-border relative ml-2 border-l">
      {entries.map((entry) => (
        <li key={entry.id} className="relative pb-10 pl-8 last:pb-0">
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-1.5 -left-[7px] size-3.5 rounded-full border-2",
              entry.now
                ? "bg-primary border-primary ring-primary/25 ring-4"
                : "border-scene-glass bg-background",
            )}
          />
          <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase">
            {entry.when}
            {entry.now && (
              <span className="border-primary/60 text-foreground dark:text-primary rounded-sm border px-1.5 py-0.5 tracking-[0.16em]">
                {nowLabel}
              </span>
            )}
          </p>
          <h3 className="font-display mt-2 text-xl font-bold tracking-tight [font-stretch:112%]">
            {entry.title}
          </h3>
          <p className="text-muted-foreground mt-1 max-w-md text-sm">{entry.text}</p>
        </li>
      ))}
    </ol>
  );
}
