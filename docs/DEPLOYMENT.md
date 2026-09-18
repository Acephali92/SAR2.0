# Deployment

## Zielinfrastruktur

| Komponente | Anforderung |
|------------|-------------|
| Hosting | Europäischer Anbieter (z. B. Hetzner, Uberspace, Infomaniak) |
| Server | Statischer File-Server (Caddy oder nginx) |
| TLS | Let's Encrypt (automatisiert) |
| Domain | stoppramstein.de |

## Team-Vorschau (statichost.eu)

Für Reviews durch das Team läuft eine passwortgeschützte Vorschau auf statichost.eu (EU-Hosting):

- **URL:** https://stoppramstein.statichost.page
- **Branch:** `master`
- **Konfiguration:** `statichost.yml` (Build-Befehl, Publish-Verzeichnis)
- **Header:** `scripts/write-preview-headers.mjs` schreibt `dist/_headers` (CSP, Security-Header, `X-Robots-Tag: noindex, nofollow`) — ausschließlich für die Vorschau, nie für die Produktion.

Die Vorschau ist unabhängig von der unten beschriebenen Produktionsinfrastruktur und wird bei jedem Push auf `master` automatisch neu gebaut.

## Build & Deploy

```bash
# Produktions-Build
npm run build

# Build-Output prüfen
ls -la dist/

# Auf den Server übertragen
rsync -avz --delete dist/ user@server:/var/www/stoppramstein/
```

`npm run build` triggert über den `postbuild`-Hook automatisch `pagefind --site dist` (Suchindex). Vor dem Deploy immer `npm run verify` laufen lassen (siehe README).

### Build-Output

```
dist/
├── index.html
├── 404.html
├── warum-ramstein/
│   ├── index.html
│   └── drohnenkrieg/index.html …
├── mitmachen/
├── aktionen/
├── analysen/
├── fonts/
├── images/
├── pagefind/
│   ├── pagefind.js
│   ├── pagefind-ui.js
│   └── …
└── sitemap-index.xml
```

## Rebuild-Rhythmus

**Code-Änderungen** (Git-Push) laufen weiterhin manuell: `npm run build` + `rsync` (oder ein CI-Deploy-Step, falls das später eingerichtet wird — aktuell validiert `.github/workflows/ci.yml` nur, deployt nicht).

**Redaktionelle Änderungen** (Beiträge/Termine über die Payload-Oberfläche) lösen dagegen **automatisch** einen Rebuild aus: siehe "Automatischer Rebuild bei Veröffentlichung (M9)" unten. Sobald Redaktion einen Beitrag oder Termin veröffentlicht, baut der `rebuild-webhook`-Dienst die Seite neu und tauscht `dist/` binnen weniger Minuten aus — ohne dass jemand manuell `npm run build` ausführen muss.

(Die Team-Vorschau auf statichost.eu ist davon unabhängig und baut automatisch bei jedem Push auf `master`, siehe oben.)

## CMS-Infrastruktur (Docker)

Payload CMS 3 + PostgreSQL laufen per Docker Compose **auf demselben Server** wie die statische Seite (ein VPS, Caddy/nginx davor). Alles CMS-Bezogene liegt in `cms/` und wird unabhängig vom Astro-Build betrieben.

```bash
cd cms
cp .env.example .env               # Werte ausfüllen (DB-Passwort, Secrets, SMTP, ...)
mkdir -p secrets
echo "CHANGEME" > secrets/postgres_password.txt
docker compose up -d
```

Services (`cms/docker-compose.yml`):

| Service | Zweck |
|---------|-------|
| `postgres` | Datenbank, Volume `pgdata` |
| `payload` | Redaktionsoberfläche (Next.js), nur auf `127.0.0.1:3000` gebunden, nie direkt aus dem Internet erreichbar |
| `rebuild-webhook` | M9: nimmt den Publish-Webhook entgegen, baut die Astro-Seite, tauscht `dist/` atomar aus |
| `backup` | M10: nächtlicher `pg_dump` + Uploads-Backup |

