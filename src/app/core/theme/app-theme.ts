import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Central PrimeNG theme. This is the one place to change the product's look:
 *
 * - `primary`: the brand palette. SCSS reads it through `--app-primary` (an alias of
 *   `--p-primary-500` in `styles/themes/_light-theme.scss`), so nothing else repeats the hex values.
 * - `formField`: radius and padding shared by inputs, selects, date pickers and buttons.
 * - `components`: per-component tokens, the official way to tune PrimeNG without overriding its CSS.
 *
 * The app is light only: dark mode is disabled in `app.config.ts`.
 */
export const AppTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#2f6fed',
      600: '#1d4ed8',
      700: '#1e40af',
      800: '#1e3a8a',
      900: '#1e3a70',
      950: '#0b1b44',
    },
    formField: {
      borderRadius: '12px',
      paddingX: '0.875rem',
      paddingY: '0.75rem',
    },
  },
  components: {
    button: {
      root: {
        paddingY: '0.65rem',
        label: {
          fontWeight: '700',
        },
      },
    },
    dialog: {
      root: {
        borderRadius: '18px',
      },
    },
  },
});
