// ═══════════════════════════════════════════════════════════════════
// 61_dif_draw.js — Differentialrechnung: Bilder (Szenen)
//
// Wie bei Statistik und Finanzmathematik baut jede Ansicht eine «Szene» (Rechteck, Linie, Kreis,
// Vieleck, Text; Formeln als Rich-Text), die auf den Canvas gemalt (statPaint) und als TikZ
// ausgegeben wird (stSceneTex). Kurven und Geraden werden hier selbst auf den Bildausschnitt
// zugeschnitten (TikZ kennt keinen Zuschnitt), Polstellen unterbrechen die Kurve.
//
// Ansichten:  tan  Sekante → Tangente (h-Tabelle, Steigungsdreieck)
//             gr   Graphisches Ableiten (f über f')
//             rg   Ableiten mit Regeln (Tangente und Normale)
//             kd   Kurvendiskussion (Nullstellen, Extrema, Wendepunkte)
// Farben wie im Dossier: h blau, Δy rot, Sekante violett, Tangente grün.
// Kontext C: {view, F, win:{x0,x1,y0,y1}, x0, h, show:{…}, trace:[…], K, fs, exp}
// ═══════════════════════════════════════════════════════════════════
const DIF_UP = ST_G, DIF_DOWN = ST_O;           // steigt grün, fällt orange

function difScene() { const S = stScene(); S.hits = []; S.pts = []; S.maps = {}; return S; }
// Hervorhebbare Objekte für die verlinkte Überschrift (02_core.js envHint): Linienzug, Kasten oder Kreis mit einer id
function shl(S, id, pts, close) { if (id && pts && pts.length > 1) (S.hl || (S.hl = [])).push({ id, pts, close: !!close }); }
function shlBox(S, id, x0, y0, x1, y1) { if (id) (S.hl || (S.hl = [])).push({ id, box: [x0, y0, x1, y1] }); }
function shlP(S, id, pts) { shl(S, id, pts, true); return pts; }
function shlC(S, id, x, y, r) { if (id && isFinite(x) && isFinite(y)) (S.hl || (S.hl = [])).push({ id, c: [x, y, r || 10] }); }
const difNum = (v, d) => (typeof Dif !== 'undefined' ? Dif.fmt(v, d === undefined ? 4 : d) : String(v));

// ── Bildausschnitt: y-Bereich automatisch (Ausreisser wie Polstellen werden ignoriert) ──
function difAutoY(g, x0, x1, N) {
  N = N || 400; const v = [];
  for (let i = 0; i <= N; i++) { const y = g(x0 + (x1 - x0) * i / N); if (isFinite(y) && Math.abs(y) < 1e12) v.push(y); }
  if (v.length < 3) return [-5, 5];
  v.sort((a, b) => a - b);
  const q = p => v[Math.min(v.length - 1, Math.max(0, Math.round(p * (v.length - 1))))];
  let lo = q(0.1), hi = q(0.9); const span = (hi - lo) || 1;
  if (v[0] >= lo - 0.35 * span) lo = v[0];
  if (v[v.length - 1] <= hi + 0.35 * span) hi = v[v.length - 1];
  let sp = hi - lo; if (sp < 1e-9) { lo -= 1; hi += 1; sp = 2; }
  const pad = sp * 0.14; lo -= pad; hi += pad; sp = hi - lo;
  if (lo > 0 && lo < sp * 0.55) lo = -pad;
  if (hi < 0 && -hi < sp * 0.55) hi = pad;
  return [lo, hi];
}
// Vollständiger Ausschnitt aus C.win (y automatisch, wenn nicht gesetzt)
function difWindow(C, g) {
  const w = C.win || {}, x0 = isFinite(w.x0) ? w.x0 : -5, x1 = isFinite(w.x1) && w.x1 > x0 ? w.x1 : x0 + 10;
  let y0 = w.y0, y1 = w.y1;
  if (!(isFinite(y0) && isFinite(y1) && y1 > y0)) {
    const a = difAutoY(g, x0, x1); y0 = a[0]; y1 = a[1];
    // Kurvendiskussion: Bild auf die besonderen Punkte zuschneiden (Extrema, Wendepunkte), damit man sie erkennt
    const K = C.view === 'kd' ? C.K : null;
    if (K) {
      const ys = [0].concat(K.crit.map(c => c.y), K.infl.map(c => c.y)).filter(isFinite);
      const lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys), sp = hi - lo;
      if (sp > 1e-9 && ys.length > 2) { const pad = sp * 0.9; y0 = Math.max(y0, lo - pad); y1 = Math.min(y1, hi + pad); if (!(y1 > y0)) { y0 = lo - pad; y1 = hi + pad; } }
    }
  }
  return { x0, x1, y0, y1 };
}

// ── Graphisch ableiten: Ausschnitt um die interessanten Stellen (Nullstellen, Extrema, Wendepunkte) ──
// Mit dem festen Fenster [−5, 5] und automatischem y wird z. B. x³ − 6x² + 9x oder x·eˣ dort, wo etwas passiert, fast flach.
// K: Kurvendiskussion (Dif.kd). Ergebnis {x0, x1, y0, y1, s0, s1} (s: y-Bereich von f′) oder null (dann gilt der Standard).
function difSmartWin(F, K) {
  if (!F || !K) return null;
  const f = F.f(0), d1 = F.f(1), okv = v => isFinite(v) && Math.abs(v) < 1e7;
  const mn = a => Math.min.apply(null, a), mx = a => Math.max.apply(null, a);
  let E = (K.crit || []).concat(K.infl || []).filter(c => okv(c.x) && okv(c.y)).map(c => ({ x: c.x, y: c.y }));
  let I = (K.infl || []).map(c => c.x).filter(okv), Z = (K.zeros || []).map(z => z.val).filter(okv);
  if (E.length > 9) {                                              // periodisch: die Mitte zeigen, nicht alle Wellen
    const r = E.map(c => Math.abs(c.x)).sort((p, q) => p - q)[5] * (1 + 1e-9);
    E = E.filter(c => Math.abs(c.x) <= r); I = I.filter(x => Math.abs(x) <= r); Z = Z.filter(x => Math.abs(x) <= r * 1.3);
  }
  const xs = E.map(c => c.x).concat(Z); if (!xs.length) return null;
  const a = mn(xs), b = mx(xs), s = b - a;
  let x0, x1;
  if (s < 1e-9 * (1 + Math.abs(a))) {                              // nur eine besondere Stelle: Standardbreite, dorthin verschoben
    if (Math.abs(a) <= 2.5) return null;
    x0 = Math.round(a) - 5; x1 = Math.round(a) + 5;
    const ya = difAutoY(f, x0, x1), yb = difAutoY(d1, x0, x1);
    return { x0, x1, y0: ya[0], y1: ya[1], s0: yb[0], s1: yb[1] };
  }
  const few = new Set(xs.map(x => Math.round(x * 1e6))).size <= 3, pad = (few ? 0.5 : 0.3) * s;
  x0 = a - pad; x1 = b + pad;
  if (x0 > 0 && x0 < 0.7 * s) x0 = -0.12 * s;                      // y-Achse mitnehmen, wenn sie nahe liegt
  if (x1 < 0 && -x1 < 0.7 * s) x1 = 0.12 * s;
  const st = Stat.niceStep(x1 - x0, 10) / 2; x0 = Math.floor(x0 / st + 1e-9) * st; x1 = Math.ceil(x1 / st - 1e-9) * st;
  if (!(x1 - x0 > 1e-3 && x1 - x0 < 1e5)) return null;
  // tatsächlicher Wertebereich im Ausschnitt (ohne Ausreisser an Polstellen)
  const act = (g, lo, hi) => { const v = []; for (let i = 0; i <= 300; i++) { const y = g(lo + (hi - lo) * i / 300); if (okv(y)) v.push(y); } v.sort((p, q) => p - q); return v.length > 5 ? [v[Math.round(0.01 * (v.length - 1))], v[Math.round(0.99 * (v.length - 1))]] : null; };
  // Fenster so, dass die besonderen Werte V gut sichtbar bleiben (rund ein Drittel der Höhe), aber nicht über den Graphen hinaus
  const fit = (V, g) => {
    let lo = mn(V), hi = mx(V); const sp = hi - lo, A = act(g, x0, x1), v0 = lo, v1 = hi;
    if (!(sp > 1e-9 * (1 + Math.abs(lo) + Math.abs(hi)))) return null;
    const k = few ? 1.5 : 0.75, tot = sp * (1 + 2 * k), m = 0.1 * sp;
    lo -= k * sp; hi += k * sp;
    if (A) {
      const a0 = Math.min(A[0], v0) - m, a1 = Math.max(A[1], v1) + m;
      if (a0 > lo) { lo = a0; hi = Math.min(lo + tot, Math.max(hi, a1)); }                        // unten ist nichts mehr: Platz nach oben geben
      if (a1 < hi) { hi = a1; lo = Math.max(hi - tot, Math.min(lo, a0)); }
    }
    return [lo, hi];
  };
  const ys = E.map(c => c.y).concat(Z.length ? [0] : []);
  if (!Z.length && ys.length) { const lo = mn(ys), hi = mx(ys); if (lo > 0 && lo < 2 * (hi - lo)) ys.push(0); else if (hi < 0 && -hi < 2 * (hi - lo)) ys.push(0); }   // x-Achse mitnehmen, wenn sie nahe liegt
  const Y = fit(ys, f) || difAutoY(f, x0, x1);
  // f′: Werte an den Wendestellen (Extrema von f′) und 0; ohne Wendestelle der Bereich von f′ zwischen den besonderen Stellen
  let Sb = fit([0].concat(I.map(x => d1(x)).filter(okv)), d1);
  if (!Sb) { const A = act(d1, a, b); if (A && A[1] - A[0] > 1e-9) { const lo = Math.min(0, A[0]), hi = Math.max(0, A[1]), p = 0.35 * (hi - lo); Sb = [lo - p, hi + p]; } else Sb = difAutoY(d1, x0, x1); }
  const W = { x0, x1, y0: Y[0], y1: Y[1], s0: Sb[0], s1: Sb[1] };
  if (![W.x0, W.x1, W.y0, W.y1, W.s0, W.s1].every(isFinite) || !(W.y1 > W.y0) || !(W.s1 > W.s0)) return null;
  return W;
}

