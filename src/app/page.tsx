import { Hero } from "@/components/Hero";
import { PerspectiveNarrative } from "@/components/PerspectiveNarrative";
import { ProjectCards } from "@/components/ProjectCards";
import { Capabilities } from "@/components/Capabilities";
import { ContactSection } from "@/components/ContactSection";
import { PROJECTS } from "@/data/projects";

export default function Home() {
  return (
    <div>
      {/* 1. 全屏沉浸式 Hero 首屏 */}
      <Hero />

      {/* 2. 身份叙事与核心差异化认知：Pretext 驱动的双重视角交互切换器 */}
      <PerspectiveNarrative />

      {/* 3. 精选三大项目卡片 (由 Pretext 驱动文本等高对齐) */}
      <ProjectCards projects={PROJECTS} />

      {/* 4. 四大核心能力支柱与团队管理指标 */}
      <Capabilities />

      {/* 6. 底部联系与行动转化 */}
      <ContactSection />
    </div>
  );
}
