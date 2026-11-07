// ═══════════════════════════════════════════════════════════════════
// 31_bars2d.js — Balken bei Funktionen («Stellen auswerten», 2D)
//
// Für eine gewählte Funktion f werden an den Stellen x = k·h (k ganzzahlig)
// Balken von der x-Achse bis zum Funktionswert gezeichnet. Mit dem Schieber
// wird der Abstand h verkleinert; im Grenzfall h = 0 werden keine Balken mehr
// gezeichnet, dafür erscheint die ganze Funktion (Grenzwert-Idee).
//
// Aufbau wie bei den anderen Modulen: reiner Kern (fbBars, fbNum, node-testbar),
// darunter Zustand FB, Zeichnen, Panel, Undo/Speichern und LaTeX. Einhängepunkte
// in den bestehenden Dateien sind alle optional-verkettet (typeof … === 'function'):
//   08_draw.js     fbDraw(w,h) vor den Funktionsgraphen; fbHides(fn) überspringt die Kurve
//   09_events.js   fbCapture() / fbApply()
//   07_export.js   fbLatex(o) und fbHides(fn)
//   06_ui_functions.js renderFuncList() → fbSync()
// ═══════════════════════════════════════════════════════════════════

const FB_MAXBARS = 600;

// ── Reiner Kern ──────────────────────────────────────────────────────
// Stellen x = k·h im Bereich [xmin, xmax] (und im Definitionsbereich) mit
// endlichem Funktionswert. Gibt es mehr als cap Stellen, wird h zu einem
// ganzzahligen Vielfachen vergröbert (coarse = true), damit die Stellen weiterhin
// auf dem ursprünglichen Raster liegen.
function fbBars(f, xmin, xmax, h, opt) {
  opt = opt || {};
  const cap = opt.cap > 0 ? opt.cap : FB_MAXBARS;
  if (!(h > 0) || !(xmax > xmin)) return { pts: [], step: 0, coarse: false };
  let step = h, coarse = false;
  const count = s => Math.floor(xmax / s + 1e-9) - Math.ceil(xmin / s - 1e-9) + 1;
  if (count(step) > cap) {
    let m = Math.ceil(count(step) / cap);
    step = Math.round(h * m * 1e9) / 1e9;
    coarse = true;
    while (count(step) > cap) { m++; step = Math.round(h * m * 1e9) / 1e9; }
  }
  const k0 = Math.ceil(xmin / step - 1e-9), k1 = Math.floor(xmax / step + 1e-9);
  const pts = [];
  for (let k = k0; k <= k1; k++) {
    const x = Math.round(k * step * 1e9) / 1e9;
    if (opt.dmin != null && x < opt.dmin - 1e-9) continue;
    if (opt.dmax != null && x > opt.dmax + 1e-9) continue;
    const y = f(x);
    if (typeof y !== 'number' || !isFinite(y)) continue;
    pts.push({ x: x === 0 ? 0 : x, y });
  }
  return { pts, step, coarse };
}

// Zahl für Beschriftungen: höchstens 2 Nachkommastellen, kein «-0»
function fbNum(v, prec) {
  const p = Math.pow(10, prec == null ? 2 : prec);
  const r = Math.round(v * p) / p;
  return String(Object.is(r, -0) ? 0 : r).replace('-', '−');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fbBars, fbNum, FB_MAXBARS };
}

