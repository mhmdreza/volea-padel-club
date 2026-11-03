import { LOGO_DOTS } from "@/components/shared/section-dots";

// Street grid and the logo's dots as city blocks: a drawing of "somewhere in town",
// not a real map. No embed — Maps isn't in the privacy policy yet.
const STREETS_X = [60, 150, 250, 330, 420];
const STREETS_Y = [40, 110, 190];
const PIN = { x: 268, y: 128 };

export function LocationMap({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 230" aria-hidden="true" className={className}>
      <g className="stroke-border" strokeWidth="6" strokeLinecap="round">
        {STREETS_X.map((x) => (
          <line key={`x${x}`} x1={x} y1="0" x2={x} y2="230" />
        ))}
        {STREETS_Y.map((y) => (
          <line key={`y${y}`} x1="0" y1={y} x2="480" y2={y} />
        ))}
      </g>
      {/* The main road, in the court glass colour; the pin sits on the logo's centre dot. */}
      <path
        d="M0 205 C 120 190, 200 150, 268 128 S 420 60, 480 30"
        className="stroke-scene-glass"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      <g transform="translate(30 -115) scale(0.6)" className="fill-muted-foreground/25">
        {LOGO_DOTS.map(([cx, cy]) => (
          <circle key={`${cx},${cy}`} cx={cx} cy={cy} r="18" />
        ))}
      </g>
      <circle
        cx={PIN.x}
        cy={PIN.y}
        r="18"
        className="fill-primary/30 motion-safe:animate-ping"
        style={{ transformOrigin: `${PIN.x}px ${PIN.y}px`, transformBox: "view-box" }}
      />
      <circle
        cx={PIN.x}
        cy={PIN.y}
        r="9"
        className="fill-primary stroke-background"
        strokeWidth="3"
      />
    </svg>
  );
}
