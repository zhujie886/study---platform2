/** @type {import('tailwindcss').Config} */
const colorScale = (varName) => ({
  DEFAULT: `var(${varName})`,
  50: `var(${varName})`,
  100: `var(${varName})`,
  200: `var(${varName})`,
  300: `var(${varName})`,
  400: `var(${varName})`,
  500: `var(${varName})`,
  600: `var(${varName})`,
  700: `var(${varName})`,
  800: `var(${varName})`,
  900: `var(${varName})`,
});

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: colorScale('--primary-color'),
        secondary: colorScale('--secondary-color'),
        accent: colorScale('--accent-color'),
        'main-text': 'var(--text-main)',
        'main-bg': 'var(--background-main)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