// ── Zuschnitt einer Strecke auf ein Rechteck (Liang–Barsky) ──
function difClip(ax, ay, bx, by, L, T, R, B) {
  let t0 = 0, t1 = 1; const dx = bx - ax, dy = by - ay;
  const tst = (p, q) => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
    return true;
  };
  if (tst(-dx, ax - L) && tst(dx, R - ax) && tst(-dy, ay - T) && tst(dy, B - ay)) return [ax + t0 * dx, ay + t0 * dy, ax + t1 * dx, ay + t1 * dy, t0, t1];
  return null;
}

// ── Rahmen mit Gitter, Achsen und Beschriftung ──
// r: Rechteck, win: Ausschnitt, o: {title (Rich, links), info (Rich, rechts), xlab, ylab, xstep/ystep (feste Schrittweite), xfmt (Rich-Beschriftung der x-Striche)}
function difFrame(S, r, win, C, o) {
  o = o || {}; const fs = C.fs, head = (o.title || o.info) ? fs * 2.0 : 0;
  const L = r.x + fs * 2.9, R = r.x + r.w - fs * 1.0, T = r.y + fs * 0.6 + head, B = r.y + r.h - fs * 1.9;
  const m = {
    L, R, T, B, win, r,
    X: x => L + (x - win.x0) / (win.x1 - win.x0) * (R - L), Y: y => B - (y - win.y0) / (win.y1 - win.y0) * (B - T),
    IX: p => win.x0 + (p - L) / (R - L) * (win.x1 - win.x0), IY: p => win.y0 + (B - p) / (B - T) * (win.y1 - win.y0)
  };
  if (!(R - L > 20 && B - T > 20)) return m;
  (S.frames || (S.frames = [])).push([L, T, R, B, r.x, r.y, r.x + r.w, r.y + r.h]);
  if (typeof stKeepFrame === 'function') stKeepFrame(r);                // zum Zuschneiden (stAutoClip in 41_stat_draw.js)
  const sx = o.xstep || Stat.niceStep(win.x1 - win.x0, Math.max(3, Math.min(12, (R - L) / (fs * 4.5)))), sy = o.ystep || Stat.niceStep(win.y1 - win.y0, Math.max(3, Math.min(9, (B - T) / (fs * 3.2))));
  const ticks = (a, b, st) => { const out = []; for (let k = Math.ceil(a / st - 1e-9); k * st <= b + st * 1e-9 && out.length < 60; k++) out.push(Math.round(k * st * 1e9) / 1e9); return out; };
  const tx = ticks(win.x0, win.x1, sx), ty = ticks(win.y0, win.y1, sy), lab = (v, st) => stTickLabel(v, st).replace('-', '−');
  // fr: Gitter, Rahmen, Achsen und Skala gehören zusammen – der LaTeX-Export (stSceneTex) schreibt dafür EINE pgfplots-Achse
  const fr = { m, sx, sy, xt: o.xfmt ? tx.map(v => [v, o.xfmt(v)]) : null };
  tx.forEach(v => { S.line(m.X(v), T, m.X(v), B, { col: 'G', lw: 1, fr }); });
  ty.forEach(v => { S.line(L, m.Y(v), R, m.Y(v), { col: 'G', lw: 1, fr }); });
  S.rect(L, T, R - L, B - T, { stroke: 'L', lw: 1, fr });
  const ax = Math.min(B, Math.max(T, m.Y(0))), ay = Math.min(R, Math.max(L, m.X(0)));
  if (win.y0 < 0 && win.y1 > 0) S.line(L, ax, R, ax, { col: 'L', lw: 1.6, fr });
  if (win.x0 < 0 && win.x1 > 0) S.line(ay, T, ay, B, { col: 'L', lw: 1.6, fr });
  tx.forEach(v => { S.line(m.X(v), B, m.X(v), B + 3, { col: 'L', lw: 1, fr }); if (o.xfmt) S.rich(m.X(v), B + fs * 1.0, o.xfmt(v), { size: fs * 0.82, col: 'M', al: 'c', bs: 'm', fr }); else S.text(m.X(v), B + fs * 1.0, lab(v, sx), { size: fs * 0.82, col: 'M', al: 'c', bs: 'm', fr }); });
  ty.forEach(v => { S.line(L - 3, m.Y(v), L, m.Y(v), { col: 'L', lw: 1, fr }); S.text(L - fs * 0.45, m.Y(v), lab(v, sy), { size: fs * 0.82, col: 'M', al: 'r', bs: 'm', fr }); });
  S.rich(R - fs * 0.5, B - fs * 0.9, o.xlab || 'x', { size: fs, col: 'M', al: 'r', bs: 'm' });
  S.rich(L + fs * 0.6, T + fs * 0.9, o.ylab || 'y', { size: fs, col: 'M', al: 'l', bs: 'm' });
  if (o.title) S.rich(L, r.y + fs * 1.1, o.title, { size: fs * 1.05, col: 'T', al: 'l', bs: 'm' });
  if (o.info) S.rich(R, r.y + fs * 1.1, o.info, { size: fs * 1.0, col: 'T', al: 'r', bs: 'm' });
  return m;
}

// Term (Rohsyntax in x) an eine numerische Funktion hängen: der LaTeX-Export zeichnet die Kurve dann als \addplot {Term}
const difRaw = (g, raw) => { if (g && raw) g.raw = raw; return g; };
const difRN = v => { const s = String(+(+v).toPrecision(12)); return v < 0 ? '(' + s + ')' : s; };
// ── Kurve y = g(x) im Rahmen; colorAt(x) färbt abschnittsweise ──
function difCurve(S, m, g, o) {
  o = o || {}; const { L, R, T, B, win } = m, W = R - L, N = Math.max(160, Math.min(900, Math.round(W * (o.exp ? 0.7 : 1.1)))), hgt = win.y1 - win.y0;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = win.x0 + (win.x1 - win.x0) * i / N; let y = NaN; try { y = g(x); } catch (e) { y = NaN; }
    pts.push({ x, y, ok: isFinite(y) && Math.abs(y) < 1e9, c: o.colorAt ? o.colorAt(x + (win.x1 - win.x0) / N / 2) : o.col });
  }
  // Für den LaTeX-Export: dieselbe Kurve als EIN pgfplots-\addplot (Term statt vieler Pixelpunkte, siehe stSceneTex).
  // pieces: Abschnitte gleicher Farbe zwischen Lücken (undefiniert, Polstelle) in Weltkoordinaten.
  const grp = { m, g, o, pts, pieces: [] };
  let lastPc = null;
  for (let i = 0; i + 1 < pts.length; i++) {
    const p = pts[i], q = pts[i + 1];
    const gap = !p.ok || !q.ok || (Math.abs(q.y - p.y) > 3 * hgt && (p.y > 0) !== (q.y > 0));
    if (gap) { lastPc = null; continue; }
    const c = o.colorAt ? p.c : o.col;
    if (lastPc && lastPc.col === c && lastPc.j === i) { lastPc.b = q.x; lastPc.j = i + 1; }
    else { lastPc = { a: p.x, b: q.x, i0: i, j: i + 1, col: c }; grp.pieces.push(lastPc); }
  }
  let run = null, runCol = null;
  const flush = () => { if (run && run.length > 1) { S.poly(run, { col: runCol, lw: o.lw || 2.2, dash: o.dash, a: o.a, fgrp: grp }); shl(S, o.hl, run); } run = null; };
  for (let i = 0; i + 1 < pts.length; i++) {
    const p = pts[i], q = pts[i + 1];
    if (!p.ok || !q.ok) { flush(); continue; }
    if (Math.abs(q.y - p.y) > 3 * hgt && (p.y > 0) !== (q.y > 0)) { flush(); continue; }      // Polstelle
    const c = o.colorAt ? p.c : o.col;
    const seg = difClip(m.X(p.x), m.Y(p.y), m.X(q.x), m.Y(q.y), L, T, R, B);
    if (!seg) { flush(); continue; }
    if (run && c !== runCol) flush();
    const cont = run && Math.abs(run[run.length - 1][0] - seg[0]) < 0.01 && Math.abs(run[run.length - 1][1] - seg[1]) < 0.01;
    if (!cont) { flush(); run = [[seg[0], seg[1]]]; runCol = c; }
    run.push([seg[2], seg[3]]);
    if (seg[5] < 1) flush();
  }
  flush();
}
// Kurve in Weltkoordinaten (Punkte [x, y]; NaN unterbricht), auf den Rahmen zugeschnitten
function difPath(S, m, P, o) {
  o = o || {}; let run = null;
  const flush = () => { if (run && run.length > 1) { S.poly(run, { col: o.col, lw: o.lw || 2.2, dash: o.dash, a: o.a }); shl(S, o.hl, run); } run = null; };
  for (let i = 0; i + 1 < P.length; i++) {
    const p = P[i], q = P[i + 1];
    if (!isFinite(p[0]) || !isFinite(p[1]) || !isFinite(q[0]) || !isFinite(q[1])) { flush(); continue; }
    const s = difClip(m.X(p[0]), m.Y(p[1]), m.X(q[0]), m.Y(q[1]), m.L, m.T, m.R, m.B);
    if (!s) { flush(); continue; }
    const cont = run && Math.abs(run[run.length - 1][0] - s[0]) < 0.01 && Math.abs(run[run.length - 1][1] - s[1]) < 0.01;
    if (!cont) { flush(); run = [[s[0], s[1]]]; }
    run.push([s[2], s[3]]); if (s[5] < 1) flush();
  }
  flush();
}
// Graph von g, um die Winkelhalbierende y = x geklappt: k = 1 ist der Graph selbst, k = −1 sein Spiegelbild (die Umkehrfunktion);
// dazwischen die Ansicht einer Drehung im Raum um die Gerade y = x (k = cos des Drehwinkels).
function difFlip(S, m, g, k, o) {
  const w = m.win, a = Math.min(w.x0, w.y0), b = Math.max(w.x1, w.y1), N = 400, P = [], hg = b - a;
  let py = NaN;
  for (let i = 0; i <= N; i++) {
    const x = a + (b - a) * i / N; let y = NaN; try { y = g(x); } catch (e) { y = NaN; }
    if (!isFinite(y) || Math.abs(y) > 1e6 || (isFinite(py) && Math.abs(y - py) > 3 * hg)) { P.push([NaN, NaN]); py = NaN; if (!isFinite(y) || Math.abs(y) > 1e6) continue; }
    py = y; const s = (x + y) / 2, d = (x - y) / 2;
    P.push([s + k * d, s - k * d]);
  }
  difPath(S, m, P, o);
}
// Gerade durch (x0, y0) mit Steigung k
function difLine(S, m, x0, y0, k, o) {
  const { L, R, T, B, win } = m; if (!isFinite(k) || !isFinite(y0)) return;
  const a = m.X(win.x0 - 1), b = m.X(win.x1 + 1), ya = m.Y(y0 + k * (win.x0 - 1 - x0)), yb = m.Y(y0 + k * (win.x1 + 1 - x0));
  const s = difClip(a, ya, b, yb, L, T, R, B); if (s) { S.line(s[0], s[1], s[2], s[3], o); if (o) shl(S, o.hl, [[s[0], s[1]], [s[2], s[3]]]); }
}
const difInside = (m, px, py, e) => px >= m.L - (e || 0) && px <= m.R + (e || 0) && py >= m.T - (e || 0) && py <= m.B + (e || 0);
function difDot(S, m, x, y, o) {
  o = o || {}; const px = m.X(x), py = m.Y(y); if (!isFinite(px) || !isFinite(py) || !difInside(m, px, py, 1)) return null;
  S.circ(px, py, o.r || 4.5, { fill: o.fill || 'T', stroke: o.stroke || o.fill || 'T', lw: o.lw || 1.5, a: o.a });
  return [px, py];
}
function difSeg(S, m, x1, y1, x2, y2, o) {                           // Strecke in Weltkoordinaten (zugeschnitten)
  const s = difClip(m.X(x1), m.Y(y1), m.X(x2), m.Y(y2), m.L, m.T, m.R, m.B); if (s) { S.line(s[0], s[1], s[2], s[3], o); if (o) shl(S, o.hl, [[s[0], s[1]], [s[2], s[3]]]); }
}
// Beschriftung eines Punktes in Pixeln, innerhalb des Rahmens gehalten
function difLabel(S, m, px, py, s, C, o) {
  o = o || {}; const fs = C.fs, size = fs * (o.size || 1);
  const bx = typeof difCellBox === 'function' ? difCellBox(s, size) : { w: o.w || fs * 3.2, h: size * 1.2 }, w = Math.min(o.w || bx.w, bx.w) || fs * 3.2;
  const x = Math.min(m.R - w / 2, Math.max(m.L + w / 2, px + (o.dx || 0))), y = py + (o.dy || 0);
  S.rich(x, y, s, { size, col: o.col || 'T', al: 'c', bs: 'm' });
  (S.labs || (S.labs = [])).push({ x0: x - w / 2, x1: x + w / 2, y0: y - bx.h / 2, y1: y + bx.h / 2 });   // belegte Fläche (für spätere Beschriftungen)
  if (o.hl) shlBox(S, o.hl, x - w / 2 - 3, y - bx.h / 2 - 2, x + w / 2 + 3, y + bx.h / 2 + 2);
}
// Überdeckung eines Rechtecks mit bereits belegten Flächen (Summe der Schnittflächen)
function difLabHit(S, b) {
  let a = 0; (S.labs || []).forEach(q => { const w = Math.min(b.x1, q.x1) - Math.max(b.x0, q.x0), h = Math.min(b.y1, q.y1) - Math.max(b.y0, q.y0); if (w > 0 && h > 0) a += w * h; });
  return a;
}

