import type { FieldAccess } from 'payload';

type Role = 'autor' | 'redaktion' | 'admin';
type Status = 'entwurf' | 'zur_freigabe' | 'veroeffentlicht';

/**
 * Regelt, wer das Status-Feld auf welchen Wert setzen darf (Entwurf -> Freigabe -> Veroeffentlichung, M5).
 * Mit der Rolle Autor darf nur zwischen entwurf und zur_freigabe gewechselt werden, und nur bei eigenen Dokumenten
 * (die Eigentuemer-Pruefung selbst passiert in der Collection ueber access.update/ownDraftOrRedaktion;
 * dieses Feld regelt zusaetzlich, WELCHER Statuswert erlaubt ist).
 * Redaktion/Admin duerfen jeden Uebergang, inklusive Veroeffentlichung und Zurueckziehen.
 */
export const canTransitionStatus: FieldAccess = ({ req, data, siblingData, doc }) => {
  const role = req.user?.role as Role | undefined;
  if (!role) return false;
  if (role === 'redaktion' || role === 'admin') return true;

  const nextStatus = (siblingData?.freigabeStatus ?? data?.freigabeStatus) as Status | undefined;
  const currentStatus = (doc?.freigabeStatus as Status | undefined) ?? 'entwurf';

  if (!nextStatus) return true; // Feld nicht Teil dieses Requests

  const autorAllowedTransitions: Record<Status, Status[]> = {
    entwurf: ['entwurf', 'zur_freigabe'],
    zur_freigabe: ['zur_freigabe'],
    veroeffentlicht: ['veroeffentlicht'],
  };

  return autorAllowedTransitions[currentStatus]?.includes(nextStatus) ?? false;
};
