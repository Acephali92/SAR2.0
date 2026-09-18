import type { Payload, TypedUser, Where } from 'payload';
import { FREIGABE_STATUS_LABEL } from '../lib/freigabeStatusLabel';

/**
 * Datenbeschaffung fuer die Redaktions-Uebersicht (RedaktionsUebersicht.tsx).
 *
 * Bewusst von der React-Komponente getrennt: so laesst sich die Rollenlogik
 * ("Autor sieht nur Eigenes") ohne laufende Admin-Oberflaeche pruefen.
 *
 * Die Einschraenkung auf eigene Datensaetze passiert hier explizit ueber createdBy und
 * nicht ueber collection.access.read - letzteres gibt eingeloggten Nutzern bewusst
 * Lesezugriff auf alles (siehe Beitraege.ts).
 */

export type CollectionSlug = 'beitraege' | 'termine';

export type Eintrag = {
  collection: CollectionSlug;
  datum: null | string;
  id: string;
  person: null | string;
  status: string;
  titel: string;
};

type EintragMitSortwert = Eintrag & { sortwert: number };

export type Uebersicht = {
  anstehendeTermine: Eintrag[];
  entwuerfe: Eintrag[];
  geplant: Eintrag[];
  istRedaktion: boolean;
  zurFreigabe: Eintrag[];
};

const FELDER = {
  beitraege: {
    createdBy: true,
    freigabeStatus: true,
    publishAt: true,
    publishedAt: true,
    title: true,
    updatedAt: true,
  },
  termine: {
    createdBy: true,
    eventStatus: true,
    freigabeStatus: true,
    publishAt: true,
    publishedAt: true,
    startDate: true,
    title: true,
    updatedAt: true,
  },
} as const;

// timeZone explizit setzen: ohne sie greift die Zeitzone des Node-Prozesses (Docker/Alpine
// steht standardmaessig auf UTC), wodurch z.B. ein fuer 14:00 Europe/Berlin geplanter Beitrag
// hier faelschlich als 12:00/13:00 angezeigt wuerde.
const datumFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeZone: 'Europe/Berlin' });
const datumZeitFormat = new Intl.DateTimeFormat('de-DE', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Berlin',
});

function formatiere(wert: unknown, mitUhrzeit: boolean): null | string {
  if (typeof wert !== 'string' && typeof wert !== 'number') return null;
  const datum = new Date(wert);
  if (Number.isNaN(datum.getTime())) return null;
  return (mitUhrzeit ? datumZeitFormat : datumFormat).format(datum);
}

/** Rohwert fuer den Sortiervergleich ueber Collections hinweg. Fehlende/ungueltige Werte landen
 *  immer am Ende der Liste, unabhaengig von der Sortierrichtung. */
function sortwertVon(wert: unknown, richtung: 'asc' | 'desc'): number {
  const ansEndeGeschoben = richtung === 'desc' ? -Infinity : Infinity;
  if (typeof wert !== 'string' && typeof wert !== 'number') return ansEndeGeschoben;
  const zeit = new Date(wert).getTime();
  return Number.isNaN(zeit) ? ansEndeGeschoben : zeit;
}

function personName(createdBy: unknown): null | string {
  if (createdBy && typeof createdBy === 'object' && 'name' in createdBy) {
    const name = (createdBy as { name?: unknown }).name;
    if (typeof name === 'string' && name.length > 0) return name;
  }
  return null;
}

async function hole(args: {
  collection: CollectionSlug;
  datumsFeld: 'publishAt' | 'publishedAt' | 'startDate';
  mitUhrzeit?: boolean;
  nurEigene: null | number | string;
  payload: Payload;
  sortFeld: 'publishAt' | 'startDate' | 'updatedAt';
  sortRichtung: 'asc' | 'desc';
  user: TypedUser;
  where: Where;
}): Promise<EintragMitSortwert[]> {
  const { collection, datumsFeld, mitUhrzeit = false, nurEigene, payload, sortFeld, sortRichtung, user, where } = args;

  const bedingungen: Where[] = [where];
  if (nurEigene !== null) bedingungen.push({ createdBy: { equals: nurEigene } });

  const ergebnis = await payload.find({
    collection,
    depth: 1,
    limit: 8,
    overrideAccess: false,
    select: FELDER[collection],
    sort: sortRichtung === 'desc' ? `-${sortFeld}` : sortFeld,
    user,
    where: bedingungen.length === 1 ? bedingungen[0]! : { and: bedingungen },
  });

  return ergebnis.docs.map((doc) => {
    const datensatz = doc as Record<string, unknown>;
    return {
      collection,
      datum: formatiere(datensatz[datumsFeld], mitUhrzeit),
      id: String(datensatz.id),
      person: personName(datensatz.createdBy),
      sortwert: sortwertVon(datensatz[sortFeld], sortRichtung),
      status: FREIGABE_STATUS_LABEL[String(datensatz.freigabeStatus)] ?? String(datensatz.freigabeStatus),
      titel: typeof datensatz.title === 'string' && datensatz.title ? datensatz.title : '(ohne Titel)',
    };
  });
}

