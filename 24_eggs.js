// ============================================================
// 24_eggs.js — Easter-Eggs (kleine, versteckte Überraschungen)
// ------------------------------------------------------------
// Alles hier ist rein optional und greift NICHT in Berechnungen, Lösungswege
// oder Beschriftungen ein. Ein Schalter in den Einstellungen ("Überraschungen")
// schaltet alle Eggs ab (localStorage 'plotter_eggs_on').
//
// Eggs
//   1. "herz" ins Funktionsfeld tippen (auch heart/coeur/corazón/…)
//        → Herzkurve  y = ∛(x²) ± a·√(1−x²)  mit kurzem Herzschlag (Schieber a)
//   2. Zahlen-Eggs: konstante Funktion 42 / 404 / 1337 / 1.618 / π, "1/0" oder
//        e^(iπ)+1 eingeben → kurzer Hinweis
//   3. Extremes Hinaus-/Hineinzoomen → "Universum verlassen" / "Planck-Länge"
//   4. 5× schnell aufs Logo klicken → Minispiel "Parabelschiessen"
//   5. Konami-Code (↑↑↓↓←→←→ B A) → Regenbogen-Modus an/aus
//   6. Mathe-Feiertage (Pi-Tag, Tau-Tag, Geburtstage von Euler/Gauss/Ada
//        Lovelace, Ostern) → Konfetti + kurzer Gruss, einmal pro Tag
//
// Texte stehen auf Deutsch im DOM; 23_autotranslate.js übersetzt sie (Seeds
// für alle Sprachen sind mitgeliefert).
//
// Einhängepunkte (alle optional-verkettet, d.h. ohne diese Datei läuft alles):
//   06_ui_functions.js  → EGGS.onExpr(fn, i, raw)   im 'input'-Handler der Funktionsfelder
//   08_draw.js          → EGGS.onView(v)            am Anfang von draw()
//   04_analysis.js      → fn.noSpecials             überspringt Spezialpunkte (Herz)
// ============================================================
(function () {
  'use strict';

  const LS_ON = 'plotter_eggs_on', LS_DAY = 'plotter_eggs_day', LS_BEST = 'plotter_eggs_best';
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const MINUS = '−';
  const isDark = () => { try { return typeof darkMode !== 'undefined' && !!darkMode; } catch (e) { return false; } };
  const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

  function enabled() { return lsGet(LS_ON) !== '0'; }
  function setEnabled(on) {
    lsSet(LS_ON, on ? '1' : '0');
    const cb = document.getElementById('chk-eggs'); if (cb) cb.checked = !!on;
    if (!on) { closeGame(); }
  }

  // ───────────────────────── Styles ─────────────────────────
  const css = document.createElement('style');
  css.textContent = `
#egg-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,16px);max-width:min(560px,calc(100vw - 32px));
  background:var(--bg-sidebar,#fff);color:var(--text,#1f2937);border:1px solid var(--border,#d6dae1);border-radius:12px;
  box-shadow:0 8px 28px rgba(20,28,50,.22);padding:10px 16px;font-size:13.5px;line-height:1.45;z-index:10050;
  opacity:0;pointer-events:none;transition:opacity .25s ease,transform .25s ease;text-align:center;}
#egg-toast.show{opacity:1;transform:translate(-50%,0);}
#egg-confetti{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:10040;}
.egg-ov{position:fixed;inset:0;background:rgba(15,20,35,.5);z-index:10030;display:none;align-items:center;justify-content:center;padding:12px;}
.egg-ov.open{display:flex;}
.egg-card{background:var(--bg-sidebar,#fff);color:var(--text,#1f2937);border:1px solid var(--border,#d6dae1);border-radius:16px;
  box-shadow:0 18px 60px rgba(0,0,0,.35);width:min(640px,100%);max-height:calc(100vh - 24px);overflow:auto;padding:14px 16px 14px;}
.egg-head{display:flex;align-items:center;gap:10px;margin-bottom:2px;}
.egg-head b{font-size:16px;}
.egg-head .egg-lvl{margin-left:auto;font-size:12px;color:var(--text-muted,#6b7280);}
.egg-head button{border:0;background:transparent;color:var(--text-muted,#6b7280);font-size:16px;cursor:pointer;padding:2px 6px;border-radius:6px;}
.egg-head button:hover{background:rgba(127,127,127,.15);}
.egg-sub{font-size:12.5px;color:var(--text-muted,#6b7280);margin:0 0 8px;}
#eg-cv{width:100%;aspect-ratio:4/3;display:block;border-radius:10px;border:1px solid var(--border,#d6dae1);touch-action:none;}
.egg-eq{margin:8px 0 4px;font-family:'KaTeX_Main','Cambria Math',Georgia,serif;font-size:17px;text-align:center;min-height:24px;}
.egg-sl{display:grid;grid-template-columns:22px 1fr 54px;gap:6px 10px;align-items:center;margin:4px 0 8px;font-size:13px;}
.egg-sl input[type=range]{width:100%;}
.egg-sl .egg-v{text-align:right;font-variant-numeric:tabular-nums;}
.egg-foot{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.egg-foot .egg-msg{flex:1;min-width:160px;font-size:13px;}
.egg-foot button{border:1px solid var(--border,#d6dae1);background:var(--bg-input,#fff);color:var(--text,#1f2937);padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12.5px;}
.egg-foot button.primary{background:#378ADD;border-color:#378ADD;color:#fff;}
.egg-foot button:disabled{opacity:.45;cursor:default;}
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
  }

  // ───────────────────────── Konfetti ─────────────────────────
  let confCv = null, confRaf = 0;
  function confetti(n) {
    if (reducedMotion()) return;
    if (!confCv) { confCv = document.createElement('canvas'); confCv.id = 'egg-confetti'; document.body.appendChild(confCv); }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = confCv.width = innerWidth * dpr, H = confCv.height = innerHeight * dpr;
    const cx = confCv.getContext('2d');
    const cols = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    const P = [];
    for (let i = 0; i < (n || 140); i++) P.push({
      x: W * (0.2 + 0.6 * Math.random()), y: H * 0.35 + (Math.random() - .5) * 40 * dpr,
      vx: (Math.random() - .5) * 14 * dpr, vy: (-6 - Math.random() * 11) * dpr,
      s: (4 + Math.random() * 6) * dpr, r: Math.random() * 6.28, vr: (Math.random() - .5) * .4,
      c: cols[i % cols.length], life: 0
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

  // ───────────────────────── Egg 1+2: Eingabe-Eggs ─────────────────────────
  const HEART_WORDS = new Set(['herz', 'heart', 'coeur', 'corazon', 'cuore', 'serce', 'srdce', 'καρδια', 'καρδιά', 'kappaalpharhodeltaiota', 'szív', 'szivem', 'szív'.normalize('NFD').replace(/[̀-ͯ]/g, '')]);
  function normWord(raw) {
    return String(raw || '').replace(/EC/g, 'e').toLowerCase().replace(/\\[a-z]+/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/œ/g, 'oe').replace(/[^a-zα-ω]/g, '');
  }
  const HEART_UP = '(x^2)^(1/3)+a*sqrt(1-x^2)', HEART_UP_NOA = '(x^2)^(1/3)+sqrt(1-x^2)';
  const HEART_DN = '(x^2)^(1/3)-a*sqrt(1-x^2)', HEART_DN_NOA = '(x^2)^(1/3)-sqrt(1-x^2)';

  function makeHeart(i) {
    if (!functions[i]) return;
    const aUsedElsewhere = functions.some((f, j) => j !== i && typeof extractParams === 'function' && extractParams(f.expr).includes('a'));
    const col = '#e11d48';
    const up = aUsedElsewhere ? HEART_UP_NOA : HEART_UP, dn = aUsedElsewhere ? HEART_DN_NOA : HEART_DN;
    const f1 = functions[i];
    f1.expr = up; f1.color = col; f1.noSpecials = true; f1.visible = true;
    functions.push({ expr: dn, color: col, visible: true, noSpecials: true });
    if (!aUsedElsewhere) { params.a = { val: 1, min: 0.6, max: 1.4, step: 0.01 }; }
    // Ansicht auf das Herz einpassen (Seitenverhältnis des Zeichenbereichs beibehalten)
    try {
      const r = canvas.clientWidth / Math.max(1, canvas.clientHeight);
      const hh = 2.4, cy = 0.3; view = { xmin: -hh * r, xmax: hh * r, ymin: cy - hh, ymax: cy + hh };
      syncInputs();
    } catch (e) {}
    clearEvalCache(); renderFuncList(); syncParams();
    if (!aUsedElsewhere && params.a) { params.a = { val: 1, min: 0.6, max: 1.4, step: 0.01 }; syncParams(); }
    scheduleComputeSpecials(); scheduleDraw();
    try { pushHistory(); } catch (e) {}
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
      // 3 Schläge, "Lub-dub": zwei kurze Pulse pro Schlag, abklingend
      const ph = (k * 3) % 1;
      const pulse = Math.exp(-Math.pow((ph - 0.12) / 0.07, 2)) + 0.6 * Math.exp(-Math.pow((ph - 0.34) / 0.08, 2));
      params.a.val = 1 + 0.16 * pulse * (1 - k * 0.5);
      clearEvalCache(); scheduleDraw();
      beatRaf = requestAnimationFrame(step);
    })(t0);
  }

  const seen = {};              // pro Sitzung jedes Zahlen-Egg nur einmal pro "Eintippen"
  let lastEggKey = '';
  function constValue(raw) {
    if (typeof safeEval !== 'function') return null;
    const xs = [0.37, 1.91, -2.6]; let v0 = null;
    for (const x of xs) {
      const y = safeEval(raw, x);
      if (!isFinite(y)) return null;
      if (v0 === null) v0 = y; else if (Math.abs(y - v0) > 1e-12 * Math.max(1, Math.abs(v0))) return null;
    }
    return v0;
  }
  function onExpr(fn, i, raw) {
    if (!enabled() || !raw) return;
    const compact = String(raw).replace(/\s+/g, '').toLowerCase();
    let key = '';
    // Herz
    if (HEART_WORDS.has(normWord(raw)) && compact.length <= 40) {
      key = 'heart'; if (lastEggKey !== key) { lastEggKey = key; setTimeout(() => makeHeart(i), 0); } return;
    }
    // e^(iπ)+1  → 0
    const eul = compact.replace(/\*/g, '').replace(/π/g, 'pi').replace(/ec/g, 'e');
    // auch die Variante, die beim linearen Tippen entsteht: e^(i·π+1) (die Klammer schliesst den Exponenten nicht)
    if (/^(e\^\(?(ipi|pii)\)?\+1|1\+e\^\(?(ipi|pii)\)?|e\^\((ipi|pii)\+1\))$/.test(eul)) {
      key = 'euler';
      if (lastEggKey !== key) {
        lastEggKey = key;
        setTimeout(() => {
          if (functions[i]) { functions[i].expr = '0'; clearEvalCache(); renderFuncList(); syncParams(); scheduleComputeSpecials(); scheduleDraw(); }
          toast('e^(iπ) + 1 = 0 – fünf Konstanten, eine Gleichung. Der Graph ist die x-Achse.', 6000);
        }, 0);
      }
      return;
    }
    // Division durch null
    if (/^[\dx.+*()-]*\/\(?0(\.0*)?\)?$/.test(compact) && /\d|x/.test(compact)) {
      key = 'div0';
      if (lastEggKey !== key) { lastEggKey = key; toast('Durch null teilt man nicht. Hier beginnen die Drachen.', 5200); }
      return;
    }
    // konstante Funktionen mit "Persönlichkeit"
    const v = constValue(raw);
    if (v !== null) {
      let msg = '';
      if (v === 42) { key = 'c42'; msg = '42 – die Antwort auf die Frage nach dem Leben, dem Universum und dem ganzen Rest.'; }
      else if (v === 404) { key = 'c404'; msg = '404 – Nullstelle nicht gefunden. (Eine Konstante ungleich 0 hat auch keine.)'; }
      else if (v === 1337) { key = 'c1337'; msg = '1337 – elite. Eine Konstante mit Stil.'; }
      else if (Math.abs(v - 1.6180339887) < 5e-4) { key = 'cphi'; msg = 'φ ≈ 1,618 – der Goldene Schnitt.'; }
      else if (Math.abs(v - Math.PI) < 6e-4) { key = 'cpi'; msg = 'π – unendlich viele Nachkommastellen, aber hier nur eine Gerade.'; }
      if (msg) { if (lastEggKey !== key) { lastEggKey = key; toast(msg, 5600); } return; }
    }
    lastEggKey = '';
  }

  // ───────────────────────── Egg 3: Zoom ─────────────────────────
  let zoomState = 0; // 0 normal, 1 draussen, -1 drinnen
  function onView(v) {
    if (!v) return;
    const w = Math.abs(v.xmax - v.xmin);
    if (!isFinite(w)) return;
    if (w > 2e6) {
      if (zoomState !== 1 && enabled()) { zoomState = 1; toast('Du hast das Universum verlassen. Hier draussen gibt es nur noch Pixel.', 5500); }
    } else if (w < 2e-6) {
      if (zoomState !== -1 && enabled()) { zoomState = -1; toast('Planck-Länge erreicht – noch kleiner geht es nicht (zumindest nicht schön).', 5500); }
    } else if (w < 1e5 && w > 1e-3) zoomState = 0;
  }

  // ───────────────────────── Egg 5: Konami ─────────────────────────
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kpos = 0, rainbowOn = false;
  function hsl2hex(h, s, l) {
    s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => { const c = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return Math.round(255 * c).toString(16).padStart(2, '0'); };
    return '#' + f(0) + f(8) + f(4);
  }
  function toggleRainbow() {
    rainbowOn = !rainbowOn;
    const n = functions.length;
    functions.forEach((fn, i) => {
      if (rainbowOn) { if (fn._eggColor === undefined) fn._eggColor = fn.color; fn.color = hsl2hex((i * 360 / Math.max(n, 6)) % 360, 85, isDark() ? 62 : 50); }
      else if (fn._eggColor !== undefined) { fn.color = fn._eggColor; delete fn._eggColor; }
    });
    try { // nur die Farbpunkte aktualisieren (renderFuncList() würde den Fokus in ein Eingabefeld ziehen)
      const dots = document.querySelectorAll('#func-list .dot');
      functions.forEach((fn, i) => { if (dots[i]) dots[i].style.background = fn.color; });
      if (typeof updateFuncLabelsOverlay === 'function') updateFuncLabelsOverlay();
      scheduleDraw();
    } catch (e) {}
    toast(rainbowOn ? 'Regenbogen-Modus an – nochmal ↑↑↓↓←→←→ B A zum Ausschalten.' : 'Regenbogen-Modus aus.', 4200);
    confetti(100);
  }
  document.addEventListener('keydown', e => {
    if (!enabled()) return;
    const el = document.activeElement, tag = el && el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'MATH-FIELD' || (el && el.isContentEditable)) { kpos = 0; return; }
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === KONAMI[kpos]) { kpos++; if (kpos === KONAMI.length) { kpos = 0; toggleRainbow(); } }
    else kpos = (k === KONAMI[0]) ? 1 : 0;
  });

  // ───────────────────────── Egg 6: Mathe-Feiertage ─────────────────────────
  function easterSunday(y) { // Gauss'sche Osterformel
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
    return { m: mo, d: da };
  }
  function holidayFor(date) {
    const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
    const E = easterSunday(y), es = new Date(y, E.m - 1, E.d), dd = Math.round((new Date(y, m - 1, d) - es) / 864e5);
    if (dd === 0 || dd === 1) return 'Frohe Ostern! Das Datum dafür berechnet man übrigens mit der Osterformel von Gauss.';
    if (m === 3 && d === 14) return 'Alles Gute zum Pi-Tag! π ≈ 3,14159 …';
    if (m === 6 && d === 28) return 'Happy Tau-Tag! τ = 2π ≈ 6,28318 …';
    if (m === 4 && d === 15) return 'Heute ist Eulers Geburtstag (1707) – von ihm stammen e, i und die Schreibweise f(x).';
    if (m === 4 && d === 30) return 'Heute ist der Geburtstag von Carl Friedrich Gauss (1777) – der Mathematikerfürst.';
    if (m === 12 && d === 10) return 'Heute ist der Geburtstag von Ada Lovelace (1815) – der ersten Programmiererin.';
    return null;
  }
  function checkHoliday(date, force) {
    if (!enabled()) return;
    const msg = holidayFor(date || new Date());
    if (!msg) return;
    const day = (date || new Date()).toDateString();
    if (!force && lsGet(LS_DAY) === day) return;
    lsSet(LS_DAY, day);
    toast(msg, 7000); confetti(160);
  }

  // ───────────────────────── Egg 4: Minispiel "Parabelschiessen" ─────────────────────────
  const XR = 6, YR = 4.5;
  let G = null, gOv = null, gCv = null, gCx = null, gLevel = 1, gBest = parseInt(lsGet(LS_BEST) || '1', 10) || 1;

  const fmtN = v => { let s = (Math.round(v * 100) / 100).toString(); if (s === '-0') s = '0'; return s.replace('-', MINUS).replace('.', ','); };
  function polyText(a, b, c) {
    let s = '', first = true;
    const term = (co, v) => {
      if (Math.abs(co) < 1e-9) return;
      const sign = co < 0 ? MINUS : '+', m = Math.abs(co);
      let mag = (Math.abs(m - 1) < 1e-9 && v) ? '' : fmtN(m);
      const t = mag + v;
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
      // Sterne nicht zu nah beieinander und nicht schon vom Startzustand (y = x²) getroffen
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
  <div class="egg-head"><b>Parabelschiessen</b><span class="egg-lvl" id="eg-level"></span><button type="button" id="eg-close" aria-label="Schliessen">✕</button></div>
  <p class="egg-sub">Stelle a, b und c so ein, dass die Parabel durch alle drei Sterne läuft.</p>
  <canvas id="eg-cv"></canvas>
  <div class="egg-eq" id="eg-eq"></div>
  <div class="egg-sl">
    <span>a</span><input type="range" id="eg-a" min="-2" max="2" step="0.25"><span class="egg-v" id="eg-av"></span>
    <span>b</span><input type="range" id="eg-b" min="-4" max="4" step="0.25"><span class="egg-v" id="eg-bv"></span>
    <span>c</span><input type="range" id="eg-c" min="-4" max="4" step="0.25"><span class="egg-v" id="eg-cv2"></span>
  </div>
  <div class="egg-foot"><span class="egg-msg" id="eg-msg"></span>
    <button type="button" id="eg-hint">Tipp</button>
    <button type="button" id="eg-next">Neues Level</button></div>
</div>`;
    document.body.appendChild(gOv);
    gCv = gOv.querySelector('#eg-cv');
    gOv.addEventListener('mousedown', e => { if (e.target === gOv) closeGame(); });
    gOv.querySelector('#eg-close').onclick = closeGame;
    ['a', 'b', 'c'].forEach(k => gOv.querySelector('#eg-' + k).addEventListener('input', e => { if (!G) return; G[k] = parseFloat(e.target.value); gUpdate(); }));
    gOv.querySelector('#eg-hint').onclick = gHint;
    gOv.querySelector('#eg-next').onclick = () => { if (G && G.solved) gLevel++; startLevel(); };
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && gOv && gOv.classList.contains('open')) { e.stopPropagation(); closeGame(); } }, true);
    window.addEventListener('resize', () => { if (gOv && gOv.classList.contains('open')) gDraw(); });
  }
  function openGame() {
    if (!gOv) buildGame();
    gOv.classList.add('open');
    startLevel();
  }
  function closeGame() { if (gOv) gOv.classList.remove('open'); }
  function startLevel() {
    G = genLevel(gLevel);
    ['a', 'b', 'c'].forEach(k => { gOv.querySelector('#eg-' + k).value = G[k]; });
    gOv.querySelector('#eg-next').classList.remove('primary');
    gOv.querySelector('#eg-next').textContent = 'Neues Level';
    gOv.querySelector('#eg-hint').disabled = false;
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
    } else if (!G.solved && (G.hints === 0 || hits > 0)) {
      if (!(G.hints >= 1 && hits === 0)) q('eg-msg').textContent = hits + ' von 3 Sternen getroffen';
    }
    gDraw();
  }
  function gDraw() {
    if (!G || !gCv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), cw = gCv.clientWidth || 560, ch = gCv.clientHeight || 420;
    if (gCv.width !== Math.round(cw * dpr) || gCv.height !== Math.round(ch * dpr)) { gCv.width = Math.round(cw * dpr); gCv.height = Math.round(ch * dpr); }
    const cx = gCv.getContext('2d'); cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const dk = isDark(), W = cw, H = ch;
    const P = { bg: dk ? '#141a26' : '#f8fafc', grid: dk ? '#232c3d' : '#e5e9f0', axis: dk ? '#6b7690' : '#8a93a6', txt: dk ? '#94a0b8' : '#6b7280', curve: dk ? '#60a5fa' : '#2563eb', star: '#8b5cf6', gold: '#f59e0b' };
    const X = x => (x + XR) / (2 * XR) * W, Y = y => (YR - y) / (2 * YR) * H;
    cx.fillStyle = P.bg; cx.fillRect(0, 0, W, H);
    cx.lineWidth = 1; cx.strokeStyle = P.grid; cx.beginPath();
    for (let x = -XR; x <= XR; x++) { cx.moveTo(X(x), 0); cx.lineTo(X(x), H); }
    for (let y = -4; y <= 4; y++) { cx.moveTo(0, Y(y)); cx.lineTo(W, Y(y)); }
    cx.stroke();
    cx.strokeStyle = P.axis; cx.lineWidth = 1.4; cx.beginPath(); cx.moveTo(0, Y(0)); cx.lineTo(W, Y(0)); cx.moveTo(X(0), 0); cx.lineTo(X(0), H); cx.stroke();
    cx.fillStyle = P.txt; cx.font = '11px -apple-system,system-ui,sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'top';
    for (let x = -5; x <= 5; x++) if (x) cx.fillText(String(x).replace('-', MINUS), X(x), Y(0) + 4);
    cx.textAlign = 'right'; cx.textBaseline = 'middle';
    for (let y = -4; y <= 4; y++) if (y) cx.fillText(String(y).replace('-', MINUS), X(0) - 5, Y(y));
    const curve = (a, b, c, color, dash, lw) => {
      cx.strokeStyle = color; cx.lineWidth = lw; cx.setLineDash(dash); cx.beginPath();
      let pen = false;
      for (let i = 0; i <= 300; i++) { const x = -XR + 2 * XR * i / 300, y = a * x * x + b * x + c;
        if (y > YR + 20 || y < -YR - 20) { pen = false; continue; }
        if (!pen) { cx.moveTo(X(x), Y(y)); pen = true; } else cx.lineTo(X(x), Y(y)); }
      cx.stroke(); cx.setLineDash([]);
    };
    if (G.reveal) curve(G.sol.a, G.sol.b, G.sol.c, dk ? '#fbbf24aa' : '#f59e0baa', [6, 5], 2);
    curve(G.a, G.b, G.c, P.curve, [], 2.6);
    G.stars.forEach(s => {
      const hit = hitOf(G, s), px = X(s.x), py = Y(s.y), R = 12, r = 5;
      cx.save();
      if (hit) { cx.shadowColor = P.gold; cx.shadowBlur = 14; }
      cx.beginPath();
      for (let k = 0; k < 10; k++) { const ang = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? r : R; cx.lineTo(px + rad * Math.cos(ang), py + rad * Math.sin(ang)); }
      cx.closePath(); cx.fillStyle = hit ? P.gold : P.star; cx.fill();
      cx.lineWidth = 1.2; cx.strokeStyle = dk ? '#0b0f18' : '#ffffff'; cx.stroke(); cx.restore();
      cx.font = '11.5px -apple-system,system-ui,sans-serif'; cx.textAlign = 'left'; cx.textBaseline = 'bottom';
      const lbl = '(' + fmtN(s.x) + ' | ' + fmtN(Math.round(s.y * 100) / 100) + ')';
      cx.lineJoin = 'round'; cx.lineWidth = 3.5; cx.strokeStyle = P.bg; cx.strokeText(lbl, px + 10, py - 8); // Halo, damit Achsenzahlen nicht stören
      cx.fillStyle = dk ? '#c3cbe0' : '#475569'; cx.fillText(lbl, px + 10, py - 8);
    });
  }

  // Logo: 5 Klicks innerhalb von 2,5 s
  function hookLogo() {
    const logo = document.querySelector('.brand-logo') || document.querySelector('.brand');
    if (!logo) return;
    let clicks = [];
    logo.addEventListener('click', () => {
      if (!enabled()) return;
      const now = Date.now(); clicks = clicks.filter(t => now - t < 2500); clicks.push(now);
      if (clicks.length >= 5) { clicks = []; openGame(); }
    });
  }

  // ───────────────────────── Start ─────────────────────────
  function init() {
    const cb = document.getElementById('chk-eggs'); if (cb) cb.checked = enabled();
    hookLogo();
    setTimeout(() => checkHoliday(), 2500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.EGGS = { onExpr, onView, setEnabled, enabled, toast, confetti, openGame, closeGame, checkHoliday, holidayFor, makeHeart, toggleRainbow, _genLevel: genLevel };
})();
