# Redaktion-TODO

Sammelstelle für unbelegte Aussagen, offene inhaltliche Lücken und bekannte technische Probleme, die vor einem Live-Launch geklärt werden sollten. Referenziert in `CLAUDE.md`.

## Technische Probleme

- **Newsletter-Formular ohne Backend:** `src/pages/index.astro` postet an `action="/api/newsletter"`. Das Projekt ist aber `output: 'static'` (siehe `astro.config.mjs`) — diese Route existiert nicht. Das Formular zeigt aktuell nur eine simulierte Erfolgsmeldung (client-seitiges `setTimeout`), sendet aber keine E-Mail-Adresse irgendwohin. Muss vor Launch entweder an einen echten Formular-Handler (self-hosted, DSGVO-konform) angebunden oder durch einen `mailto:`-Link ersetzt werden (siehe `guidelines.md` §14.3).
- **CSP: Inline-Scripts im Build-Output.** `npm run check-csp` meldet aktuell Inline-`<script>`-Tags in praktisch jeder Seite (u. a. das Mobile-Menü-Toggle aus `Header.astro`, das Formular-Handling in `index.astro`). Ursache: Astro inlined seitenspezifische Scripts standardmäßig direkt ins HTML, statt sie als externe Datei mit `src` auszuliefern. Das widerspricht der CSP-Regel `script-src 'self'` aus `CLAUDE.md`. Deshalb ist `check-csp` bewusst **nicht** Teil von `npm run verify` (würde sonst jeden Build rot färgen). Empfehlung: prüfen, ob sich das Script-Bundling von Astro/Vite so konfigurieren lässt, dass Page-Scripts immer als externe Datei emittiert werden, oder betroffene Scripts manuell nach `public/scripts/` auslagern und per `<script src="...">` einbinden.

## Screenshot

- `docs/screenshot.png` wurde aus `screenshots/Screenshot 2026-09-16 182321.png` übernommen (manueller Screenshot der Startseite, da automatisierte Erstellung per Browser-Tool in dieser Session nicht möglich war). Bei Layout-Änderungen an der Startseite aktualisieren.

## Unbelegte Aussagen

*(Noch keine gemeldet. Beim Redigieren von Inhalten in `src/content/warum-ramstein/`, `src/content/analysen/` etc. hier eintragen, wenn eine Aussage keine Quelle hat.)*
