import { PROJECTS } from "@/data/projects";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { BannerHeading } from "@/components/pretext/BannerHeading";
import { LampLitText } from "@/components/pretext/LampLitText";

export const metadata = {
  title: "项目案例库 | Binlei - 多模态 AI 数据与模型评测",
  description: "精选游戏/动画视频多模态数据、图像五层描述体系与双盲评测、AI 自动化流水线三大深度案例。",
};

export default function ProjectsPage() {
  const romanCases = ["CASE I", "CASE II", "CASE III", "CASE IV"];

  return (
    <div className="pt-28 pb-20 px-4 max-w-6xl mx-auto">
      {/* 顶部返回与导航 */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-marble-400 hover:text-gold-300 transition-colors font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回首页概览</span>
        </Link>
      </div>

      {/* 页面标题 */}
      <div className="mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full royal-banner text-xs text-gold-200 font-mono mb-3 shadow-royal-banner">
          <Sparkles className="w-3 h-3 text-gold-300" />
          <span>CASE STUDIES & PORTFOLIO</span>
        </div>
        <BannerHeading
          as="h1"
          text="精选项目与实践案例"
          align="left"
          className="text-3xl sm:text-5xl font-bold text-marble-50 font-serif mb-4 leading-[1.2]"
        />
        <LampLitText
          text="每个案例均按照【业务背景 → 关键难点 → 解决方案与数据规范 → 评测与质控 → 业务成效】标准展开，为技术面试官与团队负责人提供详尽的方法论支撑。"
          className="text-sm sm:text-base text-marble-300 max-w-2xl leading-relaxed"
        />
      </div>

      {/* 案例列表 */}
      <div className="space-y-8">
        {PROJECTS.map((project, idx) => (
          <div
            key={project.id}
            className="glass-panel rounded-2xl p-8 border border-hairline-gold hover:border-gold-400/60 shadow-inner-gold transition-all"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gold-500/15">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-serif font-bold text-gold-300 tracking-wider">
                    {romanCases[idx] || `CASE 0${idx + 1}`}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full royal-banner text-gold-200 border border-gold-400/30 font-mono">
                    {project.category}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-marble-50 font-serif">
                  {project.title}
                </h2>
                <p className="text-xs sm:text-sm text-marble-300/80 mt-1">
                  {project.subtitle}
                </p>
              </div>

              {/* 关键数据徽章 */}
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 rounded-xl bg-royal-850 border border-gold-500/30 text-xs text-gold-200 flex items-center gap-2 shadow-inner-gold">
                  <CheckCircle2 className="w-4 h-4 text-gold-400" />
                  <span className="font-medium">{project.badge}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
              {/* 业务挑战 */}
              <div className="bg-royal-900/60 p-4 rounded-xl border border-gold-500/20">
                <div className="text-xs font-mono text-gold-300 mb-2 font-semibold">
                  01. 核心挑战 (CHALLENGES)
                </div>
                <ul className="text-xs text-marble-300 space-y-1.5 list-disc list-inside">
                  {project.challenges.slice(0, 2).map((c, i) => (
                    <li key={i} className="line-clamp-2 leading-relaxed">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 解决方案 */}
              <div className="bg-royal-900/60 p-4 rounded-xl border border-gold-500/20">
                <div className="text-xs font-mono text-gold-300 mb-2 font-semibold">
                  02. 解决方案 (SOLUTION)
                </div>
                <ul className="text-xs text-marble-300 space-y-1.5 list-disc list-inside">
                  {project.solutions.slice(0, 2).map((s, i) => (
                    <li key={i} className="line-clamp-2 leading-relaxed">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 业务影响与跳转 */}
              <div className="bg-royal-900/60 p-4 rounded-xl border border-gold-500/20 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono text-azure-300 mb-2 font-semibold">
                    03. 交付价值 (IMPACT)
                  </div>
                  <ul className="text-xs text-marble-300 space-y-1.5 list-disc list-inside">
                    {project.impact.slice(0, 2).map((im, i) => (
                      <li key={i} className="line-clamp-2 leading-relaxed">
                        {im}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 mt-4 border-t border-gold-500/15">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="w-full px-4 py-2 rounded-lg text-xs font-semibold btn-royal-gold flex items-center justify-between shadow-rim-gold"
                  >
                    <span>阅读详细 Case Study</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gold-200" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
