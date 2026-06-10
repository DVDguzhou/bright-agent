import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Source Han Serif SC", "Noto Serif SC", "Songti SC", "STSong", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        // === 杂志风色板（editorial palette） ===
        paper: {
          DEFAULT: "#fbfbf9", // 主页面：新闻纸白
          50: "#ffffff",
          100: "#fbfbf9",
          200: "#efeeea",
          300: "#e0dfd9",
        },
        ink: {
          DEFAULT: "#181816", // 主文字：中性近黑
          50: "#f4f4f2",
          100: "#e6e5e2",
          200: "#bcbab4",
          300: "#8e8c86",
          400: "#6b6a65",
          500: "#4d4c48",
          600: "#3a3935",
          700: "#272622",
          800: "#181816",
          900: "#0d0d0c",
        },
        hairline: "#dedcd6", // 发丝线分隔
        oxblood: {
          DEFAULT: "#c2271d", // 主强调色：印刷朱红（token 名沿用 oxblood）
          50: "#fcf1f0",
          100: "#f6d8d4",
          200: "#eba39b",
          400: "#d23a2e",
          500: "#c2271d",
          600: "#9e1f17",
          700: "#781711",
        },
        olive: {
          DEFAULT: "#4a5a2f", // 第二强调色：橄榄绿（用于状态/认证）
          400: "#5d7140",
          500: "#4a5a2f",
          600: "#3a4724",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%": { opacity: "0.5" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-mesh": "linear-gradient(to right, rgb(194 39 29 / 0.03), transparent 50%), linear-gradient(to bottom, rgb(24 24 22 / 0.03), transparent 50%)",
      },
      boxShadow: {
        "glow-sm": "0 0 15px -3px rgb(194 39 29 / 0.15), 0 0 30px -5px rgb(24 24 22 / 0.08)",
        "glow": "0 0 40px -10px rgb(194 39 29 / 0.2), 0 0 80px -20px rgb(24 24 22 / 0.1)",
        "glow-lg": "0 0 60px -15px rgb(194 39 29 / 0.25)",
        "inner-glow": "inset 0 0 60px -20px rgb(194 39 29 / 0.06)",
      },
      transitionDuration: {
        "400": "400ms",
      },
    },
  },
  plugins: [],
};
export default config;
