import {
  prepareRichInline,
  layoutNextRichInlineLineRange,
  materializeRichInlineLineRange,
  walkRichInlineLineRanges,
  type PreparedRichInline,
  type RichInlineCursor,
} from "@chenglou/pretext/rich-inline";
import {
  type TypographyInfo,
  buildFontForWeight,
} from "@/lib/pretext/typography";

export interface TextRun {
  text: string;
  className?: string; // 仅允许颜色、发光等不改变字宽的类；禁止 font-size / padding / border
  weight?: number; // 500 = medium, 600 = semibold 等
}

export interface LineFragment {
  itemIndex: number;
  text: string;
  gapBefore: number;
  occupiedWidth: number;
}

export interface RenderedLine {
  fragments: LineFragment[];
  width: number;
}

export interface PositionedLine extends RenderedLine {
  x: number;
  y: number;
}

export interface PreparedRich {
  prepared: PreparedRichInline;
  typography: TypographyInfo;
  runs: TextRun[];
}

/**
 * 包装 prepareRichInline：将 TextRun 数组结合排印参数进行预准备
 */
export function prepareRuns(
  runs: TextRun[],
  typography: TypographyInfo
): PreparedRich {
  const items = runs.map((run) => ({
    text: run.text,
    font: run.weight
      ? buildFontForWeight(typography, run.weight)
      : typography.font,
    letterSpacing: typography.letterSpacingPx,
  }));

  const prepared = prepareRichInline(items);
  return {
    prepared,
    typography,
    runs,
  };
}

/**
 * 固定容器宽度下逐行排版并实例化片段
 */
export function layoutLines(
  preparedRich: PreparedRich,
  maxWidth: number
): RenderedLine[] {
  if (maxWidth <= 0) return [];

  const lines: RenderedLine[] = [];
  let cursor: RichInlineCursor | undefined = undefined;
  let safetyLimit = 0;

  while (safetyLimit++ < 500) {
    const range = layoutNextRichInlineLineRange(
      preparedRich.prepared,
      maxWidth,
      cursor
    );
    if (!range) break;

    const materialized = materializeRichInlineLineRange(
      preparedRich.prepared,
      range
    );
    lines.push({
      fragments: materialized.fragments.map((f) => ({
        itemIndex: f.itemIndex,
        text: f.text,
        gapBefore: f.gapBefore,
        occupiedWidth: f.occupiedWidth,
      })),
      width: materialized.width,
    });

    cursor = range.end;
  }

  return lines;
}

/**
 * 高速统计固定宽度下的总行数（不实例化字符串）
 */
export function countLines(
  preparedRich: PreparedRich,
  maxWidth: number
): number {
  if (maxWidth <= 0) return 0;
  let count = 0;
  walkRichInlineLineRanges(preparedRich.prepared, maxWidth, () => {
    count++;
  });
  return count;
}

/**
 * 二分查找平衡换行宽度（顺带消灭孤字）
 * 在保持总行数 N 不变的前提下，寻找行长最均匀的紧凑宽度
 */
export function findBalancedWidth(
  preparedRich: PreparedRich,
  maxWidth: number
): { width: number; lines: RenderedLine[] } {
  const N = countLines(preparedRich, maxWidth);
  if (N <= 1) {
    const lines = layoutLines(preparedRich, maxWidth);
    const actualMax = lines.length > 0 ? lines[0].width : maxWidth;
    return { width: Math.ceil(actualMax), lines };
  }

  // 二分查找范围：[maxWidth / N, maxWidth]
  let low = Math.max(30, maxWidth / (N + 1));
  let high = maxWidth;
  let iterations = 0;

  while (iterations++ < 18 && high - low >= 0.5) {
    const mid = (low + high) / 2;
    const linesCount = countLines(preparedRich, mid);
    if (linesCount <= N) {
      high = mid;
    } else {
      low = mid;
    }
  }

  const optimalLines = layoutLines(preparedRich, high);
  const maxLineW = Math.max(...optimalLines.map((l) => l.width), 1);
  return {
    width: Math.ceil(maxLineW),
    lines: optimalLines,
  };
}

/**
 * 绕障碍物动态排版算法（用于飞艇穿云方案 A）
 * 每一行可分多段（slots），先填左段再填右段
 */
export function layoutAroundObstacle(
  preparedRich: PreparedRich,
  containerWidth: number,
  lineHeight: number,
  getBlockedRanges: (
    bandTop: number,
    bandBottom: number
  ) => [number, number][],
  minSlotWidth = 40
): PositionedLine[] {
  if (containerWidth <= 0) return [];

  const lines: PositionedLine[] = [];
  let cursor: RichInlineCursor | undefined = undefined;
  let y = 0;
  let loopCount = 0;
  let done = false;

  while (!done && loopCount++ < 300) {
    const blocked = getBlockedRanges(y, y + lineHeight);

    // 从 [0, containerWidth] 中扣减被阻挡的区间，得出可用槽位
    // 1. 合并重合的 blocked 区间
    const sortedBlocked = [...blocked]
      .map(
        ([s, e]) =>
          [Math.max(0, s), Math.min(containerWidth, e)] as [number, number]
      )
      .filter(([s, e]) => e > s)
      .sort((a, b) => a[0] - b[0]);

    const mergedBlocked: [number, number][] = [];
    for (const b of sortedBlocked) {
      if (mergedBlocked.length === 0) {
        mergedBlocked.push(b);
      } else {
        const last = mergedBlocked[mergedBlocked.length - 1];
        if (b[0] <= last[1]) {
          last[1] = Math.max(last[1], b[1]);
        } else {
          mergedBlocked.push(b);
        }
      }
    }

    // 2. 生成未被遮挡的 slots
    const slots: { left: number; width: number }[] = [];
    let curX = 0;
    for (const [bStart, bEnd] of mergedBlocked) {
      if (bStart > curX) {
        const w = bStart - curX;
        if (w >= minSlotWidth) {
          slots.push({ left: curX, width: w });
        }
      }
      curX = Math.max(curX, bEnd);
    }
    if (curX < containerWidth) {
      const w = containerWidth - curX;
      if (w >= minSlotWidth) {
        slots.push({ left: curX, width: w });
      }
    }

    // 如果整行都被占满无槽位，则跳过该行
    if (slots.length === 0) {
      y += lineHeight;
      continue;
    }

    // 3. 逐个 slot 填词
    for (const slot of slots) {
      const range = layoutNextRichInlineLineRange(
        preparedRich.prepared,
        slot.width,
        cursor
      );

      if (!range) {
        done = true;
        break;
      }

      const materialized = materializeRichInlineLineRange(
        preparedRich.prepared,
        range
      );

      lines.push({
        fragments: materialized.fragments.map((f) => ({
          itemIndex: f.itemIndex,
          text: f.text,
          gapBefore: f.gapBefore,
          occupiedWidth: f.occupiedWidth,
        })),
        width: materialized.width,
        x: slot.left,
        y,
      });

      cursor = range.end;
    }

    y += lineHeight;
  }

  return lines;
}
