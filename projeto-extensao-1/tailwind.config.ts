import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        oreia: {
          white: "#ffffff",
          surface: "#f5f5f5",
          border: "#e8e8e8",
          muted: "#888888",
          text: "#0a0a0a",
          red: "#cc0000",
          blue: "#0047ab",
        },
      },
    },
  },
  plugins: [],
};

export default config;
