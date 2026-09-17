# Redaktionsbereich (Payload CMS 3 + PostgreSQL)

Selbst gehostete Redaktionsoberfläche für [stoppramstein.de](https://stoppramstein.de). Ehrenamtliche legen hier Beiträge (Nachrichten/Analysen) und Termine an, ohne Git- oder GitHub-Kenntnisse. Die öffentliche Website (Astro, im Repo-Wurzelverzeichnis) bleibt vollständig statisch — sie liest veröffentlichte Inhalte nur **zur Build-Zeit** von hier, nie zur Laufzeit. Fällt dieser Dienst aus, läuft die bereits gebaute Website unverändert weiter.

Dieses Verzeichnis ist ein **eigenständiges npm-Projekt** (eigene `package.json`/`package-lock.json`, bewusst **kein** npm-Workspace mit dem Astro-Root) — Payload- und Astro-Abhängigkeiten werden unabhängig voneinander aktualisiert.

Für den großen Zusammenhang (Architektur, Datenfluss, warum diese Trennung) siehe [`../docs/ARCHITEKTUR.md`](../docs/ARCHITEKTUR.md). Für Betrieb/Deployment auf dem Produktionsserver siehe [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md). Für die redaktionelle Bedienungsanleitung siehe [`../docs/INHALTE-PFLEGEN.md`](../docs/INHALTE-PFLEGEN.md), Teil B. Dieses README richtet sich an **Entwicklung/technische Betreuung**, die lokal an `cms/` arbeiten.

## Schnellstart (lokale Entwicklung)

Voraussetzungen: Node.js ≥ 22, Docker (für Postgres).

```bash
cd cms
cp .env.example .env
# .env ausfüllen: DATABASE_URI kann so bleiben, wenn Postgres per Docker läuft;
# PAYLOAD_SECRET mit `openssl rand -base64 48` erzeugen; SMTP/Webhook-Werte können
# für lokale Entwicklung Platzhalter bleiben (Passwort-Reset/Rebuild-Mail laufen dann nicht).

docker compose up -d postgres   # nur die Datenbank lokal starten
npm install
npm run dev                      # Payload-Admin unter http://localhost:3000/admin
```

Beim ersten Aufruf von `/admin` fragt Payload nach einem ersten Admin-Nutzer — danach in der Admin-UI weitere Nutzer mit passender Rolle anlegen (siehe [Rollen](#rollen-m2) unten).

Nach Änderungen an Collections/Feldern: `npm run generate:types` erzeugt `src/payload-types.ts` (generiert, nicht committen — siehe `.gitignore`).

Um den kompletten Stack lokal zu testen (inkl. Rebuild-Webhook, Backup-Cron), siehe [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md#cms-infrastruktur-docker) — `docker compose up -d` ohne den `postgres`-Filter startet alles.

## Projektstruktur

```
cms/
├── src/
│   ├── payload.config.ts       # Zentrale Konfiguration: DB-Adapter, Collections, Jobs Queue
│   ├── collections/
│   │   ├── Users.ts             # Login (M1), Rollen (M2)
│   │   ├── Media.ts             # Upload, automatische Größenvarianten, Pflicht-Alt-Text (M4)
│   │   ├── Beitraege.ts         # Nachrichten/Analysen (M6)
│   │   └── Termine.ts           # Veranstaltungen (M6)
│   ├── fields/
│   │   ├── statusField.ts       # Redaktioneller Status + zugehörige Sidebar-Felder (M5)
│   │   └── slugField.ts         # Auto-Slug aus Titel, editierbar
│   ├── access/                  # Zugriffsregeln (Rollen × Status-Übergänge)
│   ├── hooks/
│   │   ├── setCreatedBy.ts      # Stempelt den Ersteller (für "nur eigene Entwürfe")
│   │   ├── setPublishedAt.ts    # Stempelt das erste Veröffentlichungsdatum
│   │   ├── addRenderedHtml.ts   # Lexical → HTML für den Astro-Loader (afterRead)
│   │   └── triggerRebuild.ts    # M9: ruft den Rebuild-Webhook bei Publish/Unpublish auf
│   ├── jobs/
│   │   └── schedulePublish.ts   # M5: zeitgesteuerte Veröffentlichung (Jobs Queue, alle ~5 Min.)
│   ├── lib/
│   │   ├── editorConfig.ts      # Lexical-Feature-Allowlist (Sicherheitsgrenze, siehe unten)
│   │   ├── lexicalToHtml.ts     # Rich-Text → HTML
│   │   ├── slugify.ts
│   │   └── markdownToLexical.ts # Nur für die Einmalmigration (seed-import.ts)
│   └── app/(payload)/           # Next.js-Admin-Oberfläche (Payload-Standard-Scaffold)
├── scripts/
│   ├── seed-import.ts           # Einmalige Migration der 3 bestehenden Markdown-Artikel
│   └── export-content.mjs       # M10: Export als Markdown/JSON
├── webhook/                     # M9: eigener kleiner Node-Dienst, siehe docker-compose.yml
├── backup/                      # M10: Cron-Container für nächtliche Backups
└── docker-compose.yml
```

## Umgebungsvariablen

Vollständige Liste mit Kommentaren: [`.env.example`](./.env.example). Kurzreferenz:

| Variable | Zweck |
|----------|-------|
| `DATABASE_URI` | Postgres-Verbindung |
| `PAYLOAD_SECRET` | Signiert Sessions/Tokens — lang, zufällig, geheim |
| `PAYLOAD_PUBLIC_SERVER_URL` / `NEXT_PUBLIC_SERVER_URL` | Öffentliche URL der Redaktionsoberfläche |
| `UPLOAD_DIR` | Ablageort für Medien-Uploads |
| `SMTP_*`, `REDAKTION_NOTIFY_EMAIL` | Passwort-Reset-Mails (M1) und Rebuild-Fehlerbenachrichtigung (M9) |
| `REBUILD_WEBHOOK_URL` / `REBUILD_WEBHOOK_SECRET` | M9: Trigger für den Astro-Rebuild |
| `PAYLOAD_API_TOKEN` | API-Key eines Service-Nutzers, mit dem der Astro-Build lesend zugreift (siehe unten) |

**Service-Nutzer für den Astro-Build:** In der Admin-UI einen Nutzer anlegen (z. B. `build@stoppramstein.de`, Rolle egal, da der Astro-Loader nur öffentliche, veröffentlichte Daten liest), API-Key aktivieren, Key kopieren und im Astro-Build-Environment als `PAYLOAD_API_TOKEN` hinterlegen (nicht in diesem `.env`, sondern dort, wo `npm run build` für die Astro-Seite läuft).

## Datenmodell

### Rollen (M2)

| Rolle | Darf |
|-------|------|
| `autor` | Eigene Beiträge/Termine anlegen, bearbeiten, zur Freigabe einreichen |
| `redaktion` | Zusätzlich: alle Inhalte einsehen, freigeben, veröffentlichen, zurückziehen |
| `admin` | Zusätzlich: Nutzer:innen und Rollen verwalten |

Umgesetzt in `src/collections/Users.ts` (Feld `role`) und den Access-Funktionen in `src/access/`.

### Redaktioneller Workflow (M5)

Eigenes `status`-Feld (`src/fields/statusField.ts`), **zusätzlich** zu Payloads nativem `versions.drafts` (das sichert Revisionshistorie, ersetzt aber nicht den 3-stufigen Freigabeprozess):

| Von → Nach | Autor:in | Redaktion/Admin |
|---|---|---|
| — → `entwurf` | ✅ (eigene) | ✅ |
| `entwurf` → `zur_freigabe` | ✅ (eigene) | ✅ |
| `zur_freigabe` → `entwurf` | ❌ | ✅ |
| `zur_freigabe` → `veroeffentlicht` | ❌ | ✅ |
| `veroeffentlicht` → `entwurf` | ❌ | ✅ |

Durchgesetzt über `src/access/canTransitionStatus.ts` (Feld-Access) und `src/access/ownDraftOrRedaktion.ts` (Dokument-Access). **Zeitgesteuerte Veröffentlichung:** Feld `publishAt` + Jobs-Queue-Task `src/jobs/schedulePublish.ts` (Cron `*/5 * * * *` in `payload.config.ts`) — prüft alle ~5 Minuten auf fällige, bereits freigegebene (`zur_freigabe`) Dokumente.

### Beitrag ↔ Termin (M6)

`Beitraege.verknuepfterTermin` ist eine `relationship`-Feld (schreibbar). `Termine.verknuepfteBeitraege` ist ein `join`-Feld — spiegelt die Beziehung automatisch, **nicht direkt editierbar**. Die Verknüpfung wird also ausschließlich auf der Beitragsseite gepflegt; keine Doppelpflege, kein Drift.

### Rich Text und Sicherheit (M3, M7)

`src/lib/editorConfig.ts` definiert eine **bewusste Feature-Allowlist** für den Lexical-Editor (Überschriften h2/h3, Listen, Links, Zitate, Bold/Italic, Bilder) — **kein** HTML-Block- oder Embed-Feature. Das ist die eigentliche Sicherheitsgrenze: Redakteur:innen können strukturell kein `<script>` oder rohes HTML einschleusen, unabhängig davon, wie sorgfältig die HTML-Konvertierung (`lexicalToHtml.ts`) ist. Neue Editor-Features nur nach Rücksprache aktivieren — die öffentliche Seite verlässt sich auf diese Grenze, um `script-src 'self'` einzuhalten (`scripts/check-csp.mjs` im Astro-Root scannt das Build-Ergebnis).

### Medien (M4)

`src/collections/Media.ts`: Bild-/PDF-Upload, automatische Größenvarianten (`thumbnail`/`card`/`og`, via `sharp`), **Pflichtfeld `alt`** direkt auf der Media-Collection (nicht pro Verwendung). Der Astro-Loader lädt referenzierte Bilder beim Build in `public/media/cms/` herunter (nicht als Live-Link zur CMS-Domain) — Details dazu in [`../docs/ARCHITEKTUR.md`](../docs/ARCHITEKTUR.md#cms-integration-payload-cms-3).

## Scripts

| Befehl | Zweck |
|--------|-------|
| `npm run dev` | Lokaler Next.js/Payload-Entwicklungsserver |
| `npm run build` / `npm run start` | Produktions-Build/-Start (läuft normalerweise im Docker-Container, siehe `Dockerfile`) |
| `npm run generate:types` | Generiert `src/payload-types.ts` aus den Collections |
| `npm run seed` | Einmalige Migration der 3 bestehenden Markdown-Artikel nach Payload (siehe `scripts/seed-import.ts`) — idempotent, gegen eine laufende Instanz |
| `npm run export` | M10: Export aller veröffentlichten Beiträge/Termine als Markdown+JSON nach `cms/exports/` |

## Automatischer Rebuild und Backups

Kurzreferenz — vollständige Beschreibung inkl. Docker-Compose-Setup, Reverse-Proxy und Restore-Prozedur: [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md).

- **M9:** `src/hooks/triggerRebuild.ts` ruft bei Ver-/Entveröffentlichung `webhook/rebuild-server.mjs` auf, der die Astro-Seite baut, die Verify-Gates (`check-links`/`check-csp`) laufen lässt und `dist/` nur bei Erfolg atomar austauscht.
- **M10:** `backup/backup.sh` läuft nächtlich (Cron-Container), sichert Datenbank + Uploads, 14 Tage Aufbewahrung.

## Troubleshooting

| Problem | Ursache / Lösung |
|---------|-------------------|
| Astro-Build bricht mit "Payload-API nicht erreichbar" ab | `PAYLOAD_URL` ist gesetzt, aber die Instanz läuft nicht/ist nicht erreichbar. Für reine Frontend-Arbeit `PAYLOAD_URL` weglassen — der Astro-Loader nutzt dann automatisch die committete Fixture (`src/content/_fixtures/`). |
| Neue Beiträge erscheinen nicht auf der Website | Prüfen: Status ist `veroeffentlicht`? `publishedAt` liegt nicht in der Zukunft? Rebuild-Webhook-Log auf dem Produktionsserver prüfen (`/var/log/stoppramstein-rebuild.log`). |
| Admin-UI zeigt "Access Denied" | Rolle des angemeldeten Nutzers prüfen — Autor:innen sehen nur eigene Dokumente. |
| Bild wird nicht angezeigt | Alt-Text ist Pflichtfeld auf der Media-Collection — ohne Alt-Text lässt sich das Bild nicht speichern. |
