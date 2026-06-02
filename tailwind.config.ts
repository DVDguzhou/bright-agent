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
        // === 暗色模式色板（dark mode palette） ===
        paper: {
          DEFAULT: "#0d0d0d", // 主页面：近黑
          50: "#1a1a1a",      // 卡片/浮层表面
          100: "#1a1a1a",
          200: "#222222",     // 骨架/悬停
          300: "#2a2a2a",     // 深悬停
        },
        ink: {
          DEFAULT: "#f0f0f0", // 主文字：近白
          50: "#2a2a2a",
          100: "#333333",
          200: "#555555",
          300: "#666666",
          400: "#888888",     // 次要文字
          500: "#a0a0a0",
          600: "#bbbbbb",
          700: "#cccccc",
          800: "#e0e0e0",
          900: "#f0f0f0",
        },
        hairline: "#252525",  // 深色分隔线
        oxblood: {
          DEFAULT: "#7a1f1f",
          50: "#fbf3f3",
          100: "#f1d9d9",
          200: "#d99a9a",
          400: "#9b2929",
          500: "#7a1f1f",
          600: "#641a1a",
          700: "#4d1414",
        },
        olive: {
          DEFAULT: "#4a5a2f",
          300: "#6eefc0",     // mint 别名
          400: "#5d7140",
          500: "#4a5a2f",
          600: "#3a4724",
        },
        mint: {
          DEFAULT: "#6eefc0",
          50: "#0f2820",
          400: "#4dd4a8",
          500: "#6eefc0",
          600: "#9ff5d4",
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
        "gradient-mesh": "linear-gradient(to right, rgb(122 31 31 / 0.03), transparent 50%), linear-gradient(to bottom, rgb(26 23 20 / 0.03), transparent 50%)",
      },
      boxShadow: {
        "glow-sm": "0 0 15px -3px rgb(122 31 31 / 0.15), 0 0 30px -5px rgb(26 23 20 / 0.08)",
        "glow": "0 0 40px -10px rgb(122 31 31 / 0.2), 0 0 80px -20px rgb(26 23 20 / 0.1)",
        "glow-lg": "0 0 60px -15px rgb(122 31 31 / 0.25)",
        "inner-glow": "inset 0 0 60px -20px rgb(122 31 31 / 0.06)",
      },
      transitionDuration: {
        "400": "400ms",
      },
    },
  },
  plugins: [],
};
export default config;
