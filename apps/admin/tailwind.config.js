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
        background: '#F9FAFB',
        foreground: '#111827',
        muted: '#F3F4F6',
        border: '#E5E7EB',
        destructive: '#DC2626',
        ring: '#12294B',
        surface: '#FFFFFF',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
