import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Inter", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 55px rgba(0, 0, 0, 0.08)",
        panel: "0 10px 30px rgba(0, 0, 0, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
