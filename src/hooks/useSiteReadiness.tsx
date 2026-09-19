"use client";

/**
 * 全站“是否已准备好揭幕”信号源与全局资源预缓存管线。
 *
 * 核心职责：
 * 1. 充分利用开场加载屏（LoadingScreen）与进度条展示窗口，提前完成全站核心资源的后台预加载与预热：
 *    - 场景大图：通过 new Image() + await img.decode() 离屏解码至 GPU 显存，彻底消除首屏与后续滚动视口时的掉帧卡顿；
 *    - WebFonts：传入覆盖全站的高频中文字符集样本，一次性触发并缓存所有 Google Fonts 中文 unicode-range 切片与英文字符；
 *    - 页面路由与 RSC：利用 Next.js router.prefetch() 与底层 fetch(url, { headers: { RSC: '1' } }) 预取全站 7 大核心页面及案例详情；
 *    - Pretext 动效引擎：轻量执行 Canvas 2D 排版试跑，预热 V8 JIT 优化编译与 Intl.Segmenter。
 * 2. 多维加权平滑进度算法：科学分配权重（视频 30%、大图解码 25%、中文字体 20%、路由缓存 20%、排版预热 5%），精准驱动进度条与点灯。
 * 3. 优雅降级与网络容错：每个预取任务均设独立超时，弱网或离线时平滑过渡；保留 8s 兜底与跳过按钮。
 */

import { useEffect, useSyncExternalStore } from "react";
import { useReducedMotion } from "@/lib/pretext/hooks";
import { prepareRuns, layoutLines, findBalancedWidth, type TextRun } from "@/lib/pretext/rich";
import { type TypographyInfo } from "@/lib/pretext/typography";

export interface SiteReadinessSnapshot {
  /** 0-100，用于加载屏的进度条，已做平滑与封顶处理 */
  progress: number;
  /** 是否可以开始揭幕（视频+图层+字体+路由+排版引擎均已就绪，或被强制/省流量豁免） */
  isReady: boolean;
  /** isReady 是否是被 forceReady() 提前触发的（跳过按钮 / 8s 兜底），而非自然就绪 */
  isForced: boolean;
  saveData: boolean;
  reducedMotion: boolean;
  /** 当前预缓存阶段描述文案 */
  stageMessage: string;
}

type Phase = "loading" | "ready";

type Store = {
  // 原始信号（0-1 或布尔）
  videoDownload: number;
  videoFrameDecoded: boolean;
  videoPlaying: boolean;

  // 场景大图预载与离屏 GPU 解码
  imagesProgress: number;
  imagesLoaded: boolean;

  // 字体与全量中文字形切片
  fontsProgress: number;
  fontsSettled: boolean;

  // 全站核心路由与 RSC 数据缓存
  routesProgress: number;
  routesLoaded: boolean;

  // Pretext 2D 排版引擎预热
  pretextWarmed: boolean;

  // 控制信号
  forced: boolean;
  saveData: boolean;

  // 派生并做过平滑的显示值
  displayProgress: number;
  stageMessage: string;
  phase: Phase;
};

const store: Store = {
  videoDownload: 0,
  videoFrameDecoded: false,
  videoPlaying: false,
  imagesProgress: 0,
  imagesLoaded: false,
  fontsProgress: 0,
  fontsSettled: false,
  routesProgress: 0,
  routesLoaded: false,
  pretextWarmed: false,
  forced: false,
  saveData: false,
  displayProgress: 0,
  stageMessage: "正在初始化城市黎明...",
  phase: "loading",
};

const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  ensureTicking();
  return () => listeners.delete(listener);
}

function computeStageMessage(): string {
  if (store.phase === "ready" || store.displayProgress >= 99) {
    return "破晓揭幕，准备就绪";
  }
  if (store.imagesProgress < 0.6) {
    return "正在预载全景图层...";
  }
  if (store.fontsProgress < 0.7) {
    return "正在预载字体与全站字符...";
  }
  if (store.routesProgress < 0.8) {
    return "正在建立全站路由与数据缓存...";
  }
  if (!store.pretextWarmed) {
    return "正在预热排版与动效引擎...";
  }
  return "城市苏醒，即将进入...";
}

