"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Shield, Cpu, Layers, Film, ArrowUpRight } from "lucide-react";

interface InteractiveTermProps {
  term: string;
  tag: string;
  explanation: string;
  insight: string;
  linkText?: string;
  linkHref?: string;
  iconType?: "shield" | "sparkles" | "cpu" | "layers" | "film";
}

export function InteractiveTerm({
  term,
  tag,
  explanation,
  insight,
  linkText,
  linkHref,
  iconType = "sparkles",
}: InteractiveTermProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<"top" | "bottom">("top");
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; angle: number; dist: number }[]>([]);
  const containerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkPlacement = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.top < 380) {
        setPlacement("bottom");
      } else {
        setPlacement("top");
      }
    }
  };

  const getIcon = () => {
    switch (iconType) {
      case "shield":
        return <Shield className="w-3.5 h-3.5 text-gold-300" />;
      case "cpu":
        return <Cpu className="w-3.5 h-3.5 text-azure-400" />;
      case "layers":
        return <Layers className="w-3.5 h-3.5 text-gold-300" />;
      case "film":
        return <Film className="w-3.5 h-3.5 text-azure-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-gold-300" />;
    }
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    checkPlacement();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleClick = (e: React.MouseEvent) => {
    // 触发日光金砂粒子飞散特效
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: clickX,
      y: clickY,
      angle: (i / 12) * Math.PI * 2,
      dist: Math.random() * 32 + 18,
    }));

    setBursts(newParticles);
    setTimeout(() => setBursts([]), 650);
    checkPlacement();
    setIsOpen((prev) => !prev);
  };

  // 点击页面其他区域自动收起
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <span
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-block mx-0.5"
    >
      {/* 交互主体文字 */}
      <span
        onClick={handleClick}
        className="inline-flex items-center gap-1 font-semibold text-gold-200 border-b-2 border-dashed border-gold-400/50 hover:border-gold-300 hover:text-white px-1 py-0.5 rounded cursor-pointer transition-all hover:bg-gold-500/15 group relative"
      >
        <span>{term}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-gold-400 group-hover:scale-125 group-hover:bg-gold-200 transition-transform animate-pulse" />
      </span>

      {/* 点击金砂微粒特效 */}
      {bursts.map((b) => (
        <span
          key={b.id}
          style={{
            left: `${b.x}px`,
            top: `${b.y}px`,
            transform: `translate(${Math.cos(b.angle) * b.dist}px, ${Math.sin(b.angle) * b.dist}px)`,
          }}
          className="absolute w-1.5 h-1.5 rounded-full bg-gold-300 pointer-events-none transition-all duration-500 opacity-0 animate-ping"
        />
      ))}

      {/* 悬浮/激活展开的圣都全息 HUD 弹窗
          注意：全部使用 span + display 工具类，避免在 p 段落内嵌 div 造成 hydration 报错 */}
      {isOpen && (
        <span
          role="tooltip"
          className={`absolute block left-1/2 -translate-x-1/2 w-72 sm:w-80 glass-panel rounded-2xl p-4 border border-hairline-gold shadow-rim-gold z-50 text-left pointer-events-auto select-text whitespace-normal font-normal animate-fadeIn ${
            placement === "bottom" ? "top-full mt-2.5" : "bottom-full mb-2.5"
          }`}
        >
          <span className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-gold-500/20">
            <span className="flex items-center gap-1.5">
              {getIcon()}
              <span className="font-serif font-bold text-xs text-marble-50 tracking-wide">
                {term}
              </span>
            </span>
            <span className="royal-banner text-[10px] font-mono px-2 py-0.5 rounded-full border border-gold-400/30 text-gold-200">
              {tag}
            </span>
          </span>

          <span className="block text-xs text-marble-200 leading-relaxed mb-3">
            {explanation}
          </span>

          <span className="flex items-start gap-1.5 p-2.5 rounded-xl bg-royal-900/90 border border-gold-500/20 text-[11px] text-gold-200/90 leading-snug shadow-inner-gold">
            <span className="text-gold-400 font-bold flex-shrink-0">✦ 实践洞察:</span>
            <span>{insight}</span>
          </span>

          {linkText && linkHref && (
            <span className="flex justify-end mt-2.5 pt-2 border-t border-white/5">
              <a
                href={linkHref}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-gold-300 hover:text-white transition-colors"
              >
                <span>{linkText}</span>
                <ArrowUpRight className="w-3 h-3 text-gold-400" />
              </a>
            </span>
          )}

          {/* 小三角箭头指示器 */}
          {placement === "bottom" ? (
            <span className="absolute block bottom-full left-1/2 -translate-x-1/2 mb-px w-0 h-0 border-x-6 border-x-transparent border-b-6 border-b-royal-800" />
          ) : (
            <span className="absolute block top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-royal-800" />
          )}
        </span>
      )}
    </span>
  );
}
