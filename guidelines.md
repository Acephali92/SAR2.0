# Project Guidelines — Stopp Air Base Ramstein Website Relaunch

**Document Version:** 1.1
**Created:** 2026-01-30
**Updated:** 2026-11-05
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
| **Usability** | Every target group finds its entry point; information architecture before visual design (see §16) |
| **Citation-Readiness** | Stable URLs, proper metadata, Open Graph tags for sharing (see §17) |
| **Accessibility** | WCAG 2.1 AA compliance minimum |
| **Performance** | Lighthouse score ≥90 on all metrics; Time to Interactive <2s on 3G |
| **Privacy** | Zero third-party tracking; no cookies requiring consent; cookie-free alone is not enough (see §14.11) |
| **Sovereignty** | No dependencies on U.S.-based CDNs or services in production |
| **Longevity** | Static output; no runtime dependencies; content survives framework changes |

---

## 2. Fixed Tech Stack

### 2.1 Core Technologies

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Framework** | Astro | 7.x | Static-first, native Markdown support, minimal JS |
| **Content** | Markdown + Astro Content Collections | — | Type-safe content, file-based routing |
| **Styling** | Tailwind CSS | 3.x | Utility-first, no runtime CSS-in-JS |
| **Typography** | IBM Plex (Sans, Serif, Mono) | Self-hosted | No Google Fonts; excellent German language support |
| **Icons** | Inline SVG | — | No icon library dependency |
| **Search** | Pagefind | 1.x | Static search index, zero runtime cost |
| **Build** | Vite (via Astro) | — | Fast builds, ES modules |

### 2.2 Versionen: eine Quelle pro Angabe

Jede Versionsangabe hat genau eine Quelle. Alles andere verweist darauf oder nennt höchstens die Hauptversion.

| Angabe | Einzige Quelle |
|--------|----------------|
| Abhängigkeiten der Website | `package.json` + `package-lock.json`. Exakt gepinnt, kein `^` oder `~`. |
| Abhängigkeiten des CMS | `cms/package.json` + `cms/package-lock.json`. Caret-Ranges (alle `@payloadcms/*` brauchen dieselbe Version wie `payload`), reproduzierbar über die Lock-Datei und `npm ci`. |
| Node.js-Mindestversion | `engines.node` in `package.json` bzw. `cms/package.json` |
| Node.js für Entwicklung und CI | `.nvmrc` (nur die Hauptversion). Die CI liest die Datei über `node-version-file`. |
| Node.js in den CMS-Containern | `FROM node:<Hauptversion>-alpine` in den Dockerfiles unter `cms/`, muss zu `.nvmrc` passen |

Regeln für Dokumentation:

