import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'apollo-yellow': '#F7DF1E',
        'apollo-black': '#000000',
        'apollo-gray': '#f3f4f6',
      }
    },
  },
  plugins: [],
};

export default config; 