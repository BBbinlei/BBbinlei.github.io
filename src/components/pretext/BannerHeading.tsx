"use client";

import React, { useRef, useState, useEffect, useMemo, useId } from "react";
import { type TextRun, findBalancedWidth } from "@/lib/pretext/rich";
import { usePretextRuns, useReducedMotion, useInViewOnce } from "@/lib/pretext/hooks";
import { LineFragments, PlainRuns } from "@/components/pretext/LineContent";
import { choreographer } from "@/lib/pretext/choreographer";

export interface BannerHeadingProps {
  as?: "h1" | "h2";
  text: string;
  className?: string;
  align?: "left" | "center";
  id?: string;
}

export function BannerHeading({
  as: Tag = "h2",
  text,
  className = "",
  align = "left",
  id: customId,
}: BannerHeadingProps) {
  const generatedId = useId();
  const componentId = customId || `banner-${generatedId}`;

  const runs: TextRun[] = useMemo(() => [{ text }], [text]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const styleRef = useRef<HTMLSpanElement | null>(null);
  const reducedMotion = useReducedMotion();
  const inView = useInViewOnce(containerRef);

  // 可用宽度由外层容器提供（避免自身宽度受排版影响产生循环）
  const { prepared, width: containerWidth, ready, typography } = usePretextRuns(
    styleRef,
    runs,
    containerRef
  );

  const [isUnfurling, setIsUnfurling] = useState(false);
  const [isUnfurled, setIsUnfurled] = useState(false);

  // 1. 进入视口且就绪后，以高优先级 (3) 向调度器申请主角播放权
  useEffect(() => {
    if (!ready || !inView || isUnfurling || isUnfurled || reducedMotion) return;

    let cancelled = false;
    choreographer.claim(componentId, 3).then((canPlay) => {
      if (cancelled || !canPlay) return;
      setIsUnfurling(true);
    });

    return () => {
      cancelled = true;
    };
  }, [ready, inView, isUnfurling, isUnfurled, reducedMotion, componentId]);

  // 2. 动画时间线与调度释放
  useEffect(() => {
    if (!isUnfurling || reducedMotion) return;

    // 1450ms 完成垂落与文字浮现，进入常驻微摆动与丝绸微光
    const timer = setTimeout(() => {
      setIsUnfurled(true);
      choreographer.release(componentId);
    }, 1900);

    return () => {
      clearTimeout(timer);
      choreographer.release(componentId);
    };
  }, [isUnfurling, reducedMotion, componentId]);

  // 3. 尺寸与平衡断行计算
  const isMobile = containerWidth < 640;
  const padX = isMobile ? 20 : 28;
  const padTop = 22;
  const padBottom = 18;
  const tail = 20;

  // 最大文字宽度 = 容器宽 - 2 * padX - 旗杆留白 (28px)
  const maxTextWidth = Math.max(80, containerWidth - padX * 2 - 28);

  const { balancedWidth, renderedLines } = useMemo(() => {
    if (!prepared || maxTextWidth <= 0) {
      return { balancedWidth: 0, renderedLines: [] };
    }
    const res = findBalancedWidth(prepared, maxTextWidth);
    return {
      balancedWidth: res.width,
      renderedLines: res.lines,
    };
  }, [prepared, maxTextWidth]);

  const lineCount = renderedLines.length;
  const lineHeight = typography?.lineHeightPx || 36;

  // 旗面精准几何尺寸
  const bannerW = Math.max(120, balancedWidth + padX * 2);
  const bannerH = lineCount * lineHeight + padTop + padBottom + tail;

  // SVG 燕尾路径: M 0 0 H W V H L W/2 (H - tail) L 0 H Z
  const outerPath = `M 0 0 H ${bannerW} V ${bannerH} L ${bannerW / 2} ${bannerH - tail} L 0 ${bannerH} Z`;

  // 内侧 1px 金色细线 (距边 5px)
  const inset = 5;
  const innerPath = `M ${inset} ${inset} H ${bannerW - inset} V ${bannerH - inset} L ${bannerW / 2} ${bannerH - tail - inset} L ${inset} ${bannerH - inset} Z`;

  // SSR 与降级状态
  if (!ready || renderedLines.length === 0) {
    return (
      <div ref={containerRef} className="w-full">
        <Tag className={`${className} pt-banner-title pt-pending`}>
          <span ref={styleRef}>
            <PlainRuns runs={runs} />
          </span>
        </Tag>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full flex ${align === "center" ? "justify-center" : "justify-start"} my-4`}
    >
      <Tag
        className={`${className} pt-banner-title relative inline-block select-none`}
        style={{
          width: `${bannerW}px`,
          height: `${bannerH + 6}px`,
        }}
      >
        {/* SEO 与读屏语义保留一份完整纯文本 */}
        <span className="sr-only">
          <PlainRuns runs={runs} />
        </span>

        {/* 隐藏的排印参照元素，仅供 usePretextRuns 读取 computedStyle */}
        <span
          ref={styleRef}
          aria-hidden="true"
          className="absolute opacity-0 pointer-events-none -z-50"
        >
          {text}
        </span>

        <div
          aria-hidden="true"
          className={`relative w-full h-full ${
            reducedMotion
              ? "is-banner-unfurled"
              : isUnfurling
                ? isUnfurled
                  ? "is-banner-unfurled"
                  : "is-banner-unfurling"
                : "pt-pending"
          }`}
        >
          {/* 1. 金色旗杆 (两端带 8px 装饰圆球，左右各对称向外延伸 14px，采用 left: -14px 杜绝 keyframe transform 冲突) */}
          <div
            className="pt-banner-rod absolute -top-1 z-20"
            style={{
              left: "-14px",
              width: `${bannerW + 28}px`,
              height: "4px",
            }}
          >
            {/* 杆体 */}
            <div className="w-full h-full rounded-full bg-gradient-to-r from-gold-300 via-gold-400 to-amber-600 shadow-rim-gold" />
            {/* 左装饰球 */}
            <div className="absolute -left-1.5 -top-1 w-2.5 h-2.5 rounded-full bg-gold-200 border border-gold-400 shadow-sm" />
            {/* 右装饰球 */}
            <div className="absolute -right-1.5 -top-1 w-2.5 h-2.5 rounded-full bg-gold-200 border border-gold-400 shadow-sm" />
          </div>

          {/* 2. 燕尾旗面 (皇家蓝渐变 + 双层金纹描边 + 燕尾凹槽) */}
          <div
            className="pt-banner-cloth absolute top-0 left-0 w-full h-full overflow-hidden shadow-royal-banner"
            style={{
              width: `${bannerW}px`,
              height: `${bannerH}px`,
            }}
          >
            <svg
              width={bannerW}
              height={bannerH}
              viewBox={`0 0 ${bannerW} ${bannerH}`}
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              <defs>
                <linearGradient
                  id={`pt-banner-grad-${componentId}`}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#1e3a8a" />
                  <stop offset="100%" stopColor="#111e47" />
                </linearGradient>
              </defs>

              {/* 旗面主底色 */}
              <path
                d={outerPath}
                fill={`url(#pt-banner-grad-${componentId})`}
                stroke="rgba(251, 191, 36, 0.55)"
                strokeWidth="1.2"
              />

              {/* 内侧精细金边细线 */}
              <path
                d={innerPath}
                fill="none"
                stroke="rgba(254, 240, 138, 0.25)"
                strokeWidth="1"
              />
            </svg>

            {/* 丝绸微光扫面动效层 */}
            <div className="pt-banner-shimmer" />

            {/* 3. 逐行标题文字 (居中排布，浮现时机与垂落边缘吻合) */}
            <div
              className="relative z-10 flex flex-col items-center"
              style={{
                paddingTop: `${padTop}px`,
                paddingBottom: `${padBottom + tail}px`,
                paddingLeft: `${padX}px`,
                paddingRight: `${padX}px`,
              }}
            >
              {renderedLines.map((line, idx) => {
                // 浮现延迟 = 旗杆时长 (450ms) + 垂落时长 (1000ms) * ((padTop + idx * lineHeight + 0.6 * lineHeight) / bannerH)
                const lineProgress =
                  (padTop + idx * lineHeight + 0.6 * lineHeight) / bannerH;
                const lineDelay = Math.round(450 + 1000 * lineProgress);

                return (
                  <span
                    key={idx}
                    className="pt-banner-text-line block text-center text-marble-50"
                    style={
                      {
                        height: `${lineHeight}px`,
                        lineHeight: `${lineHeight}px`,
                        "--pt-line-delay": `${lineDelay}ms`,
                      } as React.CSSProperties
                    }
                  >
                    <LineFragments fragments={line.fragments} runs={runs} />
                  </span>
                );
              })}
            </div>

            {/* 4. 燕尾上方的金色小徽记 ✦ (外层负责水平居中，内层负责 scale 动画，互不干扰) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 z-10 text-gold-300 pointer-events-none"
              style={{
                bottom: `${tail + 2}px`,
              }}
            >
              <span className="pt-banner-emblem block text-[13px] leading-none">✦</span>
            </div>
          </div>
        </div>
      </Tag>
    </div>
  );
}
