/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        cream: '#FFF8EC',
        tomato: '#D94F3D',
        basil: '#4D8B68',
        cheese: '#F6C64C',
        cocoa: '#3D2A20',
        peach: '#FCE5D9',
      },
    },
  },
  plugins: [],
}
