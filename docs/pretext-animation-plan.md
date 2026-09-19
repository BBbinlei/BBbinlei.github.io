# binlei.site · Pretext 动画实现方案

> **读者**：负责实现的 AI 编码代理（Gemini）。
> **目标**：用 `@chenglou/pretext` 为网站加入 4 个贴合《白银之城》视觉的文字动画。
> **本文档是唯一依据**：按顺序读完再动手。遇到文档没写到的情况，选"更保守、更静"的做法，并在交付说明里写明。

---

## 0. 先读：硬性约束（违反任何一条 = 不合格）

1. **不改文案、不改信息架构。** 只把指定位置的文字换成动画组件，文字内容逐字不变。
2. **不引入新依赖。** 只用已安装的 `@chenglou/pretext@0.0.9`、React 19、Next.js 15、Tailwind 3。不要装 framer-motion / gsap。
3. **所有动画必须可降级。** 条件分别是：`prefers-reduced-motion`、Pretext 出错、字体超时、JS 关闭。降级后文字必须完整可读，并保持原来的样式。
4. **零布局跳动（CLS = 0）。** 动画前后、字体加载前后、窗口缩放时，容器高度都不能突然变化。
5. **Pretext 的铁律**：`prepare()` 只在“文字或字体参数变化”时调用；**宽度变化只调用 layout 类函数**。动画帧里禁止调用 `prepare()`，也禁止调用 `getBoundingClientRect()` 和 `getComputedStyle()`。
6. **一屏只有一个“主角”在动。** 两个动画组件同时出现在视口时，最多一个处于播放中（见 §9 编排）。
7. **节奏要慢。** 所有入场动画 ≥ 0.8s，飞艇穿越一趟约 24s。禁止弹跳（bounce）、抖动、闪烁、霓虹色。
8. **可访问性**：动画渲染的行元素加 `aria-hidden="true"`，同时保留一份完整原文（`sr-only`）供读屏和 SEO 使用。

---

## 1. 项目事实（实现前核对）

