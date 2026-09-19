import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gold-500/15 py-12 px-4 text-center text-xs text-marble-400 font-mono">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-serif tracking-widest text-marble-200 font-bold">
            BINLEI.SITE
          </span>
          <span>·</span>
          <span>白银之城 · 皇家蔚蓝与晨光金辉</span>
        </div>

        <div className="flex items-center gap-6 text-marble-300">
          <Link href="/projects" className="hover:text-gold-300 transition-colors">
            代表项目
          </Link>
          <Link href="/experience" className="hover:text-gold-300 transition-colors">
            经历架构
          </Link>
          <Link href="/about" className="hover:text-gold-300 transition-colors">
            关于我
          </Link>
          <a href="#top" className="hover:text-marble-100 transition-colors">
            回到顶部 ↑
          </a>
        </div>

        <div>
          <span>Crafted with Next.js & @chenglou/pretext</span>
        </div>
      </div>
    </footer>
  );
}