// ── Ab hier Browser (braucht DOM, functions[], toCanvas …) ───────────
if (typeof document !== 'undefined') {

const FB = { on: false, idx: 0, step: 1, sstep: 0.1, vals: false, coords: false, curve: false, dots: false };
let FB_state = { tight: false, coarse: false, cstep: 0, n: 0, empty: false };
const $fb = id => document.getElementById(id);

function fbFn() {
  const f = (typeof functions !== 'undefined') ? functions[FB.idx] : null;
  if (!f || !f.expr || !f.expr.trim() || f.visible === false) return null;
  if (/^x\s*=/.test(f.expr.trim())) return null;
  return f;
}
// Wird gerade für diese Funktion mit Balken gezeichnet (Kurve ausgeblendet)?
function fbHides(fn) {
  return !!(FB.on && FB.step > 0 && !FB.curve && fn && fn === fbFn());
}

function fbBarsNow(w) {
  const f = fbFn(); if (!f) return null;
  const v = isoView || view;
  const cap = Math.max(20, Math.min(FB_MAXBARS, Math.floor((w || 800) / 2.5)));
  return fbBars(x => safeEval(f.expr, x), v.xmin, v.xmax, FB.step, { dmin: f.domainMin, dmax: f.domainMax, cap });
}

function fbDraw(w, h) {
  FB_state = { tight: false, coarse: false, cstep: 0, n: 0, empty: false };
  if (!FB.on || !(FB.step > 0)) { fbNote(); return; }
  const f = fbFn(); if (!f) { fbNote(); return; }
  const r = fbBarsNow(w);
  if (!r) { fbNote(); return; }
  const v = isoView || view;
  FB_state.coarse = r.coarse; FB_state.cstep = r.step; FB_state.n = r.pts.length; FB_state.empty = !r.pts.length;
  const px = Math.abs(toCanvas(r.step, 0).cx - toCanvas(0, 0).cx);
  const yR = v.ymax - v.ymin, lim = yR * 50;
  const base = toCanvas(0, 0).cy;
  const bwid = Math.max(bw(1.5), Math.min(bw(8), px * 0.16));
  const col = f.color || '#2563eb';
  ctx.save();
  ctx.setLineDash([]);
  r.pts.forEach(p => {
    const yc = Math.max(v.ymin - lim, Math.min(v.ymax + lim, p.y));
    const c = toCanvas(p.x, yc);
    if (!FB.dots) {
      ctx.fillStyle = col + '99';
      ctx.fillRect(c.cx - bwid / 2, Math.min(base, c.cy), bwid, Math.abs(c.cy - base));
      ctx.fillStyle = col; ctx.fillRect(c.cx - bw(0.6), Math.min(base, c.cy), bw(1.2), Math.abs(c.cy - base));
    }
    if (px >= 6 || FB.dots) { ctx.beginPath(); ctx.arc(c.cx, c.cy, bw(3.5), 0, 2 * Math.PI); ctx.fillStyle = col; ctx.fill(); }
  });
  // Beschriftungen
  if (FB.vals || FB.coords) {
    const fs = bf(11);
    ctx.font = fs + 'px system-ui'; ctx.textAlign = 'center';
    const labs = r.pts.map(p => FB.coords ? '(' + fbNum(p.x) + ' | ' + fbNum(p.y) + ')' : fbNum(p.y));
    const maxW = Math.max(...labs.map(s => ctx.measureText(s).width), 0);
    if (maxW + 4 > px) { FB_state.tight = true; }
    else {
      r.pts.forEach((p, i) => {
        if (p.y < v.ymin - yR || p.y > v.ymax + yR) return;
        const c = toCanvas(p.x, p.y), up = p.y >= 0;
        ctx.textBaseline = up ? 'bottom' : 'top';
        const ty = c.cy + (up ? -bw(7) : bw(7));
        ctx.lineWidth = 3; ctx.strokeStyle = C.bg; ctx.lineJoin = 'round';
        ctx.strokeText(labs[i], c.cx, ty);
        ctx.fillStyle = col; ctx.fillText(labs[i], c.cx, ty);
      });
    }
  }
  ctx.restore();
  fbNote();
}

// ── Zustand (Undo / Speichern) ───────────────────────────────────────
function fbCapture() { return JSON.parse(JSON.stringify(FB)); }
function fbApply(s) {
  const d = { on: false, idx: 0, step: 1, sstep: 0.1, vals: false, coords: false, curve: false, dots: false };
  if (s && typeof s === 'object') {
    d.on = !!s.on; d.idx = s.idx >= 0 ? Math.floor(s.idx) : 0;
    if (s.step >= 0) d.step = s.step;
    if (s.sstep > 0) d.sstep = s.sstep;
    d.vals = !!s.vals; d.coords = !!s.coords; d.curve = !!s.curve; d.dots = !!s.dots;
  }
  Object.assign(FB, d);
}

// ── LaTeX (pgfplots) ─────────────────────────────────────────────────
// o: { xmin, xmax, colors[], coord(fn), uCm }
function fbLatex(o) {
  if (!FB.on || !(FB.step > 0)) return '';
  const f = fbFn(); if (!f) return '';
  const r = fbBars(x => safeEval(f.expr, x), o.xmin, o.xmax, FB.step, { dmin: f.domainMin, dmax: f.domainMax, cap: 400 });
  if (!r.pts.length) return '';
  const col = o.colors[FB.idx % o.colors.length];
  const crd = o.coord;
  const ptW = Math.max(0.6, Math.min(5, r.step * (o.uCm || 1) * 28.45 * 0.2));
  const num = v => fbNum(v).replace('−', '-');
  let s = '  % Balken (Stellen im Abstand ' + num(r.step) + ')\n';
  s += '  \\addplot[' + (FB.dots ? 'only marks, ' : 'ycomb, ') + col + ', line width=' + ptW.toFixed(1) + 'pt, opacity=0.6, mark=*, mark size=1.6pt, mark options={opacity=1}] coordinates {' +
       r.pts.map(p => '(' + crd(p.x) + ',' + crd(p.y) + ')').join(' ') + '};\n';
  if ((FB.vals || FB.coords) && r.pts.length <= 40) {
    r.pts.forEach(p => {
      const t = FB.coords ? '$(' + num(p.x) + '\\,|\\,' + num(p.y) + ')$' : '$' + num(p.y) + '$';
      s += '  \\node[' + (p.y >= 0 ? 'above' : 'below') + ', font=\\scriptsize, ' + col + '] at (axis cs:' + crd(p.x) + ',' + crd(p.y) + ') {' + t + '};\n';
    });
  }
  return s;
}

// ── Panel ────────────────────────────────────────────────────────────
function fbLabel() {
  const l = $fb('fb-stepv'); if (l) l.textContent = String(Math.round(FB.step * 1000) / 1000).replace('.', ',');
}
function fbNote() {
  const n = $fb('fb-note'); if (!n) return;
  n.textContent = '';
  const add = (txt, num) => {
    const d = document.createElement('div'); d.appendChild(document.createTextNode(txt));
    if (num != null) { const s = document.createElement('span'); s.setAttribute('translate', 'no'); s.textContent = num; d.appendChild(s); }
    n.appendChild(d);
  };
  if (FB.on && !fbFn()) add('Wähle eine sichtbare Funktion y = f(x).');
  else if (FB.on && FB.step > 0 && FB_state.empty) add('Im sichtbaren Bereich gibt es keine auswertbaren Stellen.');
  if (FB_state.tight) add('Beschriftung zu eng: Abstand vergrössern oder hineinzoomen.');
  if (FB_state.coarse) add('Zu viele Balken: gezeichnet wird mit Abstand ', String(FB_state.cstep).replace('.', ','));
  if (FB.on && FB.step === 0) add('Abstand 0: die ganze Funktion wird gezeichnet.');
}

// Auswahlliste der Funktionen neu aufbauen
function fbSync() {
  const sel = $fb('fb-fn'); if (!sel || typeof functions === 'undefined') return;
  const prev = FB.idx;
  sel.textContent = '';
  const cand = [];
  functions.forEach((f, i) => { if (f.expr && f.expr.trim() && !/^x\s*=/.test(f.expr.trim())) cand.push(i); });
  cand.forEach(i => {
    const o = document.createElement('option'); o.value = String(i);
    o.textContent = (i + 1) + ': y = ' + functions[i].expr.trim(); o.setAttribute('translate', 'no');
    sel.appendChild(o);
  });
  if (cand.length) {
    if (!cand.includes(FB.idx)) FB.idx = cand[0];
    sel.value = String(FB.idx);
  }
  if (FB.idx !== prev && typeof scheduleDraw === 'function') scheduleDraw();
  sel.style.display = cand.length ? '' : 'none';
  const none = $fb('fb-none'); if (none) none.style.display = cand.length ? 'none' : '';
  const on = $fb('fb-on'); if (on) on.checked = FB.on;
  ['fb-vals', 'fb-coords', 'fb-dots'].forEach(id => { const c = $fb(id); if (c) c.checked = !!FB[id.slice(3)]; });
  const hc = $fb('fb-hide'); if (hc) hc.checked = !FB.curve;
  const ss = $fb('fb-sstep'); if (ss) ss.value = String(FB.sstep);
  const st = $fb('fb-step'); if (st) { st.step = FB.sstep; st.value = FB.step; }
  fbLabel(); fbNote();
}
function fbChanged(noHist) {
  fbSync();
  if (!noHist && typeof pushHistory === 'function') pushHistory();
  if (typeof scheduleDraw === 'function') scheduleDraw();
}

(function fbWire() {
  const on = $fb('fb-on'); if (!on) return;
  on.addEventListener('change', () => { FB.on = on.checked; fbChanged(); });
  [['fb-vals', 'vals'], ['fb-coords', 'coords'], ['fb-dots', 'dots']].forEach(([id, k]) => {
    const c = $fb(id); if (c) c.addEventListener('change', () => { FB[k] = c.checked; fbChanged(); });
  });
  const hc = $fb('fb-hide'); if (hc) hc.addEventListener('change', () => { FB.curve = !hc.checked; fbChanged(); });
  const sel = $fb('fb-fn');
  if (sel) sel.addEventListener('change', () => { FB.idx = parseInt(sel.value, 10) || 0; fbChanged(); });
  const st = $fb('fb-step');
  if (st) {
    const set = () => { const v = parseFloat(st.value); if (isFinite(v) && v >= 0) FB.step = Math.round(v * 1000) / 1000; fbLabel(); };
    st.addEventListener('input', () => { set(); if (typeof scheduleDraw === 'function') scheduleDraw(); });
    st.addEventListener('change', () => { set(); fbChanged(); });
  }
  const ss = $fb('fb-sstep');
  if (ss) ss.addEventListener('change', () => {
    const v = parseFloat(ss.value); if (!(v > 0)) return;
    FB.sstep = v;
    if (st) { st.step = v; FB.step = Math.round(parseFloat(st.value) * 1000) / 1000; }
    fbChanged();
  });
  // Funktionsliste aktuell halten, sobald man sich im Panel bewegt
  const p = $fb('fb-panel');
  if (p) { p.addEventListener('pointerenter', fbSync); p.addEventListener('focusin', fbSync); }
  fbSync();
})();

// Globale Namen für die Einhängepunkte
window.FB = FB; window.fbHides = fbHides; window.fbDraw = fbDraw; window.fbCapture = fbCapture;
window.fbApply = fbApply; window.fbSync = fbSync; window.fbLatex = fbLatex;

}
