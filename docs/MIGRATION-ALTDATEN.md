# Migration der alten WordPress-Seite: Freigabeliste

Diese Liste legt fest, welche Inhalte der alten Seite www.stoppramstein.de in die neue Seite übernommen werden, wohin, und wohin jede alte Adresse weiterleitet (`guidelines.md` §17.8). **Erst nach der Freigabe wird importiert.**

- **Datenstand:** Datenbank-Backup der alten Seite vom 2026-09-23
- **Erzeugt mit:** `tools/wp-inventar.py` und `tools/wp-freigabe.py`, Ablauf in `docs/ARCHITEKTUR.md`, „Migrationswerkzeug“
- **Vollständige Liste:** [`migration/freigabe.csv`](./migration/freigabe.csv), eine Zeile je alter URL mit Vorschlag, neuer URL und einer leeren Spalte `entscheidung`. Grundlage: [`migration/inventar.csv`](./migration/inventar.csv) und [`migration/medien.csv`](./migration/medien.csv)

## So wird freigegeben

1. Diese Übersicht lesen, vor allem den Abschnitt „Zu entscheiden“.
2. In `freigabe.csv` die Spalte `entscheidung` nur dort ausfüllen, wo vom Vorschlag abgewichen wird (`ja`, `nein` oder eine andere Ziel-URL). Eine leere Zelle heißt: Vorschlag angenommen.
3. Punkte mit „Redaktion entscheidet“ brauchen eine Antwort, sonst gilt die Weiterleitung aus der Spalte `neue_url`.

## Überblick

| Bereich | Anzahl | Vorschlag |
|---|---|---|
| Beiträge | 698 | alle übernehmen nach `/analysen/<slug>/` (Entscheidung vom 2026-11-05): 638 als `nachricht`, 60 als `analyse` |
| Termine | 102 | alle übernehmen nach `/aktionen/<slug>/`, vergangene als „Abgeschlossen“ |
| Seiten | 89 | einzeln: 9 abgleichen, 2 als Beitrag übernehmen, 9 Redaktion entscheidet, 69 nicht übernehmen (nur Weiterleitung) |
| Kategorien, Schlagwörter | 298 | keine eigenen Seiten, Weiterleitung auf die Rubrik, Kategorien bleiben als Schlagwörter |
| Veranstaltungsorte, Veranstalter | 33 | gehen in die Termine ein |
| Petitionen | 2 | Unterschriften werden nicht übernommen, Weiterleitung auf `/mitmachen/aufruf/` |
| Medien | 1142 | 954 Bilder, 159 PDFs (davon 108 verlinkt), siehe „Medien“ |

Beiträge nach Jahr: 2015: 60, 2016: 69, 2017: 149, 2018: 121, 2019: 100, 2020: 55, 2021: 36, 2022: 31, 2023: 14, 2024: 9, 2025: 7, 2026: 47.
Termine nach Jahr: 2016: 12, 2017: 24, 2018: 9, 2019: 11, 2020: 9, 2021: 8, 2022: 11, 2023: 7, 2024: 5, 2025: 3, 2026: 3.

## Regeln

| Alter Inhalt | Neu | Wie |
|---|---|---|
| Beiträge | CMS `beitraege` | Slug unverändert. Titel, Datum, Schlagwörter (WP-Schlagwörter und Kategorien außer Aktuelles, Archiv, Home, Nachrichten, Termine). Text über eine Positivliste bereinigt: Skripte, iFrames, Formulare und Stile entfallen, Einbettungen (YouTube, Karten) werden Links. Interne Links auf die neue Adresse umgeschrieben. Kein Autor (keine Nutzerkonten) |
| Kategorie | `analyse` / `nachricht` | `analyse` für „Fakten und Argumente“, „Redebeiträge …“, „Broschüren und Folien“; sonst `nachricht` |
| Termine | CMS `termine` | Beginn, Ende, Ort aus dem Veranstaltungsort. Typ nach Stichwörtern (sonstiges: 48, friedenswoche: 34, konferenz: 11, demonstration: 9). Kein Anmeldelink auf den alten Ticketshop |
| Bilder | CMS `media` | Nur verwendete Bilder, nur das Original, ohne Personenfotos (Sichtprüfung vor dem Import, im Zweifel nicht). Metadaten (EXIF, GPS) entfernt |
| Eigene PDFs | CMS `media` | nur verlinkte PDFs, Metadaten entfernt; die alte Datei-URL leitet weiter |
| Fremde PDFs | — | nicht neu hosten (Urheberrecht), stattdessen Link zur Originalquelle |
| Kernseiten | `src/content/` | kein Überschreiben; Unterschiede kommen als Vorschlag in einen eigenen PR |
| Nie übernommen | — | Nutzerkonten, Kommentare, Newsletter-Abonnenten, Spenden, Formulareinträge, Anmeldungen, Mitfahrgelegenheiten, Unterschriften, Shop-Bestellungen |
| Technische Adressen | — | `/feed/`, `/wp-admin/`, `/wp-login.php`, `/xmlrpc.php`, `/wp-json/`: 410 |

