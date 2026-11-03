# Volea Padel Club

A sample front-end project: the bilingual (English / German) website of
**Volea Padel Club**, a fictional padel club in the fictional town of Lindenau.
The club, its address, its people and its prices are made up. The point of the
project is the design and engineering: an interactive, animated marketing site
with a playable padel game, a 3D racket and a booking flow, built to production
standards.

**Live demo:** _[add your Vercel URL here]_

## What's inside

**Homepage**

- **Scroll-story hero ("Lights On")** — a 2.5D SVG hall that builds itself as
  you scroll: ceiling lights switch on, the glass walls slide up, and the ball
  comes back off the wall. One scroll gesture plays one chapter; light/dark mode
  is a day/night session.
- **3D padel racket** — modelled procedurally in React Three Fiber (no model
  files); its holes form the club's 21-dot mark. Drag to turn it, with easing
  and momentum. three.js only loads on the homepage, and only near the racket.
- **Playable padel game ("Feel the glass")** — a hand-written 2D physics engine
  (fixed time step, per-surface bounce) and a referee that applies real padel
  rules (net, wall-first, double bounce, out, por tres). Practice and match
  modes, a padel-style scoreboard with rolling digits, win/loss moments, and
  full-screen landscape play with thumb controls on phones.
- **Stacked card sections** — the middle sections slide over each other with
  CSS `position: sticky`; a scroll-driven animation (`animation-timeline: view()`)
  dims the card being covered.
- **Explore grid** — a bento grid of drawn court cards that morph into the page
  they open (React `<ViewTransition>`), plus a heading that widens on Archivo's
  width axis as it scrolls in.

**Booking page (`/book`)** — a top-down hall plan with 5 courts, day / duration /
start-time pickers and a ticket-style summary, fed by deterministic demo
availability from `/api/availability`. The whole selection lives in the URL, so
reload, sharing and switching language keep it. Details:
[`src/features/booking/README.md`](./src/features/booking/README.md).

**Other pages** — courts & pricing (doubles/singles dimension drawing), training,
events, FAQ (with search), sponsoring, lounge, about, vouchers, contact (Server
Action + zod), legal pages, and designed 404 / error pages. All share one design
system.

**Details** — theme switching spreads as a circle from the toggle (View
Transitions API), and every animation has a reduced-motion fallback.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript** (strict)
- **Tailwind CSS v4** with a three-tier token system (primitive → semantic →
  utility), **shadcn/ui** (Radix) restyled to those tokens
- **next-intl** (English default without prefix, German under `/de`)
- **@tanstack/react-query** against the app's own API routes, with SSR prefetch
- **React Three Fiber** + **drei** for the racket
- **zod**, **next-themes**
- **Vitest** + Testing Library, **Playwright** + **axe-core**
- **pnpm**

## Running it locally

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

| Script            | What it does                                                   |
| ----------------- | -------------------------------------------------------------- |
| `pnpm build`      | Production build                                               |
| `pnpm start`      | Serve the production build                                     |
| `pnpm lint`       | ESLint                                                         |
| `pnpm typecheck`  | `tsc --noEmit`                                                 |
| `pnpm check:i18n` | Fails if `messages/en.json` and `messages/de.json` keys differ |
| `pnpm test`       | Vitest unit tests                                              |
| `pnpm test:e2e`   | Playwright flows + axe accessibility scans on every page       |

## Deploying (Vercel, free tier)

1. Push the repo to GitHub.
2. On [vercel.com](https://vercel.com), choose **Add New → Project** and import
   the repo. Vercel detects Next.js and pnpm on its own; no settings needed.
3. Deploy. Canonical URLs use Vercel's production domain automatically; set
   `NEXT_PUBLIC_SITE_URL` only if you add a custom domain.

## Key decisions

- **Static first.** `[locale]` is the root layout, so `locale` is a real
  Next.js root parameter and every page is statically generated. Only
  `/contact` and the API routes are dynamic.
- **Content behind API routes.** Typed content modules are served by route
  handlers and read through React Query hooks, so swapping in a real backend is
  a change to the route handler, not the UI.
- **Live state never gets buried.** The hero, racket and game stay out of the
  stacked cards, so no render loop keeps running underneath a covering card.
- **Accessibility as a gate.** axe scans run on every page in the e2e suite;
  sections stay readable and the game stays playable with reduced motion.

## Notes

- Volea Padel Club is fictional. Details a real club would supply (phone,
  Playtomic link, coach names) are marked `[[TBD: ...]]` and handled gracefully
  in the UI.
- Pages are `noindex` on purpose: it's a sample, not a real business.
- Built with **Claude Code** (Anthropic) as a pair programmer; every change was
  verified with a build, lint, typecheck and tests.

## License

[MIT](./LICENSE)
