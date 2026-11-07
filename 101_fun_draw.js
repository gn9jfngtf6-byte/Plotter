// ═══════════════════════════════════════════════════════════════════
// 101_fun_draw.js — Funktionen: Einführung: Bilder (Szenen)
//
// Gleiche Bauweise wie 94_exp_draw.js. Die Achsen haben unabhängigen Massstab.
//
// Ansichten:  map   Zuordnung und Wertetabelle: Punkte (x | f(x)) im Abstand step ab x0, Tabelle, Einsetzen
//             bars  Balken über den Stellen x = k·h (Abstand h, Schieber/Animation), h → 0 ergibt den Graphen
//             def   Funktionsbegriff: Monotonie farbig, Nullstellen, y-Achsenabschnitt, Hoch-/Tiefpunkte, senkrechte Gerade x = t,
//                   auf Wunsch ein Kreis als Gegenbeispiel (keine Funktion)
//             app   Anwendungen mit Grössen und Einheiten, ziehbare Markierung, Ablesen, Tabelle
// Kontext C: {view, Fx, x0, step, n, h, t, app, xm, win, fs, exp, smooth, show}
// Farben: Funktion blau, Tabellenpunkte blau, Balken grün, Nullstellen grün, y-Achsenabschnitt orange, Extrema violett, Gegenbeispiel rot.
// ═══════════════════════════════════════════════════════════════════
const FN_F = ST_B, FN_B = ST_G, FN_Z = ST_G, FN_Y = ST_O, FN_E = ST_V, FN_R = ST_R;

function funWindow(C, r, need, o) {
  o = o || {};
  const w = C.win || {};
  if (isFinite(w.x0) && isFinite(w.x1) && isFinite(w.y0) && isFinite(w.y1) && w.x1 > w.x0 && w.y1 > w.y0) { const E = { x0: w.x0, x1: w.x1, y0: w.y0, y1: w.y1 }; return autoWin('fun', '', E, need, C, E); }
  let x0 = o.x ? o.x[0] : -4, x1 = o.x ? o.x[1] : 4, y0 = o.y ? o.y[0] : -3, y1 = o.y ? o.y[1] : 5;
  (need || []).forEach(p => { if (isFinite(p[0]) && isFinite(p[1]) && Math.abs(p[0]) < 1e5 && Math.abs(p[1]) < 1e5) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } });
  const px = Math.max(0.5, (x1 - x0) * 0.08), py = Math.max(0.5, (y1 - y0) * 0.1);
  if (!o.pos) { x0 -= px; x1 += px; } else { x1 += px; }
  y0 -= py; y1 += py;
  const hx = powNiceUp((x1 - x0) / 2), hy = powNiceUp((y1 - y0) / 2), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let T = { x0: cx - hx, x1: cx + hx, y0: cy - hy, y1: cy + hy };
  if (o.pos) T = { x0: Math.max(T.x0, -px), x1: T.x1, y0: Math.max(T.y0, -py), y1: T.y1 };
  return autoWin('fun', C.view + '|' + (o.key || '') + '|' + r.w + 'x' + r.h, T, need, C);
}
const funClamp = (y, lim) => (isFinite(y) ? Math.max(-lim, Math.min(lim, y)) : 0);
const funCoord = (x, y) => '(' + linFmtS(x) + '\\,|\\,' + linFmtS(y) + ')';
function funDir(f, x) { const h = 1e-3, d = (f(x + h) - f(x - h)) / (2 * h); return isFinite(d) ? [1, d] : [0, 1]; }
const funCurve = (S, m, f, o) => difCurve(S, m, f, Object.assign({ col: FN_F, lw: 2.6 }, o || {}));

