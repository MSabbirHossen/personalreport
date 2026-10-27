/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans Bengali"', '"Hind Siliguri"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', '"Noto Sans Bengali"', 'sans-serif'],
        bangla: ['"Noto Sans Bengali"', '"Hind Siliguri"', 'sans-serif'],
        latin: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        arabic: ['"Noto Sans Arabic"', '"Noto Naskh Arabic"', 'sans-serif'],
      },
      colors: {
        // Heritage Brand Palette
        heritage: {
          bangladesh: '#006A4E',
          saudi: '#0B6B3A',
          red: '#E63946',
          'green-bright': '#0AA879',
        },
        // Semantic Token Colors
        theme: {
          bg: 'var(--bg)',
          surface: 'var(--surface)',
          'surface-raised': 'var(--surface-raised)',
          'surface-muted': 'var(--surface-muted)',
          text: 'var(--text)',
          'text-muted': 'var(--text-muted)',
          'text-subtle': 'var(--text-subtle)',
          border: 'var(--border)',
          'border-strong': 'var(--border-strong)',
          primary: 'var(--primary)',
          'primary-hover': 'var(--primary-hover)',
          'primary-contrast': 'var(--primary-contrast)',
          accent: 'var(--accent)',
          'accent-soft': 'var(--accent-soft)',
          success: 'var(--success)',
          info: 'var(--info)',
          warning: 'var(--warning)',
          danger: 'var(--danger)',
        },
        // Backward-compatible brand shades with Saudi & Bangladesh primary roots
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#34d399',
          500: '#10b981',
          600: '#006a4e', // Bangladesh primary green
          700: '#0b6b3a', // Saudi secondary green
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
      },
    },
  },
  plugins: [],
};
