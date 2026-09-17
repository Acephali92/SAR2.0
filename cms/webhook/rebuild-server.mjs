// M9: Rebuild-Webhook-Dienst. Nimmt den afterChange-Hook-Aufruf aus cms/src/hooks/triggerRebuild.ts
// entgegen, baut die Astro-Seite (npm ci && npm run build inkl. der verify-Gates check-links/check-csp)
// und tauscht dist/ nur bei Erfolg atomar aus (Symlink-Swap). Bewusst als schlanker Node-Dienst ohne
// Framework - Node ist ohnehin fuer beide Haelften des Stacks Pflicht, kein neues Laufzeit-Oekosystem.
//
// Erwartete Umgebung (siehe docker-compose.yml):
//   SITE_DIR            - Pfad zum ausgecheckten Astro-Repo (Bind-Mount des Hosts)
//   RELEASES_DIR         - Basisverzeichnis fuer Release-Ordner, z.B. /releases
//   CURRENT_LINK          - Pfad des Symlinks, auf den Caddy/nginx zeigt, z.B. /releases/current
//   REBUILD_WEBHOOK_SECRET - Shared Secret, muss zum Payload-.env passen
//   PORT                  - Default 8090
//   SMTP_*, REDAKTION_NOTIFY_EMAIL - fuer Fehlerbenachrichtigung (optional, sonst nur Log)

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, rename, symlink, unlink, mkdir, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PORT = Number(process.env.PORT ?? 8090);
const SITE_DIR = process.env.SITE_DIR ?? '/site';
const RELEASES_DIR = process.env.RELEASES_DIR ?? '/releases';
const CURRENT_LINK = process.env.CURRENT_LINK ?? path.join(RELEASES_DIR, 'current');
const SECRET = process.env.REBUILD_WEBHOOK_SECRET;
const LOG_FILE = process.env.LOG_FILE ?? '/var/log/stoppramstein-rebuild.log';

let building = false;
let rebuildQueued = false;

async function log(line) {
  const entry = `[${new Date().toISOString()}] ${line}\n`;
  process.stdout.write(entry);
  try {
    await appendFile(LOG_FILE, entry);
  } catch {
    // Log-Datei evtl. nicht schreibbar (lokal) - Konsole reicht dann.
  }
}

function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, shell: process.platform === 'win32' });
    let output = '';
    child.stdout.on('data', (d) => (output += d.toString()));
    child.stderr.on('data', (d) => (output += d.toString()));
    child.on('close', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}\n${output}`));
    });
  });
}

async function notifyFailure(reason, details) {
  await log(`REBUILD FEHLGESCHLAGEN: ${reason}`);
  const to = process.env.REDAKTION_NOTIFY_EMAIL;
  if (!to || !process.env.SMTP_HOST) {
    await log('Kein SMTP konfiguriert - Fehler nur geloggt, keine E-Mail gesendet.');
    return;
  }
  try {
    const { default: nodemailer } = await import('nodemailer');
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject: 'Rebuild fehlgeschlagen - stoppramstein.de',
      text: `Der automatische Rebuild nach einer Veroeffentlichung ist fehlgeschlagen.\n\nGrund: ${reason}\n\nDetails:\n${details ?? ''}\n\nDie zuletzt erfolgreich gebaute Seite ist weiterhin online.`,
    });
  } catch (err) {
    await log(`E-Mail-Benachrichtigung fehlgeschlagen: ${err.message}`);
  }
}

async function swapRelease(newReleaseDir) {
  const tmpLink = `${CURRENT_LINK}.tmp`;
  if (existsSync(tmpLink)) await unlink(tmpLink);
  await symlink(newReleaseDir, tmpLink);
  await rename(tmpLink, CURRENT_LINK); // atomar auf demselben Dateisystem
}

async function build() {
  await mkdir(RELEASES_DIR, { recursive: true });
  const releaseDir = path.join(RELEASES_DIR, new Date().toISOString().replace(/[:.]/g, '-'));

  await log('Rebuild gestartet...');
  await run('npm', ['ci'], SITE_DIR);
  await run('npm', ['run', 'build'], SITE_DIR); // inkl. postbuild (pagefind)
  await run('npm', ['run', 'check-links'], SITE_DIR);
  await run('npm', ['run', 'check-csp'], SITE_DIR);

  await rename(path.join(SITE_DIR, 'dist'), releaseDir);
  await swapRelease(releaseDir);
  await log(`Rebuild erfolgreich, live: ${releaseDir}`);
}

async function buildWithLock() {
  if (building) {
    rebuildQueued = true;
    return;
  }
  building = true;
  try {
    do {
      rebuildQueued = false;
      await build();
    } while (rebuildQueued);
  } catch (err) {
    await notifyFailure('Build oder Verify-Gate fehlgeschlagen', err.message);
  } finally {
    building = false;
  }
}

const server = createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/rebuild') {
    res.writeHead(404).end();
    return;
  }
  if (!SECRET || req.headers['x-webhook-secret'] !== SECRET) {
    res.writeHead(401).end('unauthorized');
    return;
  }

  res.writeHead(202, { 'content-type': 'application/json' }).end(JSON.stringify({ accepted: true }));
  buildWithLock();
});

server.listen(PORT, () => {
  log(`rebuild-webhook lauscht auf Port ${PORT}`);
});
