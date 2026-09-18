# Redaktion-TODO

Sammelstelle für unbelegte Aussagen, offene inhaltliche Lücken und bekannte technische Probleme, die vor einem Live-Launch geklärt werden sollten. Referenziert in `CLAUDE.md`.

## Anforderungs-Traceability (M1–M10, S1–S4)

Abgleich der Muss-/Soll-Anforderungsliste des Referenz-CMS-Lastenhefts mit dem aktuellen Stand (Stand 2026-09-18). Details zu den einzelnen Lücken stehen in den jeweils verlinkten Abschnitten unten.

| # | Anforderung | Status |
|---|---|---|
| M1 | Login E-Mail/Passwort, ohne Git/GitHub | ✅ Erledigt (`cms/src/collections/Users.ts`) |
| M2 | Rollen Autor/Redaktion/Admin | ✅ Erledigt — Schreibrechte korrekt; Leserechte waren zu weit, siehe „access.read" unten (**geschlossen**) |
| M3 | Deutsche UI + Rich-Text-Editor | ✅ Erledigt (`payload.config.ts` i18n, `src/lib/editorConfig.ts`) |
| M4 | Bild/PDF-Upload, Verkleinerung, Pflicht-Alt-Text | ⚠️ Größtenteils — siehe „Bildgrößen werden als JPEG statt WebP erzeugt" unten |
| M5 | Entwurf→Freigabe→Veröffentlichung + zeitgesteuert | ✅ Erledigt (`freigabeStatus`, `cms/src/jobs/schedulePublish.ts`) |
| M6 | Beitrag/Termin mit festen Feldern + Verknüpfung | ✅ Erledigt — Titelbild-Anzeige war eine Lücke, siehe „Titelbilder aus dem CMS" unten (**Titelbild-Teil geschlossen**, eingebettete Bilder im Fließtext bleiben offen) |
| M7 | Statische, cookiefreie Seite, kein React, CSP `script-src 'self'` | ⚠️ Teilweise — siehe „CSP-Header-Auslieferung" unten |
| M8 | EU-Hosting, keine Daten an US-Dienste | ⚠️ Teilweise — Gravatar-Punkt **geschlossen**, SMTP-Anbieter offen (siehe „SMTP-Anbieter" unten) |
| M9 | Änderungen innerhalb weniger Minuten live | ✅ Erledigt (`cms/src/hooks/triggerRebuild.ts`, `cms/webhook/rebuild-server.mjs`) |
| M10 | Tägliche Backups, dokumentierte Wiederherstellung, Export als MD/JSON | ⚠️ Teilweise — Export-Bug **geschlossen**, Offsite-Backup offen (siehe „Offsite-Backup-Speicherort" unten) |
| S1 | Vorschau vor Veröffentlichung | ✅ Erledigt (`cms/src/components/VorschauView.tsx`) |
| S2 | Versionsverlauf mit Wiederherstellung | ✅ Erledigt (`versions.maxPerDoc`, `cms/src/hooks/restrictVersionRestore.ts`) |
| S3 | Redaktions-Übersicht | ✅ Erledigt (`cms/src/components/RedaktionsUebersicht.tsx`) |
| S4 | Pflege durch Docker-Einsteiger ohne Framework-Tiefe | ⚠️ Teilweise — siehe „LAUNCH-BLOCKER: Keine Datenbank-Migrationen" unten |

## Technische Probleme

- **Newsletter-Formular ohne Backend:** `src/pages/index.astro` postet an `action="/api/newsletter"`. Das Projekt ist aber `output: 'static'` (siehe `astro.config.mjs`) — diese Route existiert nicht. Das Formular zeigt aktuell nur eine simulierte Erfolgsmeldung (client-seitiges `setTimeout`), sendet aber keine E-Mail-Adresse irgendwohin. Muss vor Launch entweder an einen echten Formular-Handler (self-hosted, DSGVO-konform) angebunden oder durch einen `mailto:`-Link ersetzt werden (siehe `guidelines.md` §14.3).

## Screenshot

- `docs/screenshot.png` wurde aus `screenshots/Screenshot 2026-09-16 182321.png` übernommen (manueller Screenshot der Startseite, da automatisierte Erstellung per Browser-Tool in dieser Session nicht möglich war). Bei Layout-Änderungen an der Startseite aktualisieren.

## Unbelegte Aussagen

*(Noch keine gemeldet. Beim Redigieren von Inhalten in `src/content/warum-ramstein/` bzw. Beiträgen im CMS hier eintragen, wenn eine Aussage keine Quelle hat.)*

## Payload-CMS: offene Punkte

- **Offsite-Backup-Speicherort:** Das nächtliche Backup (`cms/backup/backup.sh`) liegt aktuell nur lokal auf dem Server (14 Tage Aufbewahrung). Ein zweiter, räumlich getrennter Speicherort (z. B. `rsync`/`rclone` zu einem weiteren EU-Anbieter) ist noch zu klären und einzurichten — siehe `docs/DEPLOYMENT.md`, Abschnitt "Backups & Wiederherstellung".
- **SMTP-Anbieter:** Für Payloads Passwort-Reset-E-Mails und die Rebuild-Fehlerbenachrichtigung (`cms/.env.example`, `SMTP_*`) fehlt noch ein konkreter, DSGVO-konformer EU-E-Mail-Versanddienst.
- **Zurückgestellte Komfort-Funktionen — umgesetzt.** Redaktions-Übersicht, Versions-Wiederherstellungsrechte und Vorschau vor Veröffentlichung sind gebaut (siehe `docs/INHALTE-PFLEGEN.md` Teil B und `docs/ARCHITEKTUR.md`). Verbliebene Einschränkungen:
  - **Öffentliche Preview-URL bewusst nicht gebaut.** Die Vorschau lebt ausschließlich in der angemeldeten Admin-Oberfläche. Ein Link zum Teilen mit Außenstehenden würde entweder SSR auf der öffentlichen Seite oder ein Token-Cookie erfordern — beides widerspricht der statischen, cookiefreien Architektur.
  - **Vorschau ist keine pixelgenaue Kopie.** Header/Footer der öffentlichen Seite fehlen bewusst; Schriftfamilien werden nur benannt (IBM Plex ist in `cms/` nicht selbst gehostet, es greift der Fallback). Für die Beurteilung von Text, Bild, Quellen und Verknüpfungen reicht das; für ein Layout-Urteil bis auf den Pixel nicht.
  - **Media-Restore-Rechte offen, aber gegenstandslos:** `Media` hat aktuell keine `versions` aktiviert, es gibt dort also nichts wiederherzustellen. Wird das später eingeschaltet, muss `canReadVersions` (bzw. eine Admin-Variante davon) dort ebenfalls an `access.readVersions` gehängt werden.

- **GESCHLOSSEN (2026-09-18): `access.read` auf `beitraege`/`termine` war für alle per Session Angemeldeten offen.** Code und Dokumentation gingen auseinander: `docs/INHALTE-PFLEGEN.md` und `cms/README.md` sagen „Autor sieht nur eigene Dokumente", `access.read` gab aber jedem mit Session eingeloggten Nutzer Lesezugriff auf alles (die Rollenlogik griff bisher nur bei `update`/`delete`). *Fix:* `cms/src/access/readPublishedOrSession.ts` prüft für Session-Logins jetzt die Rolle — Redaktion/Admin sehen weiterhin alles, Autor nur noch Veröffentlichtes oder eigene Dokumente (`{ or: [nurVeroeffentlicht, { createdBy: { equals: req.user.id } }] }`, analog zu `ownDraftOrRedaktion.ts`). Damit stimmen Code und Doku jetzt überein; Redaktions-Übersicht und Vorschau setzten die Einschränkung ohnehin schon selbst durch und sind unverändert. (API-Key-Zugriffe sind davon nicht betroffen, siehe nächster Punkt.)

- **GESCHLOSSEN (2026-09-18): Entwürfe und Mediathek waren über die API anonym lesbar.** Beim Sicherheitsaudit live nachgewiesen, seit Einführung der CMS-Integration vorhanden. Ob eine produktiv erreichbare Instanz betroffen war, ist hier nicht bekannt — falls ja, müssen Entwurfsstände aus diesem Zeitraum als potenziell öffentlich gelten.
  - *Was lesbar war:* Ohne Login lieferte `GET /api/beitraege/<id>?draft=true` (ebenso GraphQL mit `draft: true`) bei jedem veröffentlichten Beitrag den **neuesten, unveröffentlichten Entwurf** — Titel und Volltext von Korrekturen oder Überarbeitungen, bevor die Redaktion sie freigegeben hatte. `termine` hatte dieselbe Regel. Zusätzlich war `GET /api/media` samt Dateien öffentlich — also auch Bilder, die nur in unveröffentlichten Entwürfen steckten. Reine, nie veröffentlichte Entwürfe waren **nicht** lesbar (404).
  - *Ursache:* `access.read` für Unangemeldete prüfte nur `freigabeStatus`. Dieser bleibt `veroeffentlicht`, wenn nach der Veröffentlichung ein Entwurf gespeichert wird; Payload liefert mit `draft=true` dann die neueste Version, solange `_status` nicht mitgeprüft wird. `Media` hatte `read: () => true`.
  - *Fix:* `cms/src/access/readPublishedOrSession.ts` verlangt für anonyme **und** API-Key-Zugriffe `freigabeStatus = veroeffentlicht` UND `_status = published`. Versionen sind für API-Keys gesperrt. `Media` ist nur noch für Angemeldete lesbar; `payload-loader.ts` lädt Bilder deshalb mit dem API-Key. Der Job für zeitgesteuerte Veröffentlichung setzt jetzt auch `_status: published` — sonst wäre ein geplanter Beitrag trotz Freigabe unsichtbar geblieben.
  - *Folge für die Redaktion:* Ein Beitrag erscheint nur noch, wenn der Status „Veröffentlicht" ist **und** in Payload „Änderungen veröffentlichen" geklickt wurde. Bisher reichte faktisch der Status allein. Siehe `docs/INHALTE-PFLEGEN.md`, „Freigabe und Veröffentlichung".
  - *Bewusst verbleibend:* Der Build-Nutzer (API-Key) kann die komplette Media-Liste (Metadaten, auch reine Entwurfsbilder) und die Nutzerliste lesen. Das braucht der Loader nicht vollständig — er lädt nur Bilder veröffentlichter Dokumente herunter und braucht aus `users` nur den Autorennamen —, eine feinere Regel wäre aber deutlich aufwendiger. Der Key ist ein Server-Geheimnis, kein öffentlicher Zugang.

- **TEILWEISE GESCHLOSSEN (2026-09-18): Titelbilder aus dem CMS wurden auf der Website nicht angezeigt.** `payload-loader.ts` lädt `image` herunter und legt es als `data.image` ab, aber weder `src/pages/analysen/[...slug].astro` noch `ArticleLayout.astro` renderten das Feld — beim Live-Build-Test (2026-09-18) landete das Bild in `dist/media/cms/`, wurde aber von keiner Seite referenziert. *Fix:* `ArticleLayout.astro` bekommt (analog zu `EventLayout.astro`) eine `image`-Prop und nutzt sie als `ogImage`; `analysen/[...slug].astro` reicht `entry.data.image` durch. Beiträge haben damit wie Termine ein Social-Preview-Bild.
  - **Weiterhin offen:** Bilder, die im Rich-Text-Inhalt eingebettet sind, lädt der Loader gar nicht herunter: der HTML-Konverter setzt die absolute CMS-URL (`https://redaktion…/api/media/file/…`) ein, `payload-loader.ts` übernimmt `renderedHtml` unverändert. Auf der öffentlichen Seite scheitert das an der CSP (`img-src 'self'`) und seit dem Leak-Fix oben zusätzlich am fehlenden Login. Das Titelbild ist davon nicht betroffen (eigener Downloadpfad über `resolveImage`), nur Bilder direkt im Fließtext.

- **LAUNCH-BLOCKER: Keine Datenbank-Migrationen — ein frischer Produktionsserver bekommt kein Schema.** Payloads Postgres-Adapter legt Tabellen nur außerhalb von `NODE_ENV=production` automatisch an („push", siehe `@payloadcms/db-postgres/dist/connect.js`). Das Dockerfile setzt `NODE_ENV=production`, und im Repo gibt es kein `cms/src/migrations/`. Die bisherigen Tests liefen gegen eine lokal per Dev-Modus angelegte Datenbank und haben das deshalb nie gezeigt. Nötig: eine Migrationsstrategie festlegen (`payload migrate:create` für das Ausgangsschema, `payload migrate` vor dem Start im Container) und klären, wie bestehende, per Push angelegte Datenbanken übernommen werden. Bewusst nicht nebenbei gelöst, weil es eine Betriebsentscheidung ist.

- **GESCHLOSSEN (2026-09-18): Gravatar in der Admin-Oberfläche.** Payload lud das Konto-Symbol standardmäßig von `gravatar.com` (`admin.avatar: 'gravatar'`, Payloads Default) — bei jedem Seitenaufruf ging ein Hash der E-Mail-Adresse der angemeldeten Person an einen US-Dienst. Betraf nur `redaktion.stoppramstein.de`, nicht die öffentliche Seite. *Fix:* `admin: { avatar: 'default' }` in `cms/src/payload.config.ts`.

- **Restliche Advisories im CMS (7× mittel/niedrig):** stecken in Payloads eigenen Abhängigkeiten — `drizzle-kit`/`esbuild` (nur Entwicklungswerkzeug, vom Build ausgeschlossen) und `dompurify` im Monaco-Code-Editor der Admin-UI. Innerhalb von Payload 3.89 nicht behebbar; bei künftigen Payload-Updates erneut `npm audit` prüfen.

- **Root-Projekt hat noch sharp 0.33.5** mit denselben libvips-Advisories wie vorher das CMS. Dort nur zur Build-Zeit im Einsatz (`scripts/generate-assets.mjs`, Astro-Bildverarbeitung), verarbeitet also keine fremden Uploads — geringeres Risiko, aber beim nächsten Dependency-Update mitziehen.

- **Bildgrößen werden als JPEG statt WebP erzeugt:** `formatOptions` in `cms/src/collections/Media.ts` gilt nur fürs Original; `thumbnail`/`card`/`og` bleiben JPEG. `payload-loader.ts` lädt die `card`-Variante — mit eigenen `formatOptions` je Größe wäre sie deutlich kleiner.

- **GESCHLOSSEN (2026-09-18): Export-Skript (`cms/scripts/export-content.mjs`) filterte auf falsches Feld.** `payload.find` bekam `where: { status: { equals: 'veroeffentlicht' } }`, das Feld heißt aber `freigabeStatus` (siehe Kommentar in `cms/src/fields/statusField.ts` zur Namenskollision mit Payloads generiertem Postgres-Enum `_status`). Payload ignoriert unbekannte `where`-Schlüssel, d. h. der Filter griff nicht und `npm run export` exportierte vermutlich auch unveröffentlichte Entwürfe. *Fix:* Feldname auf `freigabeStatus` korrigiert. **Noch zu tun:** einen echten Export-Lauf gegen eine befüllte Instanz durchführen und `cms/exports/*.json`/`*.md` stichprobenartig prüfen — in dieser Umgebung stand kein laufender Docker/Postgres-Stack zur Verfügung.

- **CSP-Header-Auslieferung (M7) ist noch nicht Teil des Repos.** `scripts/check-csp.mjs` prüft nur, dass der Build-Output keine Inline-Scripts enthält — das ist eine Vorbedingung, aber keine Garantie, dass der produktive Webserver tatsächlich `Content-Security-Policy: script-src 'self'` sendet. Das Referenz-Snippet in `docs/DEPLOYMENT.md` (Caddy/nginx) ist nur Dokumentation; es liegt weder eine Caddyfile noch eine nginx-Config im Repository (siehe `docs/DEPLOYMENT.md`, Abschnitt Deployment). Vor Launch: Webserver-Wahl treffen und dessen Config versioniert ins Repo aufnehmen, damit der CSP-Header nicht von einer undokumentierten manuellen Server-Konfiguration abhängt.

- **Kosmetisch:** Payloads deutsche Übersetzung zeigt in der Versionsliste „Sortieren nach {{label}}" (nicht aufgelöster Platzhalter in Payload selbst).

- **GESCHLOSSEN (2026-09-18): Next.js 15.4.11 mit kritischen Advisories im CMS.** Upgrade auf Next.js 16.3.5 (Turbopack) und sharp 0.35.4; `npm audit` im CMS: kritisch 1 → 0, hoch 2 → 0. Payload 3.89 unterstützt Next.js nur `<15.5` oder `>=16.2.6`, der 15.5-Patchzweig schied daher aus. Getestet: Produktions-Build lokal und im Docker-Image (Linux/Alpine), Start des Images gegen die Datenbank, Bild-Upload mit Größenvarianten über sharp im Container, Admin-Oberfläche im Browser (Dashboard, Bearbeiten mit Autosave, Vorschau, Versionen, Versionsvergleich; keine Konsolenfehler), Rollen- und Zugriffsregeln per REST, zeitgesteuerte Veröffentlichung über den Cron des Produktionsservers, Astro-Build gegen das CMS. Dabei mitbehoben: (a) das Docker-Image war nie baubar (`COPY /app/public` ohne `public/`-Verzeichnis), (b) die zwei Typfehler in `scripts/seed-import.ts` ließen `next build` mit lokal generierten Typen scheitern — auf frischem Checkout traten sie nicht auf, der Docker-Build war davon also nicht betroffen, (c) `seed-import.ts` setzte kein `_status: 'published'` und hätte seit dem Leak-Fix unsichtbare Beiträge importiert, (d) Turbopack wählte wegen des zweiten Lockfiles das Repo-Wurzelverzeichnis (samt dessen `node_modules`) als Wurzel, jetzt fest auf `cms/` gesetzt.
