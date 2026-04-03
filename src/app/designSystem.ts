export const designTokens = {
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.375rem',
    xxl: '1.75rem',
    xxxl: '1.875rem',
    overline: '0.68rem',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.1,
    base: 1.45,
    relaxed: 1.6,
  },
  radius: {
    xs: 2,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 10,
    pill: 999,
  },
  spacing: {
    xs: 0.75,
    sm: 1,
    md: 1.5,
    lg: 2,
    xl: 2.5,
    xxl: 3,
  },
  componentSpacing: {
    dialogPanel: {
      desktop: 2.25,
      mobile: 2,
    },
    hudChip: {
      px: 1.7,
      py: 0.95,
    },
    menuPanel: {
      p: 1.5,
    },
    overlayPanel: {
      desktop: 2.4,
      mobile: 2,
    },
    selectorCard: {
      px: 1.75,
      py: 1.2,
    },
    selectorCardDense: {
      px: 1.5,
      py: 1.1,
    },
    selectorCardLarge: {
      px: 2,
      py: 1.7,
    },
  },
  motion: {
    fast: '140ms',
    base: '180ms',
  },
} as const;
