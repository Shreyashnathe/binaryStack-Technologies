/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Source Sans 3', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#eef4ff',
          100: '#dbe8ff',
          200: '#bdd3ff',
          300: '#94b5ff',
          400: '#668ff6',
          500: '#3b6de4',
          600: '#2a57bf',
          700: '#23479a',
          800: '#223f7c',
          900: '#213660',
        },
        dark: {
          900: '#f3f6fb',
          800: '#ffffff',
          700: '#d8e0ec',
          600: '#b6c3d6',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
