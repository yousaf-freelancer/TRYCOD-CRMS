import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Trycod brand preset: Aura with a black / neutral primary so every PrimeNG
 * component follows the black-and-white identity. Semantic colours
 * (green/amber/red/blue) are left to Aura for status severities only.
 *
 * Dark mode: tokens use `light-dark()`; enabling a `.app-dark` class later
 * only requires filling in the dark values below.
 */
export const TrycodPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '2px',
      sm: '6px',
      md: '8px',
      lg: '10px',
      xl: '12px',
    },
  },
  semantic: {
    primary: {
      50: '{neutral.50}',
      100: '{neutral.100}',
      200: '{neutral.200}',
      300: '{neutral.300}',
      400: '{neutral.400}',
      500: '{neutral.500}',
      600: '{neutral.600}',
      700: '{neutral.700}',
      800: '{neutral.800}',
      900: '{neutral.900}',
      950: '{neutral.950}',
      color: 'light-dark(#0a0a0a, {neutral.50})',
      contrastColor: 'light-dark(#ffffff, {neutral.950})',
      hoverColor: 'light-dark({neutral.800}, {neutral.200})',
      activeColor: 'light-dark({neutral.700}, {neutral.300})',
    },
    surface: {
      0: '#ffffff',
      50: '{neutral.50}',
      100: '{neutral.100}',
      200: '{neutral.200}',
      300: '{neutral.300}',
      400: '{neutral.400}',
      500: '{neutral.500}',
      600: '{neutral.600}',
      700: '{neutral.700}',
      800: '{neutral.800}',
      900: '{neutral.900}',
      950: '{neutral.950}',
    },
    highlight: {
      background: 'light-dark({neutral.100}, {neutral.800})',
      focusBackground: 'light-dark({neutral.200}, {neutral.700})',
      color: 'light-dark({neutral.950}, #ffffff)',
      focusColor: 'light-dark({neutral.950}, #ffffff)',
    },
    text: {
      color: 'light-dark({neutral.900}, #ffffff)',
      hoverColor: 'light-dark({neutral.950}, #ffffff)',
      mutedColor: 'light-dark({neutral.500}, {neutral.400})',
      hoverMutedColor: 'light-dark({neutral.700}, {neutral.300})',
    },
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '#0a0a0a',
      offset: '2px',
      shadow: 'none',
    },
    formField: {
      paddingX: '0.75rem',
      paddingY: '0.5rem',
      borderRadius: '{border.radius.md}',
      borderColor: 'light-dark({neutral.300}, {neutral.600})',
      hoverBorderColor: 'light-dark({neutral.400}, {neutral.500})',
      focusBorderColor: 'light-dark({neutral.900}, {neutral.100})',
      color: 'light-dark({neutral.900}, #ffffff)',
      placeholderColor: 'light-dark({neutral.400}, {neutral.500})',
      floatLabelFocusColor: 'light-dark({neutral.900}, #ffffff)',
      shadow: '0 1px 2px 0 rgba(10, 10, 10, 0.04)',
    },
    overlay: {
      select: {
        borderRadius: '{border.radius.lg}',
        shadow: '0 8px 24px -6px rgba(10, 10, 10, 0.12), 0 2px 6px -2px rgba(10, 10, 10, 0.06)',
      },
      popover: {
        borderRadius: '{border.radius.lg}',
        shadow: '0 8px 24px -6px rgba(10, 10, 10, 0.12), 0 2px 6px -2px rgba(10, 10, 10, 0.06)',
      },
      modal: {
        borderRadius: '{border.radius.xl}',
        shadow: '0 24px 48px -12px rgba(10, 10, 10, 0.18)',
      },
      navigation: {
        shadow: '0 8px 24px -6px rgba(10, 10, 10, 0.12), 0 2px 6px -2px rgba(10, 10, 10, 0.06)',
      },
    },
    mask: {
      background: 'rgba(10, 10, 10, 0.4)',
    },
  },
});
