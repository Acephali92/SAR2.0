# Änderungsprotokoll

Erledigte Fehlerbehebungen, Sicherheitsfixes und größere Umbauten. Neueste zuerst. Jeder Eintrag nennt Problem, Fix und Nachweis. Details stehen in den verlinkten Pull Requests bzw. Commits. Was noch offen ist, steht in [`OFFENE-PUNKTE.md`](./OFFENE-PUNKTE.md).

## 2026-10-21

### CMS ließ sich nach Dependabot-Updates nicht mehr installieren (PR #31)

Die cms-Security-Bündel #20, #29 und #30 hoben nur `payload` und `@payloadcms/graphql` auf 3.91.0, weil nur diese Advisories hatten. Die übrigen `@payloadcms/*` verlangten weiter exakt `payload@3.89.0`. `npm ci` in `cms/` brach mit `ERESOLVE` ab, das CMS-Image war nicht baubar. Aufgefallen ist das nicht, weil die CI `cms/` nicht baute.

- *Fix:* Alle `@payloadcms/*` stehen auf `^3.91.0`. Die CI hat einen neuen Job „CMS (install, typecheck, build)“ (`npm ci`, `tsc --noEmit`, `next build` ohne Datenbank). Eine Dependabot-Gruppe `payload` bündelt die Security-Updates der Payload-Pakete.
- *Nachweis:* `npm ci`, `tsc --noEmit` (0 Fehler) und `next build` lokal und in der CI grün.

### Upgrade auf Astro 7 (PR #27)

Astro 5.1.1 → 7.3.8, damit kommen Vite 8 und Zod 4. Das Upgrade schließt die Astro-Advisories, die innerhalb von Astro 5 nicht behebbar waren: den kritischen GHSA-26w7-cxv4-gfx2 (Fix in 7.2.8) sowie GHSA-8hv8-536x-4wqp (6.3.3) und GHSA-2pvr-wf23-7pc7 (6.4.6). Ausnutzbar waren sie für diese Seite nicht: Sie nutzt Astros Bildoptimierung nicht, und die beiden anderen betreffen nur SSR. `npm audit` hatte fälschlich einen Fix in Astro 5.18.2 genannt.

- *Fix:*
  - `src/content.config.ts`: `z` aus `astro/zod`, `z.url()` und `z.email()` (Zod 4).
  - `astro.config.mjs`: `compressHTML: true`, weil Astro 7 sonst Leerzeichen zwischen Inline-Elementen entfernt („Datenschutz·Impressum“).
  - `astro.config.mjs`: `vite.build.cssTarget` auf das bisherige Browser-Ziel (Chrome 87, Firefox 78, Safari 14, Edge 88) statt auf den Vite-8-Standard (Chrome 111, Firefox 114, Safari 16.4). Ein JS-Ziel ist nicht gesetzt, weil es kein gebündeltes JavaScript gibt und `build.target` als Liste den Build mit Rolldown abbricht.
  - `engines.node` steht auf `>=22.12.0`.
- *Nachweis:* Vergleich der Builds mit Astro 5 und Astro 7. Der sichtbare Text aller 23 Seiten ist identisch, bis auf ein schließendes Anführungszeichen in `mitmachen/aufruf`, das jetzt korrekt deutsch (`“`) gesetzt wird. IDs, Anker und Sitemaps sind gleich. Die Screenshots aller Seiten bei 1280 und 390 px sind pixelgleich.

### `@astrojs/tailwind` durch PostCSS-Konfiguration ersetzt (PR #25)

Die Integration ist eingestellt. Ihre letzte Version 6.0.2 verlangt `astro ^3 || ^4 || ^5` und blockierte damit Astro 6/7.

- *Fix:* `postcss.config.mjs` hängt `tailwindcss` und `autoprefixer` direkt in die PostCSS-Kette von Vite, genau das hatte die Integration getan. Tailwind CSS 3 und `tailwind.config.mjs` bleiben unverändert, `guidelines.md` §10.1 ist angepasst.
- *Nachweis:* `dist/` (97 Dateien) ist byte-genau identisch mit dem Stand vorher.

### Dependabot eingerichtet (PR #15, #23)

Alerts und Security-Updates waren aus, eine Konfiguration gab es nicht.

