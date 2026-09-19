"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowDown, CheckCircle, Sparkles, Zap, Film } from "lucide-react";
import { InteractiveTerm } from "@/components/InteractiveTerm";

export function Hero() {
  const [activeMetric, setActiveMetric] = useState<number | null>(null);

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-4 pt-28 pb-16 overflow-hidden">
      {/* 顶部柔和暖金与天青渐变微光 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] bg-gradient-to-b from-gold-500/10 via-azure-500/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* 主体叙事内容 */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        {/* 白银圣都皇家旗帜风格标签 */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full royal-banner text-xs mb-8 shadow-royal-banner animate-float">
          <Sparkles className="w-3.5 h-3.5 text-gold-300" />
          <span className="tracking-wide text-gold-100 font-medium">
            动画与游戏多模态 · 数据构建 · 评测基准 · 效率工程
          </span>
        </div>

        {/* 核心主标题 */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-marble-50 font-serif leading-[1.18] mb-6">
          让多模态 AI 更懂
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-marble-50 via-gold-200 to-azure-300 ml-2">
            游戏与动画
          </span>
        </h1>

        {/* 核心价值副标（内嵌高交互性浮空微徽标） */}
        <div className="text-base sm:text-lg md:text-xl text-marble-200/90 max-w-2xl font-light leading-relaxed mb-10">
          连接复杂视觉艺术与生成式模型——以
          <InteractiveTerm
            term="高标准数据工程"
            tag="数据架构"
            explanation="制定镜头运动、时序因果、光影与角色交互的结构化标注规范，构建高密度高质量训练集。"
            insight="个人提交验收通过率 95%+，数据返工率大幅低于行业平均。"
            iconType="shield"
            linkText="查阅案例库"
            linkHref="#projects"
          />
          、
          <InteractiveTerm
            term="严谨版本双盲评测"
            tag="客观评测"
            explanation="制定 Side-by-Side 评测准则与仲裁机制，量化捕捉模型在手部穿模、肢体畸变与光影不一致上的缺陷。"
            insight="评测分歧率长期稳定在 10% 以内，保障灰度迭代客观可信。"
            iconType="sparkles"
            linkText="了解评测方法论"
            linkHref="/experience"
          />
          与
          <InteractiveTerm
            term="自动化生产管线"
            tag="工程降本"
            explanation="通过 Python 批处理脚本实现参数化标签遍历与软硬约束校验，批量调度多模态大模型自动生成高精度描述初稿。"
            insight="效率提升 300%，培训周期从 30 天缩短至 10 天。"
            iconType="cpu"
            linkText="查看自动化案例"
            linkHref="/projects/ai-data-automation"
          />
          ，推动高质量视觉内容生成。
        </div>

        {/* 三大量化信任指标卡（支持悬浮互动与脉冲光晕） */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-2xl mb-10">
          <div
            onMouseEnter={() => setActiveMetric(1)}
            onMouseLeave={() => setActiveMetric(null)}
            className={`glass-panel p-4 rounded-xl border transition-all duration-300 flex flex-col items-center cursor-pointer group select-none ${
              activeMetric === 1
                ? "border-gold-400 bg-royal-800/90 shadow-rim-gold -translate-y-1 scale-105"
                : "border-hairline-gold hover:border-gold-400/60 shadow-inner-gold"
            }`}
          >
            <div className="flex items-center gap-1.5 text-gold-300 text-xs mb-1 font-mono">
              <CheckCircle className="w-3.5 h-3.5 text-gold-400 group-hover:scale-110 transition-transform" />
              <span>高质量交付</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-marble-50 font-serif group-hover:text-gold-200 transition-colors">
              97%+
            </div>
            <div className="text-xs text-marble-300/80 mt-0.5">个人交付首检通过率</div>
          </div>

          <div
            onMouseEnter={() => setActiveMetric(2)}
            onMouseLeave={() => setActiveMetric(null)}
            className={`glass-panel p-4 rounded-xl border transition-all duration-300 flex flex-col items-center cursor-pointer group select-none ${
              activeMetric === 2
                ? "border-gold-400 bg-royal-800/90 shadow-rim-gold -translate-y-1 scale-105"
                : "border-hairline-gold hover:border-gold-400/60 shadow-inner-gold"
            }`}
          >
            <div className="flex items-center gap-1.5 text-gold-300 text-xs mb-1 font-mono">
              <Zap className="w-3.5 h-3.5 text-gold-400 group-hover:scale-110 transition-transform" />
              <span>工程自动化</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-marble-50 font-serif group-hover:text-gold-200 transition-colors">
              300%
            </div>
            <div className="text-xs text-marble-300/80 mt-0.5">自动化生产效率提升</div>
          </div>

          <div
            onMouseEnter={() => setActiveMetric(3)}
            onMouseLeave={() => setActiveMetric(null)}
            className={`glass-panel p-4 rounded-xl border transition-all duration-300 flex flex-col items-center cursor-pointer group select-none ${
              activeMetric === 3
                ? "border-azure-400 bg-royal-800/90 shadow-rim-azure -translate-y-1 scale-105"
                : "border-hairline-gold hover:border-gold-400/60 shadow-inner-gold"
            }`}
          >
            <div className="flex items-center gap-1.5 text-azure-300 text-xs mb-1 font-mono">
              <Film className="w-3.5 h-3.5 text-azure-400 group-hover:scale-110 transition-transform" />
              <span>垂类时序工程</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-marble-50 font-serif group-hover:text-azure-200 transition-colors">
              3200+
            </div>
            <div className="text-xs text-marble-300/80 mt-0.5">游戏动画细粒度标注</div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <a
            href="#projects"
            className="w-full sm:w-auto px-7 py-3 rounded-full text-sm font-semibold btn-royal-gold flex items-center justify-center gap-2 shadow-rim-gold"
          >
            <span>查看代表项目</span>
            <ArrowDown className="w-4 h-4 text-gold-200 animate-bounce" />
          </a>
          <Link
            href="/about#resume"
            className="w-full sm:w-auto px-7 py-3 rounded-full text-sm font-medium btn-royal-azure flex items-center justify-center gap-2"
          >
            <span>获取完整简历 / 取得联系</span>
          </Link>
        </div>
      </div>

      {/* 底部滚动提示 */}
      <div className="absolute bottom-6 z-10 flex flex-col items-center text-marble-400 text-[11px] tracking-widest uppercase font-mono">
        <span className="mb-1 text-gold-300/80">Scroll to Explore</span>
        <div className="w-4 h-7 rounded-full border border-gold-400/40 flex items-start justify-center p-1">
          <div className="w-1 h-1.5 bg-gold-400 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