## Zu entscheiden

### Seiten

| Vorschlag | Alte URL | Titel | Neu bzw. Weiterleitung | Begründung |
|---|---|---|---|---|
| Redaktion entscheidet | `/appeal/` | Ramstein Campaign: No Drone Wars! | `/mitmachen/aufruf/` | Englische Fassung des Aufrufs; Mehrsprachigkeit ist für Phase 2 vorgesehen (guidelines.md §19) |
| Redaktion entscheidet | `/appel/` | Appel | `/mitmachen/aufruf/` | Französische Fassung des Aufrufs; Mehrsprachigkeit ist für Phase 2 vorgesehen |
| Redaktion entscheidet | `/arbeitsgruppen/` | Arbeitsgruppen | `/mitmachen/ehrenamt/` | Arbeitsgruppen: noch aktuell? Sonst Weiterleitung auf Ehrenamt |
| Redaktion entscheidet | `/downloads/` | Downloads | `/mitmachen/` | Downloads: eigene Seite für Infomaterial nötig? |
| Redaktion entscheidet | `/infomaterial/` | Infomaterial | `/mitmachen/` | Infomaterial (im Menü): eigene Seite für Infomaterial nötig? |
| Redaktion entscheidet | `/jobs/` | Jobs | `/mitmachen/ehrenamt/` | Jobs (im Menü): noch aktuell? |
| Redaktion entscheidet | `/lokale-initiativen/` | Lokale Initiativen - Stopp Ramstein | `/mitmachen/ehrenamt/` | Lokale Initiativen: noch aktuell? Sonst Weiterleitung auf Ehrenamt |
| Redaktion entscheidet | `/newsletter/` | Newsletter | `/mitmachen/` | Newsletter-Anmeldung; ob es einen neuen Newsletter gibt, ist offen |
| Redaktion entscheidet | `/pressespiegel-2016/` | Pressespiegel 2016 | `/analysen/` | Pressespiegel 2016: nur übernehmen, wenn er auf die Originalartikel verlinkt statt sie zu kopieren (Urheberrecht) |
| übernehmen | `/block-air-base-ramstein/` | Aufruf zu Aktionen des zivilen Ungehorsams:  Wir blockieren die Air Base Ramstein! | `/analysen/block-air-base-ramstein/` | Aufruf zum zivilen Ungehorsam (2018) als Beitrag, damit er zitierbar bleibt; Unterzeichnung geschlossen; Description fehlt |
| übernehmen | `/no-bases-network-2023/` | No Bases Network 2023 | `/analysen/no-bases-network-2023/` | Inhaltliche Seite zum No Bases Network 2023 als Beitrag; Description fehlt |
| abgleichen | `/aufruf/` | Kampagne Stopp Ramstein: Kein Drohnenkrieg! | `/mitmachen/aufruf/` | Kernseite gibt es schon; nur Unterschiede als Vorschlag übernehmen. Unterschrieben wird auf ramsteinschliessen.de |
| abgleichen | `/fakten/` | Fakten | `/fakten/` | Kernseite gibt es schon; nur Unterschiede als Vorschlag übernehmen |
| abgleichen | `/hilf-uns-bei-der-organisation/` | Hilf uns bei der Organisation! | `/mitmachen/ehrenamt/` | Kernseite gibt es schon; nur Unterschiede als Vorschlag übernehmen |
| abgleichen | `/kontakt/` | Kontakt | `/kontakt/` | Kernseite gibt es schon; nur Unterschiede als Vorschlag übernehmen |
| abgleichen | `/presse/` | Presse | `/presse/` | Kernseite gibt es schon; nur Unterschiede als Vorschlag übernehmen |
| abgleichen | `/spenden/` | Spenden | `/mitmachen/spenden/` | Kernseite gibt es schon; nur Unterschiede als Vorschlag übernehmen |
| abgleichen | `/ueber-uns/` | Über uns | `/ueber-uns/` | Kernseite gibt es schon; nur Unterschiede als Vorschlag übernehmen |
| abgleichen | `/warum-stopp-air-base-ramstein/` | Warum Stopp Air Base Ramstein | `/warum-ramstein/` | Kernseite gibt es schon; nur Unterschiede als Vorschlag übernehmen |
| abgleichen | `/werde-mitglied-foerderverein/` | Werde Mitglied im Förderverein | `/mitmachen/mitglied-werden/` | Kernseite gibt es schon; nur Unterschiede als Vorschlag übernehmen. Einzige Seite, die nach dem 2026-08-01 geändert wurde: Text besonders prüfen; Prüfen: geändert nach 2026-08-01 |
| nicht übernehmen | `/` | Startseite | `/` | Alte Startseite; die neue Startseite ersetzt sie |
| nicht übernehmen | `/abschnitt-1/` | Abschnitt 1: Ramstein – Airbase (ROT) | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen |
| nicht übernehmen | `/abschnitt-2-airbase-denkmal-gelb/` | Abschnitt 2: Airbase - Denkmal (GELB) | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen |
| nicht übernehmen | `/abschnitt-3-denkmal-autobahnauffahrt-burgerking-gruen/` | Abschnitt 3: Denkmal - Autobahnauffahrt (Burgerking) (GRÜN) | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen |
| nicht übernehmen | `/abschnitt-4-autobahnauffahrt-burgerking-landstuhl-bahnhof-violet/` | Abschnitt 4: Autobahnauffahrt (Burgerking) - Landstuhl Bahnhof (VIOLET) | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen |
| nicht übernehmen | `/abschnitt-5-landstuhl-bahnhof-stadthalle-landstuhl-orange/` | Abschnitt 5: Landstuhl Bahnhof - Stadthalle Landstuhl (ORANGE) | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen |
| nicht übernehmen | `/abschnitt-5-schlecht-zu-fuss-landstuhl-orange-grauer-flyer/` | Abschnitt 5: schlecht zu Fuß - Landstuhl (ORANGE - grauer Flyer) | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen |
| nicht übernehmen | `/abschnitt-6-stadthalle-landstuhl-kreisverkehr-ortsausgang-blau/` | Abschnitt 6: Stadthalle Landstuhl - Kreisverkehr Ortsausgang (BLAU) | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen |
| nicht übernehmen | `/abschnitt-7-kreisverkehr-ortsausgang-kindsbach-braun/` | Abschnitt 7: Kreisverkehr Ortsausgang - Kindsbach (BRAUN) | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen |
| nicht übernehmen | `/akkreditierung/` | Akkreditierung | `/aktionen/` | Friedenscamp 2026 ist vorbei; Anmelde- und Mitfahrfunktionen gibt es nicht mehr. Texte bleiben im Altbestand als Vorlage für ein nächstes Camp; Prüfen: versteckt |
| nicht übernehmen | `/aktuelles/` | Stopp Ramstein Start | `/analysen/` | Leere Übersichtsseite |
| nicht übernehmen | `/anmeldung-abgebrochen/` | Anmeldung abgebrochen | 410 | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/anmeldung-aussteller/` | Anmeldung Aussteller | `/aktionen/` | Friedenscamp 2026 ist vorbei; Anmelde- und Mitfahrfunktionen gibt es nicht mehr. Texte bleiben im Altbestand als Vorlage für ein nächstes Camp |
| nicht übernehmen | `/archiv/` | Chronik | `/analysen/` | Chronik (automatisches Archiv) |
| nicht übernehmen | `/bestellung/` | Bestellung | 410 | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/big-men-tshirts/` | Big-Men-Tshirts | 410 | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/camp-mithelfen/` | Camp - Mithelfen | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen |
| nicht übernehmen | `/camp-preise-leistungen/` | Camp - Preise und Leistungen | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen |
| nicht übernehmen | `/camp-teilnehmerrichtlinien/` | Camp - Teilnehmerrichtlinien | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen |
| nicht übernehmen | `/cookie-richtlinie-eu/` | Cookie-Richtlinie (EU) | `/datenschutz/` | Cookie-Richtlinie; die neue Seite setzt keine Cookies |
| nicht übernehmen | `/datenschutz/` | Datenschutzerklärung | `/datenschutz/` | Alte Erklärung beschreibt Cookies und Plugins, die es nicht mehr gibt |
| nicht übernehmen | `/demo-anreise2016/` | An- und Abreise zur Menschenkette am 11.06.2016 | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen; Prüfen: script, iframe |
| nicht übernehmen | `/demobusse-11-juni-2016-2/` | Demobusse 11. Juni 2016 | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen |
| nicht übernehmen | `/donor-dashboard/` | Donor Dashboard | `/mitmachen/spenden/` | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/forum-passwort-vergessen/` | Forum - Passwort vergessen | 410 | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/forum-registrieren/` | Forum - Registrieren | 410 | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/fr-10-6-stopp-ramstein-drohnen-kriege-beenden/` | Fr 10.6.- STOPP RAMSTEIN (Drohnen-) Kriege beenden! | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen |
| nicht übernehmen | `/friedenscamp-2025-friedenswerkstatt/` | Friedenscamp 2026 - Friedenswerkstatt | `/aktionen/` | Friedenscamp 2026 ist vorbei; Anmelde- und Mitfahrfunktionen gibt es nicht mehr. Texte bleiben im Altbestand als Vorlage für ein nächstes Camp |
| nicht übernehmen | `/friedenscamp-2025-kinderprogramm/` | Friedenscamp 2026 - Kinderbereich | `/aktionen/` | Friedenscamp 2026 ist vorbei; Anmelde- und Mitfahrfunktionen gibt es nicht mehr. Texte bleiben im Altbestand als Vorlage für ein nächstes Camp |
| nicht übernehmen | `/friedenscamp-2025-kulturprogramm/` | Friedenscamp 2026 - Kulturprogramm | `/aktionen/` | Friedenscamp 2026 ist vorbei; Anmelde- und Mitfahrfunktionen gibt es nicht mehr. Texte bleiben im Altbestand als Vorlage für ein nächstes Camp |
| nicht übernehmen | `/gallerie/` | Eindrücke Stopp Air Base Ramstein | `/aktionen/` | Galerie mit Personenfotos (Entscheidung: keine Personenfotos) |
| nicht übernehmen | `/girls-tshirts/` | Girls-Tshirts | 410 | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/herzlichen-dank/` | Herzlichen Dank | 410 | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/impressionen-2018/` | Impressionen 2018 | `/aktionen/` | Galerie mit Personenfotos (Entscheidung: keine Personenfotos) |
| nicht übernehmen | `/impressionen-2025/` | Friedenscamp - 20.06.2026 bis 28.06.2026 | `/aktionen/` | Friedenscamp 2026 ist vorbei; Anmelde- und Mitfahrfunktionen gibt es nicht mehr. Texte bleiben im Altbestand als Vorlage für ein nächstes Camp |
| nicht übernehmen | `/impressionen-2025/camp/` | Anreise | `/aktionen/` | Friedenscamp 2026 ist vorbei; Anmelde- und Mitfahrfunktionen gibt es nicht mehr. Texte bleiben im Altbestand als Vorlage für ein nächstes Camp; Prüfen: iframe |
| nicht übernehmen | `/impressionen-2025/camp/mitfahrgelenheiten/` | Mitfahrgelenheiten | `/aktionen/` | Friedenscamp 2026 ist vorbei; Anmelde- und Mitfahrfunktionen gibt es nicht mehr. Texte bleiben im Altbestand als Vorlage für ein nächstes Camp |
| nicht übernehmen | `/impressionen-2025/faq/` | FAQ | `/aktionen/` | Friedenscamp 2026 ist vorbei; Anmelde- und Mitfahrfunktionen gibt es nicht mehr. Texte bleiben im Altbestand als Vorlage für ein nächstes Camp |
| nicht übernehmen | `/impressionen-2025/impressionen-2023-2/` | Friedenscamp - Impressionen | `/aktionen/` | Galerie mit Personenfotos (Entscheidung: keine Personenfotos) |
| nicht übernehmen | `/impressionen-2025/impressionen-2023-2/friedenscam2026/` | Impressionen 2025 | `/aktionen/` | Galerie mit Personenfotos (Entscheidung: keine Personenfotos) |
| nicht übernehmen | `/impressionen-2025/impressionen-2023-2/impressionen-2021/` | Impressionen 2021 | `/aktionen/` | Galerie mit Personenfotos (Entscheidung: keine Personenfotos) |
| nicht übernehmen | `/impressionen-2025/impressionen-2023-2/impressionen-2023-2/` | Impressionen 2022 | `/aktionen/` | Galerie mit Personenfotos (Entscheidung: keine Personenfotos) |
| nicht übernehmen | `/impressionen-2025/impressionen-2023-2/impressionen-2023/` | Impressionen 2023 | `/aktionen/` | Galerie mit Personenfotos (Entscheidung: keine Personenfotos); Prüfen: script |
| nicht übernehmen | `/impressionen-2025/impressionen-2023-2/impressionen-2024/` | Impressionen 2024 | `/aktionen/` | Galerie mit Personenfotos (Entscheidung: keine Personenfotos) |
| nicht übernehmen | `/impressum/` | Impressum | `/impressum/` | Neues Impressum gilt |
| nicht übernehmen | `/kasse-2/` | Kasse | 410 | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/kasse/` | Kasse | 410 | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/login/` | Anmelden | 410 | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/mein-konto/` | Mein Konto | 410 | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/men-tshirts/` | Men-Tshirts | 410 | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/menschenkette-2016-die-route-und-anmeldung/` | Menschenkette 2016 - Die Route und Anmeldung | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen; Prüfen: iframe |
| nicht übernehmen | `/menschenkette-2016/` | Menschenkette 2016 | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen |
| nicht übernehmen | `/mitfahren2016/` | Mitfahren nach Stopp Ramstein Juni 2016 | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen |
| nicht übernehmen | `/mitmachen/` | Mitmachen - unterstütze Stopp Ramstein | `/mitmachen/` | Leere Übersichtsseite; gleiche Adresse wie die neue Mitmachen-Seite |
| nicht übernehmen | `/newsletter-2/` | Newsletter | `/mitmachen/` | Technische Newsletter-Seite |
| nicht übernehmen | `/newsletter-3/` | Newsletter | `/mitmachen/` | Technische Newsletter-Seite |
| nicht übernehmen | `/nrw-bus-stopp-ramstein/` | NRW-Bus Stopp Ramstein | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen |
| nicht übernehmen | `/passwort-wiederherstellung/` | Passwort Wiederherstellung | 410 | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/planungstreffen/` | Planungstreffen für Ramstein 2016 | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen; Prüfen: iframe |
| nicht übernehmen | `/redaktion/` | Kontakt an die Redaktion | `/kontakt/` | Kontaktformular; Kontakt läuft über die Kontaktseite |
| nicht übernehmen | `/rede-und-musikbeitraege-der-kundgebungen/` | RednerInnen- und Kulturkonzept | `/aktionen/` | Organisationsseite einer vergangenen Aktion (Route, Busse, Camp-Regeln); die Termine selbst werden übernommen |
| nicht übernehmen | `/shop/` | Shop | 410 | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/spende-gescheitert/` | Spende gescheitert | `/mitmachen/spenden/` | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/spenden-bestaetigung/` | Spenden Bestätigung | `/mitmachen/spenden/` | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/submissions/` | Einträge | 410 | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/termine/` | Termine | `/aktionen/` | Leere Terminübersicht |
| nicht übernehmen | `/transaktionen/` | Transaktionen | 410 | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |
| nicht übernehmen | `/unterstuetze-die-kampagne/` | Unterzeichnet den Aufruf | `/mitmachen/aufruf/` | Alte Petitionsseite (Rank-Math-Weiterleitung auf /aufruf/) |
| nicht übernehmen | `/warenkorb/` | Warenkorb | 410 | Technische Seite eines Plugins (Shop, Forum, Spenden, Login), auf der statischen Seite ohne Funktion |

