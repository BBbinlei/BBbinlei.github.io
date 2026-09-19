# Design System & Visual Specification: Binlei Personal Website

> 本文档定义 `binlei.site` 的视觉风格规范、设计 Token、字体排印与 Pretext 对齐规则，以及 MiniMax 动态视频背景的提示词模板。
> 视觉核心基调：**《白银之城》式维多利亚建筑美学 × 二次元色彩 × AAA 游戏界面质感 × 现代 AI 科技感**

---

## 1. 色彩体系与 Tailwind Tokens (Color Palette)

色彩灵感源自维多利亚午夜建筑天际线与冷冽高贵月光，强调**高对比度、深邃黑夜、柔和泛光与精致金属边缘**。

### 1.1 核心色板

| 色彩角色 | Token 名称 | HEX 颜色 | 用途与视觉表现 |
| :--- | :--- | :--- | :--- |
| **画布底色** | `bg-midnight-950` | `#050811` | 最底层背景，深不见底的夜空黑蓝 |
| **页面基底** | `bg-midnight-900` | `#0a0f1d` | 页面主背景容器色，深邃午夜蓝 |
| **卡片/浮层底色** | `bg-midnight-800` | `rgba(15, 23, 42, 0.65)` | 磨砂半透明玻璃卡片背景（Backdrop Blur 16px） |
| **高亮悬浮底色** | `bg-midnight-700` | `rgba(30, 41, 69, 0.75)` | 悬浮态卡片底色 |
| **月光主文字** | `text-silver-100` | `#f8fafc` | 主标题、核心数字、极高对比文字（纯净月光银） |
| **副文本/次级** | `text-silver-300` | `#cbd5e1` | 正文段落、项目描述、次级信息 |
| **弱化/标注文字** | `text-silver-500` | `#64748b` | 时间戳、版权信息、次要标签 |
| **银青高光 (Primary)**| `accent-cyan-400` | `#38bdf8` | 主交互高光、光晕辉光（Glow）、重点 Tag |
| **月光白金 (Accent)** | `accent-silver-glow`| `#e0f2fe` | 按钮边缘 Rim Light、极精细高光线 |
| **冷调微发光边框** | `border-hairline` | `rgba(148, 163, 184, 0.15)` | 1px 细微发光发亮边框，模拟精致金属与晶体倒角 |
| **悬停激活边框** | `border-glow-active` | `rgba(56, 189, 248, 0.45)` | 卡片 Hover 时的青银微发光边界 |

### 1.2 材质与光影规范 (Material & Lighting)
* **Backdrop Blur**：玻璃卡片统一采用 `backdrop-blur-md` (12px~16px)。
* **Hairline Border**：所有卡片和弹窗统一采用 `1px solid rgba(148, 163, 184, 0.15)`，拒绝粗黑边或生硬阴影。
* **Subtle Inner Glow**：关键卡片内阴影 `inset 0 1px 0 0 rgba(255, 255, 255, 0.1)`，呈现维多利亚水晶玻璃的倒角反射。
* **Radial Gradient Overlays**：背景辅以低不透明度（10%~15%）的径向发光：
  ```css
  radial-gradient(circle at 50% -20%, rgba(56, 189, 248, 0.12), transparent 70%)
  ```

---

## 2. 字体排印与 Pretext 锁死规范 (Typography & Pretext Tokens)

根据 `@chenglou/pretext` 技能规范：**文本测量必须与最终渲染的真实 CSS 字体属性 100% 像素级对齐**，彻底避免页面二次重排与卡片高度抖动。

### 2.1 字体家族选型 (Font Family)
* **西文字体 (En/Digits)**：`Cinzel` / `Syne` (用于 Hero 大标题与品牌 Logo，带来维多利亚式典雅与 AAA 游戏叙事感)；`Inter` (用于项目卡片、正文、代码标签与数据)。
* **中文字体 (Zh)**：`PingFang SC`, `"Hiragino Sans GB"`, `"Microsoft YaHei"`, sans-serif (现代无衬线、字形中正清爽)。

### 2.2 Pretext 预计算 Token（必须精确至 px）

在代码实现前，锁定以下受 Pretext 监控的关键文本区块参数：

#### Token A: 项目卡片描述 (Project Card Description)
```ts
export const PROJECT_CARD_FONT = '400 15px Inter, "PingFang SC", sans-serif';
export const PROJECT_CARD_LINE_HEIGHT = 24; // 24px
export const PROJECT_CARD_LETTER_SPACING = 0;
```
* **对应的 CSS 类**：
```css
.project-card-desc {
  font-family: Inter, "PingFang SC", sans-serif;
  font-size: 15px;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0;
  overflow-wrap: break-word;
  color: #cbd5e1;
}
```
* **Pretext 用途**：三张项目卡片在桌面端并排时，使用 `layout(prepared, cardWidth, 24).height` 预先求出最大高度，统一下方“深入查看 Case Study”CTA 按钮的垂直基准线。

#### Token B: 首页 Hero 副标与核心陈述 (Hero Statement)
```ts
export const HERO_STATEMENT_FONT = '500 18px Inter, "PingFang SC", sans-serif';
export const HERO_STATEMENT_LINE_HEIGHT = 30; // 30px
export const HERO_STATEMENT_LETTER_SPACING = 0;
```

#### Token C: 关键数据指标 (Metric Badge)
```ts
export const METRIC_VALUE_FONT = '700 28px Inter, sans-serif';
export const METRIC_LABEL_FONT = '400 13px Inter, "PingFang SC", sans-serif';
```

