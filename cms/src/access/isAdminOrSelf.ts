import type { Access } from 'payload';

/** Users-Collection: Admin darf alle bearbeiten, alle anderen nur das eigene Profil. */
export const isAdminOrSelf: Access = ({ req, id }) => {
  if (req.user?.role === 'admin') return true;
  if (!req.user) return false;
  return { id: { equals: req.user.id } };
};
