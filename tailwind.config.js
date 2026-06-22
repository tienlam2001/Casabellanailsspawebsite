/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: '#fffdf9',
        pine: '#2bb594',
        mist: '#eef9f5',
        charcoal: '#1f2933',
        champagne: '#fff6e8',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 50px rgba(255, 214, 130, 0.22)',
        glow: '0 0 60px rgba(255, 224, 158, 0.45)',
      },
    },
  },
  plugins: [],
}
