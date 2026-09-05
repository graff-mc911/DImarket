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
          DEFAULT: '#2f2a24',
          soft: '#6f665d',
        },
      },

      boxShadow: {
        glass: '0 18px 45px rgba(47, 42, 36, 0.08)',
        soft: '0 10px 30px rgba(47, 42, 36, 0.06)',
      },

      borderRadius: {
        glass: '0px',
      },
    },

    /* Square corners everywhere — owner cabinet keeps its own rounded-[Npx] */
    borderRadius: {
      none: '0px',
      sm: '0px',
      DEFAULT: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      '2xl': '0px',
      '3xl': '0px',
      full: '0px',
    },
  },

  plugins: [],
}