- Nur Hauptversionen nennen: „Astro 7“ oder „Tailwind CSS 3.x“, in Tabellen „7.x“. Bei 0.x-Paketen zählt die zweite Stelle als Hauptversion („0.5.x“). Exakte Versionen veralten mit jedem Dependabot-Update und gehören nicht in die Doku.
- Die Node.js-Mindestversion steht genau so wie in `engines.node`, z. B. „Node.js ≥ 22.12“.
- `npm run check-doc-versions` (Teil von `npm run verify`) prüft `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `guidelines.md`, `docs/ARCHITEKTUR.md`, `docs/DEPLOYMENT.md`, `docs/INHALTE-PFLEGEN.md` und `cms/README.md` gegen diese Quellen, außerdem `.nvmrc`, CI-Workflows und Dockerfiles untereinander. Ausgenommen sind `docs/AENDERUNGSPROTOKOLL.md` (alte Versionen sind dort richtig) und `docs/OFFENE-PUNKTE.md` (nennt künftige Versionen).
- Nach einem Major-Update (z. B. Tailwind 3 → 4) schlägt die Prüfung fehl, bis die Doku angepasst ist. Das ist gewollt: Ein Major-Update ändert meist auch beschriebenes Verhalten.

### 2.3 Node.js Requirement

- **Minimum:** Node.js ≥ 22.12 (`engines.node` in `package.json`, von Astro 7 vorgegeben)
- **Entwicklung, CI und Container:** Node.js 22 laut `.nvmrc` (mit nvm: `nvm use`)
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
- **No Gender-Inclusive Notation:** Do not use colon/asterisk/underscore forms in German text (`Autor:in`, `Nutzer*innen`, `Leser_innen`, etc.) — in content, documentation, and UI copy alike. Prefer a neutral collective noun where one naturally fits (e.g. "Redaktion" instead of "Redakteur:innen"); otherwise use the standard generic form (e.g. "Autor", "Nutzer"). Applies to German text only — irrelevant for English.

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

Die Lighthouse-Ziele aus 9.1 sind ein manueller Pre-Release-Check (z.B. vor größeren Releases oder Layout-Änderungen) — sie sind **nicht** Teil der automatisierten CI. Die automatisierten Gates sind ausschließlich `npm run verify` (Typecheck, Build, Link-Check, CSP-Check), siehe 11.3 und `.github/workflows/ci.yml`. Welche Prüfungen insgesamt automatisiert und welche manuell laufen, regelt §18.

---

## 10. Dependencies

### 10.1 Allowed Dependencies

| Package | Purpose | Status |
|---------|---------|--------|
| `astro` | Core framework | Required |
| `@astrojs/check` | Type and schema check (`npm run typecheck`) | Required |
| `typescript` | Strict type checking, used by `@astrojs/check` | Required |
| `autoprefixer` | PostCSS plugin for Tailwind 3 (replaces the deprecated `@astrojs/tailwind`) | Required |
| `@astrojs/sitemap` | Sitemap generation | Required |
| `tailwindcss` | CSS framework | Required |
| `@tailwindcss/typography` | Prose styling | Required |
| `pagefind` | Static search | Required |
| `sharp` | Image optimization | Optional |
| `@playwright/test` | Funktionale und visuelle Tests (§18), nur devDependency | Geplant |
| `@axe-core/playwright` | Accessibility-Tests (§18), nur devDependency | Geplant |

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
2. Verify MIT/Apache-2.0 compatible license. Ausnahme: Reine Entwicklungswerkzeuge, die nicht in `dist/` landen, dürfen auch unter MPL-2.0 stehen (betrifft axe-core).
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

# Full verification (doc versions + types + build + link-check + CSP-check)
npm run verify
```

### 11.4 Package.json Scripts

Die Scripts stehen nur in `package.json`. Eine Übersicht mit Zweck steht in `README.md`, Abschnitt „Befehle“.

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

Nach jedem Schritt gilt die Definition of Done (§18.2). Zusätzlich zu den dort genannten Punkten:

- [ ] No console errors in browser
- [ ] Changes comply with this guidelines.md
- [ ] No disallowed dependencies introduced

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

## 14. Security & Privacy by Design

Sicherheit und Datenschutz sind Eigenschaften der ganzen Seite, nicht nur der HTTP-Header. 14.1–14.3 regeln Header, Links und Eingaben, 14.4–14.11 Geheimnisse, Abhängigkeiten, Inhalte, Betrieb und Datenschutz.

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

### 14.4 Keine Geheimnisse im Repository

- Passwörter, API-Keys, Tokens, `PAYLOAD_SECRET`, Datenbank-URLs mit Passwort und Zugangsdaten für Backups (`rclone.conf`) gehören nie ins Repository. Sie liegen nur auf dem Server: in `.env`-Dateien oder unter `cms/secrets/`.
- Im Repository stehen nur Vorlagen ohne echte Werte (`*.example`, z. B. `cms/.env.example`).
- Ein neuer Ablageort für Geheimnisse wird im selben Commit in `.gitignore` bzw. `cms/.gitignore` aufgenommen.
- Wurde ein Geheimnis committet oder gepusht, gilt es als offengelegt: sofort beim Anbieter widerrufen bzw. neu erzeugen, dann den Vorfall nach 14.10 behandeln. Allein aus der Git-History entfernen reicht nicht.

### 14.5 Abhängigkeiten prüfen

