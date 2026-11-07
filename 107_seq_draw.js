// ═══════════════════════════════════════════════════════════════════
// 107_seq_draw.js — Folgen und Reihen: Bilder (Szenen)
//
// Bauweise wie 99c_inv_draw.js. Glieder als Punkte (n | a_n) über den natürlichen Zahlen.
// Ansichten:  def    Folge explizit/rekursiv: Punkte, Glied a_k (ziehbar), rekursiv Pfeile vom Vorgänger zum Nachfolger
//             ari    arithmetische Folge: Treppe +d, Gerade durch die Punkte, a_1 und a_2 ziehbar, Zielwert t
//             geo    geometrische Folge: Faktor ·q, Kurve durch die Punkte, a_1 und a_2 ziehbar, Zielwert t
//             sum    Reihe: Glieder als Balken (arithmetisch mit Gauss-Trick), Partialsummen s_n darunter, n ziehbar
//             lim    Grenzwert: ε-Streifen um L (ziehbar), ab N alle Glieder im Streifen; unendliche geometrische Reihe
//             ind    vollständige Induktion: Dominosteine und Tabelle linke/rechte Seite
// Kontext C: {view, S, k, N, A, G, kA, kG, tA, tG, sum, lim, ind, win, fs, exp, smooth, show}
// Farben: Glieder blau, hervorgehobenes Glied violett, Differenz d grün, Faktor q orange, Grenzwert/Streifen grün, Ziel rot.
// ═══════════════════════════════════════════════════════════════════
const SQ_P = ST_B, SQ_K = ST_V, SQ_D = ST_G, SQ_Q = ST_O, SQ_T = ST_R;

function seqWindow(C, r, xs, ys, key, o) {
  o = o || {};
  const w = C.win || {};
  const need = xs.map((x, i) => [x, ys[i]]).filter(p => isFinite(p[0]) && isFinite(p[1]) && Math.abs(p[1]) < 1e9);
  if (isFinite(w.x0) && isFinite(w.x1) && isFinite(w.y0) && isFinite(w.y1) && w.x1 > w.x0 && w.y1 > w.y0) { const E = { x0: w.x0, x1: w.x1, y0: w.y0, y1: w.y1 }; return autoWin('seq', '', E, need, C, E); }
  let x1 = Math.max(...need.map(p => p[0]), 3), y0 = Math.min(0, ...need.map(p => p[1])), y1 = Math.max(0, ...need.map(p => p[1]));
  if (o.y) { y0 = Math.min(y0, o.y[0]); y1 = Math.max(y1, o.y[1]); }
  if (y1 - y0 < 1e-9) { y0 -= 1; y1 += 1; }
  const py = (y1 - y0) * 0.12;
  const T = { x0: -0.4, x1: x1 + Math.max(0.8, x1 * 0.05), y0: y0 < 0 ? y0 - py : -py * 0.6, y1: y1 > 0 ? y1 + py : py * 0.6 };
  return autoWin('seq', C.view + '|' + key, T, need, C);
}
function seqFrame(S, r, win, C, title, info, ylab) {
  const xr = win.x1 - win.x0, st = xr <= 14 ? 1 : xr <= 30 ? 2 : xr <= 70 ? 5 : xr <= 140 ? 10 : xr <= 300 ? 20 : 50;
  return difFrame(S, r, win, C, { title, info, xlab: 'n', ylab: ylab || 'a_n', xstep: st });
}
// Glieder als Punkte; hl = hervorgehobenes n
function seqDots(S, m, vals, C, o) {
  o = o || {}; const fs = C.fs, n0 = o.n0 || 1;
  const px = m.X(1) - m.X(0), small = px < fs * 0.9;
  vals.forEach((v, i) => {
    const n = n0 + i; if (!isFinite(v)) return;
    if (o.stem) difSeg(S, m, n, 0, n, v, { col: o.col || SQ_P, lw: 1, a: 0.35 });
    difDot(S, m, n, v, { fill: n === o.hl ? SQ_K : (o.col || SQ_P), stroke: 'T', r: n === o.hl ? 6 : small ? 2.6 : 4.4, lw: 1 });
  });
}
// Werte neben den Punkten (wenn genug Platz); sonst nur die Punkte
function seqVals(S, m, vals, C, skip) {
  const fs = C.fs, px = m.X(1) - m.X(0);
  if (!C.show.vals || px < fs * 1.7) return;
  vals.forEach((v, i) => { const n = i + 1; if (!isFinite(v) || n === skip || i >= 30) return; const p = [m.X(n), m.Y(v)]; if (p[0] < m.L || p[0] > m.R || p[1] < m.T || p[1] > m.B) return; difLabel(S, m, p[0], p[1] - fs * 1.0, Sq.q(v), C, { size: 0.72, col: 'M' }); });
}
// Tabelle n | a_n (senkrecht)
function seqTab(S, r, vals, hl, C, head, n0) {
  const rows = []; n0 = n0 || 1;
  const nn = Math.min(vals.length, 12);
  for (let i = 0; i < nn; i++) rows.push([String(n0 + i), Sq.q(vals[i])]);
  if (vals.length > 12) rows.push(['\\vdots', '\\vdots']);
  linTab(S, r, [{ h: 'n', w: 3 }, { h: head || 'a_n', w: 6 }], rows, hl - n0 < 12 ? hl - n0 : -1, C);
}
const seqLab = (S, m, n, v, s, C, o) => linPt(S, m, (o && o.id) || null, n, v, C, Object.assign({ fill: SQ_K, r: 6, lab: s, w: C.fs * 7, lines: [[1, 0], [0, 1]] }, o || {}));

