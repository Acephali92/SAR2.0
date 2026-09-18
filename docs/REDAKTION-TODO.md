# Redaktion-TODO

Sammelstelle für unbelegte Aussagen, offene inhaltliche Lücken und bekannte technische Probleme, die vor einem Live-Launch geklärt werden sollten. Referenziert in `CLAUDE.md`.

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

- **`access.read` auf `beitraege`/`termine` ist weiter offen für alle Angemeldeten.** Code und Dokumentation gehen auseinander: `docs/INHALTE-PFLEGEN.md` und `cms/README.md` sagen „Autor sieht nur eigene Dokumente", die Collection gibt per `access.read` aber jedem eingeloggten Nutzer Lesezugriff auf alles (die Rollenlogik greift bisher nur bei `update`/`delete`). Redaktions-Übersicht und Vorschau setzen die Einschränkung deshalb jeweils selbst durch. Vor Launch klären, welche der beiden Aussagen gelten soll, und Code oder Doku angleichen.

- **`npm run tsc` in `cms/` ist nicht fehlerfrei:** `scripts/seed-import.ts` hat zwei vorbestehende Typfehler (Zeile 42 und 68, fehlendes `root` im Lexical-Objekt). Betrifft nur das einmalige Migrationsskript, nicht den Betrieb — sollte aber aufgeräumt werden, damit ein Typecheck als Gate taugt.
