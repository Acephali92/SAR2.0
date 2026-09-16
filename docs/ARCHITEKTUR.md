# Architektur

Technischer Überblick über SAR2.0: Datenfluss, Komponenten-Hierarchie, Content-Collection-Schema und Verzeichnisstruktur.

## Tech-Stack

| Layer | Technologie | Version | Zweck |
|-------|-------------|---------|-------|
| Framework | Astro | 5.1.1 | Statische Seitengenerierung, kein JS by default |
| Content | Astro Content Collections | — | Typsicheres Markdown mit Zod-Validierung |
| Styling | Tailwind CSS | 3.4.17 | Utility-first CSS |
| Typografie | `@tailwindcss/typography` | 0.5.16 | Prose-Styling für Artikel |
| Typsicherheit | TypeScript | 5.7.3 | Strict Mode |
| Suche | Pagefind | 1.3.0 | Statischer, clientseitiger Suchindex |
| Bildoptimierung | sharp | 0.33.5 | Für `scripts/generate-assets.mjs` |

Selbst gehostete Schriften: IBM Plex Sans/Serif/Mono unter `public/fonts/`. Keine Google Fonts, keine externen CDNs (siehe CLAUDE.md).

## Pfad-Aliase

Definiert in `tsconfig.json`:

| Alias | Zielt auf |
|-------|-----------|
| `@/*` | `src/*` |
| `@components/*` | `src/components/*` |
| `@layouts/*` | `src/layouts/*` |
| `@content/*` | `src/content/*` |
| `@styles/*` | `src/styles/*` |
| `@utils/*` | `src/utils/*` (Ordner existiert aktuell nicht — reservierter Alias, noch ungenutzt) |

## Datenfluss beim Build

```mermaid
flowchart TD
    subgraph BUILD["Build Process (npm run build)"]
        A[Markdown Content<br/>src/content/] --> B[Astro Content Collections]
        B --> C[Zod Schema Validation]
        C --> D[Astro Build Engine]
        E[Astro Components<br/>src/pages/, src/layouts/] --> D
        F[Tailwind CSS<br/>src/styles/] --> D
        G[Static Assets<br/>public/] --> D
    end

    subgraph OUTPUT["Static Output (dist/)"]
        D --> H[HTML Pages]
        D --> I[CSS Bundle]
        D --> J[Static Assets]
        H --> K[Pagefind Indexer]
        K --> L[Search Index]
    end

    subgraph SERVE["Production Server"]
        H --> M[Static File Server<br/>Caddy/nginx]
        I --> M
        J --> M
        L --> M
        M --> N[Client Browser]
    end
```

## Komponenten-Hierarchie

```mermaid
flowchart TD
    subgraph LAYOUTS["Layout Hierarchy"]
        BASE[BaseLayout.astro<br/>HTML shell, head, fonts, meta]
        PAGE[PageLayout.astro<br/>Header + Footer wrapper]
        ART[ArticleLayout.astro<br/>Long-form with ToC]
        EVT[EventLayout.astro<br/>Event metadata display]
        MIT[MitmachenLayout.astro<br/>Engagement pages]
        ARG[ArgumentLayout.astro<br/>Warum Ramstein articles]

        BASE --> PAGE
        PAGE --> ART
        PAGE --> EVT
        PAGE --> MIT
        PAGE --> ARG
    end

    subgraph COMPONENTS["Component Categories"]
        GLOBAL[global/<br/>Header, Footer]
        UI[ui/<br/>Button, Card, Badge]
        CONTENT[content/<br/>Callout, EventCard,<br/>PersonCard, SourceLink]
    end

    PAGE --> GLOBAL
    ART --> CONTENT
    EVT --> CONTENT
    UI --> PAGE
```

> Hinweis: `src/components/interactive/` ist in der Kategorisierung vorgesehen, existiert im Repo aktuell aber noch nicht.

## Request-Flow (statische Seite)

```mermaid
sequenceDiagram
    participant B as Browser
    participant S as Static Server
    participant P as Pagefind

    B->>S: GET /warum-ramstein/drohnenkrieg/
    S->>B: HTML (pre-rendered)
    B->>S: GET /styles.css
    S->>B: CSS Bundle
    B->>S: GET /fonts/IBMPlexSans-Regular.woff2
    S->>B: Font File

    Note over B: User initiates search
    B->>P: Load /pagefind/pagefind-ui.js
    P->>B: Search UI Script
    B->>P: Query "Drohne"
    P->>B: Search Results (client-side)
```

## Content-Collection-Schema

Definiert in `src/content/config.ts`. Alle Collections erweitern das Basis-Schema (`baseSchema`); ein Build bricht ab, wenn Frontmatter nicht dazu passt. Details zu den Pflichtfeldern pro Collection: siehe [INHALTE-PFLEGEN.md](./INHALTE-PFLEGEN.md).