// ═════════════ Folge: explizit / rekursiv ═════════════
function seqSceneDef(S, W, H, C) {
  const fs = C.fs, Sx = C.S, N = C.N, k = Math.min(C.k, N), v = Sq.terms(Sx, N);
  const R = linLayout(W, H, [{ w: 0.68, rows: [2.3] }, { w: 0.32, rows: [1] }]);
  const ns = v.map((_, i) => i + 1), win = seqWindow(C, R[0], ns, v, 'def' + Sx.kind + N);
  const m = seqFrame(S, R[0], win, C, Sx.kind === 'exp' ? '\\col{b}{a_n=' + Sx.tex + '}' : '\\col{b}{a_1=' + Sq.q(Sx.a1) + ',\\ a_{n+1}=' + Sx.tex + '}');
  S.maps.main = m;
  if (Sx.kind === 'rec' && C.show.steps) for (let i = 0; i + 1 < Math.min(N, 25); i++) {
    if (!isFinite(v[i]) || !isFinite(v[i + 1])) continue;
    const a = [m.X(i + 1), m.Y(v[i])], b = [m.X(i + 2), m.Y(v[i + 1])], mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - fs * 0.9;
    if (a[1] < m.T || a[1] > m.B || b[1] < m.T || b[1] > m.B || b[0] > m.R) continue;   // nur sichtbare Pfeile
    const pts = []; for (let t = 0; t <= 16; t++) { const s = t / 16, u = 1 - s; pts.push([u * u * a[0] + 2 * u * s * mx + s * s * b[0], u * u * a[1] + 2 * u * s * my + s * s * b[1]]); }
    S.poly(pts, { col: SQ_Q, lw: 1.3, a: 0.7 });
  }
  seqDots(S, m, v, C, { hl: k, stem: C.show.stem });
  if (isFinite(v[k - 1])) seqLab(S, m, k, v[k - 1], '\\col{v}{a_{' + k + '}=' + Sq.q(v[k - 1]) + '}', C, { id: 'K' });
  seqVals(S, m, v, C, k);
  const L = [{ s: Sx.kind === 'exp' ? 'a_n=' + Sx.tex : 'a_{n+1}=' + Sx.tex, bold: true }, { s: '\\col{v}{a_{' + k + '}=' + Sq.q(v[k - 1]) + '}' }];
  const D = Sq.detect(v.slice(0, Math.min(6, N)));
  if (D.ari !== null) L.push({ s: '\\col{g}{\\text{arithmetisch: } d=' + Sq.q(D.ari) + '}', size: 0.9 });
  else if (D.geo !== null) L.push({ s: '\\col{o}{\\text{geometrisch: } q=' + Sq.q(D.geo) + '}', size: 0.9 });
  difLines(S, R[1], L, C, { max: fs * 1.1 });
}