// ── Textblock aus Rich-Zeilen: {s, col, size, gap} ──
// Höhe einer Rich-Zeile in Schriftgrössen: Brüche brauchen mehr Platz, verschachtelte Brüche (Bruch im Zähler) noch mehr
function difFracDepth(s) {
  let depth = 0, best = 0; const open = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && s.startsWith('\\frac', i)) { while (open.length && open[open.length - 1] >= depth) open.pop(); open.push(depth); best = Math.max(best, open.length); }
    else if (c === '{') depth++;
    else if (c === '}') { depth--; while (open.length && open[open.length - 1] > depth) open.pop(); }
  }
  return best;
}
const difRichH = l => (difFracDepth(l.s) > 1 ? 3.7 : /\\frac|\\sqrt|\\left|\\int|\\sum/.test(l.s) ? 2.45 : 1.6) * (l.size || 1);
function difLines(S, r, lines, C, o) {
  o = o || {}; const vis = s => s.replace(/\\col\{[a-z]\}|\\text|\\[a-zA-Z]+|[{}\\^_]/g, '').length;
  // Höhe und Breite jeder Zeile: wenn möglich mit dem Formelsatz gemessen (Brüche, Wurzeln, Klammern wirklich so hoch,
  // wie sie gezeichnet werden), sonst geschätzt. Gemessen wird einmal bei Grösse 10 und dann linear skaliert.
  const meas = lines.map(l => {
    if (l === null) return null;
    if (typeof finRichSize === 'function') { try { const m = finRichSize(l.s, 10 * (l.size || 1), l.bold); if (isFinite(m.h) && m.h > 0 && isFinite(m.w)) return { a: m.a / 10, d: m.d / 10, w: m.w / 10, ok: true }; } catch (e) { /* Schätzung */ } }
    return { a: difRichH(l) * 0.62, d: difRichH(l) * 0.38, w: vis(l.s) * 0.5 * (l.size || 1), ok: false };
  });
  const gap = 0.42;                                                             // Abstand zwischen zwei Zeilen (in Schriftgrössen)
  const lineH = (m, f) => (m.ok ? Math.max((m.a + m.d + gap) * f, 1.55 * f) : (m.a + m.d) * f);
  const fit = (ms, w, h) => { let f = Math.min(C.fs * 1.12, o.max || 99); const nd = g => ms.reduce((a, m) => a + (m === null ? g * 0.6 : lineH(m, g)), 0), wd = g => ms.reduce((mx, m) => Math.max(mx, m === null ? 0 : m.w * g), 0); while (f > (o.min || 7.5) && (nd(f) > h || wd(f) > w)) f -= 0.5; return f; };
  let fs = fit(meas, r.w, r.h);
  // Zu klein, aber Platz in der Breite: in zwei Spalten setzen (geteilt nach Höhe, ohne ausgeblendete Leerzeilen am Spaltenanfang)
  if (!o.oneCol && o.al !== 'c' && lines.length >= 4 && fs < C.fs * 0.9) {
    const tot = meas.reduce((a, m) => a + (m === null ? 0.6 : m.a + m.d + 0.42), 0); let acc = 0, cut = 1;
    for (let i = 0; i < meas.length; i++) { acc += meas[i] === null ? 0.6 : meas[i].a + meas[i].d + 0.42; if (acc >= tot / 2) { cut = i + 1; break; } }
    cut = Math.max(1, Math.min(lines.length - 1, cut));
    const cw = (r.w - C.fs * 1.5) / 2, f2 = Math.min(fit(meas.slice(0, cut), cw, r.h), fit(meas.slice(cut), cw, r.h));
    if (f2 > fs + 0.5) {
      const o2 = Object.assign({}, o, { oneCol: true, max: f2, min: f2 });
      const y1 = difLines(S, { x: r.x, y: r.y, w: cw, h: r.h }, lines.slice(0, cut), C, o2);
      const y2 = difLines(S, { x: r.x + cw + C.fs * 1.5, y: r.y, w: cw, h: r.h }, lines.slice(cut).filter((l, i) => i > 0 || l !== null), C, o2);
      return Math.max(y1, y2);
    }
  }
  let y = r.y;
  lines.forEach((l, i) => {
    const m = meas[i];
    if (l === null) { y += fs * 0.6; return; }
    const hh = lineH(m, fs), x = o.al === 'c' ? r.x + r.w / 2 : r.x;
    if (m.ok) {
      // Grundlinie so setzen, dass die Zeile (Oberlänge bis Unterlänge) mittig in ihrem Platz steht
      const top = y + (hh - (m.a + m.d) * fs) / 2;
      S.rich(x, top, l.s, { size: fs * (l.size || 1), col: l.col || 'T', al: o.al === 'c' ? 'c' : 'l', bs: 't', bold: l.bold });
    } else S.rich(x, y + hh / 2, l.s, { size: fs * (l.size || 1), col: l.col || 'T', al: o.al === 'c' ? 'c' : 'l', bs: 'm', bold: l.bold });
    if (l.hl) { const w = m.w * fs * (l.size || 1); shlBox(S, l.hl, (o.al === 'c' ? x - w / 2 : x) - 4, y, (o.al === 'c' ? x + w / 2 : x + w) + 4, y + hh); }
    y += hh;
  });
  return y;
}
// Tabelle aus Rich-Zellen; cols: [{h, w}] (w in Schriftgrössen); hl: Zeile hervorheben.
// Jede Zeile ist so hoch wie ihr höchster Eintrag (Brüche, Wurzeln) – gemessen mit dem Formelsatz (finRichSize), mindestens 1.85·fs.
// Ein Eintrag, der breiter als seine Spalte ist, wird in der Schrift verkleinert (höchstens auf 60 %).
function difCellBox(s, size) {
  s = String(s === undefined || s === null ? '' : s);
  if (typeof finRichSize === 'function') { try { const m = finRichSize(s, 10); if (isFinite(m.h) && m.h > 0) return { w: m.w * size / 10, h: m.h * size / 10 }; } catch (e) { /* Schätzung */ } }
  const plain = s.replace(/\\col\{[a-z]\}|\\text|\\[a-zA-Z]+|[{}\\^_]/g, '');
  return { w: plain.length * 0.55 * size, h: (/\\frac|\\sqrt/.test(s) ? 2.3 : 1.15) * size };
}
function difTableRows(cols, rows, fs) {                               // Zeilenhöhen (Kopf zuerst) und Schriftgrössen der Zellen
  const one = (cells, base) => {
    const sizes = cols.map((c, j) => { const b = difCellBox(cells[j], base), avail = c.w * fs - fs * 0.35; return b.w > avail && b.w > 0 ? base * Math.max(0.6, avail / b.w) : base; });
    const h = cols.reduce((mx, c, j) => Math.max(mx, difCellBox(cells[j], sizes[j]).h + fs * 0.55), fs * 1.85);
    return { h, sizes };
  };
  return [one(cols.map(c => c.h), fs * 0.95)].concat(rows.map(r => one(r, fs * 0.92)));
}
// Gesamthöhe einer Tabelle bei Schriftgrösse fs (zum Einpassen)
function difTableH(cols, rows, fs) { return difTableRows(cols, rows, fs).reduce((a, r) => a + r.h, 0); }
function difTable(S, x, y, cols, rows, fs, hl, hlCol) {
  if (typeof stMark === 'function') stMark(x + 2, y + 2);
  const L = difTableRows(cols, rows, fs), tw = cols.reduce((a, c) => a + c.w * fs, 0), th = L.reduce((a, r) => a + r.h, 0);
  S.rect(x, y, tw, L[0].h, { fill: ST_B, a: 0.12 });
  let cx = x;
  cols.forEach((c, j) => { S.rich(cx + c.w * fs / 2, y + L[0].h / 2, c.h, { size: L[0].sizes[j], col: 'T', al: 'c', bs: 'm' }); cx += c.w * fs; });
  S.line(x, y + L[0].h, x + tw, y + L[0].h, { col: 'L', lw: 1.2 });
  let yy = y + L[0].h;
  rows.forEach((row, i) => {
    const rh = L[i + 1].h;
    if (hl === i) S.rect(x, yy, tw, rh, { fill: hlCol || ST_V, a: 0.16 });
    if (i > 0) S.line(x, yy, x + tw, yy, { col: 'G', lw: 1 });
    let c2 = x;
    cols.forEach((c, j) => { S.rich(c2 + c.w * fs / 2, yy + rh / 2, row[j], { size: L[i + 1].sizes[j], col: (row.col && row.col[j]) || 'T', al: 'c', bs: 'm' }); c2 += c.w * fs; });
    yy += rh;
  });
  S.rect(x, y, tw, th, { stroke: 'L', lw: 1 });
  return { w: tw, h: th };
}

