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
        //  ROLE-BASED COLOR PALETTE
        // ═══════════════════════════════════════════
        colors: {
            // Base colors
            background: 'hsl(var(--background))',
            foreground: 'hsl(var(--foreground))',
            card: {
                DEFAULT: 'hsl(var(--card))',
                foreground: 'hsl(var(--card-foreground))'
            },
            popover: {
                DEFAULT: 'hsl(var(--popover))',
                foreground: 'hsl(var(--popover-foreground))'
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
            chart: {
                '1': 'hsl(var(--chart-1))',
                '2': 'hsl(var(--chart-2))',
                '3': 'hsl(var(--chart-3))',
                '4': 'hsl(var(--chart-4))',
                '5': 'hsl(var(--chart-5))'
            },

            // ═══════════════════════════════════════════
            //  ROLE COLORS - For clear visual distinction
            // ═══════════════════════════════════════════
            // Beneficiary: Teal/Emerald - health, hope, life
            beneficiary: {
                50: '#f0fdfa',
                100: '#ccfbf1',
                200: '#99f6e4',
                300: '#5eead4',
                400: '#2dd4bf',
                500: '#14b8a6',
                600: '#0d9488',
                700: '#0f766e',
                800: '#115e59',
                900: '#134e4a',
                950: '#042f2e',
                DEFAULT: '#14b8a6',
                foreground: '#ffffff',
                light: '#5eead4',
                dark: '#0f766e',
            },
            // Nurse: Blue/Cyan - care, trust, professionalism
            nurse: {
                50: '#eff6ff',
                100: '#dbeafe',
                200: '#bfdbfe',
                300: '#93c5fd',
                400: '#60a5fa',
                500: '#3b82f6',
                600: '#2563eb',
                700: '#1d4ed8',
                800: '#1e40af',
                900: '#1e3a8a',
                950: '#172554',
                DEFAULT: '#3b82f6',
                foreground: '#ffffff',
                light: '#60a5fa',
                dark: '#1d4ed8',
            },
            // Admin: Rose/Crimson - control, authority
            admin: {
                50: '#fff1f2',
                100: '#ffe4e6',
                200: '#fecdd3',
                300: '#fda4af',
                400: '#fb7185',
                500: '#f43f5e',
                600: '#e11d48',
                700: '#be123c',
                800: '#9f1239',
                900: '#881337',
                950: '#4c0519',
                DEFAULT: '#e11d48',
                foreground: '#ffffff',
                light: '#fb7185',
                dark: '#be123c',
            },

            // ═══════════════════════════════════════════
            //  SEMANTIC COLORS
            // ═══════════════════════════════════════════
            success: {
                DEFAULT: '#10b981',
                light: '#34d399',
                dark: '#059669',
                bg: '#ecfdf5',
            },
            warning: {
                DEFAULT: '#f59e0b',
                light: '#fbbf24',
                dark: '#d97706',
                bg: '#fefce8',
            },
            info: {
                DEFAULT: '#0ea5e9',
                light: '#38bdf8',
                dark: '#0284c7',
                bg: '#f0f9ff',
            },

            // ═══════════════════════════════════════════
            //  GRAY SCALE (Extended)
            // ═══════════════════════════════════════════
            slate: {
                50: '#f8fafc',
                100: '#f1f5f9',
                200: '#e2e8f0',
                300: '#cbd5e1',
                400: '#94a3b8',
                500: '#64748b',
                600: '#475569',
                700: '#334155',
                800: '#1e293b',
                900: '#0f172a',
                950: '#020617',
            },
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
        //  SPACING
        // ═══════════════════════════════════════════
        spacing: {
            '18': '4.5rem',
            '88': '22rem',
            '128': '32rem',
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

        // ═══════════════════════════════════════════
        //  SHADOWS
        // ═══════════════════════════════════════════
        boxShadow: {
            'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
            'glass-sm': '0 4px 16px rgba(0, 0, 0, 0.08)',
            'glass-lg': '0 12px 48px rgba(0, 0, 0, 0.15)',
            'glow-teal': '0 0 20px rgba(20, 184, 166, 0.4)',
            'glow-blue': '0 0 20px rgba(59, 130, 246, 0.4)',
            'glow-rose': '0 0 20px rgba(225, 29, 72, 0.4)',
            'inner-glass': 'inset 0 2px 8px rgba(255, 255, 255, 0.3)',
        },

        // ═══════════════════════════════════════════
        //  ANIMATIONS
        // ═══════════════════════════════════════════
        animation: {
            'float': 'float 6s ease-in-out infinite',
            'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            'bounce-subtle': 'bounce-subtle 2s infinite',
            'shimmer': 'shimmer 2s linear infinite',
            'gradient': 'gradient 8s ease infinite',
        },
        keyframes: {
            'float': {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-20px)' },
            },
            'bounce-subtle': {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-5px)' },
            },
            'shimmer': {
                '0%': { backgroundPosition: '-200% 0' },
                '100%': { backgroundPosition: '200% 0' },
            },
            'gradient': {
                '0%, 100%': { backgroundPosition: '0% 50%' },
                '50%': { backgroundPosition: '100% 50%' },
            },
        },

        // ═══════════════════════════════════════════
        //  BACKDROP BLUR
        // ═══════════════════════════════════════════
        backdropBlur: {
            'xs': '2px',
        },
  	}
  },
  plugins: [tailwindcssAnimate],
};
export default config;
