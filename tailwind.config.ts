import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#faf8ff",
          dark: "#f3efff",
        },
        ink: {
          DEFAULT: "#1e1033",
          muted: "#6b5b7a",
        },
        accent: {
          DEFAULT: "#a855f7",
          light: "#c084fc",
          dark: "#7c3aed",
        },
        pink: {
          DEFAULT: "#ec4899",
          light: "#f472b6",
          soft: "#fce7f3",
        },
        gold: "#f59e0b",
        border: "#e9e0f5",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 8px 32px rgba(124, 58, 237, 0.12)",
        card: "0 4px 20px rgba(124, 58, 237, 0.08)",
        glow: "0 0 40px rgba(236, 72, 153, 0.25)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #7c3aed 0%, #a855f7 45%, #ec4899 100%)",
        "brand-soft":
          "linear-gradient(135deg, #faf5ff 0%, #fce7f3 50%, #eff6ff 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
