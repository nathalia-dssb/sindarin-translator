/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  prefix: 'tw-',  // Using a prefix to avoid conflicts with existing classes
  theme: {
    extend: {
      fontFamily: {
        'vt323': ['VT323', 'monospace'],
        'jacquarda': ['Jacquarda Bastarda 9', 'serif']
      }
    },
  },
  plugins: [],
}