// ═════════════ arithmetische / geometrische Folge ═════════════
function seqSceneAG(S, W, H, C, geo) {
  const fs = C.fs, F = geo ? C.G : C.A, N = C.N, k = Math.min(geo ? C.kG : C.kA, N), t = geo ? C.tG : C.tA;
  const v = []; for (let n = 1; n <= N; n++) v.push(F.at(n));
  const R = linLayout(W, H, [{ w: 0.68, rows: [2.3] }, { w: 0.32, rows: [1] }]);
  const ns = v.map((_, i) => i + 1), ys = v.slice(); if (isFinite(t)) { ns.push(1); ys.push(t); }
  const win = seqWindow(C, R[0], ns, ys, (geo ? 'geo' : 'ari') + N);
  const title = geo ? '\\col{b}{a_n=' + Sq.q(F.a1) + '\\cdot ' + (F.q < 0 || /frac/.test(Sq.q(F.q)) ? '\\left(' + Sq.q(F.q) + '\\right)' : Sq.q(F.q)) + '^{\\,n-1}}' : '\\col{b}{a_n=' + Sq.q(F.a1) + '+(n-1)\\cdot ' + (F.d < 0 ? '(' + Sq.q(F.d) + ')' : Sq.q(F.d)) + '}';
  const m = seqFrame(S, R[0], win, C, title, geo ? '\\col{o}{q=' + Sq.q(F.q) + '}' : '\\col{g}{d=' + Sq.q(F.d) + '}');
  S.maps.main = m;
  // Gerade bzw. Kurve durch die Punkte
  if (C.show.line) {
    if (!geo) difLine(S, m, 1, F.a1, F.d, { col: SQ_D, lw: 1.2, dash: true, a: 0.6 });
    else if (F.q > 0) difCurve(S, m, x => (x >= 0.6 ? F.a1 * Math.pow(F.q, x - 1) : NaN), { col: SQ_Q, lw: 1.2, dash: true, a: 0.6, exp: C.exp });
  }
  // Treppe +d bzw. Faktor ·q
  const px = m.X(1) - m.X(0);
  for (let i = 0; i + 1 < N && i < 60; i++) {
    const a = v[i], b = v[i + 1];
    if (!geo) { difSeg(S, m, i + 1, a, i + 2, a, { col: SQ_D, lw: 1.6, a: 0.8 }); difSeg(S, m, i + 2, a, i + 2, b, { col: SQ_D, lw: 2.4 }); if (i < 8 && px > fs * 2.2) difLabel(S, m, m.X(i + 2) + fs * 0.9, m.Y((a + b) / 2), '\\col{g}{' + (F.d >= 0 ? '+' : '') + Sq.q(F.d) + '}', C, { size: 0.8 }); }
    else if (i < 8 && px > fs * 2.6 && isFinite(a) && isFinite(b)) {
      const A = [m.X(i + 1), m.Y(a)], B = [m.X(i + 2), m.Y(b)], my = Math.min(A[1], B[1]) - fs * 1.2, mx = (A[0] + B[0]) / 2, pts = [];
      if (A[1] < m.T || A[1] > m.B || B[1] < m.T || B[1] > m.B || B[0] > m.R) continue;
      for (let s = 0; s <= 16; s++) { const u = s / 16, w1 = 1 - u; pts.push([w1 * w1 * A[0] + 2 * w1 * u * mx + u * u * B[0], w1 * w1 * A[1] + 2 * w1 * u * my + u * u * B[1]]); }
      S.poly(pts, { col: SQ_Q, lw: 1.4, a: 0.85 }); if (i < 6) S.rich(mx, my - fs * 0.25, '\\col{o}{\\cdot ' + Sq.q(F.q) + '}', { size: fs * 0.8, col: 'T', al: 'c', bs: 'm' });
    }
  }
  // Zielwert
  let sol = null;
  if (isFinite(t)) {
    difLine(S, m, 0, t, 0, { col: SQ_T, lw: 1.4, dash: true });
    linPt(S, m, 'T', win.x0 + (win.x1 - win.x0) * 0.04, t, C, { fill: SQ_T, r: 5, lab: '\\col{r}{t=' + Sq.q(t) + '}', dy: -fs * 1.2, dx: fs * 1.8, w: fs * 5 });
    if (!geo) { const r = Sq.solveAri(F, t); if (r.ok && r.n <= N) sol = Math.round(r.n); }
    else { const r = Sq.solveGeo(F, t); if (r && r.n <= N) sol = r.n; }
    if (sol) difSeg(S, m, sol, 0, sol, F.at(sol), { col: SQ_T, lw: 1.4, dash: true });
  }
  seqDots(S, m, v, C, { hl: k });
  linPt(S, m, 'A1', 1, F.a1, C, { fill: SQ_P, r: 6, lab: '\\col{b}{a_1}', lines: [[1, 0], [0, 1]], w: fs * 2.4 });
  if (N >= 2) linPt(S, m, 'A2', 2, F.at(2), C, { fill: SQ_P, r: 6, lab: '\\col{b}{a_2}', lines: [[1, 0], [0, 1]], w: fs * 2.4 });
  if (k > 2) seqLab(S, m, k, F.at(k), '\\col{v}{a_{' + k + '}=' + Sq.q(F.at(k)) + '}', C, { id: 'K' });
  if (sol && sol !== k) linPt(S, m, null, sol, F.at(sol), C, { fill: SQ_T, r: 5.5, lab: '\\col{r}{n=' + sol + '}', w: fs * 4, lines: [[1, 0], [0, 1]] });
  seqVals(S, m, v, C, k);
  const L = [{ s: (geo ? 'a_n=a_1\\cdot q^{\\,n-1}' : 'a_n=a_1+(n-1)\\cdot d'), bold: true }, { s: '\\col{v}{a_{' + k + '}=' + Sq.q(F.at(k)) + '}' }];
  if (sol) L.push({ s: '\\col{r}{' + (geo ? '\\text{ab } n=' : 'a_n=' + Sq.q(t) + '\\ \\text{bei}\\ n=') + sol + '}' });
  difLines(S, R[1], L, C, { max: fs * 1.1 });
}

