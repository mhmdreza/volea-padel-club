import { useTranslations } from "next-intl";

import { Parallax } from "@/components/shared/parallax";
import { cn } from "@/lib/utils";

import { CourtMotif } from "@/components/shared/court-motif";

const NOTES = ["courts", "lounge", "opening"] as const;

// The same cut corner on the orange shell and the card inside it, so the border
// follows the diagonal too.
const CUT_OUTER = "[clip-path:polygon(0_0,calc(100%-18px)_0,100%_18px,100%_100%,0_100%)]";
const CUT_INNER = "[clip-path:polygon(0_0,calc(100%-17.4px)_0,100%_17.4px,100%_100%,0_100%)]";

/**
 * A drawing callout for what's planned in the hall: a note card
 * with a cut corner, an orange outline, a strip of construction-tape stripes, and a
 * dashed leader line pointing at the sheet.
 */
function Note({
  label,
  text,
  points,
  className,
}: {
  label: string;
  text: string;
  /** Which side the sheet is on, for the leader line. */
  points?: "left" | "right";
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {points && (
        <span
          aria-hidden="true"
          className={cn(
            "border-primary/70 absolute top-1/2 w-10 border-t-2 border-dashed",
            points === "right" ? "left-full" : "right-full",
          )}
        />
      )}
      <div className={cn("bg-primary p-[1.5px] shadow-lg", CUT_OUTER)}>
        <div className={cn("bg-background relative px-4 pt-5 pb-3", CUT_INNER)}>
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-1.5 bg-[repeating-linear-gradient(135deg,var(--primary)_0_5px,transparent_5px_10px)]"
          />
          <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] uppercase">
            <span aria-hidden="true" className="bg-primary size-1.5 rounded-full" />
            {label}
          </p>
          <p className="font-display mt-1 text-lg leading-tight font-bold [font-stretch:112%]">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * The planned hall as a drawing sheet: the court drawing inside corner marks, a title
 * block, and "planned" callouts drifting around it.
 */
export function HallFootage() {
  const t = useTranslations("Home.renovation");
  const block = [
    { label: t("block.project"), value: "Volea Padel Club Lindenau" },
    { label: t("block.subject"), value: t("block.subjectValue") },
    { label: t("block.source"), value: t("block.sourceValue") },
  ];
  const corner = "border-primary absolute size-4";

  return (
    <div className="relative mx-auto grid max-w-6xl items-center gap-6 lg:grid-cols-[1fr_minmax(0,46rem)_1fr]">
      <div className="hidden flex-col items-end gap-24 lg:flex">
        <Parallax speed={0.35}>
          <Note
            label={t("notes.label")}
            text={t("notes.courts")}
            points="right"
            className="-rotate-2"
          />
        </Parallax>
        <Parallax speed={-0.2}>
          <Note
            label={t("notes.label")}
            text={t("notes.lounge")}
            points="right"
            className="rotate-1"
          />
        </Parallax>
      </div>

      {/* The sheet drifts with the scroll at a steady size. */}
      <Parallax speed={-0.12}>
        <figure className="border-border bg-card/40 relative rounded-lg border p-3 sm:p-4">
          <span
            aria-hidden="true"
            className={cn(corner, "-top-px -left-px border-t-2 border-l-2")}
          />
          <span
            aria-hidden="true"
            className={cn(corner, "-top-px -right-px border-t-2 border-r-2")}
          />
          <span
            aria-hidden="true"
            className={cn(corner, "-bottom-px -left-px border-b-2 border-l-2")}
          />
          <span
            aria-hidden="true"
            className={cn(corner, "-right-px -bottom-px border-r-2 border-b-2")}
          />

          <div className="bg-muted/40 flex aspect-video items-center justify-center overflow-hidden rounded-md">
            <CourtMotif variant="lights" className="w-[88%]" />
          </div>

          <figcaption className="border-border mt-3 grid grid-cols-2 border-t text-xs sm:grid-cols-4">
            {block.map((cell) => (
              <div
                key={cell.label}
                className="border-border border-b px-2 py-2 sm:border-r sm:border-b-0"
              >
                <p className="text-muted-foreground text-[10px] tracking-[0.2em] uppercase">
                  {cell.label}
                </p>
                <p className="mt-0.5 font-medium">{cell.value}</p>
              </div>
            ))}
            <div className="border-border px-2 py-2 max-sm:border-b">
              <p className="text-muted-foreground text-[10px] tracking-[0.2em] uppercase">
                {t("block.status")}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 font-semibold">
                <span aria-hidden="true" className="relative flex size-2">
                  <span className="bg-primary absolute inset-0 rounded-full motion-safe:animate-ping" />
                  <span className="bg-primary relative size-2 rounded-full" />
                </span>
                {t("block.statusValue")}
              </p>
            </div>
          </figcaption>
        </figure>
      </Parallax>

      <div className="hidden lg:block">
        <Parallax speed={-0.3}>
          <Note
            label={t("notes.label")}
            text={t("notes.opening")}
            points="left"
            className="-rotate-1"
          />
        </Parallax>
      </div>

      {/* Phones and tablets: the same callouts as a row under the sheet. */}
      <div className="grid gap-3 sm:grid-cols-3 lg:hidden">
        {NOTES.map((note) => (
          <Note key={note} label={t("notes.label")} text={t(`notes.${note}`)} />
        ))}
      </div>
    </div>
  );
}
