# Project Guidelines — Stopp Air Base Ramstein Website Relaunch

**Document Version:** 1.0
**Created:** 2026-01-30
**Status:** Active

---

## 1. Project Purpose

### 1.1 Mission Statement

This website serves as the official digital presence for the "Stopp Air Base Ramstein" peace initiative. It must function as:

- **Public Documentation Archive:** A permanent, citable record of evidence regarding U.S. military operations conducted via Ramstein Air Base
- **Credible Reference Source:** A resource journalists, researchers, and policymakers can cite with confidence
- **Campaign Platform:** A mobilization tool for peace activism with clear calls to action
- **Long-Term Maintainable Codebase:** A system that can be handed off and maintained by volunteers with varying technical skills

### 1.2 Non-Functional Goals

| Goal | Requirement |
|------|-------------|
| **Documentation Quality** | All claims must link to verifiable sources; citations must be machine-readable |
| **Credibility** | Professional presentation; no visual elements that undermine seriousness |
| **Citation-Readiness** | Stable URLs, proper metadata, Open Graph tags for sharing |
| **Accessibility** | WCAG 2.1 AA compliance minimum |
| **Performance** | Lighthouse score ≥90 on all metrics; Time to Interactive <2s on 3G |
| **Privacy** | Zero third-party tracking; no cookies requiring consent |
| **Sovereignty** | No dependencies on U.S.-based CDNs or services in production |
| **Longevity** | Static output; no runtime dependencies; content survives framework changes |

---

## 2. Fixed Tech Stack

### 2.1 Core Technologies

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Framework** | Astro | 5.x | Static-first, native Markdown support, minimal JS |
| **Content** | Markdown + Astro Content Collections | — | Type-safe content, file-based routing |
| **Styling** | Tailwind CSS | 3.x | Utility-first, no runtime CSS-in-JS |
| **Typography** | IBM Plex (Sans, Serif, Mono) | Self-hosted | No Google Fonts; excellent German language support |
| **Icons** | Inline SVG | — | No icon library dependency |
| **Search** | Pagefind | Latest | Static search index, zero runtime cost |
| **Build** | Vite (via Astro) | — | Fast builds, ES modules |

### 2.2 Version Pinning

All dependencies must be pinned to exact versions in `package.json` (no `^` or `~` prefixes for core dependencies). This ensures reproducible builds.

```json
{
  "dependencies": {
    "astro": "5.1.1"
  }
}
```

### 2.3 Node.js Requirement

- **Minimum:** Node.js 22.x LTS
- **Package Manager:** npm (not yarn, pnpm, or bun) for maximum compatibility

---

## 3. Folder Structure

```
SAR2.0/
├── guidelines.md              # This file (project rules)
├── README.md                  # Setup and contribution guide
├── package.json
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
│
├── public/                    # Static assets (copied as-is)
│   ├── fonts/                 # Self-hosted IBM Plex fonts
│   │   ├── IBMPlexSans-*.woff2
│   │   ├── IBMPlexSerif-*.woff2
│   │   └── IBMPlexMono-*.woff2
│   ├── images/                # Optimized images
│   │   ├── events/
│   │   ├── people/
│   │   └── icons/
│   ├── documents/             # Downloadable PDFs, etc.
│   ├── favicon.ico
│   └── robots.txt
│
├── src/
│   ├── content/               # Astro Content Collections
│   │   ├── config.ts          # Collection schemas (SINGLE SOURCE OF TRUTH)
│   │   ├── warum-ramstein/    # Core arguments
│   │   ├── analysen/          # Geopolitical analysis articles
│   │   ├── aktionen/          # Events (current and archived)
│   │   ├── mitmachen/         # Engagement pages
│   │   └── seiten/            # Static pages (impressum, kontakt, etc.)
│   │
│   ├── layouts/               # Page wrapper templates
│   │   ├── BaseLayout.astro   # HTML shell, <head>, fonts
│   │   ├── PageLayout.astro   # Standard page with header/footer
│   │   ├── ArticleLayout.astro# Long-form content with ToC
│   │   └── EventLayout.astro  # Event-specific structure
│   │
│   ├── components/            # Reusable UI components
│   │   ├── global/            # Site-wide (Header, Footer, Nav)
│   │   ├── content/           # Content rendering (Callout, Source, etc.)
│   │   ├── ui/                # Generic UI (Button, Card, Badge)
│   │   └── interactive/       # JS-required components (Search, Countdown)
│   │
│   ├── pages/                 # File-based routing
│   │   ├── index.astro
│   │   ├── warum-ramstein/
│   │   ├── analysen/
│   │   ├── aktionen/
│   │   ├── mitmachen/
│   │   └── [...slug].astro    # Dynamic routes for content collections
│   │
│   ├── styles/                # Global styles
│   │   ├── global.css         # Tailwind directives + CSS custom properties
│   │   └── fonts.css          # @font-face declarations
│   │
│   └── utils/                 # Helper functions
│       ├── dates.ts           # Date formatting (German locale)
│       ├── reading-time.ts    # Reading time calculation
│       └── collections.ts     # Content collection helpers
│
├── stoppramstein_content/     # Legacy content (source for migration)
│
└── dist/                      # Build output (git-ignored)
```

