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
          DEFAULT: "#f4efe6", // 主页面：暖米纸
          50: "#faf7f1",
          100: "#f4efe6",
          200: "#ebe3d4",
          300: "#dccfb8",
        },
        ink: {
          DEFAULT: "#1a1714", // 主文字：暖近黑
          50: "#f5f3f0",
          100: "#e6e1da",
          200: "#bfb6aa",
          300: "#8d8478",
          400: "#6b635a",
          500: "#4d463f",
          600: "#3a342e",
          700: "#272320",
          800: "#1a1714",
          900: "#0d0b09",
        },
        hairline: "#d8cfbf", // 发丝线分隔
        oxblood: {
          DEFAULT: "#7a1f1f", // 主强调色：酒红
          50: "#fbf3f3",
          100: "#f1d9d9",
          200: "#d99a9a",
          400: "#9b2929",
          500: "#7a1f1f",
          600: "#641a1a",
          700: "#4d1414",
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
        "gradient-mesh": "linear-gradient(to right, rgb(6 182 212 / 0.05), transparent 50%), linear-gradient(to bottom, rgb(16 185 129 / 0.05), transparent 50%)",
      },
      boxShadow: {
        "glow-sm": "0 0 15px -3px rgb(6 182 212 / 0.3), 0 0 30px -5px rgb(16 185 129 / 0.2)",
        "glow": "0 0 40px -10px rgb(6 182 212 / 0.4), 0 0 80px -20px rgb(16 185 129 / 0.3)",
        "glow-lg": "0 0 60px -15px rgb(6 182 212 / 0.5)",
        "inner-glow": "inset 0 0 60px -20px rgb(6 182 212 / 0.1)",
      },
      transitionDuration: {
        "400": "400ms",
      },
    },
  },
  plugins: [],
};
export default config;
