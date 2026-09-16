#!/usr/bin/env node
/*
 * Link Checker for Static Site
 *
 * Checks all internal href and src attributes in dist/*.html
 * against existing files. Exits with code 1 if any links are broken.
 *
 * Usage: node scripts/check-links.mjs
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');

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

// Extract links from HTML content
function extractLinks(html, filePath) {
  const links = [];

  // Match href="..." and src="..."
  const hrefRegex = /(?:href|src)=["']([^"']+)["']/g;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    links.push({ url: match[1], file: filePath });
  }

  // Match og:image content
  const ogRegex = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/gi;
  while ((match = ogRegex.exec(html)) !== null) {
    links.push({ url: match[1], file: filePath, type: 'og:image' });
  }

  // Also check reverse order (content before property)
  const ogRegex2 = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/gi;
  while ((match = ogRegex2.exec(html)) !== null) {
    links.push({ url: match[1], file: filePath, type: 'og:image' });
  }

  return links;
}

// Check if a link resolves to a file
function checkLink(url, sourceFile) {
  // Skip external links
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    return { valid: true, external: true };
  }

  // Skip mailto, tel, javascript, data URIs
  if (url.startsWith('mailto:') || url.startsWith('tel:') ||
      url.startsWith('javascript:') || url.startsWith('data:') ||
      url.startsWith('#')) {
    return { valid: true, special: true };
  }

  // Handle absolute paths (starting with /)
  let targetPath;
  if (url.startsWith('/')) {
    // Remove query string and hash
    const cleanUrl = url.split('?')[0].split('#')[0];
    targetPath = join(DIST_DIR, cleanUrl);
  } else {
    // Relative path
    const cleanUrl = url.split('?')[0].split('#')[0];
    targetPath = join(dirname(sourceFile), cleanUrl);
  }

  // Check if file exists directly
  if (existsSync(targetPath)) {
    return { valid: true };
  }

  // Check if it's a directory with index.html
  if (existsSync(join(targetPath, 'index.html'))) {
    return { valid: true };
  }

  // Check without trailing slash
  if (targetPath.endsWith('/')) {
    const withoutSlash = targetPath.slice(0, -1);
    if (existsSync(withoutSlash)) {
      return { valid: true };
    }
    if (existsSync(join(withoutSlash, 'index.html'))) {
      return { valid: true };
    }
  }

  return { valid: false, resolved: targetPath };
}

// Main
function main() {
  console.log('🔍 Checking links in dist/...\n');

  if (!existsSync(DIST_DIR)) {
    console.error('❌ dist/ directory not found. Run npm run build first.');
    process.exit(1);
  }

  const htmlFiles = getHtmlFiles(DIST_DIR);
  console.log(`Found ${htmlFiles.length} HTML files\n`);

  const brokenLinks = [];
  const checkedUrls = new Set();

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8');
    const links = extractLinks(html, file);

    for (const link of links) {
      // Create unique key for deduplication
      const key = `${link.url}|${file}`;
      if (checkedUrls.has(key)) continue;
      checkedUrls.add(key);

      const result = checkLink(link.url, file);
      if (!result.valid) {
        brokenLinks.push({
          url: link.url,
          file: file.replace(DIST_DIR, ''),
          type: link.type || 'link',
          resolved: result.resolved?.replace(DIST_DIR, '')
        });
      }
    }
  }

  if (brokenLinks.length === 0) {
    console.log('✅ All links are valid!\n');
    process.exit(0);
  } else {
    console.log(`❌ Found ${brokenLinks.length} broken link(s):\n`);
    for (const link of brokenLinks) {
      console.log(`  ${link.type}: ${link.url}`);
      console.log(`    in: ${link.file}`);
      if (link.resolved) {
        console.log(`    resolved to: ${link.resolved}`);
      }
      console.log();
    }
    process.exit(1);
  }
}

main();
