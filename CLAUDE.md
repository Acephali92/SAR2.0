# SAR2.0 – Projektregeln für KI-Assistenten

## Stack

- **Framework:** Astro 5.x (statische Ausgabe)
- **Styling:** Tailwind CSS 3.x
- **Content:** Astro Content Collections mit Zod-Validierung
- **Suche:** Pagefind
- **Sprache:** TypeScript (strict mode)

## Wichtige Befehle

```bash
npm run dev         # Entwicklungsserver (http://localhost:4321)
npm run build       # Produktion (nach dist/)
npm run typecheck   # Nur TypeScript-Prüfung
npm run check-links # Interne Links im Build-Output prüfen
npm run check-csp   # Build-Output auf Inline-Scripts/CSP-Verstöße prüfen
npm run verify      # typecheck + build + check-links + check-csp (CI-Validation)
```

## Verbindliche Regeln

Siehe `guidelines.md` für alle Details. Hier die wichtigsten:

### Verboten

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

### Content Security Policy

Die Produktion nutzt `script-src 'self'`. Inline-Scripts vermeiden!

## Read-Only Ordner

**`stoppramstein_content/`** enthält migrierte WordPress-Inhalte.
Nur lesen, nicht verändern!

## Vor jedem Commit

```bash
npm run verify
```

Muss fehlerfrei durchlaufen.
