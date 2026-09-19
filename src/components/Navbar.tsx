"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Sparkles } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/projects", label: "项目案例" },
    { href: "/experience", label: "经历与能力" },
    { href: "/about", label: "关于与简历" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between gap-6 px-6 py-2.5 rounded-full glass-panel border border-hairline-gold shadow-glass max-w-5xl w-full">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-royal-700 via-royal-800 to-gold-500/30 border border-gold-400/50 flex items-center justify-center text-xs font-serif text-gold-200 group-hover:border-gold-300 group-hover:shadow-rim-gold transition-all">
            <Sparkles className="w-3.5 h-3.5 text-gold-300 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif tracking-widest text-sm font-bold text-marble-50 group-hover:text-gold-300 transition-colors">
              BINLEI
            </span>
            <span className="text-[10px] text-azure-400 tracking-wider font-mono -mt-0.5">
              MULTIMODAL AI
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              pathname === "/"
                ? "text-gold-200 bg-royal-800/80 border border-gold-400/30 shadow-inner-gold"
                : "text-marble-300 hover:text-white hover:bg-royal-800/40"
            }`}
          >
            首页概览
          </Link>
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "text-gold-200 bg-royal-800/80 border border-gold-400/30 shadow-inner-gold"
                    : "text-marble-300 hover:text-white hover:bg-royal-800/40"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right CTA & Lang */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-[11px] text-azure-300 font-mono px-2 py-0.5 rounded border border-azure-400/20 bg-royal-900/60">
            CN
          </span>
          <Link
            href="/about#resume"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-white btn-royal-gold"
          >
            <FileText className="w-3.5 h-3.5 text-gold-300" />
            <span>PDF 简历</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
