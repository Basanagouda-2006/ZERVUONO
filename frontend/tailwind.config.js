/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          evergreen: '#183F35',
          forest: '#12372F',
          jade: '#399477',
          mint: '#A5DCC5',
          ivory: '#F6F3EA',
          cream: '#FFFDF7',
          coral: '#F07862',
          amber: '#E9B44C',
          lavender: '#A59AD6',
          sage: '#B8CDBA',
          turquoise: '#79C8BD',
          dark: {
            bg: '#0F1A17',
            card: '#152521',
            border: '#223832',
            hover: '#1B2E29',
            text: '#E2E8F0',
            muted: '#94A3B8',
          }
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(24, 63, 53, 0.08)',
        'card': '0 10px 30px -4px rgba(24, 63, 53, 0.06), 0 2px 6px -1px rgba(24, 63, 53, 0.04)',
        'elevated': '0 20px 40px -6px rgba(24, 63, 53, 0.12), 0 8px 16px -4px rgba(24, 63, 53, 0.06)',
      }
    },
  },
  plugins: [],
}
