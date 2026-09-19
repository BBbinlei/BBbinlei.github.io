"use client";

import React, { useState } from "react";
import { Crown, Terminal, ArrowRight } from "lucide-react";
import Link from "next/link";
import { InteractiveTerm } from "@/components/InteractiveTerm";

const PERSPECTIVES = {
  leader: {
    id: "leader",
    label: "👑 业务质控与 Leader 视角",
    badge: "BUSINESS & QA PERSPECTIVE",
    title: "以严谨质控 SOP 与自动化，守住模型生产效能底线",
    chips: [
      {
        term: "95%+ 验收通过率",
        tag: "质控成果",
        explanation: "通过严格的标注准入机制与每日分歧仲裁，个人提交成果在跨团队联合验收中长期保持 95% 以上通过率。",
        insight: "将主观审美分歧收敛为标准化打分量规，大幅降低团队返工成本。",
        iconType: "shield" as const,
      },
      {
        term: "10人质控考核卷",
        tag: "团队管理",
        explanation: "设立涵盖肢体穿模、光影矛盾、物理常识缺失等 30+ 典型 Boundary Case 的标准化考卷，达标后方可进入生产流。",
        insight: "确保多标注员在相同 prompt 下维持高度一致的认知基准线。",
        iconType: "layers" as const,
      },
      {
        term: "300% 自动化提效",
        tag: "工程降本",
        explanation: "以 Python 批处理脚本实现随机参数化遍历与多模态大模型初稿合成，将人工标注耗时缩短至原本的三分之一。",
        insight: "人机协同（Human-in-the-loop）将人力解放至高难度边界案判断上。",
        iconType: "cpu" as const,
      },
    ],
  },
  engineer: {
    id: "engineer",
    label: "⚙️ 算法工程与极客视角",
    badge: "ALGORITHM & GEEK PERSPECTIVE",
    title: "以高结构化数据密度与参数化约束，打破生成模型天花板",
    chips: [
      {
        term: "Video-to-Text 时序切片",
        tag: "算法特征",
        explanation: "对游戏技能 CG 与动作过场按镜头景别、动作起止与特效持续时间切片，对齐时序因果关系。",
        insight: "教会文生视频模型理解'起手前摇 → 命中判定 → 空间残影'的时序因果。",
        iconType: "film" as const,
      },
      {
        term: "五层细粒度结构",
        tag: "Prompt Engineering",
        explanation: "主体、构图、艺术风格、光影层次与排版文字五层解构，单条数据 token 信息密度较普通标注提升 40% 以上。",
        insight: "防止模型生成时产生'风格塌缩'或'漏标小道具'的幻觉。",
        iconType: "layers" as const,
      },
      {
        term: "软硬约束逻辑求解",
        tag: "Python 自动化",
        explanation: "设计'互斥冲突校验器'（如室内光照与室外天气互斥），在调用大模型合成前排除不合理组合。",
        insight: "将数据源头清洗成本由传统人工复核变为毫秒级代码拦截。",
        iconType: "cpu" as const,
      },
    ],
  },
};

export function PerspectiveNarrative() {
  const [activeTab, setActiveTab] = useState<"leader" | "engineer">("leader");
  const currentData = PERSPECTIVES[activeTab];

  return (
    <section className="py-16 px-4 max-w-5xl mx-auto relative">
      <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-hairline-gold relative overflow-hidden shadow-inner-gold">
        {/* 顶部控制台：双重视角模式切换开关 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gold-500/15">
          <div className="flex items-center gap-2">
            <span className="royal-banner text-xs font-mono px-3 py-1 rounded-full border border-gold-400/30 text-gold-200 shadow-royal-banner">
              {currentData.badge}
            </span>
            <span className="text-[11px] font-mono text-gold-300/80 hidden md:inline">
              ✦ 交互式视角切换器
            </span>
          </div>

          {/* 切换手柄按钮组 */}
          <div className="inline-flex p-1 rounded-full bg-royal-950/80 border border-gold-500/30 shadow-inner-gold self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("leader")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === "leader"
                  ? "bg-royal-800 text-gold-200 border border-gold-400/40 shadow-inner-gold font-semibold"
                  : "text-marble-300 hover:text-white"
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-gold-300" />
              <span>Leader / 质控视角</span>
            </button>
            <button
              onClick={() => setActiveTab("engineer")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === "engineer"
                  ? "bg-royal-800 text-azure-300 border border-azure-400/40 shadow-inner-gold font-semibold"
                  : "text-marble-300 hover:text-white"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-azure-400" />
              <span>算法 / 极客工程视角</span>
            </button>
          </div>
        </div>

        {/* 核心阐释主体 */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-2xl w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-marble-50 font-serif mb-4 leading-snug transition-all">
              {currentData.title}
            </h2>

            {/* 段落容器：自然 CSS 流式排版，切换时通过 opacity 平滑淡入 */}
            <div className="transition-opacity duration-250 ease-out mb-6 min-h-[96px]">
              {activeTab === "leader" ? (
                <p className="text-sm text-marble-300 leading-[26px]">
                  在模型迈向高画质多模态的演进中，数据工程的核心瓶颈已从单纯的算力转向数据清洗度与评测标准的一致性。通过设立
                  <InteractiveTerm {...PERSPECTIVES.leader.chips[1]} />
                  、建立涵盖 30+ 边界例题的准入测试、执行每日不低于 15% 的双盲抽检仲裁与 Bad Case 反哺体系，将
                  <InteractiveTerm {...PERSPECTIVES.leader.chips[0]} />
                  稳定在 95% 以上，并以
                  <InteractiveTerm {...PERSPECTIVES.leader.chips[2]} />
                  驱动自动化管线，实现兼具高确定性与高 ROI 的业务交付。
                </p>
              ) : (
                <p className="text-sm text-marble-300 leading-[26px]">
                  复杂视觉艺术与生成模型之间的鸿沟，本质是镜头语言、动态时序因果与空间物理常识的表征缺失。针对 3200 条游戏与动画垂类高细粒度视频切片及 600+ 图像样本，建立
                  <InteractiveTerm {...PERSPECTIVES.engineer.chips[0]} />
                  范式；通过
                  <InteractiveTerm {...PERSPECTIVES.engineer.chips[1]} />
                  解构镜头与风格，并自主编写
                  <InteractiveTerm {...PERSPECTIVES.engineer.chips[2]} />
                  脚本，批量驱动大模型完成高信息密度描述，从数据层直接解决武器穿模与肢体畸变难题。
                </p>
              )}
            </div>

            {/* 3 个轻量交互说明 Chips */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-[11px] font-mono text-gold-300/80 self-center mr-1">
                点击文中高亮词有惊喜 ✦
              </span>
              {currentData.chips.map((chip) => (
                <div
                  key={chip.term}
                  className="px-2.5 py-1 rounded-lg bg-royal-900/60 border border-gold-500/20 text-[11px] text-marble-200 font-mono flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                  <span>{chip.term}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧操作入口 */}
          <div className="flex flex-col gap-3 w-full md:w-auto flex-shrink-0">
            <Link
              href="/experience"
              className="px-6 py-2.5 rounded-xl text-xs font-semibold btn-royal-gold text-center shadow-rim-gold flex items-center justify-center gap-2"
            >
              <span>查看完整经历体系</span>
              <ArrowRight className="w-3.5 h-3.5 text-gold-300" />
            </Link>
            <Link
              href="/about"
              className="px-6 py-2.5 rounded-xl text-xs font-medium btn-royal-azure text-center"
            >
              了解个人背景与理念
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