- Dependabot meldet bekannte Sicherheitslücken und schlägt Updates vor, Semgrep prüft den Code (Details: `CONTRIBUTING.md`, „Automatische Prüfungen“). Offene Alerts werden in `docs/OFFENE-PUNKTE.md` mit Stand und Schweregrad geführt.
- Vor jedem Release laufen `npm audit` im Root und in `cms/`. Kritische und hohe Funde werden vor dem Release behoben oder mit Begründung als nicht ausnutzbar dokumentiert (Beispiel: Astro-Advisories im Änderungsprotokoll, 2026-10-21).
- Neue Abhängigkeiten nur nach §10.3. Jede Abhängigkeit ist Angriffsfläche, weniger ist besser.

### 14.6 Externe Verbindungen minimieren

- Die öffentliche Seite lädt nichts von fremden Servern: keine Skripte, Stylesheets, Fonts, Bilder, Videos oder iFrames. Die CSP in 14.1 erzwingt das im Browser.
- Externe Links sind erlaubt, weil sie erst beim Klick eine Verbindung aufbauen (14.2).
- Auch im Build gilt: Externe Daten kommen nur aus dem eigenen CMS. Bilder fremder Herkunft lassen den Build scheitern (`src/lib/payload-loader.ts`).

### 14.7 Kein ungeprüftes HTML

- Roh-HTML per `set:html` ist nur für zwei Quellen erlaubt: eigene SVG-Konstanten im Code und das HTML aus dem CMS, das `cms/src/lib/lexicalToHtml.ts` erzeugt. Dort wird Text escaped und Link-URLs werden bereinigt, der Editor lässt kein HTML zu.
- Jede neue Quelle für `set:html` braucht eine Begründung im Pull Request: Woher kommt das HTML, und wer kann es verändern?
- Markdown-Inhalte enthalten kein Roh-HTML aus fremden Quellen. Aus `stoppramstein_content/` werden Texte übernommen, keine `<script>`-, `<iframe>`- oder `style`-Fragmente von WordPress.
- Schutz vor XSS hat Vorrang vor Bequemlichkeit: lieber eine Komponente bauen als HTML-Strings zusammensetzen.

### 14.8 Keine unsicheren Weiterleitungen

- Weiterleitungen stehen als feste Paare (alte URL → neue URL) in der Server-Konfiguration (§17.8).
- Kein Weiterleitungsziel wird aus Query-Parametern, Pfadteilen oder anderen Eingaben übernommen (keine Open Redirects).
- Ziele sind interne Pfade. Externe Ziele nur im Einzelfall und mit Begründung im Pull Request.

### 14.9 Security-Header regelmäßig prüfen

- Nach jedem Deployment, nach jeder Änderung der Server-Konfiguration und mindestens vierteljährlich werden die Header der Live-Seite gegen 14.1 geprüft, z. B. mit `curl -sI https://stoppramstein.de/`. Ablauf: `docs/DEPLOYMENT.md`, „Header nach dem Deployment prüfen“.
- Gilt auch für die Fehlerseite (`/404.html`) und für Dateien unter `/_astro/` und `/pagefind/`.
- HSTS (`Strict-Transport-Security`) und `Permissions-Policy` fehlen noch in den Vorlagen unter `deploy/` (siehe `docs/OFFENE-PUNKTE.md`).

### 14.10 Umgang mit Sicherheitsvorfällen

Ein Sicherheitsvorfall ist jede Lücke, die ausgenutzt wurde oder ausgenutzt werden könnte: ein offengelegtes Geheimnis, ein Zugriff auf unveröffentlichte Inhalte, eine kompromittierte Abhängigkeit, eine veränderte Seite. Ablauf:

