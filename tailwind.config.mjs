/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],

  darkMode: 'class',

  theme: {
    extend: {
      // Custom color palette
      colors: {
        // Primary backgrounds
        surface: {
          900: '#0a0f14',
          800: '#111827',
          700: '#1f2937',
          600: '#374151',
        },
        // Text colors
        content: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#64748b',
        },
        // Accent colors
        accent: {
          amber: '#f59e0b',
          red: '#dc2626',
          emerald: '#059669',
          sky: '#0ea5e9',
        },
        // Semantic colors
        warning: '#f59e0b',
        danger: '#dc2626',
        success: '#059669',
        info: '#0ea5e9',
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
