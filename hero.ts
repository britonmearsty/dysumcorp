import { heroui } from "@heroui/theme";

export default heroui({
  themes: {
    light: {
      colors: {
        background: "#FAFAFA",
        foreground: "#1A1A1A",
        primary: {
          50: "#E6FAF5",
          100: "#CCF5EB",
          200: "#99EBD7",
          300: "#66E0C3",
          400: "#33D6AF",
          500: "#10B981",
          600: "#0D9668",
          700: "#0A714E",
          800: "#064D35",
          900: "#03281B",
          DEFAULT: "#10B981",
          foreground: "#FFFFFF",
        },
        secondary: {
          50: "#FFF5F0",
          100: "#FFEBE0",
          200: "#FFD6C2",
          300: "#FFC2A3",
          400: "#FFAD85",
          500: "#F97316",
          600: "#EA6C10",
          700: "#C45A0D",
          800: "#9E480A",
          900: "#783708",
          DEFAULT: "#F97316",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#22C55E",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#FBBF24",
          foreground: "#1A1A1A",
        },
        danger: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
      },
    },
    dark: {
      colors: {
        background: "#0A0A0A",
        foreground: "#FAFAFA",
        primary: {
          50: "#03281B",
          100: "#064D35",
          200: "#0A714E",
          300: "#0D9668",
          400: "#10B981",
          500: "#34D399",
          600: "#5EEAD4",
          700: "#99F6E4",
          800: "#CCFBF1",
          900: "#E6FDF8",
          DEFAULT: "#34D399",
          foreground: "#0A0A0A",
        },
        secondary: {
          50: "#783708",
          100: "#9E480A",
          200: "#C45A0D",
          300: "#EA6C10",
          400: "#F97316",
          500: "#FB923C",
          600: "#FDBA74",
          700: "#FED7AA",
          800: "#FFEDD5",
          900: "#FFF7ED",
          DEFAULT: "#FB923C",
          foreground: "#0A0A0A",
        },
        success: {
          DEFAULT: "#4ADE80",
          foreground: "#0A0A0A",
        },
        warning: {
          DEFAULT: "#FCD34D",
          foreground: "#0A0A0A",
        },
        danger: {
          DEFAULT: "#F87171",
          foreground: "#0A0A0A",
        },
      },
    },
  },
});
