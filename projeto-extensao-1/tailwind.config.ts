import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        // Premium Dark Mode - Oreia Cuts Branding
        premium: {
          dark: "#0a0a0a",      // Main background
          red: "#cc0000",        // Primary action (buttons)
          blue: "#0047ab",       // Secondary highlight
          light: "#ededed",      // Light text
        },
        // Maintain compatibility with existing colors temporarily
        "brand-primary": "#cc0000",
        "brand-secondary": "#0047ab",
        "brand-dark": "#0a0a0a",
      },
    },
  },
  plugins: [],
};

export default config;
