/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      borderColor: {
        border: 'var(--color-border)',
      },
      colors: {
        background: 'var(--color-background)',
        border: 'var(--color-border)',
        card: 'var(--color-card)',
        foreground: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        primary: 'var(--color-primary)',
        'primary-foreground': 'var(--color-primary-contrast)',
        secondary: 'var(--color-secondary)',
      },
      borderRadius: {
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      },
    },
  },
  plugins: [],
};
