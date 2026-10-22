# Offene Punkte (Technik und Betrieb)

Was technisch oder organisatorisch noch offen ist, bevor die Seite mit der Redaktionsoberfläche produktiv gehen kann. Erledigtes steht im [Änderungsprotokoll](./AENDERUNGSPROTOKOLL.md), Redaktionelles in [`REDAKTION-TODO.md`](./REDAKTION-TODO.md).

Stand: 2026-10-21

## Stand der Anforderungen (M1–M10, S1–S4)

Abgleich mit der Muss-/Soll-Anforderungsliste des Referenz-CMS-Lastenhefts.

| # | Anforderung | Status |
|---|---|---|
| M1 | Login E-Mail/Passwort, ohne Git/GitHub | ✅ Erledigt (`cms/src/collections/Users.ts`) |
| M2 | Rollen Autor/Redaktion/Admin | ✅ Erledigt (Leserechte am 2026-09-18 korrigiert, siehe Änderungsprotokoll) |
| M3 | Deutsche UI + Rich-Text-Editor | ✅ Erledigt (`cms/src/payload.config.ts` i18n, `cms/src/lib/editorConfig.ts`) |
| M4 | Bild/PDF-Upload, Verkleinerung, Pflicht-Alt-Text | ✅ Erledigt (Größenvarianten als WebP) |
| M5 | Entwurf→Freigabe→Veröffentlichung + zeitgesteuert | ✅ Erledigt (`freigabeStatus`, `cms/src/jobs/schedulePublish.ts`) |
| M6 | Beitrag/Termin mit festen Feldern + Verknüpfung | ⚠️ Teilweise: Das Titelbild erscheint nur als `og:image`, nicht im Artikel ([Titelbild im Artikel anzeigen](#titelbild-im-artikel-anzeigen)) |
| M7 | Statische, cookiefreie Seite, kein React, CSP `script-src 'self'` | ⚠️ Teilweise: Vorlagen für Caddy und nginx liegen im Repo, ausrollbar erst nach der [Hosting-Entscheidung](#hosting-und-webserver) |
| M8 | EU-Hosting, keine Daten an US-Dienste | ⚠️ Teilweise: [SMTP-Anbieter](#smtp-anbieter) offen |
| M9 | Änderungen innerhalb weniger Minuten live | ⚠️ Umgesetzt, im Container aber nicht geprüft: Der Austausch von `dist/` scheitert vermutlich ([Rebuild-Webhook](#rebuild-webhook-verschiebt-dist-über-zwei-mounts)) |
| M10 | Tägliche Backups, dokumentierte Wiederherstellung, Export als MD/JSON | ⚠️ Teilweise: Export geprüft. Das Backup erzeugt vermutlich [leere Datenbank-Dumps](#backup-erzeugt-vermutlich-leere-datenbank-dumps), der [Offsite-Anbieter](#offsite-backup) ist offen |
| S1 | Vorschau vor Veröffentlichung | ✅ Erledigt (`cms/src/components/VorschauView.tsx`) |
| S2 | Versionsverlauf mit Wiederherstellung | ✅ Erledigt (`versions.maxPerDoc`, `cms/src/hooks/restrictVersionRestore.ts`) |
| S3 | Redaktions-Übersicht | ✅ Erledigt (`cms/src/components/RedaktionsUebersicht.tsx`) |
| S4 | Pflege durch Docker-Einsteiger ohne Framework-Tiefe | ✅ Erledigt (Datenbank-Migrationen laufen beim Containerstart, im Container geprüft) |

## Entscheidungen des Betreibers

### Hosting und Webserver

Welcher Hosting-Anbieter und welcher Webserver (Caddy oder nginx) produktiv laufen, ist offen. Erst danach lässt sich die passende Vorlage aus `deploy/` mit echter Domain und TLS ausrollen, und erst dann sendet der Server den CSP-Header `script-src 'self'` (M7). Anleitung: [`DEPLOYMENT.md`](./DEPLOYMENT.md).

### SMTP-Anbieter

Für die Passwort-Reset-E-Mails von Payload und die Fehlerbenachrichtigung des Rebuild-Webhooks (`SMTP_*` in `cms/.env.example`) fehlt ein konkreter, DSGVO-konformer E-Mail-Versanddienst in der EU (M8).

### Offsite-Backup

Der Mechanismus ist da: `cms/backup/backup.sh` kopiert die Archive per `rclone`, sobald `OFFSITE_RCLONE_REMOTE` und `secrets/rclone.conf` gesetzt sind. Offen ist, welcher zweite, räumlich getrennte Anbieter in der EU genutzt wird. Einrichtung: [`DEPLOYMENT.md`](./DEPLOYMENT.md), „Backups & Wiederherstellung“. Vorher müssen die beiden Backup-Punkte unten behoben sein.

## Offene technische Punkte

### Backup erzeugt vermutlich leere Datenbank-Dumps

`cms/backup/backup.sh:11` ruft `pg_dump -h postgres -U payload payload | gzip` ohne Passwort auf. `cms/.env.example` enthält nur `DATABASE_URI`, kein `PGPASSWORD`. Ohne Passwort scheitert `pg_dump`. Weil `set -o pipefail` fehlt, endet die Pipeline trotzdem mit Erfolg (Exit-Code von `gzip`), und es entsteht eine leere `db-*.sql.gz`. *Ergibt sich aus dem Code, nicht im Container geprüft.* Naheliegender Fix: `pg_dump "$DATABASE_URI"` und `set -o pipefail`. Das setzt voraus, dass der Cron-Job die Umgebung sieht (nächster Punkt).

### Offsite-Kopie läuft vermutlich nie

Der Backup-Container startet `crond` (dcron) mit `cms/backup/crontab`. Cron-Jobs erben die Umgebungsvariablen des Containers in der Regel nicht. Dann ist `OFFSITE_RCLONE_REMOTE` (aus `env_file: .env`) im Job leer, und `backup.sh` überspringt die Offsite-Kopie mit „Keine Offsite-Kopie konfiguriert“. *Nicht verifiziert.* Abhilfe wäre ein Cron, der die Umgebung weitergibt (z. B. supercronic, das auch ohne root läuft und damit den Semgrep-Fund zum Backup-Dockerfile behebt).

### Rebuild-Webhook verschiebt dist über zwei Mounts

`cms/webhook/rebuild-server.mjs:96` verschiebt `dist/` mit `rename()` von `/site/dist` nach `/releases/<Zeitstempel>`. Laut `cms/docker-compose.yml:32-33` ist `/site` ein Bind-Mount und `/releases` ein eigenes Volume. Unter Linux funktioniert `rename()` nicht über verschiedene Mounts hinweg (`EXDEV`). Der Build liefe also durch, aber die neue Fassung ginge nie online. *Nicht im Container geprüft.* Abhilfe: kopieren statt verschieben, oder im selben Mount bauen.

### Zurückgestellte Semgrep-Findings in cms

GitHub Code Scanning zeigt vier Funde in `cms/`, die bewusst noch offen sind:

- `cms/backup/Dockerfile` und `cms/webhook/Dockerfile`: Container laufen als root (kein `USER`). Für den Webhook muss dann der Bind-Mount `../:/site` für UID 1000 beschreibbar sein.
- `cms/webhook/rebuild-server.mjs:43`, `spawn` mit `shell`: Fehlalarm. Die Shell ist nur unter Windows aktiv, die Argumente sind feste Literale.
- `cms/src/components/VorschauView.tsx:234`, `dangerouslySetInnerHTML`: Fehlalarm. Payload escaped Text (`escapeHTML`) und bereinigt Link-URLs (`sanitizeUrl`), der Editor lässt kein HTML zu (`cms/src/lib/editorConfig.ts`).

Dazu kommen die Alerts #5–#7 in `scripts/check-links.mjs`. Sie sind im Code mit `nosemgrep` und Begründung markiert, GitHub zeigt sie trotzdem an. Sie sollten in Code Scanning als „False positive“ geschlossen werden.

### Abhängigkeiten

- **Dependabot-Alerts:** 114 behoben, 19 offen (Stand 2026-10-21), keiner kritisch.
  - Root-Projekt: 3 (1 hoch `braces`; 1 mittel und 1 niedrig `postcss-selector-parser`).
  - `cms/`: 16 (4 hoch: `braces`, `source-map-js`, 2× `undici`; 7 mittel; 5 niedrig).
- **Offene Dependabot-PRs:**
  - #17 Tailwind 4: Major-Update mit Migrationsaufwand. Tailwind 4 setzt Safari 16.4+, Chrome 111+ und Firefox 128+ voraus. Für `tailwindcss` selbst gibt es keinen Alert.
  - #19 TypeScript 7: Major-Update.
  - #18 Astro 7: überholt, `master` hat Astro 7.3.8. Kann geschlossen werden.
- **Payload-Pakete:** `payload` und alle `@payloadcms/*` brauchen dieselbe Version. Dependabot-Security-Updates heben nur Pakete mit Advisory. Wird der CI-Job „CMS“ bei so einem PR rot, die übrigen `@payloadcms/*` von Hand nachziehen.
- **Semgrep-Image:** `semgrep/semgrep:<version>@sha256:…` in `.github/workflows/security.yml` deckt Dependabot nicht ab. Es muss von Hand aktualisiert werden.

### Titelbild im Artikel anzeigen

Das Titelbild aus dem CMS liegt als `data.image` vor (`src/lib/payload-loader.ts`) und wird bisher nur als `ogImage` genutzt (`src/layouts/ArticleLayout.astro`). Sobald die Redaktion die Platzierung entschieden hat ([`REDAKTION-TODO.md`](./REDAKTION-TODO.md)), muss es im Layout gerendert werden.

### Nicht automatisch getestet

- Der Payload-Loader mit echtem `PAYLOAD_URL`. CI und lokale Prüfungen nutzen die Fixtures unter `src/content/_fixtures/`.
- Das CMS gegen eine echte Datenbank (Migrationen, Admin-Oberfläche). Der CI-Job „CMS“ installiert, prüft Typen und baut, braucht aber keine Datenbank.
- Der Rebuild-Webhook und das Backup im Container.

### Screenshot in der Doku

`docs/screenshot.png` ist ein manueller Screenshot der Startseite (übernommen aus `screenshots/Screenshot 2026-09-16 182321.png`). Bei Layout-Änderungen an der Startseite aktualisieren.

## Bewusste Einschränkungen

Diese Punkte sind so gewollt oder vorerst hingenommen:

- **Migrationen nur im Docker-Image:** Die automatische Migration (`PAYLOAD_AUTO_MIGRATE=true`, `prodMigrations` in `cms/src/payload.config.ts`) läuft nur im Image. Trifft sie auf eine per Dev-„Push“ veränderte Datenbank (Markierung `dev`, `batch -1`), stellt Payload eine interaktive Rückfrage, und ohne Terminal hängt der Server. Produktiv daher nur eine frische oder ausschließlich per Migration gepflegte Datenbank verwenden (siehe [`cms/README.md`](../cms/README.md)).
- **Build-Nutzer liest mehr als nötig:** Der API-Key des Astro-Builds kann die komplette Medienliste (auch Metadaten reiner Entwurfsbilder) und die Nutzerliste lesen. Der Loader braucht davon nur Bilder veröffentlichter Dokumente und die Autorennamen. Eine feinere Regel wäre deutlich aufwendiger, der Key ist ein Server-Geheimnis.
- **Keine öffentliche Vorschau-URL:** Die Vorschau gibt es nur in der angemeldeten Redaktionsoberfläche. Ein teilbarer Link bräuchte SSR auf der öffentlichen Seite oder ein Token-Cookie, beides widerspricht der statischen, cookiefreien Architektur.
- **Vorschau nicht pixelgenau:** Header und Footer der öffentlichen Seite fehlen, und IBM Plex ist in `cms/` nicht selbst gehostet (es greift der Fallback). Für Text, Bilder, Quellen und Verknüpfungen reicht das.
- **Medien ohne Versionen:** `Media` hat keine `versions`. Werden sie eingeschaltet, muss `canReadVersions` (oder eine Admin-Variante) auch dort an `access.readVersions` hängen.
- **Übersetzungsfehler in Payload:** Die deutsche Oberfläche zeigt in der Versionsliste „Sortieren nach {{label}}“, ein nicht aufgelöster Platzhalter in Payload selbst.
