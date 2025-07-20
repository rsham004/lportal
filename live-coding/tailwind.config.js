/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          50: 'hsl(221, 83%, 95%)',
          100: 'hsl(221, 83%, 90%)',
          200: 'hsl(221, 83%, 80%)',
          300: 'hsl(221, 83%, 70%)',
          400: 'hsl(221, 83%, 60%)',
          500: "hsl(var(--primary))",
          600: 'hsl(221, 83%, 45%)',
          700: 'hsl(221, 83%, 35%)',
          800: 'hsl(221, 83%, 25%)',
          900: 'hsl(221, 83%, 15%)',
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        success: {
          50: 'hsl(142, 76%, 95%)',
          100: 'hsl(142, 76%, 90%)',
          500: 'hsl(142, 76%, 36%)',
          600: 'hsl(142, 76%, 30%)',
          DEFAULT: 'hsl(142, 76%, 36%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        warning: {
          50: 'hsl(48, 96%, 95%)',
          100: 'hsl(48, 96%, 90%)',
          500: 'hsl(48, 96%, 53%)',
          600: 'hsl(48, 96%, 45%)',
          DEFAULT: 'hsl(48, 96%, 53%)',
          foreground: 'hsl(222, 84%, 5%)',
        },
        info: {
          50: 'hsl(204, 94%, 95%)',
          100: 'hsl(204, 94%, 90%)',
          500: 'hsl(204, 94%, 53%)',
          600: 'hsl(204, 94%, 45%)',
          DEFAULT: 'hsl(204, 94%, 53%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 12px)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      zIndex: {
        hide: '-1',
        docked: '10',
        dropdown: '1000',
        sticky: '1100',
        banner: '1200',
        overlay: '1300',
        modal: '1400',
        popover: '1500',
        skipLink: '1600',
        toast: '1700',
        tooltip: '1800',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-out': 'fadeOut 200ms ease-in',
        'slide-in': 'slideIn 300ms ease-out',
        'slide-out': 'slideOut 300ms ease-in',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideOut: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-10px)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}