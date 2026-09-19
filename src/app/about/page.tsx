import Link from "next/link";
import { ArrowLeft, Download, FileText, Sparkles, Mail, Compass, Award, ExternalLink } from "lucide-react";
import { BannerHeading } from "@/components/pretext/BannerHeading";
import { LampLitText } from "@/components/pretext/LampLitText";
import { AirshipText } from "@/components/pretext/AirshipText";

export const metadata = {
  title: "关于我与简历 | Binlei - 多模态 AI 数据与模型评测",
  description: "个人背景、设计与技术哲学、完整技能清单及 PDF 简历下载。",
};

const STORY_RUNS_1 = [
  { text: "生成式 AI 正在以前所未有的速度重构数字世界的生产方式。然而，在动画与游戏这种对" },
  {
    text: "“镜头节奏、光影层次、角色动作张力与细微物理常识”",
    className: "text-gold-200 font-medium",
    weight: 500,
  },
  { text: "有着极高苛求的领域，现有的多模态模型依然频繁遭遇理解与生成的瓶颈。" },
];

const STORY_RUNS_2 = [
  { text: "在实践中，我意识到：" },
  {
    text: "决定模型生成上限的不仅是参数规模与算力，更在于输入数据的结构纯度与反馈评测的精确度。",
    className: "text-marble-50 font-semibold",
    weight: 600,
  },
  {
    text: "如果标注者不懂镜头语言，就无法教会模型什么是“移轴微距”或“时序动作因果”；如果评测者缺乏客观标准，模型迭代就如同在迷雾中前行。",
  },
];

const STORY_RUNS_3 = [
  { text: "因此，我将自身的职业重心锚定在" },
  {
    text: "多模态数据构建、版本客观盲评",
    className: "text-gold-200 font-medium",
    weight: 500,
  },
  { text: "与" },
  {
    text: "自动化工程流水线",
    className: "text-azure-300 font-medium",
    weight: 500,
  },
  {
    text: "上。通过建立五层描述规范、编写 Python 批处理脚本驱动大模型生成，以及沉淀手部与武器穿模的 Bad Case 库，我致力于让生成式 AI 真正看懂复杂游戏与动画的视觉精髓。",
  },
];

