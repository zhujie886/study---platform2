/** @type {import('tailwindcss').Config} */
const alphaMix = (varName, alpha) => `color-mix(in srgb, var(${varName}) ${alpha}%, transparent)`;

const colorScale = (varName) => ({
  DEFAULT: `var(${varName})`,
  50: alphaMix(varName, 40),
  100: alphaMix(varName, 40),
  200: alphaMix(varName, 40),
  300: alphaMix(varName, 40),
  400: alphaMix(varName, 40),
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
        sans: ['Manrope', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
