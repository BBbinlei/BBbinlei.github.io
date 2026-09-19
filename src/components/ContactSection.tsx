"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Check, Copy, FileText, QrCode, Sparkles } from "lucide-react";
import { LampLitText } from "@/components/pretext/LampLitText";

export function ContactSection() {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [showWechat, setShowWechat] = useState(false);
  const email = "1696568443@qq.com";
  const phone = "18182087301";

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const copyPhone = () => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <section id="contact" className="py-24 px-4 max-w-5xl mx-auto relative">
      <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-hairline-gold shadow-rim-gold text-center relative overflow-hidden">
        {/* 背景柔和高光 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-gradient-to-b from-gold-500/10 to-azure-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full royal-banner text-xs text-gold-200 font-mono mb-4 shadow-royal-banner">
            <Sparkles className="w-3.5 h-3.5 text-gold-300" />
            <span>LET&apos;S CONNECT & COLLABORATE</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold text-marble-50 font-serif mb-4">
            探讨多模态数据、模型评测或潜在机会？
          </h2>

          <LampLitText
            align="center"
            text="我始终对动画、游戏及 AIGC 多模态前沿探索保持热忱。无论是全职岗位交流、数据方案咨询或技术探讨，欢迎随时与我联系。"
            className="text-sm text-marble-300 mb-8 leading-relaxed"
          />

          {/* 交互按钮组 */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            {/* 邮箱直达与复制 */}
            <div className="inline-flex items-center rounded-full glass-panel border border-hairline-gold p-1 shadow-inner-gold">
              <a
                href={`mailto:${email}`}
                className="px-4 py-2 text-xs font-medium text-marble-100 hover:text-gold-200 flex items-center gap-2 transition-colors font-mono"
              >
                <Mail className="w-3.5 h-3.5 text-gold-300" />
                <span>{email}</span>
              </a>
              <button
                onClick={copyEmail}
                title="复制邮箱地址"
                className="p-2 rounded-full hover:bg-gold-500/20 text-marble-300 hover:text-white transition-colors"
              >
                {copiedEmail ? (
                  <Check className="w-3.5 h-3.5 text-gold-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* 电话与微信同号复制 */}
            <div className="inline-flex items-center rounded-full glass-panel border border-hairline-gold p-1 shadow-inner-gold">
              <span className="px-4 py-2 text-xs font-medium text-marble-100 flex items-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-azure-400" />
                <span>{phone}</span>
              </span>
              <button
                onClick={copyPhone}
                title="复制手机号 (微信同号)"
                className="p-2 rounded-full hover:bg-gold-500/20 text-marble-300 hover:text-white transition-colors"
              >
                {copiedPhone ? (
                  <Check className="w-3.5 h-3.5 text-gold-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* 微信展开 */}
            <button
              onClick={() => setShowWechat(!showWechat)}
              className="px-5 py-2.5 rounded-full btn-royal-azure text-xs font-medium flex items-center gap-2 transition-all"
            >
              <QrCode className="w-3.5 h-3.5 text-azure-300" />
              <span>{showWechat ? "收起联系方式" : "微信 / 企微"}</span>
            </button>

            {/* 查看完整简历 */}
            <Link
              href="/about#resume"
              className="px-6 py-2.5 rounded-full text-xs font-semibold btn-royal-gold flex items-center gap-2 shadow-rim-gold"
            >
              <FileText className="w-3.5 h-3.5 text-gold-300" />
              <span>查看 / 下载完整简历</span>
            </Link>
          </div>

          {/* 微信/联系方式浮层 */}
          {showWechat && (
            <div className="p-5 rounded-2xl bg-royal-950/95 border border-gold-400/40 max-w-sm mx-auto mb-6 text-xs text-marble-200 shadow-glass animate-in fade-in duration-200">
              <p className="font-mono text-gold-300 mb-2 font-semibold">DIRECT CONTACT</p>
              <div className="space-y-2 text-left text-[12px] font-mono">
                <div className="flex items-center justify-between p-2 rounded bg-royal-900/80 border border-gold-500/20">
                  <span className="text-marble-400">手机 / 微信:</span>
                  <span className="text-gold-200 font-bold select-all">18182087301</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-royal-900/80 border border-gold-500/20">
                  <span className="text-marble-400">QQ / 邮箱:</span>
                  <span className="text-gold-200 font-bold select-all">1696568443@qq.com</span>
                </div>
              </div>
            </div>
          )}

          <div className="text-[11px] text-marble-400 font-mono">
            通常在 24 小时内回复邮件及微信 · 期待与优秀的团队同行
          </div>
        </div>
      </div>
    </section>
  );
}
