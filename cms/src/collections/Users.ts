import type { CollectionConfig } from 'payload';
import { isAdmin, isAdminFieldAccess } from '../access/isAdmin';
import { isAdminOrSelf } from '../access/isAdminOrSelf';

/**
 * M1: Login per E-Mail+Passwort (Payload-nativ, kein Git/GitHub-Konto noetig).
 * M2: Rollen autor/redaktion/admin steuern die Zugriffsrechte auf Beitraege/Termine.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 60 * 60 * 8, // 8h
    maxLoginAttempts: 10,
    lockTime: 10 * 60 * 1000,
    // Erlaubt API-Key-Auth zusaetzlich zu Login-Sessions - wird nur fuer den dedizierten
    // Service-Nutzer aktiviert, mit dem der Astro-Build lesend zugreift (siehe cms/README.md).
    // Menschliche Redaktions-Accounts lassen das Feld einfach deaktiviert.
    useAPIKey: true,
    forgotPassword: {
      generateEmailSubject: () => 'Passwort zurücksetzen – Redaktion stoppramstein.de',
    },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
  },
  access: {
    read: ({ req }) => !!req.user,
    create: isAdmin,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Name',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'autor',
      label: 'Rolle',
      options: [
        { label: 'Autor', value: 'autor' },
        { label: 'Redaktion', value: 'redaktion' },
        { label: 'Admin', value: 'admin' },
      ],
      access: {
        update: isAdminFieldAccess,
      },
    },
  ],
};
