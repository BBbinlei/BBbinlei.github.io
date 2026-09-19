import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { LoadingScreen } from "@/components/LoadingScreen";

export const metadata: Metadata = {
  title: "Binlei | 动画与游戏多模态 AI 数据构建 · 模型评测与自动化",
  description:
    "专注动画与游戏方向的多模态 AI 数据构建、模型评测与自动化流水线。具备 Video-to-Text、五层图像描述体系、双盲评测与 3x 提效工程经验。",
  keywords: [
    "多模态 AI",
    "AI 数据构建",
    "模型评测",
    "Video-to-Text",
    "Prompt Engineering",
    "AI 自动化",
    "游戏动画 AIGC",
    "白银之城",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('pt-js');setTimeout(function(){document.documentElement.classList.add('pt-timeout')},3500);`,
          }}
        />
      </head>
      <body className="bg-royal-950 min-h-screen text-marble-100 flex flex-col antialiased selection:bg-gold-500/30 selection:text-white relative">
        <InteractiveBackground />
        <LoadingScreen />
        <div id="top" />
        <Navbar />
        <main className="flex-grow relative z-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
