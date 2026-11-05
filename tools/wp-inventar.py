#!/usr/bin/env python3
"""
WordPress-Inventar für die Migration der alten Seite stoppramstein.de

Einmaliges Migrationswerkzeug, nicht Teil des Build-Prozesses. Liest einen
MySQL-Dump der alten WordPress-Seite (z. B. ein WPvivid-Backup) und schreibt
eine Inventarliste aller veröffentlichten Inhalte und der von ihnen
verwendeten Medien. Grundlage für die Freigabeliste (docs/MIGRATION-ALTDATEN.md)
und die Weiterleitungstabelle (guidelines.md §17.8).

Datenschutz: Das Skript liest nur die Tabellen und Spalten der Positivliste
(ALLOWED_COLUMNS). Nutzer, Kommentare, Newsletter-Abonnenten, Spender,
Formulareinträge und Unterschriften werden nie ausgelesen. Von den
Unterschriften wird nur die Anzahl je Petition gezählt. Die Ausgabe enthält
keine personenbezogenen Daten.

Sicherheit: Der Dump gilt als nicht vertrauenswürdig (Altbestand eines
kompromittierten Hostings). Er wird nur als Text geparst, nie ausgeführt oder
in eine Datenbank importiert.

Verwendung (nur Standardbibliothek):
    python3 -I tools/wp-inventar.py \\
        --dump   <Ordner mit *.sql des aktuellen Backups> \\
        --ref    <SQL-Datei eines älteren Backups, optional> \\
        --uploads <uploads.tsv: Größe, Datum, Pfad je Zeile> \\
        --out    docs/migration
"""

import argparse
import csv
import hashlib
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

# --- Positivliste ---------------------------------------------------------

ALLOWED_COLUMNS = {
    'posts': {'ID', 'post_date', 'post_content', 'post_title', 'post_excerpt', 'post_status',
              'post_name', 'post_modified', 'post_parent', 'post_type', 'post_mime_type'},
    'postmeta': {'post_id', 'meta_key', 'meta_value'},
    'terms': {'term_id', 'name', 'slug'},
    'term_taxonomy': {'term_taxonomy_id', 'term_id', 'taxonomy', 'parent'},
    'term_relationships': {'object_id', 'term_taxonomy_id'},
    'options': {'option_name', 'option_value'},
    'rank_math_redirections': {'id', 'sources', 'url_to', 'header_code', 'status'},
    'dk_speakout_petitions': {'id', 'title', 'created_date'},
    # Nur zählen: Petitions-ID und Bestätigungsstatus, keine Angaben zu den Unterzeichnenden
    'dk_speakout_signatures': {'petitions_id', 'is_confirmed'},
}

META_KEYS = {
    '_wp_attached_file', '_wp_attachment_image_alt', '_thumbnail_id',
    '_EventStartDate', '_EventEndDate', '_EventVenueID',
    '_VenueAddress', '_VenueCity', '_VenueZip',
    '_elementor_data', 'rank_math_title', 'rank_math_description',
    '_menu_item_object_id', '_menu_item_type', '_menu_item_url',
}

OPTION_NAMES = {'home', 'siteurl', 'permalink_structure', 'category_base', 'tag_base',
                'page_on_front', 'show_on_front', 'tribe_events_calendar_options'}

CONTENT_TYPES = ['page', 'post', 'tribe_events', 'tribe_venue', 'tribe_organizer']

# Stichtag: erstes Indiz der Kompromittierung war am 2026-08-06
COMPROMISE_CUTOFF = '2026-08-01'

SUSPICIOUS = [
    ('script', re.compile(r'<script', re.I)),
    ('iframe', re.compile(r'<iframe', re.I)),
    ('javascript:', re.compile(r'javascript:', re.I)),
    ('Event-Handler', re.compile(r'<[^>]+\son[a-z]+\s*=', re.I)),
    ('base64', re.compile(r'base64', re.I)),
    ('versteckt', re.compile(r'display\s*:\s*none|visibility\s*:\s*hidden', re.I)),
    ('eval', re.compile(r'\beval\s*\(', re.I)),
]

UPLOAD_REF = re.compile(r'wp-content/uploads/(\d{4}/\d{2}/[^"\'\s()<>?#\\]+)')
SIZE_SUFFIX = re.compile(r'-(\d+x\d+|scaled|rotated)(?=\.[A-Za-z0-9]+$)')
WP_IMAGE_CLASS = re.compile(r'wp-image-(\d+)')
SHORTCODE = re.compile(r'\[([a-z][a-z0-9_-]+)[\s\]]')
LINK = re.compile(r'href=\\?["\'](https?://[^"\'\\]+)', re.I)
TAG = re.compile(r'<[^>]+>')

