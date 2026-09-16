#!/usr/bin/env node
/*
 * Preview Deploy Header Generator (statichost.eu)
 *
 * Schreibt dist/_headers für das passwortgeschützte Team-Vorschau-Deployment.
 * Läuft NACH `npm run build` (das auch den `postbuild`-Pagefind-Hook triggert),
 * damit dist/ bereits vollständig ist.
 *
 * WICHTIG: Wird ausschließlich von statichost.yml's `command` aufgerufen und
 * ist absichtlich NICHT in package.json (kein npm-Skript, nicht Teil von
 * `verify`) eingebunden. dist/_headers setzt X-Robots-Tag: noindex, nofollow,
 * was niemals in die Produktion gelangen darf. Der Produktions-Build
 * (`npm run build` allein, siehe docs/DEPLOYMENT.md) ruft dieses Skript nie
 * auf, und dist/ ist git-ignored und wird bei jedem Build neu erzeugt —
 * die Datei kann Produktion daher konstruktionsbedingt nicht erreichen.
 *
 * statichost.eu-Format für _headers: eine Pfadzeile, darunter eingerückte
 * Header (2 Leerzeichen). Bei mehrfach gesetzten Headern gilt laut Doku der
 * zuletzt passende Block. Pfad-spezifische Blöcke (wie /_astro/* unten)
 * hängen laut statichost-Doku ggf. vom Tarif ab — der *-Block funktioniert
 * dokumentiert in allen Tarifen und schützt allein bereits vollständig.
 *
 * Usage: node scripts/write-preview-headers.mjs
 */
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');
const HEADERS_FILE = join(DIST_DIR, '_headers');

const CSP = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'";

const HEADER_BLOCKS = [
  {
    path: '*',
    headers: [
      `Content-Security-Policy: ${CSP}`,
      'X-Content-Type-Options: nosniff',
      'X-Frame-Options: DENY',
      'Referrer-Policy: strict-origin-when-cross-origin',
      'X-Robots-Tag: noindex, nofollow',
      'Cache-Control: no-cache',
    ],
  },
  {
    path: '/_astro/*',
    headers: [
      'Cache-Control: public, max-age=31536000, immutable',
    ],
  },
];

function buildHeadersFile(blocks) {
  return blocks
    .map(({ path, headers }) => [path, ...headers.map((h) => `  ${h}`)].join('\n'))
    .join('\n\n') + '\n';
}

function main() {
  console.log('🔧 Writing preview _headers for statichost.eu...\n');

  if (!existsSync(DIST_DIR)) {
    console.error('❌ dist/ directory not found. Run npm run build first.');
    process.exit(1);
  }

  writeFileSync(HEADERS_FILE, buildHeadersFile(HEADER_BLOCKS), 'utf-8');

  console.log(`✅ Wrote ${HEADER_BLOCKS.length} header block(s) to dist/_headers`);
  process.exit(0);
}

main();
