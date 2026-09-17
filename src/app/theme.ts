import { createTheme } from '@mui/material/styles';

/** A small theme on top of MUI, not a design system. Reasoning is in the README. */

// The dark value is lighter than the light one because the same blue on a dark surface
// does not reach 4.5:1.
const accent = {
  light: '#1D4ED8',
  dark: '#8FAEFF',
};

export const theme = createTheme({
  // `media` means light and dark are plain CSS media queries. No JavaScript decides the
  // scheme, so there is no flash of the wrong one on first paint. A manual switch would
  // need `class` instead, plus somewhere to persist the choice.
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
        // MUI animates dialogs, ripples and skeletons by default, and for some people
        // that is a symptom rather than a preference.
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },

        // Coarse pointer means touch, so a mouse keeps the denser layout it can hit.
        '@media (pointer: coarse)': {
          '.MuiButtonBase-root, .MuiInputBase-root': { minHeight: 44 },
        },

        // The browser default ring disappears against the accent colour.
        '*:focus-visible': {
          outline: '3px solid var(--mui-palette-primary-main)',
          outlineOffset: '2px',
        },
      },
    },

    // MUI's ButtonBase sets `outline: 0` on its root, which has the same specificity as
    // the global rule above and is injected after it, so every button, sort label and
    // icon button ends up with no visible focus at all. Repeating the ring here is more
    // specific than that reset and wins without `!important`.
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&:focus-visible': {
            outline: '3px solid var(--mui-palette-primary-main)',
            outlineOffset: '2px',
          },
        },
      },
    },

    // The select inside the pagination is a div, not a button, so it misses the rule
    // above and MUI only recolours an underline it does not draw here.
    MuiSelect: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        select: {
          '&:focus-visible': {
            outline: '3px solid var(--mui-palette-primary-main)',
            outlineOffset: '2px',
            borderRadius: 4,
          },
        },
      },
    },

    MuiButton: { defaultProps: { disableElevation: true } },
    // Dense by default because this screen is a list, not a form. The touch rule above
    // puts the height back on a phone.
    MuiTextField: { defaultProps: { size: 'small' } },
  },
});
