/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        slate: { 850: '#151e32', 950: '#020617' },
        cyan: { 450: '#00a8cc' },
        // Semantic Theme Colors (mapped to CSS variables)
        main: 'var(--bg-main)',
        sidebar: 'var(--bg-sidebar)',
        card: 'var(--bg-card)',
        'card-hover': 'var(--bg-card-hover)',
        input: 'var(--bg-input)',
        'input-border': 'var(--bg-input-border)',
        'text-main': 'var(--text-primary)',
        'text-muted': 'var(--text-secondary)',
        'border-main': 'var(--border-color)',
        'border-light': 'var(--border-color-light)',
        accent: 'var(--accent-primary)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
            '0%': { opacity: 0.5 },
            '100%': { opacity: 1 },
        }
      }
    },
  },
  plugins: [],
}