const AIRSHIP_RUNS = [
  {
    text: "本站视觉灵感取自山巅日光辉映下的《白银之城》——巍峨的纯白大理石宫殿群、倾泻而下的苍穹飞瀑、悬挂着皇家金纹的蔚蓝旗帜与穿梭云海的飞空艇。这一宏大明澈的视觉意象，不仅是对卓越幻想艺术的致敬，更象征着我对多模态数据工程与评测的专业信仰：",
  },
  {
    text: "【如大理石雕塑般严谨精确、如天青飞瀑般连贯流畅、如皇家徽记般坚守最高交付准则】",
    className: "text-gold-200 font-medium",
    weight: 500,
  },
  {
    text: "。在理性算法与感性视觉艺术的交汇处，打造有深度、有灵魂的生成式 AI。",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-28 pb-24 px-4 max-w-4xl mx-auto">
      {/* 顶部返回 */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-marble-400 hover:text-gold-300 transition-colors font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回首页概览</span>
        </Link>
      </div>

      {/* 标题 */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full royal-banner text-xs text-gold-200 font-mono mb-3 shadow-royal-banner">
          <Sparkles className="w-3 h-3 text-gold-300" />
          <span>ABOUT & PHILOSOPHY</span>
        </div>
        <BannerHeading
          as="h1"
          text="关于我与职业哲学"
          align="left"
          className="text-3xl sm:text-5xl font-bold text-marble-50 font-serif mb-4 leading-[1.2]"
        />
        <LampLitText
          text="一名同时热爱动画与游戏艺术、深耕多模态模型数据工程与评测的探索者。"
          className="text-sm sm:text-base text-marble-300 leading-relaxed"
        />
      </div>

      {/* 个人故事与心路 */}
      <section className="glass-panel rounded-3xl p-8 sm:p-10 border border-hairline-gold mb-12 space-y-6 text-marble-200 text-sm sm:text-base leading-relaxed">
        <h2 className="text-xl font-bold text-marble-50 font-serif flex items-center gap-2">
          <Compass className="w-5 h-5 text-gold-300" />
          <span>连接视觉艺术与生成模型</span>
        </h2>

        <LampLitText runs={STORY_RUNS_1} />
        <LampLitText runs={STORY_RUNS_2} />
        <LampLitText runs={STORY_RUNS_3} />
      </section>

      {/* 视觉调性：为什么是《白银之城》 */}
      <section className="glass-panel rounded-2xl p-7 border border-hairline-gold mb-12">
        <h3 className="text-base font-bold text-marble-50 mb-4 font-serif">
          关于本站的《白银之城》视觉美学
        </h3>
        <AirshipText
          runs={AIRSHIP_RUNS}
          className="text-[15px] leading-[28px] text-marble-300"
        />
      </section>

      {/* 简历专区 (Resume Section) */}
      <section id="resume" className="glass-panel rounded-3xl p-8 sm:p-10 border border-hairline-gold shadow-rim-gold relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gold-500/15">
          <div>
            <div className="flex items-center gap-2 text-gold-300 text-xs font-mono font-bold mb-1">
              <FileText className="w-4 h-4" />
              <span>CURRICULUM VITAE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-marble-50 font-serif">
              个人完整简历
            </h2>
            <p className="text-xs text-marble-300/80 mt-1">
              包含详细项目职责、量化业绩、团队管理及技术栈展开
            </p>
          </div>

          <a
            href="/resume-binlei.pdf"
            download
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-semibold btn-royal-gold shadow-rim-gold"
          >
            <Download className="w-4 h-4 text-gold-200" />
            <span>下载 PDF 简历</span>
          </a>
        </div>

        {/* 关键信息快速摘要卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-royal-900/80 border border-gold-500/20 shadow-inner-gold">
            <div className="text-gold-300/80 font-mono mb-1">求职意向 / 目标岗位</div>
            <div className="font-semibold text-marble-100">
              AI 训练师 ／ 多模态数据标注与评测 ／ 数据质量管理
            </div>
          </div>

          <div className="p-4 rounded-xl bg-royal-900/80 border border-gold-500/20 shadow-inner-gold">
            <div className="text-gold-300/80 font-mono mb-1">专业与教育背景</div>
            <div className="font-semibold text-marble-100">
              宾蕾 (Binlei) · 计算机科学与技术 (本科)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-royal-900/80 border border-gold-500/20 shadow-inner-gold">
            <div className="text-gold-300/80 font-mono mb-1">量化交付与管理战绩</div>
            <div className="font-semibold text-marble-100">
              3200 视频 + 600 图像 · 97%+ 首检通过率 · 3x 提效 · 10 人质控
            </div>
          </div>

          <div className="p-4 rounded-xl bg-royal-900/80 border border-gold-500/20 shadow-inner-gold">
            <div className="text-gold-300/80 font-mono mb-1">直接联系渠道</div>
            <div className="font-semibold text-gold-200">
              1696568443@qq.com · 18182087301 (微信同号)
            </div>
          </div>
        </div>

        {/* 状态徽章与档案就绪提示 */}
        <div className="mt-6 p-4 rounded-xl bg-royal-950/90 border border-gold-500/20 text-[11px] text-marble-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-marble-300">
            <Sparkles className="w-3.5 h-3.5 text-gold-300 flex-shrink-0" />
            <span>真实 PDF 简历已就绪（覆盖生树科技 10 人团队质控与 MiniMax 3200 视频案例）</span>
          </span>
          <span className="font-mono text-gold-300/80">binlei.site</span>
        </div>
      </section>
    </div>
  );
}
