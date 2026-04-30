import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      colors: {
        graphite: {
          950: 'oklch(13.5% 0.008 180)',
          900: 'oklch(17% 0.009 180)',
          850: 'oklch(20% 0.009 180)',
          800: 'oklch(24% 0.01 180)',
          700: 'oklch(33% 0.012 180)',
          300: 'oklch(94% 0.006 180 / 0.14)',
          200: 'oklch(94% 0.006 180 / 0.10)',
          100: 'oklch(94% 0.006 180 / 0.07)',
        },
        signal: {
          DEFAULT: 'oklch(80% 0.13 152)',
          300: 'oklch(80% 0.13 152)',
          400: 'oklch(70% 0.15 152)',
          '/08': 'oklch(80% 0.13 152 / 0.08)',
          '/10': 'oklch(80% 0.13 152 / 0.10)',
          '/15': 'oklch(80% 0.13 152 / 0.15)',
          '/25': 'oklch(80% 0.13 152 / 0.25)',
          '/30': 'oklch(80% 0.13 152 / 0.30)',
          '/40': 'oklch(80% 0.13 152 / 0.40)',
          '/45': 'oklch(80% 0.13 152 / 0.45)',
        },
        amber: {
          DEFAULT: 'oklch(82% 0.13 88)',
          300: 'oklch(82% 0.13 88)',
          400: 'oklch(76% 0.14 88)',
          '/08': 'oklch(82% 0.13 88 / 0.08)',
          '/10': 'oklch(82% 0.13 88 / 0.10)',
          '/30': 'oklch(82% 0.13 88 / 0.30)',
          '/40': 'oklch(82% 0.13 88 / 0.40)',
        },
        scan: {
          DEFAULT: 'oklch(79% 0.12 190)',
          300: 'oklch(79% 0.12 190)',
          400: 'oklch(70% 0.14 190)',
          '/08': 'oklch(79% 0.12 190 / 0.08)',
          '/10': 'oklch(79% 0.12 190 / 0.10)',
          '/25': 'oklch(79% 0.12 190 / 0.25)',
          '/30': 'oklch(79% 0.12 190 / 0.30)',
          '/40': 'oklch(79% 0.12 190 / 0.40)',
        },
        red: {
          DEFAULT: 'oklch(76% 0.14 25)',
          300: 'oklch(76% 0.14 25)',
          400: 'oklch(68% 0.15 25)',
          '/10': 'oklch(76% 0.14 25 / 0.10)',
          '/30': 'oklch(76% 0.14 25 / 0.30)',
          '/40': 'oklch(76% 0.14 25 / 0.40)',
        },
      },
      boxShadow: {
        panel: '0 18px 44px -26px rgba(0, 0, 0, 0.75)',
      },
    },
  },
  plugins: [],
} satisfies Config;
