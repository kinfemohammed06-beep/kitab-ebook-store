import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Original brand names are kept as DEFAULT so existing classes keep working.
        forest: {
          DEFAULT: "#183C32", 50: "#F0F5F2", 100: "#DDE9E2", 200: "#BAD3C5", 300: "#8FB6A1",
          400: "#60947B", 500: "#3D765C", 600: "#2A5D47", 700: "#204A39", 800: "#183C32",
          900: "#123026", 950: "#0B211A",
        },
        ivory: { DEFAULT: "#F7F3E9", 50: "#FDFBF7", 100: "#F7F3E9", 200: "#EFE8D9" },
        gold: {
          DEFAULT: "#C6A15B", 50: "#FBF7EC", 100: "#F4E8CE", 200: "#E7D09F", 300: "#D9B878",
          400: "#C6A15B", 500: "#A9823D", 600: "#7A5B27",
        },
        charcoal: { DEFAULT: "#242424", 100: "#F3F3F3", 500: "#6E6E6E", 700: "#3B3B3B", 900: "#242424" },
        beige: { DEFAULT: "#E9E1D2", 50: "#F7F2E9", 100: "#E9E1D2", 200: "#DCCFBB" },
        // Semantic surface tokens used by the new design system.
        paper: "#FBFAF6",
        surface: "#FFFFFF",
        line: "#E4E9E4",
        ink: {
          DEFAULT: "#1E2B25",
          muted: "#5C6B63",
          soft: "#617168",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        serif: ["var(--font-lora)", "Georgia", "serif"],
        sans: ["var(--font-source)", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["clamp(2.4rem, 5.2vw, 4.25rem)", { lineHeight: "1.06", letterSpacing: "-0.035em" }],
        section: ["clamp(1.6rem, 2.7vw, 2.25rem)", { lineHeight: "1.2", letterSpacing: "-0.025em" }],
      },
      borderRadius: { xl: "0.85rem", "2xl": "1.15rem", "3xl": "1.6rem" },
      boxShadow: {
        card: "0 1px 2px rgba(18, 48, 38, 0.04), 0 10px 28px rgba(18, 48, 38, 0.06)",
        "card-hover": "0 18px 44px rgba(18, 48, 38, 0.13)",
        soft: "0 2px 12px rgba(18, 48, 38, 0.07)",
        glow: "0 12px 34px rgba(24, 60, 50, 0.22)",
      },
      backgroundImage: {
        "forest-gradient": "linear-gradient(135deg, #123026 0%, #183C32 48%, #245444 100%)",
        "paper-glow": "radial-gradient(1200px 600px at 85% -10%, rgba(198,161,91,0.16), transparent 60%)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.5s ease-out both",
        float: "float 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
