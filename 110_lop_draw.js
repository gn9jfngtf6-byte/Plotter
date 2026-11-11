// ═══════════════════════════════════════════════════════════════════
// 110_lop_draw.js — Lineare Optimierung: Bilder (Szenen)
//
// Bauweise wie 99c_inv_draw.js. Die Achsen dürfen verschiedene Massstäbe haben (Anwendungen: x bis 800, y bis 300 …).
// Ansichten:  ung1   Ungleichung mit einer Variablen: beide Seiten als Geraden, Lösungsintervall auf der Zahlengeraden
//             half   Halbebene: Grenzgerade (durchgezogen/gestrichelt), Achsenschnittpunkte, Testpunkt T (ziehbar)
//             poly   Planungspolygon: Grenzgeraden (I), (II) …, Eckpunkte, ganzzahlige Punkte, Testpunkt P (ziehbar)
//             opt    Zielfunktion: Niveaulinie (ziehbar), Optimum, Tabelle der Eckpunkte mit Z
// Kontext C: {view, I1, Ih, T, L, nn, int, O, mode, z, P, win, fs, exp, smooth, show, ctx}
// ═══════════════════════════════════════════════════════════════════
const LP_COL = [ST_B, ST_R, ST_G, ST_V, ST_T, '#a0702a', '#d04fb0', '#5a6acf'], LP_CL = ['b', 'r', 'g', 'v', '', '', '', ''];
const LP_F = ST_G, LP_Z = ST_O;

function lpNice(v) { if (v <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(v))), f = v / e; return ([1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(c => c >= f - 1e-9) || 10) * e; }
function lpWindow(C, r, pts, key, o) {
  o = o || {};
  const w = C.win || {};
  const need = pts.filter(p => isFinite(p[0]) && isFinite(p[1]) && Math.abs(p[0]) < 1e6 && Math.abs(p[1]) < 1e6);
  if (isFinite(w.x0) && isFinite(w.x1) && isFinite(w.y0) && isFinite(w.y1) && w.x1 > w.x0 && w.y1 > w.y0) { const E = { x0: w.x0, x1: w.x1, y0: w.y0, y1: w.y1 }; return autoWin('lp', '', E, need, C, E); }
  let x0 = Math.min(0, ...need.map(p => p[0])), x1 = Math.max(1, ...need.map(p => p[0])), y0 = Math.min(0, ...need.map(p => p[1])), y1 = Math.max(1, ...need.map(p => p[1]));
  const sx = lpNice((x1 - x0) * 1.18), sy = lpNice((y1 - y0) * 1.18);
  const T = { x0: x0 < 0 ? x1 - sx : -sx * 0.06, x1: x0 < 0 ? x1 + sx * 0.06 : sx * 0.94, y0: y0 < 0 ? y1 - sy : -sy * 0.06, y1: y0 < 0 ? y1 + sy * 0.06 : sy * 0.94 };
  if (x0 < 0) { T.x0 = x0 - (sx - (x1 - x0)) / 2; T.x1 = T.x0 + sx; }
  if (y0 < 0) { T.y0 = y0 - (sy - (y1 - y0)) / 2; T.y1 = T.y0 + sy; }
  return autoWin('lp', C.view + '|' + key, T, need, C);
}
// Polygon auf das Fenster zuschneiden
function lpClipWin(poly, win) {
  let p = poly; p = Lp.clip(p, 1, 0, win.x1); p = Lp.clip(p, -1, 0, -win.x0); p = Lp.clip(p, 0, 1, win.y1); p = Lp.clip(p, 0, -1, -win.y0);
  return p;
}
const lpPt = (x, y) => '(' + Lp.q(x) + '\\,|\\,' + Lp.q(y) + ')';
// Grenzgerade a·x + b·y = c im Fenster; Beschriftung am Rand
function lpLine(S, m, I, col, o, C) {
  o = o || {}; const w = m.win, strict = I.rel === '<' || I.rel === '>';
  let P, Q;
  if (Math.abs(I.b) < 1e-12) { const x = I.c / I.a; P = [x, w.y0 - 1]; Q = [x, w.y1 + 1]; }
  else { const f = x => (I.c - I.a * x) / I.b, d = (w.x1 - w.x0); P = [w.x0 - d, f(w.x0 - d)]; Q = [w.x1 + d, f(w.x1 + d)]; }
  difSeg(S, m, P[0], P[1], Q[0], Q[1], { col, lw: o.lw || 2.2, dash: strict });
  if (o.lab) {
    // Beschriftung: Schnittpunkt mit dem Fensterrand, etwas nach innen
    const c = difClip(m.X(P[0]), m.Y(P[1]), m.X(Q[0]), m.Y(Q[1]), m.L, m.T, m.R, m.B);
    if (c && C) { const t = o.t === undefined ? 0.82 : o.t, X = c[0] + (c[2] - c[0]) * t, Y = c[1] + (c[3] - c[1]) * t; difLabel(S, m, X + C.fs * 1.1, Y - C.fs * 0.8, o.lab, C, { size: 0.95 }); }
  }
}

