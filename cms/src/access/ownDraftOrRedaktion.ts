import type { Access, Where } from 'payload';

/**
 * Fuer Beitraege/Termine: mit der Rolle Autor sieht/bearbeitet man nur eigene Dokumente,
 * Redaktion und Admin sehen/bearbeiten alle. Wird als collection.access.update
 * und collection.access.read (fuer nicht-veroeffentlichte Inhalte) verwendet.
 */
export const ownDraftOrRedaktion: Access = ({ req }) => {
  if (!req.user) return false;
  if (req.user.role === 'redaktion' || req.user.role === 'admin') return true;
  return { createdBy: { equals: req.user.id } };
};

/** Delete: mit der Rolle Autor duerfen nur eigene Entwuerfe geloescht werden (nicht bereits freigegebene/veroeffentlichte). */
export const ownDraftOnlyDelete: Access = ({ req }) => {
  if (!req.user) return false;
  if (req.user.role === 'redaktion' || req.user.role === 'admin') return true;
  const where: Where = { and: [{ createdBy: { equals: req.user.id } }, { freigabeStatus: { equals: 'entwurf' } }] };
  return where;
};
