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
        'dark-bg': '#1a1a2e',
        'darker-bg': '#16213e',
        'neon-pink': '#e94560',
        'neon-cyan': '#0f3460',
        'neon-amber': '#f5a623',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'walk': 'walk 20s linear infinite',
        'bob': 'bob 3s ease-in-out infinite',
        'sway': 'sway 4s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          'from': { textShadow: '0 0 10px #fff, 0 0 20px #fff, 0 0 30px #e94560, 0 0 40px #e94560' },
          'to': { textShadow: '0 0 20px #fff, 0 0 30px #e94560, 0 0 40px #e94560, 0 0 50px #e94560' },
        },
        walk: {
          'from': { transform: 'translateX(-100px)' },
          'to': { transform: 'translateX(calc(100vw + 100px))' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
      },
    },
  },
  plugins: [],
}
