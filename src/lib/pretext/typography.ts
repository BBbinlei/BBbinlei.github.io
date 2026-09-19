export interface TypographyInfo {
  font: string;
  fontSize: number;
  lineHeightPx: number;
  letterSpacingPx: number;
  key: string;
  fontStyle: string;
  fontFamily: string;
}

/**
 * 从 DOM 元素的计算样式安全读取排印参数
 * 避免手写固定常量导致的断点/响应式偏差
 */
export function readTypography(el: HTMLElement): TypographyInfo {
  const cs = window.getComputedStyle(el);
  const fontSize = parseFloat(cs.fontSize) || 16;
  const fontStyle = cs.fontStyle || "normal";
  const fontWeight = cs.fontWeight || "400";
  const fontFamily = cs.fontFamily || 'Inter, "PingFang SC", sans-serif';

  // 组装符合 CSS Font 简写语法的字符串
  const font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

  let lineHeightPx = parseFloat(cs.lineHeight);
  if (isNaN(lineHeightPx)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[pretext] line-height is 'normal' on element, fallback to round(fontSize * 1.5)`,
        el
      );
    }
    lineHeightPx = Math.round(fontSize * 1.5);
  }

  const letterSpacingPx =
    cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing) || 0;

  const key = `${font}|${lineHeightPx}|${letterSpacingPx}`;

  return {
    font,
    fontSize,
    lineHeightPx,
    letterSpacingPx,
    key,
    fontStyle,
    fontFamily,
  };
}

/**
 * 依据特定字重构建衍生 Font 字符串
 */
export function buildFontForWeight(
  typo: TypographyInfo,
  weight: number
): string {
  return `${typo.fontStyle} ${weight} ${typo.fontSize}px ${typo.fontFamily}`;
}

/**
 * 确保特定字重与字符集已完成下载，附带 3000ms 强制超时熔断
 */
export async function ensureFontsLoaded(
  fonts: string[],
  sampleText: string,
  timeoutMs: number = 3000
): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) {
    return;
  }

  const sample = sampleText.slice(0, 200) || "白银之城多模态AI数据构建模型评测";

  const loadPromises = fonts.map((f) => {
    try {
      return document.fonts.load(f, sample);
    } catch {
      return Promise.resolve([]);
    }
  });

  const fontReadyPromise = (async () => {
    try {
      await Promise.all(loadPromises);
      await document.fonts.ready;
    } catch {
      // 忽略单个字体加载异常，回退继续
    }
  })();

  const timeoutPromise = new Promise<void>((resolve) =>
    setTimeout(resolve, timeoutMs)
  );

  // 竞争熔断：超时即返回，宁可有轻微像素差，也不阻断文字展示
  await Promise.race([fontReadyPromise, timeoutPromise]);
}
