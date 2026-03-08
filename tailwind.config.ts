import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0b0b0e",
        card: "#141419",
        foreground: "#f5f5f5",
        muted: "#9ca3af",
        border: "#2b2b35",
        accent: "#d4af37"
      }
    }
  },
  plugins: []
};

export default config;