// ═════════════ Reihen ═════════════
function seqSceneSum(S, W, H, C) {
  const fs = C.fs, o = C.sum, n = o.n, ari = o.type === 'ari', F = ari ? o.A : o.G, nd = Math.min(n, 40);
  const a = [], s = []; let acc = 0;
  for (let k = 1; k <= nd; k++) { const v = F.at(k); a.push(v); acc += v; s.push(acc); }
  const total = ari ? Sq.sumAri(F, n) : Sq.sumGeo(F, n);
  const R = linLayout(W, H, [{ w: 1, rows: [1.15, 1.0, 0.42] }]);
  // oben: Glieder als Balken (Gauss: zweite Reihe rückwärts darüber)
  const gauss = ari && C.show.gauss && F.a1 + F.at(nd) > 0 && a.every(v => v >= 0);
  const top = gauss ? a.map((v, i) => v + a[nd - 1 - i]) : a;
  const ns = a.map((_, i) => i + 1);
  const w1 = seqWindow(C, R[0], ns.concat(ns), a.concat(top), 'sumA' + o.type + nd);
  const m1 = seqFrame(S, R[0], w1, C, '\\text{Glieder } a_k' + (gauss ? '\\ \\text{und rückwärts}\\ \\col{o}{a_{' + (nd + 1) + '-k}}' : ''), gauss ? '\\col{o}{a_1+a_{' + nd + '}=' + Sq.q(F.a1 + F.at(nd)) + '}' : '', 'a_k');
  S.maps.top = m1;
  a.forEach((v, i) => {
    const k = i + 1, x0 = m1.X(k - 0.42), x1 = m1.X(k + 0.42);
    const y0 = m1.Y(0), y1 = m1.Y(v);
    S.rect(x0, Math.min(y0, y1), x1 - x0, Math.abs(y1 - y0), { fill: SQ_P, a: 0.5, stroke: SQ_P, lw: 1 });
    if (gauss) { const r2 = a[nd - 1 - i], y2 = m1.Y(v + r2); S.rect(x0, y2, x1 - x0, y1 - y2, { fill: SQ_Q, a: 0.45, stroke: SQ_Q, lw: 1 }); }
  });
  if (gauss) difLine(S, m1, 0, F.a1 + F.at(nd), 0, { col: SQ_Q, lw: 1.4, dash: true });
  // unten: Partialsummen
  const w2 = seqWindow(C, R[1], ns, s, 'sumS' + o.type + nd);
  const m2 = seqFrame(S, R[1], w2, C, '\\text{Partialsummen } \\col{v}{s_n=a_1+\\ldots+a_n}', '', 's_n');
  S.maps.main = m2;
  s.forEach((v, i) => difDot(S, m2, i + 1, v, { fill: i + 1 === nd ? SQ_K : ST_V, stroke: 'T', r: i + 1 === nd ? 6 : 3.6, lw: 1, a: 0.85 }));
  if (n <= 40) linPt(S, m2, 'N', n, s[n - 1], C, { fill: SQ_K, r: 6.5, lab: '\\col{v}{s_{' + n + '}=' + Sq.q(s[n - 1]) + '}', w: fs * 7, lines: [[1, 0], [0, 1]] });
  const f = ari ? 's_{' + n + '}=\\frac{' + n + '\\cdot(a_1+a_{' + n + '})}{2}=\\frac{' + n + '\\cdot(' + Sq.q(F.a1) + '+' + Sq.q(F.at(n)) + ')}{2}=' + Sq.q(total)
    : 's_{' + n + '}=a_1\\cdot\\frac{q^{' + n + '}-1}{q-1}' + (Math.abs(total) < 1e15 ? '=' + Sq.q(total) : '\\approx' + Sq.fmt(total, 4));
  const L = [{ s: '\\sum_{k=1}^{' + n + '}a_k=' + (ari ? Sq.q(F.a1) + '+' + Sq.q(F.at(2)) : Sq.q(F.a1) + '+' + Sq.q(F.at(2))) + '+\\ldots+' + Sq.q(F.at(n)) }, { s: '\\col{v}{' + f + '}', bold: true }];
  if (n > 40) L.push({ s: '\\text{(gezeichnet: die ersten 40 Glieder)}', size: 0.85, col: 'M' });
  difLines(S, R[2], L, C, { max: fs * 1.1 });
}