1. **Melden:** Wer einen Vorfall bemerkt, meldet ihn sofort vertraulich, nicht in einem öffentlichen Issue. Der Meldeweg ist noch festzulegen (siehe `docs/OFFENE-PUNKTE.md`).
2. **Eindämmen:** Schaden begrenzen, bevor die Ursache geklärt ist, z. B. Geheimnis widerrufen, betroffenes Konto sperren, CMS vom Netz nehmen, letzte saubere Fassung von `dist/` ausliefern.
3. **Beheben:** Ursache finden und beheben, mit Nachweis (Test oder reproduzierbare Prüfung).
4. **Informieren:** Betroffene informieren. Sind personenbezogene Daten betroffen, prüft der Betreiber die Meldepflicht an die Aufsichtsbehörde (Art. 33 DSGVO, binnen 72 Stunden) und die Benachrichtigung Betroffener (Art. 34 DSGVO).
5. **Dokumentieren:** Eintrag in `docs/AENDERUNGSPROTOKOLL.md` mit Problem, Zeitraum, Ursache, Fix und Nachweis. Vorbild ist der Eintrag „Entwürfe und Mediathek waren über die API anonym lesbar“ (2026-09-18).

### 14.11 Datenschutz: Cookiefrei ist nicht automatisch datenschutzkonform

Dass die Seite keine Cookies setzt, ist nur ein Teil. Zu berücksichtigen sind außerdem:

- **Server-Logs und IP-Adressen:** Jeder Aufruf hinterlässt beim Hosting-Anbieter IP-Adresse, Zeitpunkt, Pfad und User-Agent. Logs werden nur so lange wie nötig gespeichert, IP-Adressen möglichst gekürzt oder anonymisiert. Speicherdauer und Anbieter müssen in der Datenschutzerklärung stehen (`src/content/seiten/datenschutz.md`).
- **Externe Ressourcen:** keine (14.6). Jede Ausnahme wäre eine Datenübermittlung an Dritte und bräuchte eine Rechtsgrundlage.
- **Eingebettete Inhalte:** Videos, Karten oder Social-Media-Beiträge werden nicht eingebettet, sondern verlinkt, wahlweise mit selbst gehostetem Vorschaubild. Nichts darf beim Seitenaufruf einen fremden Server kontaktieren.
- **Redaktionsoberfläche:** Das CMS setzt für den Login ein Sitzungs-Cookie. Das betrifft nur die Redaktion, nicht die öffentliche Seite. Es lädt nichts von externen Diensten (Gravatar ist abgeschaltet).
- **E-Mail:** Passwort-Reset und Fehlerbenachrichtigungen laufen über einen SMTP-Anbieter in der EU.
- **Neue Datenverarbeitung:** Jede neue Verarbeitung personenbezogener Daten (neuer Dienst, neues Formular, neue Log-Auswertung) wird vor dem Einsatz in `datenschutz.md` und in `docs/ARCHITEKTUR.md`, „Datenverarbeitung“, nachgezogen.

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

## 16. User Experience & Information Architecture

### 16.1 Zielgruppen und Nutzungssituationen

Die Seite bedient Zielgruppen mit unterschiedlichen Fragen, Vorkenntnissen und Geräten. Jede Zielgruppe muss von der Startseite und aus der Hauptnavigation (`src/components/global/Header.astro`) ohne Umweg ihren Einstieg finden.

| Zielgruppe | Typische Situation und Frage | Einstieg |
|------------|------------------------------|----------|
| **Interessierte Bürger** | Erster Kontakt, wenig Vorwissen: „Worum geht es, und warum betrifft mich das?“ | Startseite, `/warum-ramstein/` |
| **Friedensaktivisten** | Wollen handeln und Material weitergeben: „Was steht an, wie kann ich helfen?“ | `/aktionen/`, `/mitmachen/` |
| **Journalisten** | Unter Zeitdruck, brauchen Belege und Ansprechpartner: „Welche Fakten sind belegt, wen frage ich?“ | `/presse/`, `/fakten/` |
| **Wissenschaftler** | Lesen gründlich, prüfen Quellen: „Worauf stützt sich die Aussage, wie zitiere ich sie?“ | `/analysen/`, `/fakten/`, Quellenblock jedes Artikels |
| **Politiker und Entscheidungsträger** | Wenig Zeit, brauchen Kernaussagen und Forderungen: „Was wird konkret gefordert und warum?“ | `/warum-ramstein/`, `/ueber-uns/` |
| **Teilnehmer des Friedenscamps** | Oft unterwegs am Smartphone: „Wann, wo, wie komme ich hin, was muss ich mitbringen?“ | `/aktionen/` und die jeweilige Terminseite |

