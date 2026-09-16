# Deployment

## Zielinfrastruktur

| Komponente | Anforderung |
|------------|-------------|
| Hosting | Europäischer Anbieter (z. B. Hetzner, Uberspace, Infomaniak) |
| Server | Statischer File-Server (Caddy oder nginx) |
| TLS | Let's Encrypt (automatisiert) |
| Domain | stoppramstein.de |

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

**Aktuell gibt es keinen automatisierten Rebuild.** Da Astro rein statisch baut (kein SSR, kein API-Backend), muss nach jeder Content- oder Code-Änderung manuell `npm run build` + `rsync` ausgeführt werden (oder über die in `.github/workflows/ci.yml` laufende CI, die nur validiert, nicht deployt).

Empfehlung (noch nicht eingerichtet, keine bestehende Automatisierung): ein Cron-Job oder ein CI-Deploy-Step, der z. B. täglich oder bei jedem Push auf `main` automatisch baut und synced. Das ist eine sinnvolle Erweiterung, aber bewusst nicht Teil dieses Dokuments als bestehende Tatsache dargestellt.

## Server-Konfiguration (Caddy)

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

Weder eine `Caddyfile` noch eine nginx-Config liegt aktuell im Repository — diese Blöcke sind Referenzkonfiguration für das Deploy-Ziel, keine versionierten Dateien dieses Projekts.

## 404-Handling

`src/pages/404.astro` wird von Astro als statisches `dist/404.html` gebaut. Sowohl die Caddy- als auch die nginx-Konfiguration oben leiten fehlende Routen dorthin um.

## CSP-Hinweis

`npm run check-csp` prüft `dist/` nach dem Build auf Inline-`<script>`-Tags und Inline-Event-Handler, die gegen `script-src 'self'` verstoßen würden. Ist Teil von `npm run verify`. Alle Page-Scripts liegen als externe Dateien unter `public/scripts/` und werden per `<script type="module" src="...">` eingebunden (Astro bündelt/inlined sie dadurch nicht, siehe [ARCHITEKTUR.md](./ARCHITEKTUR.md)). Neue interaktive Features müssen diesem Muster folgen — kein `<script>` ohne `src` und keine `onclick="..."`-Attribute.
