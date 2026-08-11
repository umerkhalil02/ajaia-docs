/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1a1a2e',
        paper: '#fdfdfb',
        accent: '#3b5bdb',
      },
    },
  },
  plugins: [],
};
