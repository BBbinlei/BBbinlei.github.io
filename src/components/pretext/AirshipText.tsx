"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  type TextRun,
  type PositionedLine,
  layoutAroundObstacle,
  layoutLines,
} from "@/lib/pretext/rich";
import {
  usePretextRuns,
  useReducedMotion,
  useInView,
} from "@/lib/pretext/hooks";
import { PlainRuns } from "@/components/pretext/LineContent";
import { Airship } from "@/components/pretext/Airship";

export interface AirshipTextProps {
  text?: string;
  runs?: TextRun[];
  className?: string;
}

export function AirshipText({
  text,
  runs,
  className = "",
}: AirshipTextProps) {
  const normalizedRuns: TextRun[] = useMemo(() => {
    if (runs && runs.length > 0) return runs;
    if (text) return [{ text }];
    return [];
  }, [runs, text]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const textPoolRef = useRef<HTMLDivElement | null>(null);
  const airshipRef = useRef<HTMLDivElement | null>(null);
  const cloud1Ref = useRef<HTMLDivElement | null>(null);
  const cloud2Ref = useRef<HTMLDivElement | null>(null);
  const cloud3Ref = useRef<HTMLDivElement | null>(null);

  const reducedMotion = useReducedMotion();
  const inView = useInView(containerRef);

  const { prepared, width: containerWidth, ready, typography } = usePretextRuns(
    containerRef,
    normalizedRuns
  );

  // 1. 尺寸定义
  const S = Math.max(120, Math.min(170, containerWidth * 0.2));
  const airshipH = 0.56 * S;
  const lineHeight = typography?.lineHeightPx || 28;

  // 降级判断：移动端宽度 (< 560px) 采用上部“天空带”模式
  const isSkyBandMode = containerWidth > 0 && containerWidth < 560;

  // 2. 基准高度计算与 40 点采样最大高度锁死（彻底消除 CLS）
  const lockedContainerHeight = useMemo(() => {
    if (!prepared || containerWidth <= 0 || isSkyBandMode) return undefined;

    // 无障碍基准排版行数
    const baseLines = layoutLines(prepared, containerWidth);
    const baseH = baseLines.length * lineHeight;
    const baseCenterY = baseH * 0.45;
    const baseY = Math.max(
      4,
      Math.min(baseH - airshipH - 4, baseCenterY - airshipH / 2)
    );

    // 采样 40 个等距位置
    let maxH = baseH;
    const startX = containerWidth + 0.1 * S;
    const endX = -1.1 * S;

    for (let i = 0; i <= 36; i++) {
      const sampleX = startX + ((endX - startX) * i) / 36;

      const getBlocked = (bandTop: number, bandBottom: number) => {
        const res: [number, number][] = [];
        const pad = 14;
        const bTop = bandTop - 4;
        const bBottom = bandBottom + 4;

        // 气囊椭圆
        const cx = sampleX + 0.52 * S;
        const cy = baseY + 0.24 * S;
        const a = 0.46 * S;
        const b = 0.17 * S;

        const yStar = Math.max(bTop, Math.min(bBottom, cy));
        if (Math.abs(yStar - cy) < b) {
          const hw = a * Math.sqrt(1 - Math.pow((yStar - cy) / b, 2));
          res.push([cx - hw - pad, cx + hw + pad]);
        }

        // 吊舱
        const cabinTop = baseY + 0.41 * S;
        const cabinBottom = baseY + 0.54 * S;
        if (bBottom > cabinTop && bTop < cabinBottom) {
          res.push([sampleX + 0.36 * S - pad, sampleX + 0.64 * S + pad]);
        }

        // 尾翼
        const finTop = baseY + 0.1 * S;
        const finBottom = baseY + 0.4 * S;
        if (bBottom > finTop && bTop < finBottom) {
          res.push([sampleX + 0.86 * S - pad, sampleX + 1.0 * S + pad]);
        }

        return res;
      };

      const lines = layoutAroundObstacle(
        prepared,
        containerWidth,
        lineHeight,
        getBlocked
      );
      const h = lines.length > 0 ? Math.max(...lines.map((l) => l.y + lineHeight)) : baseH;
      if (h > maxH) maxH = h;
    }

    return maxH + 12;
  }, [prepared, containerWidth, isSkyBandMode, S, airshipH, lineHeight]);

  // 3. 对象池初始化 (≤ 24 行)
  useEffect(() => {
    const pool = textPoolRef.current;
    if (!pool) return;
    pool.innerHTML = "";
    for (let i = 0; i < 28; i++) {
      const div = document.createElement("div");
      div.className =
        "absolute top-0 left-0 whitespace-pre pointer-events-none select-none text-marble-200 transition-none";
      div.style.display = "none";
      div.style.height = `${lineHeight}px`;
      div.style.lineHeight = `${lineHeight}px`;
      div.dataset.key = "";
      pool.appendChild(div);
    }
  }, [lineHeight]);

  // 4. rAF 帧循环：驱动飞艇运动与微秒级文字避障
  useEffect(() => {
    if (!ready || isSkyBandMode || reducedMotion || !prepared || containerWidth <= 0) {
      return;
    }

    let animId: number;
    let lastTime = performance.now();
    let accumulatedTime = 0;
    let lastRenderedX = -9999;

    const baseH = (lockedContainerHeight || 300) - 12;
    const baseCenterY = baseH * 0.45;
    const baseY = Math.max(
      4,
      Math.min(baseH - airshipH - 4, baseCenterY - airshipH / 2)
    );

    const startX = containerWidth + 0.1 * S;
    const endX = -1.1 * S;
    const totalDist = startX - endX;
    const flightDuration = 24000; // 24s
    const restDuration = 5000; // 5s
    const cycleDuration = flightDuration + restDuration;

    // 障碍物区间计算函数（使用固定基准位置，避免文字随小浮动跳动）
    const getBlocked = (curX: number) => (bandTop: number, bandBottom: number) => {
      const res: [number, number][] = [];
      const pad = 14;
      const bTop = bandTop - 4;
      const bBottom = bandBottom + 4;

      // 气囊椭圆
      const cx = curX + 0.52 * S;
      const cy = baseY + 0.24 * S;
      const a = 0.46 * S;
      const b = 0.17 * S;

      const yStar = Math.max(bTop, Math.min(bBottom, cy));
      if (Math.abs(yStar - cy) < b) {
        const hw = a * Math.sqrt(1 - Math.pow((yStar - cy) / b, 2));
        res.push([cx - hw - pad, cx + hw + pad]);
      }

      // 吊舱
      const cabinTop = baseY + 0.41 * S;
      const cabinBottom = baseY + 0.54 * S;
      if (bBottom > cabinTop && bTop < cabinBottom) {
        res.push([curX + 0.36 * S - pad, curX + 0.64 * S + pad]);
      }

      // 尾翼
      const finTop = baseY + 0.1 * S;
      const finBottom = baseY + 0.4 * S;
      if (bBottom > finTop && bTop < finBottom) {
        res.push([curX + 0.86 * S - pad, curX + 1.0 * S + pad]);
      }

      return res;
    };

    const updateDOM = (lines: PositionedLine[]) => {
      const pool = textPoolRef.current;
      if (!pool) return;
      const children = pool.children;

      for (let i = 0; i < children.length; i++) {
        const el = children[i] as HTMLDivElement;
        if (i < lines.length) {
          const line = lines[i];
          el.style.display = "block";
          el.style.transform = `translate3d(${line.x}px, ${line.y}px, 0)`;

          // 文本 key 比对：仅在文字变动时才重构 innerHTML，极度省耗
          const lineKey = line.fragments.map((f) => f.text).join("|");
          if (el.dataset.key !== lineKey) {
            el.dataset.key = lineKey;
            el.innerHTML = "";
            line.fragments.forEach((f, fi) => {
              const run = normalizedRuns[f.itemIndex] || { text: f.text };
              const span = document.createElement("span");
              span.textContent = f.text;
              if (run.className) span.className = run.className;
              if (run.weight) span.style.fontWeight = String(run.weight);
              if (f.gapBefore > 0 && fi > 0) {
                span.style.marginLeft = `${f.gapBefore}px`;
              }
              el.appendChild(span);
            });
          }
        } else {
          el.style.display = "none";
        }
      }
    };

    const frame = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;

      // 离开视口或切到后台时暂停累加，无缝衔接
      if (inView && !document.hidden) {
        accumulatedTime = (accumulatedTime + dt) % cycleDuration;
      }

      let curX = startX;
      let isResting = false;

      if (accumulatedTime <= flightDuration) {
        const p = accumulatedTime / flightDuration;
        // 前后各 8% 缓入缓出，中间线性
        let easedP = p;
        if (p < 0.08) {
          easedP = (p / 0.08) * (p / 0.08) * 0.08 * 0.5;
        } else if (p > 0.92) {
          const rem = (p - 0.92) / 0.08;
          easedP = 0.92 + (1 - (1 - rem) * (1 - rem)) * 0.08;
        }
        curX = startX - totalDist * easedP;
      } else {
        isResting = true;
        curX = endX - 100;
      }

      // 视觉浮动与倾斜
      const tSec = now / 1000;
      const floatY = Math.sin((2 * Math.PI * tSec) / 3.2) * 5;
      const tiltDeg = Math.sin((2 * Math.PI * tSec) / 4.1) * 1.2;

      // 更新飞艇视觉位置（仅操作 transform）
      if (airshipRef.current) {
        if (isResting) {
          airshipRef.current.style.display = "none";
        } else {
          airshipRef.current.style.display = "block";
          airshipRef.current.style.transform = `translate3d(${curX}px, ${baseY + floatY}px, 0) rotate(${tiltDeg}deg)`;
        }
      }

      // 更新船尾云雾尾迹
      const sternX = curX + S * 0.92;
      const sternY = baseY + floatY + airshipH * 0.35;
      const puffScale1 = 0.8 + Math.sin(tSec * 2.5) * 0.2;
      const puffScale2 = 0.8 + Math.sin(tSec * 2.5 + 1.2) * 0.2;
      const puffScale3 = 0.8 + Math.sin(tSec * 2.5 + 2.4) * 0.2;

      if (cloud1Ref.current) {
        cloud1Ref.current.style.transform = `translate3d(${sternX + 8}px, ${sternY}px, 0) scale(${puffScale1})`;
        cloud1Ref.current.style.opacity = isResting ? "0" : "0.26";
      }
      if (cloud2Ref.current) {
        cloud2Ref.current.style.transform = `translate3d(${sternX + S * 0.2}px, ${sternY + 2}px, 0) scale(${puffScale2})`;
        cloud2Ref.current.style.opacity = isResting ? "0" : "0.2";
      }
      if (cloud3Ref.current) {
        cloud3Ref.current.style.transform = `translate3d(${sternX + S * 0.36}px, ${sternY - 3}px, 0) scale(${puffScale3})`;
        cloud3Ref.current.style.opacity = isResting ? "0" : "0.14";
      }

      // 仅当飞艇位移超过 1.0px 时才执行微秒级 Pretext 绕排计算，极大降低 GPU/CPU 消耗
      if (Math.abs(curX - lastRenderedX) >= 1.0) {
        lastRenderedX = curX;
        const lines = layoutAroundObstacle(
          prepared,
          containerWidth,
          lineHeight,
          getBlocked(curX)
        );
        updateDOM(lines);
      }

      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [
    ready,
    isSkyBandMode,
    reducedMotion,
    prepared,
    containerWidth,
    S,
    airshipH,
    lineHeight,
    lockedContainerHeight,
    inView,
    normalizedRuns,
  ]);

  // 静态绕排（开启减少动态效果时）
  const staticLines = useMemo(() => {
    if (!ready || !reducedMotion || !prepared || containerWidth <= 0 || isSkyBandMode) {
      return [];
    }
    const baseH = (lockedContainerHeight || 280) - 12;
    const baseY = Math.max(4, baseH * 0.45 - airshipH / 2);
    const staticX = containerWidth - 1.05 * S;

    const getBlocked = (bandTop: number, bandBottom: number) => {
      const res: [number, number][] = [];
      const pad = 14;
      const bTop = bandTop - 4;
      const bBottom = bandBottom + 4;
      const cx = staticX + 0.52 * S;
      const cy = baseY + 0.24 * S;
      const a = 0.46 * S;
      const b = 0.17 * S;
      const yStar = Math.max(bTop, Math.min(bBottom, cy));
      if (Math.abs(yStar - cy) < b) {
        const hw = a * Math.sqrt(1 - Math.pow((yStar - cy) / b, 2));
        res.push([cx - hw - pad, cx + hw + pad]);
      }
      return res;
    };

    return layoutAroundObstacle(prepared, containerWidth, lineHeight, getBlocked);
  }, [ready, reducedMotion, prepared, containerWidth, isSkyBandMode, lockedContainerHeight, airshipH, S, lineHeight]);

  // SSR 与尚未准备就绪回退态
  if (!ready) {
    return (
      <div ref={containerRef} className={`${className} pt-pending`}>
        <PlainRuns runs={normalizedRuns} />
      </div>
    );
  }

  // 手机端降级：上方 64px 独立“天空带”，飞艇在上方巡航，文字自然流动排版
  if (isSkyBandMode) {
    return (
      <div ref={containerRef} className="w-full relative overflow-hidden">
        {/* 上方天空巡航带 */}
        <div className="w-full h-16 relative overflow-hidden mb-2 border-b border-gold-500/10">
          <div className="absolute top-1 right-2 animate-pulse pointer-events-none opacity-85">
            <Airship width={S * 0.8} height={airshipH * 0.8} id="airship-sky" />
          </div>
        </div>
        {/* 下方正常流式段落 */}
        <p className={className}>
          <PlainRuns runs={normalizedRuns} />
        </p>
      </div>
    );
  }

  // 减少动效模式：飞艇静态停驻，文字静态绕排
  if (reducedMotion) {
    const staticX = containerWidth - 1.05 * S;
    const staticY = ((lockedContainerHeight || 280) - 12) * 0.45 - airshipH / 2;
    return (
      <div
        ref={containerRef}
        className="w-full relative select-none"
        style={{ height: lockedContainerHeight ? `${lockedContainerHeight}px` : undefined }}
      >
        <span className="sr-only">
          <PlainRuns runs={normalizedRuns} />
        </span>
        {/* 静态飞艇 */}
        <div
          className="absolute pointer-events-none"
          style={{
            transform: `translate3d(${staticX}px, ${staticY}px, 0)`,
          }}
        >
          <Airship width={S} height={airshipH} id="airship-static" />
        </div>
        {/* 静态排版行 */}
        {staticLines.map((line, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="absolute top-0 left-0 whitespace-pre text-marble-200"
            style={{
              transform: `translate3d(${line.x}px, ${line.y}px, 0)`,
              height: `${lineHeight}px`,
              lineHeight: `${lineHeight}px`,
            }}
          >
            {line.fragments.map((f, fi) => {
              const run = normalizedRuns[f.itemIndex] || { text: f.text };
              return (
                <span
                  key={fi}
                  className={run.className}
                  style={{
                    fontWeight: run.weight,
                    marginLeft: f.gapBefore > 0 && fi > 0 ? `${f.gapBefore}px` : undefined,
                  }}
                >
                  {f.text}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full relative select-none"
      style={{
        height: lockedContainerHeight ? `${lockedContainerHeight}px` : undefined,
      }}
    >
      {/* 读屏器与搜索引擎专用的完整语义纯文本 */}
      <span className="sr-only">
        <PlainRuns runs={normalizedRuns} />
      </span>

      {/* 飞艇本体 (绝对定位，仅由 rAF 更新 transform) */}
      <div
        ref={airshipRef}
        className="absolute top-0 left-0 pointer-events-none z-20 will-change-transform"
        style={{ display: "none" }}
      >
        <Airship width={S} height={airshipH} id="airship-dynamic" />
      </div>

      {/* 3 团白银云雾尾迹 */}
      <div
        ref={cloud1Ref}
        className="absolute top-0 left-0 w-8 h-4 rounded-full bg-white blur-[8px] pointer-events-none z-10 will-change-transform"
        style={{ opacity: 0 }}
      />
      <div
        ref={cloud2Ref}
        className="absolute top-0 left-0 w-12 h-6 rounded-full bg-white blur-[10px] pointer-events-none z-10 will-change-transform"
        style={{ opacity: 0 }}
      />
      <div
        ref={cloud3Ref}
        className="absolute top-0 left-0 w-16 h-7 rounded-full bg-azure-200 blur-[12px] pointer-events-none z-10 will-change-transform"
        style={{ opacity: 0 }}
      />

      {/* 文字行对象池挂载容器 (≤ 24 行，由 rAF 动态微量更新) */}
      <div ref={textPoolRef} className="relative w-full h-full z-10 pointer-events-none" />
    </div>
  );
}
