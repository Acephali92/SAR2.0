import React from 'react';
import { notFound } from 'next/navigation';
import type { PayloadRequest } from 'payload';
import styles from './VorschauView.module.css';

/**
 * Redaktionelle Vorschau unter /admin/vorschau/:collection/:id.
 *
 * SICHERHEITSHINWEIS: Custom-Admin-Views sind bei Payload 3 NICHT automatisch hinter dem Login.
 * RootPage ueberspringt den Auth-Redirect fuer jede in admin.components.views registrierte Route
 * (siehe isCustomAdminView in @payloadcms/next) - die Pruefung auf req.user muss deshalb hier
 * selbst passieren, sonst waere der Entwurfsinhalt ohne Session lesbar.
 *
 * Die Vorschau lebt vollstaendig in cms/ und laeuft nur unter redaktion.stoppramstein.de.
 * stoppramstein.de bleibt statisch und sieht Entwuerfe nie - es gibt keine oeffentliche
 * Vorschau-URL, kein Preview-Cookie und keinen Draft-Pfad im payload-loader.ts.
 */

const COLLECTIONS = ['beitraege', 'termine'] as const;
type Collection = (typeof COLLECTIONS)[number];

const STATUS_LABEL: Record<string, string> = {
  entwurf: 'Entwurf',
  veroeffentlicht: 'Veröffentlicht',
  zur_freigabe: 'Zur Freigabe',
};

const KATEGORIE_LABEL: Record<string, string> = {
  analyse: 'Analyse',
  nachricht: 'Nachricht',
};

const EVENT_TYP_LABEL: Record<string, string> = {
  demonstration: 'Demonstration',
  friedenswoche: 'Friedenswoche',
  konferenz: 'Konferenz',
  sonstiges: 'Sonstiges',
  workshop: 'Workshop',
};

const EVENT_STATUS_LABEL: Record<string, string> = {
  cancelled: 'Abgesagt',
  completed: 'Abgeschlossen',
  ongoing: 'Läuft gerade',
  upcoming: 'Demnächst',
};

const datumZeitFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'long', timeStyle: 'short' });

function formatiereDatum(wert: unknown): null | string {
  if (typeof wert !== 'string' && typeof wert !== 'number') return null;
  const datum = new Date(wert);
  return Number.isNaN(datum.getTime()) ? null : datumZeitFormat.format(datum);
}

function istEigenes(doc: Record<string, unknown>, userID: number | string): boolean {
  const createdBy = doc.createdBy;
  const besitzerID =
    createdBy && typeof createdBy === 'object' ? (createdBy as { id?: unknown }).id : createdBy;
  return besitzerID !== undefined && besitzerID !== null && String(besitzerID) === String(userID);
}

type Bild = { alt: string; caption: null | string; url: string };

function leseBild(doc: Record<string, unknown>): Bild | null {
  const gruppe = doc.image as undefined | { image?: unknown };
  const medium = gruppe?.image;
  if (!medium || typeof medium !== 'object') return null;
  const { alt, caption, url } = medium as { alt?: unknown; caption?: unknown; url?: unknown };
  if (typeof url !== 'string' || !url) return null;
  return {
    alt: typeof alt === 'string' ? alt : '',
    caption: typeof caption === 'string' && caption ? caption : null,
    url,
  };
}

type Quelle = { label: string; url: string };

function leseQuellen(doc: Record<string, unknown>): Quelle[] {
  if (!Array.isArray(doc.sources)) return [];
  return doc.sources.flatMap((eintrag) => {
    if (!eintrag || typeof eintrag !== 'object') return [];
    const { label, url } = eintrag as { label?: unknown; url?: unknown };
    if (typeof label !== 'string' || typeof url !== 'string') return [];
    return [{ label, url }];
  });
}

type Verweis = { collection: Collection; id: string; titel: string };

function leseVerweise(wert: unknown, collection: Collection): Verweis[] {
  const liste = Array.isArray(wert) ? wert : wert && typeof wert === 'object' && 'docs' in wert ? (wert as { docs?: unknown }).docs : null;
  if (!Array.isArray(liste)) return [];
  return liste.flatMap((eintrag) => {
    if (!eintrag || typeof eintrag !== 'object') return [];
    const { id, title } = eintrag as { id?: unknown; title?: unknown };
    if (id === undefined || id === null) return [];
    return [{ collection, id: String(id), titel: typeof title === 'string' && title ? title : `#${String(id)}` }];
  });
}

type Props = {
  initPageResult: { req: PayloadRequest };
  params?: { segments?: string[] };
};

