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
          DEFAULT: "#f7f4ef",
          dark: "#efeae2",
        },
        ink: {
          DEFAULT: "#1a1816",
          muted: "#6b6560",
        },
        accent: {
          DEFAULT: "#5b4a3f",
          light: "#8b7355",
        },
        gold: "#c4a574",
        border: "#e5dfd6",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 4px 24px rgba(26, 24, 22, 0.06)",
        card: "0 2px 12px rgba(26, 24, 22, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
