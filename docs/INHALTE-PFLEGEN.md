# Inhalte pflegen

Anleitung für Redakteur:innen, die Content über die Astro Content Collections pflegen (kein Code-Wissen nötig, nur Markdown + Frontmatter).

## Grundprinzip

Jede Content-Datei liegt als `.md`-Datei unter `src/content/<collection>/` und beginnt mit einem YAML-Frontmatter-Block. Das Schema pro Collection ist in `src/content/config.ts` festgelegt (Zod-Validierung) — **ein Build schlägt fehl**, wenn Pflichtfelder fehlen oder falsch typisiert sind. Das ist gewollt: fehlerhafte Inhalte gehen nicht live.

Nach jeder Änderung: `npm run verify` lokal laufen lassen (siehe README), bevor committet/deployt wird.

## Basis-Felder (alle Collections)

```yaml
---
title: "Seitentitel"
description: "Meta-Beschreibung für SEO, max. 160 Zeichen"
publishedAt: 2026-01-30
updatedAt: 2026-02-01   # optional
draft: false            # optional, Standard: false
---
```

## Pflichtfelder pro Collection

### `warum-ramstein/` — Kernargumente

| Feld | Pflicht | Werte |
|------|---------|-------|
| `category` | Ja | `drohnenkrieg`, `umwelt`, `voelkerrecht`, `deutschland` |
| `order` | Nein | Zahl, Standard `0` (manuelle Sortierung) |
| `sources` | Nein | Liste `{ label, url }` — siehe Beleg-Pflicht unten |

### `analysen/` — Geopolitische Analysen

| Feld | Pflicht | Werte |
|------|---------|-------|
| `author` | Nein | Name |
| `tags` | Nein | Liste von Strings, Standard `[]` |
| `relatedSlugs` | Nein | Slugs verwandter Artikel |
| `image` | Nein | `{ src, alt }` |

### `aktionen/` — Veranstaltungen

| Feld | Pflicht | Werte |
|------|---------|-------|
| `eventType` | Ja | `friedenswoche`, `demonstration`, `konferenz`, `workshop`, `sonstiges` |
| `startDate` | Ja | Datum |
| `endDate` | Nein | Datum |
| `location` | Ja | `{ name, address?, city? }` |
| `registrationUrl` | Nein | Gültige URL |
| `status` | Nein | `upcoming`, `ongoing`, `completed`, `cancelled` — Standard `upcoming` |

### `mitmachen/` — Mitmach-Seiten

| Feld | Pflicht | Werte |
|------|---------|-------|
| `ctaType` | Ja | `spenden`, `mitgliedschaft`, `ehrenamt`, `petition` |
| `contactEmail` | Nein | Gültige E-Mail-Adresse |
| `order` | Nein | Zahl, Standard `0` |

### `seiten/` — Statische Seiten (Impressum, Kontakt, …)

| Feld | Pflicht | Werte |
|------|---------|-------|
| `pageWidth` | Nein | `default`, `wide`, `narrow` — Standard `default` |
| `showInNav` | Nein | `true`/`false` — Standard `false` |

## Beleg-Pflicht für Fakten

Verbindlich laut `CLAUDE.md`: **Alle Fakten müssen belegt sein.** Keine Zahlen, Quellen oder Personen erfinden. Nutze bei `warum-ramstein`-Artikeln das `sources`-Feld:

```yaml
sources:
  - label: "Quellenname"
    url: "https://example.com/quelle"
```

Ist eine Aussage (noch) nicht belegbar, trage sie in [`REDAKTION-TODO.md`](./REDAKTION-TODO.md) ein, statt sie unbelegt zu veröffentlichen oder zu erfinden.

## Neuen Inhalt anlegen

1. Neue `.md`-Datei im passenden Collection-Ordner anlegen, z. B. `src/content/warum-ramstein/neues-argument.md`.
2. Frontmatter gemäß Tabelle oben ausfüllen.
3. Markdown-Inhalt darunter schreiben.
4. `npm run verify` ausführen — bricht bei Schema-Fehlern mit klarer Meldung ab.
5. `npm run dev` zur Vorschau nutzen (`http://localhost:4321`).

**Beispiel:**

```yaml
---
title: "Artikeltitel"
description: "Max. 160 Zeichen für SEO"
publishedAt: 2026-01-15
category: drohnenkrieg
order: 5
sources:
  - label: "Quellenname"
    url: "https://example.com/quelle"
---

Markdown-Inhalt hier...
```

## Read-Only-Ordner

`stoppramstein_content/` enthält migrierte WordPress-Inhalte als Referenz. **Nicht verändern** — nur als Quelle für neue, ordentlich geprüfte Inhalte in `src/content/` verwenden.