### 3.1 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Folders** | kebab-case | `warum-ramstein/` |
| **Astro Components** | PascalCase | `ArticleHeader.astro` |
| **TypeScript Files** | kebab-case | `reading-time.ts` |
| **Content Files** | kebab-case, German slugs | `drohnenkrieg.md` |
| **CSS Classes** | Tailwind utilities or kebab-case custom | `article-header` |
| **CSS Custom Properties** | kebab-case with prefix | `--color-primary` |

---

## 4. Content Collections

### 4.1 Schema Definition Location

All content schemas are defined in `src/content/config.ts`. This is the **single source of truth** for content structure.

### 4.2 Required Frontmatter Fields

Every content file must include these fields at minimum:

```yaml
---
title: "Page Title"
description: "Meta description for SEO (max 160 characters)"
publishedAt: 2026-01-30
---
```

### 4.3 Schema Validation

Astro Content Collections provide build-time validation. If a content file fails schema validation, the build must fail. No exceptions.

### 4.4 Content Guidelines

- **Language:** German is primary; English translations are secondary
- **Tone:** Objective, evidence-based, critical but not inflammatory
- **Citations:** All factual claims must include source links
- **No Placeholders:** Never use Lorem Ipsum or placeholder text
- **No AI Hallucinations:** Do not fabricate quotes, statistics, or sources

---

## 5. Layouts

### 5.1 Layout Hierarchy

```
BaseLayout.astro
└── Contains: <html>, <head>, font loading, global styles
    │
    ├── PageLayout.astro
    │   └── Contains: Header, Footer, main content slot
    │       │
    │       ├── ArticleLayout.astro
    │       │   └── Contains: Sidebar ToC, article metadata, sources
    │       │
    │       └── EventLayout.astro
    │           └── Contains: Event hero, schedule, registration CTA
```

### 5.2 Layout Rules

1. **BaseLayout** handles document-level concerns only (no visual layout)
2. **PageLayout** is the default for all pages
3. Specialized layouts (Article, Event) extend PageLayout
4. Layouts must not contain business logic
5. Layouts must accept a `title` and `description` prop at minimum

---

## 6. Components

### 6.1 Component Categories

| Category | Path | Purpose | JS Allowed |
|----------|------|---------|------------|
| **global** | `components/global/` | Site-wide elements | Minimal |
| **content** | `components/content/` | Content rendering helpers | No |
| **ui** | `components/ui/` | Generic UI primitives | No |
| **interactive** | `components/interactive/` | Requires client JS | Yes |

### 6.2 Component Rules

1. **Astro-first:** Use `.astro` components by default
2. **No React:** Do not introduce React unless absolutely unavoidable
3. **Props over Slots:** Prefer explicit props; use slots for content projection
4. **Type Safety:** All props must be typed with TypeScript
5. **No Inline Styles:** Use Tailwind classes or `<style>` blocks
6. **Accessibility:** All interactive elements must be keyboard-navigable

### 6.3 Component Documentation

Each component file should include a comment block at the top:

```astro
---
/**
 * @component Button
 * @description Primary action button with variants
 * @example <Button variant="primary">Click me</Button>
 */
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost';
  href?: string;
}
// ...
---
```

---

## 7. Styling

### 7.1 Tailwind Configuration

Tailwind is configured in `tailwind.config.mjs` with:

- Custom color palette (see Visual Design section)
- Custom font families (IBM Plex)
- Typography plugin for prose styling
- No arbitrary values in components (define in config instead)

