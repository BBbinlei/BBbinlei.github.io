import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 白银之城 · 皇家蔚蓝与深蓝底色
        royal: {
          950: "#060b18",
          900: "#0c152e",
          850: "#111f44",
          800: "#172b5d",
          700: "#1e3a8a",
          banner: "#193780",
        },
        // 宫殿立柱金纹与日光金辉
        gold: {
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        // 纯白大理石与云海白
        marble: {
          50: "#ffffff",
          100: "#f8fafc",
          200: "#f1f5f9",
          300: "#e2e8f0",
          400: "#cbd5e1",
        },
        // 运河飞瀑天青与碧水高光
        azure: {
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
        },
        // 兼容原设计 Tokens
        midnight: {
          950: "#060b18",
          900: "#0c152e",
          850: "#111f44",
          800: "#172b5d",
          700: "#1e3a8a",
        },
        silver: {
          50: "#ffffff",
          100: "#f8fafc",
          200: "#f1f5f9",
          300: "#e2e8f0",
          400: "#94a3b8",
          500: "#64748b",
        },
        cyanGlow: {
          DEFAULT: "#38bdf8",
          dim: "rgba(56, 189, 248, 0.15)",
          bright: "#7dd3fc",
        },
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', '"Hiragino Sans GB"', '"Microsoft YaHei"', 'sans-serif'],
        display: ['Cinzel', 'Georgia', 'serif'],
        serif: ['Cinzel', 'Georgia', 'serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(4, 10, 26, 0.45)',
        'rim-gold': '0 0 25px -2px rgba(245, 158, 11, 0.35)',
        'rim-azure': '0 0 25px -2px rgba(56, 189, 248, 0.35)',
        'inner-gold': 'inset 0 1px 0 0 rgba(251, 191, 36, 0.25)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
        'royal-banner': '0 10px 25px -3px rgba(10, 20, 60, 0.6), 0 0 15px rgba(245, 158, 11, 0.2)',
      },
      borderColor: {
        hairline: 'rgba(255, 255, 255, 0.14)',
        'hairline-gold': 'rgba(245, 158, 11, 0.35)',
        'hairline-azure': 'rgba(56, 189, 248, 0.35)',
        'gold-active': 'rgba(251, 191, 36, 0.7)',
      },
      animation: {
        'float-slow': 'float 7s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'water-flow': 'waterFlow 12s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
