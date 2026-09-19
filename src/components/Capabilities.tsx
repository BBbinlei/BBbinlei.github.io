"use client";

import { CAPABILITY_PILLARS, MANAGEMENT_METRICS } from "@/data/experience";
import { Layers, CheckCircle2, Cpu, Gamepad2, ShieldCheck, Users, Clock, Award } from "lucide-react";
import { BannerHeading } from "@/components/pretext/BannerHeading";
import { LampLitText } from "@/components/pretext/LampLitText";

export function Capabilities() {
  const getIcon = (name: string) => {
    switch (name) {
      case "Layers":
        return <Layers className="w-5 h-5 text-gold-300" />;
      case "CheckCircle2":
        return <CheckCircle2 className="w-5 h-5 text-gold-300" />;
      case "Cpu":
        return <Cpu className="w-5 h-5 text-azure-400" />;
      case "Gamepad2":
        return <Gamepad2 className="w-5 h-5 text-gold-300" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-gold-300" />;
    }
  };

  const getMetricIcon = (idx: number) => {
    switch (idx) {
      case 0:
        return <Users className="w-4 h-4 text-gold-300" />;
      case 1:
        return <Award className="w-4 h-4 text-gold-300" />;
      case 2:
        return <ShieldCheck className="w-4 h-4 text-azure-400" />;
      case 3:
        return <Clock className="w-4 h-4 text-gold-300" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-gold-300" />;
    }
  };

  const romanPillars = ["PILLAR I", "PILLAR II", "PILLAR III", "PILLAR IV"];

  return (
    <section className="py-20 px-4 max-w-6xl mx-auto border-t border-gold-500/15">
      {/* 模块标题 */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-mono text-gold-300 tracking-widest uppercase font-semibold">
          CAPABILITIES & METHODOLOGY
        </span>
        <BannerHeading
          as="h2"
          text="四大核心专业能力支柱"
          align="center"
          className="text-2xl sm:text-4xl font-bold text-marble-50 font-serif mt-2 mb-4 leading-[1.25]"
        />
        <LampLitText
          align="center"
          text="超越单点标注操作，构建从数据标准设计、版本客观盲评、到脚本自动化与跨部门算法协同的完整闭环。"
          className="text-sm text-marble-300 leading-[24px]"
        />
      </div>

      {/* 四大支柱卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {CAPABILITY_PILLARS.map((pillar, idx) => (
          <div
            key={pillar.number}
            className="glass-panel glass-panel-hover rounded-2xl p-7 flex flex-col justify-between border border-hairline-gold"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-royal-800 border border-gold-400/40 flex items-center justify-center shadow-inner-gold">
                  {getIcon(pillar.iconName)}
                </div>
                <span className="font-serif text-xs text-gold-300/90 font-bold tracking-wider">
                  {romanPillars[idx] || `PILLAR ${pillar.number}`}
                </span>
              </div>

              <h3 className="text-lg font-bold text-marble-50 font-serif mb-2">
                {pillar.title}
              </h3>
              <p className="text-xs text-marble-300/80 mb-5 leading-relaxed">
                {pillar.subtitle}
              </p>

              {/* 核心技能点 */}
              <div className="space-y-2 mb-6">
                {pillar.skills.map((skill) => (
                  <div key={skill} className="flex items-center gap-2 text-xs text-marble-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold-400/80" />
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 信任证据 Proof */}
            <div className="pt-4 border-t border-gold-500/15">
              <div className="text-[11px] font-mono text-gold-300 mb-2 font-semibold">
                PROVEN RESULTS / 落地证明
              </div>
              <div className="space-y-1">
                {pillar.proofPoints.map((proof) => (
                  <div key={proof} className="text-xs text-marble-300/90">
                    • {proof}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 团队与质控指标横幅（面向 HR 与 Leader 的信任证据） */}
      <div className="glass-panel rounded-2xl p-8 border border-hairline-gold shadow-rim-gold/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <h3 className="text-lg font-bold text-marble-50 font-serif">
              团队质量管控与标准赋能实践
            </h3>
            <p className="text-xs text-marble-300 mt-1">
              通过 Bad Case 沉淀、准入机制与自动化流水线，在规模化生产中严格守住质量底线。
            </p>
          </div>
          <span className="text-[11px] font-mono px-3 py-1 rounded-full royal-banner text-gold-200 border border-gold-400/40 self-start md:self-auto shadow-royal-banner">
            STANDARDIZED QA PIPELINE
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {MANAGEMENT_METRICS.map((metric, idx) => (
            <div key={metric.label} className="bg-royal-900/80 p-4 rounded-xl border border-gold-500/20 shadow-inner-gold">
              <div className="flex items-center gap-1.5 text-xs text-gold-300 mb-1.5 font-mono">
                {getMetricIcon(idx)}
                <span>METRIC 0{idx + 1}</span>
              </div>
              <div className="text-2xl font-bold text-marble-50 font-serif mb-1">
                {metric.value}
              </div>
              <div className="text-xs font-medium text-marble-200 mb-0.5">
                {metric.label}
              </div>
              <div className="text-[11px] text-marble-400">
                {metric.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