function computeRawProgress(): number {
  if (store.saveData) {
    // 省流量模式下不加载背景视频与大图，以字体+路由为主
    return (
      (store.fontsSettled ? 0.45 : store.fontsProgress * 0.45) +
      (store.routesLoaded ? 0.45 : store.routesProgress * 0.45) +
      (store.pretextWarmed ? 0.1 : 0)
    );
  }

  // 权重分配：视频 30%、大图解码 25%、中文字体 20%、路由缓存 20%、排版预热 5%
  const videoWeight = 0.30;
  const imagesWeight = 0.25;
  const fontsWeight = 0.20;
  const routesWeight = 0.20;
  const pretextWeight = 0.05;

  const videoRaw =
    Math.min(Math.max(store.videoDownload, 0), 1) * 0.7 +
    (store.videoFrameDecoded ? 0.15 : 0) +
    (store.videoPlaying ? 0.15 : 0);

  const imagesRaw = store.imagesLoaded ? 1 : store.imagesProgress;
  const fontsRaw = store.fontsSettled ? 1 : store.fontsProgress;
  const routesRaw = store.routesLoaded ? 1 : store.routesProgress;
  const pretextRaw = store.pretextWarmed ? 1 : 0;

  return (
    videoRaw * videoWeight +
    imagesRaw * imagesWeight +
    fontsRaw * fontsWeight +
    routesRaw * routesWeight +
    pretextRaw * pretextWeight
  );
}

function computeIsReady(): boolean {
  if (store.forced) return true;
  if (store.saveData) {
    return store.fontsSettled && store.routesLoaded;
  }
  return (
    store.videoPlaying &&
    store.imagesLoaded &&
    store.fontsSettled &&
    store.routesLoaded &&
    store.pretextWarmed
  );
}

let rafId: number | null = null;
let tickTimeoutId: ReturnType<typeof setTimeout> | null = null;
let lastTickTime = 0;

/** 平滑循环：只在还没到 100 且还有订阅者时跑，跑完自己停 */
function tick() {
  rafId = null;
  if (tickTimeoutId !== null) {
    clearTimeout(tickTimeoutId);
    tickTimeoutId = null;
  }

  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  const dt = lastTickTime ? Math.min((now - lastTickTime) / 1000, 0.25) : 0.016;
  lastTickTime = now;

  const ready = computeIsReady();
  const target = ready ? 100 : Math.min(computeRawProgress() * 100, 95);

  // 帧率无关自适应平滑插值：在 60fps 下等价于 ~0.08，在低帧率/无头浏览器/掉帧时自动动态补偿
  const alpha = 1 - Math.exp(-5.5 * dt);
  const next = store.displayProgress + (target - store.displayProgress) * alpha;
  store.displayProgress = Math.max(store.displayProgress, Math.min(next, 100));

  // 已经到达终点且非常接近 100，直接钉死，避免无限趋近但永远到不了
  if (ready && store.displayProgress > 99.2) {
    store.displayProgress = 100;
  }

  const prevPhase = store.phase;
  store.phase = ready && store.displayProgress >= 100 ? "ready" : "loading";
  store.stageMessage = computeStageMessage();

  notify();

  const settled = store.phase === "ready" && prevPhase === "ready";
  if (!settled && listeners.size > 0) {
    ensureTicking();
  }
}

function ensureTicking() {
  if (typeof window === "undefined") return;
  if (rafId === null) {
    rafId = window.requestAnimationFrame(tick);
  }
  // 兜底微循环定时器：防止无头浏览器、未激活标签页或省电模式冻结 rAF
  if (tickTimeoutId === null) {
    tickTimeoutId = setTimeout(() => {
      tickTimeoutId = null;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      tick();
    }, 50);
  }
}

// useSyncExternalStore 快照缓存
let cachedSnapshot: SiteReadinessSnapshot = {
  progress: 0,
  isReady: false,
  isForced: false,
  saveData: false,
  reducedMotion: false,
  stageMessage: "正在初始化城市黎明...",
};

function getSnapshot(): SiteReadinessSnapshot {
  const isReady = store.phase === "ready";
  const stageMsg = store.stageMessage;
  if (
    cachedSnapshot.progress !== store.displayProgress ||
    cachedSnapshot.isReady !== isReady ||
    cachedSnapshot.isForced !== store.forced ||
    cachedSnapshot.saveData !== store.saveData ||
    cachedSnapshot.stageMessage !== stageMsg
  ) {
    cachedSnapshot = {
      progress: store.displayProgress,
      isReady,
      isForced: store.forced,
      saveData: store.saveData,
      reducedMotion: false,
      stageMessage: stageMsg,
    };
  }
  return cachedSnapshot;
}

// 服务端渲染快照
const SERVER_SNAPSHOT: SiteReadinessSnapshot = {
  progress: 0,
  isReady: false,
  isForced: false,
  saveData: false,
  reducedMotion: false,
  stageMessage: "正在初始化城市黎明...",
};

