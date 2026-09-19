"use client";

import React, { useRef, useState, useEffect, useMemo, useId } from "react";
import { type TextRun, layoutLines } from "@/lib/pretext/rich";
import { usePretextRuns, useReducedMotion, useInViewOnce } from "@/lib/pretext/hooks";
import { LineFragments, PlainRuns } from "@/components/pretext/LineContent";
import { choreographer } from "@/lib/pretext/choreographer";

export interface LampLitTextProps {
  text?: string;
  runs?: TextRun[];
  className?: string;
  as?: "p" | "div" | "span";
  align?: "left" | "center";
  id?: string;
}

// 日光金 (顶层) → 月光银蓝 (底层)
const SUNLIGHT = { r: 252, g: 211, b: 77 };
const MOONLIGHT = { r: 186, g: 230, b: 253 };

export function LampLitText({
  text,
  runs,
  className = "",
  as: Tag = "p",
  align = "left",
  id: customId,
}: LampLitTextProps) {
  const generatedId = useId();
  const componentId = customId || `lamp-${generatedId}`;

  const normalizedRuns: TextRun[] = useMemo(() => {
    if (runs && runs.length > 0) return runs;
    if (text) return [{ text }];
    return [];
  }, [runs, text]);

  const rootRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const inView = useInViewOnce(rootRef);

  const { prepared, width, ready, typography } = usePretextRuns(
    rootRef,
    normalizedRuns
  );

  const [isLit, setIsLit] = useState(false);
  const [lampColors, setLampColors] = useState<{ lamp: string; soft: string }>({
    lamp: "rgb(252, 211, 77)",
    soft: "rgba(252, 211, 77, 0.55)",
  });

  // 1. 进入视口并准备就绪后，向调度器申请主角播放权
  useEffect(() => {
    if (!ready || !inView || isLit || reducedMotion) return;

    let cancelled = false;

    // 计算元素在整页中的纵深深度比例 f ∈ [0, 1]
    if (rootRef.current && typeof window !== "undefined") {
      const rect = rootRef.current.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const scrollHeight = document.documentElement.scrollHeight || 3000;
      const f = Math.max(0, Math.min(1, (rect.top + scrollY) / scrollHeight));

      const r = Math.round(SUNLIGHT.r + (MOONLIGHT.r - SUNLIGHT.r) * f);
      const g = Math.round(SUNLIGHT.g + (MOONLIGHT.g - SUNLIGHT.g) * f);
      const b = Math.round(SUNLIGHT.b + (MOONLIGHT.b - SUNLIGHT.b) * f);
      setLampColors({
        lamp: `rgb(${r}, ${g}, ${b})`,
        soft: `rgba(${r}, ${g}, ${b}, 0.55)`,
      });
    }

    choreographer.claim(componentId, 1).then((canPlay) => {
      if (cancelled || !canPlay) return;
      setIsLit(true);
    });

    return () => {
      cancelled = true;
    };
  }, [ready, inView, isLit, reducedMotion, componentId]);

  // 2. 切行与时长推算
  const renderedLines = useMemo(() => {
    if (!prepared || width <= 0) return [];
    return layoutLines(prepared, width);
  }, [prepared, width]);

  // 计算每行的时长与延迟，以及释放调度权的总时长
  const lineTimings = useMemo(() => {
    let currentStart = 0;
    const timings = renderedLines.map((line) => {
      // 速度 0.75 px/ms，单行时长限制在 [380ms, 1200ms]
      const dur = Math.max(380, Math.min(1200, Math.round(line.width / 0.75)));
      const delay = Math.round(currentStart);
      currentStart += dur * 0.5; // 下一行在上一行扫到 50% 时接力
      return { dur, delay, total: delay + dur };
    });

    const maxTime = timings.reduce((max, t) => Math.max(max, t.total), 800);
    return { timings, maxTime };
  }, [renderedLines]);

  // 播放结束后释放调度器播放权
  useEffect(() => {
    if (!isLit || reducedMotion) return;
    const timer = setTimeout(() => {
      choreographer.release(componentId);
    }, lineTimings.maxTime + 1600); // 包含余晖消散

    return () => {
      clearTimeout(timer);
      choreographer.release(componentId);
    };
  }, [isLit, reducedMotion, componentId, lineTimings.maxTime]);

  const lineHeight = typography?.lineHeightPx || 24;

  // 降级与 SSR 回退态
  if (!ready || renderedLines.length === 0) {
    return (
      <Tag
        ref={rootRef as any}
        className={`${className} pt-lamp-root pt-lamp-pending`}
        data-align={align}
      >
        <PlainRuns runs={normalizedRuns} />
      </Tag>
    );
  }

  // 减少动态效果模式
  if (reducedMotion) {
    return (
      <Tag
        ref={rootRef as any}
        className={`${className} pt-lamp-root is-static`}
        data-align={align}
      >
        <span className="sr-only">
          <PlainRuns runs={normalizedRuns} />
        </span>
        {renderedLines.map((line, idx) => (
          <span
            key={idx}
            aria-hidden="true"
            className="pt-lamp-line"
            style={{ height: `${lineHeight}px` }}
          >
            <span className="pt-lamp-text">
              <LineFragments fragments={line.fragments} runs={normalizedRuns} />
            </span>
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag
      ref={rootRef as any}
      className={`${className} pt-lamp-root ${isLit ? "is-lit" : "pt-lamp-pending"}`}
      data-align={align}
      style={
        {
          "--pt-lamp": lampColors.lamp,
          "--pt-lamp-soft": lampColors.soft,
        } as React.CSSProperties
      }
    >
      <span className="sr-only">
        <PlainRuns runs={normalizedRuns} />
      </span>

      {renderedLines.map((line, idx) => {
        const t = lineTimings.timings[idx] || { dur: 800, delay: 0 };
        return (
          <span
            key={idx}
            aria-hidden="true"
            className="pt-lamp-line"
            style={
              {
                height: `${lineHeight}px`,
                "--pt-dur": `${t.dur}ms`,
                "--pt-delay": `${t.delay}ms`,
              } as React.CSSProperties
            }
          >
            <span className="pt-lamp-text">
              <LineFragments fragments={line.fragments} runs={normalizedRuns} />
            </span>
            <span className="pt-lamp-spark" />
          </span>
        );
      })}
    </Tag>
  );
}
