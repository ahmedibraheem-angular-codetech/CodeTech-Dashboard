import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

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