export async function VorschauView({ initPageResult, params }: Props) {
  const req = initPageResult.req;
  const { payload, user } = req;

  if (!user) notFound();

  const segments = params?.segments ?? [];
  const collection = segments[1] as Collection | undefined;
  const rohID = segments[2];

  if (!collection || !COLLECTIONS.includes(collection) || !rohID) notFound();

  const id = payload.db.defaultIDType === 'number' ? Number(rohID) : rohID;
  if (typeof id === 'number' && Number.isNaN(id)) notFound();

  let doc: Record<string, unknown>;
  try {
    doc = (await payload.findByID({
      collection,
      id,
      depth: 2,
      draft: true,
      overrideAccess: false,
      user,
    })) as unknown as Record<string, unknown>;
  } catch {
    notFound();
  }

  // Beitraege/Termine geben eingeloggten Nutzern per access.read alles frei; die Beschraenkung
  // "Autor sieht nur Eigenes" muss die Vorschau deshalb selbst durchsetzen.
  const istRedaktion = user.role === 'redaktion' || user.role === 'admin';
  if (!istRedaktion && !istEigenes(doc, user.id)) notFound();

  const adminPfad = payload.config.routes.admin;
  const bearbeitenURL = `${adminPfad}/collections/${collection}/${String(doc.id)}`;
  const status = STATUS_LABEL[String(doc.freigabeStatus)] ?? String(doc.freigabeStatus);
  const bild = leseBild(doc);
  const quellen = leseQuellen(doc);
  const istTermin = collection === 'termine';

  const verweise = istTermin
    ? leseVerweise(doc.verknuepfteBeitraege, 'beitraege')
    : leseVerweise(doc.verknuepfterTermin, 'termine');

  const beginn = formatiereDatum(doc.startDate);
  const ende = formatiereDatum(doc.endDate);
  const ort = doc.location as undefined | { address?: unknown; city?: unknown; name?: unknown };
  const ortText = [ort?.name, ort?.address, ort?.city].filter((teil): teil is string => typeof teil === 'string' && teil.length > 0).join(', ');

  return (
    <div className={styles.seite}>
      <div className={styles.banner} role="status">
        <strong>Vorschau — nicht öffentlich.</strong> So wirkt der Inhalt ungefähr auf der Website.
        Aktueller Status: {status}.
        <a className={styles.bannerLink} href={bearbeitenURL}>
          Zurück zum Bearbeiten
        </a>
      </div>

      <article className={styles.artikel}>
        <header className={styles.kopf}>
          <p className={styles.rubrik}>
            {istTermin
              ? `Termin · ${EVENT_TYP_LABEL[String(doc.eventType)] ?? String(doc.eventType ?? '')}`
              : `Beitrag · ${KATEGORIE_LABEL[String(doc.kategorie)] ?? String(doc.kategorie ?? '')}`}
          </p>
          <h1 className={styles.titel}>{typeof doc.title === 'string' ? doc.title : '(ohne Titel)'}</h1>
          {typeof doc.description === 'string' && doc.description ? (
            <p className={styles.anriss}>{doc.description}</p>
          ) : null}

          {istTermin ? (
            <dl className={styles.eckdaten}>
              {beginn ? (
                <>
                  <dt>Beginn</dt>
                  <dd>{beginn}</dd>
                </>
              ) : null}
              {ende ? (
                <>
                  <dt>Ende</dt>
                  <dd>{ende}</dd>
                </>
              ) : null}
              {ortText ? (
                <>
                  <dt>Ort</dt>
                  <dd>{ortText}</dd>
                </>
              ) : null}
              <dt>Veranstaltungsstatus</dt>
              <dd>{EVENT_STATUS_LABEL[String(doc.eventStatus)] ?? String(doc.eventStatus ?? '')}</dd>
              {typeof doc.registrationUrl === 'string' && doc.registrationUrl ? (
                <>
                  <dt>Anmeldung</dt>
                  <dd>
                    <a href={doc.registrationUrl} rel="noopener noreferrer" target="_blank">
                      {doc.registrationUrl}
                    </a>
                  </dd>
                </>
              ) : null}
            </dl>
          ) : null}
        </header>

        {bild ? (
          <figure className={styles.bild}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={bild.alt} src={bild.url} />
            <figcaption>
              {bild.caption ? <span>{bild.caption}</span> : null}
              <span className={styles.altHinweis}>Alt-Text: {bild.alt || '— fehlt —'}</span>
            </figcaption>
          </figure>
        ) : null}

        {/* renderedHtml stammt aus addRenderedHtml (Lexical -> HTML). Der Editor laesst
            strukturell keine HTML-/Embed-Bloecke zu (lib/editorConfig.ts), es entsteht hier
            also dasselbe HTML, das auch die oeffentliche Seite statisch ausliefert. */}
        <div
          className={styles.inhalt}
          dangerouslySetInnerHTML={{ __html: typeof doc.renderedHtml === 'string' ? doc.renderedHtml : '' }}
        />

        {quellen.length > 0 ? (
          <section className={styles.block}>
            <h2>Quellen</h2>
            <ol className={styles.quellen}>
              {quellen.map((quelle) => (
                <li key={`${quelle.label}-${quelle.url}`}>
                  <a href={quelle.url} rel="noopener noreferrer" target="_blank">
                    {quelle.label}
                  </a>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {verweise.length > 0 ? (
          <section className={styles.block}>
            <h2>{istTermin ? 'Zugehörige Beiträge' : 'Verknüpfter Termin'}</h2>
            <ul className={styles.verweise}>
              {verweise.map((verweis) => (
                <li key={`${verweis.collection}-${verweis.id}`}>
                  <a href={`${adminPfad}/vorschau/${verweis.collection}/${verweis.id}`}>{verweis.titel}</a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </div>
  );
}
