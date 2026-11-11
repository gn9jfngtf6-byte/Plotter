// ═══════════════════════════════════════════════════════════════════
// 94_exp_draw.js — Exponential- und Logarithmusfunktionen: Bilder (Szenen)
//
// Gleiche Bauweise wie 91_pow_draw.js (Hilfen aus 81_lin_draw.js: linPt, linLayout, linTab, linFmt …; aus 61_dif_draw.js:
// difFrame, difCurve, difSeg, difLine, difLines). Der Massstab ist nur in der Logarithmus-Ansicht (Spiegelung an y = x) gleich.
//
// Ansichten:  grow  Wachstum und Zerfall a·b^x + d (Faktor-Schritte, Vergleich mit linearem Wachstum, Asymptote, Wertetabelle)
//             e     Die Zahl e: Tangente an e^x mit Steigung = Funktionswert, (1+1/n)^n, Vergleich mit 2^x und 3^x
//             log   Logarithmus als Umkehrung: b^x und log_b x gespiegelt an y = x, Wertetabelle
//             eq    Gleichung a·b^x + d = c (ziehbare Gerade y = c) und Anwendungen in Einheiten
// Kontext C: {view, F, xp, x0, c, app, win, fs, exp, smooth, show}
// Farben: Funktion blau, Logarithmus grün, Vergleich grau, Asymptote rot, Spiegelpunkt violett, Gerade y = c orange.
// ═══════════════════════════════════════════════════════════════════
const XP_F = ST_B, XP_G = ST_G, XP_A = ST_R, XP_M = ST_V, XP_Y = ST_O;

// Ausschnitt mit unabhängigen Achsen (o.eq: gleicher Massstab); o.x/o.y Mindestbereich, need: Punkte, die drin sein sollen
function expWindow(C, r, need, o) {
  o = o || {};
  const w = C.win || {};
  if (isFinite(w.x0) && isFinite(w.x1) && isFinite(w.y0) && isFinite(w.y1) && w.x1 > w.x0 && w.y1 > w.y0) { const E = { x0: w.x0, x1: w.x1, y0: w.y0, y1: w.y1 }; return autoWin('exp', '', E, need, C, E); }
  const fs = C.fs, ratio = Math.max(0.25, Math.min(3, (r.h - fs * 4.5) / Math.max(50, r.w - fs * 3.9)));
  let x0 = o.x ? o.x[0] : -3, x1 = o.x ? o.x[1] : 3, y0 = o.y ? o.y[0] : -2, y1 = o.y ? o.y[1] : 6;
  (need || []).forEach(p => { if (isFinite(p[0]) && isFinite(p[1]) && Math.abs(p[0]) < 1e5 && Math.abs(p[1]) < 1e5) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } });
  const px = Math.max(0.5, (x1 - x0) * 0.1), py = Math.max(0.5, (y1 - y0) * 0.1);
  x0 -= px; x1 += px; y0 -= py; y1 += py;
  let T;
  if (o.eq) {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hx = powNiceUp(Math.max((x1 - x0) / 2, (y1 - y0) / 2 / ratio));
    T = { x0: cx - hx, x1: cx + hx, y0: cy - hx * ratio, y1: cy + hx * ratio };
  } else {
    const hx = powNiceUp((x1 - x0) / 2), hy = powNiceUp((y1 - y0) / 2), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    T = { x0: cx - hx, x1: cx + hx, y0: cy - hy, y1: cy + hy };
  }
  if (o.pos) { T.x0 = Math.max(T.x0, o.x ? o.x[0] - px : -px); T.y0 = Math.max(T.y0, o.y ? o.y[0] - py : -py); }   // Anwendungen: nicht ins Negative
  return autoWin('exp', C.view + '|' + (o.key || '') + '|' + ratio.toFixed(2), T, need, C);
}
const expCurve = (S, m, F, o) => difCurve(S, m, Expo.fOf(F), Object.assign({ col: XP_F, lw: 2.6, hl: 'f' }, o || {}));
const expCoord = (n, x, y) => n + '(' + linFmtS(x) + '\\,|\\,' + linFmtS(y) + ')';
const expQ = q => Dif.E.qTex(q);
function expVal(F, x) { const r = Expo.evalExact(F, x); if (!isFinite(r.y)) return '\\text{–}'; return r.exact ? expQ(r.yq) : linFmt(r.y); }
function expDir(F, x) { const f = Expo.fOf(F), h = 1e-3, d = (f(x + h) - f(x - h)) / (2 * h); return isFinite(d) ? [1, d] : [0, 1]; }
const expClampY = (y, lim) => Math.max(-lim, Math.min(lim, y));
// Asymptote y = d
function expAsym(S, m, F, win, C) {
  difSeg(S, m, win.x0 - 1, F.d, win.x1 + 1, F.d, { col: XP_A, lw: 1.4, dash: true, a: 0.8 });
  S.rich(m.R - C.fs * 0.4, m.Y(F.d) - C.fs * 0.8, '\\col{r}{y=' + expQ(F.dq) + '}', { size: C.fs * 0.9, col: 'T', al: 'r', bs: 'm' });
}

