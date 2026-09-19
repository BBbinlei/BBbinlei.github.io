import { EXPERIENCES, CAPABILITY_PILLARS, MANAGEMENT_METRICS } from "@/data/experience";
import Link from "next/link";
import { ArrowLeft, Briefcase, Sparkles, CheckCircle2, ShieldAlert, Cpu, Terminal } from "lucide-react";
import { BannerHeading } from "@/components/pretext/BannerHeading";
import { LampLitText } from "@/components/pretext/LampLitText";

export const metadata = {
  title: "经历与能力架构 | Binlei - 多模态 AI 数据与模型评测",
  description: "详尽展现职业实践、多模态方法论、10 人质控团队管理以及工程化提效经验。",
};

export default function ExperiencePage() {
  return (
    <div className="pt-28 pb-24 px-4 max-w-5xl mx-auto">
      {/* 顶部返回 */}
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
          <span>EXPERIENCE & ARCHITECTURE</span>
        </div>
        <BannerHeading
          as="h1"
          text="职业经历与能力体系"
          align="left"
          className="text-3xl sm:text-5xl font-bold text-marble-50 font-serif mb-4 leading-[1.2]"
        />
        <LampLitText
          text="以“多模态数据架构”为基座，贯穿业务痛点剖析、数据规范制定、自动化提效、盲评仲裁与跨部门算法协同。"
          className="text-sm sm:text-base text-marble-300 max-w-2xl leading-relaxed"
        />
      </div>

      {/* 1. 职业实践时间线 */}
      <section className="mb-16">
        <h2 className="text-xl sm:text-2xl font-bold text-marble-50 font-serif mb-6 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-gold-300" />
          <span>核心业务实践与角色</span>
        </h2>

        <div className="space-y-8">
          {EXPERIENCES.map((exp, idx) => (
            <div key={idx} className="glass-panel rounded-2xl p-8 border border-hairline-gold relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg sm:text-xl font-bold text-marble-50 font-serif">
                    {exp.company}
                  </span>
                  <span className="text-xs font-mono text-gold-300 px-2.5 py-0.5 rounded bg-royal-900/80 border border-gold-500/20">
                    {exp.period}
                  </span>
                </div>
                <span className="text-xs font-mono text-gold-200 px-3 py-1 rounded-full royal-banner border border-gold-400/30 shadow-royal-banner self-start sm:self-auto">
                  {exp.teamSize}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-semibold text-gold-200 mb-1">
                {exp.role}
              </h3>
              <p className="text-xs sm:text-sm text-marble-300/80 mb-6 leading-relaxed">
                {exp.focus}
              </p>

              {/* 业务背景 */}
              <div className="p-4 rounded-xl bg-royal-900/50 border border-gold-500/15 mb-6 text-xs sm:text-sm text-marble-300 leading-relaxed">
                <span className="text-gold-300 font-mono font-bold block mb-1">业务背景与核心约束：</span>
                {exp.context}
              </div>

              {/* 主要职责与成果 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gold-500/15">
                <div>
                  <h4 className="text-xs font-mono text-gold-300 font-bold mb-3 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                    <span>主要职责 (Key Responsibilities)</span>
                  </h4>
                  <div className="space-y-3">
                    {exp.responsibilities.map((r, i) => (
                      <div key={i} className="text-xs text-marble-300 leading-relaxed bg-royal-950/40 p-3 rounded-lg border border-gold-500/10">
                        <span className="text-marble-100 font-semibold block mb-0.5 font-sans">
                          {i + 1}. {r.title}
                        </span>
                        <span className="text-marble-300/90">{r.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono text-gold-300 font-bold mb-3 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-azure-400" />
                    <span>主要成果 (Key Achievements)</span>
                  </h4>
                  <div className="space-y-3">
                    {exp.achievements.map((ach, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-marble-200 bg-royal-950/40 p-3 rounded-lg border border-azure-400/10">
                        <span className="text-gold-300 font-bold mt-0.5 flex-shrink-0">✓</span>
                        <span className="leading-relaxed">{ach}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. 团队质量管理指标 */}
      <section className="mb-16">
        <h2 className="text-xl sm:text-2xl font-bold text-marble-50 font-serif mb-6 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-gold-300" />
          <span>团队赋能与质控管理机制</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {MANAGEMENT_METRICS.map((metric) => (
            <div key={metric.label} className="glass-panel p-5 rounded-xl border border-hairline-gold shadow-inner-gold">
              <div className="text-2xl sm:text-3xl font-bold text-marble-50 font-serif mb-1">
                {metric.value}
              </div>
              <div className="text-xs font-medium text-gold-300 mb-1 font-mono">
                {metric.label}
              </div>
              <div className="text-xs text-marble-300/80 leading-relaxed">
                {metric.desc}
              </div>
            </div>
          ))}
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-hairline-gold bg-royal-900/40">
          <h4 className="text-sm font-bold text-marble-100 font-serif mb-2">质控 SOP 关键节点：</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-marble-300">
            <div className="p-3 rounded-lg bg-royal-950/80 border border-gold-500/20">
              <div className="font-mono text-gold-300 mb-1 font-semibold">1. 准入测试</div>
              <p className="text-marble-400">设立包含 30+ 典型 Boundary Case 的标准化考核卷，通过率达标方可进入项目流水线。</p>
            </div>
            <div className="p-3 rounded-lg bg-royal-950/80 border border-gold-500/20">
              <div className="font-mono text-gold-300 mb-1 font-semibold">2. 每日抽检仲裁</div>
              <p className="text-marble-400">抽检比例不低于 15%，遇到主观分歧即时归入仲裁样本库，定期组织校准会对齐尺度。</p>
            </div>
            <div className="p-3 rounded-lg bg-royal-950/80 border border-gold-500/20">
              <div className="font-mono text-gold-300 mb-1 font-semibold">3. Bad Case 沉淀</div>
              <p className="text-marble-400">将手部穿模、肢体畸变、光影矛盾等问题模块化归档，反哺 Prompt 优化与算法微调。</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 工具与技术栈 */}
      <section className="mb-16">
        <h2 className="text-xl sm:text-2xl font-bold text-marble-50 font-serif mb-6 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-azure-400" />
          <span>多模态技术栈与工具体系</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-5 rounded-xl border border-hairline-gold">
            <div className="text-xs font-mono text-gold-300 font-bold mb-2">多模态与生成式工具</div>
            <div className="flex flex-wrap gap-1.5">
              {["Video-to-Text", "T2I / I2I", "Prompt Engineering", "Stable Diffusion", "Midjourney", "MiniMax Video API"].map((t) => (
                <span key={t} className="text-[11px] px-2.5 py-1 rounded bg-royal-900/80 border border-gold-500/20 text-marble-200 font-mono">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-hairline-gold">
            <div className="text-xs font-mono text-gold-300 font-bold mb-2">工程与自动化</div>
            <div className="flex flex-wrap gap-1.5">
              {["Python 自动化脚本", "结构化 JSON 批处理", "参数化标签生成", "软硬约束逻辑", "数据清洗管线"].map((t) => (
                <span key={t} className="text-[11px] px-2.5 py-1 rounded bg-royal-900/80 border border-gold-500/20 text-marble-200 font-mono">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-hairline-gold">
            <div className="text-xs font-mono text-azure-400 font-bold mb-2">视觉与审美基础</div>
            <div className="flex flex-wrap gap-1.5">
              {["游戏过场 CG 镜头语言", "动画时序切片", "3D 骨骼与碰撞理解", "光影与渲染风格", "二次元艺术理解"].map((t) => (
                <span key={t} className="text-[11px] px-2.5 py-1 rounded bg-royal-900/80 border border-azure-400/20 text-marble-200 font-mono">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 底部引导 */}
      <div className="p-8 rounded-2xl glass-panel border border-hairline-gold shadow-rim-gold/20 text-center">
        <h3 className="text-lg font-bold text-marble-50 font-serif mb-2">需要查阅详细履历或安排面试？</h3>
        <p className="text-xs text-marble-300/80 mb-6 max-w-md mx-auto">
          可直接下载排版精良的 PDF 简历，或点击下方按钮发起联系。
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/about#resume"
            className="px-6 py-2.5 rounded-full text-xs font-semibold btn-royal-gold shadow-rim-gold"
          >
            下载完整简历 PDF
          </Link>
          <Link
            href="/#contact"
            className="px-6 py-2.5 rounded-full text-xs font-medium btn-royal-azure"
          >
            取得联系
          </Link>
        </div>
      </div>
    </div>
  );
}
