// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://stoppramstein.de',
  output: 'static',
  trailingSlash: 'always',

  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
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
    },
  },
});
