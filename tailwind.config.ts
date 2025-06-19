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
        'apollo': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'apollo-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
};

export default config; 