Erstes Setup: einen Admin-Nutzer in Payload anlegen (Payload fragt beim ersten Aufruf von `/admin` danach), danach weitere Nutzer mit passender Rolle (`autor`/`redaktion`/`admin`) über die Admin-UI anlegen. Für den Astro-Build (Content-Layer-Loader) einen Service-Nutzer mit API-Key anlegen und den Key als `PAYLOAD_API_TOKEN` im Build-Environment hinterlegen.

Lokale Entwicklung: `cp docker-compose.override.yml.example docker-compose.override.yml` (startet Payload im Dev-Modus mit offenen Ports).

## Reverse-Proxy für die Redaktionsoberfläche

Eigene Subdomain (`redaktion.stoppramstein.de`) statt Pfad-Präfix auf der Hauptdomain — sauberere Cookie-/CSP-Trennung: Payloads Next.js-Admin-UI braucht eigene, lockerere Header, die die strikte CSP der öffentlichen Seite nicht berühren.

```caddyfile
redaktion.stoppramstein.de {
    reverse_proxy 127.0.0.1:3000

    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
    }
}
```

Empfehlung: Rate-Limiting oder IP-Allowlisting vor dem Login-Endpunkt (z. B. via Caddy oder fail2ban), da die Redaktionsoberfläche jetzt aus dem Internet erreichbar ist. Payloads eigener Login-Schutz (`maxLoginAttempts`/`lockTime`, siehe `cms/src/collections/Users.ts`) greift zusätzlich.

## Automatischer Rebuild bei Veröffentlichung (M9)

Wenn Redaktion einen Beitrag/Termin veröffentlicht (oder ein zeitgesteuerter Beitrag automatisch veröffentlicht wird), ruft Payload den `rebuild-webhook`-Dienst auf (`cms/src/hooks/triggerRebuild.ts` → `cms/webhook/rebuild-server.mjs`):

1. Prüft ein Shared Secret (`REBUILD_WEBHOOK_SECRET`, muss in `cms/.env` gesetzt sein).
2. Baut die Astro-Seite: `npm ci && npm run build && npm run check-links && npm run check-csp` — schlägt einer der Schritte fehl, wird **nicht** getauscht, die zuletzt erfolgreich gebaute Seite bleibt live.
3. Bei Erfolg: atomarer Symlink-Swap auf ein neues Release-Verzeichnis (kein Moment mit halb geschriebenem Output).
4. Bei Fehlschlag: vollständiges Log unter `/var/log/stoppramstein-rebuild.log`, E-Mail-Benachrichtigung an `REDAKTION_NOTIFY_EMAIL` (dieselben SMTP-Zugangsdaten wie für Payloads Passwort-Reset).

Mehrere Publish-Ereignisse kurz hintereinander werden nicht parallel gebaut — ein laufender Build wird zu Ende geführt, danach folgt bei Bedarf ein weiterer.

## Backups & Wiederherstellung (M10)

**Nächtliches Backup** (03:00 Uhr, `cms/backup/backup.sh`): `pg_dump` (gzip) der Datenbank + `tar` des Uploads-Volumes, 14 Tage lokale Aufbewahrung. Liegt unter dem `backups`-Volume im `backup`-Container.

**Offsite-Kopie (optional, per rclone):** Der `backup`-Container enthält bereits `rclone`; die Kopie läuft automatisch am Ende von `backup.sh` mit, sobald konfiguriert. Einmalige Einrichtung, sobald ein zweiter, räumlich getrennter EU-Anbieter feststeht (z. B. ein weiterer Object-Storage-Anbieter):

```bash
cd cms
docker compose run --rm backup rclone config   # interaktiv: Remote anlegen, Zugangsdaten eingeben
# Ergebnis nach secrets/rclone.conf kopieren (Pfad im Container: /root/.config/rclone/rclone.conf)
```