function getServerSnapshot(): SiteReadinessSnapshot {
  return SERVER_SNAPSHOT;
}

/* ------------------------------------------------------------------ */
/* 供 InteractiveBackground.tsx 调用的 reporter 函数                    */
/* ------------------------------------------------------------------ */

export function reportVideoProgress(bufferedEnd: number, duration: number): void {
  if (!Number.isFinite(duration) || duration <= 0) return;
  const ratio = Math.min(Math.max(bufferedEnd / duration, 0), 1);
  if (ratio > store.videoDownload) {
    store.videoDownload = ratio;
    ensureTicking();
  }
}

export function reportVideoCanPlayThrough(): void {
  if (store.videoDownload < 1) {
    store.videoDownload = 1;
    ensureTicking();
  }
}

export function reportVideoFrameDecoded(): void {
  if (!store.videoFrameDecoded) {
    store.videoFrameDecoded = true;
    ensureTicking();
  }
}

export function reportVideoPlaying(): void {
  if (!store.videoPlaying) {
    store.videoPlaying = true;
    ensureTicking();
  }
}

/** 跳过按钮 与 8s 兜底 共用的同一个入口 */
export function forceReady(): void {
  if (!store.forced) {
    store.forced = true;
    ensureTicking();
  }
}

/* ------------------------------------------------------------------ */
/* 1. 场景大图预载与离屏 GPU 解码管线                                     */
/* ------------------------------------------------------------------ */

const SCENE_IMAGES = [
  "/images/scenes/hero_poster.jpg",
  "/images/scenes/scene1_panorama.jpg",
  "/images/scenes/scene2_palace.jpg",
  "/images/scenes/scene3_terrace.jpg",
  "/images/scenes/scene4_greenhouse.jpg",
  "/images/scenes/scene5_harbor.jpg",
  "/images/silver-city-hero.jpg",
];

async function precacheImages(): Promise<void> {
  if (typeof window === "undefined") return;

  let loadedCount = 0;
  const total = SCENE_IMAGES.length;

  const loadSingle = (url: string): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      let settled = false;

      const done = () => {
        if (!settled) {
          settled = true;
          loadedCount++;
          store.imagesProgress = loadedCount / total;
          ensureTicking();
          resolve();
        }
      };

      // 3.5s 超时保护，单图网络问题不阻断整体流程
      const timer = setTimeout(done, 3500);

      img.onload = () => {
        clearTimeout(timer);
        done();
      };
      img.onerror = () => {
        clearTimeout(timer);
        done();
      };
      img.src = url;

      if (typeof img.decode === "function") {
        img
          .decode()
          .then(() => {
            clearTimeout(timer);
            done();
          })
          .catch(() => {
            clearTimeout(timer);
            done();
          });
      }
    });
  };

  await Promise.all(SCENE_IMAGES.map(loadSingle));
  store.imagesLoaded = true;
  ensureTicking();
}

/* ------------------------------------------------------------------ */
/* 2. WebFonts 与覆盖全站中文字形切片预热管线                                */
/* ------------------------------------------------------------------ */

const CHINESE_SAMPLE =
  "白银之城动画与游戏多模态数据构建模型评测自动化流水线五层图像描述体系双盲评测精选代表作与实践四大核心专业能力支柱关于我职业哲学经验架构联系探讨算法极客质控闭环时间戳视觉事件防幻觉运镜解构光影特效角色动作持续状态环境作用业务收益交付文档完整简历时序镜头";
const LATIN_SAMPLE = "BINLEI Silver City Multimodal AI Projects Experience About 0123456789";

const FONTS_TO_WARM = [
  { spec: '700 1em "Noto Serif SC"', sample: CHINESE_SAMPLE },
  { spec: '600 1em "Noto Serif SC"', sample: CHINESE_SAMPLE },
  { spec: '700 1em Cinzel', sample: LATIN_SAMPLE },
  { spec: '600 1em Cinzel', sample: LATIN_SAMPLE },
  { spec: '500 1em Cinzel', sample: LATIN_SAMPLE },
  { spec: '600 1em Inter', sample: LATIN_SAMPLE },
  { spec: '500 1em Inter', sample: LATIN_SAMPLE },
  { spec: '400 1em Inter', sample: LATIN_SAMPLE },
];

