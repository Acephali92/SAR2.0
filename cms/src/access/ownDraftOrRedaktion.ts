import type { Access } from 'payload';

/**
 * Fuer Beitraege/Termine: Autor:in sieht/bearbeitet nur eigene Dokumente,
 * Redaktion und Admin sehen/bearbeiten alle. Wird als collection.access.update
 * und collection.access.read (fuer nicht-veroeffentlichte Inhalte) verwendet.
 */
export const ownDraftOrRedaktion: Access = ({ req }) => {
  if (!req.user) return false;
  if (req.user.role === 'redaktion' || req.user.role === 'admin') return true;
  return { createdBy: { equals: req.user.id } };
};

/** Delete: Autor:in darf nur eigene Entwuerfe loeschen (nicht bereits freigegebene/veroeffentlichte). */
export const ownDraftOnlyDelete: Access = ({ req }) => {
  if (!req.user) return false;
  if (req.user.role === 'redaktion' || req.user.role === 'admin') return true;
  return { and: [{ createdBy: { equals: req.user.id } }, { status: { equals: 'entwurf' } }] };
};