### Beiträge mit Hinweisen

Alle 698 Beiträge werden übernommen. Besonders zu beachten:

- **Video-Beiträge:** 172 Beiträge bestehen vor allem aus einem eingebetteten Video. Neu erscheint dort ein Link zum Video.
- **Porträts der Friedensbühne 2026:** 22 Beiträge stellen Künstler vor. Der Text wird übernommen, Fotos der Personen nicht.
- **Description fehlt:** bei 799 Beiträgen und Terminen. Das CMS verlangt eine Description mit höchstens 160 Zeichen (`cms/src/collections/Beitraege.ts`). **Vorschlag (weicht vom Plan ab, dort: „nicht kürzen, Eintrag für die Redaktion“):** Beim Import wird sie aus dem Textanfang erzeugt, auf einen ganzen Satz bzw. ein ganzes Wort gekürzt und mit „…“ markiert, wenn gekürzt wurde. Eine Liste der erzeugten Descriptions kommt zur Durchsicht in den Import-PR. Für fast 800 Einträge ist das Nachtragen von Hand nicht realistisch.
- **Doppelte Slugs:** 0.

### Medien

- **Bilder:** 954 verwendete Bilder, davon 930 ohne Alt-Text. Vor dem Import werden sie gesichtet: Bilder mit erkennbaren Personen entfallen. Das CMS verlangt einen Alt-Text (`cms/src/collections/Media.ts`). **Vorschlag:** Bei der Sichtung schreibe ich für jedes übernommene Bild einen sachlichen Alt-Text-Entwurf (was zu sehen ist, ohne Wertung). Die Liste kommt zur Durchsicht in den Import-PR. Rein dekorative Bilder werden nicht übernommen.
- **PDFs:** 159 PDFs auf der alten Seite, 108 davon aus Inhalten verlinkt. Übernommen werden die verlinkten eigenen PDFs. Ob ein PDF eigen oder fremd ist, wird bei der Sichtung entschieden.
- **Fehlende Dateien:** 41 Dateien werden in Inhalten verwendet, liegen aber nicht mehr auf dem Server. Die Verweise entfallen.

