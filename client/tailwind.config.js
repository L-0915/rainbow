/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 彩虹色系
        'rainbow-red': '#FF6B6B',
        'rainbow-orange': '#FFA94D',
        'rainbow-yellow': '#FFE066',
        'rainbow-green': '#69DB7C',
        'rainbow-blue': '#4DABF7',
        'rainbow-purple': '#DA77F2',
        // 情绪色彩
        'emotion-happy': '#FFD43B',
        'emotion-calm': '#74C0FC',
        'emotion-angry': '#FF6B6B',
        'emotion-scared': '#A5D8FF',
        'emotion-sad': '#95A5A6',
        'emotion-excited': '#FF922B',
        // 背景色
        'bg-warm': '#FFF9E6',
        'bg-soft': '#F8F9FA',
        'bg-sky': '#E0F4FF',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.5rem',
        'DEFAULT': '0.75rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        '2xl': '2.5rem',
        '3xl': '3rem',
        'full': '9999px',
      },
      borderWidth: {
        '0': '0',
        '1': '1px',
        '2': '2px',
        '3': '3px',
        '4': '4px',
        '5': '5px',
        '6': '6px',
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'float': '0 12px 32px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(255, 255, 255, 0.5)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      fontFamily: {
        'rounded': ['Varela Round', 'Nunito', 'sans-serif'],
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}
