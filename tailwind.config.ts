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
        // === 现代内容产品色板 ===
        paper: {
          DEFAULT: "#f6f7f5", // 主页面：现代矿物白
          50: "#ffffff",
          100: "#f7f8f6",
          200: "#eef1ed",
          300: "#d9ded8",
        },
        ink: {
          DEFAULT: "#111513", // 主文字：现代中性碳黑
          50: "#f2f4f2",
          100: "#e2e6e2",
          200: "#b5beb7",
          300: "#7b837d",
          400: "#5c655f",
          500: "#3f4642",
          600: "#303632",
          700: "#232825",
          800: "#111513",
          900: "#080a09",
        },
        hairline: "#d8ded9", // 发丝线分隔
        signal: {
          DEFAULT: "#0f766e",
          50: "#edfafa",
          100: "#d6f3ef",
          200: "#a9e4dc",
          400: "#2aa79b",
          500: "#0f766e",
          600: "#0b5f59",
          700: "#084a46",
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
        "gradient-mesh": "linear-gradient(to right, rgb(15 118 110 / 0.035), transparent 50%), linear-gradient(to bottom, rgb(17 21 19 / 0.03), transparent 50%)",
      },
      boxShadow: {
        "glow-sm": "0 10px 28px -18px rgb(17 21 19 / 0.22)",
        "glow": "0 18px 52px -28px rgb(17 21 19 / 0.28)",
        "glow-lg": "0 24px 72px -32px rgb(17 21 19 / 0.34)",
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
