import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'apollo-yellow': '#EBF212',
        'apollo-black': '#000000',
        'apollo-white': '#FFFFFF',
        'apollo-gray-50': '#f9fafb',
        'apollo-gray-100': '#f3f4f6',
        'apollo-gray-600': '#4b5563',
        'apollo-gray-900': '#111827',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'apollo': '0 0.0625 0.1875rem 0 rgba(0, 0, 0, 0.1), 0 0.0625 0.125rem 0 rgba(0, 0, 0, 0.06)',
        'apollo-lg': '0 0.625rem 15px -0.1875rem rgba(0, 0, 0, 0.1), 0 0.25rem 0.375rem -0.125rem rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
};

export default config; 