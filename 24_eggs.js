// ============================================================
// 24_eggs.js — Easter-Eggs (kleine, versteckte Überraschungen)
// ------------------------------------------------------------
// Alles hier ist rein optional und greift NICHT in Berechnungen, Rechenwege, Speichern
// oder den LaTeX-Export ein. Der Schalter «Überraschungen» in den Einstellungen schaltet
// alle Eggs ab (localStorage 'plotter_eggs_on'). Im Beamer-Modus gibt es kein Konfetti.
//
// Die 31 Eggs (Nummern wie in der Liste, die im Sammelalbum erscheint):
//   Eingabe in ein Funktionsfeld («Funktionen: Werkzeug»):
//     1 herz · 2 blume (Rosenkurve) · 3 unendlich (Lemniskate mit laufendem Punkt) · 4 schneeflocke (Koch)
//   Eingabe in irgendein Feld (alle Umgebungen):
//     5 sin²x + cos²x · 6 e^(iπ)+1 · 7 0,999… · 8 1729 · 9 fibonacci (goldene Spirale) · collatz (17)
//   Zoomen: 10 extrem hinaus · 11 extrem hinein
//   Themen: 12 parallele Geraden weit herausgezoomt (lin) · 13 D = 0 (quad) · 14 Basis 1 (exp)
//     15 f = f⁻¹ (inv) · 16 f′ = f (diff) · 17 Collatz-Karte · 18 Summe 1 … 100 (seq)
//     19 Optimum auf einer Kante (lo) · 20 (a+b)² = a² + b² eingetippt · 21 rechter Winkel → Thaleskreis (geo, sim)
//     22 Ziegenproblem nach 1000 Spielen · 23 Galtonbrett mit 1000 Kugeln (stat)
//   Tasten: 24 Konami-Code (Regenbogen) · 25 3 1 4 1 5 (π-Gedächtnis) · 31 «eggs» (Sammelalbum)
//   Logo: 26 5× klicken (Parabelschiessen) · 27 Nullstellen-Jagd (zweites Spiel im selben Fenster) · 28 lange drücken (√10)
//   Kalender: 29 Pi-Tag / Tau-Tag · 30 Geburtstage (Euler, Gauss, Noether, Lovelace)
//
// Texte stehen auf Deutsch im DOM; 23_autotranslate.js übersetzt sie.
//
// Einhängepunkte (alle optional-verkettet, d.h. ohne diese Datei läuft alles):
//   06_ui_functions.js  → EGGS.onExpr(fn, i, raw)   im 'input'-Handler der Funktionsfelder
//   08_draw.js          → EGGS.onView(v)            am Anfang von draw() (alte Zeichenfläche)
//   04_analysis.js      → fn.noSpecials             überspringt Spezialpunkte (Herz, Lemniskate)
// Beim Start werden zusätzlich draw(), difFrame() und statPaint() umhüllt (nur lesend): so kennt
// diese Datei die Graphenfenster der neuen Umgebungen und prüft nach jedem Zeichnen die Themen-Eggs.
// Gezeichnet wird auf eine eigene, durchsichtige Ebene über dem Canvas (#egg-ov), nie in die Szene.
// ============================================================
(function () {
  'use strict';

  const LS_ON = 'plotter_eggs_on', LS_DAY = 'plotter_eggs_day', LS_BEST = 'plotter_eggs_best', LS_FOUND = 'plotter_eggs_found', LS_ZBEST = 'plotter_eggs_zbest';
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const MINUS = '−';
  const isDark = () => { try { return typeof darkMode !== 'undefined' && !!darkMode; } catch (e) { return false; } };
  const isBeam = () => { try { return typeof beamMode !== 'undefined' && !!beamMode; } catch (e) { return false; } };
  const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const envCur = () => { try { return typeof ENV !== 'undefined' ? ENV.cur : 'func'; } catch (e) { return 'func'; } };

  function enabled() { return lsGet(LS_ON) !== '0'; }
  function setEnabled(on) {
    lsSet(LS_ON, on ? '1' : '0');
    const cb = document.getElementById('chk-eggs'); if (cb) cb.checked = !!on;
    if (!on) { closeGame(); closeCard(); stopRainbow(); anims.clear(); }
  }

  // ───────────────────────── Sammelalbum (welche Eggs schon gefunden wurden) ─────────────────────────
  const ALBUM = [
    ['herz', 'Herzkurve', 'Eingabe'], ['blume', 'Rosenkurve', 'Eingabe'], ['unendlich', 'Lemniskate', 'Eingabe'], ['flocke', 'Koch-Schneeflocke', 'Eingabe'],
    ['pyth', 'sin² + cos² = 1', 'Eingabe'], ['euler', 'Eulersche Identität', 'Eingabe'], ['nines', '0,999… = 1', 'Eingabe'], ['taxi', 'Taxi-Zahl 1729', 'Eingabe'],
    ['fibo', 'Goldene Spirale', 'Eingabe'], ['universe', 'Ausserhalb der Milchstrasse', 'Zoom'], ['planck', 'Planck-Länge', 'Zoom'],
    ['parallel', 'Parallelen im Unendlichen', 'Lineare Funktionen'], ['disc', 'Punktlandung', 'Quadratische Funktionen'], ['base1', 'Basis 1', 'Exponentialfunktionen'],
    ['selfinv', 'Eigenes Spiegelbild', 'Umkehrfunktionen'], ['eself', 'f′ = f', 'Differentialrechnung'], ['collatz', 'Collatz-Vermutung', 'Folgen und Reihen'],
    ['gauss', 'Der kleine Gauss', 'Folgen und Reihen'], ['edge', 'Unentschieden', 'Lineare Optimierung'], ['binom', 'Die fehlenden 2ab', 'Algebra'],
    ['thales', 'Thaleskreis', 'Geometrie'], ['monty', 'Ziegenproblem', 'Wahrscheinlichkeit'], ['galton', 'Glockenkurve', 'Wahrscheinlichkeit'],
    ['konami', 'Regenbogen', 'Tastatur'], ['pi', 'π-Gedächtnis', 'Tastatur'], ['parabel', 'Parabelschiessen', 'Logo'], ['zeros', 'Nullstellen-Jagd', 'Logo'],
    ['root10', '√10', 'Logo'], ['piday', 'Pi-Tag und Tau-Tag', 'Kalender'], ['bday', 'Geburtstag', 'Kalender'], ['album', 'Sammelalbum', 'Tastatur']
  ];
  function foundSet() { try { return new Set(JSON.parse(lsGet(LS_FOUND) || '[]')); } catch (e) { return new Set(); } }
  function markFound(id) { const s = foundSet(); if (s.has(id)) return; s.add(id); lsSet(LS_FOUND, JSON.stringify([...s])); }

  // ───────────────────────── Styles ─────────────────────────
  const css = document.createElement('style');
  css.textContent = `
#egg-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,16px);max-width:min(600px,calc(100vw - 32px));
  background:var(--bg-sidebar,#fff);color:var(--text,#1f2937);border:1px solid var(--border,#d6dae1);border-radius:12px;
  box-shadow:0 8px 28px rgba(20,28,50,.22);padding:10px 16px;font-size:13.5px;line-height:1.45;z-index:10050;
  opacity:0;pointer-events:none;transition:opacity .25s ease,transform .25s ease;text-align:center;}
#egg-toast.show{opacity:1;transform:translate(-50%,0);}
body.beamer #egg-toast,body.beam #egg-toast{font-size:20px;}
#egg-confetti{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:10040;}
#egg-ov{position:absolute;left:0;top:0;pointer-events:none;z-index:6;}
.egg-ov{position:fixed;inset:0;background:rgba(15,20,35,.5);z-index:10030;display:none;align-items:center;justify-content:center;padding:12px;}
.egg-ov.open{display:flex;}
.egg-card{background:var(--bg-sidebar,#fff);color:var(--text,#1f2937);border:1px solid var(--border,#d6dae1);border-radius:16px;
  box-shadow:0 18px 60px rgba(0,0,0,.35);width:min(640px,100%);max-height:calc(100vh - 24px);overflow:auto;padding:14px 16px 14px;}
.egg-head{display:flex;align-items:center;gap:10px;margin-bottom:2px;flex-wrap:wrap;}
.egg-head .egg-ttl{font-size:16px;font-weight:700;}
.egg-head .egg-lvl{margin-left:auto;font-size:12px;color:var(--text-muted,#6b7280);}
.egg-head .egg-x{border:0;background:transparent;color:var(--text-muted,#6b7280);font-size:16px;cursor:pointer;padding:2px 6px;border-radius:6px;}
.egg-head .egg-x:hover{background:rgba(127,127,127,.15);}
.egg-tabs{display:flex;gap:4px;}
.egg-tabs button{border:1px solid var(--border,#d6dae1);background:var(--bg-input,#fff);color:var(--text,#1f2937);padding:4px 10px;border-radius:8px;cursor:pointer;font-size:13px;}
.egg-tabs button.on{background:#378ADD;border-color:#378ADD;color:#fff;}
.egg-sub{font-size:12.5px;color:var(--text-muted,#6b7280);margin:4px 0 8px;}
.egg-txt{font-size:13.5px;line-height:1.55;margin:6px 0;}
.egg-txt ol{margin:6px 0 6px 20px;padding:0;} .egg-txt li{margin:3px 0;}
.egg-cv{width:100%;aspect-ratio:4/3;display:block;border-radius:10px;border:1px solid var(--border,#d6dae1);touch-action:none;}
.egg-cv.wide{aspect-ratio:16/9;}
.egg-eq{margin:8px 0 4px;font-family:'KaTeX_Main','Cambria Math',Georgia,serif;font-size:17px;text-align:center;min-height:24px;}
.egg-sl{display:grid;grid-template-columns:22px 1fr 54px;gap:6px 10px;align-items:center;margin:4px 0 8px;font-size:13px;}
.egg-sl input[type=range]{width:100%;}
.egg-sl .egg-v{text-align:right;font-variant-numeric:tabular-nums;}
.egg-foot{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px;}
.egg-foot .egg-msg{flex:1;min-width:160px;font-size:13px;}
.egg-foot button,.egg-row button{border:1px solid var(--border,#d6dae1);background:var(--bg-input,#fff);color:var(--text,#1f2937);padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12.5px;}
.egg-foot button.primary{background:#378ADD;border-color:#378ADD;color:#fff;}
.egg-foot button:disabled{opacity:.45;cursor:default;}
.egg-row{display:flex;align-items:center;gap:8px;margin:6px 0;font-size:13px;flex-wrap:wrap;}
.egg-row input[type=number]{width:90px;padding:4px 6px;border:1px solid var(--border,#d6dae1);border-radius:6px;background:var(--bg-input,#fff);color:var(--text,#1f2937);}
.egg-alb{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin-top:8px;}
.egg-alb>div{border:1px solid var(--border,#d6dae1);border-radius:9px;padding:6px 8px;font-size:12.5px;line-height:1.3;}
.egg-alb>div.got{background:rgba(55,138,221,.10);border-color:rgba(55,138,221,.45);}
.egg-alb .egg-cat{color:var(--text-muted,#6b7280);font-size:11px;}
.egg-bubble{position:fixed;z-index:10060;background:var(--bg-sidebar,#fff);color:var(--text,#1f2937);border:1px solid var(--border,#d6dae1);
  border-radius:10px;box-shadow:0 8px 24px rgba(20,28,50,.22);padding:6px 12px;font:600 15px/1.3 'KaTeX_Main','Cambria Math',Georgia,serif;
  font-variant-numeric:tabular-nums;pointer-events:none;opacity:0;transition:opacity .3s ease;white-space:nowrap;}
.egg-bubble.show{opacity:1;}
@keyframes eggHue{from{filter:hue-rotate(0deg) saturate(1.6);}to{filter:hue-rotate(360deg) saturate(1.6);}}
body.egg-rainbow #canvas{animation:eggHue 6s linear infinite;}
`;
  document.head.appendChild(css);

  // ───────────────────────── Toast ─────────────────────────
  let toastEl = null, toastTimer = null;
  function toast(text, ms) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.id = 'egg-toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = text;
    // Zwei Frames warten, damit die Übersetzungs-Engine (MutationObserver) den Text vor dem Einblenden erwischt
    requestAnimationFrame(() => requestAnimationFrame(() => toastEl.classList.add('show')));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms || 4800);
    toastEl._egg = curEgg;
  }
  let curEgg = null;
  function toastOff(id) { if (toastEl && toastEl.classList.contains('show') && (!id || toastEl._egg === id)) toastEl.classList.remove('show'); }

  // ───────────────────────── Konfetti und Ziffernregen ─────────────────────────
  let confCv = null, confRaf = 0;
  function fxCanvas() {
    if (!confCv) { confCv = document.createElement('canvas'); confCv.id = 'egg-confetti'; document.body.appendChild(confCv); }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    confCv.width = innerWidth * dpr; confCv.height = innerHeight * dpr;
    return { cx: confCv.getContext('2d'), W: confCv.width, H: confCv.height, dpr };
  }
  function confetti(n) {
    if (reducedMotion() || isBeam()) return;
    const { cx, W, H, dpr } = fxCanvas();
    const cols = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    const P = [];
    for (let i = 0; i < (n || 140); i++) P.push({
      x: W * (0.2 + 0.6 * Math.random()), y: H * 0.35 + (Math.random() - .5) * 40 * dpr,
      vx: (Math.random() - .5) * 14 * dpr, vy: (-6 - Math.random() * 11) * dpr,
      s: (4 + Math.random() * 6) * dpr, r: Math.random() * 6.28, vr: (Math.random() - .5) * .4, c: cols[i % cols.length]
    });
    cancelAnimationFrame(confRaf);
    const t0 = performance.now();
    (function step(now) {
      const dt = now - t0;
      cx.clearRect(0, 0, W, H);
      P.forEach(p => {
        p.vy += 0.38 * dpr; p.vx *= 0.995; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c;
        cx.globalAlpha = Math.max(0, 1 - dt / 3200);
        cx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.6); cx.restore();
      });
      if (dt < 3300) confRaf = requestAnimationFrame(step); else cx.clearRect(0, 0, W, H);
    })(t0);
  }
  const PI_DIGITS = '31415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491';
  function digitRain(digits, ms) {
    if (reducedMotion() || isBeam()) return;
    const { cx, W, H, dpr } = fxCanvas();
    const fs = 18 * dpr, cols = Math.ceil(W / (fs * 1.1)), T = ms || 3200;
    const drops = []; for (let i = 0; i < cols; i++) drops.push({ y: -Math.random() * H * 0.8, v: (2.5 + Math.random() * 3.5) * dpr, k: Math.floor(Math.random() * 40) });
    cancelAnimationFrame(confRaf);
    const t0 = performance.now(), col = isDark() ? '96,165,250' : '37,99,235';
    (function step(now) {
      const dt = now - t0, fade = Math.max(0, Math.min(1, (T - dt) / 700));
      cx.clearRect(0, 0, W, H); cx.font = '600 ' + fs + 'px "KaTeX_Main",Georgia,serif'; cx.textAlign = 'center';
      drops.forEach((d, i) => {
        d.y += d.v;
        for (let j = 0; j < 8; j++) {
          const y = d.y - j * fs * 1.15; if (y < -fs || y > H + fs) continue;
          cx.fillStyle = 'rgba(' + col + ',' + (fade * (j === 0 ? 0.9 : 0.55 * (1 - j / 8))) + ')';
          cx.fillText(digits[(d.k + i * 7 + j) % digits.length], (i + 0.5) * fs * 1.1, y);
        }
      });
      if (dt < T) confRaf = requestAnimationFrame(step); else cx.clearRect(0, 0, W, H);
    })(t0);
  }

  // ───────────────────────── Ebene über dem Canvas (#egg-ov) ─────────────────────────
  // anims: Objekte mit draw(cx, W, H, now) → false = fertig. Koordinaten in CSS-Pixeln des Canvas.
  const anims = new Set();
  let ovCv = null, ovRaf = 0;
  function ovSync() {
    const cv = document.getElementById('canvas'), wrap = document.getElementById('canvas-wrap');
    if (!cv || !wrap) return null;
    if (!ovCv) { ovCv = document.createElement('canvas'); ovCv.id = 'egg-ov'; ovCv.setAttribute('aria-hidden', 'true'); wrap.appendChild(ovCv); }
    const dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    ovCv.style.left = cv.offsetLeft + 'px'; ovCv.style.top = cv.offsetTop + 'px'; ovCv.style.width = W + 'px'; ovCv.style.height = H + 'px';
    const tw = Math.round(W * dpr), th = Math.round(H * dpr);
    if (ovCv.width !== tw || ovCv.height !== th) { ovCv.width = tw; ovCv.height = th; }
    const cx = ovCv.getContext('2d'); cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { cx, W, H };
  }
  function ovAdd(a) { if (!a) return; anims.add(a); if (!ovRaf) ovRaf = requestAnimationFrame(ovLoop); }
  function ovLoop(now) {
    ovRaf = 0;
    const o = ovSync(); if (!o) return;
    o.cx.clearRect(0, 0, o.W, o.H);
    anims.forEach(a => { let keep = false; try { o.cx.save(); keep = a.draw(o.cx, o.W, o.H, now) !== false; o.cx.restore(); } catch (e) { keep = false; } if (!keep) anims.delete(a); });
    if (anims.size && enabled()) ovRaf = requestAnimationFrame(ovLoop); else { anims.clear(); o.cx.clearRect(0, 0, o.W, o.H); }
  }
  const fadeIn = (t, a) => Math.max(0, Math.min(1, t / a));

  // Graphenfenster der neuen Umgebungen: difFrame() legt die Abbildung an der Szene ab, statPaint() merkt sich die gemalte Szene
  let lastMaps = [], lastMapsEnv = '';
  function mainMap() {
    if (lastMapsEnv !== envCur() || !lastMaps.length) return null;
    let best = null, ba = 0;
    lastMaps.forEach(m => { const a = (m.R - m.L) * (m.B - m.T); if (a > ba) { ba = a; best = m; } });
    return best;
  }
  // Mathe → Pixel in der aktuellen Umgebung (alte Zeichenfläche: toCanvas; neue: Hauptfenster)
  function mapper() {
    const e = envCur();
    if (e === 'func' || e === 'geo') {
      if (typeof toCanvas !== 'function') return null;
      return { X: x => toCanvas(x, 0).cx, Y: y => toCanvas(0, y).cy, s: 1 / Math.max(1e-12, Math.abs(toCanvas(1, 0).cx - toCanvas(0, 0).cx)), clip: null };
    }
    const m = mainMap(); if (!m) return null;
    return { X: m.X, Y: m.Y, s: (m.win.x1 - m.win.x0) / Math.max(1, m.R - m.L), clip: [m.L, m.T, m.R - m.L, m.B - m.T] };
  }
  function clipTo(cx, M) { if (M && M.clip) { cx.beginPath(); cx.rect(M.clip[0], M.clip[1], M.clip[2], M.clip[3]); cx.clip(); } }

  // ───────────────────────── Karte (kleines Fenster für Erklärungen) ─────────────────────────
  let cardOv = null;
  function openCard(title, build) {
    if (!cardOv) {
      cardOv = document.createElement('div'); cardOv.className = 'egg-ov'; cardOv.id = 'egg-card';
      cardOv.addEventListener('mousedown', e => { if (e.target === cardOv) closeCard(); });
      document.body.appendChild(cardOv);
    }
    closeGame();
    cardOv.innerHTML = '<div class="egg-card" role="dialog" aria-modal="true"><div class="egg-head"><div class="egg-ttl"></div><div class="egg-lvl"></div><button type="button" class="egg-x" aria-label="Schliessen">✕</button></div><div class="egg-body"></div></div>';
    cardOv.querySelector('.egg-ttl').textContent = title;
    cardOv.querySelector('.egg-x').onclick = closeCard;
    cardOv.classList.add('open'); cardOv._env = envCur(); cardOv._stop = false; cardOv._egg = null;
    try { build(cardOv.querySelector('.egg-body'), cardOv.querySelector('.egg-lvl')); } catch (e) {}
  }
  // Karte schliesst sich, wenn man das Thema wechselt oder Esc drückt (sonst verdeckt sie die neue Umgebung)
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && cardOv && cardOv.classList.contains('open')) closeCard(); });
  setInterval(() => { if (cardOv && cardOv.classList.contains('open') && cardOv._env !== undefined && envCur() !== cardOv._env) closeCard(); }, 500);
  function closeCard() { if (cardOv) { cardOv.classList.remove('open'); cardOv._stop = true; } }
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  function cardCanvas(body, wide) {
    const cv = el('canvas', 'egg-cv' + (wide ? ' wide' : '')); body.appendChild(cv);
    const prep = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), W = cv.clientWidth || 560, H = cv.clientHeight || 315;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      const cx = cv.getContext('2d'); cx.setTransform(dpr, 0, 0, dpr, 0, 0); return { cx, W, H };
    };
    return { cv, prep };
  }
  const pal = () => { const dk = isDark(); return { dk, bg: dk ? '#141a26' : '#f8fafc', grid: dk ? '#232c3d' : '#e5e9f0', axis: dk ? '#6b7690' : '#8a93a6', txt: dk ? '#c3cbe0' : '#475569', muted: dk ? '#94a0b8' : '#6b7280', blue: dk ? '#60a5fa' : '#2563eb', gold: '#f59e0b', green: dk ? '#34d399' : '#059669', orange: dk ? '#fb923c' : '#ea580c', red: dk ? '#f87171' : '#dc2626', violet: '#8b5cf6' }; };
  const fmtN = v => { let s = (Math.round(v * 100) / 100).toString(); if (s === '-0') s = '0'; return s.replace('-', MINUS).replace('.', ','); };

  // Feuern mit Sperre: ein Egg meldet sich höchstens alle 10 Minuten (pro Sitzung), damit es im Unterricht nicht nervt
  const lastFire = {};
  function fire(id, fn, cool) {
    if (!enabled()) return false;
    const now = Date.now();
    if (lastFire[id] && now - lastFire[id] < (cool === undefined ? 600000 : cool)) return false;
    lastFire[id] = now; markFound(id);
    try { fn(); } catch (e) {}
    return true;
  }

  // ═════════════════════════ Eingabe-Eggs ═════════════════════════
  function normWord(raw) {
    return String(raw || '').replace(/EC/g, 'e').toLowerCase().replace(/\\[a-z]+/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/œ/g, 'oe').replace(/[^a-zα-ω]/g, '');
  }
  const wordSet = arr => new Set(arr.map(normWord));
  const WORDS = {
    herz: wordSet(['herz', 'heart', 'coeur', 'cœur', 'corazón', 'cuore', 'serce', 'srdce', 'szív', 'καρδιά']),
    blume: wordSet(['blume', 'flower', 'fleur', 'flor', 'fiore', 'kwiat', 'květina', 'virág', 'λουλούδι', 'rose', 'rosa']),
    unendlich: wordSet(['unendlich', 'infinity', 'infini', 'infinito', 'nieskończoność', 'nekonečno', 'végtelen', 'άπειρο', 'lemniskate', 'lemniscate']),
    flocke: wordSet(['schneeflocke', 'snowflake', 'flocon', 'copo', 'fiocco', 'płatek', 'vločka', 'hópehely', 'νιφάδα', 'koch']),
    fibo: wordSet(['fibonacci', 'goldenerschnitt', 'goldenratio']),
    collatz: wordSet(['collatz'])
  };
  const wordOf = raw => { const w = normWord(raw); if (!w || w.length > 24) return ''; for (const k in WORDS) if (WORDS[k].has(w)) return k; return ''; };

  // ── 1 Herz (alte Zeichenfläche) ──
  const HEART_UP = '(x^2)^(1/3)+a*sqrt(1-x^2)', HEART_UP_NOA = '(x^2)^(1/3)+sqrt(1-x^2)';
  const HEART_DN = '(x^2)^(1/3)-a*sqrt(1-x^2)', HEART_DN_NOA = '(x^2)^(1/3)-sqrt(1-x^2)';
  function fitView(hh, cx0, cy0) {
    try {
      const r = canvas.clientWidth / Math.max(1, canvas.clientHeight);
      view = { xmin: (cx0 || 0) - hh * r, xmax: (cx0 || 0) + hh * r, ymin: (cy0 || 0) - hh, ymax: (cy0 || 0) + hh };
      syncInputs();
    } catch (e) {}
  }
  function refreshFns() { try { clearEvalCache(); renderFuncList(); syncParams(); scheduleComputeSpecials(); scheduleDraw(); pushHistory(); } catch (e) {} }
  function makeHeart(i) {
    if (!functions[i]) return;
    const aUsedElsewhere = functions.some((f, j) => j !== i && typeof extractParams === 'function' && extractParams(f.expr).includes('a'));
    const col = '#e11d48';
    const f1 = functions[i];
    f1.expr = aUsedElsewhere ? HEART_UP_NOA : HEART_UP; f1.color = col; f1.noSpecials = true; f1.visible = true;
    functions.push({ expr: aUsedElsewhere ? HEART_DN_NOA : HEART_DN, color: col, visible: true, noSpecials: true });
    if (!aUsedElsewhere) params.a = { val: 1, min: 0.6, max: 1.4, step: 0.01 };
    fitView(2.4, 0, 0.3);
    refreshFns();
    if (!aUsedElsewhere && params.a) { params.a = { val: 1, min: 0.6, max: 1.4, step: 0.01 }; try { syncParams(); } catch (e) {} }
    toast('Das ist die Herzkurve: x² + (y − ∛(x²))² = 1', 6000);
    if (!aUsedElsewhere && !reducedMotion()) beat();
  }
  let beatRaf = 0;
  function beat() {
    cancelAnimationFrame(beatRaf);
    const t0 = performance.now(), T = 3000;
    (function step(now) {
      const k = (now - t0) / T;
      if (!params.a) return;
      if (k >= 1) { params.a.val = 1; clearEvalCache(); scheduleDraw(); try { syncParams(); } catch (e) {} return; }
      const ph = (k * 3) % 1;    // drei Schläge, je «Lub-dub»
      const pulse = Math.exp(-Math.pow((ph - 0.12) / 0.07, 2)) + 0.6 * Math.exp(-Math.pow((ph - 0.34) / 0.08, 2));
      params.a.val = 1 + 0.16 * pulse * (1 - k * 0.5);
      clearEvalCache(); scheduleDraw();
      beatRaf = requestAnimationFrame(step);
    })(t0);
  }

  // ── 2 Rosenkurve, 3 Lemniskate, 4 Koch-Schneeflocke: Formen auf der Ebene über dem Graphen ──
  // Die Form hängt am Funktionsobjekt (fn.egg) und verschwindet, sobald das Feld wieder etwas anderes enthält.
  const LEM_UP = 'sqrt(2*sqrt(1+2*x^2)-x^2-2)', LEM_DN = '-sqrt(2*sqrt(1+2*x^2)-x^2-2)';
  function kochPts(level) {
    const R = 6 / Math.sqrt(3);
    let P = [90, 210, 330].map(a => [R * Math.cos(a * Math.PI / 180), R * Math.sin(a * Math.PI / 180) - 0.4]);
    for (let l = 0; l < level; l++) {
      const Q = [];
      for (let i = 0; i < P.length; i++) {
        const p = P[i], q = P[(i + 1) % P.length], dx = (q[0] - p[0]) / 3, dy = (q[1] - p[1]) / 3;
        const a = [p[0] + dx, p[1] + dy], b = [p[0] + 2 * dx, p[1] + 2 * dy];
        const c = Math.cos(-Math.PI / 3), s = Math.sin(-Math.PI / 3);
        Q.push(p, a, [a[0] + dx * c - dy * s, a[1] + dx * s + dy * c], b);
      }
      P = Q;
    }
    return P;
  }
  const KOCH = [0, 1, 2, 3, 4].map(kochPts);
  const EGG = new WeakMap(), ANIM = new WeakMap();          // nicht am Objekt speichern (sonst landet es im Verlauf/Speichern)
  function shapeAlive(fn) {
    const eg = fn && EGG.get(fn);
    if (!eg || envCur() !== 'func' || !enabled() || typeof functions === 'undefined' || !functions.includes(fn) || fn.visible === false) return false;
    return eg.kind === 'lemni' ? fn.expr === LEM_UP : !String(fn.expr || '').trim();
  }
  function shapeAnim(fn) {
    return { fn, draw(cx, W, H, now) {
      if (!shapeAlive(fn)) { ANIM.delete(fn); return false; }
      const eg = EGG.get(fn);
      const M = mapper(); if (!M) return true;
      const t = now - eg.t0, col = fn.color || '#e11d48', P = (x, y) => [M.X(x), M.Y(y)];
      cx.lineJoin = 'round'; cx.lineCap = 'round';
      if (eg.kind === 'rose') {
        const k = Math.min(1, t / 2200), N = 480, R = 3;
        cx.beginPath();
        for (let i = 0; i <= N * k; i++) { const ph = 2 * Math.PI * i / N, r = R * Math.cos(2 * ph), p = P(r * Math.cos(ph), r * Math.sin(ph)); if (i) cx.lineTo(p[0], p[1]); else cx.moveTo(p[0], p[1]); }
        cx.fillStyle = 'rgba(236,72,153,' + (0.16 * k) + ')'; if (k >= 1) cx.fill();
        cx.strokeStyle = '#db2777'; cx.lineWidth = 2.6; cx.stroke();
        const c0 = P(0, 0); cx.fillStyle = '#f59e0b'; cx.beginPath(); cx.arc(c0[0], c0[1], 5 * Math.min(1, t / 600), 0, 7); cx.fill();
      } else if (eg.kind === 'koch') {
        const lv = Math.min(4, Math.floor(t / 900)), pts = KOCH[lv];
        cx.beginPath(); pts.forEach((q, i) => { const p = P(q[0], q[1]); if (i) cx.lineTo(p[0], p[1]); else cx.moveTo(p[0], p[1]); }); cx.closePath();
        cx.fillStyle = isDark() ? 'rgba(96,165,250,.16)' : 'rgba(59,130,246,.12)'; cx.fill();
        cx.strokeStyle = isDark() ? '#93c5fd' : '#2563eb'; cx.lineWidth = 2; cx.stroke();
        if (t < 4600) { const p = P(0, -4.2); cx.font = '600 14px -apple-system,system-ui,sans-serif'; cx.textAlign = 'center'; cx.fillStyle = isDark() ? '#93c5fd' : '#2563eb'; cx.fillText(String(lv), p[0], p[1]); }
      } else {                                                   // Lemniskate: ein Punkt läuft endlos (Bernoulli-Parametrisierung, a = 2)
        const u = t / 1000 * 1.3, s = Math.sin(u), c = Math.cos(u), d = 1 + s * s, p = P(2 * c / d, 2 * s * c / d);
        cx.shadowColor = col; cx.shadowBlur = 12; cx.fillStyle = col; cx.beginPath(); cx.arc(p[0], p[1], 6.5, 0, 7); cx.fill();
      }
      return true;
    } };
  }
  function ensureShapes() {
    if (envCur() !== 'func' || typeof functions === 'undefined' || !enabled()) return;
    functions.forEach(fn => { if (fn && !ANIM.has(fn) && shapeAlive(fn)) { const a = shapeAnim(fn); ANIM.set(fn, a); ovAdd(a); } });
  }
  function makeShape(i, kind) {
    const fn = functions[i]; if (!fn) return;
    if (kind === 'lemni') {
      fn.expr = LEM_UP; fn.color = '#7c3aed'; fn.noSpecials = true; fn.visible = true;
      functions.push({ expr: LEM_DN, color: '#7c3aed', visible: true, noSpecials: true });
      fitView(1.8, 0, 0);
      toast('Lemniskate von Bernoulli: (x² + y²)² = 4(x² − y²). Das Zeichen ∞ hat genau diese Form.', 7000);
    } else {
      fn.expr = ''; fn.visible = true; if (kind === 'rose') fn.color = '#db2777';
      fitView(kind === 'rose' ? 3.7 : 4.8, 0, kind === 'rose' ? 0 : -0.2);
      toast(kind === 'rose'
        ? 'Rosenkurve r = 3·cos(2φ) in Polarkoordinaten: vier Blütenblätter. Mit cos(kφ) gibt es k Blätter (k ungerade) oder 2k (k gerade).'
        : 'Koch-Schneeflocke: Jede Stufe macht den Rand 4/3-mal so lang. Der Umfang wird unendlich, die Fläche bleibt endlich.', 8000);
    }
    EGG.set(fn, { kind, t0: performance.now() }); ANIM.delete(fn);
    refreshFns();
    setTimeout(ensureShapes, 30);
  }

  let lastEggKey = '';
  function constValue(raw) {
    if (typeof safeEval !== 'function') return null;
    const xs = [0.37, 1.91, -2.6]; let v0 = null;
    for (const x of xs) {
      const y = safeEval(raw, x);
      if (!isFinite(y)) return null;
      if (v0 === null) v0 = y; else if (Math.abs(y - v0) > 1e-9 * Math.max(1, Math.abs(v0))) return null;
    }
    return v0;
  }
  // Text eines Feldes vereinheitlichen (ASCII-Math, LaTeX oder Rohausdruck)
  function normExpr(s) {
    return String(s || '').toLowerCase().replace(/\\left|\\right|\\mathrm|\\operatorname|\\displaystyle/g, '').replace(/\\cdot|\\times|\*|·/g, '')
      .replace(/\\pi|π/g, 'pi').replace(/\\(sin|cos|ln|exp)/g, '$1').replace(/²/g, '^2').replace(/−/g, '-').replace(/\\ldots|\\dots|\\cdots|…/g, '...')
      .replace(/ec/g, 'e').replace(/[{}\s]/g, '');
  }
  const RX_PYTH = /^(sin\^2([a-zθφ])\+cos\^2\2|cos\^2([a-zθφ])\+sin\^2\3|sin\(([a-zθφ])\)\^2\+cos\(\4\)\^2|cos\(([a-zθφ])\)\^2\+sin\(\5\)\^2|sin\^2\(([a-zθφ])\)\+cos\^2\(\6\)|cos\^2\(([a-zθφ])\)\+sin\^2\(\7\))$/;
  const RX_EULER = /^(e\^\(?(ipi|pii)\)?\+1|1\+e\^\(?(ipi|pii)\)?|e\^\((ipi|pii)\+1\)|e\^(ipi|pii)\+1)$/;
  const RX_NINES = /^0[.,](9{2,}\.\.\.|\\overline9|\\overline\(9\)|9{7,})$/;
  // (a+b)² = a² + b² (oder mit −), in beiden Richtungen
  const RX_BIN1 = /^\(([a-z])([+-])([a-z])\)\^2=\1\^2\2\3\^2$/, RX_BIN2 = /^([a-z])\^2([+-])([a-z])\^2=\(\1\2\3\)\^2$/;

  // Gemeinsame Prüfung aller Feld-Eingaben; gibt den Schlüssel zurück (oder '')
  function checkText(txt, ctx) {
    const n = normExpr(txt);
    if (!n) return '';
    if (RX_PYTH.test(n)) return 'pyth';
    if (RX_EULER.test(n)) return 'euler';
    if (RX_NINES.test(n)) return 'nines';
    if (n === '1729') return 'taxi';
    if (RX_BIN1.test(n) || RX_BIN2.test(n)) return 'binom';
    const w = wordOf(txt); if (w === 'fibo' || w === 'collatz') return w;
    if (ctx === 'func' && (w === 'herz' || w === 'blume' || w === 'unendlich' || w === 'flocke')) return w;
    return '';
  }
  function runText(key, txt, i) {
    if (key === 'herz') { fire('herz', () => makeHeart(i), 0); return; }
    if (key === 'blume') { fire('blume', () => makeShape(i, 'rose'), 0); return; }
    if (key === 'unendlich') { fire('unendlich', () => makeShape(i, 'lemni'), 0); return; }
    if (key === 'flocke') { fire('flocke', () => makeShape(i, 'koch'), 0); return; }
    if (key === 'pyth') fire('pyth', () => toast('sin²x + cos²x = 1 für jedes x – das ist der Satz des Pythagoras am Einheitskreis. Der Graph ist die Gerade y = 1.', 7000), 20000);
    else if (key === 'euler') fire('euler', () => { toast('e^(iπ) + 1 = 0 – fünf wichtige Konstanten in einer Gleichung: e, i, π, 1 und 0.', 7000); confetti(150); }, 20000);
    else if (key === 'nines') fire('nines', cardNines, 20000);
    else if (key === 'taxi') fire('taxi', () => toast('1729 = 1³ + 12³ = 9³ + 10³ – die kleinste Zahl, die auf zwei Arten Summe zweier Kubikzahlen ist. Ramanujan erkannte das sofort, als Hardy die «langweilige» Taxinummer 1729 erwähnte.', 10000), 20000);
    else if (key === 'binom') { const n = normExpr(txt), mm = n.match(RX_BIN1) || n.match(RX_BIN2); fire('binom', () => cardBinom(mm ? mm[2] : '+', mm ? mm[1] : 'a', mm ? mm[3] : 'b'), 20000); }
    else if (key === 'fibo') fire('fibo', () => { toast('1, 1, 2, 3, 5, 8, 13, 21 … Quadrate mit Fibonacci-Seiten bilden die goldene Spirale. Der Quotient zweier Nachbarn strebt gegen φ ≈ 1,618.', 8000); spiral(); }, 20000);
    else if (key === 'collatz') fire('collatz', () => cardCollatz(27), 5000);
  }
  // Hook aus 06_ui_functions.js (Funktionsfelder der Umgebung «Funktionen: Werkzeug»)
  function onExpr(fn, i, raw) {
    if (!enabled() || !raw) return;
    let key = checkText(raw, 'func');
    if (!key) {
      const v = constValue(raw), c = String(raw).toLowerCase();
      if (v !== null && /sin/.test(c) && /cos/.test(c) && Math.abs(v - 1) < 1e-9) key = 'pyth';
      else if (v === 1729) key = 'taxi';
    }
    if (key && key !== lastEggKey) { lastEggKey = key; setTimeout(() => runText(key, raw, i), 0); return; }
    if (!key) lastEggKey = '';
  }
  // Alle anderen Felder (neue Umgebungen, Algebra …): ein gemeinsamer Zuhörer
  let lastFieldKey = '';
  document.addEventListener('input', e => {
    if (!enabled()) return;
    const t = e.target; if (!t || !t.closest || t.closest('#func-list') || t.closest('.egg-ov')) return;
    let txt = '';
    try {
      if (t.tagName === 'MATH-FIELD') { const a = t.getValue('ascii-math'), l = t.getValue('latex'); txt = checkText(a, 'field') ? a : l; }
      else if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') { if (t.type && !/^(text|search|number)$/.test(t.type)) return; txt = t.value; }
      else return;
    } catch (ex) { return; }
    const key = checkText(txt, 'field');
    if (key && key !== lastFieldKey) { lastFieldKey = key; setTimeout(() => runText(key, txt, -1), 0); }
    else if (!key) lastFieldKey = '';
  }, true);

  // ═════════════════════════ Karten ═════════════════════════
  // 7 · 0,999… = 1
  function cardNines() {
    openCard('0,999… = 1', body => {
      body.appendChild(el('p', 'egg-txt', 'Ja, wirklich: 0,999… (unendlich viele Neunen) ist genau 1. Drei Begründungen:'));
      const ol = el('ol', 'egg-txt');
      ['x = 0,999…  →  10x = 9,999…  →  10x − x = 9  →  9x = 9  →  x = 1.',
        '1/3 = 0,333…  →  3 · 1/3 = 0,999…  und  3 · 1/3 = 1.',
        'Zwischen zwei verschiedenen Zahlen liegt immer eine dritte. Zwischen 0,999… und 1 passt aber keine Zahl – also sind sie gleich.']
        .forEach(t => ol.appendChild(el('li', '', t)));
      body.appendChild(ol);
      body.appendChild(el('p', 'egg-sub', 'Eine Zahl kann mehrere Dezimaldarstellungen haben: 1 = 1,000… = 0,999…'));
    });
  }
  // 20 · (a + b)² ≠ a² + b²: Flächenbild mit den zwei fehlenden Rechtecken
  function cardBinom(sign, A, B) {
    const minus = sign === '-';
    openCard('(' + A + (minus ? ' − ' : ' + ') + B + ')² ≠ ' + A + '² ' + (minus ? '−' : '+') + ' ' + B + '²', body => {
      body.appendChild(el('p', 'egg-txt', minus
        ? 'Fast! Beim Quadrieren einer Differenz fehlt das gemischte Glied: (' + A + ' − ' + B + ')² = ' + A + '² − 2' + A + B + ' + ' + B + '². Das Bild zeigt es für eine Summe; bei der Differenz werden die beiden Rechtecke abgezogen.'
        : 'Fast! Das Quadrat mit der Seite ' + A + ' + ' + B + ' besteht aus vier Teilen: ' + A + '², ' + B + '² und zweimal dem Rechteck ' + A + '·' + B + '. Darum gilt (' + A + ' + ' + B + ')² = ' + A + '² + 2' + A + B + ' + ' + B + '².'));
      const { cv, prep } = cardCanvas(body, true);
      const t0 = performance.now();
      (function step(now) {
        if (!cardOv || cardOv._stop || !cv.isConnected) return;
        const { cx, W, H } = prep(), P = pal(), k = (now - t0) / 1000;
        cx.fillStyle = P.bg; cx.fillRect(0, 0, W, H);
        const S = Math.min(H - 40, W * 0.55), a = S * 0.62, b = S - a, x0 = (W - S) / 2, y0 = (H - S) / 2;
        const rect = (x, y, w, h, fill, lbl, alpha) => {
          cx.globalAlpha = alpha; cx.fillStyle = fill; cx.fillRect(x, y, w, h); cx.globalAlpha = 1;
          cx.strokeStyle = P.txt; cx.lineWidth = 1.5; cx.strokeRect(x, y, w, h);
          cx.fillStyle = P.txt; cx.font = '600 ' + Math.max(14, S * 0.08) + 'px "KaTeX_Main",Georgia,serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(lbl, x + w / 2, y + h / 2);
        };
        rect(x0, y0, a, a, P.blue, A + '²', 0.25);
        rect(x0 + a, y0 + a, b, b, P.green, B + '²', 0.3);
        const pulse = 0.25 + 0.25 * (1 + Math.sin(k * 4)) / 2;
        rect(x0 + a, y0, b, a, P.orange, A + B, pulse);
        rect(x0, y0 + a, a, b, P.orange, A + B, pulse);
        cx.fillStyle = P.muted; cx.font = '15px "KaTeX_Main",Georgia,serif'; cx.textAlign = 'center'; cx.textBaseline = 'bottom';
        cx.fillText(A, x0 + a / 2, y0 - 4); cx.fillText(B, x0 + a + b / 2, y0 - 4);
        cx.textAlign = 'right'; cx.textBaseline = 'middle'; cx.fillText(A, x0 - 6, y0 + a / 2); cx.fillText(B, x0 - 6, y0 + a + b / 2);
        requestAnimationFrame(step);
      })(t0);
      body.appendChild(el('p', 'egg-sub', 'Die orangen Rechtecke sind die «fehlenden» 2' + A + B + '.'));
    });
  }
  // 18 · Der kleine Gauss (Summe 1 + 2 + … + 100)
  function cardGauss() {
    openCard('Der kleine Gauss', body => {
      body.appendChild(el('p', 'egg-txt', 'Der Legende nach stellte der Lehrer Büttner um 1786 seiner Klasse die Aufgabe, alle Zahlen von 1 bis 100 zu addieren – er wollte eine Weile Ruhe. Der neunjährige Carl Friedrich Gauss war nach wenigen Augenblicken fertig:'));
      const { cv, prep } = cardCanvas(body, true);
      const lines = ['  1 +   2 +   3 + … +  98 +  99 + 100', '100 +  99 +  98 + … +   3 +   2 +   1', '101 + 101 + 101 + … + 101 + 101 + 101', '2s = 100 · 101   →   s = 5050'];
      const t0 = performance.now();
      (function step(now) {
        if (!cardOv || cardOv._stop || !cv.isConnected) return;
        const { cx, W, H } = prep(), t = (now - t0) / 1000;
        cx.fillStyle = '#1f3b2d'; cx.fillRect(0, 0, W, H);
        cx.strokeStyle = '#7a5a3a'; cx.lineWidth = 8; cx.strokeRect(4, 4, W - 8, H - 8);
        const fs = Math.min(W / 22, H / 8);
        cx.font = fs + 'px "Comic Sans MS","Chalkboard SE","Bradley Hand",cursive'; cx.textBaseline = 'middle'; cx.textAlign = 'left';
        lines.forEach((ln, i) => {
          const n = Math.max(0, Math.min(ln.length, Math.floor((t - i * 1.6) * 26)));
          if (!n) return;
          cx.fillStyle = i === 3 ? '#fde68a' : 'rgba(245,245,240,.92)';
          cx.fillText(ln.slice(0, n), W * 0.07, H * (0.2 + i * 0.2));
          if (i === 1 && n === ln.length) { cx.strokeStyle = 'rgba(245,245,240,.7)'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(W * 0.07, H * 0.5); cx.lineTo(W * 0.93, H * 0.5); cx.stroke(); }
        });
        if (t < 9) requestAnimationFrame(step);
      })(t0);
      body.appendChild(el('p', 'egg-sub', 'Die Reihe rückwärts darunter schreiben: Jede Spalte ergibt 101, und es sind 100 Spalten. Das ist die Summe zweimal, also s = 100 · 101 / 2. Dieselbe Idee steckt in der Formel sₙ = n · (a₁ + aₙ) / 2.'));
    });
  }
  // 17 · Collatz-Vermutung
  function collatzRun(n) { const a = [n]; let g = 0; while (n !== 1 && g++ < 5000) { n = n % 2 ? 3 * n + 1 : n / 2; a.push(n); } return a; }
  function cardCollatz(n0) {
    openCard('Collatz-Vermutung', (body, lvl) => {
      body.appendChild(el('p', 'egg-txt', 'Regel: Ist die Zahl gerade, halbiere sie. Ist sie ungerade, rechne 3n + 1. Jede je getestete Startzahl landet irgendwann im Kreis 4 → 2 → 1. Ob das für alle Zahlen gilt, weiss bis heute niemand.'));
      const row = el('div', 'egg-row'); row.appendChild(el('div', '', 'Startzahl'));
      const inp = el('input'); inp.type = 'number'; inp.min = '1'; inp.max = '100000'; inp.value = String(n0); row.appendChild(inp);
      const info = el('div', 'egg-sub'); info.style.margin = '0'; row.appendChild(info);
      body.appendChild(row);
      const { cv, prep } = cardCanvas(body, true);
      let seq = [], t0 = 0;
      const set = () => { let n = Math.round(Number(inp.value)); if (!(n >= 1 && n <= 100000)) return; seq = collatzRun(n); t0 = performance.now(); info.textContent = (seq.length - 1) + ' Schritte, grösster Wert ' + Math.max(...seq); };
      inp.addEventListener('input', set); set();
      (function step(now) {
        if (!cardOv || cardOv._stop || !cv.isConnected) return;
        const { cx, W, H } = prep(), P = pal();
        cx.fillStyle = P.bg; cx.fillRect(0, 0, W, H);
        const L = 44, R = W - 14, T = 14, B = H - 26, N = seq.length, mx = Math.max(...seq);
        const X = i => L + (R - L) * i / Math.max(1, N - 1), Y = v => B - (B - T) * v / mx;
        cx.strokeStyle = P.axis; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(L, T); cx.lineTo(L, B); cx.lineTo(R, B); cx.stroke();
        cx.fillStyle = P.muted; cx.font = '11px -apple-system,system-ui,sans-serif'; cx.textAlign = 'right'; cx.textBaseline = 'middle'; cx.fillText(String(mx), L - 4, T + 4); cx.fillText('0', L - 4, B);
        cx.textAlign = 'center'; cx.textBaseline = 'top'; cx.fillText('n', (L + R) / 2, B + 6);
        const shown = Math.min(N, Math.floor((now - t0) / 1000 * Math.max(25, N / 2.5)) + 1);
        cx.strokeStyle = P.blue; cx.lineWidth = 1.8; cx.beginPath();
        for (let i = 0; i < shown; i++) { if (i) cx.lineTo(X(i), Y(seq[i])); else cx.moveTo(X(i), Y(seq[i])); }
        cx.stroke();
        if (shown >= N && N >= 3) {
          const k = (Math.sin(now / 250) + 1) / 2;
          cx.fillStyle = P.gold; cx.shadowColor = P.gold; cx.shadowBlur = 6 + 8 * k;
          for (let i = N - 3; i < N; i++) { cx.beginPath(); cx.arc(X(i), Y(seq[i]), 4 + 2 * k, 0, 7); cx.fill(); }
          cx.shadowBlur = 0; cx.fillStyle = P.txt; cx.font = '600 13px -apple-system,system-ui,sans-serif'; cx.textAlign = 'right'; cx.textBaseline = 'bottom';
          cx.fillText('4 → 2 → 1', R, B - 8);
        }
        requestAnimationFrame(step);
      })(performance.now());
      body.appendChild(el('p', 'egg-sub', 'Probiere 27: Erst nach 111 Schritten und einem Ausflug bis 9232 kommt die Folge bei 1 an.'));
    });
  }
  // 31 · Sammelalbum
  function cardAlbum() {
    markFound('album');
    const F = foundSet();
    openCard('Sammelalbum', (body, lvl) => {
      lvl.textContent = F.size + ' von ' + ALBUM.length + ' gefunden';
      body.appendChild(el('p', 'egg-sub', 'Hier sammeln sich die versteckten Überraschungen, die du schon gefunden hast. Bei den anderen steht nur, wo sie sich verstecken.'));
      const g = el('div', 'egg-alb');
      ALBUM.forEach((a, i) => {
        const got = F.has(a[0]), d = el('div', got ? 'got' : '');
        d.appendChild(el('div', '', (i + 1) + '. ' + (got ? a[1] : '?')));
        d.appendChild(el('div', 'egg-cat', a[2]));
        g.appendChild(d);
      });
      body.appendChild(g);
      const f = el('div', 'egg-foot'); const b = el('button', '', 'Zurücksetzen'); b.type = 'button';
      b.onclick = () => { lsSet(LS_FOUND, '[]'); cardAlbum(); };
      f.appendChild(el('div', 'egg-msg', 'Abschalten kann man alle Überraschungen in den Einstellungen.')); f.appendChild(b); body.appendChild(f);
    });
  }

  // ═════════════════════════ Bilder auf der Ebene über dem Graphen ═════════════════════════
  // 9 · Goldene Spirale aus Fibonacci-Quadraten (Mitte des Hauptfensters)
  function spiral() {
    const F = [1, 1, 2, 3, 5, 8, 13, 21, 34];
    let bb = { x0: 0, y0: 0, x1: 1, y1: 1 }; const sq = [{ x: 0, y: 0, s: 1, d: -1 }];
    for (let i = 1; i < F.length; i++) {
      const s = F[i], d = (i - 1) % 4; let x, y;
      if (d === 0) { x = bb.x1; y = bb.y0; } else if (d === 1) { x = bb.x0; y = bb.y1; } else if (d === 2) { x = bb.x0 - s; y = bb.y0; } else { x = bb.x0; y = bb.y0 - s; }
      sq.push({ x, y, s, d }); bb = { x0: Math.min(bb.x0, x), y0: Math.min(bb.y0, y), x1: Math.max(bb.x1, x + s), y1: Math.max(bb.y1, y + s) };
    }
    const arcs = sq.map(q => {                                  // Viertelkreis um die Ecke (d+3) mod 4, gegen den Uhrzeigersinn
      const cs = [[q.x, q.y], [q.x + q.s, q.y], [q.x + q.s, q.y + q.s], [q.x, q.y + q.s]], ci = ((q.d + 3) % 4 + 4) % 4, c = cs[ci];
      let a = cs[(ci + 1) % 4], b = cs[(ci + 3) % 4];
      if ((a[0] - c[0]) * (b[1] - c[1]) - (a[1] - c[1]) * (b[0] - c[0]) < 0) { const t = a; a = b; b = t; }
      const a0 = Math.atan2(a[1] - c[1], a[0] - c[0]);
      return { c, r: q.s, a0 };
    });
    const t0 = performance.now(), T = 7000;
    ovAdd({ draw(cx, W, H, now) {
      const t = now - t0; if (t > T || !enabled()) return false;
      const m = mainMap(), box = m && envCur() !== 'func' && envCur() !== 'geo' ? { x: m.L, y: m.T, w: m.R - m.L, h: m.B - m.T } : { x: 0, y: 0, w: W, h: H };
      const sc = Math.min(box.w / (bb.x1 - bb.x0), box.h / (bb.y1 - bb.y0)) * 0.72;
      const ox = box.x + box.w / 2 - sc * (bb.x0 + bb.x1) / 2, oy = box.y + box.h / 2 + sc * (bb.y0 + bb.y1) / 2;
      const X = x => ox + sc * x, Y = y => oy - sc * y, alpha = Math.min(1, (T - t) / 1200);
      cx.globalAlpha = alpha; cx.lineJoin = 'round';
      const shown = Math.min(sq.length, t / 330);
      for (let i = 0; i < shown; i++) {
        const q = sq[i], part = Math.min(1, shown - i);
        cx.strokeStyle = isDark() ? 'rgba(251,191,36,.55)' : 'rgba(217,119,6,.5)'; cx.lineWidth = 1.2;
        cx.strokeRect(X(q.x), Y(q.y + q.s), q.s * sc, q.s * sc);
        if (q.s * sc > 16) { cx.fillStyle = isDark() ? 'rgba(251,191,36,.8)' : 'rgba(180,83,9,.75)'; cx.font = Math.min(26, 6 + q.s * sc * 0.12) + 'px "KaTeX_Main",Georgia,serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(String(q.s), X(q.x + q.s / 2), Y(q.y + q.s / 2)); }
        const A = arcs[i]; cx.strokeStyle = '#f59e0b'; cx.lineWidth = 3; cx.beginPath();
        for (let k = 0; k <= 24 * part; k++) { const ang = A.a0 + (Math.PI / 2) * k / 24, px = X(A.c[0] + A.r * Math.cos(ang)), py = Y(A.c[1] + A.r * Math.sin(ang)); if (k) cx.lineTo(px, py); else cx.moveTo(px, py); }
        cx.stroke();
      }
      return true;
    } });
  }
  // 21 · Thaleskreis über der Hypotenuse (pts: drei Punkte [x, y], k: Ecke mit dem rechten Winkel)
  function thalesFlash(pts, k) {
    const A = pts[(k + 1) % 3], B = pts[(k + 2) % 3], C = pts[k], M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], r = Math.hypot(A[0] - B[0], A[1] - B[1]) / 2;
    const t0 = performance.now(), T = 6000;
    ovAdd({ draw(cx, W, H, now) {
      const t = now - t0; if (t > T || !enabled()) return false;
      const Mp = mapper(); if (!Mp) return true;
      clipTo(cx, Mp);
      const al = Math.min(fadeIn(t, 500), (T - t) / 1000), rp = r / Mp.s, k2 = Math.min(1, t / 1400);
      cx.globalAlpha = Math.max(0, al);
      cx.strokeStyle = '#f59e0b'; cx.lineWidth = 2.4; cx.setLineDash([7, 6]);
      cx.beginPath(); cx.arc(Mp.X(M[0]), Mp.Y(M[1]), rp, 0, 2 * Math.PI * k2); cx.stroke(); cx.setLineDash([]);
      cx.fillStyle = '#f59e0b'; cx.beginPath(); cx.arc(Mp.X(M[0]), Mp.Y(M[1]), 4, 0, 7); cx.fill();
      // rechter Winkel bei C
      const u = [A[0] - C[0], A[1] - C[1]], v = [B[0] - C[0], B[1] - C[1]], lu = Math.hypot(u[0], u[1]), lv = Math.hypot(v[0], v[1]), q = Math.min(lu, lv) * 0.18;
      const p1 = [C[0] + u[0] / lu * q, C[1] + u[1] / lu * q], p3 = [C[0] + v[0] / lv * q, C[1] + v[1] / lv * q], p2 = [p1[0] + v[0] / lv * q, p1[1] + v[1] / lv * q];
      cx.lineWidth = 2; cx.beginPath(); cx.moveTo(Mp.X(p1[0]), Mp.Y(p1[1])); cx.lineTo(Mp.X(p2[0]), Mp.Y(p2[1])); cx.lineTo(Mp.X(p3[0]), Mp.Y(p3[1])); cx.stroke();
      return true;
    } });
  }
  function rightCorner(pts) {
    for (let k = 0; k < 3; k++) {
      const C = pts[k], A = pts[(k + 1) % 3], B = pts[(k + 2) % 3], u = [A[0] - C[0], A[1] - C[1]], v = [B[0] - C[0], B[1] - C[1]];
      const lu = Math.hypot(u[0], u[1]), lv = Math.hypot(v[0], v[1]); if (lu < 1e-9 || lv < 1e-9) return -1;
      if (Math.abs((u[0] * v[0] + u[1] * v[1]) / (lu * lv)) < 0.0035) return k;       // 90° ± 0,2°
    }
    return -1;
  }
  // 19 · Kante leuchtet (lineare Optimierung)
  function edgeGlow(P, Q) {
    const t0 = performance.now(), T = 4200;
    ovAdd({ draw(cx, W, H, now) {
      const t = now - t0; if (t > T || !enabled() || envCur() !== 'lo') return false;
      const M = mapper(); if (!M) return true;
      clipTo(cx, M);
      const k = 0.5 + 0.5 * Math.sin(t / 1000 * Math.PI * 2 - Math.PI / 2), al = Math.min(1, (T - t) / 800);
      cx.globalAlpha = al * (0.35 + 0.55 * k); cx.strokeStyle = '#f59e0b'; cx.lineCap = 'round'; cx.lineWidth = 9 + 6 * k;
      cx.beginPath(); cx.moveTo(M.X(P[0]), M.Y(P[1])); cx.lineTo(M.X(Q[0]), M.Y(Q[1])); cx.stroke();
      return true;
    } });
  }
  // 23 · goldener Schimmer am Rand des Bildes
  function rimGlow() {
    const t0 = performance.now(), T = 2600;
    ovAdd({ draw(cx, W, H, now) {
      const t = now - t0; if (t > T) return false;
      const k = Math.sin(Math.PI * t / T), g = cx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.6);
      g.addColorStop(0, 'rgba(245,158,11,0)'); g.addColorStop(1, 'rgba(245,158,11,' + (0.35 * k) + ')');
      cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      return true;
    } });
  }

  // ═════════════════════════ Zoomen (10, 11) ═════════════════════════
  let zoomState = 0;                                             // 0 normal, 1 draussen, −1 drinnen
  function zoomCheck(w, out, inn, back0, back1) {
    if (!isFinite(w) || !enabled()) return;
    if (w >= out) { if (zoomState !== 1) { zoomState = 1; fire('universe', () => toast('Du hast die Milchstrasse verlassen. Hier draussen gibt es nur noch Pixel.', 5500), 60000); } }
    else if (w <= inn) { if (zoomState !== -1) { zoomState = -1; fire('planck', () => toast('Planck-Länge erreicht – noch kleiner wird es nicht (zumindest nicht schön).', 5500), 60000); } }
    else if (w < back1 && w > back0) zoomState = 0;
  }
  function onView(v) { if (v) zoomCheck(Math.abs(v.xmax - v.xmin), 2e6, 2e-6, 1e-3, 1e5); }   // alte Zeichenfläche

  // ═════════════════════════ Themen-Eggs: Prüfung nach jedem Zeichnen ═════════════════════════
  const armed = {};
  // cond true → feuern (einmal, bis die Bedingung wieder falsch war)
  // Karte schliesst sich, sobald die auslösende Situation nicht mehr gilt (z. B. anderes Beispiel gewählt)
  // Hinweis (Toast) und Karte verschwinden, sobald die auslösende Situation nicht mehr gilt (z. B. anderes Beispiel gewählt)
  function when(id, cond, fn, cool) { if (!cond) { armed[id] = true; if (cardOv && cardOv.classList.contains('open') && cardOv._egg === id) closeCard(); toastOff(id); return; } if (armed[id] === false) return; armed[id] = false; curEgg = id; const did = fire(id, fn, cool); curEgg = null; if (did && cardOv && cardOv.classList.contains('open')) cardOv._egg = id; }
  function stOf(e) {
    try {
      return { lin: typeof LIN !== 'undefined' && LIN, quad: typeof QUAD !== 'undefined' && QUAD, exp: typeof EXP !== 'undefined' && EXP, inv: typeof INV !== 'undefined' && INV,
        diff: typeof DIF !== 'undefined' && DIF, seq: typeof SEQ !== 'undefined' && SEQ, lo: typeof LOP !== 'undefined' && LOP, sim: typeof SIM !== 'undefined' && SIM }[e] || null;
    } catch (x) { return null; }
  }
  let checkT = 0;
  function scheduleCheck() { if (checkT) return; checkT = setTimeout(() => { checkT = 0; runChecks(); }, 450); }   // gedrosselt (manche Ansichten zeichnen dauernd)
  function runChecks() {
    if (!enabled()) return;
    const e = envCur(), st = stOf(e);
    if (st && st.drag) { scheduleCheck(); return; }                  // erst nach dem Ziehen
    const m = mainMap();
    if (m && e !== 'func' && e !== 'geo' && !(e === 'seq' && typeof SEQ !== 'undefined' && SEQ.view === 'lim')) zoomCheck(m.win.x1 - m.win.x0, 5e4, 2e-4, 1e-3, 1e4);
    try {
      if (e === 'lin') {
        const w = m ? m.win.x1 - m.win.x0 : 0;
        when('parallel', LIN.view === 'sys' && Math.abs(LIN.m - LIN.m2) < 1e-9 && Math.abs(LIN.q - LIN.q2) > 1e-9 && w >= 300,
          () => toast('Parallele Geraden schneiden sich nie – oder, wie man in der projektiven Geometrie sagt: im Unendlichen. So weit kann man leider nicht zoomen.', 8000));
      } else if (e === 'quad') {
        const Q = typeof quadCurQ === 'function' ? quadCurQ() : null;
        when('disc', !!Q && Math.abs(Q.a) > 1e-9 && Math.abs(Q.b * Q.b - 4 * Q.a * Q.c) < 1e-9,
          () => toast('Punktlandung: D = 0. Die Parabel berührt die x-Achse in genau einem Punkt – eine doppelte Nullstelle.', 6500));
      } else if (e === 'exp') {
        when('base1', !EXP.eb && Math.abs(EXP.b - 1) < 1e-9,
          () => toast('Wachstum mit Basis 1? 1 · 1 · 1 · … bleibt 1. Kein Wachstum, kein Zerfall – nur eine waagrechte Gerade.', 7000));
      } else if (e === 'inv') {
        let self = false;
        if (INV.view === 'pairs') self = INV.pair === 'rec';
        else if (typeof invR === 'function' && typeof Inv !== 'undefined') {
          const f = Inv.fOf(invR()); let ok = 0, bad = false, moved = false;
          [-2.7, -1.3, 0.6, 1.9, 3.3].forEach(x => { const y = f(x), z = isFinite(y) ? f(y) : NaN; if (!isFinite(z)) return; ok++; if (Math.abs(z - x) > 1e-6 * Math.max(1, Math.abs(x))) bad = true; if (Math.abs(y - x) > 1e-3) moved = true; });
          self = ok >= 3 && !bad && moved;
        }
        when('selfinv', self, () => toast('f = f⁻¹: Diese Funktion ist ihr eigenes Spiegelbild an y = x. Zweimal anwenden ergibt wieder x.', 7000));
      } else if (e === 'diff') {
        let same = false;
        if (DIF.F && typeof DIF.F.f === 'function') {
          const f = DIF.F.f(0), f1 = DIF.F.f(1); let ok = 0, bad = false, big = false;
          [-1.3, -0.4, 0.7, 1.6].forEach(x => {
            const y = f(x), d = f1(x);
            if (!isFinite(y) || !isFinite(d)) return; ok++; if (Math.abs(d - y) > 1e-4 * Math.max(1, Math.abs(y))) bad = true; if (Math.abs(y) > 1e-6) big = true;
          });
          same = ok >= 3 && !bad && big;
        }
        when('eself', same, () => toast('f′ = f: Diese Funktion ist ihre eigene Ableitung. Das schaffen nur die Funktionen c · eˣ.', 7000));
      } else if (e === 'seq') {
        const o = SEQ.sum;
        when('gauss', SEQ.view === 'sum' && o.type === 'ari' && o.a1 === 1 && o.d === 1 && o.n === 100, cardGauss, 60000);
        let fib = false;
        if (SEQ.view === 'def' && typeof seqDefS === 'function') {
          const t = Sq.terms(seqDefS(), 9), A = [1, 1, 2, 3, 5, 8, 13, 21, 34];
          fib = t.length >= 8 && (t.slice(0, 8).every((v, i) => Math.abs(v - A[i]) < 1e-9) || t.slice(0, 8).every((v, i) => Math.abs(v - A[i + 1]) < 1e-9));
        }
        when('fibo', fib, () => { toast('Fibonacci-Zahlen! Quadrate mit diesen Seiten bilden die goldene Spirale. Der Quotient zweier Nachbarn strebt gegen φ ≈ 1,618.', 8000); spiral(); }, 60000);
      } else if (e === 'lo') {
        let o = null;
        if (LOP.view === 'opt' && typeof Lp !== 'undefined') o = Lp.optimum(lopL(), LOP.nn, lopO(), LOP.mode);
        const edge = !!(o && !o.empty && o.edge && !o.unbounded && o.best && o.best.length >= 2);
        when('edge', edge, () => {
          const B = o.best.slice().sort((p, q) => p.x - q.x || p.y - q.y), P = B[0], Q = B[B.length - 1];
          toast('Unentschieden! Die Niveaulinie liegt parallel zu einer Kante des Planungspolygons: Alle Punkte dieser Kante sind optimal.', 7500);
          edgeGlow([P.x, P.y], [Q.x, Q.y]);
        });
      } else if (e === 'geo') {
        let hit = null;
        if (typeof geoObjs !== 'undefined' && typeof geoVal === 'function') geoObjs.forEach(o => {
          if (hit || o.t !== 'poly' || o.vis === false) return; const v = geoVal(o.id); if (!v || !v.pts || v.pts.length !== 3) return;
          const pts = v.pts.map(p => [p.x, p.y]), k = rightCorner(pts); if (k >= 0) hit = { pts, k };
        });
        when('thales', !!hit, () => { toast('Rechter Winkel! Dann liegt die Ecke auf dem Thaleskreis über der gegenüberliegenden Seite – und umgekehrt.', 7000); thalesFlash(hit.pts, hit.k); }, 120000);
      } else if (e === 'sim') {
        let hit = null;
        if ((SIM.view === 'map' || SIM.view === 'test') && SIM.P && SIM.P.length === 3) { const k = rightCorner(SIM.P); if (k >= 0) hit = { pts: SIM.P.map(p => [p[0], p[1]]), k }; }
        when('thales', !!hit, () => { toast('Rechter Winkel! Dann liegt die Ecke auf dem Thaleskreis über der gegenüberliegenden Seite – und umgekehrt.', 7000); thalesFlash(hit.pts, hit.k); }, 120000);
      } else if (e === 'stat' && typeof STAT !== 'undefined' && typeof statD === 'function') {
        if (STAT.mode === 'monty') {
          const D = statD('monty');
          when('monty', D.n >= 1000, () => {
            const pc = v => Math.round(100 * v / D.n);
            toast('Nach ' + D.n + ' Spielen: Wechseln gewinnt in ' + pc(D.swap) + ' %, Bleiben nur in ' + pc(D.stay) + ' % der Fälle – genau wie die Theorie sagt: 2/3 gegen 1/3.', 9000);
          });
        } else if (STAT.mode === 'galton') {
          const D = statD('galton');
          when('galton', D.n >= 1000, () => { toast('Aus lauter Zufall entsteht Ordnung: Nach ' + D.n + ' Kugeln zeigt sich die Glockenkurve der Normalverteilung.', 8000); rimGlow(); });
        }
      }
    } catch (x) { /* Eggs dürfen nie stören */ }
  }
  function afterDraw() { if (!enabled()) return; ensureShapes(); scheduleCheck(); }

  // Umhüllungen (nur lesend): Zeichnen, Graphenfenster, gemalte Szene
  function wrapGlobals() {
    try {
      if (typeof window.draw === 'function' && !window.draw._egg) {
        const d0 = window.draw, d1 = function () { const r = d0.apply(this, arguments); try { afterDraw(); } catch (e) {} return r; };
        d1._egg = true; window.draw = d1;
      }
      if (typeof window.difFrame === 'function' && !window.difFrame._egg) {
        const f0 = window.difFrame, f1 = function (S) { const m = f0.apply(this, arguments); try { if (S && m && m.win && m.R - m.L > 20) (S._eggMaps || (S._eggMaps = [])).push(m); } catch (e) {} return m; };
        f1._egg = true; window.difFrame = f1;
      }
      if (typeof window.statPaint === 'function' && !window.statPaint._egg) {
        const p0 = window.statPaint, p1 = function (S) { try { lastMaps = (S && S._eggMaps) || []; lastMapsEnv = envCur(); } catch (e) {} return p0.apply(this, arguments); };
        p1._egg = true; window.statPaint = p1;
      }
    } catch (e) {}
  }

  // ═════════════════════════ Tasten: Konami (24), π (25), «eggs» (31) ═════════════════════════
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kpos = 0, rainbowOn = false;
  function toggleRainbow() {
    rainbowOn = !rainbowOn;
    document.body.classList.toggle('egg-rainbow', rainbowOn);
    markFound('konami');
    toast(rainbowOn ? 'Regenbogen-Modus an – nochmals ↑↑↓↓←→←→ B A zum Ausschalten.' : 'Regenbogen-Modus aus.', 4200);
    if (rainbowOn) confetti(100);
  }
  function stopRainbow() { if (rainbowOn) { rainbowOn = false; document.body.classList.remove('egg-rainbow'); } }
  let piBuf = '', piMode = null, letters = '';
  function piEnd() {
    if (!piMode) return;
    const n = piMode.pos - 1; clearTimeout(piMode.timer); piMode = null;
    toast('Du kennst π auf ' + n + ' Nachkommastellen: 3,' + PI_DIGITS.slice(1, n + 1) + ' … Die nächste Ziffer wäre eine ' + PI_DIGITS[n + 1] + ' gewesen.', 8000);
    if (n >= 20) confetti(160);
  }
  function piKey(d) {
    if (piMode) {
      clearTimeout(piMode.timer);
      if (d === PI_DIGITS[piMode.pos]) {
        piMode.pos++;
        toast('3,' + PI_DIGITS.slice(1, piMode.pos) + ' – ' + (piMode.pos - 1) + ' Nachkommastellen', 6000);
        piMode.timer = setTimeout(piEnd, 6000);
        if (piMode.pos >= PI_DIGITS.length) piEnd();
      } else piEnd();
      return;
    }
    piBuf = (piBuf + d).slice(-5);
    if (piBuf === '31415') {
      piBuf = ''; markFound('pi');
      piMode = { pos: 5, timer: setTimeout(piEnd, 8000) };
      digitRain(PI_DIGITS, 3200);
      toast('π-Modus: Tippe einfach weiter – wie viele Stellen von π kennst du?', 6000);
    }
  }
  document.addEventListener('keydown', e => {
    if (!enabled() || e.metaKey || e.ctrlKey || e.altKey) return;
    const a = document.activeElement, tag = a && a.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'MATH-FIELD' || (a && a.isContentEditable)) { kpos = 0; return; }
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === KONAMI[kpos]) { kpos++; if (kpos === KONAMI.length) { kpos = 0; toggleRainbow(); } }
    else kpos = (k === KONAMI[0]) ? 1 : 0;
    if (/^[0-9]$/.test(k)) piKey(k); else if (piMode && k.length === 1) piEnd();
    if (/^[a-z]$/.test(k)) { letters = (letters + k).slice(-4); if (letters === 'eggs') { letters = ''; cardAlbum(); } }
  });

  // ═════════════════════════ Kalender (29, 30) ═════════════════════════
  function holidayFor(date) {
    const m = date.getMonth() + 1, d = date.getDate();
    if (m === 3 && d === 14) return ['piday', 'Alles Gute zum Pi-Tag! 3/14 – π ≈ 3,14159 …'];
    if (m === 6 && d === 28) return ['piday', 'Fröhlichen Tau-Tag! 6/28 – τ = 2π ≈ 6,28318 …, eine ganze Umdrehung.'];
    if (m === 4 && d === 15) return ['bday', 'Heute ist der Geburtstag von Leonhard Euler (1707, Basel) – von ihm stammen e, i, π als Kreiszahl und die Schreibweise f(x).'];
    if (m === 4 && d === 30) return ['bday', 'Heute ist der Geburtstag von Carl Friedrich Gauss (1777) – dem «Fürsten der Mathematik».'];
    if (m === 3 && d === 23) return ['bday', 'Heute ist der Geburtstag von Emmy Noether (1882) – eine der bedeutendsten Mathematikerinnen, Pionierin der modernen Algebra.'];
    if (m === 12 && d === 10) return ['bday', 'Heute ist der Geburtstag von Ada Lovelace (1815) – sie schrieb das erste Computerprogramm.'];
    return null;
  }
  function checkHoliday(date, force) {
    if (!enabled()) return;
    const h = holidayFor(date || new Date());
    if (!h) return;
    const day = (date || new Date()).toDateString();
    if (!force && lsGet(LS_DAY) === day) return;
    lsSet(LS_DAY, day); markFound(h[0]);
    toast(h[1], 8000); confetti(160);
  }

  // ═════════════════════════ Spiele (26 Parabelschiessen, 27 Nullstellen-Jagd) ═════════════════════════
  const XR = 6, YR = 4.5;
  let G = null, Z = null, gKind = 'parabel', gOv = null, gCv = null, gLevel = 1, gBest = parseInt(lsGet(LS_BEST) || '1', 10) || 1, zRaf = 0;
  function polyText(a, b, c) {
    let s = '', first = true;
    const term = (co, v) => {
      if (Math.abs(co) < 1e-9) return;
      const sign = co < 0 ? MINUS : '+', m = Math.abs(co), t = ((Math.abs(m - 1) < 1e-9 && v) ? '' : fmtN(m)) + v;
      if (first) { s += (co < 0 ? MINUS : '') + t; first = false; } else s += ' ' + sign + ' ' + t;
    };
    term(a, 'x²'); term(b, 'x'); term(c, '');
    return 'y = ' + (s || '0');
  }
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  function genLevel(n) {
    const range = (lo, hi, st) => { const r = []; for (let v = lo; v <= hi + 1e-9; v += st) r.push(Math.round(v * 100) / 100); return r; };
    let As, Bs, Cs, xr;
    if (n <= 2) { As = [-1, -0.5, 0.5, 1]; Bs = range(-2, 2, 1); Cs = range(-2, 2, 1); xr = [-3, 3]; }
    else if (n <= 5) { As = range(-1.5, 1.5, 0.25).filter(v => v !== 0); Bs = range(-3, 3, 0.5); Cs = range(-3, 3, 0.5); xr = [-4, 4]; }
    else { As = range(-2, 2, 0.25).filter(v => v !== 0); Bs = range(-4, 4, 0.25); Cs = range(-4, 4, 0.25); xr = [-5, 5]; }
    for (let tries = 0; tries < 4000; tries++) {
      const a = pick(As), b = pick(Bs), c = pick(Cs);
      const xs = []; let guard = 0;
      while (xs.length < 3 && guard++ < 50) { const x = xr[0] + Math.floor(Math.random() * (xr[1] - xr[0] + 1)); if (!xs.includes(x)) xs.push(x); }
      if (xs.length < 3) continue;
      const stars = xs.map(x => ({ x, y: a * x * x + b * x + c }));
      if (stars.some(s => Math.abs(s.y) > 3.7)) continue;
      let ok = true;
      for (let i = 0; i < 3 && ok; i++) for (let j = i + 1; j < 3; j++) if (Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y) < 1.2) ok = false;
      if (!ok) continue;
      if (stars.some(s => Math.abs(s.x * s.x - s.y) < 0.4)) continue;
      return { n, sol: { a, b, c }, stars, a: 1, b: 0, c: 0, hints: 0, solved: false, reveal: false };
    }
    return { n, sol: { a: 1, b: 0, c: -2 }, stars: [{ x: -2, y: 2 }, { x: 0, y: -2 }, { x: 2, y: 2 }], a: 1, b: 0, c: 0, hints: 0, solved: false, reveal: false };
  }
  const TOL = 0.1;
  const hitOf = (g, s) => Math.abs(g.a * s.x * s.x + g.b * s.x + g.c - s.y) <= TOL;

  function buildGame() {
    gOv = document.createElement('div'); gOv.className = 'egg-ov'; gOv.id = 'egg-game';
    gOv.innerHTML = `
<div class="egg-card" role="dialog" aria-modal="true">
  <div class="egg-head"><div class="egg-tabs"><button type="button" data-g="parabel">Parabelschiessen</button><button type="button" data-g="zeros">Nullstellen-Jagd</button></div>
    <div class="egg-lvl" id="eg-level"></div><button type="button" class="egg-x" id="eg-close" aria-label="Schliessen">✕</button></div>
  <p class="egg-sub" id="eg-sub"></p>
  <canvas id="eg-cv" class="egg-cv"></canvas>
  <div class="egg-eq" id="eg-eq"></div>
  <div class="egg-sl" id="eg-sl">
    <span>a</span><input type="range" id="eg-a" min="-2" max="2" step="0.25"><span class="egg-v" id="eg-av"></span>
    <span>b</span><input type="range" id="eg-b" min="-4" max="4" step="0.25"><span class="egg-v" id="eg-bv"></span>
    <span>c</span><input type="range" id="eg-c" min="-4" max="4" step="0.25"><span class="egg-v" id="eg-cv2"></span>
  </div>
  <div class="egg-foot"><div class="egg-msg" id="eg-msg"></div>
    <button type="button" id="eg-hint">Tipp</button>
    <button type="button" id="eg-next">Neues Level</button></div>
</div>`;
    document.body.appendChild(gOv);
    gCv = gOv.querySelector('#eg-cv');
    gOv.addEventListener('mousedown', e => { if (e.target === gOv) closeGame(); });
    gOv.querySelector('#eg-close').onclick = closeGame;
    gOv.querySelectorAll('.egg-tabs button').forEach(b => b.onclick = () => openGame(b.getAttribute('data-g')));
    ['a', 'b', 'c'].forEach(k => gOv.querySelector('#eg-' + k).addEventListener('input', e => { if (!G) return; G[k] = parseFloat(e.target.value); gUpdate(); }));
    gOv.querySelector('#eg-hint').onclick = () => (gKind === 'zeros' ? zHint() : gHint());
    gOv.querySelector('#eg-next').onclick = () => { if (gKind === 'zeros') zStart(Z && Z.done ? Z.round + 1 : (Z ? Z.round : 1)); else { if (G && G.solved) gLevel++; startLevel(); } };
    gCv.addEventListener('pointerdown', zClick);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (gOv && gOv.classList.contains('open')) { e.stopPropagation(); closeGame(); } else if (cardOv && cardOv.classList.contains('open')) { e.stopPropagation(); closeCard(); } } }, true);
    window.addEventListener('resize', () => { if (gOv && gOv.classList.contains('open')) (gKind === 'zeros' ? zDraw() : gDraw()); });
  }
  function openGame(kind) {
    if (!gOv) buildGame();
    closeCard();
    gKind = kind === 'zeros' ? 'zeros' : kind === 'parabel' ? 'parabel' : gKind;
    markFound(gKind);
    gOv.querySelectorAll('.egg-tabs button').forEach(b => b.classList.toggle('on', b.getAttribute('data-g') === gKind));
    const zz = gKind === 'zeros';
    gOv.querySelector('#eg-sl').style.display = zz ? 'none' : '';
    gOv.querySelector('#eg-eq').style.display = zz ? 'none' : '';
    gOv.querySelector('#eg-sub').textContent = zz ? 'Klicke so schnell wie möglich auf alle Nullstellen des Graphen. Ein Fehlklick kostet 2 Sekunden.' : 'Stelle a, b und c so ein, dass die Parabel durch alle drei Sterne läuft.';
    gOv.classList.add('open');
    cancelAnimationFrame(zRaf);
    if (zz) zStart(Z ? Z.round : 1); else startLevel();
  }
  function closeGame() { if (gOv) gOv.classList.remove('open'); cancelAnimationFrame(zRaf); }
  function startLevel() {
    G = genLevel(gLevel);
    ['a', 'b', 'c'].forEach(k => { gOv.querySelector('#eg-' + k).value = G[k]; });
    gOv.querySelector('#eg-next').classList.remove('primary');
    gOv.querySelector('#eg-next').textContent = 'Neues Level';
    gOv.querySelector('#eg-hint').disabled = false;
    gOv.querySelector('#eg-msg').textContent = '';
    gOv.querySelector('#eg-level').textContent = 'Level ' + G.n + (gBest > 1 ? ' · Rekord: Level ' + gBest : '');
    gUpdate();
  }
  function gHint() {
    if (!G || G.solved) return;
    G.hints++;
    const m = gOv.querySelector('#eg-msg');
    if (G.hints === 1) m.textContent = G.sol.a > 0 ? 'Tipp: Die Parabel ist nach oben geöffnet (a > 0).' : 'Tipp: Die Parabel ist nach unten geöffnet (a < 0).';
    else if (G.hints === 2) m.textContent = 'Tipp: Der Schnittpunkt mit der y-Achse ist c = ' + fmtN(G.sol.c) + '.';
    else { G.reveal = true; m.textContent = 'Die gestrichelte Linie zeigt eine mögliche Lösung.'; gOv.querySelector('#eg-hint').disabled = true; }
    gDraw();
  }
  function gUpdate() {
    const q = id => gOv.querySelector('#' + id);
    q('eg-av').textContent = fmtN(G.a); q('eg-bv').textContent = fmtN(G.b); q('eg-cv2').textContent = fmtN(G.c);
    q('eg-eq').textContent = polyText(G.a, G.b, G.c);
    const hits = G.stars.filter(s => hitOf(G, s)).length;
    if (hits === 3 && !G.solved) {
      G.solved = true;
      if (G.n + 1 > gBest) { gBest = G.n + 1; lsSet(LS_BEST, String(gBest)); }
      confetti(120);
      q('eg-next').classList.add('primary'); q('eg-next').textContent = 'Nächstes Level'; q('eg-hint').disabled = true;
      q('eg-msg').textContent = 'Geschafft! Die Parabel läuft durch alle Sterne.';
    } else if (!G.solved && !(G.hints >= 1 && hits === 0)) q('eg-msg').textContent = hits + ' von 3 Sternen getroffen';
    gDraw();
  }
  // gemeinsames Koordinatensystem der Spiele
  function gFrame() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), cw = gCv.clientWidth || 560, ch = gCv.clientHeight || 420;
    if (gCv.width !== Math.round(cw * dpr) || gCv.height !== Math.round(ch * dpr)) { gCv.width = Math.round(cw * dpr); gCv.height = Math.round(ch * dpr); }
    const cx = gCv.getContext('2d'); cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const P = Object.assign(pal(), { curve: isDark() ? '#60a5fa' : '#2563eb', star: '#8b5cf6' }), W = cw, H = ch;
    const X = x => (x + XR) / (2 * XR) * W, Y = y => (YR - y) / (2 * YR) * H;
    cx.fillStyle = P.bg; cx.fillRect(0, 0, W, H);
    cx.lineWidth = 1; cx.strokeStyle = P.grid; cx.beginPath();
    for (let x = -XR; x <= XR; x++) { cx.moveTo(X(x), 0); cx.lineTo(X(x), H); }
    for (let y = -4; y <= 4; y++) { cx.moveTo(0, Y(y)); cx.lineTo(W, Y(y)); }
    cx.stroke();
    cx.strokeStyle = P.axis; cx.lineWidth = 1.4; cx.beginPath(); cx.moveTo(0, Y(0)); cx.lineTo(W, Y(0)); cx.moveTo(X(0), 0); cx.lineTo(X(0), H); cx.stroke();
    cx.fillStyle = P.muted; cx.font = '11px -apple-system,system-ui,sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'top';
    for (let x = -5; x <= 5; x++) if (x) cx.fillText(String(x).replace('-', MINUS), X(x), Y(0) + 4);
    cx.textAlign = 'right'; cx.textBaseline = 'middle';
    for (let y = -4; y <= 4; y++) if (y) cx.fillText(String(y).replace('-', MINUS), X(0) - 5, Y(y));
    const curve = (g, color, dash, lw) => {
      cx.strokeStyle = color; cx.lineWidth = lw; cx.setLineDash(dash); cx.beginPath();
      let pen = false;
      for (let i = 0; i <= 400; i++) { const x = -XR + 2 * XR * i / 400, y = g(x);
        if (!isFinite(y) || y > YR + 20 || y < -YR - 20) { pen = false; continue; }
        if (!pen) { cx.moveTo(X(x), Y(y)); pen = true; } else cx.lineTo(X(x), Y(y)); }
      cx.stroke(); cx.setLineDash([]);
    };
    const star = (px, py, fill, glow) => {
      const R = 12, r = 5; cx.save(); if (glow) { cx.shadowColor = P.gold; cx.shadowBlur = 14; }
      cx.beginPath(); for (let k = 0; k < 10; k++) { const ang = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? r : R; cx.lineTo(px + rad * Math.cos(ang), py + rad * Math.sin(ang)); }
      cx.closePath(); cx.fillStyle = fill; cx.fill(); cx.lineWidth = 1.2; cx.strokeStyle = P.dk ? '#0b0f18' : '#ffffff'; cx.stroke(); cx.restore();
    };
    return { cx, P, W, H, X, Y, curve, star };
  }
  function gDraw() {
    if (!G || !gCv || gKind !== 'parabel') return;
    const { cx, P, X, Y, curve, star } = gFrame();
    if (G.reveal) curve(x => G.sol.a * x * x + G.sol.b * x + G.sol.c, P.dk ? '#fbbf24aa' : '#f59e0baa', [6, 5], 2);
    curve(x => G.a * x * x + G.b * x + G.c, P.curve, [], 2.6);
    G.stars.forEach(s => {
      const hit = hitOf(G, s), px = X(s.x), py = Y(s.y);
      star(px, py, hit ? P.gold : P.star, hit);
      cx.font = '11.5px -apple-system,system-ui,sans-serif'; cx.textAlign = 'left'; cx.textBaseline = 'bottom';
      const lbl = '(' + fmtN(s.x) + ' | ' + fmtN(Math.round(s.y * 100) / 100) + ')';
      cx.lineJoin = 'round'; cx.lineWidth = 3.5; cx.strokeStyle = P.bg; cx.strokeText(lbl, px + 10, py - 8);
      cx.fillStyle = P.txt; cx.fillText(lbl, px + 10, py - 8);
    });
  }
  // ── Nullstellen-Jagd: Polynom mit k Nullstellen (Vielfache von 0,5), Klick in die Nähe trifft ──
  function zGen(round) {
    const k = Math.min(5, 2 + Math.floor((round - 1) / 2));
    for (let tries = 0; tries < 500; tries++) {
      const R = [];
      while (R.length < k) { const r = Math.round((Math.random() * 9 - 4.5) * 2) / 2; if (R.every(q => Math.abs(q - r) >= 1)) R.push(r); }
      R.sort((a, b) => a - b);
      const raw = x => R.reduce((p, r) => p * (x - r), 1);
      let mx = 0; for (let i = 0; i <= 200; i++) { const x = R[0] - 0.6 + (R[k - 1] - R[0] + 1.2) * i / 200; mx = Math.max(mx, Math.abs(raw(x))); }
      if (!(mx > 0)) continue;
      const a = (Math.random() < 0.5 ? -1 : 1) * 3.2 / mx;
      return { round, R, f: x => a * raw(x), found: R.map(() => false), miss: [], t0: performance.now(), done: false, time: 0, hint: false };
    }
    return null;
  }
  function zStart(round) {
    Z = zGen(round || 1); if (!Z) return;
    const best = parseFloat(lsGet(LS_ZBEST) || '0');
    gOv.querySelector('#eg-level').textContent = 'Runde ' + Z.round + ' · ' + Z.R.length + ' Nullstellen' + (best > 0 ? ' · Bestzeit ' + fmtN(best) + ' s' : '');
    gOv.querySelector('#eg-next').classList.remove('primary'); gOv.querySelector('#eg-next').textContent = 'Neue Runde';
    gOv.querySelector('#eg-hint').disabled = false;
    cancelAnimationFrame(zRaf);
    (function loop() { zDraw(); if (Z && !Z.done && gOv.classList.contains('open') && gKind === 'zeros') zRaf = requestAnimationFrame(loop); })();
  }
  function zClick(e) {
    if (gKind !== 'zeros' || !Z || Z.done) return;
    const r = gCv.getBoundingClientRect(), x = -XR + 2 * XR * (e.clientX - r.left) / r.width, y = YR - 2 * YR * (e.clientY - r.top) / r.height;
    let bi = -1, bd = 1e9; Z.R.forEach((q, i) => { const d = Math.abs(q - x); if (!Z.found[i] && d < bd) { bd = d; bi = i; } });
    if (bi >= 0 && bd <= 0.3 && Math.abs(y) < 1.2) Z.found[bi] = true; else Z.miss.push([x, y]);
    if (Z.found.every(Boolean)) {
      Z.done = true; Z.time = (performance.now() - Z.t0) / 1000 + 2 * Z.miss.length;
      const best = parseFloat(lsGet(LS_ZBEST) || '0'), rec = !(best > 0) || Z.time < best;
      if (rec) lsSet(LS_ZBEST, String(Math.round(Z.time * 10) / 10));
      gOv.querySelector('#eg-msg').textContent = 'Alle ' + Z.R.length + ' Nullstellen in ' + fmtN(Z.time) + ' s' + (Z.miss.length ? ' (davon ' + 2 * Z.miss.length + ' s Strafe)' : '') + (rec ? ' – neue Bestzeit!' : '.');
      gOv.querySelector('#eg-next').classList.add('primary'); gOv.querySelector('#eg-next').textContent = 'Nächste Runde';
      gOv.querySelector('#eg-hint').disabled = true;
      confetti(110);
    }
    zDraw();
  }
  function zHint() { if (!Z || Z.done) return; Z.hint = true; Z.t0 -= 3000; gOv.querySelector('#eg-hint').disabled = true; zDraw(); }
  function zDraw() {
    if (!Z || !gCv || gKind !== 'zeros') return;
    const { cx, P, X, Y, curve, star } = gFrame();
    curve(Z.f, P.curve, [], 2.6);
    if (Z.hint) Z.R.forEach((r, i) => { if (Z.found[i]) return; cx.fillStyle = 'rgba(245,158,11,.18)'; cx.fillRect(X(Math.floor(r)), 0, X(1) - X(0), Y(-YR)); });
    Z.R.forEach((r, i) => { if (Z.found[i]) star(X(r), Y(0), P.gold, true); });
    cx.strokeStyle = P.red; cx.lineWidth = 2.2;
    Z.miss.forEach(m => { const px = X(m[0]), py = Y(m[1]); cx.beginPath(); cx.moveTo(px - 5, py - 5); cx.lineTo(px + 5, py + 5); cx.moveTo(px + 5, py - 5); cx.lineTo(px - 5, py + 5); cx.stroke(); });
    if (!Z.done) gOv.querySelector('#eg-msg').textContent = Z.found.filter(Boolean).length + ' von ' + Z.R.length + ' · ' + fmtN(Math.floor(((performance.now() - Z.t0) / 1000 + 2 * Z.miss.length) * 10) / 10) + ' s';
  }

  // ═════════════════════════ Logo: 5× klicken (Spiele), lange drücken (√10) ═════════════════════════
  function sqrt10Bubble(logo) {
    const r = logo.getBoundingClientRect(), b = el('div', 'egg-bubble');
    b.style.left = Math.round(r.left) + 'px'; b.style.top = Math.round(r.bottom + 8) + 'px';
    document.body.appendChild(b);
    const full = '3,16227766016837933199889354', t0 = performance.now();
    requestAnimationFrame(() => b.classList.add('show'));
    (function step(now) {
      const n = Math.min(full.length, 1 + Math.floor((now - t0) / 70));
      b.textContent = '√10 = ' + full.slice(0, n) + (n < full.length ? '' : ' …');
      if (n < full.length) requestAnimationFrame(step);
      else setTimeout(() => { b.classList.remove('show'); setTimeout(() => b.remove(), 400); }, 3500);
    })(t0);
  }
  // Logo in der Seitenleiste und im Titel der Startseite (Klick auf das Logo öffnet die Startseite, darum zählen beide)
  const LOGO_SEL = '.brand-name, .tp-mark-inline, .brand-logo';
  function hookLogo() {
    let clicks = [], lpT = 0, longDone = false;
    const logoOf = e => (e.target && e.target.closest ? e.target.closest(LOGO_SEL) : null);
    document.addEventListener('pointerdown', e => {
      const logo = logoOf(e); if (!logo || !enabled()) return;
      longDone = false; clearTimeout(lpT);
      lpT = setTimeout(() => { longDone = true; markFound('root10'); sqrt10Bubble(logo); }, 700);
    }, true);
    ['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, () => clearTimeout(lpT), true));
    document.addEventListener('contextmenu', e => { if (longDone && logoOf(e)) e.preventDefault(); }, true);
    document.addEventListener('click', e => {
      if (!logoOf(e)) return;
      if (!enabled() || longDone) { longDone = false; return; }
      const now = Date.now(); clicks = clicks.filter(t => now - t < 3000); clicks.push(now);
      if (clicks.length >= 5) { clicks = []; setTimeout(() => openGame(), 0); }
    }, true);
  }

  // ───────────────────────── Start ─────────────────────────
  function init() {
    const cb = document.getElementById('chk-eggs'); if (cb) cb.checked = enabled();
    hookLogo();
    wrapGlobals();
    setTimeout(() => checkHoliday(), 2500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.EGGS = { onExpr, onView, setEnabled, enabled, toast, confetti, openGame, closeGame, checkHoliday, holidayFor, makeHeart, toggleRainbow,
    checkText, normExpr, wordOf, rightCorner, collatzRun, cardAlbum, cardGauss, cardCollatz, cardBinom, cardNines, spiral, ALBUM, _genLevel: genLevel, _zGen: zGen, _runChecks: runChecks };
})();