Die Tabelle beschreibt Annahmen über Nutzungssituationen, keine erhobenen Daten. Sie wird angepasst, sobald Rückmeldungen aus diesen Gruppen vorliegen.

### 16.2 Prinzipien

Jedes Prinzip hat eine Regel, an der sich eine Seite prüfen lässt.

1. **Jede Seite verfolgt einen klar erkennbaren Zweck.** Titel und Einleitung sagen, worum es geht und für wen. Lässt sich der Zweck nicht in einem Satz sagen, wird die Seite geteilt.
2. **Die wichtigsten Informationen sind ohne unnötiges Scrollen erreichbar.** Kernaussage und, falls vorhanden, die primäre Handlung stehen bei 390 px Breite im ersten Bildschirm. Bei Terminen gehören Datum, Ort und Uhrzeit nach oben, nicht in den Fließtext.
3. **Navigation und Seitenstruktur bleiben konsistent.** Header, Footer und Hauptnavigation kommen ausschließlich aus `PageLayout.astro`. Gleiche Inhaltstypen nutzen dasselbe Layout (§5). Bezeichnungen in der Navigation, in Überschriften und in URLs passen zueinander.
4. **Komplexe Sachverhalte werden verständlich aufbereitet.** Erst die Kernaussage, dann die Details. Kurze Absätze, sprechende Zwischenüberschriften, Fachbegriffe und Abkürzungen bei der ersten Nennung erklärt. Lange Artikel bekommen ein Inhaltsverzeichnis (`ArticleLayout.astro`).
5. **Quellen und weiterführende Informationen sind leicht auffindbar.** Belege stehen direkt an der Aussage (Link oder `SourceLink`) und gesammelt im Quellenblock am Artikelende. Downloads sind als solche gekennzeichnet (Format, Größe).
6. **Handlungsaufforderungen sind eindeutig, aber nicht aufdringlich.** Höchstens eine primäre Handlung pro Abschnitt, mit einem Verb, das sagt, was passiert („Jetzt spenden“, „Termin ansehen“). Keine Pop-ups, Overlays, Countdowns als Druckmittel oder Unterbrechungen beim Lesen.
7. **Mobile, Tablet- und Desktop-Darstellung werden gleichermaßen berücksichtigt.** Jede Seite wird bei 390, 768 und 1280 px geprüft (§18). Keine Funktion und kein Inhalt ist nur auf einer Gerätegröße verfügbar.

### 16.3 Informationsarchitektur vor visueller Gestaltung

Eine schöne Website ist nicht automatisch eine verständliche Website. Deshalb werden zwei Fragen getrennt entschieden und getrennt geprüft:

- **Informationsarchitektur:** Welche Seiten gibt es, wie heißen sie, wo liegen sie in der Navigation, welche URL haben sie, wie sind sie untereinander verlinkt, was steht auf einer Seite in welcher Reihenfolge?
- **Visuelle Gestaltung:** Farben, Typografie, Abstände, Bilder, Animationen.

Regeln:

- Neue Seiten und Umbauten beginnen mit der Struktur: Zweck, Zielgruppe (16.1), Platz in der Navigation, URL (§17.8) und Gliederung. Erst danach folgt die Gestaltung.
- Die Struktur muss auch ohne Gestaltung funktionieren: Eine Seite ist mit abgeschaltetem CSS in sinnvoller Reihenfolge lesbar, und die Überschriftenhierarchie allein ergibt eine verständliche Gliederung (§8.2).
- Gestaltung darf die Struktur nicht verändern. Eine Designänderung, die Navigation, Reihenfolge oder Benennung ändert, ist eine IA-Änderung und wird als solche begründet.

---

## 17. SEO, Metadata & Discoverability

Ziel ist nicht Reichweite um jeden Preis, sondern Auffindbarkeit und Zitierfähigkeit: Wer die Seite einmal zitiert hat, muss den Inhalt unter derselben Adresse wiederfinden. Jeder Unterabschnitt nennt die Regel und den aktuellen Stand.

