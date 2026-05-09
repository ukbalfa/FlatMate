/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          400: "#FFD700",
          900: "#B8860B",
        },
        teal: {
          500: "#008080",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        mono: ["var(--font-fira)", "monospace"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};