Danach in `cms/docker-compose.yml` den Mount `./secrets/rclone.conf:/root/.config/rclone/rclone.conf:ro` im `backup`-Service einkommentieren und in `.env` `OFFSITE_RCLONE_REMOTE=<remote-name>:<pfad>` setzen (siehe `.env.example`). Ohne diese beiden Schritte läuft weiterhin nur das lokale Backup — kein Verhaltensunterschied.

Welcher Anbieter das konkret sein soll, ist noch offen — siehe [REDAKTION-TODO.md](./REDAKTION-TODO.md).

**Wiederherstellung:**

```bash
cd cms

# 1. Payload-Container stoppen (Postgres bleibt laufen)
docker compose stop payload

# 2. Datenbank aus Backup einspielen
gunzip -c /pfad/zu/backups/db-<TIMESTAMP>.sql.gz | docker compose exec -T postgres psql -U payload -d payload

# 3. Uploads wiederherstellen
docker compose stop
tar xzf /pfad/zu/backups/uploads-<TIMESTAMP>.tar.gz -C ./restore-tmp/
docker run --rm -v cms_uploads:/data -v $(pwd)/restore-tmp:/restore alpine \
  sh -c "rm -rf /data/* && cp -a /restore/uploads/. /data/"

# 4. Neu starten
docker compose up -d
```

**Content-Export als Markdown/JSON** (Portabilität, unabhängig von Payload):

```bash
cd cms
npm run export   # schreibt nach cms/exports/{beitraege,termine}/
```

## Server-Konfiguration (Caddy)

Versionierte Vorlage: [`deploy/Caddyfile.example`](../deploy/Caddyfile.example) — Domain anpassen und als `/etc/caddy/Caddyfile` einspielen.

```caddyfile
stoppramstein.de {
    root * /var/www/stoppramstein
    file_server

    header {
        Content-Security-Policy "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'"
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
    }

    handle_errors {
        rewrite * /404.html
        file_server
    }
}
```

## Server-Konfiguration (nginx)

Versionierte Vorlage: [`deploy/nginx.conf.example`](../deploy/nginx.conf.example) — Domain und TLS-Zertifikatspfade anpassen und nach `/etc/nginx/sites-available/` einspielen.

```nginx
server {
    listen 443 ssl http2;
    server_name stoppramstein.de;

    root /var/www/stoppramstein;
    index index.html;

    # Security headers
    add_header Content-Security-Policy "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    # Trailing slash enforcement
    location ~ ^([^.]*[^/])$ {
        return 301 $1/;
    }

    location / {
        try_files $uri $uri/ =404;
    }

    error_page 404 /404.html;
}
```

Beide Blöcke oben liegen zusätzlich als versionierte Vorlage unter `deploy/` (`Caddyfile.example`/`nginx.conf.example`), damit die tatsächliche Server-Konfiguration nicht nur aus dieser Doku abgetippt werden muss. Welcher der beiden Webserver produktiv läuft, ist noch offen — siehe [REDAKTION-TODO.md](./REDAKTION-TODO.md).

## 404-Handling

`src/pages/404.astro` wird von Astro als statisches `dist/404.html` gebaut. Sowohl die Caddy- als auch die nginx-Konfiguration oben leiten fehlende Routen dorthin um.

## CSP-Hinweis

`npm run check-csp` prüft `dist/` nach dem Build auf Inline-`<script>`-Tags und Inline-Event-Handler, die gegen `script-src 'self'` verstoßen würden. Ist Teil von `npm run verify`. Alle Page-Scripts liegen als externe Dateien unter `public/scripts/` und werden per `<script type="module" src="...">` eingebunden (Astro bündelt/inlined sie dadurch nicht, siehe [ARCHITEKTUR.md](./ARCHITEKTUR.md)). Neue interaktive Features müssen diesem Muster folgen — kein `<script>` ohne `src` und keine `onclick="..."`-Attribute.
