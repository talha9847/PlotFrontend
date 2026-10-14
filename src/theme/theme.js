/**
 * Central design tokens for the green-and-white real-estate dashboard.
 * Tailwind colors can consume these as rgb(var(--brand-500) / <alpha-value>).
 * Keep token values as space-separated RGB channels for Tailwind opacity support.
 */
export const theme = {
  brand: {
    50: "240 249 244",
    100: "220 241 228",
    200: "185 225 199",
    300: "132 202 160",
    400: "67 169 112",
    500: "24 139 82",
    600: "18 116 68",
    700: "16 91 56",
    800: "15 72 47",
    900: "13 53 36",
  },
  ink: "20 38 29",
  muted: "103 120 109",
  canvas: "246 250 247",
  surface: "255 255 255",
  line: "224 235 226",
  accent: "205 231 154",
  danger: "200 63 73",
  blue: "55 119 211",
};

export function applyTheme(root = document.documentElement) {
  if (!root) return;
  Object.entries(theme.brand).forEach(([key, value]) => {
    root.style.setProperty(`--brand-${key}`, value);
  });
  for (const key of [
    "ink",
    "muted",
    "canvas",
    "surface",
    "line",
    "accent",
    "danger",
    "blue",
  ]) {
    root.style.setProperty(`--${key}`, theme[key]);
  }

  // Semantic aliases used by components and application-wide CSS.
  root.style.setProperty("--success", theme.brand[600]);
  root.style.setProperty("--focus-ring", theme.brand[100]);
  root.style.colorScheme = "light";
}

export default theme;