async function prewarmFonts(): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) {
    store.fontsProgress = 1;
    store.fontsSettled = true;
    ensureTicking();
    return;
  }

  let finished = 0;
  const total = FONTS_TO_WARM.length;

  const loadSingle = async (f: { spec: string; sample: string }) => {
    try {
      await Promise.race([
        document.fonts.load(f.spec, f.sample),
        new Promise((res) => setTimeout(res, 2500)),
      ]);
    } catch {
      // 忽略单个字体切片超时
    } finally {
      finished++;
      store.fontsProgress = finished / total;
      ensureTicking();
    }
  };

  await Promise.all(FONTS_TO_WARM.map(loadSingle));
  try {
    await Promise.race([
      document.fonts.ready,
      new Promise((res) => setTimeout(res, 1200)),
    ]);
  } catch {
    // 忽略
  }
  store.fontsSettled = true;
  ensureTicking();
}

/* ------------------------------------------------------------------ */
/* 3. 全站核心页面路由与 RSC 载荷预取管线                                   */
/* ------------------------------------------------------------------ */

export const SITE_ROUTES = [
  "/",
  "/projects",
  "/experience",
  "/about",
  "/projects/video-multimodal-data",
  "/projects/image-eval-benchmark",
  "/projects/ai-data-automation",
];

let routerPrefetchFn: ((url: string) => void) | null = null;

export function registerRouterPrefetch(fn: (url: string) => void) {
  routerPrefetchFn = fn;
  triggerRouterPrefetch();
}

function triggerRouterPrefetch() {
  if (!routerPrefetchFn) return;
  for (const route of SITE_ROUTES) {
    try {
      routerPrefetchFn(route);
    } catch {
      // 忽略
    }
  }
}

async function precacheRoutes(): Promise<void> {
  if (typeof window === "undefined") return;

  triggerRouterPrefetch();

  let finished = 0;
  const total = SITE_ROUTES.length;

  const fetchSingle = async (url: string) => {
    try {
      await Promise.race([
        fetch(url, {
          headers: { RSC: "1", "Next-Router-Prefetch": "1" },
          cache: "force-cache",
        }),
        new Promise((res) => setTimeout(res, 3000)),
      ]);
    } catch {
      // 忽略网络问题
    } finally {
      finished++;
      store.routesProgress = finished / total;
      ensureTicking();
    }
  };

  await Promise.all(SITE_ROUTES.map(fetchSingle));
  store.routesLoaded = true;
  ensureTicking();
}

/* ------------------------------------------------------------------ */
/* 4. Pretext 2D 排版引擎与分词器预热管线                                   */
/* ------------------------------------------------------------------ */

async function prewarmPretext(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const dummyRuns: TextRun[] = [
      { text: "白银之城", weight: 700 },
      { text: "动画与游戏多模态 AI 数据构建 · 模型评测与自动化", weight: 600 },
    ];
    const typo: TypographyInfo = {
      font: '700 32px "Noto Serif SC", serif',
      fontSize: 32,
      lineHeightPx: 40,
      letterSpacingPx: 1,
      fontStyle: "normal",
      fontFamily: '"Noto Serif SC", serif',
      key: '700 32px "Noto Serif SC", serif|40|1',
    };
    const prep = prepareRuns(dummyRuns, typo);
    layoutLines(prep, 600);
    findBalancedWidth(prep, 800);
  } catch {
    // 降级保护，绝不阻断主流程
  } finally {
    store.pretextWarmed = true;
    ensureTicking();
  }
}

/* ------------------------------------------------------------------ */
/* 全局预缓存流水线调度（模块级，只跑一次）                                */
/* ------------------------------------------------------------------ */

let assetsWarmed = false;
function warmAssetsOnce() {
  if (assetsWarmed || typeof document === "undefined") return;
  assetsWarmed = true;

  // 1. 场景大图后台 GPU 解码
  precacheImages();

  // 2. 字体与全站中文字形切片加载 -> 接着预热 Pretext 排版引擎
  Promise.race([
    prewarmFonts(),
    new Promise((res) => setTimeout(res, 1500)),
  ]).then(() => {
    prewarmPretext();
  });

  // 3. 全站路由与 RSC 载荷预取
  precacheRoutes();
}

function detectSaveData(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  if (!connection) return false;
  if (connection.saveData) return true;
  return connection.effectiveType === "2g" || connection.effectiveType === "slow-2g";
}

if (typeof navigator !== "undefined") {
  store.saveData = detectSaveData();
}

/* ------------------------------------------------------------------ */
/* 对外 Hook                                                            */
/* ------------------------------------------------------------------ */

export function useSiteReadiness(): SiteReadinessSnapshot {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    warmAssetsOnce();
  }, []);

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return { ...snapshot, reducedMotion };
}
