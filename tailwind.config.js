import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#ecfdf8", 100: "#d1faec", 400: "#34cfa5", 500: "#12b389", 600: "#0a8f6f", 700: "#0a725a" },
      },
    },
  },
  plugins: [typography],
};