// ═════════════ eine Variable ═════════════
function lpSceneUng1(S, W, H, C) {
  const fs = C.fs, I = C.I1, R = Lp.solve1(I);
  const Rl = linLayout(W, H, [{ w: 0.62, rows: [1.7, 0.6] }, { w: 0.38, rows: [1] }]);
  const b = R ? R.bound : 0;
  const lf = x => I.l.x * x + I.l.c, rf = x => I.r.x * x + I.r.c;
  const xs = [b - 3, b + 3, 0], pts = xs.map(x => [x, lf(x)]).concat(xs.map(x => [x, rf(x)]));
  const win = lpWindow(C, Rl[0], pts, 'ung1|' + (I.raw || JSON.stringify([I.l, I.r])));
  const m = difFrame(S, Rl[0], win, C, { title: '\\col{b}{y=' + Lp.sideTex(I.l) + '}\\quad\\col{o}{y=' + Lp.sideTex(I.r) + '}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (R && R.rel !== '=') {
    const lo = R.rel === '<=' || R.rel === '<' ? win.x0 : b, hi = R.rel === '<=' || R.rel === '<' ? b : win.x1;
    S.rect(m.X(Math.max(lo, win.x0)), m.T, m.X(Math.min(hi, win.x1)) - m.X(Math.max(lo, win.x0)), m.B - m.T, { fill: LP_F, a: 0.1 });
  }
  difCurve(S, m, lf, { hl: 'ls', col: ST_B, lw: 2.4, exp: C.exp }); difCurve(S, m, rf, { hl: 'rs', col: LP_Z, lw: 2.4, exp: C.exp });
  if (R) { difSeg(S, m, b, win.y0, b, win.y1, { col: LP_F, lw: 1.2, dash: true }); linPt(S, m, null, b, lf(b), C, { fill: LP_F, r: 5.5, lab: '\\col{g}{x=' + Lp.q(b) + '}', w: fs * 5, lines: [[1, I.l.x], [1, I.r.x], [0, 1]] }); }
  // Zahlengerade (gleiche x-Achse wie oben)
  const r2 = Rl[1]; if (typeof stKeep === 'function') stKeep(r2);
  const yA = r2.y + r2.h * 0.5;
  S.line(m.L, yA, m.R, yA, { col: 'L', lw: 1.6 });
  const st = Stat.niceStep(win.x1 - win.x0, Math.max(3, Math.min(12, (m.R - m.L) / (fs * 4.5))));
  for (let k = Math.ceil(win.x0 / st); k * st <= win.x1 + 1e-9; k++) { const x = m.X(k * st); S.line(x, yA - 4, x, yA + 4, { col: 'L', lw: 1 }); S.text(x, yA + fs * 1.1, stTickLabel(k * st, st).replace('-', '−'), { size: fs * 0.8, col: 'M', al: 'c', bs: 'm' }); }
  if (R) {
    const X = m.X(b), left = R.rel === '<=' || R.rel === '<';
    if (R.rel !== '=') S.line(left ? m.L : X, yA, left ? X : m.R, yA, { col: LP_F, lw: 6, a: 0.85 });
    const open = R.rel === '<' || R.rel === '>';
    if (X >= m.L - 1 && X <= m.R + 1) S.circ(X, yA, 6.5, { fill: open ? '#ffffff' : LP_F, stroke: LP_F, lw: 2.2 });
    S.rich(m.L, r2.y + fs * 0.6, '\\col{g}{\\mathbb{L}=' + R.iv + '}', { size: fs * 1.05, col: 'T', al: 'l', bs: 'm' });
  }
  const Ls = [{ s: Lp.texRaw(I), bold: true }];
  if (R) { Ls.push({ s: (R.flip ? '\\col{r}{\\text{Zeichen kehrt (Division durch } ' + Lp.q(I.a) + ')}' : '\\text{Zeichen bleibt}'), size: 0.9 }); Ls.push({ s: '\\col{g}{x' + R.relTex + Lp.q(b) + '}' }); Ls.push({ s: '\\col{g}{\\mathbb{L}=' + R.iv + '}', bold: true }); }
  difLines(S, Rl[2], Ls, C, { max: fs * 1.15 });
}

// ═════════════ Halbebene ═════════════
function lpSceneHalf(S, W, H, C) {
  const fs = C.fs, I = C.Ih, T = C.T, J = Lp.intForm(I);
  const Rl = linLayout(W, H, [{ w: 0.66, rows: [2.3] }, { w: 0.34, rows: [1] }]);
  const pts = [[0, 0], T];
  if (Math.abs(J.a) > 1e-12) pts.push([J.c / J.a, 0]); if (Math.abs(J.b) > 1e-12) pts.push([0, J.c / J.b]);
  const win = lpWindow(C, Rl[0], pts, 'half|' + JSON.stringify([J.a, J.b, J.c]));
  const m = difFrame(S, Rl[0], win, C, { title: '\\col{b}{' + Lp.tex(I) + '}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  const reg = lpClipWin(Lp.region([I], false).poly, win);
  if (reg.length > 2) S.poly(shlP(S, 'hp', reg.map(p => [m.X(p[0]), m.Y(p[1])])), { fill: LP_F, a: 0.16, col: LP_F, lw: 0.01, close: true });
  lpLine(S, m, I, ST_B, { lw: 2.6 });
  if (Math.abs(J.a) > 1e-12 && Math.abs(J.c) > 1e-12) linPt(S, m, null, J.c / J.a, 0, C, { fill: ST_B, r: 4.5, lab: '\\col{b}{' + lpPt(J.c / J.a, 0) + '}', w: fs * 5, lines: [[1, 0], [J.b, -J.a]] });
  if (Math.abs(J.b) > 1e-12 && Math.abs(J.c) > 1e-12) linPt(S, m, null, 0, J.c / J.b, C, { fill: ST_B, r: 4.5, lab: '\\col{b}{' + lpPt(0, J.c / J.b) + '}', w: fs * 5, lines: [[0, 1], [J.b, -J.a]] });
  const okT = Lp.ok(I, T[0], T[1]);
  linPt(S, m, 'T', T[0], T[1], C, { fill: okT ? LP_F : ST_R, r: 6.5, lab: '\\col{' + (okT ? 'g' : 'r') + '}{T' + lpPt(T[0], T[1]) + '\\ \\text{' + (okT ? 'erfüllt' : 'nicht erfüllt') + '}}', w: fs * 10, lines: [[J.b, -J.a]] });
  const v = J.a * T[0] + J.b * T[1];
  const Ls = [{ s: Lp.tex(I), bold: true }, { s: '\\text{Grenzgerade: }' + Lp.linTex(J.a, J.b) + '=' + Lp.big(J.c), size: 0.95 }, { s: '\\text{' + (I.rel === '<' || I.rel === '>' ? 'gestrichelt (gehört nicht dazu)' : 'durchgezogen (gehört dazu)') + '}', size: 0.9, col: 'M' },
    { s: '\\col{' + (okT ? 'g' : 'r') + '}{T' + lpPt(T[0], T[1]) + ':\\ ' + Lp.q(v) + Lp.REL[J.rel] + Lp.big(J.c) + '\\ \\text{' + (okT ? 'wahr' : 'falsch') + '}}' }];
  difLines(S, Rl[1], Ls, C, { max: fs * 1.1 });
}

// ═════════════ Planungspolygon (und Optimum) ═════════════
function lpScenePoly(S, W, H, C, withObj) {
  const fs = C.fs, L0 = C.L, nn = C.nn, L = Lp.all(L0, nn), V = Lp.vertices(L0, nn), R = Lp.region(L0, nn);
  const Rl = linLayout(W, H, [{ w: 0.66, rows: [2.3] }, { w: 0.34, rows: withObj ? [1.4, 0.6] : [1] }]);
  const pts = V.map(v => [v.x, v.y]).concat([[0, 0]]);
  // Achsenschnittpunkte der Grenzgeraden nur, wenn sie nicht zu weit vom Polygon weg liegen (sonst wird es klein)
  const mxX = Math.max(1, ...V.map(v => Math.abs(v.x))), mxY = Math.max(1, ...V.map(v => Math.abs(v.y))), lim = R.bounded ? 1.6 : 1e9;
  L0.forEach(I => { if (Math.abs(I.a) > 1e-12 && Math.abs(I.c / I.a) < Math.min(1e6, mxX * lim)) pts.push([I.c / I.a, 0]); if (Math.abs(I.b) > 1e-12 && Math.abs(I.c / I.b) < Math.min(1e6, mxY * lim)) pts.push([0, I.c / I.b]); });
  if (C.P && !withObj) pts.push(C.P);
  const win = lpWindow(C, Rl[0], pts, (withObj ? 'opt' : 'poly') + '|' + L0.map(I => I.raw || [I.a, I.b, I.c].join(',')).join(';'));
  const O = C.O, mode = C.mode, res = withObj && O ? Lp.optimum(L0, nn, O, mode) : null;
  const title = withObj && O ? '\\col{o}{Z=' + Lp.linTex(O.p, O.q) + '\\ \\to\\ \\text{' + (mode === 'min' ? 'min' : 'max') + '}}' : '\\text{Planungspolygon}';
  const m = difFrame(S, Rl[0], win, C, { title, xlab: C.ctx && C.ctx.xl ? C.ctx.xl : 'x', ylab: C.ctx && C.ctx.yl ? C.ctx.yl : 'y' });
  S.maps.main = m;
  if (!R.empty) { const pg = lpClipWin(R.poly, win); if (pg.length > 2) S.poly(shlP(S, 'pg', pg.map(p => [m.X(p[0]), m.Y(p[1])])), { fill: LP_F, a: 0.2, col: LP_F, lw: 0.01, close: true }); }
  L0.forEach((I, i) => lpLine(S, m, I, LP_COL[i % LP_COL.length], { lab: '\\col{' + (LP_CL[i % 8] || 'b') + '}{(' + Lp.roman(i) + ')}', t: 0.7 + 0.08 * (i % 3) }, C));
  // ganzzahlige Punkte
  if (C.int && C.show.intpts) { const IP = Lp.intPoints(L0, nn, 1500); if (IP) IP.forEach(p => { const px = m.X(p[0]), py = m.Y(p[1]); if (px >= m.L && px <= m.R && py >= m.T && py <= m.B) S.circ(px, py, 2.2, { fill: 'T', a: 0.55 }); }); }
  // Niveaulinie
  if (res && !res.empty) {
    const zv = C.z === null || C.z === undefined ? res.value : C.z;
    const Iz = { a: O.p, b: O.q, c: zv - (O.c || 0), rel: '=' };
    if (Math.abs(O.p) + Math.abs(O.q) > 1e-12) {
      if (C.show.level && C.z !== null && C.z !== undefined && Math.abs(C.z - res.value) > 1e-9 && !res.unbounded) lpLine(S, m, { a: O.p, b: O.q, c: res.value - (O.c || 0), rel: '=' }, LP_Z, { lw: 1.2 });
      lpLine(S, m, Iz, LP_Z, { lw: 2.6 });
      // Griff auf der Niveaulinie (in der Fenstermitte)
      const cx = (win.x0 + win.x1) / 2, cy = (win.y0 + win.y1) / 2, nrm = O.p * O.p + O.q * O.q, t = (Iz.c - O.p * cx - O.q * cy) / nrm;
      const hx = cx + O.p * t, hy = cy + O.q * t;
      linPt(S, m, 'N', hx, hy, C, { fill: LP_Z, r: 6, lab: '\\col{o}{Z=' + Lp.big(zv) + '}', w: fs * 6, lines: [[O.q, -O.p]] });
    }
    if (!res.unbounded) res.best.forEach(v => difDot(S, m, v.x, v.y, { fill: LP_Z, stroke: 'T', r: 9, lw: 1.5, a: 0.5 }));
  }
  V.forEach((v, k) => linPt(S, m, null, v.x, v.y, C, { fill: LP_F, r: 5, lab: '\\col{g}{E_{' + (k + 1) + '}' + lpPt(v.x, v.y) + '}', w: fs * 7, lines: v.on.slice(0, 2).map(i => [L[i].b, -L[i].a]) }));
  if (C.int && res && !res.empty && !res.unbounded) { const io = Lp.intOpt(L0, nn, O, mode); const intBest = res.best.every(v => Math.abs(v.x - Math.round(v.x)) < 1e-9 && Math.abs(v.y - Math.round(v.y)) < 1e-9); if (io && !intBest) io.pts.forEach(p => linPt(S, m, null, p[0], p[1], C, { fill: ST_V, r: 6, lab: '\\col{v}{' + lpPt(p[0], p[1]) + '\\ \\text{ganzzahlig}}', w: fs * 8, lines: [[O.q, -O.p]] })); }
  // Testpunkt (nur Planungspolygon)
  if (!withObj && C.P) {
    const bad = L.map((I, i) => (Lp.ok(I, C.P[0], C.P[1]) ? -1 : i)).filter(i => i >= 0), ok = !bad.length;
    linPt(S, m, 'P', C.P[0], C.P[1], C, { fill: ok ? LP_F : ST_R, r: 6.5, lab: '\\col{' + (ok ? 'g' : 'r') + '}{P' + lpPt(C.P[0], C.P[1]) + '\\ \\text{' + (ok ? 'zulässig' : 'verletzt ' + bad.map(i => (L[i].nn ? (L[i].a ? 'x\\ge0' : 'y\\ge0') : '(' + Lp.roman(i) + ')')).join(', ')) + '}}', w: fs * 11, lines: [[1, 0]] });
  }
  // rechts: Bedingungen bzw. Eckpunkt-Tabelle
  if (withObj && res && !res.empty) {
    const rows = res.V.map((v, k) => ['E_{' + (k + 1) + '}', lpPt(v.x, v.y), Lp.big(res.vals[k])]);
    const hl = res.unbounded ? -1 : res.V.indexOf(res.best[0]);
    linTab(S, Rl[1], [{ h: '\\text{Ecke}', w: 3.6 }, { h: '(x\\,|\\,y)', w: 7 }, { h: 'Z', w: 5.4 }], rows, hl, C);
    const Ls = res.unbounded ? [{ s: '\\col{r}{\\text{kein Optimum (Gebiet offen)}}', bold: true }] : [{ s: '\\col{o}{' + (mode === 'min' ? '\\text{Minimum }' : '\\text{Maximum }') + 'Z=' + Lp.big(res.value) + '}', bold: true }, { s: res.edge ? '\\text{auf der ganzen Kante}' : '\\text{bei }' + lpPt(res.best[0].x, res.best[0].y), size: 0.95 }];
    difLines(S, Rl[2], Ls, C, { max: fs * 1.1 });
  } else {
    const Ls = L0.map((I, i) => ({ s: '\\col{' + (LP_CL[i % 8] || 'b') + '}{(' + Lp.roman(i) + ')\\ \\ ' + Lp.tex(I) + '}' }));
    if (nn) Ls.push({ s: 'x\\ge0,\\ y\\ge0', size: 0.95 });
    if (C.int) Ls.push({ s: 'x,\\,y\\in\\mathbb{N}', size: 0.95 });
    Ls.push(null);
    if (R.empty) Ls.push({ s: '\\col{r}{\\text{keine Lösung}}', bold: true }); else V.forEach((v, k) => Ls.push({ s: '\\col{g}{E_{' + (k + 1) + '}' + lpPt(v.x, v.y) + '}', size: 0.95 }));
    difLines(S, Rl[1], Ls, C, { max: fs * 1.1 });
  }
}

const LP_SCENES = { ung1: lpSceneUng1, half: lpSceneHalf, poly: (S, W, H, C) => lpScenePoly(S, W, H, C, false), opt: (S, W, H, C) => lpScenePoly(S, W, H, C, true) };
function lpBuildScene(W, H, C) {
  const S = linScene(), fn = LP_SCENES[C.view];
  if (fn) fn(S, W, H, C);
  return S;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { lpBuildScene, LP_SCENES };
