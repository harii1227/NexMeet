/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#0a0a0f",
          800: "#111118",
          700: "#16161f",
          600: "#1e1e2a",
        },
      },
    },
  },
  plugins: [],
};