// ═════════════ Wachstum und Zerfall ═════════════
function expSceneGrow(S, W, H, C) {
  const F = C.F, fs = C.fs, f = Expo.fOf(F), xp = C.xp, g = Expo.growth(F), up = g.kind === 'grow';
  const wide = W >= 820;
  const R = linLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: wide ? [1.5, 1.5] : [1.6] }]);
  const lim = 40 * Math.max(1, Math.abs(F.a) + Math.abs(F.d));
  const need = [[0, F.a + F.d], [1, F.a * F.b + F.d], [xp, expClampY(f(xp), lim)], [-2, expClampY(f(-2), lim)], [3, expClampY(f(3), lim)], [0, F.d]];
  const win = expWindow(C, R[0], need, { x: [-3, 3], y: [-1, 4], key: 'grow' });
  const m = difFrame(S, R[0], win, C, { title: '\\col{b}{' + Expo.fTex(F, 'f(x)') + '}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (F.deg) { expCurve(S, m, F); return; }
  if (C.show.asym) expAsym(S, m, F, win, C);
  if (C.show.lin) { const k = F.a * (F.b - 1); difLine(S, m, 0, F.a + F.d, k, { hl: 'lin', col: 'M', lw: 1.5, dash: true, a: 0.8 }); S.rich(m.L + fs * 0.6, m.T + fs * 2.3, '\\text{linear: } g(x)=' + linFmt(F.a + F.d) + (k < 0 ? '-' : '+') + linFmt(Math.abs(k)) + 'x', { size: fs * 0.85, col: 'M', al: 'l', bs: 'm' }); }
  // Faktor-Schritte: senkrechte Strecken bei x = 0 … 3 mit «·b»
  const gu = typeof C.growU === 'number' ? C.growU : null;                  // Animation: Schritte bauen sich einzeln auf
  if (C.show.steps || gu !== null) {
    // Balken von der Asymptote bis zum Graphen; «·b» zwischen zwei Balken knapp neben der Asymptote (dort ist Platz)
    const side = F.a > 0 ? -1 : 1, yl = m.Y(F.d) + side * fs * 0.85;
    const ks = gu === null ? [0, 1, 2, 3] : [0, 1, 2, 3, 4, 5, 6].filter(k => k <= Math.floor(win.x1) && k - 1 <= gu);
    const dl = F.a * (F.b - 1), grow = (k, v0, v1) => (gu === null || k === 0 ? v1 : v0 + (v1 - v0) * Math.max(0, Math.min(1, gu - (k - 1))));
    ks.forEach(k => {
      difSeg(S, m, k, F.d, k, grow(k, f(k - 1), f(k)), { hl: 'st', col: XP_G, lw: 2.2, a: 0.75 });
      // daneben das lineare Wachstum: jedes Mal gleich viel dazu
      if (gu !== null) difSeg(S, m, k + 0.14, F.d, k + 0.14, grow(k, F.a + F.d + (k - 1) * dl, F.a + F.d + k * dl), { col: 'M', lw: 2.2, a: 0.7 });
    });
    if (m.X(1) - m.X(0) > fs * 2.6) ks.filter(k => k >= 1 && (gu === null || gu >= k - 0.5)).forEach(k => { const x = m.X(k - 0.5); if (x > m.L + fs && x < m.R - fs && yl > m.T && yl < m.B) difLabel(S, m, x, yl, '\\col{g}{\\cdot\\,' + Expo.bTex(F) + '}', C, { size: 0.85 }); });
    if (gu !== null) S.rich(m.L + fs * 2.2, m.T + fs * 1.1, '\\col{g}{\\text{exponentiell: jedes Mal }\\cdot\\,' + Expo.bTex(F) + '}\\quad\\text{linear: jedes Mal }' + (dl < 0 ? '-' : '+') + linFmt(Math.abs(dl)), { size: fs * 0.85, col: 'M', al: 'l', bs: 'm' });
  }
  expCurve(S, m, F, { exp: C.exp });
  const nearP = x => Math.abs(xp - x) < 0.6;
  linPt(S, m, 'B', 1, F.a * F.b + F.d, C, Object.assign({ fill: XP_G, r: 5.2 }, nearP(1) ? {} : { lab: '\\col{g}{' + expCoord('', 1, F.a * F.b + F.d) + '}', lines: [expDir(F, 1), [0, 1]], w: fs * 6 }));
  linPt(S, m, 'A', 0, F.a + F.d, C, Object.assign({ fill: XP_G, r: 5.2 }, nearP(0) ? {} : { lab: '\\col{g}{' + expCoord('', 0, F.a + F.d) + '}', lines: [expDir(F, 0), [0, 1]], w: fs * 6 }));
  linPt(S, m, 'P', xp, f(xp), C, { fill: XP_F, r: 5.8, lab: '\\col{b}{' + expCoord('P', xp, f(xp)) + '}', lines: [expDir(F, xp)], w: fs * 8 });
  difLines(S, R[1], Expo.sceneLines(Expo.st.grow(F, xp)), C, { max: fs * 1.12 });
  if (!wide) return;
  const xs = [-2, -1, 0, 1, 2, 3, 4];
  const rows = xs.map((x, i) => [linFmt(x).replace('-', '−'), expVal(F, x), i ? '\\col{g}{\\cdot\\,' + Expo.bTex(F) + '}' : '']);
  linTab(S, R[2], [{ h: 'x', w: 3.5 }, { h: 'f(x)', w: 6 }, { h: '\\text{Faktor}', w: 4 }], rows, xs.indexOf(xp), C);
}

// ═════════════ Die Zahl e ═════════════
function expSceneE(S, W, H, C) {
  const fs = C.fs, x0 = C.x0, m0 = Math.exp(x0), F = Expo.mk(1, 0, 0, true), f = Expo.fOf(F);
  const wide = W >= 820;
  const R = linLayout(W, H, [{ w: 0.56, rows: [2.3] }, { w: 0.44, rows: wide ? [1.55, 1.45] : [1.6] }]);
  const need = [[0, 1], [x0, Math.min(m0, 60)], [x0 + 1, Math.min(2 * m0, 60)], [-2, 0], [2, Math.exp(2)]];
  const win = expWindow(C, R[0], need, { x: [-3, 2.5], y: [-1, 7], key: 'e' });
  const m = difFrame(S, R[0], win, C, { title: '\\col{b}{f(x)=e^x}\\quad\\col{r}{\\text{Tangente in } T}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (C.show.cmp) {
    difCurve(S, m, difRaw(x => Math.pow(2, x), '2^x'), { hl: 'cmp', col: 'M', lw: 1.3, dash: true, a: 0.7, exp: C.exp });
    difCurve(S, m, difRaw(x => Math.pow(3, x), '3^x'), { hl: 'cmp', col: 'M', lw: 1.3, dash: true, a: 0.7, exp: C.exp });
    const yl = Math.min(win.y1 - (win.y1 - win.y0) * 0.06, Math.pow(2, win.x1 - 0.3)), xl2 = Math.log2(yl), xl3 = Math.log(yl) / Math.log(3);
    if (xl2 > win.x0 && xl2 < win.x1) S.rich(m.X(xl2) + fs * 0.5, m.Y(yl), '2^x', { size: fs * 0.9, col: 'M', al: 'l', bs: 'm' });
    if (xl3 > win.x0 && xl3 < win.x1) S.rich(m.X(xl3) - fs * 0.4, m.Y(yl), '3^x', { size: fs * 0.9, col: 'M', al: 'r', bs: 'm' });
  }
  expCurve(S, m, F, { exp: C.exp });
  if (typeof C.eb === 'number') {
    // Animation: die Basis b gleitet von 2 nach 3. Steigung der Tangente in T = ln(b) · Funktionswert – nur bei b = e sind beide gleich.
    const bb = C.eb, yb = Math.pow(bb, x0), mb = Math.log(bb) * yb, isE = Math.abs(bb - Math.E) < 1e-9;
    difCurve(S, m, x => Math.pow(bb, x), { col: ST_V, lw: 2.6, exp: C.exp });
    difLine(S, m, x0, yb, mb, { col: ST_V, lw: 1.6, dash: true });
    difSeg(S, m, x0, yb, x0 + 1, yb, { col: 'M', lw: 1.4, dash: true }); difSeg(S, m, x0 + 1, yb, x0 + 1, yb + mb, { col: ST_V, lw: 2.4 });
    difDot(S, m, x0, yb, { fill: ST_V, r: 5 });
    S.rich(m.L + fs * 2.2, m.T + fs * 1.2, '\\col{v}{b=' + (isE ? 'e\\approx ' : '') + linFmt(Math.round(bb * 1000) / 1000) + '}', { size: fs * 1.15, col: 'T', al: 'l', bs: 'm', bold: true });
    S.rich(m.L + fs * 2.2, m.T + fs * 2.8, '\\text{Funktionswert }' + linFmt(Math.round(yb * 1000) / 1000) + ',\\ \\col{v}{\\text{Steigung }' + linFmt(Math.round(mb * 1000) / 1000) + '}', { size: fs * 0.95, col: 'T', al: 'l', bs: 'm' });
    S.rich(m.L + fs * 2.2, m.T + fs * 4.3, isE ? '\\col{g}{\\text{Steigung = Funktionswert}}' : '\\text{Steigung} ' + (bb < Math.E ? '<' : '>') + ' \\text{Funktionswert}', { size: fs * 0.95, col: 'T', al: 'l', bs: 'm', bold: isE });
    difLines(S, R[1], Expo.sceneLines(Expo.st.e(x0)), C, { max: fs * 1.12 });
    return;
  }
  // Tangente mit Steigungsdreieck
  difLine(S, m, x0, m0, m0, { hl: 'tan', col: XP_A, lw: 1.8 });
  if (C.show.tri) {
    difSeg(S, m, x0, m0, x0 + 1, m0, { col: ST_B, lw: 1.8, dash: true }); difSeg(S, m, x0 + 1, m0, x0 + 1, 2 * m0, { col: XP_A, lw: 2.2 });
    S.rich(m.X(x0 + 0.5), m.Y(m0) + fs * 1.0, '1', { size: fs * 0.9, col: ST_B, al: 'c', bs: 'm' });
    S.rich(m.X(x0 + 1) + fs * 0.4, m.Y(1.5 * m0), '\\col{r}{m=e^{' + linFmtS(x0) + '}' + '\\approx' + linFmtS(m0) + '}', { size: fs * 0.9, col: 'T', al: 'l', bs: 'm' });
  }
  linPt(S, m, null, 0, 1, C, { fill: XP_G, r: 4.2, lab: Math.abs(x0) < 0.6 ? undefined : '\\col{g}{(0\\,|\\,1)}', lines: [[1, 1]], w: fs * 4 });
  linPt(S, m, 'T', x0, m0, C, { fill: XP_F, r: 5.8, lab: '\\col{b}{' + expCoord('T', x0, m0) + '}', lines: [[1, m0], [1, 0], [0, 1]], w: fs * 8 });
  difLines(S, R[1], Expo.sceneLines(Expo.st.e(x0)), C, { max: fs * 1.12 });
  if (!wide) return;
  const ns = [1, 2, 5, 10, 100, 1000, 1000000];
  const rows = ns.map(n => [n >= 1e6 ? '10^6' : String(n), linFmt(Expo.eN(n))]);
  rows.push(['\\to\\infty', '\\col{b}{e\\approx' + linFmt(Math.E) + '}']);
  linTab(S, R[2], [{ h: 'n', w: 4 }, { h: '\\left(1+\\frac{1}{n}\\right)^n', w: 7 }], rows, rows.length - 1, C);
}

// ═════════════ Logarithmus als Umkehrung ═════════════
function expSceneLog(S, W, H, C) {
  const F = Expo.mk(1, C.F.b, 0, C.F.e), fs = C.fs, f = Expo.fOf(F), b = F.b, xp = C.xp, yp = f(xp);
  const wide = W >= 820;
  const R = linLayout(W, H, [{ w: 0.5, rows: [2.3] }, { w: 0.5, rows: wide ? [1.9, 1.1] : [1.6] }]);
  if (R[0].w > R[0].h * 1.45) { const nw = R[0].h * 1.45; R[0].x += (R[0].w - nw) / 2; R[0].w = nw; }
  const yc = Math.min(yp, 12);
  const need = [[0, 1], [1, 0], [xp, yc], [yc, xp], [b, 1], [1, b]];
  const win = expWindow(C, R[0], need, { x: [-2.5, 4.5], y: [-2.5, 4.5], eq: true, key: 'log' + (F.e ? 'e' : '') });
  const lg = Expo.logTex(F, 'x');
  const m = difFrame(S, R[0], win, C, { title: '\\col{b}{f(x)=' + Expo.bTexP(F) + '^x}\\quad\\col{g}{g(x)=' + lg + '}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (C.show.diag) difLine(S, m, 0, 0, 1, { hl: 'diag', col: 'M', lw: 1.2, dash: true, a: 0.7 });
  if (C.show.asym) { difSeg(S, m, win.x0 - 1, 0, win.x1 + 1, 0, { col: XP_A, lw: 1.2, dash: true, a: 0.5 }); difSeg(S, m, 0, win.y0 - 1, 0, win.y1 + 1, { col: XP_A, lw: 1.2, dash: true, a: 0.5 }); }
  expCurve(S, m, F, { exp: C.exp });
  difCurve(S, m, difRaw(x => (x > 0 ? Math.log(x) / Math.log(b) : NaN), 'log(x)/log(' + difRN(b) + ')'), { hl: 'lg', col: XP_G, lw: 2.8, exp: C.exp });
  difSeg(S, m, xp, yp, yp, xp, { col: XP_M, lw: 1.3, dash: true, a: 0.8 });
  linPt(S, m, null, 0, 1, C, { fill: XP_F, r: 3.8 }); linPt(S, m, null, 1, 0, C, { fill: XP_G, r: 3.8 });
  linPt(S, m, 'P', xp, yp, C, { fill: XP_F, r: 5.6, lab: '\\col{b}{' + expCoord('P', xp, yp) + '}', lines: [expDir(F, xp), [1, 1]], w: fs * 8 });
  linPt(S, m, 'Q', yp, xp, C, { fill: XP_G, r: 5.6, lab: '\\col{g}{' + expCoord("P'", yp, xp) + '}', lines: [[1, yp > 0 ? 1 / (yp * Math.log(b)) : 1], [1, 1]], w: fs * 8 });
  difLines(S, R[1], Expo.sceneLines(Expo.st.log(F, xp)), C, { max: fs * 1.12 });
  if (!wide) return;
  const ks = [-2, -1, 0, 1, 2, 3];
  const rows = ks.map(k => { const y = Expo.evalExact(F, k); const yT = y.exact ? expQ(y.yq) : linFmt(y.y); return [String(k).replace('-', '−'), '\\col{b}{' + yT + '}', '\\col{g}{' + yT + '}', String(k).replace('-', '−')]; });
  linTab(S, R[2], [{ h: 'x', w: 3 }, { h: Expo.bTexP(F) + '^x', w: 4 }, { h: 'x', w: 4 }, { h: lg, w: 4 }], rows, ks.indexOf(xp), C);
}

// ═════════════ Gleichung und Anwendungen ═════════════
function expSceneEq(S, W, H, C) {
  const F = C.F, fs = C.fs, c = C.c, f = Expo.fOf(F), app = C.app || null, Rs = Expo.solve(F, c);
  const R = linLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: [2.2, 0.8] }]);
  const lim = 40 * Math.max(1, Math.abs(F.a) + Math.abs(F.d) + Math.abs(c));
  const need = [[0, F.a + F.d], [0, c], [0, F.d]];
  if (Rs.kind === 'one' && isFinite(Rs.x)) need.push([Rs.x, c], [Rs.x, F.d]);
  // Ausschnitt um die Lösung: der Graph bis kurz hinter die Schnittstelle, nicht bis x = ±2 (dort kann er schon riesig sein)
  const xs = Rs.kind === 'one' && isFinite(Rs.x) ? Rs.x : 0, xl = Math.min(-0.5, xs - 1), xr = Math.max(0.5, xs + 1);
  if (app) need.push([app.xmax, expClampY(f(app.xmax), lim)]); else need.push([xl, expClampY(f(xl), Math.abs(c) * 3 + 2)], [xr, expClampY(f(xr), Math.abs(c) * 3 + 2)]);
  const o = app ? { x: [0, app.xmax], y: [0, app.ymax], pos: true, key: 'eq' + app.id } : { x: [Math.min(-1, xl), Math.max(1, xr)], y: [Math.min(-1, c - 1), Math.max(1, c + 1)], key: 'eq|' + F.a + ',' + F.b + ',' + F.d + ',' + c };
  const win = expWindow(C, R[0], need, o);
  const xv = app ? app.xv : 'x';
  const m = difFrame(S, R[0], win, C, { title: '\\col{b}{' + Expo.fTex(F, app ? app.fn + '(' + xv + ')' : 'f(x)', xv) + '}\\quad\\col{o}{y=' + linFmt(c) + '}', xlab: app ? app.xlab : 'x', ylab: app ? app.ylab : 'y' });
  S.maps.main = m;
  if (F.deg) { expCurve(S, m, F); return; }
  if (C.show.asym) expAsym(S, m, F, win, C);
  expCurve(S, m, F, { exp: C.exp });
  difLine(S, m, 0, c, 0, { hl: 'yl', col: XP_Y, lw: 2.2 });
  linPt(S, m, 'Y', win.x0 + (win.x1 - win.x0) * 0.08, c, C, { fill: XP_Y, r: 5.2, lab: '\\col{o}{y=' + linFmt(c) + '}', dy: -fs * 1.4, dx: fs * 1.5, w: fs * 5 });
  if (Rs.kind === 'one' && isFinite(Rs.x)) {
    difSeg(S, m, Rs.x, F.d < c ? Math.min(F.d, 0) : 0, Rs.x, c, { col: XP_G, lw: 1.3, dash: true, a: 0.8 });
    linPt(S, m, null, Rs.x, c, C, { fill: XP_G, r: 5.8, lab: '\\col{g}{' + xv + (Rs.exact ? '=' + expQ(Rs.kq) : '\\approx' + linFmtS(Rs.x)) + '}', lines: [[1, 0], expDir(F, Rs.x)], w: fs * 6 });
    linPt(S, m, null, Rs.x, 0, C, { fill: XP_G, r: 3.6 });
  }
  difLines(S, R[1], Expo.sceneLines(Expo.st.eq(F, c, app)), C, { max: fs * 1.12 });
  const info = [];
  if (app) { info.push({ s: '\\text{' + app.name + '}', bold: true }); S.text(R[2].x, R[2].y + fs * 2.6, app.desc, { size: fs * 0.9, col: 'M', al: 'l', bs: 'm' }); }
  else info.push({ s: '\\col{' + (Rs.kind === 'none' ? 'r' : 'g') + '}{' + Expo.bTexP(F) + '^x=' + expQ(Rs.rq) + '\\ \\Rightarrow\\ ' + (Rs.kind === 'none' ? '\\text{keine Lösung}' : '\\text{eine Lösung}') + '}', bold: true }, { s: 'D=\\mathbb{R},\\quad W=' + (F.a > 0 ? ']' + expQ(F.dq) + ';\\,\\infty[' : ']-\\infty;\\,' + expQ(F.dq) + '['), size: 0.92, col: 'M' });
  difLines(S, R[2], info, C, { max: fs * 1.08 });
}

// ═════════════ Prozentrechnung: Säulen für Grundwert und jeden Schritt ═════════════
function expScenePct(S, W, H, C) {
  const fs = C.fs, bw = C.pm === 'bw', r = Expo.pctVals(C.pG, C.pE, C.pc, bw), k = r.v.length;
  const R = stLayout(W, H, [{ w: 0.64, rows: [1] }, { w: 0.36, rows: [1] }]);
  const top = Math.max(...r.v) * 1.22 || 1, win = { x0: 0.35, x1: k + 0.65, y0: -top * 0.04, y1: top };
  const labs = ['\\text{Start}'].concat(C.pc.map((p, i) => (i + 1) + '.'));
  const m = difFrame(S, R[0], win, C, { title: bw ? '\\text{Rückwärts: vom Endwert zum Grundwert}' : '\\text{Vorwärts: vom Grundwert zum neuen Wert}', xlab: '\\ ', ylab: '\\text{Wert}', xstep: 1, xfmt: v => (v >= 1 && v <= k && Math.abs(v - Math.round(v)) < 1e-9 ? labs[Math.round(v) - 1] : '') });
  S.maps.main = m;
  const n = v => linFmt(Math.round(v * 100) / 100), bwid = 0.56;
  r.v.forEach((v, i) => {
    const col = i === 0 ? ST_B : C.pc[i - 1] >= 0 ? ST_G : ST_O, x0 = m.X(i + 1 - bwid / 2), x1 = m.X(i + 1 + bwid / 2), y0 = m.Y(0), y1 = m.Y(v);
    const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    S.poly(shlP(S, 'bars', pts), { fill: col, col, a: i === 0 && bw ? 0.15 : 0.45, close: true, lw: 1.2 });
    const unknown = bw && i === 0, last = i === k - 1;
    difLabel(S, m, (x0 + x1) / 2, y1 - fs * 0.9, (unknown ? '\\col{b}{G=' + n(v) + '}' : last ? '\\col{v}{' + n(v) + '}' : n(v)), C, { size: 0.9, hl: unknown ? 'tot' : undefined });
    if (!(bw && i === 0)) { const P = [(x0 + x1) / 2, y1]; S.circ(P[0], P[1], 5.2, { fill: col, stroke: 'T', lw: 1.2 }); S.pts.push({ id: 'b' + i, x: P[0], y: P[1], r: 11 }); }
    if (i > 0) {
      const ym = Math.min(m.Y(r.v[i - 1]), y1) - fs * 2.2, xm = m.X(i + 0.5);
      S.line(m.X(i + bwid / 2) + 2, ym + fs * 0.9, m.X(i + 1 - bwid / 2) - 2, ym + fs * 0.9, { col, lw: 1.4 });
      difLabel(S, m, xm, ym, '\\col{' + (C.pc[i - 1] >= 0 ? 'g' : 'o') + '}{\\cdot ' + linFmt(Math.round(r.q[i - 1] * 1e4) / 1e4) + '}', C, { size: 0.85, hl: 'fac' });
    }
  });
  const pp = p => (p >= 0 ? '+' : '−') + linFmt(Math.round(Math.abs(p) * 100) / 100) + '\\,\\%';
  const L = C.pc.map((p, i) => ({ s: pp(p) + '\\ \\Rightarrow\\ \\cdot ' + linFmt(Math.round(r.q[i] * 1e4) / 1e4), hl: 'fac', size: 0.95 }));
  L.push(null);
  L.push({ s: '\\text{Gesamtfaktor } q=' + linFmt(Math.round(r.Q * 1e4) / 1e4), bold: true, hl: 'tot' });
  L.push({ s: '\\text{Gesamt: }' + pp((r.Q - 1) * 100), hl: 'tot' });
  L.push(bw ? { s: '\\col{b}{G=' + n(C.pE) + ':' + linFmt(Math.round(r.Q * 1e4) / 1e4) + '=' + n(r.v[0]) + '}' } : { s: n(C.pG) + '\\cdot ' + linFmt(Math.round(r.Q * 1e4) / 1e4) + '=' + n(r.v[k - 1]) });
  difLines(S, R[1], L, C, { max: fs * 1.15 });
}

const EXP_SCENES = { grow: expSceneGrow, e: expSceneE, log: expSceneLog, eq: expSceneEq, pct: expScenePct };
function expBuildScene(W, H, C) {
  const S = linScene(), fn = EXP_SCENES[C.view];
  if (fn) fn(S, W, H, C);
  return S;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { expBuildScene, EXP_SCENES, expWindow };
