import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        surface2: "var(--surface2)",
        border: "var(--border)",
        border2: "var(--border2)",
        accent: "var(--accent)",
        "accent-dim": "var(--accent-dim)",
        "accent-glow": "var(--accent-glow)",
        gold: "var(--gold)",
        text: "var(--text)",
        muted: "var(--muted)",
        green: "var(--green)",
        red: "var(--red)",
        amber: "var(--amber)",
        blue: "var(--blue)",
      },
    },
  },
  plugins: [],
};
export default config;
