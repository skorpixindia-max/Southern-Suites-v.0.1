/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B2A4A',
          50:  '#E8EBF1',
          100: '#C6CEDF',
          200: '#9AACC8',
          300: '#6D89B0',
          400: '#4C6D9D',
          500: '#2B528B',
          600: '#1B2A4A',
          700: '#152238',
          800: '#0F1927',
          900: '#080F17',
        },
        accent: {
          DEFAULT: '#C9A84C',
          50:  '#FAF5E8',
          100: '#F3E6C3',
          200: '#EAD49A',
          300: '#E0C271',
          400: '#D9B55A',
          500: '#C9A84C',
          600: '#A98936',
          700: '#846B28',
          800: '#5F4D1C',
          900: '#3A2F10',
        },
        background: '#FFFFFF',
        section: '#F8F7F4',
        neutral: {
          50:  '#FAFAFA',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
      },
      fontFamily: {
        playfair: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        inter:    ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      backgroundImage: {
        'gold-gradient':   'linear-gradient(135deg, #C9A84C 0%, #E8D48A 50%, #C9A84C 100%)',
        'navy-gradient':   'linear-gradient(135deg, #1B2A4A 0%, #2B4A7A 100%)',
        'hero-overlay':    'linear-gradient(to bottom, rgba(27,42,74,0.3) 0%, rgba(27,42,74,0.7) 60%, rgba(27,42,74,0.9) 100%)',
        'card-overlay':    'linear-gradient(to top, rgba(27,42,74,0.85) 0%, rgba(27,42,74,0.2) 60%, transparent 100%)',
        'shimmer':         'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      },
      boxShadow: {
        'gold':     '0 4px 24px rgba(201,168,76,0.3)',
        'gold-lg':  '0 8px 40px rgba(201,168,76,0.4)',
        'navy':     '0 4px 24px rgba(27,42,74,0.25)',
        'navy-lg':  '0 8px 40px rgba(27,42,74,0.35)',
        'card':     '0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
        'card-hover': '0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)',
        'luxury':   '0 20px 60px rgba(27,42,74,0.2), 0 8px 25px rgba(27,42,74,0.1)',
      },
      borderRadius: {
        'xs': '0.125rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'shimmer':          'shimmer 1.8s ease-in-out infinite',
        'fade-in':          'fadeIn 0.6s ease-out forwards',
        'fade-in-up':       'fadeInUp 0.7s ease-out forwards',
        'fade-in-down':     'fadeInDown 0.5s ease-out forwards',
        'slide-in-left':    'slideInLeft 0.5s ease-out forwards',
        'slide-in-right':   'slideInRight 0.5s ease-out forwards',
        'scale-in':         'scaleIn 0.4s ease-out forwards',
        'gold-pulse':       'goldPulse 2s ease-in-out infinite',
        'float':            'float 6s ease-in-out infinite',
        'spin-slow':        'spin 8s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%':   { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        goldPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,168,76,0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(201,168,76,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      aspectRatio: {
        'hotel-card': '4 / 3',
        'gallery': '16 / 9',
        'portrait': '3 / 4',
      },
      screens: {
        'xs': '480px',
      },
      letterSpacing: {
        'widest-plus': '0.2em',
        'ultra': '0.3em',
      },
    },
  },
  plugins: [],
}
