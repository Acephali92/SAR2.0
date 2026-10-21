// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://stoppramstein.de',
  output: 'static',
  trailingSlash: 'always',
  // Astro 7 defaults to 'jsx', which strips whitespace between inline elements
  // (e.g. "Datenschutz · Impressum" -> "Datenschutz·Impressum"). Keep the previous behavior.
  compressHTML: true,

  // Tailwind CSS runs via postcss.config.mjs
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'de',
        locales: {
          de: 'de-DE',
        },
      },
    }),
  ],

  // Markdown configuration
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },

  // Build optimizations
  build: {
    inlineStylesheets: 'auto',
  },

  // Development server
  server: {
    port: 4321,
    host: false,
  },

  // Vite configuration
  vite: {
    build: {
      cssMinify: true,
      // Keep the CSS browser support of Vite 6 (Astro 5) instead of Vite 8's newer default
      // (Chrome 111, Firefox 114, Safari 16.4). No JS target needed: there are no bundled scripts.
      cssTarget: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    },
  },
});