---

## 3. 核心 UI 组件美学规范 (Component Specifications)

### 3.1 导航栏 (Glassmorphic Floating Nav)
* **形态**：顶部悬浮胶囊栏或轻量吸顶栏，居中或两端分布。
* **背景**：`rgba(10, 15, 29, 0.7)`，高斯模糊 20px。
* **Logo**：`BINLEI`（采用大写、加大字母间距 `tracking-widest`，月光银白金属质感）。
* **Resume CTA**：月光边框晶体按钮，右侧带小箭羽或发光光斑。

### 3.2 项目卡片 (AAA Game Case Card)
* **背景与边框**：深蓝黑底 + 12px 模糊 + 1px 冷银发光细边。
* **头部**：类别 Tag（如 `[Video-to-Text]`、`[Side-by-Side Evals]`）以轻量发光药丸胶囊展示。
* **数据高光带**：卡片右上方或内部包含亮眼数字（如 `95%+`、`3x 提效`）。
* **底部对齐**：卡片内部文本高度通过 Pretext 统一，底部操作栏严格平齐。
* **交互 Hover**：鼠标悬停时边框渐变为月光银青色，微光从边缘掠过（Rim Light Sweep）。

### 3.3 主操作按钮 (Moonlit Primary Button)
```css
background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.05));
border: 1px solid rgba(56, 189, 248, 0.5);
box-shadow: 0 0 15px rgba(56, 189, 248, 0.15);
color: #ffffff;
```
悬浮时外发光强度提升，呈现如二次元游戏中“可释放技能/被选中”的微芒感。

---

## 4. MiniMax API 动态背景视频生成 Prompt 规范

用于生成全屏 Hero 背景的视频。**核心原则：建筑与环境为主，绝对不生成具体人物，避免解剖学形变；运镜极其缓慢，适于无缝循环（Seamless Loop）**。

### 方案 1: 《白银之城》月光天际线 (Hero 首屏主选)
* **场景描述**：宏伟宁静的维多利亚式幻想城市夜景，月光倾泻在尖顶钟楼与冷白大理石建筑上，远处夜空深蓝，薄雾在街道和屋檐间流淌，窗户透出微弱温暖的金色灯光，空气中有细小的微光星尘浮动。
* **English Prompt (用于 MiniMax API)**：
  > `Cinematic aerial shot of a majestic Victorian fantasy city at night, Silver City aesthetic, cold moonlight illuminating intricate Gothic and Victorian architecture, pointed towers, silver and marble rooftops, deep midnight blue atmospheric sky, gentle mist flowing between grand stone bridges, faint warm golden lights glowing from arched windows, subtle sparkling starlight particles drifting in the air. Masterpiece, high fantasy, AAA video game trailer quality, 8k resolution, serene, sacred, elegant, calm motion.`
* **Camera Movement (运镜)**：
  > `Extremely slow forward drift, subtle pan, smooth cinematic stabilization.`
* **Negative Prompt (负面提示词)**：
  > `people, characters, human faces, walking pedestrians, fast action, explosions, neon cyber lights, cars, modern asphalt roads, ruins, destroyed buildings, low quality, shaky camera, distortion, artifacts.`
* **技术参数建议**：
  * **分辨率**：`1920x1080` (16:9)
  * **帧率**：`30 fps` 或 `24 fps` (电影质感)
  * **时长**：`6~10s`，通过前后交叉淡入淡出（Crossfade Loop）实现网页端 0 卡顿循环。
  * **前端格式建议**：压缩为 WebM (带 alpha 或轻量码率) + MP4 fallback，码率控制在 2.5Mbps 以内，静态托管于 CDN。

### 方案 2: 月下拱门与深邃星云 (备选/次屏)
* **English Prompt**：
  > `Wide shot looking through a grand Victorian marble archway into a vast midnight blue sky, full moon casting soft silver glow, ethereal slow-moving clouds, distant illuminated spires of a fantasy metropolis, subtle glowing blue runes or constellations in the night sky. Majestic, peaceful, AAA visual novel background, clean and sharp details.`
* **Negative Prompt**：
  > `character, text, watermark, blurry, ruins, horror, noisy, oversaturated colors.`

---

## 5. Pretext 几何布局与防抖落地规划 (Pretext Integration Blueprint)

根据本项目的 `pretext-personal-site-layout` 技能，Pretext 将被精确应用在以下两个高价值场景：

```
[ 用户屏幕宽度改变 (ResizeObserver) ]
                 │
                 ▼ (获取 cardContentWidth)
[ Pretext layout(cachedPrepared, cardContentWidth, 24) ]
                 │
                 ├─► 获得每张卡片的 height
                 ├─► 求出 rowMaxHeight = Math.max(...heights)
                 │
                 ▼
[ 设置卡片文本容器 min-height = rowMaxHeight ]
                 │
                 ▼
[ 结果：无论中英文长短，卡片底部的 CTA 按钮永远在同一水平线上，无任何 DOM 抖动 ]
```

1. **多屏幕自适应等高（Equal-Height Description Area）**：
   三大项目的中文描述长度各异。在桌面端 3 列网格排布下，通过 Pretext 计算出的行高对齐文本容器，确保底部的“查看案例”按钮横向绝对平齐，杜绝传统 CSS `line-clamp` 截断带来的信息损失，或高度不一带来的散乱感。
2. **移动端优雅降级**：
   在手机端（单列流式排布），解除等高约束，恢复各自自然的预估高度，保持最佳阅读密度。
