@AGENTS.md

# Volea Padel Club — Project Conventions

Bilingual (EN default / DE) marketing website for a padel club, built with Next.js
App Router. This file documents the conventions actually in place in this repo —
read it before adding code, not just the framework-generated warning above.

## Tech Stack

- **Next.js 16 (App Router, Turbopack)** + **TypeScript (strict)**
- **Tailwind CSS v4** (CSS-first `@theme`, no `tailwind.config.js`)
- **shadcn/ui** (Radix primitives) for accessible UI building blocks
- **next-intl** for i18n routing/translation
- **@tanstack/react-query** for client-side data fetching against our own API routes
- **next-themes** for light/dark mode
- Package manager: **pnpm only** — never use `npm`/`yarn`. `packageManager` is
  pinned in `package.json`; `pnpm-lock.yaml` must always be committed in sync
  with `package.json` (run `pnpm install` after any manual edit).

## i18n (next-intl)

- **English is the default locale with no URL prefix** (`/`, `/courts`, ...).
  German is explicitly prefixed (`/de`, `/de/courts`, ...). Config:
  `src/i18n/routing.ts` (`localePrefix: "as-needed"`).
- Route slugs are currently **identical between locales** (no localized German
  slugs like `/de/plaetze`) — a deliberate simplification for this project's
  scope. If that changes, update the `pathnames` map in `routing.ts`.
- **Never import `next/link` or `next/navigation` directly.** Always use
  `Link`/`usePathname`/`useRouter`/`redirect` from `@/i18n/navigation` so locale
  routing stays correct. Use the shared `AppLinkHref` type (exported from the
  same file) when passing `href` values as props between components.
- `[locale]` is the **root layout itself** (`src/app/[locale]/layout.tsx` owns
  `<html>`/`<body>`) — there is no separate outer `app/layout.tsx`. This is
  required for `locale` to be a genuine Next.js **root parameter**
  (`next/root-params`), which keeps the whole tree statically generated. Do not
  reintroduce a wrapping `app/layout.tsx` above `[locale]`.
- Server Components read the locale via `next/root-params`'s `locale()` getter
  or `next-intl/server`'s `getTranslations`/`getMessages`/`getTimeZone`. Do
  **not** use `getLocale()`/`setRequestLocale()` — both are deprecated in this
  next-intl version and force dynamic rendering (see git history for the fix).
- Client Components needing translations use `useTranslations`/`useLocale` from
  `next-intl` — this works because `NextIntlClientProvider` is set up in
  `src/components/layout/providers.tsx` with **explicit** `locale`, `messages`,
  and `timeZone` props. If you add a new provider that needs any of these,
  get them from that same component's props rather than re-deriving them —
  `NextIntlClientProvider` cannot reliably auto-infer `locale`/`timeZone` once
  it's not rendered directly in the async layout.
- Translation files: `messages/en.json` / `messages/de.json`, namespaced by
  section (`Home`, `Nav`, `Footer`, `Language`, ...). **Every key must exist in
  both files** — this is enforced by `scripts/check-i18n-parity.mjs`, which
  runs in the pre-commit hook (`.husky/pre-commit`) and as `pnpm run
check:i18n`. A commit will fail if the two files' key sets diverge.
- Long-form legal text (Impressum/AGB/Hausordnung/Datenschutz) should **not**
  be casually machine-translated for the English routes — see the `[[TBD]]`
  notes in `src/content/site.ts` and treat German legal copy as authoritative.

## Design System / Styling

- All design tokens live in `src/styles/globals.css`, structured in **three
  tiers**:
  1. **Primitive tokens** (`--color-volea-500`, `--color-ink-950`, etc.) —
     the raw brand palette. Nothing outside this file should reference these
     directly.
  2. **Semantic tokens** (`--background`, `--foreground`, `--primary`,
     `--card`, `--border`, `--ring`, etc., with light values in `:root` and
     overrides in `.dark`) — components only ever use these.
  3. **Tailwind utility exposure** via `@theme inline` (for tokens that switch
     with the `.dark` class) and a plain `@theme` block (for fixed values like
     the custom `--radius-*` scale).
