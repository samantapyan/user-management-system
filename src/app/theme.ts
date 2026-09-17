import { createTheme } from '@mui/material/styles';

/**
 * A small theme on top of MUI, not a design system.
 *
 * No design was provided, so the job here is to make a few deliberate decisions
 * and then stop. Everything in this file is either a decision I want to be able
 * to defend, or a setting that makes the app usable on a device or with a
 * setting I cannot see. Anything beyond that belongs to MUI and is left alone.
 */

/* One accent, used for interactive things only. Everything else is neutral.
   An internal tool should look calm, and colour should mean "you can act here"
   rather than decoration. The dark value is lighter than the light value on
   purpose, because the same blue on a dark surface does not reach 4.5:1. */
const accent = {
  light: '#1D4ED8',
  dark: '#8FAEFF',
};

export const theme = createTheme({
  /* CSS variables with the media selector means light and dark are decided by
     plain CSS media queries. No JavaScript runs to pick a scheme, so there is no
     flash of the wrong one on first paint, and the app follows the operating
     system setting without asking the user to set it twice.
     A manual light/dark switch would need colorSchemeSelector: 'class' instead,
     and somewhere to persist the choice. There is no requirement for one. */
  cssVariables: { colorSchemeSelector: 'media' },

  colorSchemes: {
    light: {
      palette: {
        primary: { main: accent.light },
        background: { default: '#F6F7F9', paper: '#FFFFFF' },
        text: { primary: '#14181F', secondary: '#525C6B' },
        divider: 'rgba(20, 24, 31, 0.12)',
      },
    },
    dark: {
      palette: {
        primary: { main: accent.dark, contrastText: '#0C1017' },
        background: { default: '#0C1017', paper: '#151A22' },
        text: { primary: '#E7EAF0', secondary: '#9BA5B4' },
        divider: 'rgba(231, 234, 240, 0.14)',
      },
    },
  },

  shape: { borderRadius: 10 },

  typography: {
    /* The font the operating system already has, not a downloaded one.
       A web font here would be around 70kB and would cost either a flash of the
       fallback or a moment of invisible text, to change nothing a user of this
       screen cares about. The system stack paints on the first frame and looks
       native on each platform. It also moves the app away from looking like a
       stock Material demo, which is the main risk of taking a component library
       when no design was provided. */
    fontFamily: [
      'system-ui',
      '-apple-system',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontSize: '1.5rem', fontWeight: 500, letterSpacing: '-0.01em' },
    h2: { fontSize: '1.25rem', fontWeight: 500, letterSpacing: '-0.01em' },
    button: { textTransform: 'none', fontWeight: 500 },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        /* Respect a reduced motion setting. MUI animates dialogs, ripples and
           skeletons by default, and for some people that is not a preference,
           it is a symptom. */
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },

        /* On a touch screen every control is at least 44px tall. This is the
           one place the whole app gets that, rather than each component
           remembering. Pointer coarse means touch, so a mouse keeps the denser
           layout it can actually hit. */
        '@media (pointer: coarse)': {
          '.MuiButtonBase-root, .MuiInputBase-root': { minHeight: 44 },
        },

        /* A focus ring that is visible on both schemes and on top of a coloured
           button. The browser default disappears against the accent, and
           keyboard users are the ones who need it. */
        '*:focus-visible': {
          outline: '3px solid var(--mui-palette-primary-main)',
          outlineOffset: '2px',
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
    },

    /* Small is the default input size because this screen is a dense list, not
       a form. The touch rule above puts the height back on a phone. */
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
    },
  },
});
