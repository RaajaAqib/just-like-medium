/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
      },
      colors: {
        brand: {
          50: '#fdf8ee',
          100: '#faefd0',
          200: '#f4db9d',
          300: '#eec063',
          400: '#e8a434',
          500: '#e08c1b',
          600: '#c46e13',
          700: '#a35114',
          800: '#844116',
          900: '#6c3616',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [],
};