### 17.1 Title und Description

- **Title:** `{Seitentitel} — Stopp Air Base Ramstein`, auf der Startseite nur der Name. Erzeugt in `src/layouts/BaseLayout.astro`. Der Seitentitel ist eindeutig, beschreibt den Inhalt und wiederholt nicht den Seitennamen. Richtwert: Seitentitel höchstens 50 Zeichen. Suchmaschinen kürzen lange Titel, der wichtige Teil steht deshalb vorn.
- **Description:** ein bis zwei vollständige Sätze, höchstens 160 Zeichen, eigener Text pro Seite (nicht der erste Absatz kopiert). Für Markdown erzwingt das Schema in `src/content.config.ts` die 160 Zeichen. Für Beiträge und Termine aus dem CMS fehlt die Grenze noch (siehe `docs/OFFENE-PUNKTE.md`).
- Title und Description sind Pflicht-Props jedes Layouts (§5.2).

### 17.2 Canonical URLs

- Jede Seite hat genau eine kanonische URL: `https://stoppramstein.de/…/` mit abschließendem Schrägstrich (`site` und `trailingSlash: 'always'` in `astro.config.mjs`). `BaseLayout.astro` setzt `<link rel="canonical">`.
- `canonicalUrl` wird nur überschrieben, wenn derselbe Inhalt bewusst unter einer zweiten Adresse liegt. Dann zeigt der Canonical auf das Original.

### 17.3 XML-Sitemap

- `@astrojs/sitemap` erzeugt `sitemap-index.xml` bei jedem Build. Sie enthält nur indexierbare Seiten mit Status 200.
- Seiten mit `noIndex` gehören nicht in die Sitemap. Ein entsprechender `filter` fehlt in `astro.config.mjs` noch (siehe `docs/OFFENE-PUNKTE.md`). Bisher setzt keine Seite `noIndex`.

### 17.4 Robots-Regeln

- `public/robots.txt` erlaubt alles und verweist auf die Sitemap. Inhalte werden nicht über `robots.txt` versteckt, sondern über `noIndex` oder gar nicht veröffentlicht.
- Die Team-Vorschau setzt `X-Robots-Tag: noindex, nofollow` (`scripts/write-preview-headers.mjs`). Das darf nie in die Produktion gelangen.

### 17.5 Open Graph und Social-Media-Metadaten

- `BaseLayout.astro` setzt `og:title`, `og:description`, `og:url` (gleich dem Canonical), `og:image` (absolut), `og:locale`, `og:site_name` sowie die Twitter-Card-Tags.
- Jede Seite hat ein Vorschaubild. Fallback: `/images/og-default.jpg`, bei CMS-Beiträgen das Titelbild.
- Artikel und Analysen sollen `og:type` `article` mit Veröffentlichungsdatum setzen. Bisher ist es überall `website` (siehe `docs/OFFENE-PUNKTE.md`).

### 17.6 Strukturierte Daten

- Strukturierte Daten (JSON-LD, schema.org) nur dort, wo sie den Inhalt korrekt beschreiben: `Organization` auf der Startseite, `Article` für Analysen und Beiträge, `Event` für Termine. Kein Markup für Inhalte, die auf der Seite nicht sichtbar sind.
- Eingebunden als `<script type="application/ld+json">`. Das führt kein JavaScript aus und ist mit `script-src 'self'` vereinbar. `scripts/check-csp.mjs` lässt diesen Typ bereits zu.
- Bisher gibt es keine strukturierten Daten.

### 17.7 HTTP-Statuscodes und 404-Seite

- Vorhandene Seiten antworten mit 200, verschobene mit 301 (17.8), fehlende mit 404. Kein „Soft 404“: Eine fehlende Seite liefert nie Status 200 oder eine Weiterleitung auf die Startseite.
- `src/pages/404.astro` wird zu `dist/404.html`. Beide Server-Vorlagen unter `deploy/` liefern sie für fehlende Pfade aus. Nach dem Deployment wird geprüft, dass dabei Status 404 ankommt (`docs/DEPLOYMENT.md`).
- Die 404-Seite hilft weiter: Sie verlinkt die Startseite, den Kontakt und die Hauptrubriken (`src/pages/404.astro`). Kommt eine neue Hauptrubrik hinzu, wird sie dort ergänzt.

