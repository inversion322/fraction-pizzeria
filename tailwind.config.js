/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Nunito Variable"', 'ui-rounded', 'system-ui', 'sans-serif'],
        display: ['"Unbounded Variable"', '"Nunito Variable"', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        sunk: token('sunk'),
        line: token('line'),
        ink: { DEFAULT: token('ink'), 2: token('ink-2'), 3: token('ink-3') },
        tomato: { DEFAULT: token('tomato'), ink: token('tomato-ink'), soft: token('tomato-soft') },
        basil: { DEFAULT: token('basil'), ink: token('basil-ink'), soft: token('basil-soft') },
        cheese: { DEFAULT: token('cheese'), ink: token('cheese-ink'), soft: token('cheese-soft') },
        crust: token('crust'),
        kraft: { DEFAULT: token('kraft'), edge: token('kraft-edge'), ink: token('kraft-ink') },
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        cta: '0 1px 0 rgb(255 255 255 / 0.25) inset, 0 10px 24px -10px rgb(var(--tomato) / 0.9)',
      },
      transitionTimingFunction: { out: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    },
  },
  plugins: [],
}
