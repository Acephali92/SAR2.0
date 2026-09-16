# Mitwirken

Danke für dein Interesse, an der Website von „Stopp Air Base Ramstein“ mitzuarbeiten. Dieses Dokument richtet sich an Ehrenamtliche mit und ohne Vorerfahrung in Astro/Tailwind.

## Setup

```bash
git clone https://github.com/Acephali92/SAR2.0.git
cd SAR2.0
npm install
npm run dev
```

Dev-Server läuft unter `http://localhost:4321`. Voraussetzung: Node.js ≥ 22.

## Bevor du beiträgst

Lies zuerst:
- [`CLAUDE.md`](./CLAUDE.md) — verbindliche Kurzregeln (Stack, Verbote, Content Security Policy)
- [`guidelines.md`](./guidelines.md) — ausführliche Projektregeln
- [`docs/INHALTE-PFLEGEN.md`](./docs/INHALTE-PFLEGEN.md) — falls du nur Inhalte (Texte, Artikel, Termine) bearbeitest, nicht Code

## Zwei Arten von Beiträgen

### Nur Inhalte ändern (kein Code)

Bearbeite die passende `.md`-Datei unter `src/content/<collection>/`. Siehe [`docs/INHALTE-PFLEGEN.md`](./docs/INHALTE-PFLEGEN.md) für die Pflichtfelder pro Collection. Wichtig:
- Alle Fakten brauchen eine Quelle (`sources`-Feld) — keine Zahlen oder Aussagen erfinden.
- Unbelegte Aussagen in [`docs/REDAKTION-TODO.md`](./docs/REDAKTION-TODO.md) eintragen statt löschen oder frei erfinden.
- `stoppramstein_content/` ist nur Referenzmaterial (migrierte alte Seite) — dort nichts ändern.

### Code ändern

- Kein React/Vue/Preact, keine UI-Libraries (shadcn, radix, …), kein Tracking, keine externen CDNs, keine Cookies (siehe `CLAUDE.md`).
- Farben/Abstände/Schriften über die bestehenden Tailwind-Tokens (`tailwind.config.mjs` → `src/styles/global.css`) verwenden, keine neuen willkürlichen Hex-Werte in Klassen wie `bg-[#...]`.
- Inline-`<script>`-Tags vermeiden (Production-CSP ist `script-src 'self'`).

## Branch- und Commit-Konventionen

- Feature-Branches: `feat/<kurzname>`, `fix/<kurzname>`, `chore/<kurzname>`
- Commit-Messages im [Conventional-Commits](https://www.conventionalcommits.org/)-Format:

```
feat: add ArticleLayout with sidebar ToC
fix: correct font loading order
docs: update README with architecture section
chore: update dependencies
```

## Vor jedem Commit

```bash
npm run verify
```

Muss fehlerfrei durchlaufen (Typecheck + Build + Link-Check). Optional zusätzlich `npm run check-csp` gegen den Build-Output prüfen (aktuell nicht Teil von `verify`, siehe [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)).

## Pull Requests

- Kurze, klare Beschreibung: was wurde geändert und warum.
- Bei Content-PRs: Quellen für neue Fakten verlinken.
- CI (`.github/workflows/ci.yml`) führt `npm run verify` automatisch aus.
