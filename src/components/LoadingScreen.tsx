"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { forceReady, registerRouterPrefetch, useSiteReadiness } from "@/hooks/useSiteReadiness";

/**
 * 开场加载动画：破晓（Daybreak）+ 云海拉开（Cloud-Sea Curtain Parting）。
 *
 * 阶段状态机：loading → revealing-prep → revealing → done
 *   loading         等待 isReady（视频已播放 + 字体就绪 + 封面图就绪，或被强制/省流量豁免）与最短展示时长
 *   revealing-prep  开始揭幕的准备：等待"至少渲染过一帧"的双重 rAF 关卡；完整版同时并行做前景淡出
 *   revealing       播放云幕拉开（或减少动效下的简单淡出）
 *   done            过渡结束，解除滚动锁定与 inert，自身不再渲染任何内容
 *
 * 同会话重复访问：sessionStorage 记录后，后续整页加载走 ~600ms 的简化版（mode='short'）。
 * 为避免与 SSR 输出不一致，mode 的初始值永远是 'full'，真正的判定放在 mount 后的 effect 里。
 */

type Phase = "loading" | "revealing-prep" | "revealing" | "done";
type Mode = "full" | "short";

const SPLASH_SEEN_KEY = "binlei:splash-seen";

const MIN_DISPLAY_MS: Record<Mode, number> = { full: 1200, short: 350 };
const MAX_WAIT_MS = 8000;
const SKIP_DELAY_MS = 2000;
const FOREGROUND_FADE_MS = 300; // 完整版：文字/天际线先淡出，再拉云幕
const REVEAL_MS: Record<Mode, number> = { full: 900, short: 350 };
const REVEAL_STAGGER_MS = 60; // 完整版右侧云幕的错峰延迟
const REDUCED_FADE_MS = 500;

// 天空三段渐变的 RGB 三元组：午夜 → 破晓
const SKY_TOP_FROM: [number, number, number] = [6, 11, 24]; // royal-950 #060b18
const SKY_TOP_TO: [number, number, number] = [30, 58, 138]; // royal-700 #1e3a8a
const SKY_MID_FROM: [number, number, number] = [17, 31, 68]; // royal-850 #111f44
const SKY_MID_TO: [number, number, number] = [245, 158, 11]; // gold-500 #f59e0b
const SKY_HORIZON_FROM: [number, number, number] = [12, 21, 46]; // royal-900 #0c152e
const SKY_HORIZON_TO: [number, number, number] = [253, 224, 71]; // gold-300 #fde047