### 7.2 CSS Custom Properties

Global design tokens are defined as CSS custom properties in `src/styles/global.css`:

```css
:root {
  /* Colors */
  --color-bg-primary: theme('colors.slate.950');
  --color-text-primary: theme('colors.slate.100');

  /* Typography */
  --font-sans: 'IBM Plex Sans', system-ui, sans-serif;
  --font-serif: 'IBM Plex Serif', Georgia, serif;
  --font-mono: 'IBM Plex Mono', monospace;

  /* Spacing */
  --content-max-width: 72rem;
  --content-padding: 1.5rem;
}
```

### 7.3 Dark Mode

Not implemented. The site is light-only; design tokens in `tailwind.config.mjs` reference the light CSS custom properties in `src/styles/global.css`. There is no `.dark` class, no toggle, and no `prefers-color-scheme` handling. Do not add `dark:` utilities without first re-introducing the underlying token infrastructure.

### 7.4 Forbidden Styling Patterns

- No `!important` declarations
- No inline `style` attributes (except for truly dynamic values)
- No CSS-in-JS libraries
- No animations that cannot be disabled via `prefers-reduced-motion`

---

## 8. Accessibility

### 8.1 Minimum Requirements

- WCAG 2.1 Level AA compliance
- All images must have `alt` text (empty `alt=""` for decorative images)
- Color contrast ratio ≥ 4.5:1 for body text, ≥ 3:1 for large text
- Focus indicators must be visible
- Skip-to-content link on all pages

### 8.2 Semantic HTML

- Use semantic elements (`<article>`, `<nav>`, `<aside>`, `<main>`, `<header>`, `<footer>`)
- Heading hierarchy must be logical (no skipping levels)
- Lists must use `<ul>`, `<ol>`, `<dl>` appropriately
- Tables must have `<caption>` and proper `<th>` scope attributes

### 8.3 ARIA Usage

- Prefer native HTML semantics over ARIA
- If ARIA is needed, test with actual screen readers
- Never use `aria-hidden="true"` on focusable elements

---

## 9. Performance

### 9.1 Targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance | ≥ 90 |
| Lighthouse Accessibility | ≥ 95 |
| Lighthouse Best Practices | ≥ 95 |
| Lighthouse SEO | ≥ 95 |
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 2.0s |
| Cumulative Layout Shift | < 0.1 |

### 9.2 Optimization Rules

1. **Images:** Use modern formats (WebP, AVIF) with fallbacks; always specify dimensions
2. **Fonts:** Subset IBM Plex to Latin + German characters; use `font-display: swap`
3. **JavaScript:** Ship zero JS by default; use Astro islands for interactivity
4. **CSS:** Tailwind purges unused styles automatically
5. **HTML:** No render-blocking resources in `<head>`

### 9.3 Build Verification

Run Lighthouse CI on every build. Fail the build if any score drops below targets.

---

## 10. Dependencies

### 10.1 Allowed Dependencies

| Package | Purpose | Status |
|---------|---------|--------|
| `astro` | Core framework | Required |
| `@astrojs/tailwind` | Tailwind integration | Required |
| `@astrojs/sitemap` | Sitemap generation | Required |
| `tailwindcss` | CSS framework | Required |
| `@tailwindcss/typography` | Prose styling | Required |
| `pagefind` | Static search | Required |
| `sharp` | Image optimization | Optional |

### 10.2 Disallowed Dependencies

| Category | Examples | Reason |
|----------|----------|--------|
| **React/Preact** | `react`, `preact` | Unnecessary for static content |
| **UI Libraries** | `shadcn`, `radix-ui`, `headless-ui` | Over-engineering |
| **CSS-in-JS** | `styled-components`, `emotion` | Runtime overhead |
| **State Management** | `redux`, `zustand` | No client-side state needed |
| **Analytics** | `@vercel/analytics`, Google Analytics | Privacy violation |
| **CDN Fonts** | Google Fonts, Adobe Fonts | Third-party dependency |
| **Animation Libraries** | `framer-motion`, `gsap` | Unnecessary complexity |

### 10.3 Dependency Review

Before adding any new dependency:

1. Check bundle size impact
2. Verify MIT/Apache-2.0 compatible license
3. Confirm no transitive dependencies on disallowed packages
4. Document rationale in commit message

---

## 11. Commands

### 11.1 Development

