import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--brand-primary)",
          primaryHover: "var(--brand-primary-hover)",
          accent: "var(--brand-accent)",
          accentHover: "var(--brand-accent-hover)",
          bg: "var(--brand-bg)",
          card: "var(--brand-card)",
          border: "var(--brand-border)",
          text: "var(--brand-text)",
          muted: "var(--brand-muted)",
          soft: "var(--brand-soft)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
