# Redaktion-TODO

Offene Punkte für die **Redaktion**: Aussagen ohne Beleg, inhaltliche Lücken und Entscheidungen, die die Redaktion treffen muss. Referenziert in `CLAUDE.md`.

Was nicht hierher gehört:

- Technische und betriebliche offene Punkte: [`OFFENE-PUNKTE.md`](./OFFENE-PUNKTE.md)
- Erledigte Fehlerbehebungen und Umbauten: [`AENDERUNGSPROTOKOLL.md`](./AENDERUNGSPROTOKOLL.md)
- Anleitung zum Pflegen von Inhalten: [`INHALTE-PFLEGEN.md`](./INHALTE-PFLEGEN.md)

## Unbelegte Aussagen

- **Unterschriftenzahl des Aufrufs:** `src/content/mitmachen/aufruf.md` („Bereits 24.978 Unterschriften“, Description „über 24.900“) und `src/layouts/MitmachenLayout.astro` (Zähler und Hinweistext beim Aufruf) nennen eine Zahl ohne Quelle und ohne Datum. Seit unterschrieben wird auf ramsteinschliessen.de, veraltet sie. Zu entscheiden: aktuelle Zahl mit Stand und Quelle (z. B. von ramsteinschliessen.de) eintragen oder streichen.

## Inhaltliche Lücken

- **Pressearchiv verweist auf die alte Website:** `src/content/seiten/presse.md` verlinkt „Ältere Pressemitteilungen“ auf `https://www.stoppramstein.de/presse/`. Die alte Seite ist nicht mehr erreichbar, nach dem Umzug zeigt die Adresse auf die neue Seite. Ältere Pressemitteilungen werden mit der Migration der Altdaten übernommen (Branch `feat/wordpress-altdaten`). Danach den Link auf die neue Stelle setzen.
- **Gendersprache im Aufruf-Text:** `src/content/mitmachen/aufruf.md` enthält „Mitarbeiter*innen“ und „Bürger*innen“, entgegen der Projektregel. Weil das der Wortlaut des unterzeichneten Aufrufs ist, nicht eigenmächtig ändern: Die Redaktion entscheidet, ob der Text angepasst oder als Zitat des Originals gekennzeichnet wird.

- **Laufzeit des Films „Ramstein – Das letzte Gefecht“:** Weder NuoFlix noch YouTube nennen sie auf der Filmseite. Bei Bedarf beim Filmemacher erfragen und im Film-Abschnitt der Startseite (`src/pages/index.astro`, Objekt `film`) ergänzen.

## Offene Entscheidungen

- **Bildrechte Film „Ramstein – Das letzte Gefecht“ belegen:** Norbert Fleischer (Filmemacher) und Frank Höger (Herausgeber) haben erlaubt, das Vorschaubild selbst zu hosten (`public/images/film-ramstein-das-letzte-gefecht.*`). Die Erlaubnis schriftlich (z. B. E-Mail) außerhalb des Repositorys ablegen, damit sie bei Nachfragen vorliegt.
- **Datenschutz-Abschnitt zum Odysee-Video prüfen:** `src/content/seiten/datenschutz.md`, „Video von Odysee (nur nach Klick)“. Bei der rechtlichen Prüfung der Datenschutzerklärung mitprüfen: Rechtsgrundlage für die Übermittlung in die USA, den Anbieter und die Google-Dienste, die der Odysee-Player nach dem Klick nachlädt (Tag Manager, Analytics, DoubleClick, geprüft am 2026-11-10). Space Odysee Inc., New York, ist der Name aus der Datenschutzerklärung von Odysee (Stand 2025-02-13). Er wurde nur über ein Suchergebnis ermittelt, weil die Seite ohne JavaScript leer bleibt.

- **Ziele für alte Adressen ohne Gegenstück:** Alte Adressen der WordPress-Seite müssen weiter funktionieren (`guidelines.md` §17.8). Für einige ist unklar, wohin sie führen sollen, weil es die Seite so nicht mehr gibt: `/nachrichten/`, `/infomaterial/`, `/newsletter`, `/impressionen-2025/`, `/event/`. Zu entscheiden ist je Adresse: passende neue Seite, nächsthöhere Rubrik (z. B. `/aktionen/`, `/analysen/`) oder bewusst „nicht mehr vorhanden“ (404). Ebenso offen: `/aufruf-zur-demo-am-14-februar-2026-in-muenchen/`, falls der Aufruf nicht als Beitrag oder Termin übernommen wurde. Weitere alte Adressen kommen hinzu, sobald das vollständige Inventar aus den alten WordPress-Daten vorliegt. Die Liste aller alten Adressen steht in [`OFFENE-PUNKTE.md`](./OFFENE-PUNKTE.md#weiterleitungen-für-alte-urls-fehlen).

- **Titelbild im Artikel:** Das Titelbild eines Beitrags aus dem CMS erscheint bisher nur als Vorschaubild beim Teilen in sozialen Medien (`og:image`), nicht im Artikel selbst. Zu entscheiden ist, wo es im Artikel stehen soll. Vorschlag: unter dem Anrisstext, so wie in der Vorschau der Redaktionsoberfläche. Die technische Umsetzung folgt danach, siehe [`OFFENE-PUNKTE.md`](./OFFENE-PUNKTE.md#titelbild-im-artikel-anzeigen).
