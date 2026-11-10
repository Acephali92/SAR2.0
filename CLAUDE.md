# SAR2.0 – Projektregeln für KI-Assistenten

## Stack

- **Framework:** Astro 7.x (statische Ausgabe)
- **Styling:** Tailwind CSS 3.x
- **Content:** Astro Content Collections mit Zod-Validierung (`src/content.config.ts`) — teils Markdown (git), teils aus dem CMS (Build-Zeit-Fetch)
- **Suche:** Pagefind
- **Sprache:** TypeScript (strict mode)
- **Redaktion:** Payload CMS 3 + PostgreSQL in `cms/` (eigenständiges npm-Projekt, kein Workspace)

## Wichtige Befehle

```bash
npm run dev         # Entwicklungsserver (http://localhost:4321)
npm run build       # Produktion (nach dist/)
npm run typecheck   # Nur TypeScript-Prüfung
npm run check-links # Interne Links im Build-Output prüfen
npm run check-csp   # Build-Output auf Inline-Scripts/CSP-Verstöße prüfen
npm run check-doc-versions  # Versionsangaben der Doku gegen package.json/.nvmrc prüfen
npm run verify      # check-doc-versions + typecheck + build + check-links + check-csp (CI-Validation)
```

## Verbindliche Regeln

Siehe `guidelines.md` für alle Details. Hier die wichtigsten:

### Verboten

Gilt für die öffentliche Astro-Seite (`src/`, `dist/`). Ausnahme: `cms/` ist ein eigenständiges, intern gehostetes Payload-CMS-Projekt (Next.js/React) für die Redaktion — läuft nie im öffentlichen Build mit, siehe `docs/ARCHITEKTUR.md`.

- **Keine JS-Frameworks:** React, Vue, Preact etc.
- **Keine UI-Libraries:** shadcn, radix, headless-ui
- **Kein Tracking:** Google Analytics, Vercel Analytics etc.
- **Keine externen CDNs:** Google Fonts, unpkg etc.
- **Keine Cookies:** Die Seite ist cookiefrei

### Inhalte

- Sprache ist Deutsch
- Alle Fakten müssen belegt sein (Quellen angeben)
- **Keine Fakten, Zahlen, Quellen oder Personen erfinden!**
- Unbelegte Aussagen in `docs/REDAKTION-TODO.md` notieren
- **Keine Gendersprache:** Keine Doppelpunkt-/Sternchen-/Unterstrich-Formen (`Autor:in`, `Nutzer*innen`, `Leser_innen` etc.) — weder in Inhalten noch in Dokumentation oder UI-Texten. Stattdessen ein passendes neutrales Kollektivum nutzen (z. B. „Redaktion" statt „Redakteur:innen") oder die generische Form (z. B. „Autor", „Nutzer").

### URLs, HTML und Daten

- **Stabile URLs:** Veröffentlichte URLs nicht ändern. Wenn doch: 301-Weiterleitung im selben Commit (`guidelines.md` §17.8). Alte WordPress-URLs müssen weiter funktionieren.
- **Kein ungeprüftes HTML:** `set:html` nur für eigene SVG-Konstanten und CMS-HTML aus `cms/src/lib/lexicalToHtml.ts` (§14.7).
- **Keine Geheimnisse im Repo**, keine Ressourcen von fremden Servern, keine Einbettungen von Dritten (§14.4, §14.6, §14.11). Einzige Ausnahme: Videos als Zwei-Klick-Lösung über `VideoConsent.astro` (§14.6), kein statisches `<iframe>`.
- **Struktur vor Gestaltung:** Jede Seite hat einen erkennbaren Zweck und eine Zielgruppe (§16).

### Versionen

Exakte Versionen stehen nur in `package.json`/`cms/package.json` (Node.js-Minimum: `engines.node`, Entwicklung/CI: `.nvmrc`). In Dokumentation nur Hauptversionen nennen („Astro 7.x“). Siehe `guidelines.md` §2.2.

### Content Security Policy

Die Produktion nutzt `script-src 'self'`. Inline-Scripts vermeiden!

## Read-Only Ordner

**`stoppramstein_content/`** enthält migrierte WordPress-Inhalte.
Nur lesen, nicht verändern!

## Vor jedem Commit

```bash
npm run verify
```

Muss fehlerfrei durchlaufen. Abgeschlossen ist eine Aufgabe erst nach der Definition of Done (`guidelines.md` §18.2).
