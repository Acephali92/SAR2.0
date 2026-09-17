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
- **Zurückgestellte Komfort-Funktionen (Soll-Anforderungen):** Vorschau vor Veröffentlichung, feingranulare Versions-Wiederherstellungsrechte und eine Redaktions-Übersicht (offene Entwürfe/geplante Beiträge/anstehende Termine) sind bewusst nicht Teil der ersten Umsetzung. Details und empfohlener Ansatz: siehe Plan-Dokumentation der Payload-Integration bzw. `docs/ARCHITEKTUR.md`.