```bash
# Install dependencies
npm install

# Start development server (http://localhost:4321)
npm run dev

# Start development server with network access
npm run dev -- --host
```

### 11.2 Build & Preview

```bash
# Production build
npm run build

# Preview production build locally
npm run preview

# Build search index (run after build)
npm run postbuild
```

### 11.3 Verification

```bash
# Type checking
npm run typecheck

# Lint (if configured)
npm run lint

# Full verification (types + build + lighthouse)
npm run verify
```

### 11.4 Package.json Scripts

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "postbuild": "pagefind --site dist",
    "typecheck": "astro check",
    "check-links": "node scripts/check-links.mjs",
    "check-csp": "node scripts/check-csp.mjs",
    "verify": "npm run typecheck && npm run build && npm run check-links"
  }
}
```

---

## 12. Incremental Work Rules

### 12.1 Step-by-Step Implementation

Every implementation phase must be:

1. **Atomic:** Complete one logical unit before moving to the next
2. **Verified:** Build must pass; no TypeScript errors
3. **Documented:** Changes are self-explanatory or commented

### 12.2 Implementation Order

```
1. Project scaffold (Astro init, dependencies)
   └── Verify: npm run build succeeds

2. Content collection schemas
   └── Verify: astro check passes

3. Base layout (HTML shell, fonts, global styles)
   └── Verify: Homepage renders with correct fonts

4. Global components (Header, Footer, Navigation)
   └── Verify: Navigation is keyboard-accessible

5. Content layouts (Page, Article, Event)
   └── Verify: Sample content renders correctly

6. UI components (Button, Card, Callout, etc.)
   └── Verify: Components render in isolation

7. Content migration (one collection at a time)
   └── Verify: All migrated content builds without errors

8. Search integration (Pagefind)
   └── Verify: Search returns relevant results

9. Final polish (SEO, performance, accessibility audit)
   └── Verify: Lighthouse scores meet targets
```

### 12.3 Self-Verification Checklist

After each step, confirm:

- [ ] `npm run build` succeeds without errors
- [ ] `npm run typecheck` passes
- [ ] No console errors in browser
- [ ] Changes comply with this guidelines.md
- [ ] No disallowed dependencies introduced
- [ ] Accessibility not regressed (keyboard navigation works)

---

## 13. Git Practices

### 13.1 Commit Messages

Use conventional commits:

```
feat: add ArticleLayout with sidebar ToC
fix: correct font loading order
docs: update guidelines.md with new rule
chore: update dependencies
```

### 13.2 Branch Strategy

- `main`: Production-ready code only
- `develop`: Integration branch
- Feature branches: `feat/article-layout`, `fix/font-loading`

### 13.3 What to Commit

- **Commit:** Source code, configuration, documentation
- **Do Not Commit:** `node_modules/`, `dist/`, `.env` files, OS files (`.DS_Store`)

---

## 14. Security

### 14.1 Content Security Policy

The production server must set these headers:

```
Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

### 14.2 External Links

All external links must include:

```html
<a href="..." target="_blank" rel="noopener noreferrer">
```

### 14.3 No User Input

This is a static site. There are no forms that submit to the server. Newsletter signup and contact forms must use a third-party service (e.g., self-hosted form handler) or `mailto:` links.

---

## 15. Deployment

### 15.1 Target Environment

- **Hosting:** Sovereign European provider (Hetzner, Uberspace, Infomaniak)
- **Server:** Static file server (Caddy or nginx)
- **TLS:** Let's Encrypt (automated)
- **Domain:** stoppramstein.de (or similar)

### 15.2 Build Artifacts

The `dist/` folder contains the complete static site. No server-side runtime is required.

### 15.3 Deployment Process

```bash
# Local build
npm run build

# Transfer to server (example)
rsync -avz --delete dist/ user@server:/var/www/stoppramstein.de/
```

---

## 16. Resolved Decisions

The following items were clarified on 2026-01-30:

| Question | Decision |
|----------|----------|
| **Newsletter Service** | `mailto:` link (no form handler) |
| **Contact Form** | `mailto:` link (acceptable) |
| **Multilingual** | Deferred to Phase 2 (German only in Phase 1) |
| **Image Sources** | Source from www.stoppramstein.de; download and self-host |
| **Domain** | Will migrate to stoppramstein.de after site is ready |

---

## 17. Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-30 | 1.0 | Initial guidelines document |

---

**End of Guidelines**