- *Fix:* `.github/dependabot.yml`:
  - wöchentliche, gebündelte Versions-Updates für `github-actions` und Root-`npm` mit 7 Tagen Wartezeit (`cooldown`)
  - Major-Updates als eigene PRs
  - für `cms/` nur Security-Updates

  Die Security-Bündel nehmen nur Minor- und Patch-Sprünge auf (#23). Das erste Root-Bündel (#21) hatte `astro` auf 7.2.8 gehoben und war am Peer-Bereich von `@astrojs/tailwind` gescheitert. Alerts und Security-Updates sind in den Repo-Einstellungen eingeschaltet.
- *Ergebnis bis 2026-10-21:* 114 Alerts behoben, von 132 auf 19, keiner davon kritisch.

## 2026-10-20

### Semgrep-Sicherheitscheck lief nie (PR #14)

Der Workflow lag als `.github/workflows/Security` ohne `.yml`-Endung im Repo, GitHub registrierte ihn nicht.

- *Fix:*
  - Der Workflow heißt jetzt `security.yml`. Er scannt bei Pull Requests, bei Pushes auf `master`, wöchentlich und manuell (`semgrep scan --config p/default --metrics off`, ohne Semgrep-Konto). Die Ergebnisse gehen an GitHub Code Scanning. Ein Pull Request scheitert nur bei neuen Findings (`--baseline-commit`).
  - Von 15 Findings sind 11 behoben: Die Actions in `ci.yml` sind auf SHAs festgelegt, und `scripts/check-links.mjs` begrenzt aufgelöste Pfade jetzt auf `dist/`. Vorher galt `/../package.json` als gültiger Link.
  - Die 4 Findings in `cms/` sind zurückgestellt, siehe [`OFFENE-PUNKTE.md`](./OFFENE-PUNKTE.md#zurückgestellte-semgrep-findings-in-cms).

## 2026-09-18 (PR #11)

### Entwürfe und Mediathek waren über die API anonym lesbar

Beim Sicherheitsaudit live nachgewiesen. Das Leck bestand seit Einführung der CMS-Integration. Ohne Login lieferte `GET /api/beitraege/<id>?draft=true` (ebenso GraphQL mit `draft: true`) bei jedem veröffentlichten Beitrag den neuesten unveröffentlichten Entwurf, für `termine` ebenso. `GET /api/media` war samt Dateien öffentlich. Nie veröffentlichte Entwürfe waren nicht lesbar. **Falls in dieser Zeit eine Instanz öffentlich erreichbar war, müssen Entwurfsstände aus diesem Zeitraum als potenziell öffentlich gelten.**

- *Ursache:* `access.read` prüfte für Unangemeldete nur `freigabeStatus`. Der bleibt `veroeffentlicht`, wenn nach der Veröffentlichung ein Entwurf gespeichert wird.
- *Fix:*
  - `cms/src/access/readPublishedOrSession.ts` verlangt für anonyme und API-Key-Zugriffe `freigabeStatus = veroeffentlicht` **und** `_status = published`.
  - Versionen sind für API-Keys gesperrt, und `Media` ist nur noch für Angemeldete lesbar. Der Loader lädt Bilder deshalb mit dem API-Key.
  - Der Job für zeitgesteuerte Veröffentlichung setzt auch `_status: published`.
  - Folge für die Redaktion: „Änderungen veröffentlichen“ ist nötig, siehe [`INHALTE-PFLEGEN.md`](./INHALTE-PFLEGEN.md).

### Leserechte für angemeldete Autoren zu weit

`access.read` gab jedem Session-Login Lesezugriff auf alles, die Doku sagte aber „Autor sieht nur eigene Dokumente“.

- *Fix:* Redaktion und Admin sehen alles, ein Autor nur Veröffentlichtes und eigene Dokumente (`cms/src/access/readPublishedOrSession.ts`, analog zu `ownDraftOrRedaktion.ts`).

### Keine Datenbank-Migrationen (Launch-Blocker)

Payloads Postgres-Adapter legt Tabellen nur außerhalb von `NODE_ENV=production` an. Im Repo gab es keine Migrationen, der erste Produktionsstart wäre mit leerer Datenbank gescheitert. Ein erster Fix (`npx payload migrate` im Dockerfile) funktionierte nicht, weil das Runner-Image die Config nicht enthält.

- *Fix:* Die Migration `cms/src/migrations/20260918_143807_initial_schema.ts` ist erzeugt und über `prodMigrations` mitgebündelt. Das Dockerfile setzt `PAYLOAD_AUTO_MIGRATE=true`.
- *Nachweis im Container:* Gegen eine leere Datenbank entstanden alle 22 Tabellen, ein Neustart migriert nicht erneut. Die Einschränkung bei Dev-„Push“-Datenbanken steht in [`OFFENE-PUNKTE.md`](./OFFENE-PUNKTE.md#bewusste-einschränkungen).

### Export-Skript fehlerhaft

`cms/scripts/export-content.mjs` filterte auf das falsche Feld (`status` statt `freigabeStatus`) und lief mit reinem `node` gar nicht. Es exportierte öffentlich unsichtbare Beiträge. In `all.json` landeten Nutzerdaten der Redaktion samt `apiKey`. Ein aktivierter API-Key wäre im Klartext im Export gelandet.

- *Fix:*
  - Aufruf über `payload run`.
  - Gleicher Filter wie der öffentliche Lesezugriff.
  - Von `createdBy` wird nur noch der Name exportiert (`populate: { users: { name: true } }`).
- *Nachweis:* Mit vier Testfällen geprüft: Exportiert wurden genau die öffentlich sichtbaren Beiträge, ohne personenbezogene Daten.

### Rebuild-Trigger verpasste Veröffentlichungen und Korrekturen

`triggerRebuild` reagierte nur auf Wechsel von `freigabeStatus`. Veröffentlichte Korrekturen und „Status umstellen, als Entwurf speichern, dann veröffentlichen“ lösten keinen Rebuild aus.

- *Fix:* `cms/src/hooks/triggerRebuild.ts` vergleicht die Hauptzeile des Dokuments vor und nach der Änderung. Entwurf und Autosave lösen nichts aus.
- *Nachweis:* 11 Fälle gegen einen lokalen Webhook-Empfänger. Der neue Trigger bestand alle, der alte scheiterte an drei.

### Titelbilder und eingebettete Medien

- **Titelbilder** wurden nirgends gerendert. Sie dienen jetzt als `og:image` (`ArticleLayout.astro`, `analysen/[...slug].astro`). Die Anzeige im Artikel ist offen, siehe [`REDAKTION-TODO.md`](./REDAKTION-TODO.md).
- **Eingebettete Bilder und PDFs** verwiesen auf die CMS-URL. Die Seite hätte das CMS zur Laufzeit gebraucht, und die CSP hätte sie blockiert.
  - *Fix:* `payload-loader.ts` (`spiegleEingebetteteMedien`) spiegelt sie nach `/media/cms/`. Bilder fremder Herkunft lassen den Build scheitern, und `scripts/check-csp.mjs` schlägt bei Verweisen auf `/api/media/` an.
  - *Nachweis:* Auch bei gestopptem CMS lieferte die Seite Artikel, Bildvarianten und PDF aus.
- **Beschnittene Bilder** auf mittleren Breiten: Payload bot auch den 1200×630-Zuschnitt `og` als Quelle an.
  - *Fix:* Ein eigener Upload-Konverter in `cms/src/lib/lexicalToHtml.ts` nutzt nur seitenverhältnis-treue Größen.

### Weitere Fixes

- **Bildgrößen als WebP:** `formatOptions` galt nur fürs Original. Jetzt hat jede Größe in `cms/src/collections/Media.ts` eigene WebP-Optionen. Mit einem Testbild für `thumbnail` geprüft.
- **Gravatar entfernt:** Die Admin-Oberfläche lud das Konto-Symbol von `gravatar.com` und übermittelte damit einen Hash der E-Mail-Adresse an einen US-Dienst. Jetzt `admin: { avatar: 'default' }`.
- **Next.js 15.4.11 mit kritischen Advisories:** Upgrade auf Next.js 16.3.5 und sharp 0.35.4. Im Docker-Image getestet (Build, Start, Upload, Admin-Oberfläche, Zugriffsregeln, zeitgesteuerte Veröffentlichung, Astro-Build gegen das CMS). Dabei mitbehoben:
  - Das Image war nie baubar (fehlendes `public/`).
  - `seed-import.ts` setzte kein `_status: 'published'`.
  - Turbopack wählte das falsche Wurzelverzeichnis.
- **sharp im Root-Projekt** von 0.33.5 auf 0.35.4 angehoben, wie im CMS.
- **CSP-Header-Vorlagen:** `deploy/Caddyfile.example` und `deploy/nginx.conf.example` sind versioniert. Die Caddy-Variante ist per `caddy validate` geprüft. Ausgerollt werden sie erst nach der Hosting-Entscheidung.
- **Offsite-Backup-Mechanismus:** `backup.sh` kopiert per `rclone`, sobald es konfiguriert ist. Der Anbieter ist offen.
- **Newsletter-Formular ohne Backend:** Es postete an eine Route, die es bei `output: 'static'` nicht gibt, und zeigte nur eine vorgetäuschte Erfolgsmeldung. Ersetzt durch einen `mailto:`-Link (`guidelines.md` §14.3).
