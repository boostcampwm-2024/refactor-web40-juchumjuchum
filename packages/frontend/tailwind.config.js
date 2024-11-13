/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
    colors: {
      'light-gray': '#d9d9d9',
      gray: '#8c8c8c',
      'dark-gray': '#4f4f4f',
      black: '#000000',
      white: '#ffffff',
      'light-yellow': '#ffdcac',
      'light-orange': '#ffcfac',
      orange: '#ffa868',
      red: '#ff4d4d',
      green: '#7eeb7e',
      blue: '#1a75ff',
    },
  },
  plugins: [],
};
