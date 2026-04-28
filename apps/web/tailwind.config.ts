import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Consolas", "Liberation Mono", "monospace"],
      },
      colors: {
        graphite: {
          950: "oklch(13.5% 0.008 180)",
          900: "oklch(17% 0.009 180)",
          850: "oklch(20% 0.009 180)",
          800: "oklch(24% 0.01 180)",
          700: "oklch(33% 0.012 180)",
        },
        scan: {
          300: "oklch(79% 0.12 190)",
          400: "oklch(70% 0.14 190)",
        },
        signal: {
          300: "oklch(80% 0.13 152)",
          400: "oklch(70% 0.15 152)",
        },
      },
      boxShadow: {
        panel: "0 18px 44px -26px rgba(0, 0, 0, 0.75)",
      },
    },
  },
  plugins: [],
} satisfies Config;
