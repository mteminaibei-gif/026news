import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary & Accent (oklch color space)
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'primary-light': 'var(--primary-light)',
        'primary-muted': 'var(--primary-muted)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-light': 'var(--accent-light)',

        // Semantic colors
        success: 'var(--success)',
        'success-light': 'var(--success-light)',
        warning: 'var(--warning)',
        'warning-light': 'var(--warning-light)',
        info: 'var(--info)',
        'info-light': 'var(--info-light)',
        error: 'var(--error)',
        'error-light': 'var(--error-light)',

        // Backgrounds
        'bg-base': 'var(--bg-base)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-inset': 'var(--bg-inset)',
        'bg-muted': 'var(--bg-muted)',

        // Text colors
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-muted': 'var(--text-muted)',
        'text-inverse': 'var(--text-inverse)',

        // Borders
        border: 'var(--border)',
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
      },

      spacing: {
        'xs': 'var(--space-xs)',
        'sm': 'var(--space-sm)',
        'md': 'var(--space-md)',
        'lg': 'var(--space-lg)',
        'xl': 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
        '3xl': 'var(--space-3xl)',
      },

      fontFamily: {
        display: 'var(--font-display)',
        ui: 'var(--font-ui)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },

      borderRadius: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
      },

      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'card': 'var(--card-shadow)',
        'card-hover': 'var(--card-shadow-hover)',
      },

      transitionTimingFunction: {
        'out-expo': 'var(--ease-out-expo)',
        'out-quart': 'var(--ease-out-quart)',
        'in': 'var(--ease-in)',
        'in-out': 'var(--ease-in-out)',
        'spring': 'var(--ease-spring)',
      },

      animation: {
        'fade-up': 'fadeUp 0.6s var(--ease-out-expo)',
        'fade-in': 'fadeIn 0.4s var(--ease-out-quart)',
        'slide-left': 'slideLeft 0.5s var(--ease-out-expo)',
        'slide-down': 'slideDown 0.5s var(--ease-out-expo)',
        'scale-in': 'scaleIn 0.4s var(--ease-spring)',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'bounce-in': 'bounceIn 0.6s var(--ease-spring)',
      },

      keyframes: {
        fadeUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideLeft: {
          '0%': {
            opacity: '0',
            transform: 'translateX(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        slideDown: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        scaleIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '1000px 0',
          },
          '100%': {
            backgroundPosition: '-1000px 0',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-20px)',
          },
        },
        bounceIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.3)',
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1.05)',
          },
          '70%': {
            transform: 'scale(0.9)',
          },
          '100%': {
            transform: 'scale(1)',
          },
        },
      },

      opacity: {
        '5': '0.05',
        '10': '0.1',
        '20': '0.2',
        '30': '0.3',
        '40': '0.4',
        '50': '0.5',
        '60': '0.6',
        '70': '0.7',
        '80': '0.8',
        '90': '0.9',
        '95': '0.95',
      },
    },
  },

  plugins: [
    // Add custom utilities for design system
    function ({ addUtilities, theme }: any) {
      const newUtilities = {
        '.stat-card': {
          '@apply rounded-md border border-border bg-bg-surface p-6 transition-all duration-200 hover:shadow-md':
            {},
        },
        '.setting-row': {
          '@apply flex items-center justify-between border-b border-border px-0 py-4 last:border-b-0':
            {},
        },
        '.tab-active': {
          '@apply border-b-2 border-primary font-semibold text-primary': {},
        },
        '.tab-inactive': {
          '@apply border-b-2 border-transparent font-medium text-text-secondary transition-colors hover:text-text-primary':
            {},
        },
        '.btn-primary': {
          '@apply rounded-sm border-none bg-primary px-5 py-2.5 font-semibold text-text-inverse shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed':
            {},
        },
        '.btn-secondary': {
          '@apply rounded-sm border border-border bg-bg-elevated px-5 py-2.5 font-semibold text-text-primary transition-all hover:bg-bg-muted disabled:opacity-60 disabled:cursor-not-allowed':
            {},
        },
        '.btn-ghost': {
          '@apply rounded-sm border border-transparent bg-transparent px-5 py-2.5 font-semibold text-text-primary transition-all hover:bg-bg-muted disabled:opacity-60 disabled:cursor-not-allowed':
            {},
        },
        '.form-input': {
          '@apply w-full rounded-sm border border-border bg-bg-elevated px-3.5 py-2.5 text-sm font-normal text-text-primary placeholder-text-tertiary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 disabled:bg-bg-muted disabled:cursor-not-allowed':
            {},
        },
        '.card': {
          '@apply rounded-md border border-border bg-bg-surface p-6 shadow-sm': {},
        },
        '.card-elevated': {
          '@apply rounded-md border border-border bg-bg-surface p-6 shadow-md': {},
        },
      }
      addUtilities(newUtilities)
    },
  ],
} satisfies Config
