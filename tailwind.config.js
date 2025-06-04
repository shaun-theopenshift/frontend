/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#41169E',
          coral: '#FF5665B',
          mint: '#A88ECF',
          light: '#F4F4F4',
          dark: '#2954bd', // for button outlines
          accent: '#f07057',
          bgLight: '#aee0d5',
        },
      },
    },
  },
  plugins: [],
} 