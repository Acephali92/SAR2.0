import React from 'react';
import type { Payload, TypedUser } from 'payload';
import { ladeUebersicht, type CollectionSlug, type Eintrag } from './uebersichtDaten';
import styles from './RedaktionsUebersicht.module.css';

/**
 * Lageuebersicht ueber dem Standard-Dashboard (admin.components.beforeDashboard).
 *
 * Alle Zahlen und Zeilen stammen aus echten Local-API-Abfragen (uebersichtDaten.ts) -
 * es gibt hier keine gepflegten Kennzahlen und keine eigene Collection.
 */

const COLLECTION_LABEL: Record<CollectionSlug, string> = {
  beitraege: 'Beitrag',
  termine: 'Termin',
};

function Liste({ adminPfad, eintraege, leerText, titel }: {
  adminPfad: string;
  eintraege: Eintrag[];
  leerText: string;
  titel: string;
}) {
  return (
    <section className={styles.karte}>
      <h3 className={styles.karteTitel}>
        {titel}
        <span className={styles.anzahl}>{eintraege.length}</span>
      </h3>
      {eintraege.length === 0 ? (
        <p className={styles.leer}>{leerText}</p>
      ) : (
        <ul className={styles.liste}>
          {eintraege.map((eintrag) => (
            <li className={styles.zeile} key={`${eintrag.collection}-${eintrag.id}`}>
              <a
                className={styles.link}
                href={`${adminPfad}/collections/${eintrag.collection}/${eintrag.id}`}
              >
                {eintrag.titel}
              </a>
              <span className={styles.meta}>
                <span className={styles.badge}>{COLLECTION_LABEL[eintrag.collection]}</span>
                <span className={styles.status}>{eintrag.status}</span>
                {eintrag.person ? <span>{eintrag.person}</span> : null}
                {eintrag.datum ? <span>{eintrag.datum}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export async function RedaktionsUebersicht({ payload, user }: { payload: Payload; user?: TypedUser }) {
  if (!user) return null;

  const adminPfad = payload.config.routes.admin;
  const uebersicht = await ladeUebersicht(payload, user);

  return (
    <div className={styles.wrapper}>
      <header className={styles.kopf}>
        <h2 className={styles.ueberschrift}>Redaktions-Übersicht</h2>
        <p className={styles.hinweis}>
          {uebersicht.istRedaktion ? 'Alle Beiträge und Termine.' : 'Nur die eigenen Beiträge und Termine.'}
        </p>
      </header>

      <div className={styles.raster}>
        <Liste
          adminPfad={adminPfad}
          eintraege={uebersicht.entwuerfe}
          leerText="Keine offenen Entwürfe."
          titel="Offene Entwürfe"
        />
        <Liste
          adminPfad={adminPfad}
          eintraege={uebersicht.zurFreigabe}
          leerText="Nichts wartet auf Freigabe."
          titel="Warten auf Freigabe"
        />
        <Liste
          adminPfad={adminPfad}
          eintraege={uebersicht.geplant}
          leerText="Keine geplanten Veröffentlichungen."
          titel="Geplante Veröffentlichungen"
        />
        <Liste
          adminPfad={adminPfad}
          eintraege={uebersicht.anstehendeTermine}
          leerText="Keine anstehenden Termine."
          titel="Anstehende Termine"
        />
      </div>
    </div>
  );
}