// ═════════════ Grenzwert ═════════════
function seqSceneLim(S, W, H, C) {
  const fs = C.fs, o = C.lim, N = C.N, eps = o.eps;
  const R = linLayout(W, H, [{ w: 0.7, rows: [2.3] }, { w: 0.3, rows: [1] }]);
  let v = [], L = NaN, title = '', conv = false, Ltex = '';
  if (o.type === 'ser') { let acc = 0, NN = N; const s0 = Sq.sumInf(o.G); if (isFinite(s0)) { let a0 = 0; for (let k = 1; k <= 400; k++) { a0 += o.G.at(k); if (Math.abs(a0 - s0) < eps) { NN = Math.max(N, Math.min(400, k + 4)); break; } } } for (let k = 1; k <= NN; k++) { acc += o.G.at(k); v.push(acc); } L = Sq.sumInf(o.G); conv = isFinite(L); Ltex = Sq.q(L); title = '\\col{v}{s_n=' + Sq.q(o.G.a1) + '+' + Sq.q(o.G.at(2)) + '+\\ldots+a_n}'; }
  else { const r = Sq.limit(o.S); conv = r.conv; L = r.L; Ltex = r.Ltex; const Ne = conv ? Sq.nEps(o.S, L, eps) : null; v = Sq.terms(o.S, Ne && Ne + 4 > N ? Math.min(400, Ne + 4) : N); title = '\\col{b}{a_n=' + o.S.tex + '}'; }
  const ns = v.map((_, i) => i + 1), ys = v.slice(); if (conv) { ns.push(1, 1); ys.push(L + eps, L - eps); }
  const win = seqWindow(C, R[0], ns, ys, 'lim' + o.type + N);
  const m = seqFrame(S, R[0], win, C, title, conv ? '\\col{g}{\\lim=' + Ltex + '}' : '\\col{r}{\\text{divergent}}', o.type === 'ser' ? 's_n' : 'a_n');
  S.maps.main = m;
  let Nn = null;
  if (conv) {
    S.rect(m.L, m.Y(L + eps), m.R - m.L, m.Y(L - eps) - m.Y(L + eps), { fill: SQ_D, a: 0.13 });
    difLine(S, m, 0, L, 0, { col: SQ_D, lw: 1.6 });
    difLine(S, m, 0, L + eps, 0, { col: SQ_D, lw: 1, dash: true, a: 0.7 }); difLine(S, m, 0, L - eps, 0, { col: SQ_D, lw: 1, dash: true, a: 0.7 });
    linPt(S, m, 'E', win.x0 + (win.x1 - win.x0) * 0.93, L + eps, C, { fill: SQ_D, r: 5.5, lab: '\\col{g}{\\varepsilon=' + Sq.q(eps) + '}', dy: -fs * 1.2, dx: -fs * 2, w: fs * 5 });
    if (o.type === 'ser') { let n0 = null; for (let i = 0; i < v.length; i++) if (Math.abs(v[i] - L) < eps) { n0 = n0 || i + 1; } else n0 = null; Nn = n0; }
    else Nn = Sq.nEps(o.S, L, eps);
    if (Nn && Nn <= win.x1) { difSeg(S, m, Nn, win.y0, Nn, win.y1, { col: SQ_K, lw: 1.3, dash: true }); difLabel(S, m, m.X(Nn) + fs * 1.8, m.B - fs * 0.9, '\\col{v}{N=' + Nn + '}', C, { size: 0.9 }); }
  }
  v.forEach((y, i) => { if (!isFinite(y)) return; const inb = conv && Math.abs(y - L) < eps; difDot(S, m, i + 1, y, { fill: inb ? SQ_D : (o.type === 'ser' ? ST_V : SQ_P), stroke: 'T', r: (m.X(1) - m.X(0)) < fs ? 2.6 : 4, lw: 1 }); });
  const Ls = [];
  if (conv) { Ls.push({ s: '\\lim_{n\\to\\infty}' + (o.type === 'ser' ? 's_n' : 'a_n') + '=\\col{g}{' + Ltex + '}', bold: true }); Ls.push({ s: '\\col{g}{\\varepsilon=' + Sq.q(eps) + '}' }); if (Nn) Ls.push({ s: '\\col{v}{|' + (o.type === 'ser' ? 's_n' : 'a_n') + '-' + Ltex + '|<\\varepsilon\\ \\text{ab}\\ n=' + Nn + '}' }); if (o.type === 'ser') Ls.push({ s: 's=\\frac{a_1}{1-q}=\\frac{' + Sq.q(o.G.a1) + '}{1-' + (o.G.q < 0 ? '(' + Sq.q(o.G.q) + ')' : Sq.q(o.G.q)) + '}=' + Ltex }); }
  else Ls.push({ s: '\\col{r}{\\text{keine Annäherung an eine Zahl: divergent}}' });
  difLines(S, R[1], Ls, C, { max: fs * 1.1 });
}

