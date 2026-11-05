# Redaktion-TODO

Offene Punkte für die **Redaktion**: Aussagen ohne Beleg, inhaltliche Lücken und Entscheidungen, die die Redaktion treffen muss. Referenziert in `CLAUDE.md`.

Was nicht hierher gehört:

- Technische und betriebliche offene Punkte: [`OFFENE-PUNKTE.md`](./OFFENE-PUNKTE.md)
- Erledigte Fehlerbehebungen und Umbauten: [`AENDERUNGSPROTOKOLL.md`](./AENDERUNGSPROTOKOLL.md)
- Anleitung zum Pflegen von Inhalten: [`INHALTE-PFLEGEN.md`](./INHALTE-PFLEGEN.md)

## Unbelegte Aussagen

*(Noch keine gemeldet. Beim Redigieren von Inhalten in `src/content/warum-ramstein/` bzw. Beiträgen im CMS hier eintragen, wenn eine Aussage keine Quelle hat.)*

## Inhaltliche Lücken

*(Noch keine gemeldet.)*

## Offene Entscheidungen

- **Ziele für alte Adressen ohne Gegenstück:** Alte Adressen der WordPress-Seite müssen weiter funktionieren (`guidelines.md` §17.8). Für einige ist unklar, wohin sie führen sollen, weil es die Seite so nicht mehr gibt: `/nachrichten/`, `/infomaterial/`, `/newsletter`, `/impressionen-2025/`, `/event/`. Zu entscheiden ist je Adresse: passende neue Seite, nächsthöhere Rubrik (z. B. `/aktionen/`, `/analysen/`) oder bewusst „nicht mehr vorhanden“ (404). Ebenso offen: `/aufruf-zur-demo-am-14-februar-2026-in-muenchen/`, falls der Aufruf nicht als Beitrag oder Termin übernommen wurde. Weitere alte Adressen kommen hinzu, sobald das vollständige Inventar aus den alten WordPress-Daten vorliegt. Die Liste aller alten Adressen steht in [`OFFENE-PUNKTE.md`](./OFFENE-PUNKTE.md#weiterleitungen-für-alte-urls-fehlen).

- **Titelbild im Artikel:** Das Titelbild eines Beitrags aus dem CMS erscheint bisher nur als Vorschaubild beim Teilen in sozialen Medien (`og:image`), nicht im Artikel selbst. Zu entscheiden ist, wo es im Artikel stehen soll. Vorschlag: unter dem Anrisstext, so wie in der Vorschau der Redaktionsoberfläche. Die technische Umsetzung folgt danach, siehe [`OFFENE-PUNKTE.md`](./OFFENE-PUNKTE.md#titelbild-im-artikel-anzeigen).