function ohneSortwert(eintraege: EintragMitSortwert[]): Eintrag[] {
  return eintraege.map(({ sortwert: _sortwert, ...eintrag }) => eintrag);
}

/**
 * Fasst die (je bis zu 8 pro Collection unabhaengig sortierten und limitierten) Treffer zweier
 * Collections zusammen. Sortiert dabei ueber beide Collections hinweg neu nach dem tatsaechlichen
 * Datumswert und kappt danach erst auf 8 - vorher wurden die beiden Listen nur aneinandergehaengt
 * und blind geschnitten (`slice(0, 8)`), wodurch z.B. Termine aus der Karte verschwinden konnten,
 * sobald allein schon die Beitraege 8 Treffer im selben Status lieferten, und die Reihenfolge
 * zwischen den Collections nicht dem Sortierfeld folgte.
 */
function vereinigeUndBegrenze(eintraege: EintragMitSortwert[], richtung: 'asc' | 'desc'): Eintrag[] {
  const sortiert = [...eintraege].sort((a, b) => (richtung === 'desc' ? b.sortwert - a.sortwert : a.sortwert - b.sortwert));
  return ohneSortwert(sortiert.slice(0, 8));
}

export async function ladeUebersicht(payload: Payload, user: TypedUser): Promise<Uebersicht> {
  const istRedaktion = user.role === 'redaktion' || user.role === 'admin';
  const nurEigene = istRedaktion ? null : user.id;
  const jetzt = new Date().toISOString();

  const heute = new Date();
  heute.setHours(0, 0, 0, 0);
  const heuteISO = heute.toISOString();

  const basis = { nurEigene, payload, user };
  const geplantWhere: Where = {
    and: [{ publishAt: { greater_than: jetzt } }, { freigabeStatus: { not_equals: 'veroeffentlicht' } }],
  };

  const [
    entwuerfeBeitraege,
    entwuerfeTermine,
    freigabeBeitraege,
    freigabeTermine,
    geplantBeitraege,
    geplantTermine,
    anstehendeTermine,
  ] = await Promise.all([
    hole({
      ...basis,
      collection: 'beitraege',
      datumsFeld: 'publishedAt',
      sortFeld: 'updatedAt',
      sortRichtung: 'desc',
      where: { freigabeStatus: { equals: 'entwurf' } },
    }),
    hole({
      ...basis,
      collection: 'termine',
      datumsFeld: 'startDate',
      sortFeld: 'updatedAt',
      sortRichtung: 'desc',
      where: { freigabeStatus: { equals: 'entwurf' } },
    }),
    hole({
      ...basis,
      collection: 'beitraege',
      datumsFeld: 'publishedAt',
      sortFeld: 'updatedAt',
      sortRichtung: 'desc',
      where: { freigabeStatus: { equals: 'zur_freigabe' } },
    }),
    hole({
      ...basis,
      collection: 'termine',
      datumsFeld: 'startDate',
      sortFeld: 'updatedAt',
      sortRichtung: 'desc',
      where: { freigabeStatus: { equals: 'zur_freigabe' } },
    }),
    hole({
      ...basis,
      collection: 'beitraege',
      datumsFeld: 'publishAt',
      mitUhrzeit: true,
      sortFeld: 'publishAt',
      sortRichtung: 'asc',
      where: geplantWhere,
    }),
    hole({
      ...basis,
      collection: 'termine',
      datumsFeld: 'publishAt',
      mitUhrzeit: true,
      sortFeld: 'publishAt',
      sortRichtung: 'asc',
      where: geplantWhere,
    }),
    hole({
      ...basis,
      collection: 'termine',
      datumsFeld: 'startDate',
      sortFeld: 'startDate',
      sortRichtung: 'asc',
      where: {
        and: [
          { startDate: { greater_than_equal: heuteISO } },
          { eventStatus: { not_equals: 'cancelled' } },
          { freigabeStatus: { in: ['veroeffentlicht', 'zur_freigabe'] } },
        ],
      },
    }),
  ]);

  return {
    anstehendeTermine: ohneSortwert(anstehendeTermine),
    entwuerfe: vereinigeUndBegrenze([...entwuerfeBeitraege, ...entwuerfeTermine], 'desc'),
    geplant: vereinigeUndBegrenze([...geplantBeitraege, ...geplantTermine], 'asc'),
    istRedaktion,
    zurFreigabe: vereinigeUndBegrenze([...freigabeBeitraege, ...freigabeTermine], 'desc'),
  };
}
