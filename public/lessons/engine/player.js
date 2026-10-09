/* 播放器：章节、暂停、回退 2 秒、倍速、字幕、音效、背景音乐、答题反馈、错题回流 */
(function () {
  const E = window.E, L = window.LESSON;
  let steps = L.steps.slice();
  const $ = (s) => document.querySelector(s);
  const art = $("#art"), cap = $("#cap"), stage = $("#stage");
  let idx = -1, token = 0, speed = 1.5, paused = false, pendingNext = null, CAM = [];
  const wrong = [];

  /* ===== 播放：优先真实音频，失败则按字数模拟 ===== */
  let cur = null;
  function stopCur() { if (!cur) return; if (cur.audio) { cur.audio.onended = cur.audio.ontimeupdate = cur.audio.onerror = null; cur.audio.pause(); } cancelAnimationFrame(cur.raf); cur = null; }
  function play(name, text, onProg, onEnd, fromEnd) {
    stopCur(); const my = ++token;
    const c = cur = { audio: null, sim: false, elapsed: 0, dur: Math.max(2, text.length * 0.26), last: 0 };
    const done = () => { if (my !== token) return; onProg && onProg(1); cur = null; onEnd && onEnd(); };
    const sim = () => {
      c.sim = true; c.last = performance.now();
      const tick = (now) => { if (my !== token) return; if (!paused) { c.elapsed += (now - c.last) / 1000 * speed; onProg && onProg(Math.min(1, c.elapsed / c.dur)); } c.last = now; if (c.elapsed >= c.dur) return done(); c.raf = requestAnimationFrame(tick); };
      c.raf = requestAnimationFrame(tick);
    };
    const a = new Audio("audio/" + name + ".m4a"); a.playbackRate = speed; c.audio = a;
    a.ontimeupdate = () => { if (a.duration) onProg && onProg(a.currentTime / a.duration); };
    a.onended = done;
    if (fromEnd) a.onloadedmetadata = () => { if (my === token) a.currentTime = Math.max(0, a.duration + fromEnd); };
    a.onerror = () => { if (my === token && !c.sim) { c.audio = null; sim(); } };
    const p = a.play(); if (p && p.catch) p.catch(() => { if (my === token && !c.sim) { c.audio = null; sim(); } });
    if (paused) a.pause();
  }
  function setPaused(v) {
    paused = v; $("#pp").textContent = v ? "▶ 继续" : "⏸ 暂停";
    if (cur && cur.audio) { v ? cur.audio.pause() : cur.audio.play().catch(() => {}); }
    if (!v && pendingNext) { const f = pendingNext; pendingNext = null; f(); }
  }

  /* ===== 音效 ===== */
  const SFX = (() => {
    let ctx = null, on = true, last = 0;
    const get = () => { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; } } if (ctx && ctx.state === "suspended") ctx.resume(); return ctx; };
    const tone = (f0, f1, dur, type, vol, delay = 0) => { const c = get(); if (!c || !on) return; const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0008, t + dur); o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .02); };
    const noise = (dur, f0, f1, vol, delay = 0) => { const c = get(); if (!c || !on) return; const t = c.currentTime + delay, n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; const src = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); src.buffer = b; fl.type = "bandpass"; fl.Q.value = 1.2; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * .3); g.gain.linearRampToValueAtTime(0, t + dur); src.connect(fl).connect(g).connect(c.destination); src.start(t); };
    const gate = (ms) => { const n = performance.now(); if (n - last < ms) return false; last = n; return true; };
    return { set(v) { on = v; }, init: get, pop() { if (gate(80)) tone(480, 820, .09, "sine", .09); }, tick() { if (gate(55)) tone(1500, 1100, .03, "square", .035); }, swish() { noise(.32, 500, 3200, .09); }, whoosh() { noise(.45, 300, 1400, .06); }, chime() { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, .32, "triangle", .1, i * .09)); }, buzz() { tone(190, 120, .26, "sawtooth", .07); tone(150, 100, .26, "square", .04, .12); }, stamp() { tone(120, 50, .18, "sine", .22); noise(.08, 1800, 900, .08); } };
  })();
  /* ===== 背景音乐 ===== */
  const BGM = (() => {
    const a = new Audio("audio/bgm.m4a"); a.loop = true; a.volume = 0; let ok = true, on = true, vol = 0, started = false;
    a.onerror = () => { ok = false; };
    setInterval(() => { if (!ok || !started) return; const talking = cur && cur.audio && !cur.audio.paused; const target = (on && !paused) ? (talking ? .2 : .35) : 0; vol += (target - vol) * .15; a.volume = Math.max(0, Math.min(1, vol)); if (!on || paused) { if (!a.paused && vol < .01) a.pause(); } else if (a.paused) a.play().catch(() => {}); }, 100);
    return { start() { started = true; a.play().catch(() => {}); }, set(v) { on = v; } };
  })();

  /* ===== 镜头 ===== */
  let camNow = "", sfxQuietUntil = 0;
  function applyCam(f) {
    let c = null; for (const q of CAM) if (f >= q.at) c = q;
    const k = c ? c.k : 1; let tx = 0, ty = 0;
    if (c && k !== 1) { tx = Math.min(0, Math.max(800 - 800 * k, 400 - k * c.x)); ty = Math.min(0, Math.max(640 - 640 * k, 320 - k * c.y)); }
    const v = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${k})`;
    if (v !== camNow) { camNow = v; const e = art.querySelector("#cam"); if (e) e.style.transform = v; if (k !== 1 && performance.now() > sfxQuietUntil) SFX.whoosh(); }
  }
  function update(f) {
    let fresh = 0, tick = false;
    art.querySelectorAll(".rv").forEach((n) => {
      const at = parseFloat(n.dataset.at), un = n.dataset.until == null ? Infinity : parseFloat(n.dataset.until);
      const was = n.classList.contains("on"), now = f >= at && f < un;
      if (now && !was && !n.querySelector(".spot")) { fresh++; if (n.classList.contains("sfx-tick")) tick = true; }
      n.classList.toggle("on", now);
    });
    if (fresh && performance.now() > sfxQuietUntil) (tick ? SFX.tick : SFX.pop)();
    applyCam(f);
  }

  /* ===== 答题 ===== */
  const quizEl = document.createElement("div"); quizEl.id = "quiz"; quizEl.hidden = true; stage.appendChild(quizEl);
  function confetti() {
    const cols = ["#ffd84d", "#c8553d", "#2f5d8a", "#7bc8a4", "#ffb199"];
    for (let i = 0; i < 40; i++) { const d = document.createElement("i"); d.className = "confetti"; d.style.left = (30 + Math.random() * 40) + "%"; d.style.background = cols[i % cols.length]; d.style.setProperty("--dx", ((Math.random() - .5) * 360) + "px"); d.style.animationDelay = (Math.random() * .25) + "s"; d.style.animationDuration = (1.3 + Math.random() * .8) + "s"; stage.appendChild(d); setTimeout(() => d.remove(), 2600); }
  }
  function showQuiz(seg, onContinue) {
    const q = seg.quiz; quizEl.hidden = false; document.body.classList.add("quizing"); quizEl.classList.remove("shake");
    quizEl.innerHTML = `<div class="tag">${seg.isReview ? "✏️ 错题回流 · 再做一次" : "✏️ 小测验 · " + (q.type === "input" ? "填一个答案" : "点一个答案")}</div><h3></h3><div class="ans"></div><div class="fb"></div><div class="nextrow"></div>`;
    quizEl.querySelector("h3").textContent = q.q;
    const ans = quizEl.querySelector(".ans"), fb = quizEl.querySelector(".fb"), nx = quizEl.querySelector(".nextrow");
    let done = false;
    const finish = (ok) => {
      if (done) return; done = true;
      if (ok) { SFX.chime(); SFX.stamp(); confetti(); const st = document.createElement("div"); st.className = "stamp"; st.textContent = "通过 ✔"; quizEl.appendChild(st); }
      else { SFX.buzz(); quizEl.classList.remove("shake"); void quizEl.offsetWidth; quizEl.classList.add("shake"); if (!seg.isReview && !wrong.includes(seg)) wrong.push(seg); }
      fb.innerHTML = `<b class="${ok ? "ok" : "no"}">${ok ? "答对啦！" : "不对哦。"}${!ok && q.type === "input" ? " 正确答案：" + q.answer + "。" : ""}</b> ${q.explain}`;
      nx.innerHTML = `<button class="btn">继续 ▶</button>`;
      nx.querySelector("button").onclick = () => { stopCur(); quizEl.hidden = true; document.body.classList.remove("quizing"); onContinue(); };
      setTimeout(() => nx.scrollIntoView({ block: "nearest", behavior: "smooth" }), 50);
      play((seg.audioId || seg.id) + "_e", q.explain_say || q.explain, null, null);
    };
    if (q.type === "input") {
      ans.innerHTML = `<div class="inrow"><input type="text" inputmode="numeric" placeholder="输入答案" autocomplete="off"><button class="btn">提交</button></div>`;
      const inp = ans.querySelector("input"), submit = () => { if (!inp.value.trim()) return; inp.disabled = true; ans.querySelector("button").disabled = true; finish(inp.value.trim().replace(/\s/g, "") === String(q.answer)); };
      ans.querySelector("button").onclick = submit; inp.onkeydown = (e) => { if (e.key === "Enter") submit(); }; setTimeout(() => inp.focus(), 60);
    } else {
      ans.className = "ans opts";
      q.options.forEach((o) => { const b = document.createElement("button"); b.className = "opt"; b.textContent = o; b.onclick = () => { const ok = o[0] === q.answer; [...ans.children].forEach((c) => { c.disabled = true; if (c.textContent[0] === q.answer) c.classList.add("right"); }); if (!ok) b.classList.add("wrong"); finish(ok); }; ans.appendChild(b); });
    }
  }

  /* ===== 章节与跳转 ===== */
  const chSel = $("#chsel");
  (L.chapters || []).forEach((c) => { const o = document.createElement("option"); o.value = c.id; o.textContent = c.name; chSel.appendChild(o); });
  function chapterStart(id) { return steps.findIndex((s) => s.ch === id && !s.isReview); }

  function go(n, fromEnd) {
    stopCur(); pendingNext = null; quizEl.hidden = true; document.body.classList.remove("quizing");
    if (n >= steps.length) return end();
    idx = n; let s = steps[idx];
    if (s.review) {
      const add = wrong.length ? wrong.map((w) => Object.assign({}, w, { isReview: true, ch: s.ch })) : (s.variant ? [Object.assign({ ch: s.ch, isReview: true }, s.variant)] : []);
      steps.splice(idx + 1, 0, ...add);
    }
    $("#section").textContent = s.section || ""; $("#bar i").style.width = Math.round(idx / steps.length * 100) + "%";
    if (s.ch) chSel.value = s.ch;
    sfxQuietUntil = performance.now() + 250; SFX.swish(); camNow = "";
    const c = E.compile(s); CAM = c.cam; if (E.warn.length) { console.warn(E.warn.join("\n")); E.warn.length = 0; }
    art.innerHTML = '<g id="cam">' + c.svg + "</g>";
    const sents = s.say.split(/(?<=[。？！；])/).filter(Boolean), total = s.say.length;
    const setCap = (f) => { let acc = 0, t = sents[sents.length - 1]; for (const x of sents) { acc += x.length; if (f * total < acc) { t = x; break; } } if (cap.textContent !== t) cap.textContent = t; };
    setCap(0);
    if (s.quiz) { update(1); showQuiz(s, () => go(idx + 1)); play(s.audioId || s.id, s.say, null, null); }
    else { update(0); play(s.id, s.say, (f) => { update(f); setCap(f); }, () => { const my = token; setTimeout(() => { if (my !== token) return; if (paused) pendingNext = () => go(idx + 1); else go(idx + 1); }, 450); }, fromEnd); }
  }
  function seek(delta) {
    sfxQuietUntil = performance.now() + 700; const d = delta * speed;
    const prevPlain = (i) => { while (i >= 0 && steps[i].quiz) i--; return i; };
    if (idx >= steps.length) { if (d < 0) { const t = prevPlain(steps.length - 1); if (t >= 0) go(t, d); } return; }
    const s = steps[idx];
    if (s.quiz) { if (d < 0) { const t = prevPlain(idx - 1); if (t >= 0) go(t, d); } return; }
    if (cur && cur.audio && cur.audio.duration) { const a = cur.audio, t = a.currentTime + d; if (t < 0) { const pv = prevPlain(idx - 1); if (pv >= 0) go(pv, t); else a.currentTime = 0; } else if (t >= a.duration) { pendingNext = null; go(idx + 1); } else a.currentTime = t; }
    else if (cur && cur.sim) { const t = cur.elapsed + d; if (t < 0) { const pv = prevPlain(idx - 1); if (pv >= 0) go(pv); else cur.elapsed = 0; } else cur.elapsed = Math.min(cur.dur, t); }
    else if (d < 0) { const t = prevPlain(idx - 1); if (t >= 0) go(t, d); }
  }
  function end() { stopCur(); SFX.chime(); $("#bar i").style.width = "100%"; cap.textContent = "本集完成！想再看一遍，点右上角“重播”。"; $("#pp").textContent = "↺ 重播"; $("#pp").dataset.replay = "1"; }

  $("#go").onclick = () => { SFX.init(); BGM.start(); $("#start").remove(); go(0); };
  $("#sfxbtn").onclick = () => { const v = !$("#sfxbtn").classList.contains("on"); $("#sfxbtn").classList.toggle("on", v); SFX.set(v); };
  $("#bgmbtn").onclick = () => { const v = !$("#bgmbtn").classList.contains("on"); $("#bgmbtn").classList.toggle("on", v); BGM.set(v); };
  $("#pp").onclick = () => { if ($("#pp").dataset.replay) { delete $("#pp").dataset.replay; steps = L.steps.slice(); wrong.length = 0; setPaused(false); go(0); return; } setPaused(!paused); };
  $("#back").onclick = () => seek(-2); $("#fwd").onclick = () => seek(2);
  $("#spd").onchange = (e) => { speed = parseFloat(e.target.value); if (cur && cur.audio) cur.audio.playbackRate = speed; };
  $("#capbtn").onclick = () => { document.body.classList.toggle("nocap"); $("#capbtn").classList.toggle("on"); };
  chSel.onchange = () => { const i = chapterStart(chSel.value); if (i >= 0) { setPaused(false); go(i); } };
  $("#bar").onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); const i = Math.min(steps.length - 1, Math.floor((e.clientX - r.left) / r.width * steps.length)); if (idx >= 0) { setPaused(false); go(Math.max(0, i)); } };
  document.addEventListener("keydown", (e) => { if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return; if (e.code === "ArrowLeft") { e.preventDefault(); seek(-2); } if (e.code === "ArrowRight") { e.preventDefault(); seek(2); } if (e.code === "Space") { e.preventDefault(); $("#pp").click(); } });
  window.__lesson = { go, seek, update, audio: () => cur && cur.audio, steps: () => steps, wrong, setPaused: (v) => setPaused(v) };
})();