- **Only semantic-token utility classes are valid** (`bg-background`,
  `text-foreground`, `bg-primary`, `bg-secondary`, `bg-card`, `bg-popover`,
  `border-border`, `ring-ring`, etc.). A class like `bg-ink-950` or
  `from-ink-950` will silently produce **no CSS** — the primitives are not
  exposed as Tailwind utilities on purpose. If you need a new semantic token
  (e.g. a color a new component references that doesn't exist yet), add it to
  all three tiers in `globals.css`, don't reach for a primitive or an
  arbitrary hex value inline.
- Dark mode is class-based (`next-themes`, `attribute="class"`,
  `defaultTheme="system"`), via the `@custom-variant dark (&:where(.dark, .dark
*));` declaration at the top of `globals.css`.
- Font is self-hosted **Inter** via `next/font/google` (subsets `latin` +
  `latin-ext` for German umlauts/ß) — never load fonts from the Google Fonts
  CDN at runtime.
- Radius scale is intentionally smaller/sharper than Tailwind's defaults
  (architectural, "steel-and-glass" feel) — don't override this
  per-component without reason.

## Component Structure

- `src/components/ui/` — shadcn/ui primitives only. Installed via `pnpm dlx
shadcn@latest add <component>` (base: `radix`), then left mostly as
  generated — they already read from our semantic tokens. Don't hand-edit
  generated logic beyond what's needed to wire in a missing token.
- `src/components/layout/` — site-wide chrome: header, footer, providers,
  theme/locale switching, mobile nav, container/section primitives.
- `src/components/shared/` — cross-page composites (hero sections, CTA
  banners) — populated as patterns emerge across multiple pages, not created
  speculatively ahead of need.
- `src/features/<domain>/` — domain-specific code (courts, training, events,
  sponsoring, contact, faq): React Query hooks, feature-specific components.
- `src/content/` — typed placeholder/structured data (`Court`, `PricingTier`,
  `ClubEvent`, etc. from `src/types/content.ts`). The club is fictional;
  details a real club would supply (coach names, event schedules) stay
  `[[TBD]]` — see each file's header comment. Keep placeholders visibly marked
  rather than inventing realistic-sounding facts.
- `src/lib/utils.ts` — re-exports `cn` from the official `cn` package
  (shadcn's own clsx+tailwind-merge replacement). Don't reintroduce a local
  clsx/tailwind-merge implementation; shadcn's generated components import
  `cn` directly from the `cn` package, so this keeps one implementation, not
  two diverging ones.
- Icons: `lucide-react` for all generic UI icons. **It does not ship brand/logo
  icons** (Instagram, Facebook, LinkedIn, etc. were removed for trademark
  reasons in this major version) — those three are hand-authored in
  `src/components/layout/social-icons.tsx`. Don't add a second icon library
  (e.g. `react-icons`, `simple-icons`) for a small number of brand glyphs.

## Data Layer

- Structured content lives in typed `src/content/*.ts` modules, exposed over
  HTTP via Next.js Route Handlers under `src/app/api/*/route.ts` (outside the
  `[locale]` segment — API routes are not locale-scoped).
- Client components fetch through `@tanstack/react-query` hooks in
  `src/features/<domain>/use-<domain>.ts`, not by importing content modules
  directly. This means swapping placeholder data for a real backend later is a
  one-line change to the route handler, with no UI changes required.
- `QueryProvider` (one `QueryClient` per component instance, not module scope)
  lives in `src/components/layout/providers.tsx` alongside the other client
  providers.

## Code Quality Tooling

- **TypeScript**: `strict: true` plus `noUncheckedIndexedAccess`,
  `noImplicitOverride`, `noFallthroughCasesInSwitch`. Path alias: `@/*` → `src/*`.
- **ESLint** (flat config, `eslint.config.mjs`): `eslint-config-next` +
  `eslint-config-prettier` (so ESLint never fights Prettier).
- **Prettier** (`.prettierrc.json`) with `prettier-plugin-tailwindcss` for
  automatic class sorting.
- **Husky + lint-staged**: `.husky/pre-commit` runs the i18n parity check
  (`scripts/check-i18n-parity.mjs`) then `lint-staged` (ESLint --fix +
  Prettier on staged files). `.husky/pre-push` runs `pnpm run typecheck`.
- **Scripts**: `dev`, `build`, `start`, `lint`, `typecheck`, `format`,
  `format:check`, `check:i18n`.
- **Verification standard for this repo**: after any non-trivial change, run
  `pnpm run lint`, `pnpm exec tsc --noEmit`, and a full `pnpm run build` —
  and check the build's route table (`●` = static/SSG, `ƒ` = dynamic) hasn't
  regressed pages from static to dynamic. Where feasible, also start the
  server (`pnpm exec next start -p <port>`) and `curl` the real rendered
  output (both `/` and `/de`) rather than trusting a green build alone —
  several real bugs in this project (a deprecated API silently forcing
  dynamic rendering, a missing `timeZone` prop, a removed icon export) only
  showed up this way, not in `tsc`/`lint`.

## Git Workflow (this repo specifically)

- Work directly on `main` (no feature branches) — one visible, incremental
  commit history.
- Commit messages: single short line, imperative mood, starting with an
  uppercase letter (e.g. "Add design tokens, self-hosted Inter, and dark mode
  support"). Split unrelated concerns into separate commits.
- Never push without asking first, even though commits happen freely.
- Local git identity for this repo is set via `git config user.name/email`
  (not the global one) — don't change it.

## Known Placeholders / TBD Items

Tracked in `src/content/site.ts` and the individual `src/content/*.ts` files:
phone number, Playtomic booking link, WhatsApp community link, real
prices/coaches/event schedule, sponsor logos. UI code must handle these
gracefully (e.g. the header/footer already check for the `[[...]]` placeholder
convention before rendering a link as clickable) rather than assuming they're
always populated.
