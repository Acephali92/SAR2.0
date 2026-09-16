/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],

  theme: {
    extend: {
      // Custom color palette — values come from the CSS custom properties
      // defined in src/styles/global.css (single source of truth).
      colors: {
        // Backgrounds / borders
        surface: {
          800: 'rgb(var(--color-bg-secondary) / <alpha-value>)',
          700: 'rgb(var(--color-border) / <alpha-value>)',
          600: 'rgb(var(--color-border-strong) / <alpha-value>)',
        },
        // Text colors
        content: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--color-text-tertiary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        },
        // Accent colors
        accent: {
          amber: 'rgb(var(--color-accent-warning) / <alpha-value>)',
          red: 'rgb(var(--color-accent-danger) / <alpha-value>)',
          emerald: 'rgb(var(--color-accent-success) / <alpha-value>)',
          sky: 'rgb(var(--color-accent-info) / <alpha-value>)',
        },
        // Brand colors (CTA red / cyan-blue, with hover/active variants)
        brand: {
          red: {
            DEFAULT: 'rgb(var(--color-brand-red) / <alpha-value>)',
            hover: 'rgb(var(--color-brand-red-hover) / <alpha-value>)',
            active: 'rgb(var(--color-brand-red-active) / <alpha-value>)',
          },
          cyan: {
            DEFAULT: 'rgb(var(--color-brand-cyan) / <alpha-value>)',
            hover: 'rgb(var(--color-brand-cyan-hover) / <alpha-value>)',
          },
        },
      },

      // IBM Plex font stack
      fontFamily: {
        sans: [
          'IBM Plex Sans',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        serif: [
          'IBM Plex Serif',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'serif',
        ],
        mono: [
          'IBM Plex Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Consolas',
          'monospace',
        ],
      },

      // Typography scale (fluid)
      fontSize: {
        xs: ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.5' }],
        sm: ['clamp(0.875rem, 0.8rem + 0.35vw, 1rem)', { lineHeight: '1.5' }],
        base: ['clamp(1rem, 0.9rem + 0.5vw, 1.125rem)', { lineHeight: '1.7' }],
        lg: ['clamp(1.125rem, 1rem + 0.6vw, 1.25rem)', { lineHeight: '1.6' }],
        xl: ['clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)', { lineHeight: '1.5' }],
        '2xl': ['clamp(1.5rem, 1.25rem + 1.25vw, 2rem)', { lineHeight: '1.4' }],
        '3xl': ['clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem)', { lineHeight: '1.3' }],
        '4xl': ['clamp(2.25rem, 1.75rem + 2.5vw, 3rem)', { lineHeight: '1.2' }],
        '5xl': ['clamp(3rem, 2rem + 5vw, 4rem)', { lineHeight: '1.1' }],
      },

      // Spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // Max widths for content
      maxWidth: {
        'content': '72rem',
        'prose': '65ch',
        'narrow': '45ch',
      },

      // Border radius
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
      },

      // Custom animations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },

  plugins: [
    require('@tailwindcss/typography'),
  ],
};
