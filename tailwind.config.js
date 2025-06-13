/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    fontSize: {
      xs: "12px",
      sm: "14px",
      base: "14px",
      md: "18px",
      lg: "18px",
      xl: "18px",
      "2xl": "24px", // Changed from 28px
      "3xl": "24px", // Changed from 28px
      "4xl": "32px",
      "5xl": "32px",
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sen)", "sans-serif"],
        secondary: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        black: "#000000",
        darkgray: "#555555",
        lightgray: "#999999",
        primary: {
          DEFAULT: "#D2FF28",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
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
          DEFAULT: "#D2FF28",
          foreground: "#000000",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Streamlined status colors
        success: {
          DEFAULT: "#22C55E", // green-500
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F59E0B", // amber-500
          foreground: "#000000",
        },
        error: {
          DEFAULT: "#EF4444", // red-500
          foreground: "#FFFFFF",
        },
        info: {
          DEFAULT: "#3B82F6", // blue-500
          foreground: "#FFFFFF",
        },
        // Simplified background colors
        gray: {
          100: "#F5F5F5", // Light gray for backgrounds
          200: "#E5E5E5", // Medium gray for borders
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
