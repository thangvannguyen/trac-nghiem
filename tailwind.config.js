/** @type {import('tailwindcss').Config} */
// Màu lấy từ biến CSS (xem src/index.css) để đổi theo chế độ Sáng / Tối; vẫn dùng được độ mờ (vd. bg-ink/10).
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const shades = (name) => ({ 100: v(`${name}-100`), 300: v(`${name}-300`), 500: v(`${name}-500`) });

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Nunito', 'system-ui', 'sans-serif'] },
      colors: {
        cream: v('cream'),
        ink: v('ink'),
        surface: v('surface'),
        lemonink: v('lemonink'),
        peach: shades('peach'),
        mint: shades('mint'),
        sky: shades('sky'),
        lilac: shades('lilac'),
        lemon: shades('lemon'),
        rose: shades('rose'),
      },
      boxShadow: {
        soft: '0 6px 0 0 rgb(var(--shadow) / 0.08), 0 10px 24px -8px rgb(var(--shadow) / 0.15)',
      },
      borderRadius: { blob: '1.5rem' },
    },
  },
  plugins: [],
};
