import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: 'var(--color-paper)',
        'paper-raised': 'var(--color-paper-raised)',
        ink: {
          DEFAULT: 'var(--color-ink)',
          soft: 'var(--color-ink-soft)',
          faint: 'var(--color-ink-faint)',
        },
        line: 'var(--color-line)',
        brand: {
          DEFAULT: 'var(--color-brand)',
          soft: 'var(--color-brand-soft)',
          tint: 'var(--color-brand-tint)',
        },
        risk: {
          safe: 'var(--color-risk-safe)',
          'safe-tint': 'var(--color-risk-safe-tint)',
          review: 'var(--color-risk-review)',
          'review-tint': 'var(--color-risk-review-tint)',
          high: 'var(--color-risk-high)',
          'high-tint': 'var(--color-risk-high-tint)',
        },
        accent: {
          teal: 'var(--color-accent-teal)',
          'teal-tint': 'var(--color-accent-teal-tint)',
          plum: 'var(--color-accent-plum)',
          'plum-tint': 'var(--color-accent-plum-tint)',
          pink: 'var(--color-accent-pink)',
          'pink-tint': 'var(--color-accent-pink-tint)',
        },
      },
      fontFamily: {
        display: ['var(--font-poppins)', 'sans-serif'],
        body: ['var(--font-poppins)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '7px',
        lg: '10px',
      },
      maxWidth: {
        shell: '1180px',
      },
      keyframes: {
        scan: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(2%, -4%) scale(1.05)' },
        },
      },
      animation: {
        scan: 'scan 2.4s ease-in-out infinite',
        rise: 'rise 0.5s ease-out both',
        float: 'float 14s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
