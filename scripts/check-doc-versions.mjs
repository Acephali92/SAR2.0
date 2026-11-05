#!/usr/bin/env node
/*
 * Version consistency check for the documentation
 *
 * Versions have exactly one source (see guidelines.md §2.2):
 *   - dependencies:            package.json / cms/package.json (+ lock files)
 *   - minimum Node.js version: engines.node in the same files
 *   - Node.js for dev and CI:  .nvmrc (CI reads it via node-version-file)
 *
 * The docs listed in DOCS may name a tracked tool only by its major version
 * ("Astro 7", "Tailwind CSS 3.x", "7.x" in a table; for 0.x packages the
 * second digit counts as the major: "0.5.x"). This script fails if a doc names
 * an exact version, a different major, or a Node.js minimum other than
 * engines.node, and if .nvmrc, the CI workflows and the Dockerfiles disagree
 * on the Node.js major.
 *
 * Deliberately not checked: docs/AENDERUNGSPROTOKOLL.md (historical versions)
 * and docs/OFFENE-PUNKTE.md (discusses upcoming majors).
 *
 * Usage: node scripts/check-doc-versions.mjs
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const DOCS = [
  'README.md',
  'CLAUDE.md',
  'CONTRIBUTING.md',
  'guidelines.md',
  'docs/ARCHITEKTUR.md',
  'docs/DEPLOYMENT.md',
  'docs/INHALTE-PFLEGEN.md',
  'cms/README.md',
];

const readText = (path) => readFileSync(join(ROOT, path), 'utf8');
const readJson = (path) => JSON.parse(readText(path));

const projects = {
  root: { manifest: 'package.json', pkg: readJson('package.json') },
  cms: { manifest: 'cms/package.json', pkg: readJson('cms/package.json') },
};
const rootLock = readJson('package-lock.json');

// name: label in messages; pattern: how docs write it (case-sensitive);
// version(): the version from the single source
const TOOLS = [
  { name: 'Astro', pattern: 'Astro', version: () => dep('root', 'astro') },
  { name: 'Tailwind CSS', pattern: 'Tailwind(?: CSS)?', version: () => dep('root', 'tailwindcss') },
  { name: '@tailwindcss/typography', pattern: '@tailwindcss/typography', version: () => dep('root', '@tailwindcss/typography') },
  { name: 'TypeScript', pattern: 'TypeScript', version: () => dep('root', 'typescript') },
  { name: 'Pagefind', pattern: 'Pagefind', version: () => dep('root', 'pagefind') },
  { name: 'sharp', pattern: 'sharp', version: () => dep('root', 'sharp') },
  { name: 'Vite', pattern: 'Vite', version: () => locked('node_modules/vite'), source: 'package-lock.json (über Astro)' },
  { name: 'Payload CMS', pattern: 'Payload(?: CMS)?', version: () => dep('cms', 'payload'), source: 'cms/package.json' },
  { name: 'Next.js', pattern: 'Next\\.js', version: () => dep('cms', 'next'), source: 'cms/package.json' },
];

const errors = [];
const report = (file, line, message) => errors.push(`${file}:${line}: ${message}`);

function dep(project, name) {
  const { pkg, manifest } = projects[project];
  const range = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
  if (!range) throw new Error(`${name} fehlt in ${manifest}`);
  return range.replace(/^[\^~]/, '');
}

function locked(path) {
  const version = rootLock.packages?.[path]?.version;
  if (!version) throw new Error(`${path} fehlt in package-lock.json`);
  return version;
}

// The part of a version that marks breaking changes: "7" for 7.4.2, "0.5" for 0.5.20
function majorLine(version) {
  const [major, minor] = version.split('.');
  return major === '0' ? `0.${minor}` : major;
}

// Version as written in a doc ("7", "7.x", "0.5.x") must name exactly the major line
function checkToolVersion(file, line, tool, written) {
  const expected = majorLine(tool.version());
  const source = tool.source ?? 'package.json';
  const bare = written.replace(/\.x$/, '');
  if (/^\d+\.\d+\.\d+/.test(bare)) {
    report(file, line, `„${tool.name} ${written}“ ist eine exakte Version. In der Doku nur die Hauptversion nennen („${expected}“ bzw. „${expected}.x“), exakt steht sie in ${source}.`);
  } else if (bare !== expected) {
    report(file, line, `„${tool.name} ${written}“ passt nicht zu ${source} (${tool.version()}). Erwartet: „${expected}“ bzw. „${expected}.x“.`);
  }
}

function engineMinimum(project) {
  const { pkg, manifest } = projects[project];
  const match = /^>=\s*(\d+(?:\.\d+)*)$/.exec(pkg.engines?.node ?? '');
  if (!match) throw new Error(`engines.node in ${manifest} muss die Form ">=X.Y.Z" haben`);
  return match[1];
}

const trimZeros = (version) => version.replace(/(\.0)+$/, '');

const toolRegexes = TOOLS.map((tool) => ({
  tool,
  // "Astro 7", "Astro 7.x", "Astro-7-Standard"; not "@astrojs" or "Astro islands"
  prose: new RegExp(`(?<![\\w@/.-])${tool.pattern}[ -](\\d+(?:\\.\\d+)*(?:\\.x)?)(?![\\d.])`, 'g'),
  cell: new RegExp(`^${tool.pattern}$`),
}));
const NODE_REGEX = /\bNode\.js\s*(≥|>=)?\s*(\d+(?:\.\d+)*)(?:\.x)?/g;
const VERSION_CELL = /^\d+(?:\.\d+)*(?:\.x)?$/;

for (const file of DOCS) {
  if (!existsSync(join(ROOT, file))) {
    report(file, 0, 'Datei fehlt. Liste DOCS in scripts/check-doc-versions.mjs anpassen.');
    continue;
  }
  const project = file.startsWith('cms/') ? 'cms' : 'root';
  const minimum = engineMinimum(project);

  readText(file).split('\n').forEach((text, index) => {
    const line = index + 1;

    for (const { tool, prose } of toolRegexes) {
      for (const match of text.matchAll(prose)) checkToolVersion(file, line, tool, match[1]);
    }

    // Tables: "| Astro | 7.x | ..."
    if (text.trimStart().startsWith('|')) {
      const cells = text.split('|').map((cell) => cell.replace(/[`*]/g, '').trim());
      for (const { tool, cell } of toolRegexes) {
        const at = cells.findIndex((c) => cell.test(c));
        if (at === -1) continue;
        const version = cells.slice(at + 1).find((c) => VERSION_CELL.test(c));
        if (version) checkToolVersion(file, line, tool, version);
      }
    }

    for (const match of text.matchAll(NODE_REGEX)) {
      const [, atLeast, written] = match;
      const manifest = projects[project].manifest;
      if (atLeast && trimZeros(written) !== trimZeros(minimum)) {
        report(file, line, `„Node.js ≥ ${written}“ passt nicht zu engines.node in ${manifest} (>=${minimum}). Erwartet: „Node.js ≥ ${trimZeros(minimum)}“.`);
      } else if (!atLeast && written.split('.')[0] !== minimum.split('.')[0]) {
        report(file, line, `„Node.js ${written}“ passt nicht zu engines.node in ${manifest} (>=${minimum}).`);
      }
    }
  });
}

// One Node.js major for local development, CI and containers
const nvmrc = readText('.nvmrc').trim();
if (!/^\d+$/.test(nvmrc)) report('.nvmrc', 1, `Enthält „${nvmrc}“, erwartet wird nur die Hauptversion (z. B. „22“).`);
for (const [name, { manifest }] of Object.entries(projects)) {
  const major = engineMinimum(name).split('.')[0];
  if (major !== nvmrc) report('.nvmrc', 1, `Node.js ${nvmrc} passt nicht zu engines.node in ${manifest} (>=${engineMinimum(name)}).`);
}

function findFiles(dir, accept) {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' || entry.name.startsWith('.') ? [] : findFiles(path, accept);
    return accept(entry.name) ? [path] : [];
  });
}

const nodePins = [
  { files: findFiles('.github/workflows', (n) => /\.ya?ml$/.test(n)), regex: /node-version:\s*['"]?(\d+)/ },
  { files: findFiles('cms', (n) => n === 'Dockerfile'), regex: /^FROM\s+node:(\d+)/ },
];
for (const { files, regex } of nodePins) {
  for (const file of files) {
    readText(file).split('\n').forEach((text, index) => {
      const match = regex.exec(text);
      if (match && match[1] !== nvmrc) {
        report(relative(ROOT, join(ROOT, file)), index + 1, `Node.js ${match[1]} passt nicht zu .nvmrc (${nvmrc}).`);
      }
    });
  }
}

if (errors.length > 0) {
  console.error(`Versionsangaben widersprechen der einzigen Quelle (guidelines.md §2.2):\n`);
  for (const error of errors) console.error(`  ${error}`);
  console.error(`\n${errors.length} Abweichung(en).`);
  process.exit(1);
}

console.log(`Versionsangaben in ${DOCS.length} Dokumenten, .nvmrc, CI und Dockerfiles sind konsistent.`);
