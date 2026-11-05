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
 * engines.node, and if .nvmrc, the CI workflows and the DOCKERFILES disagree
 * on the Node.js major.
 *
 * Deliberately not checked: docs/AENDERUNGSPROTOKOLL.md (historical versions)
 * and docs/OFFENE-PUNKTE.md (discusses upcoming majors).
 *
 * Usage: node scripts/check-doc-versions.mjs
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { dirname, resolve, sep } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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
const DOCKERFILES = ['cms/Dockerfile', 'cms/webhook/Dockerfile', 'cms/backup/Dockerfile'];
const WORKFLOWS_DIR = '.github/workflows';

// All paths are constants of this script or file names from WORKFLOWS_DIR.
// The check below keeps every one of them inside the repository.
function repoPath(path) {
  // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
  const full = resolve(ROOT, path);
  if (!full.startsWith(ROOT + sep)) throw new Error(`${path} liegt außerhalb des Repositorys`);
  return full;
}
const readText = (path) => readFileSync(repoPath(path), 'utf8');
const readJson = (path) => JSON.parse(readText(path));

const projects = {
  root: { manifest: 'package.json', pkg: readJson('package.json') },
  cms: { manifest: 'cms/package.json', pkg: readJson('cms/package.json') },
};
const rootLock = readJson('package-lock.json');

// aliases: how docs write the name (must match TOOL_NAMES below);
// version(): the version from the single source
const TOOLS = [
  { name: 'Astro', aliases: ['Astro'], version: () => dep('root', 'astro') },
  { name: 'Tailwind CSS', aliases: ['Tailwind CSS', 'Tailwind'], version: () => dep('root', 'tailwindcss') },
  { name: '@tailwindcss/typography', aliases: ['@tailwindcss/typography'], version: () => dep('root', '@tailwindcss/typography') },
  { name: 'TypeScript', aliases: ['TypeScript'], version: () => dep('root', 'typescript') },
  { name: 'Pagefind', aliases: ['Pagefind'], version: () => dep('root', 'pagefind') },
  { name: 'sharp', aliases: ['sharp'], version: () => dep('root', 'sharp') },
  { name: 'Vite', aliases: ['Vite'], version: () => locked('node_modules/vite'), source: 'package-lock.json (über Astro)' },
  { name: 'Payload CMS', aliases: ['Payload CMS', 'Payload'], version: () => dep('cms', 'payload'), source: 'cms/package.json' },
  { name: 'Next.js', aliases: ['Next.js'], version: () => dep('cms', 'next'), source: 'cms/package.json' },
];

// Same names as the aliases above, longer variants first.
// Prose: "Astro 7", "Astro 7.x", "Astro-7-Standard"; not "@astrojs" or "Astro islands"
const PROSE_REGEX = /(?<![\w@/.-])(Astro|Tailwind CSS|Tailwind|@tailwindcss\/typography|TypeScript|Pagefind|sharp|Vite|Payload CMS|Payload|Next\.js)[ -](\d+(?:\.\d+)*(?:\.x)?)(?![\d.])/g;
// Table cell holding exactly a tool name: "| Astro | 7.x | ..."
const CELL_REGEX = /^(?:Astro|Tailwind CSS|Tailwind|@tailwindcss\/typography|TypeScript|Pagefind|sharp|Vite|Payload CMS|Payload|Next\.js)$/;
const VERSION_CELL = /^\d+(?:\.\d+)*(?:\.x)?$/;
const NODE_REGEX = /\bNode\.js\s*(≥|>=)?\s*(\d+(?:\.\d+)*)(?:\.x)?/g;

const errors = [];
const report = (file, line, message) => errors.push(`${file}:${line}: ${message}`);

function toolFor(name) {
  const tool = TOOLS.find((t) => t.aliases.includes(name));
  if (!tool) throw new Error(`Kein Eintrag in TOOLS für „${name}“`);
  return tool;
}

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

function checkDoc(file) {
  const project = file.startsWith('cms/') ? 'cms' : 'root';
  const minimum = engineMinimum(project);
  const manifest = projects[project].manifest;

  readText(file).split('\n').forEach((text, index) => {
    const line = index + 1;

    for (const [, name, written] of text.matchAll(PROSE_REGEX)) {
      checkToolVersion(file, line, toolFor(name), written);
    }

    if (text.trimStart().startsWith('|')) {
      const cells = text.split('|').map((cell) => cell.replace(/[`*]/g, '').trim());
      cells.forEach((cell, at) => {
        if (!CELL_REGEX.test(cell)) return;
        const version = cells.slice(at + 1).find((c) => VERSION_CELL.test(c));
        if (version) checkToolVersion(file, line, toolFor(cell), version);
      });
    }

    for (const [, atLeast, written] of text.matchAll(NODE_REGEX)) {
      if (atLeast && trimZeros(written) !== trimZeros(minimum)) {
        report(file, line, `„Node.js ≥ ${written}“ passt nicht zu engines.node in ${manifest} (>=${minimum}). Erwartet: „Node.js ≥ ${trimZeros(minimum)}“.`);
      } else if (!atLeast && written.split('.')[0] !== minimum.split('.')[0]) {
        report(file, line, `„Node.js ${written}“ passt nicht zu engines.node in ${manifest} (>=${minimum}).`);
      }
    }
  });
}

// One Node.js major for local development, CI and containers
function checkNodePins() {
  const nvmrc = readText('.nvmrc').trim();
  if (!/^\d+$/.test(nvmrc)) report('.nvmrc', 1, `Enthält „${nvmrc}“, erwartet wird nur die Hauptversion (z. B. „22“).`);
  for (const [name, { manifest }] of Object.entries(projects)) {
    const minimum = engineMinimum(name);
    if (minimum.split('.')[0] !== nvmrc) report('.nvmrc', 1, `Node.js ${nvmrc} passt nicht zu engines.node in ${manifest} (>=${minimum}).`);
  }

  const workflows = readdirSync(repoPath(WORKFLOWS_DIR))
    .filter((name) => /\.ya?ml$/.test(name))
    .map((name) => `${WORKFLOWS_DIR}/${name}`);
  const pins = [
    ...workflows.map((file) => ({ file, regex: /node-version:\s*['"]?(\d+)/ })),
    ...DOCKERFILES.map((file) => ({ file, regex: /^FROM\s+node:(\d+)/ })),
  ];
  for (const { file, regex } of pins) {
    if (!existsSync(repoPath(file))) {
      report(file, 0, 'Datei fehlt. Liste DOCKERFILES in scripts/check-doc-versions.mjs anpassen.');
      continue;
    }
    readText(file).split('\n').forEach((text, index) => {
      const match = regex.exec(text);
      if (match && match[1] !== nvmrc) report(file, index + 1, `Node.js ${match[1]} passt nicht zu .nvmrc (${nvmrc}).`);
    });
  }
}

for (const file of DOCS) {
  if (existsSync(repoPath(file))) checkDoc(file);
  else report(file, 0, 'Datei fehlt. Liste DOCS in scripts/check-doc-versions.mjs anpassen.');
}
checkNodePins();

if (errors.length > 0) {
  console.error(`Versionsangaben widersprechen der einzigen Quelle (guidelines.md §2.2):\n`);
  for (const error of errors) console.error(`  ${error}`);
  console.error(`\n${errors.length} Abweichung(en).`);
  process.exit(1);
}

console.log(`Versionsangaben in ${DOCS.length} Dokumenten, .nvmrc, CI und Dockerfiles sind konsistent.`);
