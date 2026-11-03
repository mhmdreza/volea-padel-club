# Booking feature

The `/book` prototype: pick a court on a top-down hall plan, a day, a duration and a
start time, then hand the slot to Playtomic (once its link exists) or to the contact
form as a prefilled `booking` request. Availability is **demo data** — the club opens
in November 2026 and has no booking backend yet — and is labelled as such everywhere.

- `lib/berlin-time.ts` — Europe/Berlin "today", DST-safe plain-date arithmetic, no date library.
- `lib/availability.ts` — deterministic generator (seeded per court and day), served by
  `src/app/api/availability/route.ts`. Swapping in a real source only changes that handler.
- `lib/hall-layout.ts` — SVG geometry: real court sizes, illustrative arrangement,
  the logo's 21 dots as ceiling lights.
- `schema.ts` — zod schemas: forgiving URL state, strict API query, parsed responses.
- `use-booking-params.ts` — the URL is the single source of truth (written with
  `history.replaceState`); `use-availability.ts` — React Query hook.
- `booker.tsx` — the client island behind `<Suspense>` on the static page; composes
  `court-plan`, `date-strip`, `duration-switch`, `slot-grid`, `booking-summary` and
  `handoff-actions`.

Opening hours (06:00–23:00 daily) and the demand curve are placeholders — see
`src/content/booking.ts`.
