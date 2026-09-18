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

- **`access.read` auf `beitraege`/`termine` ist weiter offen für alle per Session Angemeldeten.** Code und Dokumentation gehen auseinander: `docs/INHALTE-PFLEGEN.md` und `cms/README.md` sagen „Autor sieht nur eigene Dokumente", die Collection gibt per `access.read` aber jedem mit Session eingeloggten Nutzer Lesezugriff auf alles (die Rollenlogik greift bisher nur bei `update`/`delete`). Redaktions-Übersicht und Vorschau setzen die Einschränkung deshalb jeweils selbst durch. Vor Launch klären, welche der beiden Aussagen gelten soll, und Code oder Doku angleichen. (API-Key-Zugriffe sind davon nicht mehr betroffen, siehe nächster Punkt.)

- **GESCHLOSSEN (2026-09-18): Entwürfe und Mediathek waren über die API anonym lesbar.** Beim Sicherheitsaudit live nachgewiesen, seit Einführung der CMS-Integration vorhanden. Ob eine produktiv erreichbare Instanz betroffen war, ist hier nicht bekannt — falls ja, müssen Entwurfsstände aus diesem Zeitraum als potenziell öffentlich gelten.
  - *Was lesbar war:* Ohne Login lieferte `GET /api/beitraege/<id>?draft=true` (ebenso GraphQL mit `draft: true`) bei jedem veröffentlichten Beitrag den **neuesten, unveröffentlichten Entwurf** — Titel und Volltext von Korrekturen oder Überarbeitungen, bevor die Redaktion sie freigegeben hatte. `termine` hatte dieselbe Regel. Zusätzlich war `GET /api/media` samt Dateien öffentlich — also auch Bilder, die nur in unveröffentlichten Entwürfen steckten. Reine, nie veröffentlichte Entwürfe waren **nicht** lesbar (404).
  - *Ursache:* `access.read` für Unangemeldete prüfte nur `freigabeStatus`. Dieser bleibt `veroeffentlicht`, wenn nach der Veröffentlichung ein Entwurf gespeichert wird; Payload liefert mit `draft=true` dann die neueste Version, solange `_status` nicht mitgeprüft wird. `Media` hatte `read: () => true`.
  - *Fix:* `cms/src/access/readPublishedOrSession.ts` verlangt für anonyme **und** API-Key-Zugriffe `freigabeStatus = veroeffentlicht` UND `_status = published`. Versionen sind für API-Keys gesperrt. `Media` ist nur noch für Angemeldete lesbar; `payload-loader.ts` lädt Bilder deshalb mit dem API-Key. Der Job für zeitgesteuerte Veröffentlichung setzt jetzt auch `_status: published` — sonst wäre ein geplanter Beitrag trotz Freigabe unsichtbar geblieben.
  - *Folge für die Redaktion:* Ein Beitrag erscheint nur noch, wenn der Status „Veröffentlicht" ist **und** in Payload „Änderungen veröffentlichen" geklickt wurde. Bisher reichte faktisch der Status allein. Siehe `docs/INHALTE-PFLEGEN.md`, „Freigabe und Veröffentlichung".
  - *Bewusst verbleibend:* Der Build-Nutzer (API-Key) kann die komplette Media-Liste (Metadaten, auch reine Entwurfsbilder) und die Nutzerliste lesen. Das braucht der Loader nicht vollständig — er lädt nur Bilder veröffentlichter Dokumente herunter und braucht aus `users` nur den Autorennamen —, eine feinere Regel wäre aber deutlich aufwendiger. Der Key ist ein Server-Geheimnis, kein öffentlicher Zugang.

- **Titelbilder aus dem CMS werden auf der Website nicht angezeigt.** `payload-loader.ts` lädt `image` herunter und legt es als `data.image` ab, aber weder `src/pages/analysen/[...slug].astro` noch `ArticleLayout.astro` rendern das Feld — beim Live-Build-Test (2026-09-18) landete das Bild in `dist/media/cms/`, wurde aber von keiner Seite referenziert. Bilder, die im Rich-Text-Inhalt eingebettet sind, lädt der Loader gar nicht herunter: der HTML-Konverter setzt die absolute CMS-URL (`https://redaktion…/api/media/file/…`) ein, `payload-loader.ts` übernimmt `renderedHtml` unverändert. Auf der öffentlichen Seite scheitert das an der CSP (`img-src 'self'`) und seit dem Fix oben zusätzlich am fehlenden Login.

- **`npm run tsc` in `cms/` ist nicht fehlerfrei:** `scripts/seed-import.ts` hat zwei vorbestehende Typfehler (Zeile 42 und 68, fehlendes `root` im Lexical-Objekt). Betrifft nur das einmalige Migrationsskript, nicht den Betrieb — sollte aber aufgeräumt werden, damit ein Typecheck als Gate taugt.