### 1.1 技术栈
- Next.js 15 App Router，`src/app/*`；组件在 `src/components/*`；路径别名 `@/* → src/*`。
- Tailwind 3，配置在 `tailwind.config.ts`；全局样式在 `src/app/globals.css`。
- 字体：`globals.css` 顶部通过 Google Fonts `@import` 引入 `Cinzel`（500–900）与 `Inter`（300–700）。
  - `font-sans` = `Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
  - `font-serif` / `font-display` = `Cinzel, Georgia, serif`（**Cinzel 没有中文字形**，中文会回退到系统衬线字体）
- `<html lang="zh-CN">`，位于 `src/app/layout.tsx`。
- 背景：`src/components/InteractiveBackground.tsx` 里有全屏视频 `public/videos/hero-bg.mp4`（60% 不透明度），加一层暗化遮罩。遮罩不透明度随页面滚动从 0.22 升到 0.50，这就是全站现成的“越往下越暗”。

### 1.2 视觉素材的真实内容（动画意象必须来自这里）
`public/videos/hero-bg.mp4` 与 `public/images/scenes/*.jpg` 是**白昼**的白银之城：
- 白色大理石宫殿、钟楼、尖塔、拱桥、柱廊
- 倾泻的瀑布、云海、雪山
- **飞艇**（椭圆气囊 + 吊舱）在云间飘过
- 挂着**金色纹章的皇家蓝旗帜**
- 蓝白绣球花、黄铜浑天仪、港口帆船

`public/images/silver-city-hero.jpg` 是唯一的**夜景**：满月、尖塔、城市灯火。

**叙事主线：页面从上往下 = 从白昼走到午夜。** 顶部的动画用暖金日光，底部的动画用月光银蓝。

### 1.3 调色板（只用这些，全部来自 `tailwind.config.ts`）
| 用途 | Token / 值 |
|---|---|
| 皇家深蓝底 | `royal-950 #060b18`、`royal-900 #0c152e`、`royal-800 #172b5d`、`royal-700 #1e3a8a`、`royal-banner #193780` |
| 金色描边/高光 | `gold-200 #fef08a`、`gold-300 #fde047`、`gold-400 #fbbf24`、`gold-500 #f59e0b` |
| 大理石白（文字） | `marble-50 #ffffff`、`marble-100 #f8fafc`、`marble-200 #f1f5f9`、`marble-300 #e2e8f0`、`marble-400 #cbd5e1` |
| 天青（水、月光） | `azure-300 #7dd3fc`、`azure-400 #38bdf8` |
| 日光灯火（新增常量，不进 Tailwind） | `#fcd34d` → RGB(252,211,77) |
| 月光灯火（新增常量） | `#bae6fd` → RGB(186,230,253) |

### 1.4 现有 Pretext 用法与一个必须修的 Bug
- `src/components/ProjectCards.tsx`：用 `prepare + layout` 让三张卡片的描述区等高。**保留这个逻辑。**
- `src/components/PerspectiveNarrative.tsx`：**有 Bug**。测量用的是常量 `'400 15px …'`，而实际渲染是 `text-sm`（14px），段落里还插着 `InteractiveTerm` 组件，所以预测高度是错的。
  - 本次**不给这个组件加动画**（它的段落里有可交互的内联组件，逐行手动排版会破坏交互）。
  - 只做一个最小修复：删掉基于 Pretext 的 `minHeight` 预测和右下角的“Pretext 实时几何”指示卡，恢复正常 CSS 流式排版。视角切换改用 CSS `opacity` 淡入淡出（250ms）。**如果你认为保留更好，可以跳过这一项，但必须在交付说明里写明理由。**

---

## 2. Pretext 0.0.9：本方案会用到的 API

包入口有两个：`@chenglou/pretext` 和 `@chenglou/pretext/rich-inline`。以 `node_modules/@chenglou/pretext/dist/*.d.ts` 与 `README.md` 为准。

| API | 用途 | 用在哪个方案 |
|---|---|---|
| `prepareRichInline(items)` | 把“多个文字片段”（普通文字 + 金色加粗高亮）一次性准备好。每个 item 有 `{ text, font, letterSpacing? }` | 全部 |
| `walkRichInlineLineRanges(prepared, maxWidth, onLine)` | 固定宽度下逐行回调，给出每行宽度，**不生成字符串**，适合反复试宽度 | C（平衡换行）、统计行数 |
| `materializeRichInlineLineRange(prepared, range)` | 把一行变成片段数组：`fragments[{ itemIndex, text, gapBefore, occupiedWidth }]`，外加 `width` | F / D / C / A 渲染 |
| `layoutNextRichInlineLineRange(prepared, maxWidth, cursor?)` | **每一行可以用不同宽度**，返回 `null` 表示排完。下一行的 cursor = 上一行的 `range.end` | A（飞艇绕排） |

**为什么全部走 rich-inline**：目标段落里有 `<span className="text-gold-200 font-medium">` 这样的高亮片段。rich-inline 允许每个片段用不同的 font 字符串（例如 500 字重），排版结果里的每个片段都带着 `itemIndex`，可以直接映射回原来的颜色类。纯文本段落也走同一路径（只有一个片段），这样全站只有一套引擎。

**官方注意事项（必须遵守）**：
- 只支持 `white-space: normal`（默认值），不要给受控文字设置 `pre-wrap` 或 `nowrap`。
- font 字符串里不能用 `system-ui`、`-apple-system`，字体栈必须以具名字体开头。
- 行高必须是明确的 px 值。`leading-relaxed` 这类倍数没问题（computed style 会返回 px），`line-height: normal` 不行。
- 需要 `Intl.Segmenter` 和 Canvas 2D，所以**只能在客户端 effect 里调用**，SSR 阶段不能调。

---

## 3. 总体架构

### 3.1 新增文件（只新增，除 §8 列出的接入点外不改其他文件）

```
src/lib/pretext/
  typography.ts   // 从 DOM computed style 读取排印参数；等待字体加载
  rich.ts         // TextRun 类型；prepare / 逐行 layout / 平衡宽度 / 绕障碍排版
  hooks.ts        // usePretextRuns、useReducedMotion、useInViewOnce、useInView
  choreographer.ts// 全站“主角”调度（§9）

src/components/pretext/
  LineContent.tsx   // 把一行的片段渲染成 span；以及 SSR 回退的 PlainRuns
  LampLitText.tsx   // 方案 F · 暮色点灯
  CascadeText.tsx   // 方案 D · 瀑布倾泻
  BannerHeading.tsx // 方案 C · 旗帜垂落
  AirshipText.tsx   // 方案 A · 飞艇穿云
  Airship.tsx       // 飞艇 SVG 图形（纯展示）
```

以上组件文件第一行都写 `"use client"`。

### 3.2 统一的数据模型

```ts
type TextRun = {
  text: string;
  className?: string; // 只允许不改变字宽的类：颜色、text-shadow。禁止 font-size / letter-spacing / padding / border
  weight?: number;    // 改变字宽的只有字重，例如 500 = font-medium，600 = font-semibold
};
```

调用方式有两种：纯文本传 `text="..."`，含高亮的传 `runs={[...]}`。`runs` 必须是**模块级常量或经过 `useMemo`**，保证引用稳定，否则每次渲染都会重新 prepare。

### 3.3 排印参数：读 computed style，不要手写常量

**原因**：Tailwind 响应式类（`text-sm sm:text-base`）会让字号随断点变化。手写常量迟早会和 CSS 对不上，§1.4 的 Bug 就是这么来的。

`readTypography(el)` 的规则：
1. `cs = getComputedStyle(el)`
2. `font = \`${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize)}px ${cs.fontFamily}\``
3. `lineHeightPx = parseFloat(cs.lineHeight)`。如果是 NaN（`normal`），在开发环境 `console.warn`，并回退为 `round(fontSize × 1.5)`。
4. `letterSpacingPx = cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing)`
5. `key = font + "|" + letterSpacingPx`（key 变了才重新 prepare）
6. 高亮片段的 font：同样的拼法，只把字重换成 `run.weight`。

**调用时机**：组件挂载时调用一次；之后在每次 ResizeObserver 回调里调用。只有 key 变化才会触发重新 prepare。**动画帧里禁止调用。**

### 3.4 字体加载

`document.fonts.ready` **不能保证**“某个字重 + 某批中文字形子集”已经下载，Google Fonts 的中文字体是按 unicode-range 分片下载的。正确做法：
- 对每一个用到的 font 字符串调用 `document.fonts.load(font, 段落前 200 个字)`，全部完成后再 `await document.fonts.ready`。
- 用 `Promise.race` 包一个 **3000ms 超时**：超时就继续，宁可有 1px 误差，也不能让文字一直不出来。

### 3.5 `usePretextRuns(styleRef, runs, widthRef?)` 核心 Hook

职责和顺序：
1. **ResizeObserver** 观察 `widthRef ?? styleRef`，读取 **content-box 宽度**（`entry.contentRect.width`；首次读取用 `clientWidth - paddingLeft - paddingRight`）。每次回调都 `readTypography(styleRef.current)`，key 变化才更新 typography 状态。
2. typography 或 runs 变化时，在 **effect** 里执行：加载字体 → `prepareRichInline` → `setState({ prepared })`。
   - **断点切换期间保留旧的 prepared**，新的就绪后再替换，这样文字不会闪回 SSR 版本。
   - prepare 抛异常时 `setState({ failed: true })`，组件回退为普通文字。
   - 注意：不要在 `useMemo` 里调用 setState。
3. 返回 `{ prepared, width, plain, ready, failed }`。其中 `prepared.typography` 是“与这份 prepared 对应的排印参数”，行高必须从这里取。

`widthRef` 的用途：旗帜标题（C）自身宽度由文字决定，所以可用宽度必须取外层容器，否则会形成“宽度 → 排版 → 宽度”的循环。

### 3.6 每行怎么渲染（F / D / C 共用）

Pretext 已经决定了每一行有哪些字。渲染时**每行是一个独立元素**：
- `display:block; width:max-content; white-space:pre;`，高度固定为 `lineHeightPx`。
- 里面按片段输出 `<span className={runs[f.itemIndex].className} style={{ fontWeight: run.weight, marginLeft: f.gapBefore > 0 && i > 0 ? f.gapBefore : undefined }}>{f.text}</span>`。
- `gapBefore` 是片段之间被折叠的空格宽度（px），用 `margin-left` 还原。

**好处**：即使浏览器和 Canvas 的字宽差了零点几像素，行也不会被浏览器重新折行，最坏情况是某行多出 1px，布局不会崩。

### 3.7 SSR、首屏与降级：三态渲染

每个动画组件都有三种渲染状态：

| 状态 | 条件 | 渲染内容 |
|---|---|---|
| **回退态** | 服务端渲染 / Pretext 未就绪 / `failed` | 与原来完全一样的普通内联文字（`PlainRuns`），外加一个 pending 类 |
| **就绪待播态** | 就绪，但还没进入视口 | 逐行结构 + 动画初始帧（变暗 / 隐藏 / 收起） |
| **播放 / 完成态** | 已进入视口 | 播放一次；播完保持最终状态。之后宽度变化只重新排版，**不重播** |

**启动标记**：在 `src/app/layout.tsx` 的 `<head>` 里加一个内联脚本：
```
document.documentElement.classList.add('pt-js');
setTimeout(function(){ document.documentElement.classList.add('pt-timeout') }, 3500);
```
`<html>` 标签加上 `suppressHydrationWarning`。

**CSS 规则**：
- `html.pt-js:not(.pt-timeout) .pt-pending { visibility:hidden }`：用于旗帜和瀑布，因为它们的初始帧本来就是“看不见”。
- `html.pt-js:not(.pt-timeout) .pt-lamp-pending { opacity:.28 }`：用于点灯，初始帧是“熄灯变暗”，与就绪态的视觉一致，所以切换时没有闪烁。
- 在 `@media (prefers-reduced-motion: reduce)` 下，以上两条都强制恢复为可见、不透明。
- JS 关闭时没有 `pt-js`，文字正常显示；JS 卡住超过 3.5s 时，`pt-timeout` 会强制显示。

### 3.8 通用 Hook
- `useReducedMotion()`：监听 `matchMedia('(prefers-reduced-motion: reduce)')`。返回 true 时，所有组件直接渲染完成态，不播动画。飞艇停在固定位置（见 A）。
- `useInViewOnce(ref)`：IntersectionObserver，`rootMargin: "0px 0px -12% 0px"`，`threshold: 0.15`。第一次进入视口时返回 true，然后断开观察。
- `useInView(ref)`：持续跟踪是否在视口内，飞艇用它来暂停动画。

---

## 4. 方案 F · 暮色点灯 `LampLitText`

### 4.1 画面
段落先以 **28% 亮度**“熄灯”显示。进入视口后，**逐行像城里的窗户一样被点亮**：一粒柔光灯火沿着这一行文字的**真实长度**从左扫到右，扫过的地方恢复原色，这一行随后短暂泛起一圈灯光，再归于平静。下一行在上一行扫到一半时开始。

**昼夜**：灯火颜色由段落在整页中的纵向位置决定。页面顶部是日光金 `#fcd34d`，页面底部是月光银蓝 `#bae6fd`，中间按 RGB 线性插值。

### 4.2 Pretext 在这里做什么
- 把段落切成与浏览器一致的行。没有 Pretext 就只能用 DOM Range 逐字测量。
- 给出每行的**真实宽度**。扫光时长和宽度成正比：短行扫得快，长行扫得慢，节奏自然，也不会在行尾空白处白白扫一段。

### 4.3 参数
| 参数 | 值 |
|---|---|
| 扫光速度 | 0.75 px/ms（约 750px/s） |
| 单行时长 | `clamp(lineWidth / 0.75, 380ms, 1200ms)` |
| 行间隔 | 下一行开始时间 = 上一行开始时间 + 上一行时长 × 0.5 |
| 扫光缓动 | `cubic-bezier(0.45, 0.05, 0.35, 1)` |
| 熄灯亮度 | 28%（遮罩 alpha 0.28） |
| 灯火光点 | 直径 1.8em 的径向渐变圆，`mix-blend-mode: screen`，透明度 0 → 1（12%）→ 0.85（80%）→ 0 |
| 余晖 | 行扫到一半后开始：`text-shadow 0 0 14px 灯色@55%`，1600ms 内淡出到 0 |
| 灯色计算 | `f = clamp((元素 rect.top + scrollY) / document.scrollHeight, 0, 1)`；`rgb = 日光 + (月光 − 日光) × f`。只在“开始点灯”那一刻算一次 |

### 4.4 DOM 结构（就绪态）
```
<Tag class="{原 className} pt-lamp-root [is-lit] [is-static]" data-align="left|center"
     style="--pt-lamp: rgb(...); --pt-lamp-soft: rgba(...,0.55)">
  <span class="sr-only">完整原文</span>
  每行：
  <span aria-hidden class="pt-lamp-line" style="height:{lh}px; --pt-dur:{ms}; --pt-delay:{ms}">
    <span class="pt-lamp-text">…该行片段 spans…</span>
    <span class="pt-lamp-spark"></span>
  </span>
</Tag>
```

### 4.5 CSS 实现要点
- 用 `@property --pt-p { syntax:'<percentage>'; inherits:true; initial-value:-15% }` 注册一个可以做动画的百分比变量。
- `.pt-lamp-text` 使用 `mask-image: linear-gradient(90deg, #000 calc(var(--pt-p) - 10%), rgba(0,0,0,.28) calc(var(--pt-p) + 6%))`，同时写 `-webkit-` 前缀。用遮罩而不是改颜色，**是为了保留高亮片段自己的金色**。
- `.pt-lamp-spark` 的 `left: var(--pt-p)`，与遮罩前沿同步移动。
- `.is-lit` 下：行元素播放 `--pt-p: -15% → 120%`；光点播放透明度曲线；`.pt-lamp-text` 播放余晖。三者都使用 `var(--pt-delay)`，`animation-fill-mode: both`。
- `data-align="center"` 时，行元素加 `margin-inline:auto`。
- `.is-static`（减少动效）：`animation:none; --pt-p:120%`。
- 不支持 `@property` 的浏览器：动画会在结束时一次性跳到点亮状态，可以接受，不需要额外处理。

### 4.6 落点（见 §8）
各页面的导语段落、Capabilities 导语、ContactSection 段落、About 页正文段落、ProjectCards 标题旁的说明段落。

---

## 5. 方案 D · 瀑布倾泻 `CascadeText`

### 5.1 画面
首页三张项目卡片进入视口时，描述文字**逐行从上方倾泻而下**：每一行从上方 18px、模糊 6px、纵向拉长 1.25 倍、带天青色调的状态，落到原位，变清晰、恢复原色。每行落定的瞬间，这一行底部泛起一层**与该行等宽**的薄白水雾，随即消散。三张卡片依次开始，像三道并排的瀑布。

### 5.2 Pretext 在这里做什么
- 切行（每行单独做动画）。
- 给出每行宽度 → 设为水雾元素的宽度，这样雾正好覆盖文字，不会溅到空白处。
- 总高度 = 行数 × 行高，与 `ProjectCards` 现有的等高逻辑一致，动画全程不改变容器高度。

### 5.3 参数
| 参数 | 值 |
|---|---|
| 单行时长 | 900ms，缓动 `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| 行间隔 | 110ms |
| 卡片间隔 | 第 `idx` 张卡片的基础延迟 = `idx × 260ms` |
| 初始帧 | `opacity:0; transform: translateY(-18px) scaleY(1.25); filter: blur(6px); color: #7dd3fc`，`transform-origin: top center` |
| 结束帧 | `opacity:1; transform:none; filter:none; color: inherit` |
| 水雾 | 行底部绝对定位，`width = 行宽 px`，高 10px，`background: radial-gradient(ellipse at center, rgba(255,255,255,.35), transparent 70%)`，`filter: blur(4px)`；在该行落定前 20% 时开始播放：opacity 0 → .8 → 0、scaleX .6 → 1.1，700ms |

### 5.4 结构与要求
- 结构与 F 一样：sr-only 原文，加上每行一个 `aria-hidden` 行元素（内含片段 spans 和水雾 span）。
- 回退态使用 `.pt-pending`（隐藏），因为初始帧本来就是不可见的。
- 组件接收 `baseDelayMs` 参数（ProjectCards 传入 `idx × 260`）。
- **三张卡片共用一个 IntersectionObserver 触发时机**：观察卡片网格容器，而不是各自观察，保证三道瀑布的先后顺序稳定。实现方式：父组件传入 `play: boolean`。
- **与现有等高逻辑的关系**：`ProjectCards` 里描述区外层 div 的 `minHeight = equalRowHeight` 保持不变。`CascadeText` 替换的是其中的 `<p className="project-card-desc">`，并沿用这个 className，这样排印参数从它身上读取。

---

## 6. 方案 C · 旗帜垂落 `BannerHeading`

### 6.1 画面
章节标题做成素材里那种**皇家蓝底、金色描边、燕尾下摆的垂旗**。
1. 一根金色旗杆从中间向两侧展开（两端有小圆球装饰）；
2. 旗面自上而下垂落展开；
3. 标题文字**在旗面边缘经过这一行的瞬间**逐行浮现；
4. 最后，燕尾上方的金色小徽记 ✦ 淡入。

展开后，旗面以旗杆为轴**极轻微地摆动**，并有一道柔光斜向扫过丝绸表面。

### 6.2 Pretext 在这里做什么（这个方案离不开它）
- **平衡换行（顺带消灭孤字）**：在最大可用宽度下先求出行数 N；再**二分查找**“仍然是 N 行”的最小宽度，让每行长度接近，不会出现最后一行只剩一两个字。方法：用 `walkRichInlineLineRanges` 数行数，二分最多 18 次，或在区间小于 0.5px 时停止。最终文字宽度 = 该宽度下最长一行的实际宽度，向上取整。
- **在绘制前就知道旗子的精确尺寸**：`W = 文字宽 + 2 × padX`，`H = 行数 × 行高 + padTop + padBottom + tail`。旗面的 SVG 路径（含燕尾）直接用 W、H 生成，**第一次展开尺寸就是对的**，不会展到一半突然变长。
- **逐行浮现的时机**：第 i 行在旗面中的纵向位置已知，浮现延迟 = 旗杆时长 + 展开时长 × `(padTop + i × 行高 + 0.6 × 行高) / H`。

### 6.3 尺寸参数
| 参数 | 值 |
|---|---|
| padX | 28px（移动端 < 640px 时为 20px） |
| padTop / padBottom | 22px / 18px |
| tail（燕尾深度） | 20px |
| 旗杆 | 比旗面左右各多出 14px；高 4px；金色渐变 `#fde047 → #d97706`；两端各一个 8px 圆球 |
| 最大文字宽度 | `容器宽 − 2 × padX − 28` |
| 旗面填充 | `linear-gradient(180deg, #1e3a8a 0%, #111e47 100%)`（沿用 `.royal-banner`） |
| 描边 | 1px `rgba(251,191,36,.55)`，内侧再有一条 1px `rgba(254,240,138,.25)` 的细线（距边 5px） |
| 阴影 | `shadow-royal-banner` |

旗面形状用绝对定位的 `<svg width=W height=H>` 绘制。燕尾是下摆**中间向上凹进的 V 形缺口**，路径为：
`M0,0 H W V H L W/2,(H − tail) L 0,H Z`。
内描边用同样的形状，四边向内偏移 5px，另画一条。

### 6.4 动画时间线
| 阶段 | 时长 | 实现方式 |
|---|---|---|
| ① 旗杆展开 | 450ms | `scaleX 0 → 1`，`transform-origin:center`，缓动 `cubic-bezier(.22,1,.36,1)` |
| ② 旗面垂落 | 1000ms（从 ① 结束开始） | 旗面容器 `clip-path: inset(0 0 100% 0) → inset(0 0 0 0)`，缓动 `cubic-bezier(.22,1,.36,1)` |
| ③ 文字逐行 | 每行 500ms，延迟见 §6.2 | `opacity 0 → 1`，`translateY(-6px) → 0` |
| ④ 徽记 ✦ | 400ms，在 ② 结束时 | 金色 `#fde047`，`opacity 0 → 1`，`scale .6 → 1` |
| ⑤ 常驻摆动 | 7s 循环，无限 | 旗面 `rotate(-0.5deg ↔ 0.5deg)`，`transform-origin: top center`，`ease-in-out` |
| ⑥ 丝绸光泽 | 每 9s 一次 | 一条 30% 宽的斜向白色渐变（alpha .10），从左上移到右下，1.4s |

### 6.5 结构与字体
- 组件签名：`BannerHeading({ as: "h1"|"h2", text, className, align: "left"|"center" })`。
- **语义**：外层必须仍然是 `h1` / `h2` 标签（SEO 和读屏依赖它）。标签内放 sr-only 原文，加上 `aria-hidden` 的逐行 span。
- **字体**：Cinzel 没有中文字形，中文会落到系统默认的衬线字体。在 `lang=zh-CN` 下，这个系统默认字体在 Canvas 和 DOM 里**可能不同**，官方 caveat 明确警告过这一点。所以：
  - 在 `globals.css` 的 Google Fonts `@import` 里追加 `Noto+Serif+SC:wght@600;700`；
  - 旗帜标题统一使用类 `.pt-banner-title { font-family: Cinzel, "Noto Serif SC", serif; }`。只作用于旗帜标题，不改变全站 `font-serif`；
  - 因为 §3.3 是读 computed style 的，Pretext 会自动拿到这个字体栈；§3.4 的 `document.fonts.load` 会确保中文子集已经下载。
- 字号沿用原标题的 Tailwind 类（例如 `text-2xl sm:text-4xl font-bold`），但**必须补上明确行高**：h2 用 `leading-[1.25]`，h1 用 `leading-[1.2]`。
- `align="center"` 时整面旗水平居中；`align="left"` 时左对齐。旗面内部的文字**始终居中**。
- 可用宽度来自外层容器（`widthRef`），见 §3.5。

---

## 7. 方案 A · 飞艇穿云 `AirshipText`（招牌效果）

### 7.1 画面
一段文字所在的玻璃面板中，一艘**半透明的银白飞艇**（造型与视频里一致：椭圆气囊、纵向蒙皮缝线、金色腰带、尾翼、吊舱与小舷窗）从右向左缓缓飘过，身后拖着几团淡淡的云雾。**文字实时绕开飞艇重新换行**，就像云被船身推开；飞艇离开后，文字自然合拢回原样。飞艇同时有轻微的上下浮动和倾斜。

### 7.2 Pretext 在这里做什么（CSS 做不到的部分）
每一帧按飞艇当前位置计算“这一行还剩多宽”，然后用 `layoutNextRichInlineLineRange` 以不同宽度逐行排版。CSS `shape-outside` 只支持静态的 float，没法处理移动的障碍物，也没法把一行劈成左右两段。

### 7.3 落点
About 页“关于本站的《白银之城》视觉美学”这一段。这段文字本身就写着“穿梭云海的飞空艇”，语义完全对得上。原段落是 `text-xs sm:text-sm leading-relaxed`，字太小，排不出绕行的效果。**在这里改为 `text-[15px] leading-[28px]`**，这是本方案唯一的一处字号调整。原段落里的金色高亮片段用 `runs` 保留（`className:"text-gold-200", weight:500`）。

组件本身要做成通用的（接收 `text` 或 `runs` 与 `className`），方便以后放到首页。

### 7.4 障碍物几何（用解析几何，不做图像扫描）
设飞艇显示宽度为 `S`：`S = clamp(容器宽 × 0.2, 120, 170)`px，高度为 `0.56 S`。以飞艇左上角为原点：
- **气囊**：椭圆，中心 `(0.52S, 0.24S)`，半轴 `a = 0.46S`、`b = 0.17S`。
- **吊舱（含吊索）**：矩形 `x ∈ [0.36S, 0.64S]`，`y ∈ [0.41S, 0.54S]`。
- **尾翼**：矩形 `x ∈ [0.86S, 1.0S]`，`y ∈ [0.10S, 0.40S]`。

对一行所占的纵向带 `[bandTop, bandBottom)`，计算障碍区间的方法：
- **椭圆**：取带内最接近中心 cy 的 y 值 `y* = clamp(cy, bandTop, bandBottom)`。若 `|y* − cy| < b`，则半宽 `hw = a·√(1 − ((y* − cy)/b)²)`，区间为 `[cx − hw − pad, cx + hw + pad]`。
- **矩形**：若与带有纵向重叠，区间为 `[x0 − pad, x1 + pad]`。
- `pad`（文字和船身的留白）= 14px。纵向也外扩 4px，也就是判断重叠时把带上下各放宽 4px。

**障碍物用的是“不含浮动”的基准位置**。上下浮动和倾斜只作用在视觉上，否则文字会随着浮动来回跳行。

### 7.5 逐行排版算法（每帧执行，但只在飞艇移动 ≥ 1px 时执行）
```
cursor = undefined; y = 0; lines = []
循环（最多 400 行，防止死循环）：
  blocked = 所有障碍物在 [y, y + lh) 的区间
  slots   = 从 [0, 容器宽] 中挖掉 blocked 后剩下的区间，丢弃宽度 < 3 × fontSize 的碎片，按从左到右排序
  对每个 slot：
     range = layoutNextRichInlineLineRange(prepared, slot 宽, cursor)
     若 range 为 null → 结束
     lines.push({ 片段: materialize(range), x: slot.left, y })
     cursor = range.end
  y += lh
```
同一行如果被飞艇劈成左右两段，**先填左段再填右段**，阅读顺序仍然是从左到右。这是杂志排版的惯例。

### 7.6 飞行轨迹与时间
| 参数 | 值 |
|---|---|
| 方向 | 从右到左（船头朝左）。起点 `x = 容器宽 + 0.1S`，终点 `x = −1.1S` |
| 穿越时长 | 24s，缓动：线性，但前后各 8% 的路程做 ease 加减速 |
| 间歇 | 两趟之间停 5s（飞艇在容器外，不可见），然后循环 |
| 基准高度 | 气囊中心位于“无障碍排版高度”的 45% 处；再夹紧，保证整艘船都落在文字块内部 |
| 浮动 | `y` 偏移 `5px × sin(2πt / 3.2s)`；倾斜 `1.2deg × sin(2πt / 4.1s)` |
| 云雾尾迹 | 3 团白色模糊椭圆（alpha .18–.28，`blur(8px)`），跟在船尾右侧，间距 0.25S，各自以 2.4s 周期缓慢缩放、淡入淡出 |
| 暂停 | 不在视口内（`useInView`）或 `document.hidden` 时暂停 rAF；恢复时从暂停的进度继续，不跳帧 |

### 7.7 渲染方式（性能关键）
- 飞艇和文字行**都在一个 `position:relative` 容器里绝对定位**。
- 文字行使用**对象池**：预先创建 ≤ 24 个行 div（React 只渲染容器，行元素由 effect 里的命令式代码管理）。每帧只做两件事：
  - 该行内容变化时（用片段文本拼成 key 来比较），才替换它的子 span；
  - 每帧只更新 `transform: translate(x, y)`。多余的池元素设为 `display:none`。
- 飞艇只更新 `transform`，不改 left / top。
- 每帧预算：排版不超过 1ms（文字约 230 字，实际是微秒级），DOM 写入不超过 24 次。**帧循环里禁止读取任何布局属性。**

### 7.8 容器高度（防止跳动）
飞艇经过时行数会变多。在**宽度变化时**（不是每帧），用 40 个等距飞艇位置（从起点到终点）各算一次排版高度，取最大值，作为容器的**固定高度**。这样飞艇在任何位置，页面都不会被推动。

### 7.9 降级
| 条件 | 行为 |
|---|---|
| 容器内容宽 < 560px（手机） | **不绕排**。段落按普通 CSS 排版；在段落**上方**预留 64px 的“天空带”，飞艇以 0.8 倍大小在其中飞过，不和文字交互 |
| 无障碍排版的行数 < 飞艇高度对应行数 + 2 | 同上，改为天空带模式 |
| `prefers-reduced-motion` | 飞艇静止停在容器右侧（`x = 容器宽 − 1.05S`），文字**静态地**绕开它排版一次。不做浮动，也没有尾迹 |
| Pretext 出错 / 字体超时 | 普通段落，不显示飞艇 |

### 7.10 飞艇图形 `Airship.tsx`
纯 SVG，`viewBox="0 0 100 56"`，按宽度 S 缩放。
- 气囊：椭圆，填充 `linear-gradient(180deg, #f8fafc 0%, #cbd5e1 70%, #94a3b8 100%)`，不透明度 .92；
- 5 条纵向缝线：`stroke rgba(100,116,139,.35)`，宽 .4；
- 腰带：一条金色 `#fbbf24` 横带，宽 1.6，位于气囊中下部；
- 尾翼：两片三角形，填充 `#e2e8f0`，描边金色 .5；
- 吊舱：圆角矩形 `#1e3a8a`，金色描边 .5，上面 3 个 `#fde68a` 小圆舷窗，吊索 4 条细线；
- 船头朝左。整艘船加 `drop-shadow(0 6px 10px rgba(6,11,24,.45))`。

---

## 8. 接入点清单（逐个文件改动）

| # | 文件 | 位置 | 改为 | 备注 |
|---|---|---|---|---|
| 1 | `src/app/layout.tsx` | `<html>` | 加 `suppressHydrationWarning`，`<head>` 内加入 §3.7 的启动脚本 | |
| 2 | `src/app/globals.css` | 顶部 `@import` | 追加 `Noto+Serif+SC:wght@600;700` | |
| 3 | `src/app/globals.css` | 文件末尾 | 新增 `pt-*` 样式：pending、F、D、C、A | 所有 keyframes 都以 `pt-` 开头 |
| 4 | `src/components/ProjectCards.tsx` | 区块标题 h2「精选代表作与多模态实践」 | `BannerHeading as="h2" align="left"` | |
| 5 | 同上 | 右侧说明 `<p>`（含金色 span） | `LampLitText`，runs 为 3 段 | |
| 6 | 同上 | 卡片描述 `<p className="project-card-desc">` | `CascadeText`，`baseDelayMs = idx × 260`，`play` 由网格统一触发 | 等高逻辑保持不变 |
| 7 | `src/components/Capabilities.tsx` | h2「四大核心专业能力支柱」 | `BannerHeading as="h2" align="center"` | |
| 8 | 同上 | 导语 `<p>` | `LampLitText align="center"`，补 `leading-[24px]` | |
| 9 | `src/components/ContactSection.tsx` | 段落 `<p>` | `LampLitText align="center"` | 页面最底部，灯色接近月光银蓝 |
| 10 | `src/app/projects/page.tsx` | h1「精选项目与实践案例」 | `BannerHeading as="h1" align="left"` | |
| 11 | 同上 | 导语 `<p>` | `LampLitText` | |
| 12 | `src/app/experience/page.tsx` | h1 与导语 | 同 10、11 | |
| 13 | `src/app/about/page.tsx` | h1 与导语 | 同 10、11 | |
| 14 | 同上 | 「连接视觉艺术与生成模型」下的 3 个 `<p>` | 各自用 `LampLitText`，按原 span/strong 拆成 runs（`strong` → `className:"text-marble-50", weight:600`） | |
| 15 | 同上 | 「视觉美学」段落 | `AirshipText`，改为 `text-[15px] leading-[28px]` | 见 §7.3 |
| 16 | `src/components/PerspectiveNarrative.tsx` | — | §1.4 的最小修复（可选） | |

**不改的地方**：Hero（首屏已经有视频、指标卡和内联交互词，再加动画会抢戏）、Navbar、Footer、项目详情页 `[slug]`、所有含 `InteractiveTerm` 的段落。

注意：`about/page.tsx`、`projects/page.tsx`、`experience/page.tsx` 是服务端组件，并且导出了 `metadata`。**不要给整个页面加 `"use client"`**，直接在页面里引用这些客户端组件即可。

---

## 9. 编排：一屏一个主角 `choreographer.ts`

一个很小的模块级单例，管理当前谁在播放：
- 组件在“开始播放”前调用 `claim(id, priority)`，播完调用 `release(id)`。
- 如果已有别的组件在播放，新组件**排队**，等对方释放后再开始，最多等 1200ms，超时就直接开始。
- 优先级：旗帜 C = 3，瀑布 D = 2，点灯 F = 1。飞艇 A **不参与排队**，它是常驻的慢速背景运动；但它所在面板的点灯段落会在飞艇离开视口前让出。

**典型效果**：滚动到 ProjectCards 时，先展开旗帜；旗帜展开完，右侧说明段落点灯；然后三道瀑布依次倾泻。

---

## 10. 实施顺序（每个里程碑结束都要能运行、能验收）

1. **M1 引擎**：`typography.ts`、`rich.ts`、`hooks.ts`、`LineContent.tsx`、启动脚本、pending CSS。
   - 验收：写一个临时页面，把 About 的一个段落用逐行结构（不加动画）渲染出来，和原段落上下对照。在 375 / 768 / 1440 三个宽度下，**行数、每行首尾字都完全一致**。验收后删除临时页面。
2. **M2 方案 F**：接入 §8 的 #5、#8、#9、#11、#13、#14。
3. **M3 方案 D**：接入 #6。
4. **M4 方案 C**：加入字体，接入 #4、#7、#10、#12、#13。
5. **M5 方案 A**：`Airship.tsx`、`AirshipText.tsx`，接入 #15。
6. **M6 编排与收尾**：`choreographer.ts`，可选的 #16，跑完 §11 全部验收项。

---

## 11. 验收清单（交付时逐条附上结果）

**正确性**
- [ ] 三个宽度（375 / 768 / 1440）下，所有受控文字的逐行渲染与普通 CSS 渲染行数一致，没有溢出。
- [ ] 断点切换（拖动窗口跨过 640px）时，文字不闪回、不跳动，动画不重播。
- [ ] 中文标点不会出现在行首（Pretext 会处理禁则，确认没有被自己的代码破坏）。
- [ ] 高亮片段（金色、加粗）在动画中和动画后都保持原来的颜色和字重。

**降级**
- [ ] 系统开启“减少动态效果”：所有文字直接以完成态显示；飞艇静止，文字静态绕排。
- [ ] 浏览器禁用 JS：全站文字正常显示，和改动前一致。
- [ ] 在 DevTools 里把网络限速到 Slow 3G：文字最迟 3.5s 内出现。
- [ ] 手机宽度下飞艇进入“天空带”模式，不和文字交互。

**性能与稳定**
- [ ] Lighthouse CLS = 0（首页、About 页）。
- [ ] Performance 面板录制飞艇穿越过程：帧率稳定在 60fps，没有 Layout / Recalculate Style 的长任务，帧循环里没有强制同步布局。
- [ ] 飞艇离开视口后 rAF 停止（在 Performance 里确认）。
- [ ] 控制台没有 hydration 警告，也没有 `[pretext]` 警告。
- [ ] `npm run build` 通过，没有 TypeScript 错误。

**视觉**
- [ ] 所有颜色都来自 §1.3。
- [ ] 没有弹跳、没有快速闪烁，所有入场动画 ≥ 0.8s。
- [ ] 同一屏里同时只有一个入场动画在播放。
- [ ] 页面顶部段落的灯色偏暖金，页脚附近的灯色偏银蓝。

---

## 12. 常见坑（提前避开）

1. **在 useMemo 或渲染函数里调用 setState**：会导致无限渲染。prepare 放在 effect 里。
2. **把 width 放进 prepare 的依赖**：每次缩放都会重新 prepare，违反铁律。
3. **用 `getBoundingClientRect().width` 当可用宽度**：这是 border-box，要用 content-box（见 §3.5）。
4. **给行元素加 `white-space: nowrap` 却忘了 `width: max-content`**：居中对齐会失效，点灯的遮罩百分比也会按整个容器宽度计算。
5. **在 `runs` 的 className 里放 `px-1`、`text-lg` 这类改变字宽的类**：Pretext 算不到，行会溢出。
6. **每帧给 React state 赋值来驱动飞艇**：会导致每帧整棵树重新渲染。飞艇必须用 ref 加命令式 DOM 更新。
7. **忘记 `-webkit-mask-image`**：Safari 上点灯效果会消失。
8. **旗帜标题用了 `font-serif` 却没有指定中文字体**：Canvas 和 DOM 选出的中文字体可能不同，导致行宽偏差。必须使用 §6.5 的 `.pt-banner-title`。
9. **页面组件加了 `"use client"`**：会丢掉 `metadata` 导出。只有 `src/components/pretext/*` 和 `src/lib/pretext/hooks.ts` 是客户端代码。
10. **SSR 与客户端首帧不一致**：服务端和客户端首次渲染都必须是“回退态”，就绪态只能在 effect 之后出现。

---

## 13. 本期不做（留作后续扩展）
- 方案 B「拱窗开启」、方案 E「港湾倒影」、方案 G「云雾凝字」、「标注员视角」开关。
- 把飞艇放到首页：`AirshipText` 做成通用组件后，只需要在首页新增一段纯文本即可接入，但需要本人另外确认文案。
