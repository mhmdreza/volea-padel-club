"use client";

import { useTranslations } from "next-intl";
import { useRef, type KeyboardEvent } from "react";

import type { Court } from "@/types/content";
import { cn } from "@/lib/utils";

import {
  CEILING_LIGHTS,
  courtLines,
  courtRect,
  glassWalls,
  HALL,
  meshStrips,
  netLine,
  PLAN_ORDER,
} from "./lib/hall-layout";

export type PlanCourt = {
  id: string;
  kind: Court["kind"];
  name: string;
  /** Undefined while availability is loading. */
  freeCount?: number;
  /** Bookable starts that day, so the floor heat compares like with like. */
  slotCount?: number;
};

const stop = (color: string, opacity: number) => ({
  stopColor: `var(${color})`,
  stopOpacity: opacity,
});

/**
 * The hall from above as a radio group: one court per radio, a roving tab stop,
 * arrows/Home/End to move, Space/Enter to choose. Every court is labelled with its
 * name and free-slot count; the drawing itself is decoration.
 */
export function CourtPlan({
  courts,
  selectedId,
  highlightIds,
  onSelect,
}: {
  courts: PlanCourt[];
  selectedId?: string;
  /** Courts free at the time the visitor is pointing at in the slot grid. */
  highlightIds?: ReadonlySet<string>;
  onSelect: (courtId: string) => void;
}) {
  const t = useTranslations("Book.plan");
  const radioRefs = useRef<Record<string, SVGGElement | null>>({});

  const ordered = PLAN_ORDER.flatMap((id) => courts.find((c) => c.id === id) ?? []);
  const tabStop = selectedId ?? ordered[0]?.id;

  function move(from: string, event: KeyboardEvent) {
    const index = ordered.findIndex((c) => c.id === from);
    const last = ordered.length - 1;
    const target = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowDown: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      onSelect(from);
      return;
    }
    if (target === undefined) return;
    event.preventDefault();
    const next = ordered[target]!.id;
    // Radio semantics: moving the focus also checks the court.
    onSelect(next);
    radioRefs.current[next]?.focus();
  }

  return (
    <figure id="court-plan" className="scroll-mt-24">
      <svg
        role="radiogroup"
        aria-label={t("label")}
        viewBox={`0 0 ${HALL.width} ${HALL.height}`}
        className="border-border bg-card block h-auto w-full rounded-lg border"
      >
        <defs>
          <radialGradient id="booking-halo">
            <stop offset="0" style={stop("--scene-light", 0.7)} />
            <stop offset="1" style={stop("--scene-light", 0)} />
          </radialGradient>
          <radialGradient id="booking-pool">
            <stop offset="0" style={stop("--scene-light", 0.35)} />
            <stop offset="1" style={stop("--scene-light", 0)} />
          </radialGradient>
          <pattern
            id="booking-mesh"
            width="3"
            height="3"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="3" className="stroke-scene-glass" strokeOpacity="0.6" />
          </pattern>
        </defs>

        {ordered.map((court) => {
          const rect = courtRect(court.id);
          const checked = court.id === selectedId;
          const heat = court.slotCount ? (court.freeCount ?? 0) / court.slotCount : 0;
          const label =
            court.freeCount === undefined
              ? court.name
              : t("court", { name: court.name, count: court.freeCount });
          const number = court.id.split("-")[1];
          const cx = rect.x + rect.w / 2;

          return (
            <g
              key={court.id}
              ref={(el) => {
                radioRefs.current[court.id] = el;
              }}
              role="radio"
              aria-checked={checked}
              aria-label={label}
              tabIndex={court.id === tabStop ? 0 : -1}
              onClick={() => onSelect(court.id)}
              onKeyDown={(event) => move(court.id, event)}
              className="group cursor-pointer outline-none"
            >
              <g aria-hidden="true">
                <rect
                  x={rect.x - 6}
                  y={rect.y - 6}
                  width={rect.w + 12}
                  height={rect.h + 12}
                  rx="3"
                  fill="none"
                  strokeWidth="2.5"
                  className="stroke-ring opacity-0 group-focus-visible:opacity-100"
                />
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.w}
                  height={rect.h}
                  className="fill-secondary"
                />
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.w}
                  height={rect.h}
                  className="fill-primary transition-opacity duration-500 motion-reduce:transition-none"
                  style={{ opacity: 0.03 + heat * 0.27 }}
                />
                {checked && (
                  <ellipse
                    cx={cx}
                    cy={rect.y + rect.h / 2}
                    rx={rect.w * 0.75}
                    ry={rect.h * 0.55}
                    fill="url(#booking-pool)"
                  />
                )}
                <g className="stroke-foreground" strokeOpacity="0.45" strokeWidth="1">
                  {courtLines(rect).map(([x1, y1, x2, y2]) => (
                    <line key={`${x1},${y1},${x2}`} x1={x1} y1={y1} x2={x2} y2={y2} />
                  ))}
                </g>
                <line
                  x1={netLine(rect)[0]}
                  y1={netLine(rect)[1]}
                  x2={netLine(rect)[2]}
                  y2={netLine(rect)[3]}
                  className="stroke-foreground"
                  strokeOpacity="0.7"
                  strokeWidth="2"
                />
                {meshStrips(rect).map((strip) => (
                  <rect
                    key={strip.x}
                    x={strip.x}
                    y={strip.y}
                    width={strip.w}
                    height={strip.h}
                    fill="url(#booking-mesh)"
                  />
                ))}
                <g fill="none" strokeWidth="2.5" className="stroke-scene-glass">
                  {glassWalls(rect).map((d) => (
                    <path key={d} d={d} />
                  ))}
                </g>
                {/* Mounted only while checked, so choosing a court replays the draw
                    and the ball drop; with reduced motion both start finished. */}
                {checked && (
                  <>
                    <g
                      fill="none"
                      strokeDasharray="1"
                      className="stroke-primary motion-safe:animate-line-draw [stroke-dashoffset:0]"
                    >
                      <rect
                        x={rect.x}
                        y={rect.y}
                        width={rect.w}
                        height={rect.h}
                        pathLength={1}
                        strokeWidth="3"
                      />
                      {courtLines(rect).map(([x1, y1, x2, y2]) => (
                        <line
                          key={`${x1},${y1},${x2}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          pathLength={1}
                          strokeWidth="1.5"
                        />
                      ))}
                    </g>
                    <ellipse
                      cx={cx + rect.w / 4}
                      cy={rect.y + 152}
                      rx="5"
                      ry="1.6"
                      className="fill-foreground"
                      opacity="0.25"
                    />
                    <circle
                      cx={cx + rect.w / 4}
                      cy={rect.y + 147}
                      r="5"
                      className="fill-primary stroke-background motion-safe:animate-ball-drop origin-bottom [transform-box:fill-box]"
                      strokeWidth="1"
                    />
                  </>
                )}
                {!checked && highlightIds?.has(court.id) && (
                  <rect
                    x={rect.x - 6}
                    y={rect.y - 6}
                    width={rect.w + 12}
                    height={rect.h + 12}
                    rx="3"
                    fill="none"
                    strokeWidth="2"
                    strokeDasharray="6 5"
                    className="stroke-primary"
                  />
                )}
                <text
                  x={cx}
                  y={rect.y + 47}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[13px] font-semibold"
                >
                  {t(`short.${court.kind}`)}
                  {number}
                </text>
                <text
                  x={cx}
                  y={rect.y + rect.h + 27}
                  textAnchor="middle"
                  className="fill-foreground"
                >
                  <tspan className="font-display text-[20px] font-bold [font-stretch:112%]">
                    {court.freeCount ?? "–"}
                  </tspan>
                  <tspan className="fill-muted-foreground text-[11px] font-medium max-sm:hidden">
                    {" "}
                    {t("free")}
                  </tspan>
                </text>
              </g>
            </g>
          );
        })}

        {/* Ceiling lights: the chosen court's lights come on, the rest dim. */}
        <g aria-hidden="true" className="pointer-events-none">
          {CEILING_LIGHTS.map((light) => {
            const lit = selectedId === undefined || light.courtId === selectedId;
            return (
              <g key={`${light.x},${light.y}`} transform={`translate(${light.x} ${light.y})`}>
                <circle
                  r="16"
                  fill="url(#booking-halo)"
                  className="transition-opacity duration-700 motion-reduce:transition-none"
                  style={{ opacity: light.courtId === selectedId ? 1 : 0 }}
                />
                <circle
                  r="3.5"
                  className={cn(
                    "transition-opacity duration-500 motion-reduce:transition-none",
                    lit ? "fill-scene-light" : "fill-muted-foreground",
                  )}
                  style={{ opacity: lit ? 1 : 0.35 }}
                />
              </g>
            );
          })}
        </g>
      </svg>
      <figcaption className="text-muted-foreground mt-3 text-xs">{t("illustrative")}</figcaption>
    </figure>
  );
}