// ═════════════ vollständige Induktion ═════════════
function seqSceneInd(S, W, H, C) {
  const fs = C.fs, I = C.ind.I, nMax = 8, step = Math.max(0, Math.min(nMax, C.ind.n));
  const R = linLayout(W, H, [{ w: 1, rows: [0.95, 1.25] }]);
  const r = R[0]; if (typeof stKeep === 'function') stKeep(r);
  S.rich(r.x + fs * 0.5, r.y + fs * 1.1, I.prime ? '\\text{Vermutung: } n^2-n+41\\ \\text{ist immer eine Primzahl}' : '\\text{Aussage } A(n)\\colon\\ ' + I.lhs + '=' + I.rhs, { size: fs * 1.05, col: 'T', al: 'l', bs: 'm' });
  // Dominosteine
  const gap = Math.min(fs * 7, (r.w - fs * 2) / nMax), dw = gap * 0.2, dh = Math.max(fs * 2, Math.min(r.h - fs * 4.6, gap * 1.6)), base = r.y + r.h - fs * 1.8, x0 = r.x + (r.w - gap * (nMax - 1)) / 2;
  for (let i = 1; i <= nMax; i++) {
    const cx = x0 + (i - 1) * gap, fallen = !I.prime && i <= step, ang = fallen ? (i === step ? 0.9 : 1.15) : 0;
    const pts = [[-dw / 2, 0], [dw / 2, 0], [dw / 2, -dh], [-dw / 2, -dh]].map(p => { const px = p[0] - dw / 2, py = p[1]; const c = Math.cos(ang), s = Math.sin(ang); return [cx + dw / 2 + px * c - py * s, base + px * s + py * c]; });
    const bad = I.prime && i === nMax;
    S.poly(pts, { fill: bad ? SQ_T : fallen ? SQ_D : ST_B, a: fallen || bad ? 0.75 : 0.3, col: 'T', lw: 1.3, close: true });
    S.rich(cx, base + fs * 1.0, I.prime ? (i === nMax ? 'n=41' : 'n=' + i) : 'A(' + i + ')', { size: fs * 0.85, col: bad ? SQ_T : 'T', al: 'c', bs: 'm' });
    if (!I.prime && i < nMax) S.rich(cx + gap / 2, base - dh - fs * 0.6, i < step ? '\\col{g}{\\Rightarrow}' : '\\Rightarrow', { size: fs * 0.9, col: 'M', al: 'c', bs: 'm' });
  }
  S.line(x0 - gap * 0.5, base, x0 + gap * (nMax - 0.5), base, { col: 'L', lw: 1.4 });
  // Tabelle
  const rows = [];
  if (I.prime) { [1, 2, 3, 4, 5, 10, 40, 41].forEach(n => { const p = I.p(n), ok = Sq.isPrime(p); rows.push([String(n), String(p), ok ? '\\col{g}{\\text{prim}}' : '\\col{r}{' + Sq.smallestFactor(p) + '\\cdot' + p / Sq.smallestFactor(p) + '}']); }); linTab(S, R[1], [{ h: 'n', w: 3 }, { h: 'n^2-n+41', w: 6.5 }, { h: '\\text{prim?}', w: 6 }], rows, 7, C); return; }
  let acc = 0;
  for (let n = 1; n <= nMax; n++) { acc += I.s(n); rows.push([String(n), Sq.q(acc), Sq.q(I.r(n)), Math.abs(acc - I.r(n)) < 1e-9 ? '\\col{g}{✓}' : '\\col{r}{✗}']); }
  linTab(S, R[1], [{ h: 'n', w: 3 }, { h: '\\text{linke Seite}', w: 7 }, { h: '\\text{rechte Seite}', w: 7 }, { h: '', w: 2.4 }], rows, step - 1, C);
}

const SEQ_SCENES = { def: seqSceneDef, ari: (S, W, H, C) => seqSceneAG(S, W, H, C, false), geo: (S, W, H, C) => seqSceneAG(S, W, H, C, true), sum: seqSceneSum, lim: seqSceneLim, ind: seqSceneInd };
function seqBuildScene(W, H, C) {
  const S = linScene(), fn = SEQ_SCENES[C.view];
  if (fn) fn(S, W, H, C);
  return S;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { seqBuildScene, SEQ_SCENES };
