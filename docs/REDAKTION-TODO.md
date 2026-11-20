# Redaktion-TODO

Offene Punkte für die **Redaktion**: Aussagen ohne Beleg, inhaltliche Lücken und Entscheidungen, die die Redaktion treffen muss. Referenziert in `CLAUDE.md`.

Was nicht hierher gehört:

- Technische und betriebliche offene Punkte: [`OFFENE-PUNKTE.md`](./OFFENE-PUNKTE.md)
- Erledigte Fehlerbehebungen und Umbauten: [`AENDERUNGSPROTOKOLL.md`](./AENDERUNGSPROTOKOLL.md)
- Anleitung zum Pflegen von Inhalten: [`INHALTE-PFLEGEN.md`](./INHALTE-PFLEGEN.md)

## Unbelegte Aussagen

- **Unterschriftenzahl des Aufrufs:** `src/content/mitmachen/aufruf.md` („Bereits 24.978 Unterschriften“, Description „über 24.900“) und `src/layouts/MitmachenLayout.astro` (Zähler und Hinweistext beim Aufruf) nennen eine Zahl ohne Quelle und ohne Datum. Seit unterschrieben wird auf ramsteinschliessen.de, veraltet sie. Zu entscheiden: aktuelle Zahl mit Stand und Quelle (z. B. von ramsteinschliessen.de) eintragen oder streichen.

- **Mitgliedsbeitrag bestätigen:** `src/pages/mitmachen/mitglied-werden.astro` nennt 120 € im Jahr, ermäßigt 60 € („ab 5 € im Monat“), weitere Ermäßigungen möglich. Quelle ist der Antrag auf Fördermitgliedschaft von 05/2023 aus den alten WordPress-Uploads. Vom Verein bestätigen lassen, dass die Beträge noch gelten. Die alte Angabe „Höhe selbst bestimmen, Mindestbeitrag 5 €“ hatte keine Quelle und ist gestrichen.

## Inhaltliche Lücken

- **Pressearchiv verweist auf die alte Website:** `src/content/seiten/presse.md` verlinkt „Ältere Pressemitteilungen“ auf `https://www.stoppramstein.de/presse/`. Die alte Seite ist nicht mehr erreichbar, nach dem Umzug zeigt die Adresse auf die neue Seite. Ältere Pressemitteilungen werden mit der Migration der Altdaten übernommen (Branch `feat/wordpress-altdaten`). Danach den Link auf die neue Stelle setzen.
- **Gendersprache im Aufruf-Text:** `src/content/mitmachen/aufruf.md` enthält „Mitarbeiter*innen“ und „Bürger*innen“, entgegen der Projektregel. Weil das der Wortlaut des unterzeichneten Aufrufs ist, nicht eigenmächtig ändern: Die Redaktion entscheidet, ob der Text angepasst oder als Zitat des Originals gekennzeichnet wird.

- **Laufzeit des Films „Ramstein – Das letzte Gefecht“:** Weder NuoFlix noch YouTube nennen sie auf der Filmseite. Bei Bedarf beim Filmemacher erfragen und im Film-Abschnitt der Startseite (`src/pages/index.astro`, Objekt `film`) ergänzen.

- **Antrag auf Fördermitgliedschaft fehlt:** Die Mitgliedsseite bietet nur E-Mail und Post an. Der alte Antrag (PDF, 05/2023) wird bewusst nicht verlinkt, weil er eine abweichende Postanschrift nennt. Sobald der Verein einen aktuellen Antrag liefert, als PDF unter `public/` ablegen und auf `/mitmachen/mitglied-werden/` im Abschnitt „So werden Sie Mitglied“ verlinken.
- **Bildnachweis Mitgliedsseite:** Die Fotos `public/images/mitglied-werden-hero-*` (Demonstrationszug am durchgestrichenen Air-Base-Wegweiser) und `public/images/mitglied-werden-gemeinschaft-*` (Lagerfeuer) stammen aus der Kampagne. Falls gewünscht, Urheber und Jahr als Bildnachweis ergänzen.

## Offene Entscheidungen

- **Bildrechte Film „Ramstein – Das letzte Gefecht“ belegen:** Norbert Fleischer (Filmemacher) und Frank Höger (Herausgeber) haben erlaubt, das Vorschaubild selbst zu hosten (`public/images/film-ramstein-das-letzte-gefecht.*`). Die Erlaubnis schriftlich (z. B. E-Mail) außerhalb des Repositorys ablegen, damit sie bei Nachfragen vorliegt.
- **Datenschutz-Abschnitt zum Odysee-Video prüfen:** `src/content/seiten/datenschutz.md`, „Video von Odysee (nur nach Klick)“. Bei der rechtlichen Prüfung der Datenschutzerklärung mitprüfen: Rechtsgrundlage für die Übermittlung in die USA, den Anbieter und die Google-Dienste, die der Odysee-Player nach dem Klick nachlädt (Tag Manager, Analytics, DoubleClick, geprüft am 2026-11-10). Space Odysee Inc., New York, ist der Name aus der Datenschutzerklärung von Odysee (Stand 2025-02-13). Er wurde nur über ein Suchergebnis ermittelt, weil die Seite ohne JavaScript leer bleibt.

- **Ziele für alte Adressen ohne Gegenstück:** Alte Adressen der WordPress-Seite müssen weiter funktionieren (`guidelines.md` §17.8). Für einige ist unklar, wohin sie führen sollen, weil es die Seite so nicht mehr gibt: `/nachrichten/`, `/infomaterial/`, `/newsletter`, `/impressionen-2025/`, `/event/`. Zu entscheiden ist je Adresse: passende neue Seite, nächsthöhere Rubrik (z. B. `/aktionen/`, `/analysen/`) oder bewusst „nicht mehr vorhanden“ (404). Ebenso offen: `/aufruf-zur-demo-am-14-februar-2026-in-muenchen/`, falls der Aufruf nicht als Beitrag oder Termin übernommen wurde. Weitere alte Adressen kommen hinzu, sobald das vollständige Inventar aus den alten WordPress-Daten vorliegt. Die Liste aller alten Adressen steht in [`OFFENE-PUNKTE.md`](./OFFENE-PUNKTE.md#weiterleitungen-für-alte-urls-fehlen).

- **Titelbild im Artikel:** Das Titelbild eines Beitrags aus dem CMS erscheint bisher nur als Vorschaubild beim Teilen in sozialen Medien (`og:image`), nicht im Artikel selbst. Zu entscheiden ist, wo es im Artikel stehen soll. Vorschlag: unter dem Anrisstext, so wie in der Vorschau der Redaktionsoberfläche. Die technische Umsetzung folgt danach, siehe [`OFFENE-PUNKTE.md`](./OFFENE-PUNKTE.md#titelbild-im-artikel-anzeigen).

- **Postanschrift des Vereins klären:** Drei Quellen nennen verschiedene Anschriften. Das Impressum (und damit `/kontakt/`, `/datenschutz/` und die Mitgliedsseite) nennt Saarstr. 2, 67366 Weingarten. Der Antrag von 05/2023 nennt Postfach 51 11 40, 13371 Berlin, die alte WordPress-Seite „Werde Mitglied“ Postfach 27 04 15, 13474 Berlin. Klären, welche Anschrift für Mitgliedsanträge gilt.
