import type { Config } from 'tailwindcss';

const config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'Apple SD Gothic Neo', 'sans-serif'],
        display: ['Epilogue', 'Pretendard', 'sans-serif'],
        editorial: ['Noto Serif KR', 'Pretendard', 'serif']
      },
      fontSize: {
        'ds-display': ['1.75rem', { lineHeight: '2.125rem', letterSpacing: '0' }],
        'ds-brand': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '0' }],
        'ds-modal-title': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0' }],
        'ds-title': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        'ds-body': ['0.875rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        'ds-caption': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0' }],
        'ds-micro': ['0.625rem', { lineHeight: '0.875rem', letterSpacing: '0' }],
        'ds-emoji': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0' }]
      },
      spacing: {
        'ds-1': '0.25rem',
        'ds-2': '0.5rem',
        'ds-3': '0.75rem',
        'ds-4': '1rem',
        'ds-5': '1.25rem',
        'ds-6': '1.5rem',
        'ds-7': '1.75rem',
        'ds-8': '2rem',
        'ds-12': '3rem',
        'ds-page': '1rem',
        'ds-page-lg': '1.5rem',
        'ds-card': '1rem',
        'ds-card-lg': '1.5rem'
      },
      colors: {
        cedar: {
          DEFAULT: '#8C6A5D',
          dark: '#78584B',
          deep: '#7D6456',
          soft: '#EFE7DF',
          mist: '#E7E2DD'
        },
        vellum: '#FDF8F5',
        oatmeal: '#F8F3EF',
        paper: {
          DEFAULT: '#FCFAF8',
          warm: '#FFFDF9',
          soft: '#FFF9F4',
          cream: '#FFFAF4'
        },
        ink: {
          DEFAULT: '#34322F',
          soft: '#4F473F',
          muted: '#615F5B',
          warm: '#6F5C45',
          umber: '#6B4C40'
        },
        line: {
          DEFAULT: '#ECE7E3',
          soft: '#EEE2D8',
          warm: '#EADFD7',
          pale: '#F0E6DD'
        },
        rose: {
          DEFAULT: '#B88E8E',
          soft: '#FBE4DF',
          pale: '#FFF1EF',
          danger: '#A83836'
        },
        peach: {
          DEFAULT: '#F8DEC1',
          soft: '#FDE7D3',
          blush: '#FCD1C1',
          star: '#FCE8A9'
        },
        mood: {
          happy: '#E9B44C',
          calm: '#8BA888',
          neutral: '#9FB3C8',
          cloudy: '#B89ACB',
          sad: '#D98989'
        },
        sage: '#8C9B8C',
        focus: '#6F6AF8',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
} satisfies Config;

export default config;