### Weitere Adressen

- **Alte Weiterleitungen (Rank Math):** `/unterstuetze-die-kampagne/` und `/werbematerial` werden übernommen, mit den neuen Zielen `/mitmachen/aufruf/` und `/mitmachen/`.
- **`/?p=<ID>`:** Kurzlinks der alten Seite leiten auf die neue Adresse desselben Inhalts (feste Tabelle).
- **`ramstein-kampagne.eu`:** Die Inhalte verlinken 272-mal auf diese ältere Domain. Wenn sie noch dem Verein gehört, sollte sie dauerhaft auf stoppramstein.de weiterleiten. **Zu klären: Gehört die Domain noch dem Verein?**
- **Ticketshop** (`ticket.stoppramstein.de`, `ticket.ramstein-kampagne.eu`): wird abgeschaltet und leitet auf `/aktionen/` weiter.

## Prüfung der Altdaten

Alle veröffentlichten Inhalte wurden auf eingeschleusten Code und Spam geprüft (Skripte, iFrames, Event-Handler, versteckte Elemente, Spam-Begriffe, unbekannte Domains). Gefunden wurden nur alte Einbettungen bekannter Dienste (YouTube, Google Maps, OpenStreetMap, Deutsche Bahn, Vidyard). Sie entfallen bei der Bereinigung ohnehin. Nach dem 2026-08-01 wurde laut Datenbank nur die Seite `/werde-mitglied-foerderverein/` geändert, sie wird beim Abgleich besonders geprüft.
