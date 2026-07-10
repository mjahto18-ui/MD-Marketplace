/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'md-purple': '#6B21A8',
        'md-pink': '#EC4899',
        'md-blue': '#1E3A8A',
        'md-dark': '#0F172A',
      }
    },
  },
  plugins: [],
}