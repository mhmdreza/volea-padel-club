import { cn } from "@/lib/utils";

import {
  BACK_GLASS,
  BACK_GLASS_JOINTS,
  BACK_MESH,
  BALL_PATH,
  BOARDS,
  CEILING_ROWS,
  ceilingDots,
  COURT_LINES,
  FLOOR,
  GLASS_POINT,
  NET,
  SIDE_MESH,
  SIDE_PANELS,
} from "./court-geometry";

export type CourtMotifVariant = "court" | "glass" | "lights";
export type CourtMotifHighlight = "back-glass" | "side-glass" | "boards" | "banners";

const HIGHLIGHT = "fill-primary/20 stroke-primary";
// Boards and banners are switchable surfaces (sponsoring): their highlight layers stay
// mounted and cross-fade, so switching never pops.
const fade = (on: boolean) =>
  cn(
    "transition-opacity duration-500 motion-reduce:transition-none",
    on ? "opacity-100" : "opacity-0",
  );

/**
 * The hero's court as a small static drawing: each variant leans on one chapter of
 * the hero story (lines, glass, or lights). Pure SVG — no JS, no animation, so it's
 * free to use anywhere and already "final" under reduced motion.
 */
export function CourtMotif({
  variant,
  highlight,
  ball = true,
  className,
}: {
  variant: CourtMotifVariant;
  highlight?: CourtMotifHighlight;
  /** The ball resting on the glass; off when a scene draws its own ball. */
  ball?: boolean;
  className?: string;
}) {
  const glassStrong = variant === "glass";
  const dots = ceilingDots(variant === "lights" ? CEILING_ROWS : [CEILING_ROWS[2]]);

  return (
    <svg
      viewBox="100 40 1240 680"
      aria-hidden="true"
      focusable="false"
      className={cn(
        "h-auto w-full [mask-image:linear-gradient(to_bottom,black_70%,transparent)]",
        className,
      )}
    >
      <g>
        <polygon
          points={FLOOR}
          className="fill-secondary stroke-muted-foreground"
          fillOpacity={variant === "lights" ? 0.45 : 0.7}
          strokeOpacity="0.35"
          strokeDasharray="6 8"
        />
        {variant === "lights" && (
          <ellipse cx="720" cy="580" rx="460" ry="90" className="fill-scene-light" opacity="0.14" />
        )}

        <g
          className="stroke-foreground"
          strokeOpacity={variant === "court" ? 0.6 : 0.4}
          strokeWidth="3"
        >
          {COURT_LINES.map(([x1, y1, x2, y2]) => (
            <line key={`${x1},${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
        </g>

        <g
          className="stroke-scene-glass fill-scene-glass/5"
          strokeOpacity={glassStrong ? 0.6 : 0.35}
          strokeWidth="2"
          strokeDasharray="4 5"
        >
          <rect {...BACK_MESH} />
          {SIDE_MESH.map((points) => (
            <polygon key={points} points={points} />
          ))}
        </g>
        {highlight && (
          <g
            className={cn(HIGHLIGHT, fade(highlight === "banners"))}
            strokeWidth="2"
            strokeDasharray="4 5"
          >
            <rect {...BACK_MESH} />
            {SIDE_MESH.map((points) => (
              <polygon key={points} points={points} />
            ))}
          </g>
        )}

        <g
          className={cn(
            "stroke-scene-glass",
            highlight === "side-glass"
              ? HIGHLIGHT
              : glassStrong
                ? "fill-scene-glass/20"
                : "fill-scene-glass/10",
          )}
          strokeOpacity={glassStrong ? 0.9 : 0.55}
          strokeWidth="2.5"
        >
          {SIDE_PANELS.map((points) => (
            <polygon key={points} points={points} />
          ))}
        </g>

        <g
          className={cn(
            "stroke-scene-glass",
            highlight === "back-glass"
              ? HIGHLIGHT
              : glassStrong
                ? "fill-scene-glass/25"
                : "fill-scene-glass/10",
          )}
          strokeOpacity={glassStrong ? 0.9 : 0.6}
          strokeWidth="2.5"
        >
          <rect {...BACK_GLASS} />
          {BACK_GLASS_JOINTS.map((x) => (
            <line key={x} x1={x} y1={BACK_GLASS.y} x2={x} y2={BACK_GLASS.y + BACK_GLASS.height} />
          ))}
        </g>

        {highlight && (
          <g
            className={cn(HIGHLIGHT, fade(highlight === "boards"))}
            strokeWidth="2.5"
            fillOpacity="0.55"
          >
            <rect {...BOARDS.back} />
            {BOARDS.sides.map((points) => (
              <polygon key={points} points={points} />
            ))}
          </g>
        )}

        {variant === "glass" && (
          <path
            d={BALL_PATH}
            fill="none"
            className="stroke-primary"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="2 12"
          />
        )}
        {ball && <circle cx={GLASS_POINT.x} cy={GLASS_POINT.y} r="11" className="fill-primary" />}

        <g>
          <rect
            x={NET.x1}
            y={NET.y}
            width={NET.x2 - NET.x1}
            height={NET.bottom - NET.y}
            className="fill-foreground"
            fillOpacity="0.04"
          />
          <line
            x1={NET.x1}
            y1={NET.y}
            x2={NET.x2}
            y2={NET.y}
            className="stroke-foreground"
            strokeOpacity="0.7"
            strokeWidth="4"
          />
        </g>

        <g>
          {dots.map((dot) => (
            <g key={`${dot.x},${dot.y}`}>
              {variant === "lights" && (
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={dot.r * 3.2}
                  className="fill-scene-light"
                  opacity="0.18"
                />
              )}
              <circle cx={dot.x} cy={dot.y} r={dot.r} className="fill-scene-light" />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}
