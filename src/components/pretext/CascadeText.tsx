"use client";

import React, { useRef, useState, useEffect, useMemo, useId } from "react";
import { type TextRun, layoutLines } from "@/lib/pretext/rich";
import { usePretextRuns, useReducedMotion } from "@/lib/pretext/hooks";
import { LineFragments, PlainRuns } from "@/components/pretext/LineContent";
import { choreographer } from "@/lib/pretext/choreographer";

export interface CascadeTextProps {
  text?: string;
  runs?: TextRun[];
  className?: string;
  baseDelayMs?: number;
  play?: boolean;
  id?: string;
}

export function CascadeText({
  text,
  runs,
  className = "",
  baseDelayMs = 0,
  play = false,
  id: customId,
}: CascadeTextProps) {
  const generatedId = useId();
  const componentId = customId || `cascade-${generatedId}`;

  const normalizedRuns: TextRun[] = useMemo(() => {
    if (runs && runs.length > 0) return runs;
    if (text) return [{ text }];
    return [];
  }, [runs, text]);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  const { prepared, width, ready, typography } = usePretextRuns(
    rootRef,
    normalizedRuns
  );

  const [isCascading, setIsCascading] = useState(false);

  // 1. 当外部触发 play 且准备就绪时，向调度器申请播放权
  useEffect(() => {
    if (!ready || !play || isCascading || reducedMotion) return;

    let cancelled = false;
    choreographer.claim(componentId, 2).then((canPlay) => {
      if (cancelled || !canPlay) return;
      setIsCascading(true);
    });

    return () => {
      cancelled = true;
    };
  }, [ready, play, isCascading, reducedMotion, componentId]);

  // 2. 切行
  const renderedLines = useMemo(() => {
    if (!prepared || width <= 0) return [];
    return layoutLines(prepared, width);
  }, [prepared, width]);

  // 3. 动画总时长与调度释放
  const totalAnimDuration = useMemo(() => {
    const lineCount = renderedLines.length;
    // baseDelay + lastLineDelay (lineCount * 110) + 900ms + mist buffer
    return baseDelayMs + Math.max(0, lineCount - 1) * 110 + 1200;
  }, [renderedLines.length, baseDelayMs]);

  useEffect(() => {
    if (!isCascading || reducedMotion) return;
    const timer = setTimeout(() => {
      choreographer.release(componentId);
    }, totalAnimDuration);

    return () => {
      clearTimeout(timer);
      choreographer.release(componentId);
    };
  }, [isCascading, reducedMotion, componentId, totalAnimDuration]);

  const lineHeight = typography?.lineHeightPx || 24;

  // SSR 与降级状态
  if (!ready || renderedLines.length === 0) {
    return (
      <div ref={rootRef} className={`${className} pt-pending`}>
        <PlainRuns runs={normalizedRuns} />
      </div>
    );
  }

  // 减少动效模式
  if (reducedMotion) {
    return (
      <div ref={rootRef} className={`${className} is-cascade-static`}>
        <span className="sr-only">
          <PlainRuns runs={normalizedRuns} />
        </span>
        {renderedLines.map((line, idx) => (
          <span
            key={idx}
            aria-hidden="true"
            className="pt-cascade-line"
            style={{ height: `${lineHeight}px` }}
          >
            <LineFragments fragments={line.fragments} runs={normalizedRuns} />
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`${className} ${isCascading ? "is-cascading" : "pt-pending"}`}
    >
      <span className="sr-only">
        <PlainRuns runs={normalizedRuns} />
      </span>

      {renderedLines.map((line, idx) => {
        const lineDelay = baseDelayMs + idx * 110;
        return (
          <span
            key={idx}
            aria-hidden="true"
            className="pt-cascade-line"
            style={
              {
                height: `${lineHeight}px`,
                "--pt-delay": `${lineDelay}ms`,
              } as React.CSSProperties
            }
          >
            <LineFragments fragments={line.fragments} runs={normalizedRuns} />

            {/* 该行落定瞬间激发的水雾薄烟（与行宽等宽） */}
            <span
              className="pt-cascade-mist"
              style={{
                width: `${Math.ceil(line.width)}px`,
              }}
            />
          </span>
        );
      })}
    </div>
  );
}