// ═════════════ Sekante → Tangente ═════════════
const DIF_SCENES = {};
function difSceneTan(S, W, H, C) {
  const F = C.F, f = F.f(0), x0 = C.x0, h = C.h, fs = C.fs;
  // Mit Rechenweg-Karte stehen Tabellen und Formeln dort: das Bild bekommt die ganze Fläche
  const solo = !!(C.show && C.show.card);
  const R = solo ? stLayout(W, H, [{ w: 1, rows: [1] }]) : stLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: [1.45, 1.05] }]);
  const win = difWindow(C, f), m = difFrame(S, R[0], win, C, { title: 'f(x)', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  const T = Dif.dqTable(F, x0), f0 = T.f0;
  difCurve(S, m, f, { hl: 'f', col: 'T', lw: 2.2, exp: C.exp });
  const ok = isFinite(f0);
  let tanOk = ok && (T.status === 'ok' || T.status === 'steep') && isFinite(T.fp);
  const x1 = x0 + h, f1 = ok ? f(x1) : NaN, q = ok && Math.abs(h) > 1e-12 && isFinite(f1);
  // Hilfslinien zu den Achsen mit x₀, x₀ + h, f(x₀), f(x₀ + h)
  const ax = Math.min(m.B, Math.max(m.T, m.Y(0))), ay = Math.min(m.R, Math.max(m.L, m.X(0))), tz = fs * 0.85;
  const box = t => (typeof difCellBox === 'function' ? difCellBox(t, tz) : { w: tz * 0.55 * t.length });
  const guide = (x, y, lx, ly, col) => {
    const px = m.X(x), py = m.Y(y); if (!(isFinite(px) && isFinite(py) && difInside(m, px, py, 0))) return;
    S.line(px, py, px, ax, { col: 'M', lw: 0.9, dash: true, a: 0.8 }); S.line(px, py, ay, py, { col: 'M', lw: 0.9, dash: true, a: 0.8 });
    const cc = t => (col ? '\\col{' + col + '}{' + t + '}' : t);
    const onX = Math.abs(py - ax) < tz * 0.7, onY = Math.abs(px - ay) < tz * 0.7; if (onX && onY) return;   // Punkt im Ursprung: P genügt
    const wx = box(lx).w; difLabel(S, m, px, ax + (ax + tz * 2 <= m.B ? tz * 1.05 : -tz * 1.05), cc(lx), C, { w: wx, size: 0.85 });
    const wy = box(ly).w, lft = ay - 5 - wy >= m.L; if (!onX) difLabel(S, m, lft ? ay - 5 - wy / 2 : ay + 5 + wy / 2, py, cc(ly), C, { w: wy, size: 0.85 });
  };
  if (ok) guide(x0, f0, 'x_0', 'f(x_0)', '');
  if (q && Math.abs(m.X(x1) - m.X(x0)) > fs * 2.2) guide(x1, f1, 'x_0+h', 'f(x_0+h)', 'v');
  // Beschriftung einer Geraden: Stelle, an der weder Graph, Geraden, Punkte noch andere Beschriftungen stören
  const obst = [];
  for (let i = 0; i <= 240; i++) { const x = win.x0 + (win.x1 - win.x0) * i / 240, y = f(x), px = m.X(x), py = m.Y(y); if (isFinite(py) && py > m.T && py < m.B) obst.push([px, py]); }
  const lineObst = k => { for (let i = 0; i <= 120; i++) { const px = m.L + (m.R - m.L) * i / 120, py = m.Y(f0 + k * (m.IX(px) - x0)); if (py > m.T && py < m.B) obst.push([px, py]); } };
  const lineLab = (k, t, col, hl) => {
    const w = box(t).w, hh = tz * 0.75; let best = null, bc = Infinity;
    for (let i = 1; i < 20; i++) {
      const Xp = m.L + (m.R - m.L) * i / 20, Yp = m.Y(f0 + k * (m.IX(Xp) - x0));
      if (!(Yp > m.T + tz && Yp < m.B - tz)) continue;
      [[-1, -1], [1, 1], [1, -1], [-1, 1]].forEach(([sx, sy]) => {
        const X = Xp + sx * (w / 2 + 3), Y = Yp + sy * tz * 0.95, b = { x0: X - w / 2 - 2, x1: X + w / 2 + 2, y0: Y - hh, y1: Y + hh };
        if (b.x0 < m.L + 2 || b.x1 > m.R - 2 || b.y0 < m.T + 2 || b.y1 > m.B - 2) return;
        let c = difLabHit(S, b) * 4; obst.forEach(p => { if (p[0] >= b.x0 && p[0] <= b.x1 && p[1] >= b.y0 && p[1] <= b.y1) c += 60; });
        c += Math.abs(Math.min(260, Math.hypot(X - m.X(x0), Y - m.Y(f0))) - 160) * 0.03;   // nicht im Gedränge bei P, aber auch nicht zu weit weg
        if (c < bc) { bc = c; best = [X, Y]; }
      });
    }
    if (best) difLabel(S, m, best[0], best[1], '\\col{' + col + '}{' + t + '}', C, { w, size: 0.85, hl });
  };
  if (ok && C.show.tangent && tanOk) { difLine(S, m, x0, f0, T.fp, { hl: 'tan', col: ST_G, lw: 1.6, a: 0.95 }); }
  if (q) {
    const sl = (f1 - f0) / h;
    difLine(S, m, x0, f0, sl, { hl: 'sec', col: ST_V, lw: 1.7 });
    if (C.show.triangle !== false) {
      difSeg(S, m, x0, f0, x1, f0, { hl: 'h', col: ST_B, lw: 2.2 });
      difSeg(S, m, x1, f0, x1, f1, { hl: 'dy', col: ST_R, lw: 2.2 });
      const px = m.X(x1), py = m.Y(f1), p0 = m.X(x0), q0 = m.Y(f0);
      const th = 'h=' + difNum(h, 4), ty = '\\Delta y=' + difNum(f1 - f0, 4);
      if (Math.abs(px - p0) > box(th).w * 0.6) difLabel(S, m, (px + p0) / 2, q0 + (f1 >= f0 ? tz * 1.15 : -tz * 1.15), '\\col{b}{' + th + '}', C, { w: box(th).w, size: 0.85, hl: 'h' });
      if (Math.abs(py - q0) > tz * 1.4) { const w = box(ty).w; difLabel(S, m, px + (px >= p0 ? 1 : -1) * (w / 2 + 6), (py + q0) / 2, '\\col{r}{' + ty + '}', C, { w, size: 0.85, hl: 'dy' }); }
    }
  }
  // h = 0: Q fällt auf P (Q wird zuerst angeboten, damit man es wieder wegziehen kann)
  const meet = ok && h === 0;
  if (meet) {
    const Q = difDot(S, m, x0, f0, { fill: ST_V, stroke: 'T', r: 8 });
    if (Q) { S.pts.push({ id: 'Q', x: Q[0], y: Q[1], r: 10 }); }
  }
  if (ok) {
    const P = difDot(S, m, x0, f0, { fill: 'T', r: meet ? 3.6 : 5.2 });
    if (P) { if (!meet) S.pts.push({ id: 'P', x: P[0], y: P[1], r: 10 }); difLabel(S, m, P[0], P[1] - fs * (meet ? 1.5 : 1.1), meet ? 'P=Q' : 'P', C, { w: fs * (meet ? 2.6 : 1.5), dx: -fs * 0.4 }); }
  }
  if (q) {
    const Q = difDot(S, m, x1, f1, { fill: ST_V, stroke: 'T', r: 5.2 });
    if (Q) { S.pts.push({ id: 'Q', x: Q[0], y: Q[1], r: 10 }); difLabel(S, m, Q[0], Q[1] - fs * 1.1, 'Q', C, { w: fs * 1.5, dx: fs * 0.4 }); }
  }
  { const showT = ok && C.show.tangent && tanOk, sl = q ? (f1 - f0) / h : NaN;
    [[P0 => q, sl], [P0 => showT, T.fp]].forEach(([on, k]) => { if (on()) lineObst(k); });
    [[x0, f0], [x1, f1]].forEach(([x, y]) => { const px = m.X(x), py = m.Y(y); if (isFinite(py)) (S.labs || (S.labs = [])).push({ x0: px - 8, x1: px + 8, y0: py - 8, y1: py + 8 }); });
    if (q) lineLab(sl, '\\text{Sekante: }m_s=' + difNum(sl, 4), 'v', 'ms');
    if (showT) lineLab(T.fp, '\\text{Tangente: }m=' + difNum(T.fp, 4), 'g', 'tan'); }
  if (!ok) { S.rich(m.L + (m.R - m.L) / 2, m.T + (m.B - m.T) / 2, '\\text{An dieser Stelle ist f nicht definiert.}', { size: fs, col: ST_R, al: 'c', bs: 'm' }); }
  if (solo) return;
  // Tabellen h → 0 von rechts und links
  const tr = R[1], lines = [];
  const cols = [{ h: 'h', w: 3.6 }, { h: 'f(x_0+h)', w: 5.0 }, { h: '\\col{v}{m_s}', w: 4.4 }];
  if (ok && T.status !== 'undef' || ok) {
    const tfs = Math.max(7.5, Math.min(fs, (tr.w - 10) / (2 * 13.0 + 1), (tr.h - fs * 2.6) / (1.85 * (T.right.length + 2))));
    const gap = tfs * 1.0, tw = 13.0 * tfs, x00 = tr.x + Math.max(0, (tr.w - (2 * tw + gap)) / 2), yT = tr.y + tfs * 2.0;
    S.rich(x00 + tw / 2, tr.y + tfs * 0.9, '\\text{von rechts, }h>0', { size: tfs, col: 'T', al: 'c', bs: 'm' });
    S.rich(x00 + tw + gap + tw / 2, tr.y + tfs * 0.9, '\\text{von links, }h<0', { size: tfs, col: 'T', al: 'c', bs: 'm' });
    const nd = v => (isFinite(v) ? difNum(v, 4) : '\\text{n.d.}'), row = d => [difNum(d.h, 4), nd(d.y), nd(d.dq)];
    const hlR = T.right.findIndex(d => Math.abs(d.h - h) < 1e-12), hlL = T.left.findIndex(d => Math.abs(d.h - h) < 1e-12);
    const tabR = difTable(S, x00, yT, cols, T.right.map(row), tfs, hlR), tabL = difTable(S, x00 + tw + gap, yT, cols, T.left.map(row), tfs, hlL);
    const lim = (v, side) => (isFinite(v) ? 'm_s\\to ' + difNum(v, 3) : '\\text{kein Grenzwert}');
    const yL = yT + tabR.h + tfs * 0.9;
    S.rich(x00 + tw / 2, yL, '\\text{Grenzwert für}\\ h\\to 0\\text{:}\\ \\col{v}{' + lim(T.limR) + '}', { size: tfs, col: 'T', al: 'c', bs: 'm' });
    S.rich(x00 + tw + gap + tw / 2, yL, '\\text{Grenzwert für}\\ h\\to 0\\text{:}\\ \\col{v}{' + lim(T.limL) + '}', { size: tfs, col: 'T', al: 'c', bs: 'm' });
  }
  // Formeln und Schlussfolgerung
  const br = R[2], sym = '\\col{v}{m_s}=\\frac{\\col{r}{\\Delta y}}{\\col{b}{h}}=\\frac{f(x_0+h)-f(x_0)}{h}';
  lines.push({ s: sym, hl: 'ms' });
  if (meet && tanOk) lines.push({ s: '\\col{b}{h=0}:\\ \\ \\col{v}{m_s}=\\col{g}{' + difNum(T.fp, 4) + '}' });
  if (q) {
    const dy = f1 - f0;
    lines.push({ s: '\\col{b}{h=' + difNum(h, 4) + '}:\\ \\ \\frac{\\col{r}{' + difNum(dy, 4) + '}}{\\col{b}{' + difNum(h, 4) + '}}=\\col{v}{' + difNum(dy / h, 4) + '}' });
  }
  lines.push(null);
  if (ok) {
    if (T.status === 'kink') {
      lines.push({ s: '\\text{Die Grenzwerte von links und rechts sind verschieden:}', col: ST_R });
      lines.push({ s: '\\text{An dieser Stelle ist f nicht differenzierbar (Knick).}', col: ST_R });
    } else if (T.status === 'undef') {
      lines.push({ s: '\\text{Hier gibt es keine endliche Steigung.}', col: ST_R });
    } else if (T.status === 'steep') {
      lines.push({ s: '\\text{Die Steigung wird beliebig gross:}', col: ST_R });
      lines.push({ s: '\\text{Senkrechte Tangente: f ist nicht differenzierbar.}', col: ST_R });
    } else {
      lines.push({ s: '\\text{Beide Grenzwerte sind gleich:}' });
      lines.push({ s: "f'(x_0)=\\col{g}{" + difNum(T.fp, 4) + '}\\ \\ \\text{(Steigung der Tangente)}' });
    }
  }
  difLines(S, br, lines, C, { max: fs * 1.25 });
}
DIF_SCENES.tan = difSceneTan;

// ═════════════ Graphisches Ableiten ═════════════
function difMonoColor(F, mode) {
  if (!mode || mode === 'none') return null;
  const g = F.f(mode === 'curv' ? 2 : 1);
  return x => { const v = g(x); return !isFinite(v) ? 'T' : mode === 'curv' ? (v > 1e-9 ? ST_B : v < -1e-9 ? ST_O : 'T') : (v > 1e-9 ? DIF_UP : v < -1e-9 ? DIF_DOWN : 'T'); };
}
function difSceneGr(S, W, H, C) {
  const F = C.F, f = F.f(0), d1 = F.f(1), x0 = C.x0, fs = C.fs;
  const R = stLayout(W, H, [{ w: 1, rows: [1.25, 1] }]);
  // Ausschnitt: automatisch um die interessanten Stellen (C.smart), sonst der selbst gewählte (C.win mit s0/s1 für f′)
  const sm = C.smart, cw = C.win || {};
  const win = sm ? { x0: sm.x0, x1: sm.x1, y0: sm.y0, y1: sm.y1 } : difWindow(C, f), fp0 = d1(x0), f00 = f(x0);
  const ok = isFinite(f00), okd = isFinite(fp0);
  // besondere Stellen (Extrema, Wendepunkte): x₀ rastet dort ein; Texte dazu
  const marks = (C.marks || []).filter(c => c.x > win.x0 && c.x < win.x1), hit = marks.find(c => Math.abs(c.x - x0) < 1e-7 * (1 + Math.abs(c.x)));
  const HIT = { max: ['Hochpunkt: Tangente waagrecht', 'Nullstelle von f′, Wechsel von + nach −'], min: ['Tiefpunkt: Tangente waagrecht', 'Nullstelle von f′, Wechsel von − nach +'],
    saddle: ['Sattelpunkt: Tangente waagrecht', 'Nullstelle von f′ ohne Vorzeichenwechsel'], wmax: ['Wendepunkt: Steigung am grössten', 'Hochpunkt von f′'], wmin: ['Wendepunkt: Steigung am kleinsten', 'Tiefpunkt von f′'] };
  const hx = hit && HIT[hit.kind];
  const word = hx ? '\\col{v}{\\text{' + hx[0] + '}}' : !okd ? '' : fp0 > 1e-9 ? '\\col{g}{\\text{steigt}}' : fp0 < -1e-9 ? '\\col{o}{\\text{fällt}}' : '\\text{waagrecht}';
  const m1 = difFrame(S, R[0], win, C, { title: 'f(x)', info: ok && okd ? "f'(x_0)=" + difNum(Math.abs(fp0) < 1e-9 ? 0 : fp0, 3) + '\\ \\ ' + word : '', xlab: 'x', ylab: 'y' });
  const ya = sm ? [sm.s0, sm.s1] : isFinite(cw.s0) && isFinite(cw.s1) && cw.s1 > cw.s0 ? [cw.s0, cw.s1] : difAutoY(d1, win.x0, win.x1), w2 = { x0: win.x0, x1: win.x1, y0: ya[0], y1: ya[1] };
  const m2 = difFrame(S, R[1], w2, C, { title: "f'(x)", info: C.show.hidefp ? '\\text{Skizziere die Ableitung selbst.}' : hx ? '\\col{v}{\\text{' + hx[1] + '}}' : '', xlab: 'x', ylab: "y" });
  S.maps.main = m1; S.maps.sub = m2;
  // Stellen mit f' = 0
  if (C.show.crit && C.K) {
    C.K.crit.concat([]).forEach(c => { if (c.x > win.x0 && c.x < win.x1) { [m1, m2].forEach(mm => S.line(mm.X(c.x), mm.T, mm.X(c.x), mm.B, { col: ST_V, lw: 1.2, dash: true, a: 0.8 })); } });
  }
  difCurve(S, m1, f, { hl: 'f', col: 'T', lw: 2.4, colorAt: difMonoColor(F, C.show.color || 'mono'), exp: C.exp });
  const rv = C.reveal;                                                     // Animation: f′ nur bis zur aktuellen Stelle
  if (!C.show.hidefp) { if (rv) difCurve(S, m2, d1, { hl: 'fp', col: ST_R, lw: 1.2, dash: true, a: 0.25, exp: C.exp }); difCurve(S, m2, rv ? (x => (x >= rv[0] && x <= rv[1] ? d1(x) : NaN)) : d1, { hl: 'fp', col: ST_R, lw: 2.4, exp: C.exp }); }
  else (C.trace || []).forEach(tx => { const y = d1(tx); if (isFinite(y)) difDot(S, m2, tx, y, { fill: ST_R, r: 2.6, a: 0.8 }); });
  if (marks.length <= 20) marks.forEach(c => {                              // Einrastpunkte als Ringe
    const y = f(c.x), px = m1.X(c.x), py = m1.Y(y); if (isFinite(py) && difInside(m1, px, py, 1)) { S.circ(px, py, 5, { stroke: ST_V, lw: 1.6 }); shlC(S, 'mk', px, py, 11); }
    const y2 = d1(c.x), qy = m2.Y(y2); if (!C.show.hidefp && (!rv || c.x <= rv[1]) && isFinite(qy) && difInside(m2, px, qy, 1)) { S.circ(px, qy, 5, { stroke: ST_V, lw: 1.6 }); shlC(S, 'mk', px, qy, 11); }
  });
  if (ok) {
    if (C.show.tangent !== false && okd) difLine(S, m1, x0, f00, fp0, { hl: 'tan', col: ST_G, lw: 2 });
    const px = m1.X(x0);
    if (isFinite(px) && px >= m1.L && px <= m1.R) {
      S.line(px, m1.Y(f00), px, m2.B, { col: 'M', lw: 1, dash: true, a: 0.9 });
      const P = difDot(S, m1, x0, f00, { fill: 'T', r: 5.2 });
      if (P) S.pts.push({ id: 'x0', x: P[0], y: P[1], r: 11 });
      if (okd) {
        const Q = difDot(S, m2, x0, fp0, { fill: ST_R, stroke: 'T', r: 5.6 });
        if (Q) { S.pts.push({ id: 'x0', x: Q[0], y: Q[1], r: 11 }); S.line(m2.L, Q[1], Q[0], Q[1], { col: ST_R, lw: 1, dash: true, a: 0.7 }); difLabel(S, m2, m2.L - fs * 0.0, Q[1] - fs * 0.0, '', C); }
      }
    }
  }
}
DIF_SCENES.gr = difSceneGr;

// ═════════════ Ableiten mit Regeln ═════════════
function difSceneRg(S, W, H, C) {
  const F = C.F, f = F.f(0), d1 = F.f(1), x0 = C.x0, fs = C.fs;
  const R = stLayout(W, H, [{ w: 0.6, rows: [1.7] }, { w: 0.4, rows: [1] }]);
  const win = difWindow(C, f), m = difFrame(S, R[0], win, C, { title: 'f(x)', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (C.show.deriv) difCurve(S, m, d1, { hl: 'fp', col: ST_R, lw: 1.8, dash: true, a: 0.9, exp: C.exp });
  difCurve(S, m, f, { hl: 'f', col: 'T', lw: 2.4, exp: C.exp });
  const y0 = f(x0), k = d1(x0), ok = isFinite(y0), okd = isFinite(k);
  if (ok && okd) {
    difLine(S, m, x0, y0, k, { hl: 'tan', col: ST_G, lw: 2 });
    if (C.show.normal && Math.abs(k) > 1e-9) difLine(S, m, x0, y0, -1 / k, { hl: 'nor', col: ST_O, lw: 2 });
    else if (C.show.normal) { const px = m.X(x0); S.line(px, m.T, px, m.B, { col: ST_O, lw: 2 }); }
  }
  if (ok) { const P = difDot(S, m, x0, y0, { fill: 'T', r: 5.2 }); if (P) { S.pts.push({ id: 'x0', x: P[0], y: P[1], r: 11 }); difLabel(S, m, P[0], P[1] - fs * 1.1, 'P', C, { w: fs * 1.5, dx: -fs * 0.4 }); } }
  // Zusammenfassung rechts
  const L = [];
  const tex = a => (a ? Dif.tx(a) : '?');
  L.push({ s: 'f(x)=' + tex(F.ast), size: 1 });
  const dd = F.deriv(1); L.push({ s: "f'(x)=" + tex(dd), col: ST_R });
  L.push(null);
  if (ok && okd) {
    const q = y0 - k * x0, lin = (a, b) => (Math.abs(a) < 1e-12 ? difNum(b, 3) : (Math.abs(a - 1) < 1e-12 ? '' : Math.abs(a + 1) < 1e-12 ? '-' : difNum(a, 3)) + 'x' + (Math.abs(b) < 1e-12 ? '' : (b > 0 ? '+' : '-') + difNum(Math.abs(b), 3)));
    L.push({ s: 'P(' + difNum(x0, 3) + '\\,|\\,' + difNum(y0, 3) + ')' });
    L.push({ s: "m_t=f'(" + difNum(x0, 3) + ')=\\col{g}{' + difNum(k, 4) + '}' });
    L.push({ s: '\\col{g}{t\\colon\\ y=' + lin(k, q) + '}' });
    if (C.show.normal) {
      if (Math.abs(k) > 1e-9) { const mn = -1 / k; L.push({ s: '\\col{o}{n\\colon\\ y=' + lin(mn, y0 - mn * x0) + '}' }); } else L.push({ s: '\\col{o}{n\\colon\\ x=' + difNum(x0, 3) + '}' });
    }
  } else L.push({ s: '\\text{An dieser Stelle gibt es keine Tangente.}', col: ST_R });
  difLines(S, R[1], L, C, { max: fs * 1.3 });
}
DIF_SCENES.rg = difSceneRg;

// ═════════════ Kurvendiskussion ═════════════
function difSceneKd(S, W, H, C) {
  const F = C.F, f = F.f(0), K = C.K, fs = C.fs;
  const R = stLayout(W, H, [{ w: 0.62, rows: [1.8] }, { w: 0.38, rows: [1] }]);
  const win = difWindow(C, f), m = difFrame(S, R[0], win, C, { title: 'f(x)', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (C.show.d2) difCurve(S, m, F.f(2), { col: ST_V, lw: 1.8, dash: true, exp: C.exp });
  if (C.show.d1) difCurve(S, m, F.f(1), { col: ST_R, lw: 1.8, dash: true, exp: C.exp });
  difCurve(S, m, f, { hl: 'f', col: 'T', lw: 2.4, colorAt: difMonoColor(F, C.show.color), exp: C.exp });
  const P = [];                                                   // Punkte: {x, y, kind, label}
  if (K) {
    const pt = (c, nm) => (nm + '(' + c.xTex + '\\,|\\,' + c.yTex + ')');
    K.zeros.forEach((z, i) => { const x = z.val !== undefined ? z.val : z.x; if (isFinite(x)) P.push({ x, y: 0, k: 'N', s: 'N' + (K.zeros.length > 1 ? '_{' + (i + 1) + '}' : '') + '(' + z.tex + '\\,|\\,0)' }); });
    K.crit.forEach(c => P.push({ x: c.x, y: c.y, k: c.type, s: pt(c, Dif.TYPE[c.type][0]) }));
    K.infl.forEach(c => P.push({ x: c.x, y: c.y, k: 'W', s: pt(c, c.saddle ? 'S' : 'W') }));
    const y00 = f(0); if (isFinite(y00) && !K.zeros.some(z => Math.abs((z.val !== undefined ? z.val : z.x)) < 1e-9)) P.push({ x: 0, y: y00, k: 'Y', s: 'S_y(0\\,|\\,' + difNum(y00, 3) + ')' });
  }
  const COL = { N: ST_B, max: ST_R, min: ST_G, saddle: ST_V, W: ST_O, Y: 'M' };
  // Zusammenfallende Punkte (z. B. Nullstelle und Tiefpunkt im Ursprung) nur einmal beschriften: die wichtigere Art gewinnt
  const rank = { max: 0, min: 0, saddle: 1, W: 2, N: 3, Y: 4 };
  const keep = P.filter((p, i) => !P.some((q, j) => j !== i && Math.abs(q.x - p.x) < 1e-9 && Math.abs(q.y - p.y) < 1e-9 && (rank[q.k] < rank[p.k] || (rank[q.k] === rank[p.k] && j < i))));
  const few = keep.length <= 12, placed = [];
  keep.forEach(p => {
    if (!(p.x >= win.x0 && p.x <= win.x1 && p.y >= win.y0 && p.y <= win.y1)) return;
    const c = COL[p.k], d = difDot(S, m, p.x, p.y, { fill: c, stroke: 'T', r: 4.6, lw: 1.2 }); if (d) shlC(S, p.k === 'max' || p.k === 'min' ? 'ext' : p.k, d[0], d[1], 11);
    if (!(d && few)) return;
    const up = p.k !== 'min' && p.k !== 'N', w = p.s.replace(/\\[a-z]+|[{}\\]/g, '').length * 0.5 * fs * 0.85 + fs;
    let dy = up ? -fs * 1.25 : fs * 1.35;
    for (let t = 0; t < 4; t++) {
      const cx = Math.min(m.R - w / 2, Math.max(m.L + w / 2, d[0])), cy = d[1] + dy;
      if (!placed.some(b => Math.abs(b.x - cx) < (b.w + w) / 2 && Math.abs(b.y - cy) < fs * 1.2)) { placed.push({ x: cx, y: cy, w }); break; }
      dy += up ? -fs * 1.25 : fs * 1.25;
    }
    difLabel(S, m, d[0], d[1] + dy, p.s, C, { w, size: 0.85, col: 'T' });
  });
  // Ergebnisse rechts
  const L = [];
  if (!K) L.push({ s: '\\text{Keine Analyse möglich.}', col: ST_R });
  else {
    const sy = { even: '\\text{achsensymmetrisch zur y-Achse}', odd: '\\text{punktsymmetrisch zum Ursprung}', none: '\\text{keine einfache Symmetrie}' }[K.sym];
    L.push({ s: sy, size: 0.95 });
    const list = (nm, a, tf) => { L.push({ s: nm, bold: true, size: 0.95 }); if (!a.length) L.push({ s: '\\text{keine}', col: 'M', size: 0.9 }); a.slice(0, 6).forEach(q => L.push({ s: tf(q), size: 0.95 })); if (a.length > 6) L.push({ s: '\\ldots', col: 'M' }); };
    L.push(null);
    list('\\text{Nullstellen}', K.zeros, z => 'x=' + z.tex);
    L.push(null);
    list('\\text{Extrempunkte}', K.crit, c => Dif.TYPE[c.type][0] + '(' + c.xTex + '\\,|\\,' + c.yTex + ')');
    L.push(null);
    list('\\text{Wendepunkte}', K.infl, c => (c.saddle ? 'S' : 'W') + '(' + c.xTex + '\\,|\\,' + c.yTex + ')');
    if (!K.poly) { L.push(null); L.push({ s: '\\text{Näherungswerte im sichtbaren Bereich.}', col: 'M', size: 0.85 }); }
  }
  difLines(S, R[1], L, C, { max: fs * 1.2 });
}
DIF_SCENES.kd = difSceneKd;

// ═════════════ Grenzwerte von Funktionen ═════════════
function difSceneLim(S, W, H, C) {
  const F = C.F, f = F.f(0), fs = C.fs, inf = C.lmode === 'inf', a = C.x0, h = Math.max(1e-4, Math.abs(C.h));
  const solo = !!(C.show && C.show.card);                               // Karte offen: Zahlenreihen stehen dort, das Bild wird gross
  const R = solo ? stLayout(W, H, [{ w: 1, rows: [1] }]) : stLayout(W, H, [{ w: 0.62, rows: [1] }, { w: 0.38, rows: [1.3, 0.8] }]);
  const win = difWindow(C, f), m = difFrame(S, R[0], win, C, { title: 'f(x)=' + Dif.tx(F.ast), xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  difCurve(S, m, f, { col: 'T', lw: 2.2, hl: 'f', exp: C.exp });
  const Ll = inf ? Dif.limNum(f, -Infinity, -1) : Dif.limNum(f, a, -1), Lr = inf ? Dif.limNum(f, Infinity, 1) : Dif.limNum(f, a, 1);
  const same = Ll.kind === 'fin' && Lr.kind === 'fin' && Math.abs(Ll.v - Lr.v) < 1e-4;
  const ay = Math.min(m.R, Math.max(m.L, m.X(0)));
  if (inf) {
    [Lr, Ll].forEach((L, i) => { if (L.kind === 'fin' && (i === 0 || !same)) difLine(S, m, 0, L.v, 0, { col: ST_G, lw: 1.5, dash: true, hl: 'L' }); });
  } else {
    const px = m.X(a); if (px >= m.L && px <= m.R) { S.line(px, m.T, px, m.B, { col: 'M', lw: 1, dash: true, a: 0.8 }); shl(S, 'a', [[px, m.T], [px, m.B]]); }
    linPt(S, m, 'x0', a, 0, C, { fill: 'T', r: 5.2, lab: 'a=' + linFmt(a), dy: fs * 1.4, dx: 0, w: fs * 4 });
    if (same) {
      const L = Ll.v, fa = f(a), py = m.Y(L);
      if (py > m.T && py < m.B) {
        S.line(ay, py, px, py, { col: ST_G, lw: 1.3, dash: true }); shl(S, 'L', [[ay, py], [px, py]]);
        if (isFinite(fa) && Math.abs(fa - L) < 1e-6) S.circ(px, py, 5.4, { fill: ST_G, stroke: 'T', lw: 1.2 });
        else { S.circ(px, py, 5.4, { fill: 'W', stroke: ST_G, lw: 2 }); if (isFinite(fa)) difDot(S, m, a, fa, { fill: ST_R, r: 4.6 }); }
        shlC(S, 'L', px, py, 11);
        difLabel(S, m, px + fs * 2.8, py - fs * 0.9, '\\col{g}{L=' + linFmt(L) + '}', C, { size: 0.9, hl: 'L' });
      }
    }
  }
  // die beiden Punkte, die sich von links und rechts nähern
  const xl = inf ? -1 / h : a - h, xr = inf ? 1 / h : a + h;
  [[xl, ST_O, 'hl'], [xr, ST_B, 'hr']].forEach(([x, col, id]) => {
    const y = f(x); if (!isFinite(y)) return;
    const P = difDot(S, m, x, y, { fill: col, stroke: 'T', r: 5.6 }); if (!P) return;
    S.pts.push({ id, x: P[0], y: P[1], r: 11 });
    difSeg(S, m, x, 0, x, y, { col, lw: 1, dash: true, a: 0.8 });
    if (P[1] > m.T && P[1] < m.B) S.line(ay, P[1], P[0], P[1], { col, lw: 1, dash: true, a: 0.6 });
  });
  if (solo) return;
  // rechts: Zahlenreihen von links und rechts
  const tr = R[1], nd = v => (isFinite(v) ? difNum(v, 4) : '\\text{n.d.}');
  const hs = Dif.LIM_H, rowsL = hs.map(t => { const x = inf ? -1 / t : a - t; return [difNum(x, 4), nd(f(x))]; }), rowsR = hs.map(t => { const x = inf ? 1 / t : a + t; return [difNum(x, 4), nd(f(x))]; });
  const cols = [{ h: 'x', w: 4.2 }, { h: 'f(x)', w: 4.6 }], tw = 8.8;
  const tfs = Math.max(7.5, Math.min(fs, (tr.w - 10) / (2 * tw + 1), (tr.h - fs * 2.2) / (1.85 * (hs.length + 1.6))));
  const gap = tfs, x00 = tr.x + Math.max(0, (tr.w - (2 * tw * tfs + gap)) / 2), yT = tr.y + tfs * 2;
  S.rich(x00 + tw * tfs / 2, tr.y + tfs * 0.9, inf ? '\\col{o}{x\\to-\\infty}' : '\\col{o}{\\text{von links}}', { size: tfs, col: 'T', al: 'c', bs: 'm' });
  S.rich(x00 + tw * tfs * 1.5 + gap, tr.y + tfs * 0.9, inf ? '\\col{b}{x\\to\\infty}' : '\\col{b}{\\text{von rechts}}', { size: tfs, col: 'T', al: 'c', bs: 'm' });
  const hi = hs.findIndex(t => Math.abs(t - h) < 1e-12);
  difTable(S, x00, yT, cols, rowsL, tfs, hi); difTable(S, x00 + tw * tfs + gap, yT, cols, rowsR, tfs, hi);
  const lt = L => (L.kind === 'fin' ? difNum(L.v, 4) : L.kind === 'inf' ? (L.sign > 0 ? '\\infty' : '-\\infty') : '\\text{–}');
  const A = inf ? '' : difNum(a, 4);
  const lines = inf ? [{ s: '\\lim_{x\\to\\infty}f(x)=' + lt(Lr), hl: 'L' }, { s: '\\lim_{x\\to-\\infty}f(x)=' + lt(Ll), hl: 'L' }]
    : [{ s: '\\lim_{x\\to ' + A + '^-}f(x)=' + lt(Ll) }, { s: '\\lim_{x\\to ' + A + '^+}f(x)=' + lt(Lr) }, same ? { s: '\\col{g}{\\lim_{x\\to ' + A + '}f(x)=' + difNum(Ll.v, 4) + '}', bold: true, hl: 'L' } : { s: '\\text{kein Grenzwert}', col: ST_R }];
  difLines(S, R[2], lines, C, { max: fs * 1.15 });
}
DIF_SCENES.lim = difSceneLim;

// ═════════════ Extremwertprobleme ═════════════
// Bild der Situation in einem Feld r (Pixel); x = aktuelle Variable
function difExtPic(S, r, k, p, x, C) {
  const fs = C.fs, cx = r.x + r.w / 2, cy = r.y + r.h / 2, m = { L: r.x, R: r.x + r.w, T: r.y, B: r.y + r.h };
  const box = (x0, y0, w, h, o) => S.poly([[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], Object.assign({ close: true, lw: 1.6 }, o));
  const lab = (px, py, s, hl) => difLabel(S, m, px, py, s, C, { size: 0.9, hl });
  const n = v => linFmt(Math.round(v * 100) / 100);
  if (k === 'rect' || k === 'fence') {
    const L = p[0], y = k === 'rect' ? L / 2 - x : L - 2 * x, mx = k === 'rect' ? L / 2 : L, s = Math.min(r.w * 0.8 / mx, r.h * 0.62 / (k === 'rect' ? L / 2 : L / 2));
    const w = y * s, hh = x * s, x0 = cx - w / 2, y0 = cy - hh / 2;
    box(x0, y0, w, hh, { fill: ST_B, col: ST_B, a: 0.22 }); shl(S, 'pic', [[x0, y0], [x0 + w, y0], [x0 + w, y0 + hh], [x0, y0 + hh]], true);
    if (k === 'fence') { S.line(x0 - fs, y0, x0 + w + fs, y0, { col: 'T', lw: 5 }); lab(cx, y0 - fs * 0.9, '\\text{Mauer}'); }
    S.line(x0 + w, y0, x0 + w, y0 + hh, { col: ST_V, lw: 3 }); shl(S, 'x', [[x0 + w, y0], [x0 + w, y0 + hh]]);
    lab(x0 + w + fs * 2.4, cy, '\\col{v}{x=' + n(x) + '}', 'x'); lab(cx, y0 + hh + fs * 1.1, 'y=' + n(y));
  } else if (k === 'box') {
    const a = p[0], b = p[1], s = Math.min(r.w * 0.85 / a, r.h * 0.8 / b), W = a * s, Hh = b * s, x0 = cx - W / 2, y0 = cy - Hh / 2, q = x * s;
    box(x0, y0, W, Hh, { fill: ST_B, col: 'T', a: 0.12 }); shl(S, 'pic', [[x0, y0], [x0 + W, y0], [x0 + W, y0 + Hh], [x0, y0 + Hh]], true);
    [[x0, y0], [x0 + W - q, y0], [x0, y0 + Hh - q], [x0 + W - q, y0 + Hh - q]].forEach(([u, v]) => { box(u, v, q, q, { fill: ST_R, col: ST_R, a: 0.45 }); shl(S, 'x', [[u, v], [u + q, v], [u + q, v + q], [u, v + q]], true); });
    S.poly([[x0 + q, y0 + q], [x0 + W - q, y0 + q], [x0 + W - q, y0 + Hh - q], [x0 + q, y0 + Hh - q]], { close: true, col: 'M', lw: 1, dash: true });
    lab(x0 + q / 2, y0 + q + fs * 0.9, '\\col{r}{x}', 'x'); lab(cx, y0 - fs * 0.8, n(a - 2 * x) + '\\ \\text{(Länge)}'); lab(x0 + W + fs * 0.2, cy, '');
    lab(cx, y0 + Hh + fs * 1.0, '\\text{Breite }' + n(b - 2 * x) + ',\\ \\text{Höhe }' + n(x));
  } else if (k === 'can') {
    const V = p[0], hgt = V / (Math.PI * x * x), s = Math.min(r.w * 0.7 / (2 * x), r.h * 0.7 / (hgt + x * 0.6)), rw = x * s, hh = hgt * s, ry = Math.max(3, rw * 0.28), y0 = cy - hh / 2;
    const ell = (yy, part) => { const pts = []; for (let i = 0; i <= 40; i++) { const t = part ? Math.PI * i / 40 : 2 * Math.PI * i / 40; pts.push([cx + rw * Math.cos(t), yy + ry * Math.sin(t)]); } return pts; };
    S.poly([[cx - rw, y0], [cx + rw, y0], [cx + rw, y0 + hh], [cx - rw, y0 + hh]], { fill: ST_B, col: ST_B, a: 0.2, close: true, lw: 0.1 });
    S.line(cx - rw, y0, cx - rw, y0 + hh, { col: 'T', lw: 1.6 }); S.line(cx + rw, y0, cx + rw, y0 + hh, { col: 'T', lw: 1.6 });
    S.poly(ell(y0, false), { col: 'T', lw: 1.6, fill: ST_B, a: 0.3, close: true }); S.poly(ell(y0 + hh, true), { col: 'T', lw: 1.6 });
    shl(S, 'pic', [[cx - rw, y0], [cx + rw, y0], [cx + rw, y0 + hh], [cx - rw, y0 + hh]], true);
    S.line(cx, y0, cx + rw, y0, { col: ST_V, lw: 3 }); shl(S, 'x', [[cx, y0], [cx + rw, y0]]);
    lab(cx + rw / 2, y0 - ry - fs * 0.8, '\\col{v}{r=' + n(x) + '}', 'x'); lab(cx + rw + fs * 2.6, cy, 'h=' + n(hgt));
  } else if (k === 'para') {
    const c = p[0], rc = Math.sqrt(c), s = Math.min(r.w * 0.85 / (2 * rc * 1.15), r.h * 0.8 / (c * 1.1)), bx = cx, by = r.y + r.h * 0.9;
    const X = u => bx + u * s, Y = v => by - v * s, pts = [];
    for (let i = 0; i <= 60; i++) { const u = -rc * 1.1 + 2.2 * rc * i / 60; pts.push([X(u), Y(c - u * u)]); }
    S.line(X(-rc * 1.15), by, X(rc * 1.15), by, { col: 'L', lw: 1.4 }); S.line(bx, by, bx, Y(c * 1.05), { col: 'L', lw: 1.4 });
    S.poly(pts.filter(q => q[1] <= by + 1), { col: 'T', lw: 2 });
    const hy = c - x * x; S.poly([[X(-x), by], [X(x), by], [X(x), Y(hy)], [X(-x), Y(hy)]], { fill: ST_B, col: ST_B, a: 0.25, close: true, lw: 1.4 });
    shl(S, 'pic', [[X(-x), by], [X(x), by], [X(x), Y(hy)], [X(-x), Y(hy)]], true);
    S.line(bx, by, X(x), by, { col: ST_V, lw: 3 }); shl(S, 'x', [[bx, by], [X(x), by]]);
    lab((bx + X(x)) / 2, by + fs * 0.9, '\\col{v}{x=' + n(x) + '}', 'x'); lab(X(x) + fs * 2.4, Y(hy / 2), 'y=' + n(hy));
  }
}
function difSceneExt(S, W, H, C) {
  const r = Dif.extSolve(C.ek, C.ep); if (!r) return;
  const fs = C.fs, f = r.F.f(0), E0 = r.E, d0 = r.dom[0], d1 = r.dom[1], sp = d1 - d0, x = Math.max(d0 + sp * 0.01, Math.min(d1 - sp * 0.01, C.ex));
  const R = stLayout(W, H, W >= 820 ? [{ w: 0.42, rows: [1.7, 0.8] }, { w: 0.58, rows: [1] }] : [{ w: 0.42, rows: [1, 0.5] }, { w: 0.58, rows: [1.6] }]);
  if (typeof stKeepFrame === 'function') stKeepFrame(R[0]);
  (S.frames || (S.frames = [])).push([R[0].x, R[0].y, R[0].x + R[0].w, R[0].y + R[0].h, R[0].x, R[0].y, R[0].x + R[0].w, R[0].y + R[0].h]);
  S.rich(R[0].x + fs * 0.4, R[0].y + fs * 1.0, '\\text{' + E0.t + '}', { size: fs * 1.0, col: 'T', al: 'l', bs: 'm' });
  difExtPic(S, { x: R[0].x, y: R[0].y + fs * 2, w: R[0].w, h: R[0].h - fs * 2.4 }, C.ek, C.ep, x, C);
  const g = t => (t > d0 && t < d1 ? f(t) : NaN), ya = difAutoY(g, d0 + sp * 0.005, d1 - sp * 0.005, 300);
  let win = C.win || {};
  if (!(isFinite(win.x0) && isFinite(win.x1) && win.x1 > win.x0 && isFinite(win.y0) && isFinite(win.y1) && win.y1 > win.y0)) {
    const lo = Math.min(0, ya[0]), hi = Math.max(0, ya[1]);
    win = { x0: d0 - sp * 0.06, x1: d1 + sp * 0.06, y0: lo - (hi - lo) * 0.06, y1: hi + (hi - lo) * 0.12 };
  }
  const m = difFrame(S, R[2], win, C, { title: E0.zt(C.ep), xlab: 'x', ylab: E0.zn });
  S.maps.main = m;
  const rev = typeof C.extRev === 'number' ? C.extRev : null;               // Animation: die Kurve entsteht, während x läuft
  difCurve(S, m, rev === null ? g : (t => (t <= rev ? g(t) : NaN)), { col: ST_B, lw: 2.4, hl: 'Z', exp: C.exp });
  if (r.best && (rev === null || rev >= r.best.x - 1e-9)) { const xb = r.best.x; linPt(S, m, null, xb, f(xb), C, { fill: ST_G, r: 5.8, hl: 'opt', lab: '\\col{g}{' + E0.zn + '_{' + (E0.goal === 'max' ? 'max' : 'min') + '}\\ \\text{bei }x\\approx ' + linFmt(Math.round(xb * 1000) / 1000) + '}', lines: [[1, 0]], w: fs * 10 }); difLine(S, m, xb, f(xb), 0, { col: ST_G, lw: 1, dash: true, a: 0.6 }); }
  const k1 = r.F.f(1)(x); if (isFinite(k1)) { const dx = sp * 0.12; difSeg(S, m, x - dx, f(x) - k1 * dx, x + dx, f(x) + k1 * dx, { col: ST_V, lw: 1.6, hl: 'tan' }); }
  linPt(S, m, 'ex', x, f(x), C, { fill: ST_V, r: 6, hl: 'ex', lab: '\\col{v}{x=' + linFmt(Math.round(x * 100) / 100) + '}', lines: [[1, k1 || 0]], w: fs * 5 });
  const n = v => linFmt(Math.round(v * 100) / 100);
  difLines(S, R[1], [{ s: '\\text{Nebenbedingung: }' + E0.nb(C.ep) }, { s: '\\col{v}{x=' + n(x) + '}\\ \\Rightarrow\\ ' + E0.zn + '(x)=' + n(f(x)), hl: 'ex' }, { s: E0.zn + "'(x)=" + n(k1) + (Math.abs(k1) < 1e-2 * Math.max(1, Math.abs(f(x))) ? '\\ \\text{(waagrechte Tangente)}' : k1 > 0 ? '\\ \\text{(steigt)}' : '\\ \\text{(fällt)}'), hl: 'tan' }], C, { max: fs * 1.05 });
}
DIF_SCENES.ext = difSceneExt;

// ═════════════ Polynom aus Bedingungen ═════════════
function difSceneStb(S, W, H, C) {
  const cs = C.sc || [], fs = C.fs, r = Dif.stbSolve(C.sn, cs), E = Dif.E;
  const R = stLayout(W, H, [{ w: 0.64, rows: [1] }, { w: 0.36, rows: [1] }]);
  const g = r.ok ? (x => E.pEvalNum(r.P, x)) : null;
  let win = C.win || {};
  if (!(isFinite(win.x0) && isFinite(win.x1) && win.x1 > win.x0 && isFinite(win.y0) && isFinite(win.y1) && win.y1 > win.y0)) {
    const xs = cs.map(c => c.x), lo = Math.min(-1, ...xs), hi = Math.max(1, ...xs), pad = Math.max(1.5, (hi - lo) * 0.35), x0 = lo - pad, x1 = hi + pad;
    const ys = cs.filter(c => c.t === 'p' || c.t === 'e' || c.t === 'w').map(c => c.y), yy = g ? difAutoY(g, x0, x1, 200) : [-5, 5];
    const y0 = Math.min(yy[0], ...ys, 0), y1 = Math.max(yy[1], ...ys, 0), ph = (y1 - y0) * 0.12 || 1;
    win = { x0, x1, y0: y0 - ph, y1: y1 + ph };
  }
  const m = difFrame(S, R[0], win, C, { title: r.ok ? 'f(x)=' + E.pTex(r.P, 'x') : '\\text{Polynom noch nicht festgelegt}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (g) difCurve(S, m, g, { col: ST_B, lw: 2.4, hl: 'f', exp: C.exp });
  const COL = { p: 'T', e: ST_R, w: ST_O, s: ST_V, ex: ST_R, wx: ST_O }, GRP = { p: 'Pp', e: 'Pe', w: 'Pw', s: 'Ps', ex: 'Pe', wx: 'Pw' };
  const n = v => linFmt(v);
  cs.forEach((c, i) => {
    const id = 'c' + i, col = COL[c.t], grp = GRP[c.t], sp = (win.x1 - win.x0) * 0.08;
    if (c.t === 'p' || c.t === 'e' || c.t === 'w') {
      if (c.t === 'e') difSeg(S, m, c.x - sp, c.y, c.x + sp, c.y, { col, lw: 2.2, hl: grp });
      const nm = c.t === 'p' ? 'P' : c.t === 'e' ? 'E' : 'W';
      linPt(S, m, id, c.x, c.y, C, { fill: col, r: 5.6, hl: grp, lab: '\\col{' + ({ T: 'b', [ST_R]: 'r', [ST_O]: 'o' }[col] || 'b') + '}{' + nm + '(' + n(c.x) + '\\,|\\,' + n(c.y) + ')}', lines: [[1, 0]], w: fs * 7 });
    } else if (c.t === 's') {
      const y = g ? g(c.x) : 0; difSeg(S, m, c.x - sp, y - c.y * sp, c.x + sp, y + c.y * sp, { col, lw: 2.2, hl: grp });
      linPt(S, m, id, c.x, y, C, { fill: col, r: 5, hl: grp, lab: "\\col{v}{f'(" + n(c.x) + ')=' + n(c.y) + '}', lines: [[1, c.y]], w: fs * 7 });
    } else {
      difSeg(S, m, c.x, win.y0, c.x, win.y1, { col, lw: 1.2, dash: true, hl: grp });
      linPt(S, m, id, c.x, 0, C, { fill: col, r: 5, hl: grp, lab: (c.t === 'ex' ? "f'" : "f''") + '(' + n(c.x) + ')=0', dy: fs * 1.4, dx: 0, w: fs * 6 });
    }
  });
  const rows = Dif.stbSolve ? r.rows : [], need = C.sn + 1;
  const L = [{ s: '\\text{Grad ' + C.sn + ': ' + need + ' Unbekannte, ' + rows.length + ' Gleichungen}', col: rows.length === need ? ST_G : ST_R, size: 0.9 }];
  rows.forEach(q => L.push({ s: (q.k === 0 ? 'f' : q.k === 1 ? "f'" : "f''") + '(' + n(q.x) + ')=' + n(q.y), size: 0.95 }));
  L.push(null);
  L.push(r.ok ? { s: '\\col{b}{f(x)=' + E.pTex(r.P, 'x') + '}', bold: true, hl: 'f' } : { s: rows.length === need ? '\\text{keine eindeutige Lösung}' : '\\text{Gleichungen ergänzen}', col: ST_R });
  difLines(S, R[1], L, C, { max: fs * 1.1 });
}
DIF_SCENES.stb = difSceneStb;

function difBuildScene(W, H, C) {
  const S = difScene(), fn = DIF_SCENES[C.view];
  if (fn && C.F) fn(S, W, H, C);
  return S;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { difBuildScene, DIF_SCENES, difAutoY, difClip, difCurve, difFrame, difScene };
