# Redaktionsbereich (Payload CMS 3 + PostgreSQL)

Selbst gehostete Redaktionsoberfläche für [stoppramstein.de](https://stoppramstein.de). Ehrenamtliche legen hier Beiträge (Nachrichten/Analysen) und Termine an, ohne Git- oder GitHub-Kenntnisse. Die öffentliche Website (Astro, im Repo-Wurzelverzeichnis) bleibt vollständig statisch — sie liest veröffentlichte Inhalte nur **zur Build-Zeit** von hier, nie zur Laufzeit. Fällt dieser Dienst aus, läuft die bereits gebaute Website unverändert weiter.

Dieses Verzeichnis ist ein **eigenständiges npm-Projekt** (eigene `package.json`/`package-lock.json`, bewusst **kein** npm-Workspace mit dem Astro-Root).

**Warum eigenständig statt ein gemeinsames Projekt?** Payload und Astro sind zwei völlig unabhängige Software-Ökosysteme mit eigenem Update-Rhythmus. In einem gemeinsamen Workspace würde eine Aktualisierung von Payload/Next.js/React potenziell auch Abhängigkeiten der öffentlichen Astro-Seite anfassen (und umgekehrt) — mit dem Risiko, dass ein Update am CMS versehentlich die öffentliche, statische Seite verändert oder ein Astro-Update das CMS zerbricht. Die Trennung in zwei npm-Projekte macht dieses Risiko strukturell unmöglich: Ein `npm install` in `cms/` kann `package.json` im Repo-Wurzelverzeichnis gar nicht berühren.

Für den großen Zusammenhang (Architektur, Datenfluss, warum diese Trennung) siehe [`../docs/ARCHITEKTUR.md`](../docs/ARCHITEKTUR.md). Für Betrieb/Deployment auf dem Produktionsserver siehe [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md). Für die redaktionelle Bedienungsanleitung siehe [`../docs/INHALTE-PFLEGEN.md`](../docs/INHALTE-PFLEGEN.md), Teil B. Dieses README richtet sich an **Entwicklung/technische Betreuung**, die lokal an `cms/` arbeiten.

## Schnellstart (lokale Entwicklung)

Voraussetzungen: Node.js ≥ 22, Docker (für Postgres).

```bash
cd cms
cp .env.example .env
# .env ausfüllen: DATABASE_URI kann so bleiben, wenn Postgres per Docker läuft;
# PAYLOAD_SECRET mit `openssl rand -base64 48` erzeugen; SMTP/Webhook-Werte können
# für lokale Entwicklung Platzhalter bleiben (Passwort-Reset/Rebuild-Mail laufen dann nicht).

cp docker-compose.override.yml.example docker-compose.override.yml   # legt u. a. den postgres-Port offen
docker compose up -d postgres   # nur die Datenbank lokal starten
npm install
npm run dev                      # Payload-Admin unter http://localhost:3000/admin
```

Beim ersten Aufruf von `/admin` fragt Payload nach einem ersten Admin-Nutzer — danach in der Admin-UI weitere Nutzer mit passender Rolle anlegen (siehe [Rollen](#rollen-m2) unten).

Nach Änderungen an Collections/Feldern: `npm run generate:types` erzeugt `src/payload-types.ts` (generiert, nicht committen — siehe `.gitignore`).

Um den kompletten Stack lokal zu testen (inkl. Rebuild-Webhook, Backup-Cron), siehe [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md#cms-infrastruktur-docker) — `docker compose up -d` ohne den `postgres`-Filter startet alles.

## Lokal vollständig testen (Docker + Admin-UI + Astro-Build)

Dieser Ablauf ist einmal vollständig durchgespielt und verifiziert worden — er ist der zuverlässigste Weg, eine Änderung an `cms/` end-to-end zu prüfen, bevor sie live geht. Alle Schritte bauen auf dem Schnellstart oben auf.

1. **Postgres + Payload starten** (siehe Schnellstart oben). Der **allererste** Aufruf von `/admin` bzw. jeder anderen Route kompiliert sie erst (Next.js Dev-Modus) — das kann für die Admin-Route **60–90 Sekunden** dauern, wirkt aber wie ein Hänger. Einfach warten, nicht abbrechen; jeder folgende Aufruf derselben Route ist dann Millisekunden schnell.
2. **Ersten Admin-Nutzer anlegen**: `/admin` aufrufen, Formular „Erstes Benutzerkonto erstellen" ausfüllen, Rolle auf **Admin** setzen (nur Admin darf später weitere Rollen vergeben).
3. **Redaktions-Workflow durchspielen**: einen Test-Beitrag anlegen, Inhalt im Rich-Text-Editor schreiben, Status schrittweise auf „Zur Freigabe" und „Veröffentlicht" setzen, zusätzlich oben auf **„Änderungen veröffentlichen"** klicken (das ist Payloads eigener Draft/Publish-Schalter, getrennt vom eigenen `freigabeStatus`-Feld — beides muss für einen öffentlich sichtbaren Beitrag passen, siehe [Redaktioneller Workflow](#redaktioneller-workflow-m5) unten).
4. **API-Key für den Astro-Build anlegen**: unter `/admin/account` „API-Schlüssel aktivieren" ankreuzen, speichern, den generierten Schlüssel kopieren (nur bei der Erstellung im Klartext sichtbar).
5. **Astro-Build gegen die laufende Instanz testen** (im Repo-Wurzelverzeichnis, nicht in `cms/`):
   ```bash
   PAYLOAD_URL=http://localhost:3000 PAYLOAD_API_TOKEN=<kopierter-key> npm run build
   ```
   Die Build-Ausgabe sollte `"beitraege": 1 Dokument(e) geladen` (o. ä.) zeigen statt der Fixture-Warnung. `npm run preview` bzw. ein Blick in `dist/analysen/<slug>/index.html` zeigt den fertigen, statischen Beitrag.
6. **Verify-Gates laufen lassen**: `npm run check-links && npm run check-csp` (Root) — müssen weiterhin fehlerfrei durchlaufen, das ist der harte Beweis, dass CMS-Inhalte CSP-sauber und linkgültig sind.

**Wichtig bei Config-Änderungen:** `payload.config.ts`, alles unter `src/app/(payload)/`, sowie neue/geänderte Environment-Variablen werden vom Next.js-Dev-Server **nicht** zuverlässig per Fast Refresh übernommen. Nach solchen Änderungen den Dev-Server neu starten (`Strg+C`, dann `npm run dev` erneut) — sonst können alte Route-Handler oder ein veralteter DB-Schema-Stand aktiv bleiben und zu schwer nachvollziehbaren Fehlern führen.

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
| `admin` | Zusätzlich: Nutzer anlegen und Rollen verwalten |

Umgesetzt in `src/collections/Users.ts` (Feld `role`) und den Access-Funktionen in `src/access/`.

### Redaktioneller Workflow (M5)

Eigenes `freigabeStatus`-Feld (`src/fields/statusField.ts`), **zusätzlich** zu Payloads nativem `versions.drafts` (das sichert Revisionshistorie, ersetzt aber nicht den 3-stufigen Freigabeprozess).

> ⚠️ **Fallstrick, beim lokalen Test tatsächlich aufgetreten:** Ein eigenes `select`-Feld auf einer Collection mit `versions.drafts` darf **nicht** `status` heißen. Payload legt für seinen internen Draft/Publish-Mechanismus selbst eine `_status`-Spalte an und generiert dafür in Postgres einen Enum-Typ nach dem Muster `enum_<collection>_status` — exakt der gleiche Name, den ein eigenes Feld `status` ebenfalls bekäme. Die Folge ist kein Typfehler beim Schreiben des Codes, sondern ein kaputtes DB-Schema erst beim ersten Start gegen eine echte Datenbank (`CREATE TABLE` schlägt fehl mit „invalid input value for enum"). Deshalb heißt das Feld bewusst `freigabeStatus`. Diese Falle gilt für **jede** Collection mit `versions.drafts` — bei künftigen eigenen Status-artigen Feldern immer einen anderen Namen als `status` wählen (siehe auch `eventStatus` in `Termine.ts`).

Die Stufen im Detail:

| Von → Nach | Autor | Redaktion/Admin |
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

`src/lib/editorConfig.ts` definiert eine **bewusste Feature-Allowlist** für den Lexical-Editor (Überschriften h2/h3, Listen, Links, Zitate, Bold/Italic, Bilder) — **kein** HTML-Block- oder Embed-Feature. Das ist die eigentliche Sicherheitsgrenze: In der Redaktionsoberfläche lässt sich strukturell kein `<script>` oder rohes HTML einschleusen, unabhängig davon, wie sorgfältig die HTML-Konvertierung (`lexicalToHtml.ts`) ist. Neue Editor-Features nur nach Rücksprache aktivieren — die öffentliche Seite verlässt sich auf diese Grenze, um `script-src 'self'` einzuhalten (`scripts/check-csp.mjs` im Astro-Root scannt das Build-Ergebnis).

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
| `docker compose up` schlägt fehl oder hängt | Prüfen, ob Docker Desktop (bzw. der Docker-Daemon) überhaupt läuft (`docker ps` sollte eine — auch leere — Liste zeigen, keinen Verbindungsfehler). Danach `docker compose logs` prüfen, welcher Service genau nicht hochkommt. |
| Image-Pull bricht mit `unexpected EOF` / `httpReadSeeker` ab | Reines Netzwerk-Flattern beim Herunterladen großer Layer, kein Fehler in diesem Projekt. `docker compose up -d postgres` (bzw. `docker pull postgres:16-alpine`) einfach erneut ausführen — bereits geladene Layer werden zwischengespeichert, nach 2–3 Versuchen klappt es i. d. R. |
| `npm run dev` bricht mit einem Fehler zu `DATABASE_URI`/`PAYLOAD_SECRET` ab | `.env` fehlt oder ist unvollständig — `.env.example` nach `.env` kopieren (siehe Schnellstart oben) und die Pflichtwerte ausfüllen, mindestens `DATABASE_URI` und `PAYLOAD_SECRET`. |
| `CREATE TABLE ... invalid input value for enum` beim ersten Start | Eine Collection hat ein eigenes Feld `status` neben aktiviertem `versions.drafts` — Namenskollision mit Payloads intern generiertem Enum, siehe Warnkasten bei [Redaktioneller Workflow](#redaktioneller-workflow-m5). Feld umbenennen, dann `docker compose down -v` (Postgres-Volume mit dem kaputten Teil-Schema verwerfen) und neu starten. |
| Beim Neustart: `Error: listen EADDRINUSE: address already in use :::3000` | Ein vorheriger `npm run dev`-Prozess läuft noch (z. B. nach einem nicht sauber beendeten Terminal). Prozess auf Port 3000 beenden (Windows: `Get-NetTCPConnection -LocalPort 3000 \| Select-Object -ExpandProperty OwningProcess \| Stop-Process -Force`; macOS/Linux: `lsof -ti:3000 \| xargs kill`) und `npm run dev` erneut starten. |
| Seite lädt "ewig" (60–90 s) und wirkt eingefroren | Normal bei der jeweils ersten Anfrage an eine Route nach einem (Neu-)Start des Dev-Servers — Next.js kompiliert sie erst on-demand. Terminal-Log beobachten (`✓ Compiled ... in Xs`), nicht abbrechen. Danach ist dieselbe Route dauerhaft schnell, bis der Server neu startet. |
| Astro-Build bricht mit "Payload-API nicht erreichbar" ab | `PAYLOAD_URL` ist gesetzt, aber die Instanz läuft nicht/ist nicht erreichbar. Für reine Frontend-Arbeit `PAYLOAD_URL` weglassen — der Astro-Loader nutzt dann automatisch die committete Fixture (`src/content/_fixtures/`). |
| Neue Beiträge erscheinen nicht auf der Website | Prüfen: Status ist `veroeffentlicht`? `publishedAt` liegt nicht in der Zukunft? Rebuild-Webhook-Log auf dem Produktionsserver prüfen (`/var/log/stoppramstein-rebuild.log`). |
| Admin-UI zeigt "Access Denied" | Rolle des angemeldeten Nutzers prüfen — mit der Rolle Autor sind nur die eigenen Dokumente sichtbar, keine fremden. |
| Bild wird nicht angezeigt | Alt-Text ist Pflichtfeld auf der Media-Collection — ohne Alt-Text lässt sich das Bild nicht speichern. |
| Login-Seite unter `redaktion.stoppramstein.de` nicht erreichbar (Produktion) | Reverse-Proxy-Konfiguration prüfen (siehe `docs/DEPLOYMENT.md`, Abschnitt "Reverse-Proxy für die Redaktionsoberfläche") sowie ob der `payload`-Container überhaupt läuft (`docker compose ps`). |
