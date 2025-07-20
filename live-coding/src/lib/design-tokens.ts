/**
 * Design Tokens for Learning Portal Platform
 * Comprehensive design system tokens for colors, typography, spacing, and breakpoints
 */

// Color Palette - Extended semantic colors for learning platform
export const colors = {
  // Base colors (already in CSS variables)
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  
  // Primary brand colors
  primary: {
    50: 'hsl(221, 83%, 95%)',
    100: 'hsl(221, 83%, 90%)',
    200: 'hsl(221, 83%, 80%)',
    300: 'hsl(221, 83%, 70%)',
    400: 'hsl(221, 83%, 60%)',
    500: 'hsl(var(--primary))', // 221.2 83.2% 53.3%
    600: 'hsl(221, 83%, 45%)',
    700: 'hsl(221, 83%, 35%)',
    800: 'hsl(221, 83%, 25%)',
    900: 'hsl(221, 83%, 15%)',
    foreground: 'hsl(var(--primary-foreground))',
  },
  
  // Secondary colors
  secondary: {
    DEFAULT: 'hsl(var(--secondary))',
    foreground: 'hsl(var(--secondary-foreground))',
  },
  
  // Semantic colors for learning platform
  success: {
    50: 'hsl(142, 76%, 95%)',
    100: 'hsl(142, 76%, 90%)',
    500: 'hsl(142, 76%, 36%)',
    600: 'hsl(142, 76%, 30%)',
    foreground: 'hsl(0, 0%, 100%)',
  },
  
  warning: {
    50: 'hsl(48, 96%, 95%)',
    100: 'hsl(48, 96%, 90%)',
    500: 'hsl(48, 96%, 53%)',
    600: 'hsl(48, 96%, 45%)',
    foreground: 'hsl(222, 84%, 5%)',
  },
  
  info: {
    50: 'hsl(204, 94%, 95%)',
    100: 'hsl(204, 94%, 90%)',
    500: 'hsl(204, 94%, 53%)',
    600: 'hsl(204, 94%, 45%)',
    foreground: 'hsl(0, 0%, 100%)',
  },
  
  destructive: {
    DEFAULT: 'hsl(var(--destructive))',
    foreground: 'hsl(var(--destructive-foreground))',
  },
  
  // UI colors
  muted: {
    DEFAULT: 'hsl(var(--muted))',
    foreground: 'hsl(var(--muted-foreground))',
  },
  
  accent: {
    DEFAULT: 'hsl(var(--accent))',
    foreground: 'hsl(var(--accent-foreground))',
  },
  
  card: {
    DEFAULT: 'hsl(var(--card))',
    foreground: 'hsl(var(--card-foreground))',
  },
  
  popover: {
    DEFAULT: 'hsl(var(--popover))',
    foreground: 'hsl(var(--popover-foreground))',
  },
  
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
} as const;

// Typography Scale
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }],         // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],      // 60px
  },
  
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// Spacing Scale (following 8px grid system)
export const spacing = {
  px: '1px',
  0: '0px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const;

// Border Radius
export const borderRadius = {
  none: '0px',
  sm: 'calc(var(--radius) - 4px)',
  DEFAULT: 'var(--radius)',
  md: 'calc(var(--radius) - 2px)',
  lg: 'var(--radius)',
  xl: 'calc(var(--radius) + 4px)',
  '2xl': 'calc(var(--radius) + 8px)',
  '3xl': 'calc(var(--radius) + 12px)',
  full: '9999px',
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  sm: '640px',   // Small devices (landscape phones)
  md: '768px',   // Medium devices (tablets)
  lg: '1024px',  // Large devices (laptops)
  xl: '1280px',  // Extra large devices (desktops)
  '2xl': '1536px', // 2X large devices (large desktops)
} as const;

// Z-index scale
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Animation durations
export const animation = {
  duration: {
    fastest: '100ms',
    fast: '200ms',
    normal: '300ms',
    slow: '500ms',
    slowest: '800ms',
  },
  
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Shadow scale
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
} as const;

// Component-specific tokens
export const components = {
  button: {
    height: {
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px
      lg: '3rem',      // 48px
    },
    padding: {
      sm: '0.5rem 0.75rem',   // 8px 12px
      md: '0.625rem 1rem',    // 10px 16px
      lg: '0.75rem 1.5rem',   // 12px 24px
    },
  },
  
  input: {
    height: {
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px
      lg: '3rem',      // 48px
    },
  },
  
  card: {
    padding: {
      sm: '1rem',      // 16px
      md: '1.5rem',    // 24px
      lg: '2rem',      // 32px
    },
  },
} as const;

// Export all tokens as a single object for easy access
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  breakpoints,
  zIndex,
  animation,
  shadows,
  components,
} as const;

export type DesignTokens = typeof designTokens;