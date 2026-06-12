/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary:  '#28A5A0',
          light:    '#61DAD3',
          navy:     '#2C3687',
          surface:  '#F0FDFB',
        }
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
