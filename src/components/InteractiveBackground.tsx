"use client";

import { useEffect, useRef, useState } from "react";
import {
  reportVideoCanPlayThrough,
  reportVideoFrameDecoded,
  reportVideoPlaying,
  reportVideoProgress,
  useSiteReadiness,
} from "@/hooks/useSiteReadiness";

export function InteractiveBackground() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 省流量模式下整段会话都不加载视频，只用静态海报，避免加载屏放行后视频仍在后台偷偷下载
  const { saveData } = useSiteReadiness();

  // 挂载主动轮询：捕获由浏览器缓存直接命中的视频就绪状态（避免 React 合成事件错过早于水合触发的事件）
  useEffect(() => {
    if (saveData) return;
    const v = videoRef.current;
    if (!v) return;

    const checkVideoState = () => {
      if (v.readyState >= 2) reportVideoFrameDecoded();
      if (v.readyState >= 4) reportVideoCanPlayThrough();
      if (!v.paused && v.currentTime > 0) reportVideoPlaying();
      if (v.buffered.length > 0 && Number.isFinite(v.duration) && v.duration > 0) {
        reportVideoProgress(v.buffered.end(v.buffered.length - 1), v.duration);
      }
    };

    checkVideoState();
    const timer = setInterval(checkVideoState, 120);
    return () => clearInterval(timer);
  }, [saveData]);

  useEffect(() => {
    // saveData 分支渲染的是纯海报 <div>，没有 <canvas>/<video>，这里直接跳过整套循环。
    // 依赖数组包含 saveData，是为了在它于挂载后才变为 true 时（理论上极少发生），
    // 让上一轮的监听器和 rAF 被正确清理，而不是留着对着已从 DOM 移除的旧节点空转。
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number | null = null;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // 性能优化 1：缓存文档高度，彻底消除每帧读取 scrollHeight 导致的强制重排 (Forced Reflow / Layout Thrashing)
    let docHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);

    // 性能优化 5：静止节流。滚动/鼠标缓动收敛且约 1.5s 无新交互时，停止排下一帧；
    // 任意新的 scroll/mousemove/resize，或标签页从隐藏变为可见，都会立即唤醒循环。
    const IDLE_FRAMES_THRESHOLD = 90; // 约 1.5s @60fps
    let isIdle = false;

    const wake = () => {
      if (isIdle) {
        isIdle = false;
        if (animId === null) animId = requestAnimationFrame(render);
      }
    };

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      docHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      wake();
    };
    window.addEventListener("resize", onResize, { passive: true });

    // 交互状态跟踪
    let scrollY = window.scrollY || 0;
    let targetScrollY = scrollY;
    let lastScrollY = scrollY;
    let isMoving = true;
    let idleCounter = 0;

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const onScroll = () => {
      targetScrollY = window.scrollY || 0;
      isMoving = true;
      idleCounter = 0;
      wake();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
      isMoving = true;
      idleCounter = 0;
      wake();
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (animId !== null) {
          cancelAnimationFrame(animId);
          animId = null;
        }
        isIdle = true;
      } else {
        wake();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // 性能优化 2：适量粒子 (40颗)，消除高耗能 shadowBlur，采用纯硬件高效渲染
    const particles = Array.from({ length: 42 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.6,
      alpha: Math.random() * 0.6 + 0.25,
      speedY: -(Math.random() * 0.3 + 0.08),
      speedX: (Math.random() - 0.5) * 0.15,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    let lastTranslateY = -999;
    let lastScale = -999;
    let lastOverlayOpacity = -999;

    const render = () => {
      // 防御性保护：后台标签页等场景下 window.innerWidth/innerHeight 可能短暂为 0，
      // 除以 0 会产生 NaN/Infinity，传给 createRadialGradient 会直接抛出未捕获异常，
      // 导致这个 requestAnimationFrame 循环从此静默死掉（不会再排下一帧）。
      // 这里跳过这一帧的绘制，但仍然继续排下一帧，等尺寸恢复正常后自愈。
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      // 缓动插值
      const scrollDiff = targetScrollY - scrollY;
      const mouseDiffX = targetMouseX - mouseX;
      const mouseDiffY = targetMouseY - mouseY;

      scrollY += scrollDiff * 0.1;
      const scrollVelocity = scrollY - lastScrollY;
      lastScrollY = scrollY;

      mouseX += mouseDiffX * 0.08;
      mouseY += mouseDiffY * 0.08;

      // 性能优化 3：严格将视差平移限制在安全溢出边距内，保证全页面任意深度下视频 100% 满铺视口，永不露黑边
      const mouseOffsetX = ((mouseX / width) - 0.5) * 20;
      const mouseOffsetY = ((mouseY / height) - 0.5) * 14;
      const scrollProgress = Math.min(Math.max(scrollY / docHeight, 0), 1);

      // 垂直视差平移由 [-25px, +25px] 构成，配合 10vh 的安全外沿溢出，全屏无缝覆盖
      const translateY = Math.round(((scrollProgress - 0.5) * -45 + mouseOffsetY * 0.3) * 10) / 10;
      const translateX = Math.round((mouseOffsetX * 0.4) * 10) / 10;
      const scale = Math.round((1.03 + scrollProgress * 0.03) * 1000) / 1000;

      if (videoRef.current && (Math.abs(translateY - lastTranslateY) > 0.1 || Math.abs(scale - lastScale) > 0.001)) {
        videoRef.current.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
        lastTranslateY = translateY;
        lastScale = scale;
      }

      // 性能优化 4：使用独立合成层控制暗化与景深，杜绝在 <video> 上动态计算高开销的 filter: blur()
      const overlayOpacity = Math.round((0.22 + scrollProgress * 0.28) * 100) / 100;
      if (overlayRef.current && Math.abs(overlayOpacity - lastOverlayOpacity) > 0.01) {
        overlayRef.current.style.opacity = `${overlayOpacity}`;
        lastOverlayOpacity = overlayOpacity;
      }

      // 绘制粒子与背景氛围
      ctx.clearRect(0, 0, width, height);

      // 静态金辉与天青氛围渐变
      const glowY = height * 0.3 + scrollProgress * height * 0.3;
      const ambientGlow = ctx.createRadialGradient(
        width * 0.5 + mouseOffsetX,
        glowY,
        30,
        width * 0.5,
        glowY,
        width * 0.6
      );
      ambientGlow.addColorStop(0, "rgba(251, 191, 36, 0.12)");
      ambientGlow.addColorStop(0.5, "rgba(30, 58, 138, 0.18)");
      ambientGlow.addColorStop(1, "rgba(6, 11, 24, 0)");
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, width, height);

      // 绘制日光金砂微粒（去除了 GPU 瓶颈的 shadowBlur，改用高效率原生圆绘制）
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.speedY - scrollVelocity * 0.2;
        p.x += p.speedX;

        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;
        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;

        p.twinklePhase += p.twinkleSpeed;
        const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.twinklePhase));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(254, 240, 138, ${currentAlpha})`;
        ctx.fill();
      }

      // 静止节流：缓动已收敛且本帧没有新交互时计数；达到阈值就不再排下一帧
      const settled = Math.abs(scrollDiff) < 0.05 && Math.abs(mouseDiffX) < 0.05 && Math.abs(mouseDiffY) < 0.05;
      if (!isMoving && settled) {
        idleCounter++;
      } else {
        idleCounter = 0;
      }
      isMoving = false;

      if (idleCounter >= IDLE_FRAMES_THRESHOLD) {
        isIdle = true;
        animId = null;
      } else {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (animId !== null) cancelAnimationFrame(animId);
    };
  }, [saveData]);

  if (saveData) {
    // 省流量 / 弱网模式：不加载 2.9MB 的视频，只用已经在磁盘上的静态海报
    return (
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-royal-950"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{ backgroundImage: "url(/images/scenes/hero_poster.jpg)" }}
        />
        <div className="absolute inset-0 bg-royal-950/40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-royal-950/60 via-transparent to-royal-950/60 pointer-events-none" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-royal-950"
      aria-hidden="true"
    >
      {/* 1. 核心高清视频层：安全外沿 116vw x 120vh，彻底解决底部露黑问题 */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/images/scenes/hero_poster.jpg"
        onCanPlay={() => setVideoLoaded(true)}
        onCanPlayThrough={reportVideoCanPlayThrough}
        onLoadedData={reportVideoFrameDecoded}
        onPlaying={reportVideoPlaying}
        onProgress={(e) => {
          const v = e.currentTarget;
          if (v.buffered.length > 0) {
            reportVideoProgress(v.buffered.end(v.buffered.length - 1), v.duration);
          }
        }}
        style={{
          width: "116vw",
          height: "120vh",
          minWidth: "116vw",
          minHeight: "120vh",
          maxWidth: "none",
          left: "-8vw",
          top: "-10vh",
        }}
        className={`absolute object-cover will-change-transform transition-opacity duration-700 ${
          videoLoaded ? "opacity-60" : "opacity-40"
        }`}
        src="/videos/hero-bg.mp4"
      />

      {/* 2. 动态自适应暗化与景深叠加层（纯 GPU 合成，0 帧率损耗） */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-royal-950/40 pointer-events-none transition-opacity duration-300 will-change-opacity"
      />

      {/* 3. 交互式星光与日光金砂画布层 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* 4. 全局柔和暗角与平滑纵深过渡：告别突兀黑块切割，融入皇家蔚蓝光晕 */}
      <div className="absolute inset-0 bg-gradient-to-b from-royal-950/60 via-transparent to-royal-950/60 pointer-events-none" />
    </div>
  );
}
