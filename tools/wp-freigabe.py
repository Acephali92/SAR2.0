#!/usr/bin/env python3
"""
Freigabeliste für die Migration der alten WordPress-Seite

Einmaliges Migrationswerkzeug, nicht Teil des Build-Prozesses. Liest
docs/migration/inventar.csv und docs/migration/medien.csv (erzeugt von
tools/wp-inventar.py) und schreibt:

- docs/migration/freigabe.csv: eine Zeile je alter URL mit Vorschlag,
  neuer URL und einer leeren Spalte „entscheidung“ für die Freigabe
- docs/MIGRATION-ALTDATEN.md: lesbare Übersicht mit Regeln und allen
  Punkten, die eine Entscheidung brauchen

Die Regeln stehen in docs/MIGRATION-ALTDATEN.md, Abschnitt „Regeln“.
Seiten werden einzeln entschieden (PAGE_DECISIONS), Beiträge und Termine
nach Regeln (Entscheidung des Nutzers vom 2026-11-05: alle übernehmen).

Verwendung:
    python3 -I tools/wp-freigabe.py --dir docs/migration --doc docs/MIGRATION-ALTDATEN.md
"""

import argparse
import csv
import re
from collections import Counter, defaultdict
from pathlib import Path

UEBERNEHMEN = 'übernehmen'
ABGLEICH = 'abgleichen'
NICHT = 'nicht übernehmen'
REDAKTION = 'Redaktion entscheidet'

# Seiten: id -> (Vorschlag, neue URL, Begründung)
KERN = 'Kernseite gibt es schon; nur Unterschiede als Vorschlag übernehmen'
CAMP = 'Friedenscamp 2026 ist vorbei; Anmelde- und Mitfahrfunktionen gibt es nicht mehr. Texte bleiben im Altbestand als Vorlage für ein nächstes Camp'
GALERIE = 'Galerie mit Personenfotos (Entscheidung: keine Personenfotos)'
TECHNIK = 'Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion'
LOGISTIK = 'Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen'

