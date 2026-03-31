import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#070b14',
        elevated: '#0f1930',
        card: '#0f1a30',
        'card-hover': '#162441',
        border: '#25395f',
        accent: '#1f9d8f',
        'accent-strong': '#26c5b4',
        'accent-glow': 'rgba(31, 157, 143, 0.2)',
        'text-primary': '#eaf1ff',
        'text-secondary': '#94a7c8',
        danger: '#f56565',
      },
      fontFamily: {
        body: ['var(--font-body)', 'sans-serif'],
        heading: ['var(--font-heading)', 'sans-serif'],
      },
      animation: {
        fadein: 'fadein 0.4s ease-out',
        slideInUp: 'slideInUp 0.6s ease-out',
        slideInDown: 'slideInDown 0.6s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadein: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInDown: {
          '0%': { opacity: '0', transform: 'translateY(-40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(31, 157, 143, 0.4)',
        'glow-lg': '0 0 40px rgba(31, 157, 143, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
