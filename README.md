# Stopp Air Base Ramstein

Statische Website der Friedensinitiative „Stopp Air Base Ramstein“ ([stoppramstein.de](https://stoppramstein.de)) — Dokumentationsarchiv und Kampagnenplattform für die Schließung der US Air Base Ramstein.

![Screenshot der Startseite](docs/screenshot.png)

![CI](https://github.com/Acephali92/SAR2.0/actions/workflows/ci.yml/badge.svg)
![Astro](https://img.shields.io/badge/Astro-BC52EE?style=flat-square&logo=astro&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

## Status

Kernbereiche sind live: Warum-Ramstein-Argumente (4 Artikel), Analysen (2 Artikel), eine Aktion (Friedenswoche 2026), Mitmach-Seiten (Spenden, Mitgliedschaft, Ehrenamt, Aufruf) sowie die rechtlich nötigen Seiten (Impressum, Datenschutz, Kontakt, Presse, Über uns, Fakten). Offene Punkte für die Redaktion: [`docs/REDAKTION-TODO.md`](docs/REDAKTION-TODO.md). Offene Punkte zu Technik und Betrieb: [`docs/OFFENE-PUNKTE.md`](docs/OFFENE-PUNKTE.md).

## Schnellstart

```bash
git clone https://github.com/Acephali92/SAR2.0.git
cd SAR2.0
npm install
npm run dev
```

Dev-Server: `http://localhost:4321`. Voraussetzung: Node.js ≥ 22.

## Befehle

| Befehl | Zweck |
|--------|-------|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktions-Build nach `dist/` (inkl. Pagefind-Suchindex) |
| `npm run preview` | Produktions-Build lokal ansehen |
| `npm run typecheck` | TypeScript-/Schema-Prüfung |
| `npm run check-links` | Interne Links im Build-Output prüfen |
| `npm run check-csp` | Build-Output auf Inline-Scripts/CSP-Verstöße prüfen |
| `npm run verify` | typecheck + build + check-links + check-csp — **vor jedem Commit ausführen** |

## Stack

Astro 7.x (statische Ausgabe) · Tailwind CSS 3.x · Astro Content Collections mit Zod-Validierung · Pagefind-Suche · TypeScript (strict). Details: [`docs/ARCHITEKTUR.md`](docs/ARCHITEKTUR.md).

Beiträge (Nachrichten/Analysen) und Termine werden über eine selbst gehostete Redaktionsoberfläche (Payload CMS 3 + PostgreSQL, eigenständiges Projekt in `cms/`) gepflegt und fließen nur zur Build-Zeit in die statische Seite ein — die Website bleibt vollständig statisch und funktioniert auch bei einem CMS-Ausfall weiter. CMS-Befehle laufen unter `npm --prefix cms run <script>`, siehe [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Dokumentation

| Dokument | Inhalt |
|----------|--------|
| [`CLAUDE.md`](CLAUDE.md) | Verbindliche Kurzregeln für Code-Änderungen (Stack, Verbote, CSP) |
| [`guidelines.md`](guidelines.md) | Ausführliche Projektregeln |
| [`docs/ARCHITEKTUR.md`](docs/ARCHITEKTUR.md) | Datenfluss, Komponenten, Content-Schema, Verzeichnisstruktur (mit Diagrammen) |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Server-Konfiguration (Caddy/nginx), CSP-Header, Rebuild-Prozess, Team-Vorschau |
| [`docs/INHALTE-PFLEGEN.md`](docs/INHALTE-PFLEGEN.md) | Anleitung für die Redaktion zum Bearbeiten von Inhalten |
| [`docs/REDAKTION-TODO.md`](docs/REDAKTION-TODO.md) | Für die Redaktion: unbelegte Aussagen, inhaltliche Lücken, offene redaktionelle Entscheidungen |
| [`docs/OFFENE-PUNKTE.md`](docs/OFFENE-PUNKTE.md) | Technik und Betrieb: Anforderungsstatus, Betreiber-Entscheidungen, offene technische Punkte, bewusste Einschränkungen |
| [`docs/AENDERUNGSPROTOKOLL.md`](docs/AENDERUNGSPROTOKOLL.md) | Erledigte Fehlerbehebungen, Sicherheitsfixes und Umbauten |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Setup und Ablauf für Ehrenamtliche |
| [`cms/README.md`](cms/README.md) | Redaktionsoberfläche (Payload CMS 3): lokales Setup, Datenmodell, Scripts, Troubleshooting |

## Lizenz / Kontakt

Kontakt: `info@stoppramstein.de`. Rechtliche Angaben: [`/impressum/`](https://stoppramstein.de/impressum/).
