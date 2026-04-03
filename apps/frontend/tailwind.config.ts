import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
        },
        neutral: {
          50: "#000000",
          100: "#0f0f0f",
          200: "#111111",
          300: "#1f1f1f",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f1f1f",
          900: "#0f0f0f",
        },
        success: {
          500: "#22c55e",
          600: "#16a34a",
        },
        error: {
          500: "#ef4444",
          600: "#dc2626",
        },
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(17, 24, 39, 0.06)",
        medium: "0 8px 24px rgba(17, 24, 39, 0.10)",
        strong: "0 14px 36px rgba(17, 24, 39, 0.16)",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
    },
  },
};

export default config;
