import { PROJECTS } from "@/data/projects";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ShieldCheck, FileCheck, Layers, Award } from "lucide-react";

export function generateStaticParams() {
  return PROJECTS.map((project) => ({
    slug: project.slug,
  }));
}

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="pt-28 pb-24 px-4 max-w-4xl mx-auto">
      {/* 顶部面包屑与返回 */}
      <div className="mb-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-marble-400 hover:text-gold-300 transition-colors font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回案例列表</span>
        </Link>
      </div>

      {/* 项目头部 Header */}
      <header className="glass-panel rounded-3xl p-8 sm:p-10 border border-hairline-gold mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-b from-gold-500/10 to-azure-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs px-3 py-1 rounded-full royal-banner border border-gold-400/40 text-gold-200 font-mono shadow-royal-banner">
            {project.category}
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-royal-850 border border-gold-500/30 text-gold-200 font-mono shadow-inner-gold">
            {project.badge}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold text-marble-50 font-serif leading-tight mb-4">
          {project.title}
        </h1>

        <p className="text-sm sm:text-base text-marble-300 leading-relaxed mb-8">
          {project.subtitle}
        </p>

        {/* 关键核心数据栏 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gold-500/15">
          {project.keyMetrics.map((metric) => (
            <div key={metric.label} className="bg-royal-900/80 p-3.5 rounded-xl border border-gold-500/20 shadow-inner-gold">
              <div className="text-xs text-marble-400 mb-0.5">{metric.label}</div>
              <div className="text-xl sm:text-2xl font-bold text-marble-50 font-serif">
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* 正文：5 个标准化 Case Study 模块 */}
      <div className="space-y-10 text-marble-200">
        {/* 1. 业务背景 */}
        <section className="glass-panel rounded-2xl p-7 border border-hairline-gold">
          <div className="flex items-center gap-2 text-gold-300 text-xs font-mono font-bold mb-3">
            <Layers className="w-4 h-4" />
            <span>01. CONTEXT / 业务背景与目标</span>
          </div>
          <p className="text-sm sm:text-base text-marble-300 leading-relaxed">
            {project.context}
          </p>
        </section>

        {/* 2. 关键业务与技术难点 */}
        <section className="glass-panel rounded-2xl p-7 border border-hairline-gold">
          <div className="flex items-center gap-2 text-gold-300 text-xs font-mono font-bold mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>02. CHALLENGES / 核心技术难点</span>
          </div>
          <ul className="space-y-3 text-sm text-marble-300">
            {project.challenges.map((c, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 mt-2 flex-shrink-0" />
                <span className="leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. 解决方案与规范设计 */}
        <section className="glass-panel rounded-2xl p-7 border border-hairline-gold border-l-2 border-l-gold-400">
          <div className="flex items-center gap-2 text-gold-300 text-xs font-mono font-bold mb-3">
            <FileCheck className="w-4 h-4" />
            <span>03. SOLUTION / 解决方案与工程设计</span>
          </div>
          <div className="space-y-3 text-sm text-marble-300">
            {project.solutions.map((s, i) => (
              <div key={i} className="p-3 rounded-lg bg-royal-900/60 border border-gold-500/15 leading-relaxed">
                {s}
              </div>
            ))}
          </div>
        </section>

        {/* 4. 评测流与质量把控 */}
        <section className="glass-panel rounded-2xl p-7 border border-hairline-gold">
          <div className="flex items-center gap-2 text-gold-300 text-xs font-mono font-bold mb-3">
            <CheckCircle2 className="w-4 h-4" />
            <span>04. EVALUATION & QA / 评测与质控闭环</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {project.evaluationWorkflow.map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-3 rounded-xl bg-royal-900/80 border border-gold-500/20 text-xs text-marble-200 shadow-inner-gold"
              >
                <div className="w-5 h-5 rounded-full bg-royal-800 text-gold-300 border border-gold-400/40 flex items-center justify-center font-mono text-[10px] font-bold">
                  {i + 1}
                </div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 5. 业务收益与交付物 */}
        <section className="glass-panel rounded-2xl p-7 border border-hairline-gold">
          <div className="flex items-center gap-2 text-gold-300 text-xs font-mono font-bold mb-3">
            <Award className="w-4 h-4" />
            <span>05. IMPACT & DELIVERABLES / 交付结果与价值</span>
          </div>
          <div className="space-y-2 mb-6">
            {project.impact.map((imp, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-marble-200">
                <span className="text-gold-400 font-bold">✓</span>
                <span className="leading-relaxed">{imp}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gold-500/15">
            <div className="text-xs font-mono text-marble-400 mb-2">项目交付文档与资产：</div>
            <div className="flex flex-wrap gap-2">
              {project.deliverables.map((deliv) => (
                <span
                  key={deliv}
                  className="px-3 py-1 rounded bg-royal-900/80 border border-gold-500/20 text-xs text-marble-300 font-mono"
                >
                  {deliv}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 底部导航 */}
      <div className="mt-16 flex items-center justify-between pt-8 border-t border-gold-500/15">
        <Link
          href="/projects"
          className="text-xs font-mono text-marble-400 hover:text-gold-300 transition-colors"
        >
          ← 所有项目案例
        </Link>
        <Link
          href="/about#resume"
          className="px-5 py-2 rounded-full text-xs font-medium btn-royal-gold shadow-rim-gold"
        >
          获取完整简历
        </Link>
      </div>
    </div>
  );
}
