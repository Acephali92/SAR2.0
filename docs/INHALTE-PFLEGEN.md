# Inhalte pflegen

Es gibt zwei Wege, Inhalte zu pflegen, je nach Content-Typ:

- **Beiträge und Termine** (Nachrichten, Analysen, Veranstaltungen): über die **Redaktionsoberfläche** (Payload CMS), kein Git-/Code-Wissen nötig. Siehe Teil B unten.
- **Alles andere** (Warum-Ramstein-Argumente, Mitmachen-Seiten, rechtliche Seiten): weiterhin als Markdown-Datei per Pull Request. Siehe Teil A unten.

## Teil A: Markdown-Collections (warum-ramstein, mitmachen, seiten)

Anleitung für Redakteur:innen, die Content über die Astro Content Collections pflegen (kein Code-Wissen nötig, nur Markdown + Frontmatter).

### Grundprinzip

Jede Content-Datei liegt als `.md`-Datei unter `src/content/<collection>/` und beginnt mit einem YAML-Frontmatter-Block. Das Schema pro Collection ist in `src/content.config.ts` festgelegt (Zod-Validierung) — **ein Build schlägt fehl**, wenn Pflichtfelder fehlen oder falsch typisiert sind. Das ist gewollt: fehlerhafte Inhalte gehen nicht live.

Nach jeder Änderung: `npm run verify` lokal laufen lassen (siehe README), bevor committet/deployt wird.

### Basis-Felder (alle Markdown-Collections)

```yaml
---
title: "Seitentitel"
description: "Meta-Beschreibung für SEO, max. 160 Zeichen"
publishedAt: 2026-01-30
updatedAt: 2026-02-01   # optional
draft: false            # optional, Standard: false
---
```

### Pflichtfelder pro Collection

#### `warum-ramstein/` — Kernargumente

| Feld | Pflicht | Werte |
|------|---------|-------|
| `category` | Ja | `drohnenkrieg`, `umwelt`, `voelkerrecht`, `deutschland` |
| `order` | Nein | Zahl, Standard `0` (manuelle Sortierung) |
| `sources` | Nein | Liste `{ label, url }` — siehe Beleg-Pflicht unten |

#### `mitmachen/` — Mitmach-Seiten

| Feld | Pflicht | Werte |
|------|---------|-------|
| `ctaType` | Ja | `spenden`, `mitgliedschaft`, `ehrenamt`, `petition` |
| `contactEmail` | Nein | Gültige E-Mail-Adresse |
| `order` | Nein | Zahl, Standard `0` |

#### `seiten/` — Statische Seiten (Impressum, Kontakt, …)

| Feld | Pflicht | Werte |
|------|---------|-------|
| `pageWidth` | Nein | `default`, `wide`, `narrow` — Standard `default` |
| `showInNav` | Nein | `true`/`false` — Standard `false` |

### Beleg-Pflicht für Fakten

Verbindlich laut `CLAUDE.md`: **Alle Fakten müssen belegt sein.** Keine Zahlen, Quellen oder Personen erfinden. Nutze bei `warum-ramstein`-Artikeln das `sources`-Feld:

```yaml
sources:
  - label: "Quellenname"
    url: "https://example.com/quelle"
```

Ist eine Aussage (noch) nicht belegbar, trage sie in [`REDAKTION-TODO.md`](./REDAKTION-TODO.md) ein, statt sie unbelegt zu veröffentlichen oder zu erfinden. Das gilt genauso für Beiträge/Termine im CMS (Teil B).

### Neuen Inhalt anlegen

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

### Read-Only-Ordner

`stoppramstein_content/` enthält migrierte WordPress-Inhalte als Referenz. **Nicht verändern** — nur als Quelle für neue, ordentlich geprüfte Inhalte in `src/content/` verwenden.

## Teil B: Beiträge und Termine über die Redaktionsoberfläche pflegen

Nachrichten, Analysen und Termine werden **nicht** mehr als Markdown-Datei gepflegt, sondern über die Payload-Redaktionsoberfläche — kein Git, kein Code, keine Pull Requests nötig.

### Anmelden

1. `https://redaktion.stoppramstein.de` aufrufen.
2. Mit E-Mail-Adresse und Passwort anmelden (Zugang von Admin einrichten lassen). Passwort vergessen? "Passwort zurücksetzen" auf der Login-Seite nutzen.

### Rollen

| Rolle | Darf |
|-------|------|
| **Autor:in** | Eigene Beiträge/Termine anlegen, bearbeiten und zur Freigabe einreichen |
| **Redaktion** | Zusätzlich: alle Beiträge/Termine einsehen, freigeben, veröffentlichen, zurückziehen |
| **Admin** | Zusätzlich: Nutzer:innen und Rollen verwalten |

### Einen Beitrag anlegen

1. In der Admin-UI: **Beiträge → Erstellen**.
2. Titel, Beschreibung (max. 160 Zeichen), Kategorie (Nachricht/Analyse) ausfüllen.
3. Inhalt im Rich-Text-Editor schreiben: Überschriften, Listen, Links, Zitate und Bilder stehen über die Werkzeugleiste zur Verfügung.
4. **Quellen** für alle Fakten und Zahlen im "Quellen"-Feld eintragen (siehe Beleg-Pflicht oben — gilt hier genauso).
5. Optional: **Verknüpfter Termin** setzen, wenn sich der Beitrag auf eine Veranstaltung bezieht — der Termin zeigt dann automatisch einen Rückverweis auf diesen Beitrag.
6. Bild hochladen: Alt-Text ist Pflichtfeld (Barrierefreiheit) — kurz beschreiben, was auf dem Bild zu sehen ist.
7. Speichern → Status steht auf **Entwurf**.

### Einen Termin anlegen

Analog unter **Termine → Erstellen**: Titel, Beschreibung, Art der Veranstaltung, Beginn/Ende, Ort, ggf. Anmeldelink. Der Abschnitt "Zugehörige Beiträge" füllt sich automatisch, sobald ein Beitrag auf diesen Termin verweist.

### Freigabe und Veröffentlichung

Jeder Beitrag/Termin durchläuft drei Stufen:

1. **Entwurf** — Autor:in schreibt und bearbeitet.
2. **Zur Freigabe** — Autor:in reicht den fertigen Entwurf ein (Status im Seitenmenü umstellen). Ab hier kann nur noch Redaktion/Admin etwas ändern.
3. **Veröffentlicht** — Redaktion oder Admin schaltet frei. Ab hier ist der Inhalt öffentlich sichtbar.

Redaktion kann einen eingereichten Entwurf auch zurück auf "Entwurf" setzen (z. B. mit Korrekturwunsch) oder einen veröffentlichten Beitrag wieder zurückziehen.

### Zeitgesteuerte Veröffentlichung

Im Feld **Geplante Veröffentlichung** (rechte Seitenleiste) ein Datum/Uhrzeit setzen, während der Status auf "Zur Freigabe" steht. Das System prüft alle paar Minuten automatisch, ob der Zeitpunkt erreicht ist, und veröffentlicht dann selbstständig — eine Freigabe durch Redaktion ist weiterhin Voraussetzung, ein Entwurf wird nicht allein durch Zeitablauf live.

### Was passiert nach dem Veröffentlichen?

Nichts weiter zu tun — die Website baut sich **automatisch neu** und ist binnen weniger Minuten aktuell. Kein manueller Build, kein Deploy, kein Git nötig.
