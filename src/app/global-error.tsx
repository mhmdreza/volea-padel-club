"use client";

import { useEffect } from "react";

// Only rendered if the root layout itself throws (e.g. the [locale] segment's own
// setup fails) — so it can't rely on i18n, Tailwind, or any of our providers being
// available, and must define its own <html>/<body>. Kept deliberately minimal, with
// its own scoped light/dark styles and anti-flash script since ThemeProvider isn't
// reachable here either.
const THEME_SCRIPT = `(function(){try{var e=localStorage.getItem("theme");var d=e==="dark"||(e!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(t){}})();`;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <style>{`
          html { --bg: #f4f1ec; --fg: #141414; --muted: #3a3a38; }
          html.dark { --bg: #141414; --fg: #f4f1ec; --muted: #a8a39c; }
          body { background: var(--bg); color: var(--fg); }
          .ge-muted { color: var(--muted); }
        `}</style>
      </head>
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        {/* The logo's top row of dots and a ball resting on the net: the same "let"
            scene as the localized error page, drawn without Tailwind. */}
        <svg viewBox="0 0 120 60" width="180" height="90" aria-hidden="true">
          <circle cx="40" cy="8" r="4" fill="#f9943b" />
          <circle cx="60" cy="8" r="4" fill="#f9943b" />
          <circle cx="80" cy="8" r="4" fill="#f9943b" />
          <line
            x1="4"
            y1="44"
            x2="116"
            y2="44"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.6"
          />
          <line
            x1="20"
            y1="44"
            x2="20"
            y2="58"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.3"
          />
          <line
            x1="100"
            y1="44"
            x2="100"
            y2="58"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.3"
          />
          <circle cx="64" cy="37" r="7" fill="#f9943b" />
        </svg>
        <p
          className="ge-muted"
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Let · replay the point
        </p>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
          Something Went Wrong
        </h1>
        <p className="ge-muted" style={{ maxWidth: 360 }}>
          Looks like that shot didn&apos;t land. Please try again.
        </p>
        <button
          onClick={() => reset()}
          style={{
            backgroundColor: "#f9943b",
            color: "#141414",
            border: "none",
            borderRadius: "9999px",
            padding: "0.625rem 1.5rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