### 17.8 Stabile URLs und Weiterleitungen

Bestehende URLs und zitierfähige Inhalte bleiben erhalten. Eine Änderung der URL-Struktur darf nicht dazu führen, dass journalistische oder wissenschaftliche Verweise ins Leere laufen.

- **Veröffentlichte URLs sind dauerhaft.** Slugs werden nach der Veröffentlichung nicht geändert, auch nicht bei Titeländerungen. Ausnahme nur mit Weiterleitung.
- **Jede geänderte oder entfallene URL bekommt eine 301-Weiterleitung** auf die inhaltlich passende neue Seite, ersatzweise auf die nächsthöhere Rubrik. Nie pauschal auf die Startseite. Gibt es den Inhalt nicht mehr, ist 404 (bzw. 410) richtig.
- **Migration von WordPress:** Alle alten URLs werden abgebildet. Die Quelle ist die Zeile „Original URL“ in jeder Datei unter `stoppramstein_content/`. Die alte Seite lief unter `www.stoppramstein.de`, die neue unter `stoppramstein.de`. Auch `www` muss per 301 umgeleitet werden, unter Beibehaltung des Pfads.
- **Pflege:** Weiterleitungen stehen als feste Paare in der Server-Konfiguration (`deploy/Caddyfile.example`, `deploy/nginx.conf.example`, Ablauf in `docs/DEPLOYMENT.md`, „Weiterleitungen“) und werden nie entfernt. Für Sicherheit gilt 14.8.
- **Stand:** Eine Weiterleitungstabelle gibt es noch nicht. Mehrere alte URLs haben kein direktes Gegenstück (siehe `docs/OFFENE-PUNKTE.md`).

### 17.9 Doppelte Inhalte vermeiden

- Jeder Inhalt ist nur unter einer URL erreichbar. Alle Varianten leiten per 301 dorthin: `www` → ohne `www`, `http` → `https`, ohne → mit abschließendem Schrägstrich (die nginx-Vorlage enthält die Regel für den Schrägstrich).
- Texte werden nicht auf mehrere Seiten kopiert. Wird derselbe Inhalt an zwei Stellen gebraucht, verlinkt eine Seite auf die andere, oder der Inhalt wird als Komponente bzw. Collection-Eintrag wiederverwendet und der Canonical zeigt auf die Hauptseite.
- Gefilterte oder sortierte Listen erzeugen keine eigenen indexierbaren URLs.

### 17.10 Interne Verlinkung

- Kernargumente (`/warum-ramstein/`), Fakten und Analysen verweisen aufeinander, wo sie dasselbe Thema behandeln. Jede Analyse verlinkt mindestens ein passendes Kernargument oder die Faktenseite.
- Keine Waisenseiten: Jede indexierbare Seite ist über Navigation, Footer oder einen Link aus dem Inhalt erreichbar, nicht nur über die Sitemap.
- Linktexte beschreiben das Ziel („Völkerrechtliche Bewertung“), nicht „hier“ oder „mehr“.
- Interne Links zeigen direkt auf die kanonische URL, nicht auf eine Weiterleitung. `npm run check-links` prüft, dass interne Links auflösen.

---

## 18. Testing & Quality Assurance

### 18.1 Prüfebenen

Die Qualitätssicherung hat vier Ebenen. Nicht jede Prüfung muss in der CI laufen. Aber für jede ist festgelegt, ob sie automatisiert oder manuell läuft und wann.

