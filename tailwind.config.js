/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: '#f6f1eb',
        pine: '#0f766e',
        mist: '#e7efec',
        charcoal: '#1f2933',
        champagne: '#f7ede2',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 50px rgba(15, 118, 110, 0.1)',
      },
    },
  },
  plugins: [],
}
