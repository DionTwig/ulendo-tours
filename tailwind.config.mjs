/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    screens: {
      sm: "390px",
      md: "768px",
      lg: "1024px",
      xl: "1440px",
    },
    extend: {
      colors: {
        "green-900": "#0A3A31",
        "green-700": "#0E574A",
        "green-500": "#14705F",
        "orange-500": "#F15C22",
        "orange-600": "#D14A16",
        "cream-100": "#EFF5CF",
        "blue-50": "#E4F0F3",
      },
      fontFamily: {
        sans: [
          "Instrument Sans Variable",
          "Instrument Sans",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      maxWidth: {
        content: "1240px",
      },
      borderRadius: {
        card: "28px",
        pill: "999px",
      },
      spacing: {
        gutter: "100px",
        "gutter-mobile": "20px",
      },
      letterSpacing: {
        tight: "-0.025em",
        eyebrow: "0.022em",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        reveal: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      fontSize: {
        "h1-desktop": ["76px", { lineHeight: "1.02", letterSpacing: "-0.025em", fontWeight: "700" }],
        "h1-mobile": ["40px", { lineHeight: "1.05", letterSpacing: "-0.025em", fontWeight: "700" }],
        "h2-desktop": ["50px", { lineHeight: "1.05", letterSpacing: "-0.025em", fontWeight: "700" }],
        "h2-mobile": ["32px", { lineHeight: "1.1", letterSpacing: "-0.025em", fontWeight: "700" }],
        "h3-desktop": ["22px", { lineHeight: "1.3", fontWeight: "700" }],
        "h3-mobile": ["20px", { lineHeight: "1.3", fontWeight: "700" }],
        "body-desktop": ["17px", { lineHeight: "1.65", fontWeight: "400" }],
        "body-mobile": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        eyebrow: ["13px", { lineHeight: "1.4", letterSpacing: "2.2px", fontWeight: "600" }],
        "eyebrow-mobile": ["12px", { lineHeight: "1.4", letterSpacing: "2.2px", fontWeight: "600" }],
        button: ["16px", { lineHeight: "1.2", fontWeight: "600" }],
        "button-mobile": ["15px", { lineHeight: "1.2", fontWeight: "600" }],
      },
    },
  },
  plugins: [],
};
