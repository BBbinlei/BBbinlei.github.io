"use client";

import { useState, useEffect, useRef } from "react";
import {
  type TypographyInfo,
  readTypography,
  buildFontForWeight,
  ensureFontsLoaded,
} from "@/lib/pretext/typography";
import {
  type TextRun,
  type PreparedRich,
  prepareRuns,
} from "@/lib/pretext/rich";

export interface PretextRunsResult {
  prepared: PreparedRich | null;
  width: number;
  ready: boolean;
  failed: boolean;
  typography: TypographyInfo | null;
}

/**
 * 核心 Hook：响应式感知容器宽度与排印参数变动
 * 保证 prepareRichInline 仅在文案或排印变更时调用，断点切换平滑过渡
 */
export function usePretextRuns(
  styleRef: React.RefObject<HTMLElement | null>,
  runs: TextRun[],
  widthRef?: React.RefObject<HTMLElement | null>
): PretextRunsResult {
  const [width, setWidth] = useState<number>(0);
  const [typography, setTypography] = useState<TypographyInfo | null>(null);
  const [prepared, setPrepared] = useState<PreparedRich | null>(null);
  const [ready, setReady] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);

  // 1. ResizeObserver 监听宽度变动与排印参数变动
  useEffect(() => {
    const targetEl = widthRef?.current || styleRef.current;
    if (!targetEl) return;

    const measure = (entry?: ResizeObserverEntry) => {
      let contentW = 0;
      if (entry && entry.contentRect) {
        contentW = entry.contentRect.width;
      } else {
        const cs = window.getComputedStyle(targetEl);
        const pl = parseFloat(cs.paddingLeft) || 0;
        const pr = parseFloat(cs.paddingRight) || 0;
        contentW = targetEl.clientWidth - pl - pr;
      }

      if (contentW > 0) {
        setWidth(contentW);
      }

      if (styleRef.current) {
        const typo = readTypography(styleRef.current);
        setTypography((prev) => {
          if (!prev || prev.key !== typo.key) {
            return typo;
          }
          return prev;
        });
      }
    };

    // 初始测算
    measure();

    const ro = new ResizeObserver(([entry]) => {
      measure(entry);
    });

    ro.observe(targetEl);
    return () => ro.disconnect();
  }, [styleRef, widthRef]);

  // 2. 排印参数或 TextRuns 变更时：在 effect 里等待字体就绪并 prepare
  useEffect(() => {
    if (!typography || runs.length === 0) return;

    let cancelled = false;

    async function doPrepare() {
      try {
        // 收集所有需要检查的字体字符串
        const fontsToLoad = [typography!.font];
        runs.forEach((r) => {
          if (r.weight) {
            fontsToLoad.push(buildFontForWeight(typography!, r.weight));
          }
        });

        const fullText = runs.map((r) => r.text).join("");
        await ensureFontsLoaded(fontsToLoad, fullText, 3000);

        if (cancelled) return;

        const preparedRes = prepareRuns(runs, typography!);
        setPrepared(preparedRes);
        setReady(true);
        setFailed(false);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[pretext] prepare runs failed, fallback to plain", err);
        }
        if (!cancelled) {
          setFailed(true);
          setReady(false);
        }
      }
    }

    doPrepare();

    return () => {
      cancelled = true;
    };
  }, [typography?.key, runs]);

  return {
    prepared,
    width,
    ready: ready && !failed && width > 0,
    failed,
    typography,
  };
}

/**
 * 监听用户系统是否开启“减少动态效果”
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);

    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return reduced;
}

/**
 * IntersectionObserver：单次触发入场，进入视口后断开观察
 */
export function useInViewOnce(
  ref: React.RefObject<HTMLElement | null>,
  options: IntersectionObserverInit = {
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.15,
  }
): boolean {
  const [inView, setInView] = useState<boolean>(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry && entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, inView, options.rootMargin, options.threshold]);

  return inView;
}

/**
 * IntersectionObserver：持续跟踪是否在视口内（供常驻动画暂停/恢复）
 */
export function useInView(
  ref: React.RefObject<HTMLElement | null>,
  options: IntersectionObserverInit = {
    rootMargin: "0px 0px 0px 0px",
    threshold: 0,
  }
): boolean {
  const [inView, setInView] = useState<boolean>(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry) {
        setInView(entry.isIntersecting);
      }
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, options.rootMargin, options.threshold]);

  return inView;
}