function lerp(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

type WindowSpec = { x: number; y: number; w: number; h: number; threshold: number };

// 天际线窗户：手写死坐标 + 手写点亮阈值（0-100），刻意打乱顺序制造自然感，而非从左到右依次点亮
const WINDOWS: WindowSpec[] = [
  { x: 130, y: 175, w: 6, h: 9, threshold: 6 },
  { x: 705, y: 150, w: 6, h: 10, threshold: 14 },
  { x: 183, y: 245, w: 5, h: 8, threshold: 18 },
  { x: 130, y: 210, w: 6, h: 9, threshold: 22 },
  { x: 1210, y: 260, w: 5, h: 8, threshold: 28 },
  { x: 78, y: 230, w: 5, h: 8, threshold: 10 },
  { x: 1270, y: 220, w: 5, h: 8, threshold: 52 },
  { x: 705, y: 200, w: 6, h: 10, threshold: 40 },
  { x: 145, y: 250, w: 6, h: 9, threshold: 46 },
  { x: 90, y: 260, w: 5, h: 8, threshold: 34 },
  { x: 720, y: 250, w: 6, h: 10, threshold: 66 },
  { x: 190, y: 285, w: 5, h: 8, threshold: 58 },
  { x: 1222, y: 300, w: 5, h: 8, threshold: 74 },
  { x: 1280, y: 270, w: 5, h: 8, threshold: 88 },
];

export function LoadingScreen() {
  const { progress, isReady, reducedMotion, stageMessage } = useSiteReadiness();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("full"); // 永远从 'full' 开始，避免与 SSR 输出不一致
  const [phase, setPhase] = useState<Phase>("loading");
  const [showSkip, setShowSkip] = useState(false);
  const [liveMessage, setLiveMessage] = useState("页面加载中");

  // 注册 Next.js 路由预取，将全站核心页面预先注入客户端 Router Cache
  useEffect(() => {
    registerRouterPrefetch((url) => {
      try {
        router.prefetch(url);
      } catch {
        // 忽略预取错误
      }
    });
  }, [router]);

  const rootRef = useRef<HTMLDivElement>(null);
  const mountedAtRef = useRef<number>(Date.now());
  const frameGateRef = useRef(false);
  const fadeGateRef = useRef(false);
  const advancedRef = useRef(false);
  const siblingsRef = useRef<HTMLElement[]>([]);

  // 同会话短路：挂载后（不在渲染期间）判定，避免 SSR/首次客户端渲染不一致
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SPLASH_SEEN_KEY) === "1") {
        setMode("short");
      } else {
        sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
      }
    } catch {
      // Safari 隐私模式等场景下 sessionStorage 可能抛异常，按“完整版”处理，不阻断加载
    }
  }, []);

  // 滚动锁定 + inert：挂载时施加，phase 到 done 时立即解除（组件本身不会被父级卸载，
  // 所以不能只依赖 unmount 清理——用 phase 的 effect 主动移除；unmount 清理只作为兜底）
  useLayoutEffect(() => {
    document.documentElement.classList.add("splash-lock");
    const root = rootRef.current;
    const siblings = root
      ? (Array.from(document.body.children) as HTMLElement[]).filter((el) => el !== root)
      : [];
    siblings.forEach((el) => {
      el.inert = true;
    });
    siblingsRef.current = siblings;
    root?.focus();

    return () => {
      document.documentElement.classList.remove("splash-lock");
      siblingsRef.current.forEach((el) => {
        el.inert = false;
      });
    };
  }, []);

  useEffect(() => {
    if (phase !== "done") return;
    document.documentElement.classList.remove("splash-lock");
    siblingsRef.current.forEach((el) => {
      el.inert = false;
    });
  }, [phase]);

  // 8s 强制揭幕兜底：与跳过按钮共用同一个 forceReady()
  useEffect(() => {
    const t = setTimeout(forceReady, MAX_WAIT_MS);
    return () => clearTimeout(t);
  }, []);

  // 跳过按钮：仅完整版展示（简化版全程 ~600ms，2s 延迟没有出现的意义）
  useEffect(() => {
    if (mode !== "full") return;
    const t = setTimeout(() => setShowSkip(true), SKIP_DELAY_MS);
    return () => clearTimeout(t);
  }, [mode]);

  // loading → revealing-prep：isReady 达成后，仍要满足“最短展示时长”
  useEffect(() => {
    if (phase !== "loading" || !isReady) return;
    const elapsed = Date.now() - mountedAtRef.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS[mode] - elapsed);
    const t = setTimeout(() => {
      setPhase("revealing-prep");
      setLiveMessage("加载完成，正在进入");
    }, remaining);
    return () => clearTimeout(t);
  }, [isReady, phase, mode]);

  // revealing-prep → revealing：双重 rAF（确保视频至少渲染过一帧）+ 完整版并行的前景淡出
  useEffect(() => {
    if (phase !== "revealing-prep") return;
    frameGateRef.current = false;
    fadeGateRef.current = mode !== "full" || reducedMotion; // 简化版/减少动效不需要单独的淡出等待
    advancedRef.current = false;

    const tryAdvance = () => {
      if (advancedRef.current) return;
      if (frameGateRef.current && fadeGateRef.current) {
        advancedRef.current = true;
        setPhase("revealing");
      }
    };

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        frameGateRef.current = true;
        tryAdvance();
      });
    });

    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    if (mode === "full" && !reducedMotion) {
      fadeTimer = setTimeout(() => {
        fadeGateRef.current = true;
        tryAdvance();
      }, FOREGROUND_FADE_MS);
    }

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, [phase, mode, reducedMotion]);

  // revealing → done
  useEffect(() => {
    if (phase !== "revealing") return;
    const duration = reducedMotion
      ? REDUCED_FADE_MS
      : mode === "short"
        ? REVEAL_MS.short
        : REVEAL_MS.full + REVEAL_STAGGER_MS;
    const t = setTimeout(() => setPhase("done"), duration + 60);
    return () => clearTimeout(t);
  }, [phase, mode, reducedMotion]);

  if (phase === "done") return null;

  const t = Math.min(Math.max(progress / 100, 0), 1);

  const rootProps = {
    ref: rootRef,
    className: "splash-root",
    "data-phase": phase,
    "data-mode": mode,
    "data-reduced": reducedMotion ? "true" : undefined,
    role: "progressbar" as const,
    "aria-valuenow": Math.round(progress),
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-label": "页面加载进度",
    tabIndex: -1,
  };

  // ---- 减少动效：纯色背景 + 字标 + 百分比，就绪后单纯淡出，不做破晓/云幕 ----
  if (reducedMotion) {
    return (
      <div {...rootProps}>
        <span className="sr-only" aria-live="polite">
          {liveMessage}
        </span>
        <div className="splash-foreground splash-foreground--plain">
          <div className="pt-banner-title splash-wordmark">BINLEI</div>
          <div className="splash-progress-track">
            <div className="splash-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="splash-progress-label">{Math.round(progress)}%</div>
          <div className="splash-stage-label" aria-hidden="true">
            {stageMessage}
          </div>
        </div>
        {showSkip && (
          <button type="button" className="splash-skip" onClick={forceReady}>
            跳过动画 →
          </button>
        )}
      </div>
    );
  }

  const skyGlow = lerp(SKY_MID_FROM, SKY_MID_TO, t);
  const skyTop = lerp(SKY_TOP_FROM, SKY_TOP_TO, t);
  const skyHorizon = lerp(SKY_HORIZON_FROM, SKY_HORIZON_TO, t);
  const moonOpacity = Math.min(Math.max((60 - progress) / 40, 0), 1);

  return (
    <div {...rootProps}>
      <span className="sr-only" aria-live="polite">
        {phase === "loading" ? stageMessage : liveMessage}
      </span>

      <div
        className="splash-sky"
        style={{
          backgroundImage: `radial-gradient(ellipse 120% 80% at 50% 20%, ${skyGlow} 0%, ${skyTop} 45%, ${skyTop} 100%), linear-gradient(180deg, transparent 0%, ${skyHorizon} 100%)`,
        }}
      />

      <div className="splash-foreground">
        <div className="splash-moon" style={{ opacity: moonOpacity }} />

        <div className="splash-copy">
          <div className="pt-banner-title splash-wordmark">BINLEI</div>
          <div className="splash-subtitle">白银之城</div>
          <div className="splash-progress-track">
            <div className="splash-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="splash-progress-label">{Math.round(progress)}%</div>
          <div className="splash-stage-label" aria-hidden="true">
            {stageMessage}
          </div>
        </div>

        <svg
          className="splash-skyline"
          viewBox="0 0 1440 420"
          preserveAspectRatio="xMidYMax slice"
          aria-hidden="true"
        >
          <defs>
            <mask id="splash-arch-mask">
              <rect x="850" y="350" width="300" height="30" fill="#ffffff" />
              <circle cx="910" cy="380" r="13" fill="#000000" />
              <circle cx="1000" cy="380" r="13" fill="#000000" />
              <circle cx="1090" cy="380" r="13" fill="#000000" />
            </mask>
          </defs>

          {/* 地基：把左右建筑群与中央钟楼、拱桥连成一条连续的天际线 */}
          <rect x="0" y="380" width="1440" height="40" fill="#060b18" />

          {/* 左侧宫殿尖塔群 */}
          <rect x="70" y="200" width="34" height="180" fill="#060b18" />
          <path d="M70,200 Q87,168 104,200 Z" fill="#060b18" />
          <rect x="120" y="150" width="40" height="230" fill="#060b18" />
          <path d="M120,150 Q140,108 160,150 Z" fill="#060b18" />
          <rect x="175" y="220" width="30" height="160" fill="#060b18" />
          <path d="M175,220 Q190,193 205,220 Z" fill="#060b18" />

          {/* 中央钟楼：全场最高，带表盘与指针 */}
          <rect x="690" y="120" width="60" height="260" fill="#060b18" />
          <path d="M690,120 L720,68 L750,120 Z" fill="#060b18" />
          <circle cx="720" cy="172" r="20" fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth="2" />
          <line x1="720" y1="172" x2="720" y2="158" stroke="rgba(148,163,184,0.4)" strokeWidth="2" />
          <line x1="720" y1="172" x2="730" y2="176" stroke="rgba(148,163,184,0.4)" strokeWidth="2" />

          {/* 低矮拱桥：用 mask 挖出真正透光的拱洞 */}
          <rect x="850" y="350" width="300" height="30" fill="#060b18" mask="url(#splash-arch-mask)" />

          {/* 右侧对称的矮圆顶群 */}
          <rect x="1200" y="230" width="36" height="150" fill="#060b18" />
          <path d="M1200,230 Q1218,203 1236,230 Z" fill="#060b18" />
          <rect x="1260" y="190" width="32" height="190" fill="#060b18" />
          <path d="M1260,190 Q1276,160 1292,190 Z" fill="#060b18" />

          {/* 右侧渐细孤塔 */}
          <rect x="1390" y="140" width="16" height="240" fill="#060b18" />
          <path d="M1390,140 L1398,92 L1406,140 Z" fill="#060b18" />

          {/* 窗户点灯 */}
          {WINDOWS.map((w, i) => {
            const lit = progress >= w.threshold;
            return (
              <rect
                key={i}
                x={w.x}
                y={w.y}
                width={w.w}
                height={w.h}
                fill="#fde047"
                className="splash-window"
                style={{
                  opacity: lit ? 1 : 0,
                  filter: lit ? "drop-shadow(0 0 2px rgba(253,224,71,0.8))" : undefined,
                }}
              />
            );
          })}
        </svg>
      </div>

      <div className="splash-cloud-panel splash-cloud-panel--left" aria-hidden="true" />
      <div className="splash-cloud-panel splash-cloud-panel--right" aria-hidden="true" />

      {showSkip && (
        <button type="button" className="splash-skip" onClick={forceReady}>
          跳过动画 →
        </button>
      )}
    </div>
  );
}
