import React from "react";
import { type TextRun, type LineFragment } from "@/lib/pretext/rich";

interface LineFragmentsProps {
  fragments: LineFragment[];
  runs: TextRun[];
}

/**
 * 渲染单行文本片段：保留片段原有的 class（颜色、光效）与字重，还原 gapBefore 空格
 */
export function LineFragments({ fragments, runs }: LineFragmentsProps) {
  return (
    <>
      {fragments.map((f, i) => {
        const run = runs[f.itemIndex] || { text: f.text };
        const hasGap = f.gapBefore > 0 && i > 0;
        return (
          <span
            key={i}
            className={run.className}
            style={{
              fontWeight: run.weight,
              marginLeft: hasGap ? `${f.gapBefore}px` : undefined,
            }}
          >
            {f.text}
          </span>
        );
      })}
    </>
  );
}

/**
 * SSR 阶段、降级阶段及 sr-only 读屏专用的普通内联文本渲染
 */
export function PlainRuns({ runs }: { runs: TextRun[] }) {
  return (
    <>
      {runs.map((run, i) => (
        <span
          key={i}
          className={run.className}
          style={{ fontWeight: run.weight }}
        >
          {run.text}
        </span>
      ))}
    </>
  );
}
