#!/usr/bin/env node
/*
 * CSP Compliance Checker for Static Site
 *
 * Production uses `script-src 'self'` and `img-src 'self' data:` (see CLAUDE.md,
 * deploy/). Scans dist/*.html for inline <script> tags (no src attribute),
 * inline event handler attributes (onclick, onload, ...), cross-origin images
 * and references to the CMS media endpoint (/api/media/), all of which break
 * that policy or the "site survives CMS outage" rule. Exits with code 1 if any
 * violations are found.
 *
 * Usage: node scripts/check-csp.mjs
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');

// Script types that never execute as JavaScript and are unaffected by script-src
const NON_EXECUTABLE_SCRIPT_TYPES = ['application/ld+json', 'application/json', 'importmap', 'speculationrules'];

// Event handler attributes that execute inline JS
const EVENT_HANDLER_ATTRS = [
  'onclick', 'onload', 'onerror', 'onsubmit', 'onchange', 'oninput',
  'onmouseover', 'onmouseout', 'onkeydown', 'onkeyup', 'onfocus', 'onblur',
];

// Collect all HTML files recursively
function getHtmlFiles(dir, files = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      getHtmlFiles(fullPath, files);
    } else if (entry.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Find CSP violations in HTML content
function findViolations(html, filePath) {
  const violations = [];

  // Inline <script> tags without a src attribute
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const [, attrs, body] = match;
    if (/\bsrc\s*=/.test(attrs)) continue; // external script, fine

    const typeMatch = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i);
    const type = typeMatch ? typeMatch[1].toLowerCase() : 'text/javascript';
    if (NON_EXECUTABLE_SCRIPT_TYPES.includes(type)) continue;

    if (body.trim().length > 0) {
      violations.push({
        file: filePath,
        type: 'inline-script',
        excerpt: body.trim().slice(0, 80).replace(/\s+/g, ' '),
      });
    }
  }

  // Inline event handler attributes
  const tagRegex = /<[a-z][a-z0-9-]*\b[^>]*>/gi;
  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[0];
    for (const attr of EVENT_HANDLER_ATTRS) {
      const attrRegex = new RegExp(`\\b${attr}\\s*=`, 'i');
      if (attrRegex.test(tag)) {
        violations.push({
          file: filePath,
          type: `inline-handler (${attr})`,
          excerpt: tag.slice(0, 80).replace(/\s+/g, ' '),
        });
      }
    }
  }

  // img-src 'self' data: - Bilder (<img>, <source>) duerfen nur von der eigenen Seite kommen.
  const imageTagRegex = /<(?:img|source)\b[^>]*>/gi;
  while ((match = imageTagRegex.exec(html)) !== null) {
    const tag = match[0];
    const urls = [];
    const src = tag.match(/\bsrc\s*=\s*["']([^"']*)["']/i);
    if (src) urls.push(src[1]);
    const srcset = tag.match(/\bsrcset\s*=\s*["']([^"']*)["']/i);
    if (srcset) urls.push(...srcset[1].split(',').map((part) => part.trim().split(/\s+/)[0]));
    for (const url of urls) {
      if (/^(https?:)?\/\//i.test(url)) {
        violations.push({ file: filePath, type: "cross-origin-image (img-src 'self')", excerpt: url.slice(0, 80) });
      }
    }
  }

  // Verweise auf Payloads Medien-Endpunkt: die statische Seite darf das CMS zur Laufzeit nicht
  // brauchen (und /api/media ist anonym gesperrt). payload-loader.ts spiegelt Medien nach /media/cms/.
  const cmsMediaRegex = /\b(?:src|srcset|href)\s*=\s*["'][^"']*\/api\/media\/[^"']*["']/gi;
  while ((match = cmsMediaRegex.exec(html)) !== null) {
    violations.push({ file: filePath, type: 'cms-runtime-reference (/api/media)', excerpt: match[0].slice(0, 80) });
  }

  return violations;
}

// Main
function main() {
  console.log('🔍 Checking CSP compliance in dist/...\n');

  if (!existsSync(DIST_DIR)) {
    console.error('❌ dist/ directory not found. Run npm run build first.');
    process.exit(1);
  }

  const htmlFiles = getHtmlFiles(DIST_DIR);
  console.log(`Found ${htmlFiles.length} HTML files\n`);

  const allViolations = [];
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8');
    const violations = findViolations(html, file);
    for (const v of violations) {
      allViolations.push({ ...v, file: file.replace(DIST_DIR, '') });
    }
  }

  if (allViolations.length === 0) {
    console.log("✅ No CSP violations found (script-src 'self' compatible)!\n");
    process.exit(0);
  } else {
    console.log(`❌ Found ${allViolations.length} CSP violation(s):\n`);
    for (const v of allViolations) {
      console.log(`  ${v.type}: ${v.excerpt}`);
      console.log(`    in: ${v.file}`);
      console.log();
    }
    process.exit(1);
  }
}

main();
