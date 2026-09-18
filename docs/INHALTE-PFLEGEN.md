# Inhalte pflegen

Es gibt zwei Wege, Inhalte zu pflegen, je nach Content-Typ:

- **Beiträge und Termine** (Nachrichten, Analysen, Veranstaltungen): über die **Redaktionsoberfläche** (Payload CMS), kein Git-/Code-Wissen nötig. Siehe Teil B unten.
- **Alles andere** (Warum-Ramstein-Argumente, Mitmachen-Seiten, rechtliche Seiten): weiterhin als Markdown-Datei per Pull Request. Siehe Teil A unten.

## Teil A: Markdown-Collections (warum-ramstein, mitmachen, seiten)

Anleitung für die Redaktion, um Inhalte über die Astro Content Collections zu pflegen. Es ist kein Code-Wissen nötig — nur Markdown (eine sehr einfache Textauszeichnung) und ein kurzer Frontmatter-Block am Anfang jeder Datei.

### Grundprinzip

Jede Content-Datei liegt als `.md`-Datei unter `src/content/<collection>/` und beginnt mit einem YAML-Frontmatter-Block. Das Schema pro Collection ist in `src/content.config.ts` festgelegt (Zod-Validierung) — **ein Build schlägt fehl**, wenn Pflichtfelder fehlen oder falsch typisiert sind. Das ist gewollt: fehlerhafte Inhalte gehen nicht live.

Nach jeder Änderung: `npm run verify` lokal laufen lassen (siehe README), bevor committet/deployt wird.

### Basis-Felder (alle Markdown-Collections)

```yaml
---
title: "Seitentitel"
description: "Meta-Beschreibung für SEO, max. 160 Zeichen"
publishedAt: 2026-01-30
updatedAt: 2026-02-01   # optional
draft: false            # optional, Standard: false
---
```

### Pflichtfelder pro Collection

#### `warum-ramstein/` — Kernargumente

| Feld | Pflicht | Werte |
|------|---------|-------|
| `category` | Ja | `drohnenkrieg`, `umwelt`, `voelkerrecht`, `deutschland` |
| `order` | Nein | Zahl, Standard `0` (manuelle Sortierung) |
| `sources` | Nein | Liste `{ label, url }` — siehe Beleg-Pflicht unten |

#### `mitmachen/` — Mitmach-Seiten

| Feld | Pflicht | Werte |
|------|---------|-------|
| `ctaType` | Ja | `spenden`, `mitgliedschaft`, `ehrenamt`, `petition` |
| `contactEmail` | Nein | Gültige E-Mail-Adresse |
| `order` | Nein | Zahl, Standard `0` |

#### `seiten/` — Statische Seiten (Impressum, Kontakt, …)

| Feld | Pflicht | Werte |
|------|---------|-------|
| `pageWidth` | Nein | `default`, `wide`, `narrow` — Standard `default` |
| `showInNav` | Nein | `true`/`false` — Standard `false` |

### Beleg-Pflicht für Fakten

Verbindlich laut `CLAUDE.md`: **Alle Fakten müssen belegt sein.** Keine Zahlen, Quellen oder Personen erfinden. Nutze bei `warum-ramstein`-Artikeln das `sources`-Feld:

```yaml
sources:
  - label: "Quellenname"
    url: "https://example.com/quelle"
```

Ist eine Aussage (noch) nicht belegbar, trage sie in [`REDAKTION-TODO.md`](./REDAKTION-TODO.md) ein, statt sie unbelegt zu veröffentlichen oder zu erfinden. Das gilt genauso für Beiträge/Termine im CMS (Teil B).

### Sprachstil: keine Gendersprache

Verbindlich laut `CLAUDE.md`: Keine Doppelpunkt-/Sternchen-/Unterstrich-Formen wie „Autor:in" oder „Leser*innen". Stattdessen ein passendes neutrales Kollektivum nutzen (z. B. „Redaktion" statt „Redakteur:innen") oder die generische Form (z. B. „Autor", „Nutzer"). Gilt für alle Texte — Markdown-Inhalte wie Beiträge im CMS.