// ═════════════ Zuordnung und Wertetabelle ═════════════
function funSceneMap(S, W, H, C) {
  const Fx = C.Fx, f = Fx.f, fs = C.fs, rows = Fun.table(Fx, C.x0, C.step, C.n), wide = W >= 820;
  // breit: Tabelle senkrecht rechts unten; schmal: Tabelle waagrecht (Zeile x, Zeile f(x)) unter dem Rechenweg
  const R = linLayout(W, H, [{ w: 0.56, rows: [2.3] }, { w: 0.44, rows: wide ? [1.45, 1.55] : [1.05, 0.75] }], 2.4);
  const need = [[0, 0]].concat(rows.filter(r => r.ok && Math.abs(r.y) < 1e4).map(r => [r.x, r.y]));
  const win = funWindow(C, R[0], need, { x: [-4, 4], y: [-3, 5], key: 'map' + Fx.raw });
  const m = difFrame(S, R[0], win, C, { title: '\\col{b}{f(x)=' + Fx.tex + '}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (C.show.curve) funCurve(S, m, f, { lw: 1.6, a: 0.45, exp: C.exp });
  // Beschriftung nur, wenn die Punkte im Bild weit genug auseinander liegen (sonst überdecken sich die Zahlen)
  const labW = C.show.coords ? fs * 6.5 : fs * 3.4, gapPx = Math.abs(m.X(C.step) - m.X(0)), every = gapPx >= labW ? 1 : gapPx * 2 >= labW ? 2 : 0;
  rows.forEach((r, i) => {
    if (!r.ok) return;
    difSeg(S, m, r.x, 0, r.x, r.y, { col: FN_F, lw: 1, dash: true, a: 0.5 });
    if (C.show.coords) difSeg(S, m, 0, r.y, r.x, r.y, { col: FN_F, lw: 1, dash: true, a: 0.35 });
    const lab = every && i % every === 0 ? { lab: '\\col{b}{' + (C.show.coords ? funCoord(r.x, r.y) : linFmtS(r.y)) + '}', lines: [funDir(f, r.x), [0, 1]], w: labW } : {};
    linPt(S, m, i === 0 ? 'P' : null, r.x, r.y, C, Object.assign({ fill: FN_F, r: i === 0 ? 5.8 : 4.6 }, lab));
  });
  difLines(S, R[1], Fun.sceneLines(Fun.st.map(Fx, C.x0, C.step, C.n)), C, { max: fs * 1.12 });
  const xT = r => r.xT.replace(/^-/, '−'), yT = r => (r.ok ? r.yT.replace(/^-/, '−') : '–');
  if (wide) {
    // senkrecht oder waagrecht – je nachdem, was die grössere Schrift erlaubt
    const colsV = [{ h: 'x', w: 3.6 }, { h: 'f(x)', w: 6 }], rowsV = rows.map(r => [xT(r), yT(r)]);
    const fV = Math.min(fs, (R[2].w - 6) / 10.2, (R[2].h - fs * 0.8) / (difTableH(colsV, rowsV, 10) / 10));
    if (fV >= fs * 0.8 || funTabHfs(R[2], rows.map(xT), rows.map(yT), C) <= fV) { linTab(S, R[2], colsV, rowsV, 0, C); return; }
  }
  funTabH(S, R[2], rows.map(xT), rows.map(yT), C);
}
// Waagrechte Wertetabelle: erste Zeile x, zweite Zeile f(x); Spaltenbreite nach dem breitesten Eintrag, als Ganzes eingepasst
function funTabHfs(r, xs, ys, C) { return funTabH(null, r, xs, ys, C); }
function funTabH(S, r, xs, ys, C) {
  const fs = C.fs, colW = xs.map((x, i) => Math.max(2.4, (Math.max(difCellBox(x, 10).w, difCellBox(ys[i], 10).w) / 10) + 0.9));
  const cols = [{ h: 'x', w: 3.2 }].concat(xs.map((x, i) => ({ h: x, w: colW[i] })));
  const row = ['f(x)'].concat(ys), wU = cols.reduce((a, c) => a + c.w, 0), hU = difTableH(cols, [row], 10) / 10;
  const tfs = Math.max(6.5, Math.min(fs, (r.w - 6) / wU, (r.h - fs * 0.3) / hU));
  if (!S) return tfs;
  difTable(S, r.x + Math.max(0, (r.w - wU * tfs) / 2), r.y + fs * 0.15, cols, [row], tfs, -1);
}

// ═════════════ Balken über den Stellen ═════════════
function funSceneBars(S, W, H, C) {
  const Fx = C.Fx, f = Fx.f, fs = C.fs, h = C.h;
  const R = linLayout(W, H, [{ w: 0.6, rows: [2.3] }, { w: 0.4, rows: [2.2, 0.8] }]);
  const pre = Fun.bars(Fx, h > 0 ? h : 1, -4, 4).map(b => [b.x, funClamp(b.y, 10)]);
  const win = funWindow(C, R[0], [[0, 0]].concat(pre), { x: [-4, 4], y: [-3, 5], key: 'bars' + Fx.raw });
  const bs = h > 0 ? Fun.bars(Fx, h, win.x0, win.x1) : [];
  const m = difFrame(S, R[0], win, C, { title: '\\col{b}{f(x)=' + Fx.tex + '}' + (h > 0 ? '\\quad\\col{g}{\\text{Abstand } h=' + linFmtS(h) + '}' : '\\quad\\col{g}{h\\to0}'), xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (h <= 0 || C.show.curve) funCurve(S, m, f, h > 0 ? { lw: 1.4, dash: true, a: 0.5, col: 'M', exp: C.exp } : { exp: C.exp });
  const many = bs.length > 60, few = bs.length <= 14;
  const bw = Math.max(1.2, Math.min(8, (m.X(h) - m.X(0)) * 0.35));
  bs.forEach(b => {
    if (!b.ok) return;
    if (!C.show.dots) difSeg(S, m, b.x, 0, b.x, b.y, { col: FN_B, lw: bw, a: 0.6 });
    if (!many || C.show.dots) linPt(S, m, null, b.x, b.y, C, { fill: FN_B, r: many ? 2 : 3.6 });
    if (few && (C.show.vals || C.show.coords)) difLabel(S, m, m.X(b.x), m.Y(b.y), '\\col{g}{' + (C.show.coords ? funCoord(b.x, b.y) : linFmtS(b.y)) + '}', C, { dy: b.y >= 0 ? -fs * 1.1 : fs * 1.1, w: fs * 5, size: 0.85 });
  });
  difLines(S, R[1], Fun.sceneLines(Fun.st.bars(Fx, h, bs)), C, { max: fs * 1.12 });
  const info = [{ s: h > 0 ? '\\col{g}{' + bs.filter(b => b.ok).length + '\\text{ Balken im Abstand } ' + linFmtS(h) + '}' : '\\col{b}{\\text{Abstand 0: die ganze Kurve}}', bold: true }, { s: '\\text{Verkleinere den Abstand: Die Balkenenden werden zur Kurve.}', size: 0.9, col: 'M' }];
  difLines(S, R[2], info, C, { max: fs * 1.08 });
}

// ═════════════ Funktionsbegriff ═════════════
function funSceneDef(S, W, H, C) {
  const Fx = C.Fx, f = Fx.f, fs = C.fs, t = C.t;
  const R = linLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: [2.2, 0.8] }]);
  const P0 = Fun.props(Fx, -3.5, 3.5), lim = 8;
  const base = [[0, funClamp(f(0), lim)], [t, funClamp(f(t), lim)]].concat(P0.zeros.map(z => [z, 0])).concat(P0.ext.map(e => [e.x, funClamp(e.y, lim)]));
  const win = funWindow(C, R[0], base, { x: [-4, 4], y: [-3, 4], key: 'def' + Fx.raw });
  const P = Fun.props(Fx, win.x0, win.x1);
  const m = difFrame(S, R[0], win, C, { title: '\\col{b}{f(x)=' + Fx.tex + '}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  // Monotonie: steigend blau, fallend rot
  const colAt = x => { const seg = P.mono.find(s => x >= s.a && x <= s.b); return seg ? (seg.up ? FN_F : FN_R) : FN_F; };
  difCurve(S, m, f, { colorAt: C.show.mono ? colAt : undefined, col: FN_F, lw: 2.6, exp: C.exp });
  if (C.show.rel) {
    // Gegenbeispiel: Kreis x² + y² = r² (keine Funktion)
    const rr = Math.min(win.x1 - win.x0, win.y1 - win.y0) * 0.16, cx = win.x1 - (win.x1 - win.x0) * 0.2, cy = win.y1 - (win.y1 - win.y0) * 0.26;
    const pts = []; for (let i = 0; i <= 72; i++) { const a = i / 72 * 2 * Math.PI; pts.push([m.X(cx + rr * Math.cos(a)), m.Y(cy + rr * Math.sin(a))]); }
    S.poly(pts, { col: FN_R, lw: 1.8, a: 0.8, dash: true });
    S.rich(m.X(cx), m.Y(cy + rr) - fs * 1.1, '\\col{r}{\\text{kein Funktionsgraph}}', { size: fs * 0.85, col: 'T', al: 'c', bs: 'm' });
    if (Math.abs(t - cx) < rr) { const dy = Math.sqrt(rr * rr - (t - cx) * (t - cx)); linPt(S, m, null, t, cy + dy, C, { fill: FN_R, r: 4.6 }); linPt(S, m, null, t, cy - dy, C, { fill: FN_R, r: 4.6 }); S.rich(m.X(t) + fs * 0.6, m.Y(cy), '\\col{r}{\\text{2 Punkte!}}', { size: fs * 0.85, col: 'T', al: 'l', bs: 'm' }); }
  }
  // senkrechte Gerade x = t
  difSeg(S, m, t, win.y0, t, win.y1, { col: FN_E, lw: 1.3, dash: true, a: 0.9 });
  const ft = f(t);
  if (isFinite(ft)) linPt(S, m, null, t, ft, C, { fill: FN_E, r: 5.2, lab: '\\col{v}{' + funCoord(t, ft) + '}', lines: [funDir(f, t), [0, 1]], w: fs * 6 });
  linPt(S, m, 'T', t, 0, C, { fill: FN_E, r: 5.6, lab: '\\col{v}{x=' + linFmtS(t) + '}', dy: fs * 1.4, w: fs * 4 });
  if (C.show.pts) {
    P.zeros.forEach((z, i) => linPt(S, m, null, z, 0, C, { fill: FN_Z, r: 5, lab: '\\col{g}{x_' + (i + 1) + '=' + linFmtS(z) + '}', lines: [funDir(f, z), [1, 0]], w: fs * 5 }));
    if (P.yInt !== null && !P.ext.some(e => Math.abs(e.x) < 1e-3) && !P.zeros.some(z => Math.abs(z) < 1e-6)) linPt(S, m, null, 0, P.yInt, C, { fill: FN_Y, r: 5, lab: '\\col{o}{f(0)=' + linFmtS(P.yInt) + '}', lines: [funDir(f, 0), [0, 1]], w: fs * 5 });
    P.ext.forEach(e => linPt(S, m, null, e.x, e.y, C, { fill: FN_E, r: 5, lab: '\\col{v}{' + (e.kind === 'max' ? 'H' : 'T') + funCoord(e.x, e.y) + '}', lines: [[1, 0]], w: fs * 7 }));
  }
  difLines(S, R[1], Fun.sceneLines(Fun.st.def(Fx, P, win.x0, win.x1, t)), C, { max: fs * 1.12 });
  const info = [{ s: '\\col{b}{\\text{steigend}}\\quad\\col{r}{\\text{fallend}}\\quad\\col{g}{\\text{Nullstellen}}\\quad\\col{o}{\\text{y-Achsenabschnitt}}\\quad\\col{v}{\\text{Hoch-/Tiefpunkte}}', size: 0.88 }, { s: '\\text{Die senkrechte Gerade } x=' + linFmtS(t) + '\\text{ trifft den Graphen ' + (isFinite(ft) ? 'genau einmal' : 'nicht (Lücke)') + '.}', size: 0.9, col: 'M' }];
  difLines(S, R[2], info, C, { max: fs * 1.08 });
}

// ═════════════ Anwendungen ═════════════
function funSceneApp(S, W, H, C) {
  const A = C.app, Fx = C.Fx, f = Fx.f, fs = C.fs, wide = W >= 820;
  const xm = Math.max(A.xmin, Math.min(A.xmax, C.xm)), ym = f(xm);
  const R = linLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: wide ? [1.9, 1.1] : [1.6] }]);
  const win = funWindow(C, R[0], [[A.xmax, A.ymax], [xm, funClamp(ym, A.ymax * 2)]], { x: [A.xmin, A.xmax], y: [A.ymin, A.ymax], pos: true, key: 'app' + A.id });
  const m = difFrame(S, R[0], win, C, { title: '\\col{b}{' + A.fn + '(' + A.xv + ')=' + Fun.subVar(Fx.tex, A.xv) + '}', xlab: A.xlab, ylab: A.ylab });
  S.maps.main = m;
  funCurve(S, m, x => (x >= A.xmin ? f(x) : NaN), { exp: C.exp });
  if (isFinite(ym)) {
    difSeg(S, m, xm, 0, xm, ym, { col: FN_Y, lw: 1.4, dash: true, a: 0.9 });
    difSeg(S, m, 0, ym, xm, ym, { col: FN_Y, lw: 1.4, dash: true, a: 0.9 });
    linPt(S, m, null, xm, 0, C, { fill: FN_Y, r: 4, lab: '\\col{o}{' + A.xv + '=' + linFmtS(xm) + '}', dy: fs * 1.4, w: fs * 5 });
    linPt(S, m, null, 0, ym, C, { fill: FN_Y, r: 4, lab: '\\col{o}{' + linFmtS(ym) + '}', dx: -fs * 2.2, dy: 0, w: fs * 4 });
    linPt(S, m, 'X', xm, ym, C, { fill: FN_F, r: 6, lab: '\\col{b}{' + A.fn + '(' + linFmtS(xm) + ')=' + linFmtS(ym) + '}', lines: [funDir(f, xm), [0, 1], [1, 0]], w: fs * 8 });
  }
  const lines = Fun.sceneLines(Fun.st.app(A, Fx, xm));
  difLines(S, R[1], lines, C, { max: fs * 1.12 });
  if (!wide) return;
  const xs = []; for (let k = 0; k <= 6; k++) { const x = A.xmin + k * A.step; if (x <= A.xmax + 1e-9) xs.push(x); }
  const rows = xs.map(x => [linFmtS(x), isFinite(f(x)) ? linFmtS(f(x)) : '–']);
  linTab(S, R[2], [{ h: A.xlab, w: 5 }, { h: A.ylab, w: 5 }], rows, -1, C);
}

const FUN_SCENES = { map: funSceneMap, bars: funSceneBars, def: funSceneDef, app: funSceneApp };
function funBuildScene(W, H, C) {
  const S = linScene(), fn = FUN_SCENES[C.view];
  if (fn) fn(S, W, H, C);
  return S;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { funBuildScene, FUN_SCENES, funWindow };
