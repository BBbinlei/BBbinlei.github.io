/* 场景引擎：把脚本里的 widgets 编译成手绘风 SVG。所有出现时机都用旁白里的"短语"锚定。 */
(function () {
  const E = (window.E = window.E || {});
  const C = { ink: "#2b2a33", red: "#c8553d", blue: "#2f5d8a", yel: "#f6d365", paper: "#f6f0e2", dim: "#7a7358",
    hdr: "#9dbcff", slot: "#f7c948", rec: "#8fd6a8", free: "#ebe3cd", note1: "#fff1a8", note2: "#ffd0c2", note3: "#cfe8ff", note4: "#d5f1d9" };
  const COL = Object.assign({ yellow: C.note1, pink: C.note2, blue: C.note3, green: C.note4, hdr: C.hdr, slot: C.slot, rec: C.rec, free: C.free,
    used: "#cfe8ff", pin: "#9dbcff", dirty: "#ffd0c2", hit: "#d5f1d9", hot: "#fff1a8", cream: "#fffaf0", white: "#fff", gray: "#e5e0d0", none: "none",
    orange: "#ffc58a", purple: "#e3d4ff" }, C);
  const col = (c, d) => COL[c] || c || COL[d] || d;
  E.C = C; E.warn = [];

  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const J = (n) => (rnd() - .5) * 2 * n;
  const P = (a) => a.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const stroke = (a, c, sw) => `<path class="dr" pathLength="1" d="${P(a)}" stroke="${c}" stroke-width="${sw}" fill="none"/>`;
  function hatch(x, y, w, h, gap = 14) {
    let d = ""; for (let i = -h; i < w; i += gap) { const x1 = Math.max(x, x + i), y1 = y + (x1 - (x + i)), x2 = Math.min(x + w, x + i + h), y2 = y + (x2 - (x + i)); d += `M${x1} ${y1} L${x2} ${y2} `; } return d;
  }
  function rect(x, y, w, h, o = {}) {
    const st = o.stroke || C.ink, sw = o.sw || 2.6, r = o.r == null ? 2 : o.r;
    const mk = () => [[x + J(r), y + J(r)], [x + w + J(r), y + J(r)], [x + w + J(r), y + h + J(r)], [x + J(r), y + h + J(r)], [x + J(r), y + J(r)]];
    let s = "";
    if (o.fill && o.fill !== "none") s += `<path d="${P([[x, y], [x + w, y], [x + w, y + h], [x, y + h]])} Z" fill="${o.fill}"/>`;
    if (o.hatch) s += `<path d="${hatch(x, y, w, h)}" stroke="#bdb391" stroke-width="2" fill="none"/>`;
    if (o.dash) return s + `<path d="${P([[x, y], [x + w, y], [x + w, y + h], [x, y + h]])} Z" fill="none" stroke="${st}" stroke-width="${sw}" stroke-dasharray="9 8" stroke-linecap="round"/>`;
    return s + stroke(mk(), st, sw) + stroke(mk(), st, sw * .45);
  }
  function line(x1, y1, x2, y2, o = {}) {
    const c = col(o.c, C.ink), sw = o.sw || 3, mx = (x1 + x2) / 2 + J(2), my = (y1 + y2) / 2 + J(2);
    let s = stroke([[x1, y1], [mx, my], [x2, y2]], c, sw);
    if (o.arrow) { const a = Math.atan2(y2 - y1, x2 - x1), L2 = o.head || 14; for (const d of [.5, -.5]) s += stroke([[x2, y2], [x2 - L2 * Math.cos(a + d), y2 - L2 * Math.sin(a + d)]], c, sw); }
    return s;
  }
  const T = (x, y, txt, size = 22, c = C.ink, o = {}) =>
    `<text x="${x}" y="${y}" font-size="${size}" fill="${c}" text-anchor="${o.a || "middle"}" font-weight="${o.w || 700}"${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ""}>${esc(txt)}</text>`;
  const MONO = "'SF Mono',Menlo,Consolas,monospace";
  const M = (x, y, size, fill, txt, o = {}) => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="700" text-anchor="${o.a || "start"}" xml:space="preserve" style="font-family:${MONO};white-space:pre">${esc(txt)}</text>`;
  function squiggle(x1, x2, y, c = C.red) { const a = []; for (let x = x1, k = 0; x <= x2; x += 14, k++) a.push([x, y + (k % 2 ? 5 : -3) + J(1)]); return stroke(a, c, 3.5); }
  function star(x, y, r = 12, c = C.yel) {
    const a = []; for (let i = 0; i < 11; i++) { const rr = i % 2 ? r * .45 : r, t = -Math.PI / 2 + i * Math.PI / 5; a.push([x + rr * Math.cos(t), y + rr * Math.sin(t)]); }
    return `<path d="${P(a)} Z" fill="${c}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
  }
  const rvs = (at, inner, until, cls) => `<g class="rv${cls ? " " + cls : ""}" data-at="${at}"${until != null ? ` data-until="${until}"` : ""}>${inner}</g>`;
  E.prim = { rect, line, T, M, squiggle, star, rvs, P, stroke, esc, col, MONO };

  /* ---------- 锚点：短语 → 0~1 ---------- */
  function makeAnchor(say, segId) {
    const n = say.length;
    return (spec, dflt = 0) => {
      if (spec == null) return dflt;
      if (typeof spec === "number") return Math.max(0, Math.min(.99, spec));
      let ph = String(spec), d = 0; const m = ph.match(/^(.*)\|(-?[\d.]+)$/); if (m) { ph = m[1]; d = parseFloat(m[2]); }
      const i = say.indexOf(ph);
      if (i < 0) { E.warn.push(`[${segId}] 找不到短语：${ph}`); return dflt; }
      return Math.max(0, Math.min(.99, i / n + d));
    };
  }

  /* ---------- 便签 / 注释类 ---------- */
  const NCOL = { blue: C.note3, green: C.note4, yellow: C.note1, pink: C.note2, purple: "#e3d4ff", red: C.note2 };
  function noteSvg(x, y, w, h, c, lines, o = {}) {
    const rot = o.rot || 0, cx = x + w / 2, cy = y + h / 2, fs = o.fs || 21, lh = fs * 1.35;
    let s = `<g class="pop" transform="rotate(${rot} ${cx} ${cy})">`;
    s += `<path d="${P([[x + 5, y + 6], [x + w + 5, y + 6], [x + w + 5, y + h + 6], [x + 5, y + h + 6]])} Z" fill="rgba(43,42,51,.18)"/>`;
    s += rect(x, y, w, h, { fill: NCOL[c] || col(c, C.note1), sw: 2.2 });
    s += `<path d="${P([[cx - 30, y - 9], [cx + 30, y - 11], [cx + 30, y + 9], [cx - 30, y + 11]])} Z" fill="rgba(255,255,255,.65)" stroke="rgba(43,42,51,.25)" stroke-width="1"/>`;
    lines.forEach((l, i) => { const head = i === 0 && o.head !== false; s += T(x + 14, y + 14 + fs + i * lh, l, head ? fs + 3 : fs, head ? col(o.hc, C.blue) : C.ink, { a: "start" }); });
    return s + `</g>`;
  }

  /* ---------- widget 实现 ---------- */
  const W = {};
  const REG = {}; // id → 几何，供 pointer 引用
  W.text = (w) => T(w.x, w.y, w.t, w.size || 22, col(w.c, C.ink), { a: w.a, w: w.weight, rot: w.rot });
  W.mono = (w) => M(w.x, w.y, w.size || 14, col(w.c, "#7fc7a0"), w.t, { a: w.a });
  W.rect = (w) => rect(w.x, w.y, w.w, w.h, { fill: col(w.fill), stroke: col(w.stroke, C.ink), sw: w.sw, hatch: w.hatch, dash: w.dash });
  W.line = (w) => line(w.x1, w.y1, w.x2, w.y2, { c: w.c, sw: w.sw, arrow: w.arrow });
  W.squiggle = (w) => squiggle(w.x1, w.x2, w.y, col(w.c, C.red));
  W.note = (w) => noteSvg(w.x, w.y, w.w, w.h, w.color, w.lines, w);
  W.bubble = (w) => {
    const { x, y, w: bw, h } = w, tx = w.tx != null ? w.tx : x + 20, ty = w.ty != null ? w.ty : y + h + 22;
    return `<path d="M${x + 16} ${y} L${x + bw - 16} ${y} Q${x + bw} ${y} ${x + bw} ${y + 16} L${x + bw} ${y + h - 16} Q${x + bw} ${y + h} ${x + bw - 16} ${y + h} L${x + 40} ${y + h} L${tx} ${ty} L${x + 24} ${y + h} L${x + 16} ${y + h} Q${x} ${y + h} ${x} ${y + h - 16} L${x} ${y + 16} Q${x} ${y} ${x + 16} ${y}Z" fill="#fff" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>` +
      (w.lines || [w.t]).map((l, i, a) => T(x + bw / 2, y + h / 2 + 7 + (i - (a.length - 1) / 2) * (w.size || 22) * 1.25, l, w.size || 22, col(w.c, C.red))).join("");
  };
  W.brace = (w) => {
    const bx = (w.x1 + w.x2) / 2, y = w.y;
    return `<path d="M${w.x1} ${y} Q${w.x1} ${y + 12} ${bx} ${y + 12} Q${w.x2} ${y + 12} ${w.x2} ${y}" fill="none" stroke="${col(w.c, C.red)}" stroke-width="3"/>` + (w.t ? T(bx, y + 36, w.t, w.size || 18, col(w.c, C.red)) : "");
  };
  W.spot = (w) => `<circle class="spot" cx="${w.x}" cy="${w.y}" r="${w.r || 50}"/>`;
  W.hl = (w) => `<rect x="${w.x}" y="${w.y}" width="${w.w}" height="${w.h}" rx="4" fill="rgba(246,211,101,.35)" stroke="#e8b400" stroke-width="3.5"/>`;

  /* 贴纸行：自动均分 */
  E.expand = {
    notes(w) {
      const n = w.items.length, gap = w.gap == null ? 14 : w.gap, x0 = w.x0 == null ? 30 : w.x0, tw = (w.x1 == null ? 770 : w.x1) - x0, iw = (tw - gap * (n - 1)) / n;
      return w.items.map((it, i) => Object.assign({ type: "note", x: x0 + i * (iw + gap), y: w.y, w: iw, h: w.h, fs: w.fs || 20, rot: [-1.5, 1, -1, 1.5][i % 4] }, it, { at: it.at != null ? it.at : w.at }));
    }
  };

  /* 分段条 / 字节格 / 位图：cells */
  function cellBody(c, x, y, cw, h, dark, fs) {
    const f = col(c.fill, "none");
    if (dark) {
      const hl = c.hl ? "rgba(246,211,101,.3)" : (f !== "none" ? f : "none");
      let s = `<rect x="${x}" y="${y}" width="${cw}" height="${h}" fill="${hl}" stroke="#7fc7a0" stroke-width="2"/>`;
      if (c.sub) { s += M(x + cw / 2, y + h * .42, c.fs || fs, "#d6dcec", c.t, { a: "middle" }) + M(x + cw / 2, y + h * .8, (c.fs || fs) * .72, "#8b93a7", c.sub, { a: "middle" }); }
      else s += M(x + cw / 2, y + h / 2 + (c.fs || fs) * .35, c.fs || fs, "#d6dcec", c.t, { a: "middle" });
      return s;
    }
    let s = rect(x, y, cw, h, { fill: f, hatch: c.hatch, dash: c.dash, stroke: c.stroke ? col(c.stroke) : undefined, sw: c.sw });
    const tc = col(c.tc, c.hatch ? "#6b6244" : C.ink), size = c.fs || fs;
    if (c.sub) s += T(x + cw / 2, y + h * .46, c.t, size, tc) + T(x + cw / 2, y + h * .8, c.sub, size * .66, c.subc ? col(c.subc) : C.blue);
    else if (c.t != null && c.t !== "") s += T(x + cw / 2, y + h / 2 + size * .33, c.t, size, tc);
    return s;
  }
  W.cells = (w, ctx) => {
    const { x, y, w: W0, h } = w, cs = w.cells, fs = w.fs || (h >= 56 ? 20 : 17), tot = cs.reduce((a, c) => a + (c.rel || 1), 0), gap = w.gap || 0;
    let cx = x, out = ""; const geo = [];
    cs.forEach((c, i) => {
      const cw = (W0 - gap * (cs.length - 1)) * (c.rel || 1) / tot; geo.push({ x: cx, w: cw, y, h });
      const vers = c.versions || [c];
      vers.forEach((v, vi) => {
        const at = ctx.A(v.at != null ? v.at : (c.at != null ? c.at : w.at)), nxt = vers[vi + 1], un = nxt ? ctx.A(nxt.at) : (v.until != null ? ctx.A(v.until) : (c.until != null ? ctx.A(c.until) : undefined));
        out += rvs(at, cellBody(Object.assign({}, c, v), cx, y, cw, h, w.dark, fs), un, v.fly || c.fly || (w.fly ? "fly-d" : ""));
      });
      cx += cw + gap;
    });
    if (w.id) REG[w.id] = geo;
    (w.ticks || []).forEach((t) => {
      const g = geo[t.i != null ? Math.min(t.i, geo.length - 1) : 0], tx = t.i >= geo.length ? g.x + g.w : g.x;
      out += rvs(ctx.A(t.at != null ? t.at : w.at), (w.dark ? M(tx, y + h + 20, 13, "#8b93a7", t.t, { a: "middle" }) : T(tx, y + h + 22, t.t, 17, C.dim)));
    });
    return out;
  };
  /* 指向某个 cells 的格子：高亮 + 箭头 + 标签 */
  W.pointer = (w) => {
    const g = (REG[w.of] || [])[w.i]; if (!g) { E.warn.push("pointer 找不到 " + w.of + "[" + w.i + "]"); return ""; }
    const x = g.x - 2, y = g.y - 3, ww = (w.span ? REG[w.of][w.i + w.span - 1].x + REG[w.of][w.i + w.span - 1].w - g.x : g.w) + 4, h = g.h + 6, cx = x + ww / 2;
    const dir = w.dir || "down", c = w.dark ? "#ffe27a" : "#e8b400";
    let s = `<rect x="${x}" y="${y}" width="${ww}" height="${h}" rx="3" fill="rgba(246,211,101,.35)" stroke="${c}" stroke-width="3.5"/>`;
    if (dir === "down") s += line(cx, y + h + 54, cx, y + h + 26, { c, arrow: true, sw: 3.2 }) + (w.label ? (w.dark ? M(cx, y + h + 74, 13, c, w.label, { a: "middle" }) : T(cx, y + h + 76, w.label, 18, w.lc ? col(w.lc) : C.red)) : "");
    else s += line(cx, y - 50, cx, y - 6, { c: w.dark ? c : C.red, arrow: true, sw: 3.2 }) + (w.label ? (w.dark ? M(cx, y - 58, 13, c, w.label, { a: "middle" }) : T(cx, y - 58, w.label, 18, C.red)) : "");
    return s;
  };

  /* 终端：ASCII 风，逐行出现 */
  W.terminal = (w, ctx) => {
    const { x, y, w: tw, h } = w, fs = w.fs || 14.5, lh = w.lh || fs * 1.95, cw = fs * .6;
    let s = `<path d="${P([[x + 6, y + 8], [x + tw + 6, y + 8], [x + tw + 6, y + h + 8], [x + 6, y + h + 8]])} Z" fill="rgba(43,42,51,.22)"/>`;
    s += rect(x, y, tw, h, { fill: "#0f1320", sw: 2.8 }) + `<rect x="${x + 2}" y="${y + 2}" width="${tw - 4}" height="34" fill="#1d2335"/>`;
    s += `<circle cx="${x + 20}" cy="${y + 19}" r="6" fill="#ff5f57"/><circle cx="${x + 40}" cy="${y + 19}" r="6" fill="#febc2e"/><circle cx="${x + 60}" cy="${y + 19}" r="6" fill="#28c840"/>`;
    s += M(x + tw / 2 + 30, y + 24, 14, "#8b93a7", w.title || "python3", { a: "middle" });
    let out = rvs(ctx.A(w.at), s);
    const KC = { code: "#d6dcec", cm: "#7fc7a0", out: "#6ee7a0", hot: "#ffb199", dim: "#8b93a7" };
    (w.lines || []).forEach((l, i) => {
      const ly = y + 62 + (l.row != null ? l.row : i) * lh, at = ctx.A(l.at != null ? l.at : w.at);
      const p = l.p == null ? ">>>" : l.p, k = l.k || "code", size = k === "out" ? fs + 2.5 : fs;
      if (l.hl) out += rvs(ctx.A(l.hl.at != null ? l.hl.at : l.at), `<rect x="${x + 8}" y="${ly - lh * .68}" width="${tw - 16}" height="${lh * .93}" fill="rgba(246,211,101,.3)"/>`, l.hl.until != null ? ctx.A(l.hl.until) : undefined);
      out += rvs(at, (p ? M(x + 14, ly, fs, "#6c8cff", p) : "") + M(x + 14 + (p ? (p.length + 1) * cw : 0), ly, size, KC[k] || KC.code, l.t), l.until != null ? ctx.A(l.until) : undefined, "sfx-tick");
      if (l.tag) out += rvs(ctx.A(l.tagAt != null ? l.tagAt : l.at, 0) + .02, M(x + 14 + ((p ? p.length + 1 : 0) + l.t.length + 2) * cw, ly, fs - 1.5, "#7fc7a0", l.tag));
    });
    return out;
  };
  /* 变量落袋 */
  W.watch = (w, ctx) => {
    let cx = w.x, out = w.title ? rvs(ctx.A(w.at), M(w.x, w.y - 10, 13, "#7fc7a0", w.title)) : "";
    (w.items || []).forEach((it) => {
      const bw = it.w || (it.t.length * 9.6 + 26);
      out += rvs(ctx.A(it.at), `<g class="pop">${rect(cx, w.y, bw, 40, { fill: "#16301f", stroke: "#6ee7a0", sw: 2.4 })}${M(cx + bw / 2, w.y + 26, 16, "#6ee7a0", it.t, { a: "middle" })}</g>`, it.until != null ? ctx.A(it.until) : undefined);
      cx += bw + 14;
    });
    return out;
  };

  /* 网格 / 链：缓冲池帧、页表、LRU 链 */
  W.grid = (w, ctx) => {
    const cols = w.cols || (w.cells || []).length, cw = w.cw || 100, ch = w.ch || 70, gx = w.gx == null ? 14 : w.gx, gy = w.gy == null ? 14 : w.gy, ids = {};
    let out = "";
    (w.cells || []).forEach((c, i) => {
      const r = Math.floor(i / cols), k = i % cols, x = w.x + k * (cw + gx), y = w.y + r * (ch + gy); ids[i] = { x, y, w: cw, h: ch };
      const vers = c.versions || [c];
      vers.forEach((v, vi) => {
        const at = ctx.A(v.at != null ? v.at : (c.at != null ? c.at : w.at)), nxt = vers[vi + 1], un = nxt ? ctx.A(nxt.at) : (v.until != null ? ctx.A(v.until) : undefined), d = Object.assign({}, c, v);
        let s = rect(x, y, cw, ch, { fill: col(d.fill, "free"), stroke: d.stroke ? col(d.stroke) : undefined, hatch: d.hatch, dash: d.dash, sw: d.sw });
        const ls = d.l || [d.l1, d.l2, d.l3].filter((z) => z != null), fs = w.fs || 20;
        ls.forEach((t, li) => { const n = ls.length, yy = y + ch / 2 + (li - (n - 1) / 2) * fs * 1.15 + fs * .33; s += T(x + cw / 2, yy, t, li === 0 ? fs : fs * .72, li === 0 ? col(d.tc, C.ink) : (d.subc ? col(d.subc) : C.blue)); });
        if (d.badge) s += `<circle cx="${x + cw - 6}" cy="${y + 6}" r="13" fill="${col(d.bc, C.red)}" stroke="${C.ink}" stroke-width="2"/>` + T(x + cw - 6, y + 12, d.badge, 15, "#fff");
        out += rvs(at, s, un, d.cls);
      });
      if (w.arrows && i < w.cells.length - 1 && k < cols - 1) {
        const ax = x + cw, ay = y + ch / 2; out += rvs(ctx.A(c.at != null ? c.at : w.at), line(ax + 2, ay, ax + gx - 2, ay, { arrow: true, sw: 2.6, head: 10 }));
      }
    });
    if (w.id) REG[w.id] = ids;
    return out;
  };
  /* 环：Clock 时钟 */
  W.ring = (w, ctx) => {
    const n = w.cells.length, r = w.r || 120, cw = w.cw || 70, ch = w.ch || 52; let out = rvs(ctx.A(w.at), `<circle cx="${w.cx}" cy="${w.cy}" r="${r}" fill="none" stroke="#bdb391" stroke-width="3" stroke-dasharray="4 8"/>`);
    const pos = (i) => { const t = -Math.PI / 2 + i * 2 * Math.PI / n; return [w.cx + r * Math.cos(t), w.cy + r * Math.sin(t)]; };
    w.cells.forEach((c, i) => {
      const [px, py] = pos(i), vers = c.versions || [c];
      vers.forEach((v, vi) => {
        const at = ctx.A(v.at != null ? v.at : (c.at != null ? c.at : w.at)), nxt = vers[vi + 1], un = nxt ? ctx.A(nxt.at) : undefined, d = Object.assign({}, c, v);
        let s = rect(px - cw / 2, py - ch / 2, cw, ch, { fill: col(d.fill, "free"), sw: 2.2 });
        const ls = d.l || [d.l1, d.l2].filter((z) => z != null);
        ls.forEach((t, li) => { s += T(px, py + (li - (ls.length - 1) / 2) * 20 + 6, t, li === 0 ? 19 : 14, li === 0 ? C.ink : C.blue); });
        out += rvs(at, s, un);
      });
    });
    (w.hand || []).forEach((h, hi) => {
      const [px, py] = pos(h.i), dx = px - w.cx, dy = py - w.cy, L = Math.hypot(dx, dy), ex = w.cx + dx * (L - ch * .62) / L, ey = w.cy + dy * (L - ch * .62) / L, nxt = (w.hand || [])[hi + 1];
      out += rvs(ctx.A(h.at), line(w.cx, w.cy, ex, ey, { c: C.red, arrow: true, sw: 5, head: 18 }) + `<circle cx="${w.cx}" cy="${w.cy}" r="9" fill="${C.red}" stroke="${C.ink}" stroke-width="2"/>`, nxt ? ctx.A(nxt.at) : undefined);
    });
    if (w.center) out += rvs(ctx.A(w.at), T(w.cx, w.cy + 52, w.center, 18, C.dim));
    return out;
  };

  /* B+ 树：frames 每帧一棵树，按锚点淡入淡出 */
  function layoutTree(t, o) {
    const kw = o.kw || 34, gap = o.gap == null ? 12 : o.gap, nodes = [], leaves = [];
    (function walk(n, lvl, parent) {
      n._lvl = lvl; n._w = Math.max(1, n.k.length) * kw; nodes.push(n);
      if (n.c && n.c.length) n.c.forEach((c) => walk(c, lvl + 1, n)); else leaves.push(n);
    })(t, 0, null);
    let cx = 0; leaves.forEach((l) => { l._x = cx + l._w / 2; cx += l._w + gap; });
    (function pos(n) { if (n.c && n.c.length) { n.c.forEach(pos); n._x = (n.c[0]._x + n.c[n.c.length - 1]._x) / 2; } })(t);
    const total = cx - gap, maxLvl = Math.max(...nodes.map((n) => n._lvl));
    return { nodes, leaves, total, maxLvl, kw };
  }
  W.tree = (w, ctx) => {
    let out = ""; const frames = w.frames;
    frames.forEach((f, fi) => {
      const L = layoutTree(JSON.parse(JSON.stringify(f.tree)), w), sc = Math.min(1, w.w / L.total), nh = w.nh || 34, lg = w.lg || 86;
      const px = (n) => w.x + (w.w - L.total * sc) / 2 + n._x * sc, py = (n) => w.y + n._lvl * lg, nwid = (n) => n._w * sc;
      const hl = new Set(f.hl || []), warn = new Set(f.warn || []), dim = new Set(f.dim || []);
      let s = "";
      L.nodes.forEach((n) => { (n.c || []).forEach((c) => { s += line(px(n), py(n) + nh, px(c), py(c), { sw: 2.4, c: "#6b6244" }); }); });
      if (w.links !== false) L.leaves.forEach((l, i) => { const nx = L.leaves[i + 1]; if (nx) s += line(px(l) + nwid(l) / 2 + 1, py(l) + nh / 2, px(nx) - nwid(nx) / 2 - 1, py(nx) + nh / 2, { sw: 2.2, c: "#2c8a56", arrow: true, head: 9 }); });
      L.nodes.forEach((n) => {
        const leaf = !(n.c && n.c.length), base = n.fill ? col(n.fill) : (leaf ? C.rec : C.hdr), nw = nwid(n), x0 = px(n) - nw / 2, y0 = py(n);
        const fill = hl.has(n.id) ? "#ffe27a" : warn.has(n.id) ? "#ffb199" : base;
        s += `<g opacity="${dim.has(n.id) ? .35 : 1}">` + rect(x0, y0, nw, nh, { fill, sw: hl.has(n.id) ? 3.6 : 2.4, stroke: hl.has(n.id) ? "#c79a00" : C.ink });
        const kwid = nw / Math.max(1, n.k.length);
        n.k.forEach((k, ki) => { if (ki) s += `<path d="M${x0 + ki * kwid} ${y0} L${x0 + ki * kwid} ${y0 + nh}" stroke="${C.ink}" stroke-width="1.6" opacity=".5"/>`; s += T(x0 + (ki + .5) * kwid, y0 + nh / 2 + 7, k, Math.min(20, kwid * .55), C.ink); });
        if (!n.k.length) s += T(x0 + nw / 2, y0 + nh / 2 + 6, "空", 16, C.dim);
        s += `</g>`;
      });
      if (f.note) s += T(w.x + w.w / 2, w.y - 14, f.note, 20, C.red);
      const at = ctx.A(f.at != null ? f.at : w.at), nxt = frames[fi + 1];
      out += rvs(at, s, nxt ? ctx.A(nxt.at) : (f.until != null ? ctx.A(f.until) : undefined));
    });
    return out;
  };

  /* 海报部件 */
  W.card = (w) => `<g class="pop">${rect(w.x, w.y, w.w, w.h, { fill: col(w.color), sw: 3.2 })}${T(w.x + w.w / 2, w.y + w.h * .48, w.big, w.bigSize || 54, "#fff")}${T(w.x + w.w / 2, w.y + w.h * .72, w.lab, w.labSize || 21, "#fff")}${w.sub ? T(w.x + w.w / 2, w.y + w.h * .9, w.sub, 15, "rgba(255,255,255,.92)") : ""}</g>`;
  W.ribbon = (w) => `<g class="pop">${rect(34, w.y, 732, w.h || 66, { fill: C.red, sw: 3.2 })}${T(400, w.y + (w.h || 66) * .66, w.t, w.size || 34, "#fff")}</g>`;
  W.trap = (w) => `<g class="pop">${rect(w.x, w.y, w.w || 192, 74, { fill: "#fff6dc", sw: 2.8 })}${T(w.x + (w.w || 192) / 2, w.y + 34, w.l1, 22, C.red)}${T(w.x + (w.w || 192) / 2, w.y + 60, w.l2, 20, C.ink)}</g>`;
  W.tag = (w) => rect(w.x, w.y, w.w || 120, 26, { fill: col(w.fill, C.yel), sw: 2.2 }) + T(w.x + (w.w || 120) / 2, w.y + 20, w.t, 18, w.tc ? col(w.tc) : C.ink);
  W.stamp = (w) => `<g class="pop"><circle cx="${w.x}" cy="${w.y}" r="56" fill="#ffd84d" stroke="${C.ink}" stroke-width="3.5"/><circle cx="${w.x}" cy="${w.y}" r="48" fill="none" stroke="${C.ink}" stroke-width="1.8" stroke-dasharray="5 6"/>${T(w.x, w.y - 5, w.l1 || "去做 →", 24, C.ink, { rot: -8 })}${T(w.x, w.y + 22, w.l2, 20, C.red, { rot: -8 })}</g>`;
  W.panel = (w) => rect(w.x, w.y, w.w, w.h, { fill: col(w.fill, "#fff6dc"), sw: w.sw || 3 });

  /* ---------- 编译一个段落的场景 ---------- */
  E.compile = function (seg) {
    const sc = seg.scene || {}, A = makeAnchor(seg.say, seg.id), ctx = { A };
    seed = sc.seed || 7; for (const k in REG) delete REG[k];
    let s = "";
    const poster = sc.bg === "poster";
    if (poster) {
      const Y = "#ffd84d";
      s += rvs(0, `<path d="${P([[14, 12], [786, 12], [786, 628], [14, 628]])} Z" fill="#1f2a44" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/><path d="${P([[26, 24], [774, 24], [774, 616], [26, 616]])} Z" fill="none" stroke="${Y}" stroke-width="2" stroke-dasharray="4 8" stroke-linecap="round"/>` +
        [[60, 140], [100, 160], [740, 150], [700, 130], [60, 470], [740, 480]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 3 : 5}" fill="#34426a"/>`).join(""));
      s += rvs(0, `<g class="pop">${rect(34, 34, 732, 76, { fill: Y, sw: 3.2 })}${T(400, 90, sc.title, 44, C.ink)}</g>${rect(40, 28, 170, 26, { fill: C.red, sw: 2.2 })}${T(125, 47, sc.tag || "", 16, "#fff")}${star(748, 40, 11, "#ffb199")}`);
    } else if (!sc.notitle) {
      s += star(20, 92, 10) + star(770, 96, 9, "#ffb199") + squiggle(700, 770, 128, C.blue) + star(760, 610, 12) + star(30, 600, 9, "#9dd9b5");
      if (sc.title) s += rvs(0, `<circle cx="46" cy="46" r="24" fill="${C.red}" stroke="${C.ink}" stroke-width="2.5"/>${T(46, 55, sc.n || "", 28, "#fff")}${T(420, 58, sc.title, sc.titleSize || 34)}${squiggle(110, 740, 74)}`);
    }
    let list = [];
    (sc.widgets || []).forEach((w) => { if (E.expand[w.type]) list = list.concat(E.expand[w.type](w)); else list.push(w); });
    list.forEach((w) => {
      const f = W[w.type]; if (!f) { E.warn.push(`[${seg.id}] 未知部件：${w.type}`); return; }
      const inner = f(w, ctx), at = ctx.A(w.at, 0), un = w.until != null ? ctx.A(w.until) : undefined;
      const selfTimed = ["cells", "terminal", "watch", "grid", "ring", "tree"].includes(w.type);
      s += selfTimed ? inner : rvs(at, inner, un, w.cls);
    });
    const cam = (sc.cam || []).map((c) => ({ at: ctx.A(c.at), x: c.x, y: c.y, k: c.k }));
    return { svg: s, cam };
  };
})();
