/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5E60CE',
          dark: '#7B7FD4',
        },
        secondary: {
          DEFAULT: '#64DFDF',
          dark: '#48B9B9',
        },
        background: {
          DEFAULT: '#F8F9FA',
          dark: '#121212',
        },
        card: {
          DEFAULT: '#FFFFFF',
          dark: '#1E1E1E',
        },
        text: {
          DEFAULT: '#212529',
          dark: '#E0E0E0',
        },
        accent: {
          DEFAULT: '#FF5A5F',
          dark: '#FF7A7F',
        },
      },
    },
  },
  plugins: [],
} 