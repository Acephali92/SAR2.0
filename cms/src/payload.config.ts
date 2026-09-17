import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';

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
    meta: {
      titleSuffix: '- Redaktion Stopp Air Base Ramstein',
    },
  },
  // Deutschsprachige Oberflaeche (M3)
  i18n: {
    fallbackLanguage: 'de',
    supportedLanguages: { de: {} } as never,
  },
  localization: undefined,
  collections: [Users, Media, Beitraege, Termine],
  editor: lexicalEditor(),
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
