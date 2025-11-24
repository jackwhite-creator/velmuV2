/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          quaternary: 'var(--bg-quaternary)',
          floating: 'var(--bg-floating)',
          'modifier-hover': 'var(--bg-modifier-hover)',
          'modifier-selected': 'var(--bg-modifier-selected)',
        },
        text: {
          header: 'var(--text-header)',
          normal: 'var(--text-normal)',
          muted: 'var(--text-muted)',
        },
        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
        },
        status: {
          green: 'var(--green)',
          danger: 'var(--red)',
          warning: 'var(--yellow)',
        }
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        DEFAULT: '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        'full': '9999px',
      }
    },
  },
  plugins: [],
}