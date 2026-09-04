import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand color - Pink/Magenta (#E91E63)
        primary: {
          50: '#FCE4EC',
          100: '#F8BBD9',
          200: '#F48FB1',
          300: '#F06292',
          400: '#EC407A',
          500: '#E91E63', // Main brand color
          600: '#D81B60',
          700: '#C2185B',
          800: '#AD1457',
          900: '#880E4F',
          950: '#5D0A37',
        },
        // Payment status colors
        status: {
          pending: '#FF9800', // Orange/Amber for PENDING
          partial: '#FFC107', // Yellow for PARTIALLY_PAID
          paid: '#4CAF50', // Green for PAID
        },
        // Neutral colors for text and backgrounds
        surface: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      spacing: {
        // A4 page dimensions for PDF preview (scaled)
        'a4-width': '210mm',
        'a4-height': '297mm',
      },
      minHeight: {
        // Minimum touch target size for mobile (44x44px as per accessibility guidelines)
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
      screens: {
        // Custom breakpoints matching requirements
        mobile: '320px',
        tablet: '768px',
        desktop: '1024px',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