PAGE_DECISIONS = {
    8192: (NICHT, '/', 'Alte Startseite; die neue Startseite ersetzt sie'),
    14: (ABGLEICH, '/mitmachen/aufruf/', KERN + '. Unterschrieben wird auf ramsteinschliessen.de'),
    22: (NICHT, '/mitmachen/aufruf/', 'Alte Petitionsseite (Rank-Math-Weiterleitung auf /aufruf/)'),
    29: (ABGLEICH, '/mitmachen/spenden/', KERN),
    32: (ABGLEICH, '/presse/', KERN),
    134: (ABGLEICH, '/kontakt/', KERN),
    239: (NICHT, '/kontakt/', 'Kontaktformular; Kontakt läuft über die Kontaktseite'),
    412: (ABGLEICH, '/ueber-uns/', KERN),
    8695: (ABGLEICH, '/fakten/', KERN),
    9107: (ABGLEICH, '/mitmachen/mitglied-werden/', KERN + '. Einzige Seite, die nach dem 2026-08-01 geändert wurde: Text besonders prüfen'),
    10680: (ABGLEICH, '/mitmachen/ehrenamt/', KERN),
    10330: (ABGLEICH, '/warum-ramstein/', KERN),
    121: (NICHT, '/mitmachen/', 'Leere Übersichtsseite; gleiche Adresse wie die neue Mitmachen-Seite'),
    26: (NICHT, '/impressum/', 'Neues Impressum gilt'),
    3024: (NICHT, '/datenschutz/', 'Alte Erklärung beschreibt Cookies und Plugins, die es nicht mehr gibt'),
    7935: (NICHT, '/datenschutz/', 'Cookie-Richtlinie; die neue Seite setzt keine Cookies'),
    103: (NICHT, '/analysen/', 'Leere Übersichtsseite'),
    2641: (NICHT, '/aktionen/', 'Leere Terminübersicht'),
    3097: (NICHT, '/analysen/', 'Chronik (automatisches Archiv)'),
    3023: (REDAKTION, '/mitmachen/', 'Newsletter-Anmeldung; ob es einen neuen Newsletter gibt, ist offen'),
    10783: (NICHT, '/mitmachen/', 'Technische Newsletter-Seite'),
    10784: (NICHT, '/mitmachen/', 'Technische Newsletter-Seite'),
    128: (REDAKTION, '/mitmachen/', 'Downloads: eigene Seite für Infomaterial nötig?'),
    9665: (REDAKTION, '/mitmachen/', 'Infomaterial (im Menü): eigene Seite für Infomaterial nötig?'),
    365: (REDAKTION, '/mitmachen/aufruf/', 'Englische Fassung des Aufrufs; Mehrsprachigkeit ist für Phase 2 vorgesehen (guidelines.md §19)'),
    3542: (REDAKTION, '/mitmachen/aufruf/', 'Französische Fassung des Aufrufs; Mehrsprachigkeit ist für Phase 2 vorgesehen'),
    5789: (UEBERNEHMEN, '/analysen/block-air-base-ramstein/', 'Aufruf zum zivilen Ungehorsam (2018) als Beitrag, damit er zitierbar bleibt; Unterzeichnung geschlossen'),
    11461: (UEBERNEHMEN, '/analysen/no-bases-network-2023/', 'Inhaltliche Seite zum No Bases Network 2023 als Beitrag'),
    1740: (REDAKTION, '/analysen/', 'Pressespiegel 2016: nur übernehmen, wenn er auf die Originalartikel verlinkt statt sie zu kopieren (Urheberrecht)'),
    708: (REDAKTION, '/mitmachen/ehrenamt/', 'Arbeitsgruppen: noch aktuell? Sonst Weiterleitung auf Ehrenamt'),
    720: (REDAKTION, '/mitmachen/ehrenamt/', 'Lokale Initiativen: noch aktuell? Sonst Weiterleitung auf Ehrenamt'),
    6503: (REDAKTION, '/mitmachen/ehrenamt/', 'Jobs (im Menü): noch aktuell?'),
}
for pid in (97, 12070, 12071, 12073, 12074, 12075, 12099, 12101, 12103):
    PAGE_DECISIONS[pid] = (NICHT, '/aktionen/', CAMP)
for pid in (1553, 12200, 12212, 12247, 12248, 12249, 12252, 12814):
    PAGE_DECISIONS[pid] = (NICHT, '/aktionen/', GALERIE)
for pid in (612, 681, 1059, 1196, 1232, 1256, 1260, 1262, 1299, 1411, 1437,
            1477, 1498, 1500, 1501, 1502, 1503, 1504, 1506, 1583):
    PAGE_DECISIONS[pid] = (NICHT, '/aktionen/', LOGISTIK)
for pid in (11661, 11662, 11663):
    PAGE_DECISIONS[pid] = (NICHT, '/mitmachen/spenden/', TECHNIK)
for pid in (1061, 1068, 1175, 3406, 3407, 3408, 3409, 4534, 4535, 4536, 4537,
            11654, 11655, 11656, 1332, 1333, 1334):
    PAGE_DECISIONS[pid] = (NICHT, '410', TECHNIK)

ANALYSE_CATEGORIES = re.compile(r'^(Fakten und Argumente|Redebeiträge \d{4}|Broschüren und Folien)$')
GENERIC_CATEGORIES = {'Aktuelles', 'Nachrichten', 'Home', 'Archiv', 'Termine'}

EVENT_TYPES = [
    ('friedenswoche', re.compile(r'friedenswoche|friedenscamp|aktionswoche|aktionstage|friedensfestival', re.I)),
    ('demonstration', re.compile(r'demo|kundgebung|menschenkette|blockade|mahnwache|protest', re.I)),
    ('konferenz', re.compile(r'konferenz|kongress|tagung|planungstreffen|meeting|treffen', re.I)),
    ('workshop', re.compile(r'workshop|werkstatt|seminar', re.I)),
]


