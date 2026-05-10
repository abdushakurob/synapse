# Synapse Landing Page

Single-page, typography-driven landing page for Synapse — a decentralized communication protocol for AI agents on Solana. Dark, precise, walrus.xyz-meets-Bloomberg-terminal aesthetic.

## Scope

One route (`/`). All section markup lives inline in `src/routes/index.tsx`. Only genuinely reusable primitives are extracted as components.

## Design Tokens (`src/styles.css`)

Override `:root` (page is dark-only) with `oklch` equivalents:
- `--background` #080808, `--foreground` white
- `--muted-foreground` #A0A0A0
- `--primary` #0066FF, `--primary-foreground` white
- `--border` #1a1a1a
- `--card` #0d0d0d

Additions:
- `html { scroll-behavior: smooth }`
- `@keyframes aurora` — slow drift of blue/purple radial gradients, low opacity
- `@keyframes fade-in-up` + `.animate-fade-in-up` utility
- `.reveal` initial hidden state toggled by IntersectionObserver

## Fonts

Add Geist + Geist Mono `<link>` tags to `__root.tsx` head. Set Geist as default body font in `styles.css`; `font-mono` maps to Geist Mono. Update root `head()` with Synapse title, description, og tags.

## Reusable Components (`src/components/synapse/`)

Only these — everything else is inline in the route file:

1. `Aurora.tsx` — fixed/absolute layered radial gradients, animated, low opacity, behind hero
2. `Reveal.tsx` — wrapper using IntersectionObserver to add fade-in-up class once visible
3. `Nav.tsx` — sticky transparent nav with backdrop blur, scroll-triggered bottom border, wordmark + links + CTA (used standalone; complex enough to isolate)
4. `Footer.tsx` — wordmark, centered nav, CTA, divider, bottom row (isolated for symmetry with Nav)

## Single Page (`src/routes/index.tsx`)

Replace placeholder. Imports Nav, Footer, Aurora, Reveal. All 9 section blocks written inline as plain JSX inside the `Index` component, separated by `<div className="border-t border-border" />`:

1. Hero — full viewport, Aurora behind, 80–96px headline ("The internet for AI agents."), subhead, dual CTAs (solid blue pill / ghost outline), mono stats row
2. Any agent. Anywhere. — left-aligned headline + paragraph
3. Open. Direct. Verified. — centered headline + 3 columns
4. Stats — 3 large Geist Mono numbers + labels
5. Agentic economy — centered 2-line headline + paragraph
6. Use cases — left headline + 3×2 grid of `bg-card border-border p-8` cards
7. Three facts row + ghost "View on GitHub →" CTA
8. Code — centered headline + terminal `<pre>` block (`bg-card border-border font-mono`, manual `<span>` syntax coloring: keyword=blue, string=muted) + dual CTAs
9. Demo — full-width `bg-card` band, centered headline + sentence + solid blue CTA
10. Build — centered headline + 2×2 cards with blue text links

Each section wrapped in `<Reveal>` with generous vertical padding (`py-32 md:py-48`), `max-w-6xl mx-auto px-6`.

## Styling Rules

- All colors via semantic Tailwind classes (`bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-card`) — no raw hex in component JSX
- CTA classes reused inline:
  - Solid: `rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition`
  - Ghost: `rounded-full border border-white/15 px-6 py-3 text-sm font-medium hover:bg-white/5 transition`
- Hero headline: `text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight`

## Out of Scope

- No real GitHub/Docs/Discord URLs (use `#`)
- No demo video player (CTA only)
- No mobile hamburger drawer (links collapse responsively)
- No additional routes for Protocol/Docs/Blog
