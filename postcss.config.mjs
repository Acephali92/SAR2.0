// Tailwind CSS 3 via PostCSS. Replaces the deprecated @astrojs/tailwind integration,
// whose last version (6.0.2) only supports Astro up to 5.
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [tailwindcss, autoprefixer],
};
