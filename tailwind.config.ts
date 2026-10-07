import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        muted: "#667085",
        line: "#d9e2ec",
        panel: "#ffffff",
        canvas: "#f7f9fc",
        accent: "#0f766e",
        warn: "#b42318"
      }
    }
  },
  plugins: []
};

export default config;