def split(value):
    return [x.strip() for x in (value or '').split(';') if x.strip()]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', required=True, type=Path)
    ap.add_argument('--doc', required=True, type=Path)
    ap.add_argument('--stand', default='2026-09-23')
    args = ap.parse_args()

    rows = list(csv.DictReader(open(args.dir / 'inventar.csv', encoding='utf-8')))
    media = list(csv.DictReader(open(args.dir / 'medien.csv', encoding='utf-8')))

    out = []
    used_slugs = Counter()
    for r in rows:
        if r['typ'] == 'post':
            used_slugs[r['slug']] += 1
    for pid, (action, target, _) in PAGE_DECISIONS.items():
        if action == UEBERNEHMEN and target.startswith('/analysen/'):
            used_slugs[target.strip('/').split('/')[-1]] += 1

    missing_pages = []
    for r in rows:
        typ = r['typ']
        rec = {'id': r['id'], 'typ': typ, 'titel': r['titel'], 'datum': r['datum'], 'alte_url': r['alte_url'],
               'vorschlag': '', 'ziel': '', 'neue_url': '', 'kategorie_neu': '', 'hinweise': '', 'entscheidung': ''}
        notes = []
        if typ == 'page':
            dec = PAGE_DECISIONS.get(int(r['id']))
            if not dec:
                missing_pages.append(r['id'])
                dec = (REDAKTION, '', 'noch nicht eingeordnet')
            action, target, reason = dec
            rec['vorschlag'] = action
            rec['ziel'] = 'CMS beitraege' if action == UEBERNEHMEN else ('src/content (Abgleich)' if action == ABGLEICH else '')
            rec['neue_url'] = target
            notes.append(reason)
        elif typ == 'post':
            cats = split(r['kategorien'])
            kategorie = 'analyse' if any(ANALYSE_CATEGORIES.match(c) for c in cats) else 'nachricht'
            rec.update(vorschlag=UEBERNEHMEN, ziel='CMS beitraege', neue_url=f"/analysen/{r['slug']}/",
                       kategorie_neu=kategorie)
            if 'Videos' in cats or 'Songcontest' in r['kategorien']:
                notes.append('Video-Beitrag: Einbettung wird Link')
            if 'Künstler' in r['kategorien']:
                notes.append('Porträt: Text ja, Personenfotos nein')
            if used_slugs[r['slug']] > 1:
                notes.append('Slug doppelt: neue URL klären')
        elif typ == 'tribe_events':
            event_type = next((name for name, rx in EVENT_TYPES if rx.search(r['titel'] + ' ' + r['kategorien'])), 'sonstiges')
            rec.update(vorschlag=UEBERNEHMEN, ziel='CMS termine', neue_url=f"/aktionen/{r['slug']}/",
                       kategorie_neu=event_type)
            start = r['termin'][:10]
            rec['datum'] = start or r['datum']
            notes.append('abgeschlossen' if start and start < '2026-11-05' else 'kommend')
        elif typ in ('tribe_venue', 'tribe_organizer'):
            rec.update(vorschlag=NICHT, neue_url='/aktionen/', hinweise='Ort/Veranstalter geht in den Termin ein')
        elif typ in ('category', 'post_tag'):
            rec.update(vorschlag=NICHT, neue_url='/analysen/', hinweise='Archivseite; Kategorie bleibt als Schlagwort')
        elif typ == 'tribe_events_cat':
            rec.update(vorschlag=NICHT, neue_url='/aktionen/', hinweise='Archivseite der Termine')
        elif typ == 'petition':
            rec.update(vorschlag=NICHT, neue_url='/mitmachen/aufruf/',
                       hinweise='Unterschriften werden nicht übernommen. ' + r['auffaelligkeiten'])
        flags = [f for f in split(r['auffaelligkeiten'])
                 if f in ('script', 'iframe', 'javascript:', 'Event-Handler', 'base64', 'versteckt', 'eval')
                 or f.startswith('geändert nach') or f.startswith('neu nach')]
        if flags:
            notes.append('Prüfen: ' + ', '.join(flags))
        if typ in ('post', 'tribe_events', 'page') and 'Description fehlt' in r['auffaelligkeiten'] \
                and rec['vorschlag'] == UEBERNEHMEN:
            notes.append('Description fehlt')
        if rec['hinweise']:
            notes.insert(0, rec['hinweise'])
        rec['hinweise'] = '; '.join(notes)
        out.append(rec)

    fields = ['id', 'typ', 'titel', 'datum', 'alte_url', 'vorschlag', 'ziel', 'neue_url', 'kategorie_neu',
              'hinweise', 'entscheidung']
    with open(args.dir / 'freigabe.csv', 'w', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=fields, lineterminator='\n')
        w.writeheader()
        w.writerows(out)

    # --- Übersicht ---------------------------------------------------------
    by = defaultdict(list)
    for rec in out:
        by[rec['typ']].append(rec)
    posts, events, pages = by['post'], by['tribe_events'], by['page']
    kat = Counter(p['kategorie_neu'] for p in posts)
    years = Counter(p['datum'][:4] for p in posts)
    ev_types = Counter(e['kategorie_neu'] for e in events)
    ev_years = Counter(e['datum'][:4] for e in events)
    page_actions = Counter(p['vorschlag'] for p in pages)
    no_desc = sum(1 for p in posts + events if 'Description fehlt' in p['hinweise'])
    dupes = [p for p in posts if 'Slug doppelt' in p['hinweise']]
    images = [m for m in media if m['typ'] == 'Bild']
    pdfs = [m for m in media if m['typ'] == 'Dokument']
    pdf_used = [m for m in pdfs if m['verwendet_von']]
    not_on_server = [m for m in media if m['auf_server'] == 'nein']
    img_no_alt = [m for m in images if m['alt_text'] == 'nein']

    def table(recs, cols, heads):
        lines = ['| ' + ' | '.join(heads) + ' |', '|' + '---|' * len(heads)]
        for rec in recs:
            cells = [str(rec.get(c, '')).replace('|', '/').replace('\n', ' ') for c in cols]
            cells = [f'`{c}`' if col in ('alte_url', 'neue_url') and c and c != '410' else c
                     for col, c in zip(cols, cells)]
            lines.append('| ' + ' | '.join(cells) + ' |')
        return '\n'.join(lines)

    order = [REDAKTION, UEBERNEHMEN, ABGLEICH, NICHT]
    pages_sorted = sorted(pages, key=lambda p: (order.index(p['vorschlag']), p['alte_url']))

    doc = f"""# Migration der alten WordPress-Seite: Freigabeliste

Diese Liste legt fest, welche Inhalte der alten Seite www.stoppramstein.de in die neue Seite übernommen werden, wohin, und wohin jede alte Adresse weiterleitet (`guidelines.md` §17.8). **Erst nach der Freigabe wird importiert.**

- **Datenstand:** Datenbank-Backup der alten Seite vom {args.stand}
- **Erzeugt mit:** `tools/wp-inventar.py` und `tools/wp-freigabe.py`, Ablauf in `docs/ARCHITEKTUR.md`, „Migrationswerkzeug“
- **Vollständige Liste:** [`migration/freigabe.csv`](./migration/freigabe.csv), eine Zeile je alter URL mit Vorschlag, neuer URL und einer leeren Spalte `entscheidung`. Grundlage: [`migration/inventar.csv`](./migration/inventar.csv) und [`migration/medien.csv`](./migration/medien.csv)

## So wird freigegeben

1. Diese Übersicht lesen, vor allem den Abschnitt „Zu entscheiden“.
2. In `freigabe.csv` die Spalte `entscheidung` nur dort ausfüllen, wo vom Vorschlag abgewichen wird (`ja`, `nein` oder eine andere Ziel-URL). Eine leere Zelle heißt: Vorschlag angenommen.
3. Punkte mit „Redaktion entscheidet“ brauchen eine Antwort, sonst gilt die Weiterleitung aus der Spalte `neue_url`.

## Überblick

| Bereich | Anzahl | Vorschlag |
|---|---|---|
| Beiträge | {len(posts)} | alle übernehmen nach `/analysen/<slug>/` (Entscheidung vom 2026-11-05): {kat['nachricht']} als `nachricht`, {kat['analyse']} als `analyse` |
| Termine | {len(events)} | alle übernehmen nach `/aktionen/<slug>/`, vergangene als „Abgeschlossen“ |
| Seiten | {len(pages)} | einzeln: {page_actions[ABGLEICH]} abgleichen, {page_actions[UEBERNEHMEN]} als Beitrag übernehmen, {page_actions[REDAKTION]} Redaktion entscheidet, {page_actions[NICHT]} nicht übernehmen (nur Weiterleitung) |
| Kategorien, Schlagwörter | {len(by['category']) + len(by['post_tag']) + len(by['tribe_events_cat'])} | keine eigenen Seiten, Weiterleitung auf die Rubrik, Kategorien bleiben als Schlagwörter |
| Veranstaltungsorte, Veranstalter | {len(by['tribe_venue']) + len(by['tribe_organizer'])} | gehen in die Termine ein |
| Petitionen | {len(by['petition'])} | Unterschriften werden nicht übernommen, Weiterleitung auf `/mitmachen/aufruf/` |
| Medien | {len(media)} | {len(images)} Bilder, {len(pdfs)} PDFs (davon {len(pdf_used)} verlinkt), siehe „Medien“ |

Beiträge nach Jahr: {', '.join(f'{y}: {n}' for y, n in sorted(years.items()))}.
Termine nach Jahr: {', '.join(f'{y}: {n}' for y, n in sorted(ev_years.items()))}.

## Regeln

| Alter Inhalt | Neu | Wie |
|---|---|---|
| Beiträge | CMS `beitraege` | Slug unverändert. Titel, Datum, Schlagwörter (WP-Schlagwörter und Kategorien außer {', '.join(sorted(GENERIC_CATEGORIES))}). Text über eine Positivliste bereinigt: Skripte, iFrames, Formulare und Stile entfallen, Einbettungen (YouTube, Karten) werden Links. Interne Links auf die neue Adresse umgeschrieben. Kein Autor (keine Nutzerkonten) |
| Kategorie | `analyse` / `nachricht` | `analyse` für „Fakten und Argumente“, „Redebeiträge …“, „Broschüren und Folien“; sonst `nachricht` |
| Termine | CMS `termine` | Beginn, Ende, Ort aus dem Veranstaltungsort. Typ nach Stichwörtern ({', '.join(f'{k}: {v}' for k, v in ev_types.most_common())}). Kein Anmeldelink auf den alten Ticketshop |
| Bilder | CMS `media` | Nur verwendete Bilder, nur das Original, ohne Personenfotos (Sichtprüfung vor dem Import, im Zweifel nicht). Metadaten (EXIF, GPS) entfernt |
| Eigene PDFs | CMS `media` | nur verlinkte PDFs, Metadaten entfernt; die alte Datei-URL leitet weiter |
| Fremde PDFs | — | nicht neu hosten (Urheberrecht), stattdessen Link zur Originalquelle |
| Kernseiten | `src/content/` | kein Überschreiben; Unterschiede kommen als Vorschlag in einen eigenen PR |
| Nie übernommen | — | Nutzerkonten, Kommentare, Newsletter-Abonnenten, Spenden, Formulareinträge, Anmeldungen, Mitfahrgelegenheiten, Unterschriften, Shop-Bestellungen |
| Technische Adressen | — | `/feed/`, `/wp-admin/`, `/wp-login.php`, `/xmlrpc.php`, `/wp-json/`: 410 |

## Zu entscheiden

### Seiten

{table(pages_sorted, ['vorschlag', 'alte_url', 'titel', 'neue_url', 'hinweise'], ['Vorschlag', 'Alte URL', 'Titel', 'Neu bzw. Weiterleitung', 'Begründung'])}

### Beiträge mit Hinweisen

Alle {len(posts)} Beiträge werden übernommen. Besonders zu beachten:

- **Video-Beiträge:** {sum(1 for p in posts if 'Video-Beitrag' in p['hinweise'])} Beiträge bestehen vor allem aus einem eingebetteten Video. Neu erscheint dort ein Link zum Video.
- **Porträts der Friedensbühne 2026:** {sum(1 for p in posts if 'Porträt' in p['hinweise'])} Beiträge stellen Künstler vor. Der Text wird übernommen, Fotos der Personen nicht.
- **Description fehlt:** bei {no_desc} Beiträgen und Terminen. Das CMS verlangt eine Description mit höchstens 160 Zeichen (`cms/src/collections/Beitraege.ts`). **Vorschlag (weicht vom Plan ab, dort: „nicht kürzen, Eintrag für die Redaktion“):** Beim Import wird sie aus dem Textanfang erzeugt, auf einen ganzen Satz bzw. ein ganzes Wort gekürzt und mit „…“ markiert, wenn gekürzt wurde. Eine Liste der erzeugten Descriptions kommt zur Durchsicht in den Import-PR. Für fast 800 Einträge ist das Nachtragen von Hand nicht realistisch.
- **Doppelte Slugs:** {len(dupes)}{(': ' + ', '.join(f"`{p['alte_url']}`" for p in dupes)) if dupes else ''}.

### Medien

- **Bilder:** {len(images)} verwendete Bilder, davon {len(img_no_alt)} ohne Alt-Text. Vor dem Import werden sie gesichtet: Bilder mit erkennbaren Personen entfallen. Das CMS verlangt einen Alt-Text (`cms/src/collections/Media.ts`). **Vorschlag:** Bei der Sichtung schreibe ich für jedes übernommene Bild einen sachlichen Alt-Text-Entwurf (was zu sehen ist, ohne Wertung). Die Liste kommt zur Durchsicht in den Import-PR. Rein dekorative Bilder werden nicht übernommen.
- **PDFs:** {len(pdfs)} PDFs auf der alten Seite, {len(pdf_used)} davon aus Inhalten verlinkt. Übernommen werden die verlinkten eigenen PDFs. Ob ein PDF eigen oder fremd ist, wird bei der Sichtung entschieden.
- **Fehlende Dateien:** {len(not_on_server)} Dateien werden in Inhalten verwendet, liegen aber nicht mehr auf dem Server. Die Verweise entfallen.

### Weitere Adressen

- **Alte Weiterleitungen (Rank Math):** `/unterstuetze-die-kampagne/` und `/werbematerial` werden übernommen, mit den neuen Zielen `/mitmachen/aufruf/` und `/mitmachen/`.
- **`/?p=<ID>`:** Kurzlinks der alten Seite leiten auf die neue Adresse desselben Inhalts (feste Tabelle).
- **`ramstein-kampagne.eu`:** Die Inhalte verlinken 272-mal auf diese ältere Domain. Wenn sie noch dem Verein gehört, sollte sie dauerhaft auf stoppramstein.de weiterleiten. **Zu klären: Gehört die Domain noch dem Verein?**
- **Ticketshop** (`ticket.stoppramstein.de`, `ticket.ramstein-kampagne.eu`): wird abgeschaltet und leitet auf `/aktionen/` weiter.

## Prüfung der Altdaten

Alle veröffentlichten Inhalte wurden auf eingeschleusten Code und Spam geprüft (Skripte, iFrames, Event-Handler, versteckte Elemente, Spam-Begriffe, unbekannte Domains). Gefunden wurden nur alte Einbettungen bekannter Dienste (YouTube, Google Maps, OpenStreetMap, Deutsche Bahn, Vidyard). Sie entfallen bei der Bereinigung ohnehin. Nach dem 2026-08-01 wurde laut Datenbank nur die Seite `/werde-mitglied-foerderverein/` geändert, sie wird beim Abgleich besonders geprüft.
"""
    args.doc.write_text(doc, encoding='utf-8')
    print(f'{len(out)} Zeilen in freigabe.csv; Seiten ohne Einordnung: {missing_pages or "keine"}')


if __name__ == '__main__':
    main()