# --- SQL-Dump parsen --------------------------------------------------------

INSERT = re.compile(r'^INSERT INTO `([^`]+)` VALUES \(')
CREATE = re.compile(r'^CREATE TABLE `([^`]+)`')
COLUMN = re.compile(r'^\s+`([^`]+)`')

ESCAPES = {'0': '\0', 'n': '\n', 'r': '\r', 't': '\t', 'Z': '\x1a', 'b': '\b'}


def parse_values(s, start):
    """Parst eine Zeile `(...)` ab Position start. Gibt eine Werteliste zurück."""
    values, i, n = [], start, len(s)
    while i < n:
        c = s[i]
        if c == "'":
            i += 1
            buf = []
            while i < n:
                c = s[i]
                if c == '\\' and i + 1 < n:
                    buf.append(ESCAPES.get(s[i + 1], s[i + 1]))
                    i += 2
                elif c == "'":
                    if i + 1 < n and s[i + 1] == "'":
                        buf.append("'")
                        i += 2
                    else:
                        i += 1
                        break
                else:
                    buf.append(c)
                    i += 1
            values.append(''.join(buf))
        elif c in ', \t':
            i += 1
        elif c == ')':
            return values
        else:
            j = i
            while j < n and s[j] not in ',)':
                j += 1
            token = s[i:j].strip()
            values.append(None if token == 'NULL' else token)
            i = j
    raise ValueError('Datensatz nicht abgeschlossen')


def detect_prefix(paths):
    """Tabellenpräfix: der kürzeste, zu dem es <prefix>posts und <prefix>postmeta gibt."""
    names = set()
    for path in paths:
        with open(path, encoding='utf-8', errors='replace') as fh:
            for line in fh:
                m = CREATE.match(line)
                if m:
                    names.add(m.group(1))
    candidates = [n[:-len('posts')] for n in names
                  if n.endswith('posts') and n[:-len('posts')] + 'postmeta' in names]
    return min(candidates, key=len) if candidates else None


def read_dump(paths, prefix=None):
    """Liest die Tabellen der Positivliste. Gibt (prefix, tables, insert_counts) zurück."""
    if prefix is None:
        prefix = detect_prefix(paths)
    columns, tables, counts, errors = {}, defaultdict(list), Counter(), Counter()
    current = None
    for path in paths:
        with open(path, encoding='utf-8', errors='replace') as fh:
            for line in fh:
                m = CREATE.match(line)
                if m:
                    current = m.group(1)
                    columns[current] = []
                    continue
                if current and line.startswith(')'):
                    current = None
                    continue
                if current:
                    cm = COLUMN.match(line)
                    if cm:
                        columns[current].append(cm.group(1))
                    continue
                m = INSERT.match(line)
                if not m or prefix is None:
                    continue
                table = m.group(1)
                if not table.startswith(prefix):
                    continue
                short = table[len(prefix):]
                allowed = ALLOWED_COLUMNS.get(short)
                if allowed is None:
                    continue  # Tabelle nicht auf der Positivliste: nicht lesen
                counts[short] += 1
                try:
                    values = parse_values(line, m.end())
                except ValueError:
                    errors[short] += 1
                    continue
                cols = columns.get(table, [])
                if len(values) != len(cols):
                    errors[short] += 1
                    continue
                row = {c: v for c, v in zip(cols, values) if c in allowed}
                if short == 'postmeta' and row.get('meta_key') not in META_KEYS:
                    continue
                if short == 'options' and row.get('option_name') not in OPTION_NAMES:
                    continue
                tables[short].append(row)
    return prefix, tables, counts, errors


# --- Auswertung ---------------------------------------------------------------

def php_serialized_value(blob, key):
    m = re.search(r's:\d+:"%s";s:\d+:"([^"]*)"' % re.escape(key), blob or '')
    return m.group(1) if m else None


def elementor_text(raw):
    """Sammelt Textinhalte aus _elementor_data (JSON)."""
    try:
        data = json.loads(raw)
    except (TypeError, ValueError):
        return ''
    parts = []

    def walk(node):
        if isinstance(node, dict):
            settings = node.get('settings')
            if isinstance(settings, dict):
                for k in ('title', 'editor', 'text', 'description', 'description_text', 'html'):
                    v = settings.get(k)
                    if isinstance(v, str):
                        parts.append(v)
            for v in node.values():
                if isinstance(v, (list, dict)):
                    walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)

    walk(data)
    return '\n'.join(parts)