### Neuen Inhalt anlegen

1. Neue `.md`-Datei im passenden Collection-Ordner anlegen, z. B. `src/content/warum-ramstein/neues-argument.md`.
2. Frontmatter gemäß Tabelle oben ausfüllen.
3. Markdown-Inhalt darunter schreiben.
4. `npm run verify` ausführen — bricht bei Schema-Fehlern mit klarer Meldung ab.
5. `npm run dev` zur Vorschau nutzen (`http://localhost:4321`).

**Beispiel:**

```yaml
---
title: "Artikeltitel"
description: "Max. 160 Zeichen für SEO"
publishedAt: 2026-01-15
category: drohnenkrieg
order: 5
sources:
  - label: "Quellenname"
    url: "https://example.com/quelle"
---

Markdown-Inhalt hier...
```

### Read-Only-Ordner

`stoppramstein_content/` enthält migrierte WordPress-Inhalte als Referenz. **Nicht verändern** — nur als Quelle für neue, ordentlich geprüfte Inhalte in `src/content/` verwenden.

## Teil B: Beiträge und Termine über die Redaktionsoberfläche pflegen

Nachrichten, Analysen und Termine werden **nicht** mehr als Markdown-Datei gepflegt, sondern über die Payload-Redaktionsoberfläche — kein Git, kein Code, keine Pull Requests nötig.

### Anmelden

1. `https://redaktion.stoppramstein.de` aufrufen.
2. Mit E-Mail-Adresse und Passwort anmelden (Zugang von Admin einrichten lassen). Passwort vergessen? "Passwort zurücksetzen" auf der Login-Seite nutzen.

### Die Übersicht nach dem Anmelden

Direkt nach dem Login steht oben auf der Startseite die **Redaktions-Übersicht** mit vier Listen:

| Liste | Zeigt |
|---|---|
| Offene Entwürfe | Alles im Status „Entwurf" |
| Warten auf Freigabe | Alles im Status „Zur Freigabe" |
| Geplante Veröffentlichungen | Alles mit einem Termin in „Geplante Veröffentlichung", der noch bevorsteht |
| Anstehende Termine | Veranstaltungen ab heute, ohne abgesagte |

Jede Zeile führt per Klick direkt in das jeweilige Dokument. Mit der Rolle Autor erscheinen nur die eigenen Beiträge und Termine, mit Redaktion und Admin alle. Leere Listen sind normal und kein Fehler.

### Rollen

Jede angemeldete Person hat genau eine Rolle. Die Rolle bestimmt, was sie in der Redaktionsoberfläche sehen und tun darf:

| Rolle | Darf |
|-------|------|
| **Autor** | Eigene Beiträge/Termine anlegen, bearbeiten und zur Freigabe einreichen. Sieht nur die eigenen Entwürfe, keine fremden. |
| **Redaktion** | Alles, was Autor darf, plus: alle Beiträge/Termine aller Personen einsehen, freigeben, veröffentlichen und wieder zurückziehen. |
| **Admin** | Alles, was Redaktion darf, plus: Nutzer anlegen, Rollen vergeben und ändern. |

Wer welche Rolle bekommt, entscheidet Admin bei der Einrichtung des Zugangs — bei Fragen dazu einfach melden.

### Einen Beitrag anlegen

1. In der Admin-UI: **Beiträge → Erstellen**.
2. Titel, Beschreibung (max. 160 Zeichen — das ist der kurze Anreißertext, der z. B. in der Google-Suche oder beim Teilen in sozialen Medien angezeigt wird) und Kategorie (Nachricht oder Analyse) ausfüllen.
3. Inhalt im Rich-Text-Editor schreiben. Über die Werkzeugleiste stehen Überschriften, Listen, Links, Zitate und Bilder zur Verfügung — ähnlich wie in einem gewöhnlichen Textverarbeitungsprogramm, kein Markdown oder Code nötig.
4. **Quellen** für alle Fakten und Zahlen im Feld „Quellen" eintragen (siehe Beleg-Pflicht oben — gilt hier genauso). Zum Beispiel:

   | Bezeichnung | URL |
   |---|---|
   | Statistisches Bundesamt, Bevölkerungsbericht 2026 | `https://www.destatis.de/beispiel-quelle` |

   Eine gute Quellenangabe nennt die Institution/den Urheber und führt direkt zur Originalquelle — nicht nur zu einem Zeitungsartikel, der die Zahl nur zitiert.
