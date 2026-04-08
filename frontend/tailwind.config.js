/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['sohne', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['gt-super', 'Georgia', 'Cambria', 'serif'],
      },
      colors: {
        cream: '#faf9f7',
        'medium-green': '#1a8917',
        'medium-black': '#242424',
        'medium-gray': '#6b6b6b',
        'medium-border': '#e6e6e6',
      },
    },
  },
  plugins: [],
};
