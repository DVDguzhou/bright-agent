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
        // === 灯下纸面色板：暖纸灰底 + 暖碳墨 + 灯金强调 ===
        paper: {
          DEFAULT: "#f2f1ed", // 页面底：暖纸灰（比卡片深半档，让白卡片浮起来）
          50: "#ffffff",
          100: "#f2f1ed",
          200: "#ebe9e2",
          300: "#dcd9cf",
        },
        ink: {
          DEFAULT: "#1c1a16", // 主文字：暖碳墨
          50: "#f4f2eb",
          100: "#e6e2d8",
          200: "#b9b3a5",
          300: "#847d6f",
          400: "#655f52",
          500: "#474337",
          600: "#37332a",
          700: "#282520",
          800: "#1c1a16",
          900: "#0d0b08",
        },
        hairline: "#ddd8cc", // 发丝线分隔
        signal: {
          // 灯金：评分、收藏点亮、选中、hover 回应、通知——「值得注意的好事」
          DEFAULT: "#c08f27",
          50: "#fdf9ee",
          100: "#f8efd2",
          200: "#efdda4",
          300: "#e4c46a",
          400: "#d4a73c",
          500: "#c08f27",
          600: "#9d7218",
          700: "#7a5712",
        },
        oxblood: {
          DEFAULT: "#c2271d", // 错误和高危状态保留红色，常规强调使用 signal
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
        "gradient-mesh": "linear-gradient(to right, rgb(192 143 39 / 0.05), transparent 50%), linear-gradient(to bottom, rgb(28 26 22 / 0.03), transparent 50%)",
      },
      boxShadow: {
        "glow-sm": "0 1px 2px rgb(28 26 22 / 0.05), 0 10px 24px -16px rgb(28 26 22 / 0.20)",
        "glow": "0 1px 2px rgb(28 26 22 / 0.06), 0 18px 44px -24px rgb(28 26 22 / 0.26)",
        "glow-lg": "0 24px 72px -32px rgb(28 26 22 / 0.34)",
        "inner-glow": "inset 0 0 60px -20px rgb(192 143 39 / 0.08)",
      },
      transitionDuration: {
        "400": "400ms",
      },
    },
  },
  plugins: [],
};
export default config;
