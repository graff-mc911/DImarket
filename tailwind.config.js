/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F97316',
          soft: 'rgba(249, 115, 22, 0.14)',
          glass: 'rgba(249, 115, 22, 0.78)',
          hover: '#EA580C',
        },

        secondary: {
          DEFAULT: '#14B8A6',
          soft: 'rgba(20, 184, 166, 0.12)',
          glass: 'rgba(20, 184, 166, 0.65)',
          hover: '#0F766E',
        },

        cream: {
          DEFAULT: '#FAFAF7',
          50: '#FFFDFC',
          100: '#FAFAF7',
        },

        ink: {
          DEFAULT: '#1F2937',
          soft: '#6B7280',
        },
      },

      boxShadow: {
        glass: '0 18px 45px rgba(15, 23, 42, 0.08)',
        soft: '0 10px 30px rgba(15, 23, 42, 0.06)',
      },

      borderRadius: {
        glass: '24px',
      },
    },
  },

  plugins: [],
}