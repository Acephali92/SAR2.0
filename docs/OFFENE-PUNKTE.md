# Offene Punkte (Technik und Betrieb)

Was technisch oder organisatorisch noch offen ist, bevor die Seite mit der Redaktionsoberfläche produktiv gehen kann. Erledigtes steht im [Änderungsprotokoll](./AENDERUNGSPROTOKOLL.md), Redaktionelles in [`REDAKTION-TODO.md`](./REDAKTION-TODO.md).

Stand: 2026-11-05

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

### Meldeweg für Sicherheitsvorfälle

`guidelines.md` §14.10 beschreibt den Ablauf bei Sicherheitsvorfällen, aber nicht, wohin eine Meldung geht. Zu entscheiden ist ein vertraulicher Meldeweg, z. B. GitHub Private Vulnerability Reporting (in den Repo-Einstellungen einzuschalten) oder eine eigene Kontaktadresse, außerdem wer Meldungen bearbeitet. Danach eine `SECURITY.md` im Repo-Wurzelverzeichnis anlegen und in §14.10 verlinken.

### Speicherdauer und Anonymisierung der Server-Logs

Hängt an der [Hosting-Entscheidung](#hosting-und-webserver). Festzulegen sind die Speicherdauer der Zugriffs- und Fehlerlogs und ob IP-Adressen gekürzt oder anonymisiert werden (`guidelines.md` §14.11). Danach den Platzhalter in `src/content/seiten/datenschutz.md` („[Bitte ergänzen]: Name des Hosting-Anbieters und Speicherdauer der Server-Logs“) füllen und die Log-Einstellung in die Vorlagen unter `deploy/` übernehmen.

## Offene technische Punkte

### Weiterleitungen für alte URLs fehlen

`guidelines.md` §17.8 verlangt, dass alte URLs erhalten bleiben. Es gibt aber weder eine Weiterleitungstabelle noch eine Umleitung von `www.stoppramstein.de` auf `stoppramstein.de` (`astro.config.mjs`: `site: 'https://stoppramstein.de'`, die alte Seite lief unter `www`). Beides fehlt in `deploy/Caddyfile.example` und `deploy/nginx.conf.example`.

Bisher bekannt sind nur die 21 migrierten Seiten aus den Zeilen „Original URL“ in `stoppramstein_content/`. Vorschlag für die Ziele:

| Alte URL | Vorgeschlagenes Ziel | Anmerkung |
|---|---|---|
| `/`, `/fakten/`, `/presse/`, `/kontakt/`, `/ueber-uns/`, `/impressum/` | gleicher Pfad | Nur die `www`-Umleitung nötig |
| `/warum-stopp-air-base-ramstein/` | `/warum-ramstein/` | |
| `/aufruf` | `/mitmachen/aufruf/` | |
| `/spenden/` | `/mitmachen/spenden/` | |
| `/werde-mitglied-foerderverein` | `/mitmachen/mitglied-werden/` | |
| `/hilf-uns-bei-der-organisation/` | `/mitmachen/ehrenamt/` | Inhalt vergleichen |
| `/der-griff-nach-groenland/` | `/analysen/der-griff-nach-groenland/` | Slug laut Fixture, im CMS prüfen |
| `/was-hat-der-us-voelkerrechtsbruch-gegenueber-venezuela-mit-der-air-base-ramstein-zu-tun/` | `/analysen/venezuela-ramstein/` | Slug laut Fixture, im CMS prüfen |
| `/friedenswoche-2026-20-bis-28-juni/`, `/event/friedenswoche-2026-20-bis-28-juni/` | `/aktionen/friedenswoche-2026/` | Slug laut Fixture, im CMS prüfen |
| `/event/` | `/aktionen/` | |
| `/aufruf-zur-demo-am-14-februar-2026-in-muenchen/`, `/nachrichten/`, `/newsletter`, `/infomaterial/`, `/impressionen-2025/` | offen | Entscheidung der Redaktion, siehe [`REDAKTION-TODO.md`](./REDAKTION-TODO.md) |

**Inventar liegt vor, Freigabe steht aus.** Aus dem Datenbank-Backup der alten Seite vom 2026-09-23 sind alle 1.222 alten Adressen erfasst: 698 Beiträge, 102 Termine, 89 Seiten, Archive, Petitionen und dazu 1.142 Mediendateien. Je Adresse gibt es einen Vorschlag mit neuem Ziel, siehe [`MIGRATION-ALTDATEN.md`](./MIGRATION-ALTDATEN.md) und `docs/migration/freigabe.csv`. Nach der Freigabe folgen der Import ins CMS, `docs/WEITERLEITUNGEN.md` und die Weiterleitungsregeln für Caddy und nginx. Sie ersetzen die Tabelle oben. Zu prüfen ist außerdem, ob Caddy fehlende Schrägstriche selbst per Weiterleitung ergänzt. Die nginx-Vorlage hat dafür eine eigene Regel.

### Automatisierte Tests: Playwright und axe-core fehlen

`guidelines.md` §18.1 sieht funktionale Tests (Playwright), automatische Accessibility-Prüfungen (axe-core) und Screenshot-Vergleiche bei 390, 768 und 1280 px vor. Nichts davon ist eingerichtet. Zu tun:

- `@playwright/test` und `@axe-core/playwright` als devDependencies, exakt gepinnt (§2.2).
- Tests gegen `npm run preview`: Navigation inkl. mobilem Menü, Suche, 404-Seite, axe-core auf allen Seiten.
- Einen CI-Job in `.github/workflows/ci.yml` für Funktions- und Accessibility-Tests. Screenshots bleiben lokal.
- Die Befehle in `README.md`, „Befehle“, und in §18.1 eintragen.

### SEO-Metadaten unvollständig

Lücken gegenüber `guidelines.md` §17:

- `og:type` ist in `src/layouts/BaseLayout.astro` immer `website`, auch bei Artikeln und Analysen (Soll: `article` mit Veröffentlichungsdatum).
- Es gibt keine strukturierten Daten (JSON-LD für `Organization`, `Article`, `Event`).
- Die Sitemap filtert Seiten mit `noIndex` nicht heraus (`astro.config.mjs`, kein `filter`). Bisher setzt keine Seite `noIndex`.
- `description` von Beiträgen und Terminen ist in `src/content.config.ts` (Payload-Loader) nicht auf 160 Zeichen begrenzt, im CMS ebenso wenig.

### HSTS und Permissions-Policy fehlen in den Header-Vorlagen

`deploy/Caddyfile.example`, `deploy/nginx.conf.example` und `scripts/write-preview-headers.mjs` setzen CSP, `X-Content-Type-Options`, `X-Frame-Options` und `Referrer-Policy`. `Strict-Transport-Security` und `Permissions-Policy` fehlen (`guidelines.md` §14.9). HSTS erst setzen, wenn TLS auf der endgültigen Domain stabil läuft, weil Browser es sich merken.

### `cms/secrets/rclone.conf` ist nicht von Git ausgeschlossen

[`DEPLOYMENT.md`](./DEPLOYMENT.md) sagt, die rclone-Konfiguration für das Offsite-Backup gehört nach `secrets/rclone.conf` (unter `cms/`). `cms/.gitignore` schließt aber nur `secrets/*.txt` aus, ein `git add` würde die Zugangsdaten mitnehmen (`git check-ignore cms/secrets/rclone.conf` findet keine Regel). Verstößt gegen `guidelines.md` §14.4. Abhilfe: in `cms/.gitignore` `secrets/*` mit Ausnahme `!secrets/.gitkeep`.

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
  - Bei beiden schlägt `npm run check-doc-versions` fehl, bis die Hauptversion in der Doku nachgezogen ist (`guidelines.md` §2.2).
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