5. Optional: **Verknüpfter Termin** setzen, wenn sich der Beitrag auf eine konkrete Veranstaltung bezieht (z. B. eine Ankündigung zur Friedenswoche). Der Termin zeigt dann automatisch einen Rückverweis auf diesen Beitrag — das musst du beim Termin nicht zusätzlich eintragen.
6. Bild hochladen: Der **Alt-Text ist Pflicht**. Er beschreibt kurz, was auf dem Bild zu sehen ist, wird von Screenreadern vorgelesen (damit blinde und sehbehinderte Menschen die Website nutzen können) und angezeigt, falls das Bild nicht lädt. Beispiel: „Demonstrierende mit Transparenten vor dem Haupttor der Air Base Ramstein."
7. Speichern. Der Status steht danach auf **Entwurf** — noch nichts davon ist öffentlich sichtbar, du kannst in Ruhe weiterschreiben oder später zurückkommen.

### Einen Termin anlegen

Läuft genauso ab, unter **Termine → Erstellen**: Titel, Beschreibung, Art der Veranstaltung, Beginn/Ende, Ort und optional ein Anmeldelink. Der Abschnitt „Zugehörige Beiträge" füllt sich von selbst, sobald ein Beitrag auf diesen Termin verweist (siehe Schritt 5 oben) — hier ist nichts weiter zu tun.

### Freigabe und Veröffentlichung

Jeder Beitrag und jeder Termin durchläuft drei Stufen. Dieses Vier-Augen-Prinzip stellt sicher, dass niemand versehentlich einen unfertigen oder fehlerhaften Text live schaltet:

1. **Entwurf** — Autor schreibt und bearbeitet in Ruhe, jederzeit änderbar, nur für die eigene Person sichtbar.
2. **Zur Freigabe** — Autor reicht den fertigen Entwurf ein (Status im rechten Seitenmenü auf „Zur Freigabe" umstellen). Ab diesem Punkt kann nur noch Redaktion oder Admin etwas ändern — so wird verhindert, dass sich Text und Freigabe-Entscheidung auseinanderentwickeln.
3. **Veröffentlicht** — Redaktion oder Admin prüft den Inhalt (Fakten, Quellen, Rechtschreibung) und schaltet frei. Ab jetzt ist der Beitrag öffentlich auf der Website sichtbar.

Redaktion kann einen eingereichten Entwurf jederzeit zurück auf „Entwurf" setzen, zum Beispiel mit einem Korrekturwunsch, oder einen bereits veröffentlichten Beitrag wieder zurückziehen (z. B. wenn sich nachträglich ein Fehler zeigt).

### Vorschau vor dem Veröffentlichen

In jedem Beitrag und Termin gibt es oben rechts den Knopf **Vorschau** (Symbol „Link nach außen"). Er öffnet in einem neuen Tab eine Ansicht, die Titel, Anrisstext, Bild mit Alt-Text, Kategorie bzw. Art der Veranstaltung, den fertig gesetzten Text, die Quellen und die verknüpften Beiträge/Termine so zeigt, wie sie auf der Website ungefähr wirken. Oben steht ein gelber Hinweis „Vorschau — nicht öffentlich" samt aktuellem Status.

Wichtig zu wissen:

- Die Vorschau läuft **ausschließlich innerhalb der Redaktionsoberfläche** und verlangt eine Anmeldung. Es gibt keine Vorschau-Adresse, die sich an Außenstehende weitergeben ließe — wer den Link ohne Anmeldung öffnet, bekommt nur eine Fehlerseite.
- Sie zeigt auch **unveröffentlichte Entwürfe**, inklusive der zuletzt automatisch gespeicherten Änderungen.
- Sie bildet Schrift und Abstände der Website nach, ist aber **keine pixelgenaue Kopie** — Kopf- und Fußzeile der Website fehlen bewusst.
- Mit der Rolle Autor lassen sich nur eigene Dokumente vorschauen, mit Redaktion und Admin alle.

### Ältere Fassungen wiederherstellen

Das System speichert automatisch frühere Fassungen (Reiter **Versionen** im Dokument). Wer welche zurückholen darf:

| Rolle | Darf wiederherstellen |
|-------|----------------------|
| **Autor** | Nur eigene Dokumente, und nur solange sie **nicht veröffentlicht** sind. Fremde Dokumente sind weder sichtbar noch wiederherstellbar. |
| **Redaktion / Admin** | Jede Fassung jedes Beitrags und Termins, auch bei veröffentlichten Inhalten. |

„Wiederherstellen" überschreibt den aktuellen Stand mit der gewählten älteren Fassung — der bisherige Stand geht dabei nicht verloren, sondern wird selbst wieder als Version abgelegt. Der Freigabestatus ändert sich nicht heimlich mit: Ein veröffentlichter Beitrag bleibt veröffentlicht, und die Website wird nur dann neu gebaut, wenn sich der Status tatsächlich auf oder von „Veröffentlicht" ändert.

Versucht man als Autor, eine veröffentlichte Fassung zurückzusetzen, erscheint ein deutscher Hinweis mit der Bitte, die Redaktion anzusprechen.

### Zeitgesteuerte Veröffentlichung

Manchmal soll ein Beitrag erst zu einem bestimmten Zeitpunkt live gehen, z. B. am Morgen einer Aktion. Dafür im Feld **Geplante Veröffentlichung** (rechte Seitenleiste) ein Datum und eine Uhrzeit eintragen, während der Status auf „Zur Freigabe" steht. Das System prüft danach alle paar Minuten automatisch, ob der Zeitpunkt erreicht ist, und veröffentlicht den Beitrag dann von selbst — eine vorherige Freigabe durch Redaktion bleibt trotzdem Voraussetzung. Ein Entwurf, der nie freigegeben wurde, geht also auch dann nicht automatisch live, wenn die geplante Zeit verstreicht.

### Was passiert nach dem Veröffentlichen?

Nichts, was du selbst noch tun musst — die Website baut sich **automatisch neu** und zeigt die Änderung binnen weniger Minuten. Kein manueller Build, kein Deploy, kein Git nötig. Ein Blick auf die Live-Seite nach ein paar Minuten genügt, um zu prüfen, dass alles wie gewünscht aussieht.

### Häufige Fragen

**Wie lange dauert es, bis meine Änderung online ist?**
In der Regel wenige Minuten nach der Veröffentlichung. Bei einer zeitgesteuerten Veröffentlichung kann es zusätzlich bis zu rund fünf bis zehn Minuten nach dem geplanten Zeitpunkt dauern, da das System nur in diesem Abstand nachschaut.

**Ich habe nach der Veröffentlichung einen Fehler gefunden — was jetzt?**
Beitrag öffnen, korrigieren und erneut speichern. Läuft der Beitrag bereits, wird die Korrektur beim nächsten automatischen Rebuild live übernommen. Bei gravierenden Fehlern kann Redaktion den Beitrag jederzeit kurzzeitig auf „Entwurf" zurücksetzen, bis die Korrektur fertig ist.

**Warum sehe ich nicht die Entwürfe von anderen im Team?**
Das ist Absicht (siehe Rollen-Tabelle oben): Autor sieht nur eigene Entwürfe, damit niemand versehentlich fremde, noch unfertige Texte bearbeitet. Redaktion und Admin sehen alles.

**Ich kann den Status nicht auf „Veröffentlicht" stellen — woran liegt das?**
Nur Redaktion und Admin dürfen diesen Schritt ausführen (siehe Rollen-Tabelle). Mit der Rolle Autor lässt sich ein Beitrag nur bis „Zur Freigabe" bringen.
