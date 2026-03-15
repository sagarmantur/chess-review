import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        board: {
          light: "#f1d9b5",
          dark: "#b58863"
        },
        app: {
          bg: "#111827",
          panel: "#1f2937",
          elevated: "#273449",
          accent: "#16a34a",
          muted: "#94a3b8"
        }
      },
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        body: ["Manrope", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"]
      },
      keyframes: {
        fadeSlide: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        fadeSlide: "fadeSlide 380ms ease-out"
      }
    }
  },
  plugins: []
} satisfies Config;
