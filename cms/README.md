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

1. **Postgres + Payload starten** (siehe Schnellstart oben). Der **allererste** Aufruf von `/admin` bzw. jeder anderen Route kompiliert sie erst (Next.js 16 Dev-Modus mit Turbopack) — das wirkt wie ein Hänger. Gemessen (2026-09-18, ohne weitere Last auf dem Rechner): nach frischem `npm install` bzw. gelöschtem `.next/` rund **2 Minuten** für `/admin` plus rund **45 Sekunden** für die erste API-Anfrage; bei späteren Neustarts dank Turbopacks Dateisystem-Cache rund **1 Minute** bzw. **30 Sekunden**. Solange die API-Route noch kompiliert, bleiben im Formular Bild- und Beziehungsfelder leer (Platzhalter) — einfach warten, nicht abbrechen. Danach antworten dieselben Routen in Millisekunden bis wenigen Sekunden.
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
│   ├── components/
│   │   ├── RedaktionsUebersicht.tsx  # Lageübersicht über dem Dashboard (beforeDashboard)
│   │   ├── uebersichtDaten.ts        # Deren Abfragen — getrennt, damit ohne Admin-UI prüfbar
│   │   └── VorschauView.tsx          # Geschützte Vorschau unter /admin/vorschau/:collection/:id
│   ├── fields/
│   │   ├── statusField.ts       # Redaktioneller Status + zugehörige Sidebar-Felder (M5)
│   │   └── slugField.ts         # Auto-Slug aus Titel, editierbar
│   ├── access/                  # Zugriffsregeln (Rollen × Status-Übergänge)
│   │   ├── canReadVersions.ts   # Wer die Versionsgeschichte sehen darf (access.readVersions)
│   │   └── readPublishedOrSession.ts # Öffentlicher Lesezugriff: freigabeStatus UND _status
│   ├── hooks/
│   │   ├── setCreatedBy.ts      # Stempelt den Ersteller (für "nur eigene Entwürfe")
│   │   ├── setPublishedAt.ts    # Stempelt das erste Veröffentlichungsdatum
│   │   ├── addRenderedHtml.ts   # Lexical → HTML für den Astro-Loader (afterRead)
│   │   ├── restrictVersionRestore.ts # Grenzt das Wiederherstellen für die Rolle Autor ein
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

**Service-Nutzer für den Astro-Build:** In der Admin-UI einen Nutzer anlegen (z. B. `build@stoppramstein.de`, Rolle **`autor`** als geringstes Recht), API-Key aktivieren, Key kopieren und im Astro-Build-Environment als `PAYLOAD_API_TOKEN` hinterlegen (nicht in diesem `.env`, sondern dort, wo `npm run build` für die Astro-Seite läuft).

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

### Versionen und Wiederherstellen

`versions.drafts` (mit Autosave, `maxPerDoc: 50`) läuft auf `Beitraege` und `Termine`. Die Rechte darauf hängen an zwei Stellen:

- **Lesen:** `access.readVersions` → `src/access/canReadVersions.ts`. Redaktion/Admin sehen alle Versionen, die Rolle Autor nur die eigenen, ohne Login gar keine. Die Where-Bedingung lautet `version.createdBy`, nicht `createdBy` — Payload fragt die Versions-Collection ab, dort liegen die Dokumentfelder unter `version.*`. **Ohne** diese Funktion greift Payloads Fallback in `executeAccess`: jeder eingeloggte Nutzer dürfte dann die Versionen aller Dokumente lesen, einschließlich des API-Key-Nutzers des Astro-Builds.
- **Wiederherstellen:** `src/hooks/restrictVersionRestore.ts` (`beforeChange`). Payload kennt **kein** eigenes Zugriffsrecht fürs Wiederherstellen — die `restoreVersion`-Operation prüft ausschließlich `access.update`. Fremde Dokumente sind damit schon abgedeckt (`ownDraftOrRedaktion` liefert eine Where-Bedingung, der Restore endet in „Forbidden"), ein *eigenes, veröffentlichtes* Dokument aber nicht. Genau das fängt der Hook ab und wirft einen deutschen 403-Text. Er erkennt den Restore an `req.context.isRestoringVersion`, das `restoreVersion` vor den `beforeChange`-Hooks setzt — bei normalem Speichern und Autosave ist der Hook wirkungslos.

`Media` hat derzeit keine `versions` aktiviert; würde das eingeschaltet, muss `access.readVersions` dort ebenfalls gesetzt werden.

API-Key-Zugriffe (der Build-Nutzer, siehe [Umgebungsvariablen](#umgebungsvariablen)) bekommen **unabhängig von der Rolle** keine Versionen — `canReadVersions` sperrt `_strategy === 'api-key'`.

### Öffentlicher Lesezugriff: zwei Status-Felder

`access.read` von `Beitraege`/`Termine` → `src/access/readPublishedOrSession.ts`:

| Wer | Sieht |
|-----|-------|
| Session-Login (Admin-UI) | alles (Rollenlogik über `update`/`delete`) |
| anonym **oder** API-Key (Astro-Build) | nur `freigabeStatus = veroeffentlicht` **UND** `_status = published` |

Beide Felder sind nötig: `freigabeStatus` bleibt `veroeffentlicht`, wenn nach der Veröffentlichung ein Entwurf gespeichert wird, und Payload liefert mit `?draft=true` (REST) bzw. `draft: true` (GraphQL) die neueste Version — ohne `_status`-Prüfung also den unveröffentlichten Entwurf. Das war bis 2026-09-18 anonym ausnutzbar (siehe `docs/REDAKTION-TODO.md`). Unterschieden wird über `req.user._strategy`, das Payload zur Laufzeit setzt (`'api-key'` bzw. `'local-jwt'`), das aber im generierten `User`-Typ fehlt — daher der Helper `istApiKeyZugriff()`.

Folgen: Ein Dokument ist erst öffentlich, wenn in der Admin-UI zusätzlich „Änderungen veröffentlichen" geklickt wurde. `src/jobs/schedulePublish.ts` setzt deshalb neben `freigabeStatus` auch `_status: 'published'` — `payload.update()` übernähme sonst den `_status` der neuesten Version (meist `draft`).

`Media` ist nur für Angemeldete lesbar (Session oder API-Key), das gilt auch für die Datei-Bytes unter `/api/media/file/…`. Der Astro-Loader schickt beim Bild-Download deshalb denselben `Authorization: users API-Key …`-Header wie beim Daten-Abruf.

### Vorschau (Admin-Route)

`collection.admin.preview` (→ `src/lib/vorschauUrl.ts`) setzt in beiden Collections den eingebauten Vorschau-Knopf der Edit-Ansicht auf `/admin/vorschau/:collection/:id`. Dort rendert `src/components/VorschauView.tsx` das Dokument per Local API mit `draft: true`, nutzt das vorhandene `renderedHtml` aus `addRenderedHtml` und zeigt es in einem Artikel-/Event-Layout mit Status-Banner.

> ⚠️ **Custom-Admin-Views sind bei Payload 3 nicht automatisch hinter dem Login.** `isCustomAdminView` in `@payloadcms/next` nimmt jede unter `admin.components.views` registrierte Route ausdrücklich vom Auth-Redirect aus. `VorschauView.tsx` prüft `req.user` deshalb selbst (404 ohne Session) und setzt zusätzlich „Autor sieht nur Eigenes" durch, weil `access.read` eingeloggten Nutzern bewusst alles freigibt. Jede weitere Custom-View muss diese Prüfungen selbst mitbringen.

Nach Änderungen an `admin.components` muss die Import-Map neu erzeugt werden: `npx payload generate:importmap` (schreibt `src/app/(payload)/admin/importMap.js`, diese Datei ist committet). Fehlt der Eintrag, rendert Payload die Komponente **kommentarlos als nichts** — `RenderServerComponent` gibt ohne Treffer in der Import-Map einfach `null` zurück.

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
| Seite lädt "ewig" (bis ca. 2 min) und wirkt eingefroren, oder Bild-/Beziehungsfelder im Formular bleiben leer | Normal bei der jeweils ersten Anfrage an eine Route nach einem (Neu-)Start des Dev-Servers — Next.js kompiliert sie erst on-demand (`/admin` und `/api` getrennt, Richtwerte siehe oben). Terminal-Log beobachten (`GET /api/... 200 in …`), nicht abbrechen. Betrifft nur `npm run dev`; ein Produktions-Build (`npm run build && npm run start`) startet in rund 1,5 Sekunden. |
| Astro-Build bricht mit "Payload-API nicht erreichbar" ab | `PAYLOAD_URL` ist gesetzt, aber die Instanz läuft nicht/ist nicht erreichbar. Für reine Frontend-Arbeit `PAYLOAD_URL` weglassen — der Astro-Loader nutzt dann automatisch die committete Fixture (`src/content/_fixtures/`). |
| Neue Beiträge erscheinen nicht auf der Website | Prüfen: Status ist `veroeffentlicht`? `publishedAt` liegt nicht in der Zukunft? Rebuild-Webhook-Log auf dem Produktionsserver prüfen (`/var/log/stoppramstein-rebuild.log`). |
| Eigene Dashboard-/View-Komponente erscheint einfach nicht (keine Fehlermeldung) | Eintrag fehlt in `src/app/(payload)/admin/importMap.js`. `RenderServerComponent` gibt ohne Treffer stillschweigend `null` zurück. `npx payload generate:importmap` ausführen und den Dev-Server neu starten. |
| Test mit `curl`/Skript: trotz erfolgreichem Login landet jeder `/admin`-Aufruf auf der Login-Seite, `/api/users/me` liefert `user: null` | Payloads Cookie-Auth hat einen CSRF-Schutz (`extractJWT`, Methode `cookie`): ohne `Origin`-Header verlangt sie einen passenden `Sec-Fetch-Site`-Header. Browser senden den, `curl` nicht — das Cookie wird deshalb verworfen. Im Browser tritt das nicht auf. Für Tests auf der Kommandozeile entweder `-H "Sec-Fetch-Site: same-origin"` bzw. `-H "Origin: http://localhost:3000"` mitschicken oder den Token direkt als `-H "Authorization: JWT <token>"` setzen. |
| Admin-UI zeigt "Access Denied" | Rolle des angemeldeten Nutzers prüfen — mit der Rolle Autor sind nur die eigenen Dokumente sichtbar, keine fremden. |
| Bild wird nicht angezeigt | Alt-Text ist Pflichtfeld auf der Media-Collection — ohne Alt-Text lässt sich das Bild nicht speichern. |
| Login-Seite unter `redaktion.stoppramstein.de` nicht erreichbar (Produktion) | Reverse-Proxy-Konfiguration prüfen (siehe `docs/DEPLOYMENT.md`, Abschnitt "Reverse-Proxy für die Redaktionsoberfläche") sowie ob der `payload`-Container überhaupt läuft (`docker compose ps`). |
