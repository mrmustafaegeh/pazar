/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: '#12294B',
        primary: '#12294B',
        accent: '#E8A33D',
        success: '#1F9D55',
        background: '#FAFAFA',
        foreground: '#0A0A0A',
        surface: '#FFFFFF',
        muted: '#F5F5F5',
        border: '#E5E5E5',
        destructive: '#DC2626',
        ring: '#12294B',
        neutral: {
          950: '#0A0A0A',
          900: '#171717',
          800: '#262626',
          700: '#404040',
          600: '#737373',
          500: '#A3A3A3',
          400: '#D4D4D4',
          300: '#E5E5E5',
          200: '#F5F5F5',
          100: '#FAFAFA',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
