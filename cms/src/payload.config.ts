import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { de } from '@payloadcms/translations/languages/de';
import sharp from 'sharp';

import { Users } from './collections/Users';
import { Media } from './collections/Media';
import { Beitraege } from './collections/Beitraege';
import { Termine } from './collections/Termine';
import { schedulePublishTask } from './jobs/schedulePublish';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  secret: process.env.PAYLOAD_SECRET ?? '',
  admin: {
    user: Users.slug,
    // M8: kein Aufruf von gravatar.com (US) beim Laden der Admin-Oberflaeche.
    avatar: 'default',
    meta: {
      titleSuffix: '- Redaktion Stopp Air Base Ramstein',
    },
    components: {
      // Lageuebersicht ueber den Standard-Karten der Startseite (Rollenfilter im Component selbst).
      beforeDashboard: ['/components/RedaktionsUebersicht#RedaktionsUebersicht'],
      views: {
        // Redaktionelle Vorschau. ACHTUNG: Payload haengt Custom-Views NICHT hinter den
        // Login-Redirect (isCustomAdminView in @payloadcms/next) - VorschauView.tsx prueft
        // req.user deshalb selbst und liefert ohne Session 404.
        vorschau: {
          Component: '/components/VorschauView#VorschauView',
          exact: true,
          path: '/vorschau/:collection/:id',
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // Deutschsprachige Oberflaeche (M3) - nur "de" als unterstuetzte Sprache macht die Admin-UI
  // ausschliesslich deutsch (keine Sprachumschaltung moeglich, kein ungenutzter i18n-Ballast im Bundle).
  i18n: {
    fallbackLanguage: 'de',
    supportedLanguages: { de },
  },
  collections: [Users, Media, Beitraege, Termine],
  editor: lexicalEditor(),
  // Noetig fuer die automatischen Bildgroessen-Varianten (imageSizes) in collections/Media.ts (M4).
  sharp,
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    tasks: [schedulePublishTask],
    autoRun: [
      {
        cron: '*/5 * * * *',
        limit: 10,
        queue: 'default',
      },
    ],
    shouldAutoRun: () => true,
  },
});
