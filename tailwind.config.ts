import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
        // ═══════════════════════════════════════════
        //  BASE COLORS ONLY
        // ═══════════════════════════════════════════
        colors: {
            // Base colors (required)
            background: 'hsl(var(--background))',
            foreground: 'hsl(var(--foreground))',
            card: {
                DEFAULT: 'hsl(var(--card))',
                foreground: 'hsl(var(--card-foreground))'
            },
            primary: {
                DEFAULT: 'hsl(var(--primary))',
                foreground: 'hsl(var(--primary-foreground))'
            },
            secondary: {
                DEFAULT: 'hsl(var(--secondary))',
                foreground: 'hsl(var(--secondary-foreground))'
            },
            muted: {
                DEFAULT: 'hsl(var(--muted))',
                foreground: 'hsl(var(--muted-foreground))'
            },
            accent: {
                DEFAULT: 'hsl(var(--accent))',
                foreground: 'hsl(var(--accent-foreground))'
            },
            destructive: {
                DEFAULT: 'hsl(var(--destructive))',
                foreground: 'hsl(var(--destructive-foreground))'
            },
            border: 'hsl(var(--border))',
            input: 'hsl(var(--input))',
            ring: 'hsl(var(--ring))',
        },

        // ═══════════════════════════════════════════
        //  TYPOGRAPHY SCALE
        // ═══════════════════════════════════════════
        fontSize: {
            'display': ['3rem', { lineHeight: '1.1', fontWeight: '800' }],
            'h1': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
            'h2': ['1.875rem', { lineHeight: '1.25', fontWeight: '600' }],
            'h3': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
            'h4': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
            'body-lg': ['1.125rem', { lineHeight: '1.6' }],
            'body': ['1rem', { lineHeight: '1.5' }],
            'body-sm': ['0.875rem', { lineHeight: '1.5' }],
            'caption': ['0.75rem', { lineHeight: '1.4' }],
            'tiny': ['0.625rem', { lineHeight: '1.3' }],
        },

        // ═══════════════════════════════════════════
        //  BORDER RADIUS
        // ═══════════════════════════════════════════
        borderRadius: {
            'lg': 'var(--radius)',
            'md': 'calc(var(--radius) - 2px)',
            'sm': 'calc(var(--radius) - 4px)',
            'xl': '1rem',
            '2xl': '1.25rem',
            '3xl': '1.5rem',
            'full': '9999px',
        },
  	}
  },
  plugins: [tailwindcssAnimate],
};
export default config;