| Ebene | Was wird geprüft? | Werkzeug | Ausführung | Stand |
|-------|-------------------|----------|------------|-------|
| **Statisch** | Typen, Syntax, Content-Schemas; dazu interne Links, CSP-Verträglichkeit, Versionsangaben der Doku | Astro Check, TypeScript, Zod; `check-links`, `check-csp`, `check-doc-versions` | Automatisch: `npm run verify`, lokal vor jedem Commit und in der CI | Vorhanden |
| **Funktional** | Navigation, Suche, Interaktionen (mobiles Menü, Pagefind, Weiterleitungen in der Vorschau) | Playwright | Automatisch in der CI | Geplant |
| **Accessibility** | Kontrast, Semantik, Tastaturbedienung | axe-core (über Playwright) | Automatisch in der CI. Zusätzlich manuell vor Releases und bei neuen interaktiven Komponenten: komplette Tastaturbedienung und Stichprobe mit einem Screenreader | Geplant (automatisch), manuell ab sofort |
| **Visuell** | Layout, Responsive Design, Regressionen | Playwright-Screenshots bei 390, 768 und 1280 px | Manuell bzw. lokal bei Layout-Änderungen, nicht in der CI, weil die Schriftdarstellung zwischen Systemen schwankt. Ergebnis im Pull Request nennen | Geplant, bis dahin manuelle Screenshots |

Weitere manuelle Prüfungen:

- **Lighthouse** vor größeren Releases oder Layout-Änderungen (§9.3).
- **Security-Header** der Live-Seite nach jedem Deployment (§14.9).
- **Redaktionsoberfläche und Payload-Loader gegen eine echte Datenbank** sind bisher nicht automatisch getestet (`docs/OFFENE-PUNKTE.md`, „Nicht automatisch getestet“).

Sobald Playwright und axe-core eingerichtet sind, werden die Testbefehle hier und in `README.md`, „Befehle“, eingetragen.

### 18.2 Definition of Done

Eine Aufgabe gilt erst als abgeschlossen, wenn:

- [ ] **die Implementierung vollständig ist:** keine Platzhalter, keine auskommentierten Reste, keine stillschweigend ausgelassenen Teile. Was bewusst offen bleibt, steht in `docs/OFFENE-PUNKTE.md` bzw. `docs/REDAKTION-TODO.md`.
- [ ] **die relevanten Tests erfolgreich sind:** immer `npm run verify`, dazu die Prüfebenen aus 18.1, die die Änderung berührt (z. B. Screenshots bei Layout-Änderungen, `cms/` bauen bei CMS-Änderungen).
- [ ] **keine bestehenden Funktionen unbeabsichtigt beschädigt wurden:** Navigation, Suche, interne Links und bestehende URLs funktionieren weiter (§17.8).
- [ ] **die Barrierefreiheit nicht verschlechtert wurde:** Tastaturbedienung, Fokus, Kontrast und Überschriftenhierarchie sind mindestens so gut wie vorher (§8).
- [ ] **die Dokumentation aktualisiert wurde, sofern erforderlich:** Guidelines, `README.md`, `CONTRIBUTING.md` und `docs/` beschreiben den neuen Stand.
- [ ] **die Änderungen nachvollziehbar dokumentiert sind:** Commit-Messages nach §13.1, Pull Request mit Was und Warum. Fehlerbehebungen und größere Umbauten bekommen einen Eintrag in `docs/AENDERUNGSPROTOKOLL.md` (Problem, Fix, Nachweis).

---

## 19. Resolved Decisions

The following items were clarified on 2026-01-30:

| Question | Decision |
|----------|----------|
| **Newsletter Service** | `mailto:` link (no form handler) |
| **Contact Form** | `mailto:` link (acceptable) |
| **Multilingual** | Deferred to Phase 2 (German only in Phase 1) |
| **Image Sources** | Source from www.stoppramstein.de; download and self-host |
| **Domain** | Will migrate to stoppramstein.de after site is ready |

---

## 20. Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-30 | 1.0 | Initial guidelines document |
| 2026-11-05 | 1.1 | Neu: §16 User Experience & Information Architecture, §17 SEO, Metadata & Discoverability, §18 Testing & Quality Assurance mit Definition of Done. §14 zu „Security & Privacy by Design“ erweitert (14.4–14.11). |

---

**End of Guidelines**
