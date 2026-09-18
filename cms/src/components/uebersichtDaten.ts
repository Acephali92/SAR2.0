import type { Payload, TypedUser, Where } from 'payload';

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

export type Uebersicht = {
  anstehendeTermine: Eintrag[];
  entwuerfe: Eintrag[];
  geplant: Eintrag[];
  istRedaktion: boolean;
  zurFreigabe: Eintrag[];
};

const STATUS_LABEL: Record<string, string> = {
  entwurf: 'Entwurf',
  veroeffentlicht: 'Veröffentlicht',
  zur_freigabe: 'Zur Freigabe',
};

const FELDER = {
  beitraege: {
    createdBy: true,
    freigabeStatus: true,
    publishAt: true,
    publishedAt: true,
    title: true,
  },
  termine: {
    createdBy: true,
    eventStatus: true,
    freigabeStatus: true,
    publishAt: true,
    publishedAt: true,
    startDate: true,
    title: true,
  },
} as const;

const datumFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' });
const datumZeitFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' });

function formatiere(wert: unknown, mitUhrzeit: boolean): null | string {
  if (typeof wert !== 'string' && typeof wert !== 'number') return null;
  const datum = new Date(wert);
  if (Number.isNaN(datum.getTime())) return null;
  return (mitUhrzeit ? datumZeitFormat : datumFormat).format(datum);
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
  sort: string;
  user: TypedUser;
  where: Where;
}): Promise<Eintrag[]> {
  const { collection, datumsFeld, mitUhrzeit = false, nurEigene, payload, sort, user, where } = args;

  const bedingungen: Where[] = [where];
  if (nurEigene !== null) bedingungen.push({ createdBy: { equals: nurEigene } });

  const ergebnis = await payload.find({
    collection,
    depth: 1,
    limit: 8,
    overrideAccess: false,
    select: FELDER[collection],
    sort,
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
      status: STATUS_LABEL[String(datensatz.freigabeStatus)] ?? String(datensatz.freigabeStatus),
      titel: typeof datensatz.title === 'string' && datensatz.title ? datensatz.title : '(ohne Titel)',
    };
  });
}

/** Beide Collections liefern je bis zu 8 Treffer - zusammengelegt wird die Karte wieder gekappt. */
function begrenze(eintraege: Eintrag[]): Eintrag[] {
  return eintraege.slice(0, 8);
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
    hole({ ...basis, collection: 'beitraege', datumsFeld: 'publishedAt', sort: '-updatedAt', where: { freigabeStatus: { equals: 'entwurf' } } }),
    hole({ ...basis, collection: 'termine', datumsFeld: 'startDate', sort: '-updatedAt', where: { freigabeStatus: { equals: 'entwurf' } } }),
    hole({ ...basis, collection: 'beitraege', datumsFeld: 'publishedAt', sort: '-updatedAt', where: { freigabeStatus: { equals: 'zur_freigabe' } } }),
    hole({ ...basis, collection: 'termine', datumsFeld: 'startDate', sort: '-updatedAt', where: { freigabeStatus: { equals: 'zur_freigabe' } } }),
    hole({ ...basis, collection: 'beitraege', datumsFeld: 'publishAt', mitUhrzeit: true, sort: 'publishAt', where: geplantWhere }),
    hole({ ...basis, collection: 'termine', datumsFeld: 'publishAt', mitUhrzeit: true, sort: 'publishAt', where: geplantWhere }),
    hole({
      ...basis,
      collection: 'termine',
      datumsFeld: 'startDate',
      sort: 'startDate',
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
    anstehendeTermine,
    entwuerfe: begrenze([...entwuerfeBeitraege, ...entwuerfeTermine]),
    geplant: begrenze([...geplantBeitraege, ...geplantTermine]),
    istRedaktion,
    zurFreigabe: begrenze([...freigabeBeitraege, ...freigabeTermine]),
  };
}
