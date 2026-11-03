import { ImageResponse } from "next/og";

import { routing } from "@/i18n/routing";

// Drawn from code, so the share image needs no asset and always matches the brand.
export const alt = "Volea Padel Club Lindenau";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ROWS = [3, 5, 5, 5, 3];

// Pre-render one image per locale, so the route stays static like the pages.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 72,
        padding: 96,
        background: "#0b0f17",
        color: "#f4f1ec",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        {ROWS.map((count, row) => (
          <div key={row} style={{ display: "flex", gap: 14 }}>
            {Array.from({ length: count }, (_, i) => (
              <div
                key={i}
                style={{ width: 34, height: 34, borderRadius: 17, background: "#f9943b" }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -3 }}>Volea Padel</div>
        <div style={{ fontSize: 36, color: "#a8a39c" }}>Play. Connect. Repeat. — Lindenau</div>
      </div>
    </div>,
    size,
  );
}
