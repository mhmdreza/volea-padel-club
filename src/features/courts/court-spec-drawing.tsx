"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { SlidingTabsList } from "@/components/shared/sliding-tabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Standard regulation padel dimensions (metres) — the sport's rules, not a plan of our hall.
const LENGTH = 20;
const WIDTHS = { doubles: 10, singles: 6 } as const;
const SERVICE_FROM_NET = 6.95;
// Side walls are glass for the first 4 m from each back wall, mesh in between.
const SIDE_GLASS = 4;

type Kind = keyof typeof WIDTHS;
const KINDS = ["doubles", "singles"] as const;

// Everything on the court is drawn at doubles width (10 m) and squeezed with scaleY, so
// one CSS transform morphs between the two; non-scaling strokes keep lines crisp.
const NSS = { vectorEffect: "non-scaling-stroke" } as const;
const MORPH = "motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out";

export function CourtSpecDrawing() {
  const t = useTranslations("Courts.spec");
  const kindT = useTranslations("Courts.kind");
  const locale = useLocale();
  const [kind, setKind] = useState<Kind>("doubles");
  const width = WIDTHS[kind];
  const half = (width - 10) / 2;
  const metres = (value: number) =>
    `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)} m`;

  return (
    <figure className="flex flex-col gap-6">
      <Tabs value={kind} onValueChange={(value) => setKind(value as Kind)}>
        <SlidingTabsList
          label={t("toggleLabel")}
          items={KINDS.map((k) => ({ value: k, label: kindT(k) }))}
          value={kind}
        />
        {/* Both sizes share one grid cell and cross-fade; the hidden one stays out of the
            accessibility tree and the tab order. */}
        <div className="mt-2 grid">
          {KINDS.map((k) => (
            <TabsContent
              key={k}
              value={k}
              forceMount
              aria-hidden={kind !== k}
              tabIndex={kind === k ? 0 : -1}
              className="col-start-1 row-start-1 mt-0 transition-opacity duration-500 data-[state=inactive]:pointer-events-none data-[state=inactive]:opacity-0 motion-reduce:transition-none"
            >
              <p className="font-display text-2xl font-bold tracking-tight [font-stretch:112%]">
                {metres(LENGTH)} × {metres(WIDTHS[k])}
              </p>
            </TabsContent>
          ))}
        </div>
      </Tabs>

      <svg
        viewBox="-2.6 -2.4 25.2 14.8"
        role="img"
        aria-label={t("drawingLabel", { length: metres(LENGTH), width: metres(width) })}
        className="w-full overflow-visible"
      >
        {/* Length, below the court: follows the bottom edge as it moves. */}
        <g className={MORPH} style={{ transform: `translateY(${half}px)` }}>
          <g className="stroke-muted-foreground" strokeWidth="1" {...NSS}>
            <line x1="0" y1="11.3" x2={LENGTH} y2="11.3" {...NSS} />
            <line x1="0" y1="10.9" x2="0" y2="11.7" {...NSS} />
            <line x1={LENGTH} y1="10.9" x2={LENGTH} y2="11.7" {...NSS} />
          </g>
          <text
            x="10"
            y="11.05"
            textAnchor="middle"
            className="fill-muted-foreground text-[0.95px] sm:text-[0.6px]"
          >
            {metres(LENGTH)}
          </text>
        </g>

        {/* Service-line distance, above the court. */}
        <g className={MORPH} style={{ transform: `translateY(${-half}px)` }}>
          <g className="stroke-muted-foreground" strokeWidth="1">
            <line x1="10" y1="-1.3" x2={10 + SERVICE_FROM_NET} y2="-1.3" {...NSS} />
            <line x1="10" y1="-1.7" x2="10" y2="-0.9" {...NSS} />
            <line
              x1={10 + SERVICE_FROM_NET}
              y1="-1.7"
              x2={10 + SERVICE_FROM_NET}
              y2="-0.9"
              {...NSS}
            />
          </g>
          <text
            x={10 + SERVICE_FROM_NET / 2}
            y="-1.6"
            textAnchor="middle"
            className="fill-muted-foreground text-[0.95px] sm:text-[0.6px]"
          >
            {metres(SERVICE_FROM_NET)}
          </text>
          <text
            x="9.7"
            y="-0.75"
            textAnchor="end"
            className="fill-foreground text-[0.95px] font-semibold sm:text-[0.6px]"
          >
            {t("net")}
          </text>
        </g>

        <g
          className={MORPH}
          style={{ transform: `scaleY(${width / 10})`, transformOrigin: "10px 5px" }}
        >
          <rect x="0" y="0" width={LENGTH} height="10" className="fill-scene-glass/10" />
          {/* Court lines: service lines and the centre service line. */}
          <g className="stroke-foreground" strokeOpacity="0.6" strokeWidth="1.5">
            <line x1={10 - SERVICE_FROM_NET} y1="0" x2={10 - SERVICE_FROM_NET} y2="10" {...NSS} />
            <line x1={10 + SERVICE_FROM_NET} y1="0" x2={10 + SERVICE_FROM_NET} y2="10" {...NSS} />
            <line x1={10 - SERVICE_FROM_NET} y1="5" x2={10 + SERVICE_FROM_NET} y2="5" {...NSS} />
          </g>
          {/* Walls: glass at the back and the first 4 m of each side, mesh between. */}
          <g className="stroke-scene-glass" strokeWidth="4" strokeLinecap="square" fill="none">
            <polyline points={`${SIDE_GLASS},0 0,0 0,10 ${SIDE_GLASS},10`} {...NSS} />
            <polyline
              points={`${LENGTH - SIDE_GLASS},0 ${LENGTH},0 ${LENGTH},10 ${LENGTH - SIDE_GLASS},10`}
              {...NSS}
            />
          </g>
          <g
            className="stroke-scene-glass"
            strokeWidth="2"
            strokeDasharray="3 4"
            strokeOpacity="0.8"
          >
            <line x1={SIDE_GLASS} y1="0" x2={LENGTH - SIDE_GLASS} y2="0" {...NSS} />
            <line x1={SIDE_GLASS} y1="10" x2={LENGTH - SIDE_GLASS} y2="10" {...NSS} />
          </g>
          <line
            x1="10"
            y1="-0.3"
            x2="10"
            y2="10.3"
            className="stroke-primary"
            strokeWidth="3"
            {...NSS}
          />
        </g>

        {/* Width, left of the court: the bracket scales, the label stays centred. */}
        <g
          className={`stroke-muted-foreground ${MORPH}`}
          strokeWidth="1"
          style={{ transform: `scaleY(${width / 10})`, transformOrigin: "10px 5px" }}
        >
          <line x1="-1.2" y1="0" x2="-1.2" y2="10" {...NSS} />
          <line x1="-1.6" y1="0" x2="-0.8" y2="0" {...NSS} />
          <line x1="-1.6" y1="10" x2="-0.8" y2="10" {...NSS} />
        </g>
        <text
          x="-1.5"
          y="5"
          textAnchor="middle"
          transform="rotate(-90 -1.5 5)"
          className="fill-muted-foreground text-[0.95px] sm:text-[0.6px]"
        >
          {metres(width)}
        </text>
      </svg>

      <figcaption className="text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="text-foreground font-semibold">{t("caption")}</span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="bg-scene-glass h-1 w-6 rounded-full" />
          {t("glass")}
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="border-scene-glass w-6 border-t-2 border-dashed" />
          {t("mesh")}
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="bg-primary h-1 w-6 rounded-full" />
          {t("net")}
        </span>
      </figcaption>
    </figure>
  );
}