```mermaid
erDiagram
    BASE_SCHEMA {
        string title "Required, min 1 char"
        string description "Max 160 chars (SEO)"
        date publishedAt "Required"
        date updatedAt "Optional"
        boolean draft "Default: false"
    }

    WARUM_RAMSTEIN {
        enum category "drohnenkrieg|umwelt|voelkerrecht|deutschland"
        number order "For manual sorting"
        array sources "label + url pairs"
    }

    AKTIONEN {
        enum eventType "friedenswoche|demonstration|konferenz|workshop|sonstiges"
        date startDate "Required"
        date endDate "Optional"
        object location "name, address, city"
        string registrationUrl "Optional"
        enum status "upcoming|ongoing|completed|cancelled"
    }

    MITMACHEN {
        enum ctaType "spenden|mitgliedschaft|ehrenamt|petition"
        string contactEmail "Optional"
        number order "For sorting"
    }

    SEITEN {
        enum pageWidth "default|wide|narrow"
        boolean showInNav "Default: false"
    }

    ANALYSEN {
        string author "Optional"
        array tags "String array"
        array relatedSlugs "Related articles"
        object image "src + alt"
    }

    BASE_SCHEMA ||--o{ WARUM_RAMSTEIN : extends
    BASE_SCHEMA ||--o{ AKTIONEN : extends
    BASE_SCHEMA ||--o{ MITMACHEN : extends
    BASE_SCHEMA ||--o{ SEITEN : extends
    BASE_SCHEMA ||--o{ ANALYSEN : extends
```

## Datenverarbeitung (Art. 13 DSGVO)

```mermaid
flowchart LR
    subgraph CLIENT["Client Browser"]
        A[User Request]
    end

    subgraph SERVER["Static Server (EU)"]
        B[HTML/CSS/Assets]
    end

    subgraph LOGS["Server Logs"]
        C[IP Address<br/>Timestamp<br/>Requested Path]
    end

    A -->|HTTPS| B
    B -->|Response| A
    A -.->|Standard HTTP Logs| C

    style LOGS fill:#fff3cd,stroke:#856404
```

Die Website sammelt keine Nutzerdaten über Standard-HTTP-Server-Logs hinaus: keine Cookies, keine Analytics, keine Third-Party-Tracker, keine serverseitige Formularverarbeitung (Kontakt läuft über `mailto:`-Links). Details: `/datenschutz/`.

## Verzeichnisstruktur

```
SAR2.0/
├── src/
│   ├── content/                    # Astro Content Collections
│   │   ├── config.ts               # Schema-Definitionen (SINGLE SOURCE OF TRUTH)
│   │   ├── warum-ramstein/         # index, drohnenkrieg, voelkerrecht, deutschland, umwelt
│   │   ├── aktionen/                # friedenswoche-2026
│   │   ├── mitmachen/               # spenden, mitglied-werden, ehrenamt, aufruf
│   │   ├── seiten/                  # impressum, kontakt, ueber-uns, fakten, datenschutz, presse
│   │   └── analysen/                 # der-griff-nach-groenland, venezuela-ramstein
│   │
│   ├── pages/                      # Datei-basiertes Routing (+ [...slug].astro pro Collection)
│   ├── layouts/                    # BaseLayout, PageLayout, ArticleLayout, EventLayout, MitmachenLayout, ArgumentLayout
│   ├── components/
│   │   ├── global/                 # Header, Footer
│   │   ├── ui/                     # Button, Card, Badge
│   │   └── content/                # Callout, EventCard, PersonCard, SourceLink
│   │
│   └── styles/
│       └── global.css              # Tailwind-Direktiven + CSS Custom Properties (Design-Tokens)
│
├── public/                         # Statische Assets (unverändert kopiert)
├── scripts/                        # check-links.mjs, check-csp.mjs, generate-assets.mjs
├── tools/                          # scraper.py (einmaliges Migrationswerkzeug, siehe unten)
├── stoppramstein_content/          # Migrierte WordPress-Inhalte — nur lesen, nicht verändern
├── docs/                           # Diese Dokumentation
├── dist/                           # Build-Output (git-ignoriert)
│
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── guidelines.md                   # Ausführliche Projektregeln
├── CLAUDE.md                       # Verbindliche Regeln für KI-Assistenten
└── package.json
```

## Migrationswerkzeug

`tools/scraper.py` extrahiert Inhalte von der alten WordPress-Seite nach `stoppramstein_content/`. Einmaliges Werkzeug, nicht Teil des Build-Prozesses. Ausführung: `cd tools && pip install -r requirements.txt && python scraper.py`.
