"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { prepare, layout } from "@chenglou/pretext";
import { ProjectItem } from "@/data/projects";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { BannerHeading } from "@/components/pretext/BannerHeading";
import { LampLitText } from "@/components/pretext/LampLitText";
import { CascadeText } from "@/components/pretext/CascadeText";
import { useInViewOnce } from "@/lib/pretext/hooks";

// 与 globals.css 及 design-system.md 完全严格吻合的排印参数 (px)
const CARD_DESC_FONT = '400 15px Inter, "PingFang SC", sans-serif';
const CARD_DESC_LINE_HEIGHT = 24;

const DESC_RUNS = [
  { text: "拒绝简单罗列“做了什么”，而是完整展现" },
  {
    text: "【业务痛点 → 数据规范 → 双盲评测 → 自动化管线】",
    className: "text-gold-200 font-medium",
    weight: 500,
  },
  { text: "的解决思考。" },
];

interface ProjectCardsProps {
  projects: ProjectItem[];
}

export function ProjectCards({ projects }: ProjectCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cardMeasureRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState<number>(0);
  const [fontReady, setFontReady] = useState<boolean>(false);

  const gridInView = useInViewOnce(gridRef);

  // 1. 等待真实 Web 字体加载就绪，杜绝在 fallback 字体上做几何测量
  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => setFontReady(true));
    } else {
      setFontReady(true);
    }
  }, []);

  // 2. 观察卡片容器文本可用宽度变化 (ResizeObserver)
  useEffect(() => {
    const el = cardMeasureRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) {
        setContentWidth(entry.contentRect.width);
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 3. Prepare 阶段：仅当文案或字体状态变化时执行，缓存 prepare handle，不受宽度缩放影响
  const preparedList = useMemo(() => {
    if (!fontReady) return null;
    try {
      return projects.map((p) =>
        prepare(p.description, CARD_DESC_FONT, {
          whiteSpace: "normal",
          letterSpacing: 0,
        })
      );
    } catch {
      return null;
    }
  }, [projects, fontReady]);

  // 4. Layout 阶段：在宽度变化时运行极速几何计算，得出各卡片高度，并计算行最大高度
  const equalRowHeight = useMemo(() => {
    if (!preparedList || contentWidth <= 0) return undefined;
    try {
      // 仅在多列桌面端（宽度足够承载单卡）统一行高；若太窄则自然流动
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        return undefined;
      }
      const heights = preparedList.map(
        (p) => layout(p, contentWidth, CARD_DESC_LINE_HEIGHT).height
      );
      return Math.max(...heights);
    } catch {
      return undefined;
    }
  }, [preparedList, contentWidth]);

  const romanNumerals = ["CASE I", "CASE II", "CASE III", "CASE IV"];

  return (
    <div id="projects" className="py-20 px-4 max-w-6xl mx-auto" ref={containerRef}>
      {/* 模块标题与业务心智强化 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div className="flex-1 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full royal-banner text-xs text-gold-200 font-mono mb-3 shadow-royal-banner">
            <Sparkles className="w-3 h-3 text-gold-300" />
            <span>SELECTED CASE STUDIES</span>
          </div>
          <BannerHeading
            as="h2"
            text="精选代表作与多模态实践"
            align="left"
            className="text-2xl sm:text-4xl font-bold text-marble-50 font-serif tracking-tight leading-[1.25]"
          />
        </div>
        <LampLitText
          runs={DESC_RUNS}
          className="text-sm text-marble-300 max-w-md leading-relaxed"
        />
      </div>

      {/* 3 大卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" ref={gridRef}>
        {projects.map((project, idx) => {
          return (
            <div
              key={project.id}
              className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between relative group border border-hairline-gold overflow-hidden"
            >
              {/* 顶部挂旗与罗马序号 */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-[11px] font-mono tracking-wider px-2.5 py-0.5 rounded royal-banner text-gold-200 border border-gold-400/30">
                  {project.category}
                </span>
                <span className="text-xs font-serif font-bold tracking-widest text-gold-300/90">
                  {romanNumerals[idx] || `CASE 0${idx + 1}`}
                </span>
              </div>

              {/* 标题 */}
              <div>
                <h3 className="text-lg font-bold text-marble-50 group-hover:text-gold-300 transition-colors leading-snug mb-3 font-serif">
                  {project.title}
                </h3>

                {/* 关键成效徽章 */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-royal-850 border border-gold-500/30 text-xs font-medium text-gold-200 mb-4 shadow-inner-gold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />
                  <span>{project.badge}</span>
                </div>

                {/* 描述容器：由 Pretext 预先计算高度并维持统一，第一张卡片用于测量宽度 */}
                <div
                  ref={idx === 0 ? cardMeasureRef : undefined}
                  style={{
                    minHeight: equalRowHeight ? `${equalRowHeight}px` : undefined,
                  }}
                  className="transition-[min-height] duration-150"
                >
                  <CascadeText
                    text={project.description}
                    className="project-card-desc"
                    baseDelayMs={idx * 260}
                    play={gridInView}
                  />
                </div>
              </div>

              {/* 底部指标与 CTA 区域：得益于 Pretext 等高对齐，底部按钮横向始终保持平齐 */}
              <div className="pt-6 mt-6 border-t border-gold-500/15 flex flex-col gap-4">
                {/* 标签 */}
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] text-azure-300 bg-royal-900/80 border border-azure-400/20 px-2 py-0.5 rounded font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA 链接 */}
                <Link
                  href={`/projects/${project.slug}`}
                  className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-medium text-marble-100 bg-royal-800/60 hover:bg-gold-500/20 border border-gold-400/30 hover:border-gold-400/70 group/btn transition-all shadow-inner-gold"
                >
                  <span className="group-hover/btn:text-gold-200">
                    查看完整 Case Study
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gold-400 group-hover/btn:text-gold-200 group-hover/btn:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