def original_path(rel):
    rel = rel.replace('\\/', '/')
    return SIZE_SUFFIX.sub('', rel)


def word_count(html):
    text = TAG.sub(' ', html or '')
    text = re.sub(r'\[[^\]]+\]', ' ', text)
    return len(re.findall(r'\w+', text))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--dump', required=True, type=Path)
    ap.add_argument('--ref', type=Path)
    ap.add_argument('--uploads', type=Path)
    ap.add_argument('--out', required=True, type=Path)
    args = ap.parse_args()

    dump_files = sorted(args.dump.glob('*.sql')) if args.dump.is_dir() else [args.dump]
    prefix, t, counts, errors = read_dump(dump_files)
    if prefix is None:
        sys.exit('Keine posts-Tabelle im Dump gefunden.')

    posts = {int(p['ID']): p for p in t['posts']}
    meta = defaultdict(dict)
    for row in t['postmeta']:
        meta[int(row['post_id'])][row['meta_key']] = row['meta_value'] or ''
    options = {o['option_name']: o['option_value'] or '' for o in t['options']}

    # Permalinks
    structure = options.get('permalink_structure', '/%postname%/') or '/?p=%post_id%'
    tec = options.get('tribe_events_calendar_options', '')
    event_slug = php_serialized_value(tec, 'singleEventSlug') or 'event'
    category_base = options.get('category_base') or 'category'
    tag_base = options.get('tag_base') or 'tag'
    front_page = int(options.get('page_on_front') or 0) if options.get('show_on_front') == 'page' else 0

    # Taxonomien
    terms = {int(x['term_id']): x for x in t['terms']}
    taxonomy = {int(x['term_taxonomy_id']): x for x in t['term_taxonomy']}
    post_terms = defaultdict(lambda: defaultdict(list))
    for rel in t['term_relationships']:
        tt = taxonomy.get(int(rel['term_taxonomy_id']))
        if not tt:
            continue
        term = terms.get(int(tt['term_id']))
        if term:
            post_terms[int(rel['object_id'])][tt['taxonomy']].append(term['name'])

    # Menü
    in_menu = set()
    for pid, p in posts.items():
        if p['post_type'] == 'nav_menu_item' and p['post_status'] == 'publish':
            obj = meta[pid].get('_menu_item_object_id')
            if obj and obj.isdigit() and meta[pid].get('_menu_item_type') == 'post_type':
                in_menu.add(int(obj))

    # Anhänge
    attachments = {}
    by_file = {}
    for pid, p in posts.items():
        if p['post_type'] == 'attachment':
            f = meta[pid].get('_wp_attached_file', '')
            attachments[pid] = {'file': f, 'mime': p['post_mime_type'] or '',
                                'alt': bool(meta[pid].get('_wp_attachment_image_alt', '').strip())}
            if f:
                by_file[original_path(f)] = pid

    def page_path(p):
        parts, seen, cur = [], set(), p
        while cur and int(cur['ID']) not in seen:
            seen.add(int(cur['ID']))
            parts.append(cur['post_name'])
            parent = int(cur['post_parent'] or 0)
            cur = posts.get(parent) if parent else None
        return '/' + '/'.join(reversed(parts)) + '/'

    def old_url(p):
        typ, slug = p['post_type'], p['post_name']
        if typ == 'page':
            return '/' if int(p['ID']) == front_page else page_path(p)
        if typ == 'post':
            date = p['post_date'] or ''
            cats = post_terms[int(p['ID'])].get('category', [])
            url = (structure.replace('%postname%', slug)
                   .replace('%post_id%', p['ID'])
                   .replace('%year%', date[0:4]).replace('%monthnum%', date[5:7]).replace('%day%', date[8:10])
                   .replace('%category%', cats[0].lower() if cats else 'allgemein'))
            return url if url.endswith('/') or '?' in url else url + '/'
        if typ == 'tribe_events':
            return f'/{event_slug}/{slug}/'
        if typ == 'tribe_venue':
            return f'/venue/{slug}/'
        if typ == 'tribe_organizer':
            return f'/organizer/{slug}/'
        return ''

    # Referenzstand (älteres Backup) für den Sicherheitsabgleich
    ref_posts = {}
    if args.ref and args.ref.exists():
        _, rt, _, _ = read_dump([args.ref], prefix)
        ref_posts = {int(p['ID']): p for p in rt['posts']}

    # Uploads-Liste (Größe, Datum, Pfad)
    upload_sizes = {}
    if args.uploads and args.uploads.exists():
        with open(args.uploads, encoding='utf-8') as fh:
            for line in fh:
                parts = line.rstrip('\n').split('\t')
                if len(parts) == 3 and '/uploads/' in parts[2]:
                    upload_sizes[parts[2].split('/uploads/', 1)[1]] = int(parts[0])

    # Inventar
    rows, media_use = [], defaultdict(set)
    domains = Counter()
    suspicious_items = []
    type_counts = Counter((p['post_type'], p['post_status']) for p in posts.values())

    for pid, p in sorted(posts.items(), key=lambda kv: (kv[1]['post_type'], kv[1]['post_date'] or '')):
        if p['post_type'] not in CONTENT_TYPES or p['post_status'] != 'publish':
            continue
        m = meta[pid]
        content = p['post_content'] or ''
        el_raw = m.get('_elementor_data', '')
        el_text = elementor_text(el_raw) if el_raw else ''
        combined = content + '\n' + el_raw.replace('\\/', '/')

        refs = set()
        for rel in UPLOAD_REF.findall(combined):
            refs.add(original_path(rel))
        for aid in WP_IMAGE_CLASS.findall(combined):
            a = attachments.get(int(aid))
            if a and a['file']:
                refs.add(original_path(a['file']))
        thumb = m.get('_thumbnail_id', '')
        if thumb.isdigit() and int(thumb) in attachments and attachments[int(thumb)]['file']:
            refs.add(original_path(attachments[int(thumb)]['file']))
        for r in refs:
            media_use[r].add(pid)

        for url in LINK.findall(combined):
            host = re.sub(r'^www\.', '', url.split('/')[2].lower())
            domains[host] += 1

        flags = [name for name, rx in SUSPICIOUS if rx.search(combined)]
        shortcodes = sorted(set(SHORTCODE.findall(content)) - {'caption'})
        notes = list(flags)
        if flags:
            suspicious_items.append((pid, p['post_type'], p['post_name'], flags))
        if el_raw:
            notes.append('Elementor')
        if shortcodes:
            notes.append('Shortcodes: ' + ' '.join(shortcodes))
        if re.search(r'youtube\.com|youtu\.be', combined, re.I):
            notes.append('YouTube')
        modified = p['post_modified'] or ''
        if (p['post_date'] or '') >= COMPROMISE_CUTOFF:
            notes.append('neu nach ' + COMPROMISE_CUTOFF)
        elif modified >= COMPROMISE_CUTOFF:
            notes.append('geändert nach ' + COMPROMISE_CUTOFF)
        if ref_posts:
            ref = ref_posts.get(pid)
            if ref is None:
                notes.append('fehlt im Referenzstand')
            elif hashlib.sha256((ref['post_content'] or '').encode()).digest() != \
                    hashlib.sha256(content.encode()).digest():
                notes.append('Inhalt abweichend vom Referenzstand')

        desc = (m.get('rank_math_description') or p['post_excerpt'] or '').strip()
        desc = re.sub(r'\s+', ' ', desc)
        if not desc:
            notes.append('Description fehlt')
        elif len(desc) > 160:
            notes.append('Description > 160 Zeichen')

        extra = ''
        if p['post_type'] == 'tribe_events':
            extra = (m.get('_EventStartDate', '') + ' – ' + m.get('_EventEndDate', '')).strip(' –')
            venue = posts.get(int(m.get('_EventVenueID') or 0))
            if venue:
                extra += ' | ' + (venue['post_title'] or '')

        terms_of = post_terms[pid]
        rows.append({
            'id': pid,
            'typ': p['post_type'],
            'slug': p['post_name'],
            'titel': p['post_title'],
            'datum': (p['post_date'] or '')[:10],
            'geaendert': modified[:10],
            'alte_url': old_url(p),
            'woerter': word_count(content) + word_count(el_text),
            'kategorien': '; '.join(terms_of.get('category', []) + terms_of.get('tribe_events_cat', [])),
            'schlagwoerter': '; '.join(terms_of.get('post_tag', [])),
            'termin': extra,
            'medien': len(refs),
            'im_menue': 'ja' if pid in in_menu else '',
            'description': desc,
            'auffaelligkeiten': '; '.join(notes),
        })

    # Archive (Kategorien, Schlagwörter)
    for tt in taxonomy.values():
        term = terms.get(int(tt['term_id']))
        if not term:
            continue
        tax = tt['taxonomy']
        base = {'category': category_base, 'post_tag': tag_base,
                'tribe_events_cat': f'{event_slug}s/kategorie'}.get(tax)
        if base:
            rows.append({'id': '', 'typ': tax, 'slug': term['slug'], 'titel': term['name'],
                         'alte_url': f'/{base}/{term["slug"]}/'})

    # Petitionen (Titel, Datum, Anzahl der Unterschriften, keine Unterzeichnenden)
    signatures = Counter(s['petitions_id'] for s in t['dk_speakout_signatures'])
    confirmed = Counter(s['petitions_id'] for s in t['dk_speakout_signatures'] if s.get('is_confirmed') == '1')
    for pet in t['dk_speakout_petitions']:
        rows.append({'id': pet['id'], 'typ': 'petition', 'titel': pet['title'],
                     'datum': (pet['created_date'] or '')[:10],
                     'auffaelligkeiten': f"{signatures.get(pet['id'], 0)} Unterschriften, davon "
                                         f"{confirmed.get(pet['id'], 0)} bestätigt (Stand des Backups)"})

    args.out.mkdir(parents=True, exist_ok=True)
    fields = ['id', 'typ', 'slug', 'titel', 'datum', 'geaendert', 'alte_url', 'woerter', 'kategorien',
              'schlagwoerter', 'termin', 'medien', 'im_menue', 'description', 'auffaelligkeiten']
    with open(args.out / 'inventar.csv', 'w', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, '') for k in fields})

    # Medien: alle von veröffentlichten Inhalten verwendeten Dateien plus alle PDFs
    media_paths = set(media_use)
    media_paths |= {original_path(a['file']) for a in attachments.values()
                    if a['file'].lower().endswith('.pdf')}
    with open(args.out / 'medien.csv', 'w', newline='', encoding='utf-8') as fh:
        w = csv.writer(fh)
        w.writerow(['pfad', 'groesse_kb', 'typ', 'alt_text', 'verwendet_von', 'auf_server', 'kategorie', 'entscheidung'])
        for path in sorted(media_paths):
            aid = by_file.get(path)
            a = attachments.get(aid, {})
            ext = path.rsplit('.', 1)[-1].lower()
            kind = 'Dokument' if ext == 'pdf' else ('Bild' if ext in ('jpg', 'jpeg', 'png', 'gif', 'webp', 'avif') else ext)
            size = upload_sizes.get(path)
            w.writerow([path, round(size / 1024) if size else '', kind,
                        ('ja' if a.get('alt') else 'nein') if kind == 'Bild' else '',
                        ' '.join(str(i) for i in sorted(media_use.get(path, []))),
                        'ja' if size is not None else 'nein',
                        'Sichtprüfung offen' if kind == 'Bild' else '', ''])

    # Vorhandene Weiterleitungen aus Rank Math. Der 404-Log von Rank Math wird nicht gelesen:
    # Er enthält IP-Adressen und bestand im Backup nur aus Scanner-Zugriffen.
    with open(args.out / 'altdaten-weiterleitungen.csv', 'w', newline='', encoding='utf-8') as fh:
        w = csv.writer(fh)
        w.writerow(['quelle', 'pfad_alt', 'ziel_alt', 'code'])
        for r in t['rank_math_redirections']:
            for pattern in re.findall(r's:7:"pattern";s:\d+:"([^"]*)"', r['sources'] or ''):
                w.writerow(['Rank Math (' + (r['status'] or '') + ')', pattern, r['url_to'], r['header_code']])

    # Zusammenfassung auf stdout
    print(f'Präfix: {prefix}  Dateien: {len(dump_files)}')
    print('Gelesene INSERT-Zeilen:', dict(counts), ' Parserfehler:', dict(errors) or 'keine')
    print('Permalinks:', structure, '| Termin-Slug:', event_slug, '| Startseite-ID:', front_page)
    print('Beitragstypen (veröffentlicht):')
    for (typ, status), n in sorted(type_counts.items()):
        if status == 'publish':
            print(f'  {typ}: {n}')
    print('Inventarzeilen:', len(rows), ' Medien:', len(media_paths),
          ' davon nicht auf dem Server:', sum(1 for p in media_paths if p not in upload_sizes))
    print('Referenzstand:', f'{len(ref_posts)} Datensätze' if ref_posts else 'nicht verwendet')
    print('Auffällige Inhalte:', len(suspicious_items))
    for pid, typ, slug, flags in suspicious_items:
        print(f'  {pid} {typ} {slug}: {", ".join(flags)}')
    print('Häufigste externe Domains:')
    for host, n in domains.most_common(40):
        print(f'  {n:4d} {host}')


if __name__ == '__main__':
    main()
