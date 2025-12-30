export type ThemeMode = "light" | "dark";

export type Theme = {
  mode: ThemeMode;
  colors: {
    bg: string;
    surface: string;
    surface2: string;
    text: string;
    muted: string;
    border: string;
    accent: string;      // orange
    accentSoft: string;  // soft orange bg
    success: string;
    danger: string;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  spacing: (n: number) => number;
};

const common = {
  radius: { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 },
  spacing: (n: number) => n * 8,
};

export const lightTheme: Theme = {
  mode: "light",
  colors: {
    bg: "#FFFFFF",
    surface: "#F6F7FB",
    surface2: "#FFFFFF",
    text: "#121826",
    muted: "#6B7280",
    border: "#E6E7EE",
    accent: "#F39A2E",
    accentSoft: "#FFE5C8",
    success: "#22C55E",
    danger: "#EF4444",
  },
  ...common,
};

export const darkTheme: Theme = {
  mode: "dark",
  colors: {
    bg: "#0B1220",
    surface: "#101826",
    surface2: "#0E1726",
    text: "#F3F4F6",
    muted: "#9CA3AF",
    border: "#223048",
    accent: "#F39A2E",
    accentSoft: "#2A1B0A",
    success: "#22C55E",
    danger: "#F87171",
  },
  ...common,
};
