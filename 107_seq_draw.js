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
  const fixed = isFinite(w.x0) && isFinite(w.x1) && isFinite(w.y0) && isFinite(w.y1) && w.x1 > w.x0 && w.y1 > w.y0;
  if (fixed && !o.top) { const E = { x0: w.x0, x1: w.x1, y0: w.y0, y1: w.y1 }; return autoWin('seq', '', E, need, C, E); }
  let x1 = Math.max(...need.map(p => p[0]), 3), y0 = Math.min(0, ...need.map(p => p[1])), y1 = Math.max(0, ...need.map(p => p[1]));
  if (o.y) { y0 = Math.min(y0, o.y[0]); y1 = Math.max(y1, o.y[1]); }
  if (y1 - y0 < 1e-9) { y0 -= 1; y1 += 1; }
  const py = (y1 - y0) * 0.12;
  const T = { x0: -0.4, x1: x1 + Math.max(0.8, x1 * 0.05), y0: y0 < 0 ? y0 - py : -py * 0.6, y1: y1 > 0 ? y1 + py : py * 0.6 };
  if (o.top) {                                                          // oberes Bild (Reihe): eigene y-Achse, x wie das untere Bild
    if (fixed) { T.x0 = w.x0; T.x1 = w.x1; return T; }
    return autoWin('seqTop', C.view + '|' + key, T, need, C);
  }
  return autoWin('seq', C.view + '|' + key, T, need, C);
}
function seqFrame(S, r, win, C, title, info, ylab) {
  const xr = win.x1 - win.x0, st = xr <= 14 ? 1 : xr <= 30 ? 2 : xr <= 70 ? 5 : xr <= 140 ? 10 : xr <= 300 ? 20 : Stat.niceStep(xr, 6);
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
  const ns = v.map((_, i) => i + 1), win = seqWindow(C, R[0], ns, v, 'def' + Sx.kind + N + '|' + (Sx.raw || '') + '|' + (Sx.a1 === undefined ? '' : Sx.a1));
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
  const win = seqWindow(C, R[0], ns, ys, (geo ? 'geo' : 'ari') + N + '|' + F.a1 + '|' + (geo ? F.q : F.d));
  const title = geo ? '\\col{b}{a_n=' + Sq.q(F.a1) + '\\cdot ' + (F.q < 0 || /frac/.test(Sq.q(F.q)) ? '\\left(' + Sq.q(F.q) + '\\right)' : Sq.q(F.q)) + '^{\\,n-1}}' : '\\col{b}{a_n=' + Sq.q(F.a1) + '+(n-1)\\cdot ' + (F.d < 0 ? '(' + Sq.q(F.d) + ')' : Sq.q(F.d)) + '}';
  const m = seqFrame(S, R[0], win, C, title, geo ? '\\col{o}{q=' + Sq.q(F.q) + '}' : '\\col{g}{d=' + Sq.q(F.d) + '}');
  S.maps.main = m;
  // Gerade bzw. Kurve durch die Punkte
  if (C.show.line) {
    if (!geo) difLine(S, m, 1, F.a1, F.d, { hl: 'dl', col: SQ_D, lw: 1.2, dash: true, a: 0.6 });
    else if (F.q > 0) difCurve(S, m, x => (x >= 0.6 ? F.a1 * Math.pow(F.q, x - 1) : NaN), { hl: 'dl', col: SQ_Q, lw: 1.2, dash: true, a: 0.6, exp: C.exp });
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
  const R = linLayout(W, H, [{ w: 1, rows: [1.15, 1.0, 0.42] }], 1.15);   // schmal: oberes Bild nicht übergross (sonst wird das untere winzig)
  // oben: Glieder als Balken (Gauss: zweite Reihe rückwärts darüber)
  const gOk = ari && F.a1 + F.at(nd) > 0 && a.every(v => v >= 0), gAng = gOk && typeof C.gaussAng === 'number' ? C.gaussAng : null;
  const gauss = gOk && (C.show.gauss || gAng !== null);
  const top = gauss ? a.map((v, i) => v + a[nd - 1 - i]) : a;
  const ns = a.map((_, i) => i + 1);
  const w1 = seqWindow(C, R[0], ns.concat(ns), a.concat(top), 'sumA' + o.type + nd + '|' + F.a1 + '|' + (ari ? F.d : F.q), { top: true });
  const m1 = seqFrame(S, R[0], w1, C, '\\text{Glieder } a_k' + (gauss ? '\\ \\text{und rückwärts}\\ \\col{o}{a_{' + (nd + 1) + '-k}}' : ''), gauss ? '\\col{o}{a_1+a_{' + nd + '}=' + Sq.q(F.a1 + F.at(nd)) + '}' : '', 'a_k');
  S.maps.top = m1;
  a.forEach((v, i) => {
    const k = i + 1, x0 = m1.X(k - 0.42), x1 = m1.X(k + 0.42);
    const y0 = m1.Y(0), y1 = m1.Y(v);
    S.rect(x0, Math.min(y0, y1), x1 - x0, Math.abs(y1 - y0), { fill: SQ_P, a: 0.5, stroke: SQ_P, lw: 1 });
    shlBox(S, 'bars', x0, Math.min(y0, y1), x1, Math.max(y0, y1));
    if (gauss && gAng === null) { const r2 = a[nd - 1 - i], y2 = m1.Y(v + r2); S.rect(x0, y2, x1 - x0, y1 - y2, { fill: SQ_Q, a: 0.45, stroke: SQ_Q, lw: 1 }); }
  });
  if (gauss && gAng !== null) {
    // Animation (gAng von 0 bis 1): eine Kopie der Treppe wird erst gewendet (Reihenfolge rückwärts), dann nach oben geklappt –
    // zusammen eine halbe Drehung; sie setzt sich genau auf die Balken und ergänzt sie zum Rechteck.
    const cx = m1.X((nd + 1) / 2), cy = m1.Y((F.a1 + F.at(nd)) / 2), kx = gAng < 0.5 ? Math.cos(Math.PI * gAng * 2) : -1, ky = gAng < 0.5 ? 1 : Math.cos(Math.PI * (gAng - 0.5) * 2), mp = (x, y) => [cx + (x - cx) * kx, cy + (y - cy) * ky];
    a.forEach((v, i) => { const k = i + 1, x0 = m1.X(k - 0.42), x1 = m1.X(k + 0.42), y0 = m1.Y(0), y1 = m1.Y(v); S.poly([mp(x0, y0), mp(x1, y0), mp(x1, y1), mp(x0, y1)], { fill: SQ_Q, a: 0.45, close: true, col: SQ_Q, lw: 1 }); });
  }
  if (gauss) difLine(S, m1, 0, F.a1 + F.at(nd), 0, { col: SQ_Q, lw: 1.4, dash: true });
  // unten: Partialsummen
  const w2 = seqWindow(C, R[1], ns, s, 'sumS' + o.type + nd);
  const m2 = seqFrame(S, R[1], w2, C, '\\text{Partialsummen } \\col{v}{s_n=a_1+\\ldots+a_n}', '', 's_n');
  S.maps.main = m2;
  // Partialsummen hell, der ziehbare Punkt s_n kräftig violett mit Ring
  s.forEach((v, i) => { if (i + 1 < nd) difDot(S, m2, i + 1, v, { fill: SQ_P, stroke: SQ_P, r: 3.4, lw: 1, a: 0.55 }); });
  const pN = [m2.X(nd), m2.Y(s[nd - 1])];
  if (pN[0] >= m2.L && pN[0] <= m2.R && pN[1] >= m2.T && pN[1] <= m2.B) S.circ(pN[0], pN[1], 12, { stroke: SQ_K, lw: 2.2, a: 0.55 });
  linPt(S, m2, 'N', nd, s[nd - 1], C, { fill: SQ_K, r: 7.5, hl: 'N', lab: '\\col{v}{s_{' + n + '}=' + Sq.q(n === nd ? s[nd - 1] : total) + '}', w: fs * 7, lines: [[1, 0], [0, 1]] });
  const f = ari ? 's_{' + n + '}=\\frac{' + n + '\\cdot(a_1+a_{' + n + '})}{2}=\\frac{' + n + '\\cdot(' + Sq.q(F.a1) + '+' + Sq.q(F.at(n)) + ')}{2}=' + Sq.q(total)
    : 's_{' + n + '}=a_1\\cdot\\frac{q^{' + n + '}-1}{q-1}' + (Math.abs(total) < 1e15 ? '=' + Sq.q(total) : '\\approx' + Sq.fmt(total, 4));
  const L = [{ s: '\\sum_{k=1}^{' + n + '}a_k=' + (ari ? Sq.q(F.a1) + '+' + Sq.q(F.at(2)) : Sq.q(F.a1) + '+' + Sq.q(F.at(2))) + '+\\ldots+' + Sq.q(F.at(n)) }, { s: '\\col{v}{' + f + '}', bold: true }];
  if (n > 40) L.push({ s: '\\text{(gezeichnet: die ersten 40 Glieder)}', size: 0.85, col: 'M' });
  difLines(S, R[2], L, C, { max: fs * 1.1 });
}

// ═════════════ Grenzwert ═════════════
// Grenzwert: Glieder (n | a_n) bzw. Partialsummen (n | s_n); beliebig viele (ab 400 nur noch jedes k-te gezeichnet)
const seqGeoPart = (G, n) => (Math.abs(G.q - 1) < 1e-12 ? G.a1 * n : G.a1 * (1 - Math.pow(G.q, n)) / (1 - G.q));
function seqLimN(o, L, eps) {                                               // ab welchem n liegen alle Glieder im Streifen?
  if (o.type === 'ser') { const q = Math.abs(o.G.q), c = Math.abs(o.G.a1 / (1 - o.G.q)); if (q >= 1 || !(c > 0)) return null; if (c < eps) return 1; return Math.max(1, Math.floor(Math.log(eps / c) / Math.log(q)) + 1); }
  return Sq.nEps(o.S, L, eps);
}
function seqSceneLim(S, W, H, C) {
  const fs = C.fs, o = C.lim, eps = o.eps, A = C.limA;
  const R = linLayout(W, H, [{ w: 0.7, rows: [2.3] }, { w: 0.3, rows: [1] }]);
  let L = NaN, title = '', conv = false, Ltex = '', at;
  if (o.type === 'ser') { L = Sq.sumInf(o.G); conv = isFinite(L); Ltex = Sq.q(L); at = n => seqGeoPart(o.G, n); title = '\\col{v}{s_n=' + Sq.q(o.G.a1) + '+' + Sq.q(o.G.at(2)) + '+\\ldots+a_n}'; }
  else { const r = Sq.limit(o.S); conv = r.conv; L = r.L; Ltex = r.Ltex; at = n => o.S.f(n); title = '\\col{b}{a_n=' + o.S.tex + '}'; }
  const Nn = conv ? seqLimN(o, L, eps) : null;
  const N = A ? A.N : Math.min(1e6, Math.max(C.N, Nn && Nn + 4 > C.N && Nn < 2000 ? Nn + 4 : C.N));
  const stride = N > 800 ? Math.ceil((N - 400) / 400) : 1, pts = [];
  for (let n = 1; n <= N; n += n < 400 ? 1 : stride) pts.push([n, at(n)]);
  if (pts[pts.length - 1][0] !== N) pts.push([N, at(N)]);
  const ns = pts.map(p => p[0]), ys = pts.map(p => p[1]); if (conv) { ns.push(1, 1); ys.push(L + eps, L - eps); }
  const win = A ? A.win : seqWindow(C, R[0], ns, ys, 'lim' + o.type + C.N + '|' + (o.type === 'ser' ? o.G.a1 + ',' + o.G.q : o.S.raw));
  const m = seqFrame(S, R[0], win, C, title, conv ? '\\col{g}{\\lim=' + Ltex + '}' : '\\col{r}{\\text{divergent}}', o.type === 'ser' ? 's_n' : 'a_n');
  S.maps.main = m;
  if (conv) {
    const ya = Math.max(m.T, Math.min(m.B, m.Y(L + eps))), yb = Math.max(m.T, Math.min(m.B, m.Y(L - eps)));
    S.rect(m.L, ya, m.R - m.L, yb - ya, { fill: SQ_D, a: 0.13 });
    difLine(S, m, 0, L, 0, { hl: 'lim', col: SQ_D, lw: 1.6 });
    difLine(S, m, 0, L + eps, 0, { hl: 'eps', col: SQ_D, lw: 1, dash: true, a: 0.7 }); difLine(S, m, 0, L - eps, 0, { hl: 'eps', col: SQ_D, lw: 1, dash: true, a: 0.7 });
    if (!A) linPt(S, m, 'E', win.x0 + (win.x1 - win.x0) * 0.93, L + eps, C, { fill: SQ_D, r: 5.5, lab: '\\col{g}{\\varepsilon=' + Sq.qs(eps) + '}', dy: -fs * 1.2, dx: -fs * 2, w: fs * 5 });
    if (Nn && Nn <= win.x1) { difSeg(S, m, Nn, win.y0, Nn, win.y1, { col: SQ_K, lw: 1.3, dash: true }); difLabel(S, m, m.X(Nn) + fs * 2.2, m.B - fs * 0.9, '\\col{v}{N=' + seqBig(Nn) + '}', C, { size: 0.9 }); }
  }
  const dense = (m.X(stride) - m.X(0)) < fs * 1.0, rr = dense ? 2.2 : 4;
  pts.forEach(([n, y]) => { if (!isFinite(y)) return; const inb = conv && Math.abs(y - L) < eps; difDot(S, m, n, y, { fill: inb ? SQ_D : (o.type === 'ser' ? ST_V : SQ_P), stroke: dense ? (inb ? SQ_D : SQ_P) : 'T', r: rr, lw: dense ? 0.5 : 1 }); });
  if (A) S.rich(m.L + fs * 0.6, m.T + fs * 2.4, '\\col{g}{\\varepsilon=' + seqSmall(eps) + '}\\quad\\col{v}{N=' + (Nn ? seqBig(Nn) : '?') + '}\\quad n\\le ' + seqBig(N), { size: fs * 1.05, col: 'T', al: 'l', bs: 'm' });
  const Ls = [];
  if (conv) { Ls.push({ s: '\\lim_{n\\to\\infty}' + (o.type === 'ser' ? 's_n' : 'a_n') + '=\\col{g}{' + Ltex + '}', bold: true }); Ls.push({ s: '\\col{g}{\\varepsilon=' + seqSmall(eps) + '}' }); if (Nn) Ls.push({ s: '\\col{v}{|' + (o.type === 'ser' ? 's_n' : 'a_n') + '-' + Ltex + '|<\\varepsilon\\ \\text{ab}\\ n=' + seqBig(Nn) + '}' }); }
  else Ls.push({ s: '\\col{r}{\\text{keine Annäherung an eine Zahl: divergent}}' });
  difLines(S, R[1], Ls, C, { max: fs * 1.1 });
}
// grosse Zahlen mit Tausender-Abstand, kleine ε als Dezimalzahl mit zwei gültigen Ziffern
const seqBig = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');
const seqSmall = e => Sq.qs(e);

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

// ═════════════ Summenzeichen verstehen ═════════════
// C.sig = {S (Folge in n), tex (Summand in k), m, n, k}. Oben das Summenzeichen in Teilen (untere Grenze grün, obere orange,
// Summand blau, Laufvariable violett), darunter die ausgeschriebene Summe (erste 5 und letzte 5 Summanden);
// unten die Summanden als Balken über k, Grenzen m, n und Laufvariable k ziehbar.
const SQ_LO = ST_G, SQ_HI = ST_O;
function seqSigTerms(G) {
  const f = k => G.S.f(k), all = [];
  for (let k = G.m; k <= G.n; k++) all.push(k);
  const show = all.length <= 10 ? all : all.slice(0, 5).concat([null], all.slice(-5));
  return { all, show, f, total: all.reduce((a, k) => a + f(k), 0) };
}
// Summe/Differenz auf oberster Ebene? (dann braucht ein Summand Klammern)
function seqTopPM(t) { let d = 0; t = String(t); for (let i = 0; i < t.length; i++) { const c = t[i]; if (c === '{' || c === '(') d++; else if (c === '}' || c === ')') d--; else if ((c === '+' || c === '-') && d === 0 && i > 0) return true; } return false; }
// Wert genau: ganze Zahl, Bruch mit kleinem Nenner, sonst 10 gültige Ziffern (1 − 2⁻³⁰ ist nicht «1»)
function seqSigQ(v) {
  if (!isFinite(v)) return Sq.q(v);
  if (Math.abs(v - Math.round(v)) < 1e-12 * Math.max(1, Math.abs(v))) return String(Math.round(v) + 0);
  // Bruch per Kettenbruch (Nenner bis 10⁴), z. B. 1/32 oder 3/8
  { let h0 = 1, h1 = 0, k0 = 0, k1 = 1, x = Math.abs(v);
    for (let i = 0; i < 40; i++) { const a = Math.floor(x), h = a * h0 + h1, k = a * k0 + k1; h1 = h0; h0 = h; k1 = k0; k0 = k; if (k0 > 1e4) break;
      if (Math.abs(Math.abs(v) - h0 / k0) < 1e-14 * Math.max(1, Math.abs(v))) return (v < 0 ? '-' : '') + '\\frac{' + h0 + '}{' + k0 + '}';
      const f = x - a; if (f < 1e-15) break; x = 1 / f; } }
  // sehr kleine oder grosse Zahlen: 1.49·10⁻⁸ statt 1.49e-8
  if (Math.abs(v) < 1e-4 || Math.abs(v) >= 1e12) { const [mn, ex] = v.toExponential(3).split('e'); return String(+mn) + '\\cdot 10^{' + (+ex) + '}'; }
  return String(+v.toPrecision(10));
}
// k im Summanden (LaTeX) durch die Zahl ersetzen: 2k → 2·3, k² → 3², (1/2)^k → (1/2)³, negative Zahlen in Klammern
function seqSigSubTex(tex, k) {
  const num = k < 0 ? '\\left(' + k + '\\right)' : String(k);
  return String(tex).replace(/(\\[A-Za-z]+)|k/g, (m, cmd, off, str) => {
    if (cmd) return cmd;
    const prev = str.slice(0, off).replace(/\s+$/, '').slice(-1);
    return (/[0-9})]/.test(prev) ? '\\cdot ' : '') + num;
  });
}
const seqSigSub = (G, k) => { const t = seqSigSubTex(G.tex, k); return t === G.tex && !/k/.test(G.tex) ? seqSigQ(G.S.f(k)) : t; };
function seqSceneSig(S, W, H, C) {
  const fs = C.fs, G = C.sig, T = seqSigTerms(G), cnt = T.all.length;
  const meas = (t, z) => (typeof finRichSize === 'function' ? finRichSize(t, z) : { w: difCellBox(t, z).w, a: z * 0.75, d: z * 0.25 });
  // ausgeschrieben: Summand für Summand (erste 5 und letzte 5) – Zeichen vorbereiten, damit der Platz danach bemessen wird
  const piece = (k, txt) => (k === G.m ? '\\col{g}{' + txt + '}' : k === G.n ? '\\col{o}{' + txt + '}' : k === G.k ? '\\col{v}{' + txt + '}' : txt);
  const par = t => (seqTopPM(t) ? '\\left(' + t + '\\right)' : t);
  const idsOf = k => ['t' + k].concat(k === G.m ? ['m'] : [], k === G.n ? ['n'] : [], k === G.k ? ['k'] : []);
  const toks1 = [{ s: '=' }], toks2 = [{ s: '=' }];
  T.show.forEach((k, i) => {
    if (i) { toks1.push({ s: '+' }); toks2.push({ s: '+' }); }
    if (k === null) { toks1.push({ s: '\\ldots' }); toks2.push({ s: '\\ldots' }); return; }
    const v = T.f(k);
    toks1.push({ s: piece(k, par(seqSigSub(G, k))), ids: idsOf(k) });
    toks2.push({ s: piece(k, v < 0 ? '\\left(' + seqSigQ(v) + '\\right)' : seqSigQ(v)), ids: idsOf(k) });
  });
  toks2.push({ s: '=' }, { s: seqSigQ(T.total), bold: true });
  const flow = (toks, z, rw) => { const lines = [[]]; let x = 0; toks.forEach(t => { const M = meas(t.s, z), w = M.w + z * 0.12; if (x + w > rw && lines[lines.length - 1].length > 1) { lines.push([]); x = 0; } lines[lines.length - 1].push({ t, x, w, M }); x += w; });
    const A = Math.max(...toks.map(t => meas(t.s, z).a)), D = Math.max(...toks.map(t => meas(t.s, z).d)), lh = A + D + z * 0.45; return { lines, A, D, lh, h: lines.length * lh }; };
  // Höhe oben = Kopf (Summenzeichen und Erklärung) + ausgeschriebene Summe in normaler Schrift; der Rest gehört den Balken
  const hdr = fs * (/\\frac/.test(G.tex) ? 10.6 : 8.6), z0 = fs * 1.15, need = flow(toks1, z0, W - fs * 1.2).h + flow(toks2, z0, W - fs * 1.2).h + fs * 0.6;
  const topH = Math.min(H * 0.62, hdr + need);
  const R = linLayout(W, H, [{ w: 1, rows: [topH, Math.max(H * 0.38, H - topH)] }], topH);
  const r0 = R[0]; stKeepFrame(r0);
  // ── Summenzeichen wie in LaTeX: ein einziger Formelsatz (grosses ∑ mit Grenzen darüber/darunter) ──
  // Die Lage der Teile wird mit denselben Massen berechnet wie im Formelsatz (51_fin_draw.js, Knoten 'sum'),
  // damit die Grenzen und der Summand einzeln hervorgehoben werden können.
  S.sigHot = [];
  const hot = (ids, b) => { S.sigHot.push({ ids, b }); ids.forEach(id => shlBox(S, id, b[0], b[1], b[2], b[3])); };
  const hiT = '\\col{o}{' + G.n + '}', loT = '\\col{v}{k}\\col{g}{=' + G.m + '}', smd = '\\col{b}{' + (seqTopPM(G.tex) ? '\\left(' + G.tex + '\\right)' : G.tex) + '}', tot = '=' + seqSigQ(T.total);
  const full = '\\sum_{' + loT + '}^{' + hiT + '}' + smd + tot;
  let sz = fs * 1.7; const avail = r0.w * 0.46;
  while (sz > fs && meas(full, sz).w > avail) sz -= 0.5;
  const F = meas(full, sz), x0 = r0.x + fs * 0.8, top0 = r0.y + Math.max(fs * 0.4, (Math.min(hdr, r0.h * 0.6) - (F.a + F.d)) / 2), base = top0 + F.a;
  S.rich(x0, top0, full, { size: sz, col: 'T', al: 'l', bs: 't' });
  { const mm = sz * (typeof FIN_MK !== 'undefined' ? FIN_MK : 1.1), gw = 1.444 * mm, ga = 0.95 * mm, gd = 0.45 * mm, gap = 0.12 * mm;
    const H = meas(hiT, sz * 0.7), Lo = meas(loT, sz * 0.7), ws = Math.max(gw, H.w, Lo.w) + mm * 0.1, Sm = meas(smd, sz);
    const hb = base - ga - gap - H.d, lb = base + gd + gap + Lo.a;
    hot(['n'], [x0 + (ws - H.w) / 2 - 3, hb - H.a - 2, x0 + (ws + H.w) / 2 + 3, hb + H.d + 2]);
    hot(['m'], [x0 + (ws - Lo.w) / 2 - 3, lb - Lo.a - 2, x0 + (ws + Lo.w) / 2 + 3, lb + Lo.d + 2]);
    hot(['f'], [x0 + ws - 2, base - Sm.a - 2, x0 + ws + Sm.w + 2, base + Sm.d + 2]); }
  // Erklärung rechts daneben
  const ex0 = Math.max(x0 + F.w + fs * 1.5, r0.x + r0.w * 0.5);
  difLines(S, { x: ex0, y: r0.y + fs * 0.4, w: r0.x + r0.w - ex0 - fs * 0.5, h: Math.min(hdr, r0.h * 0.6) - fs * 0.6 }, [
    { s: '\\text{untere Grenze: }\\col{g}{k=' + G.m + '}\\text{ (erster Summand)}', hl: 'm', size: 0.95 },
    { s: '\\text{obere Grenze: }\\col{o}{k=' + G.n + '}\\text{ (letzter Summand)}', hl: 'n', size: 0.95 },
    { s: '\\text{Summand: }\\col{b}{a_k=' + G.tex + '}', hl: 'f', size: 0.95 },
    { s: '\\text{Anzahl Summanden: }' + G.n + '-' + (G.m < 0 ? '(' + G.m + ')' : G.m) + '+1=' + cnt, size: 0.95 },
    { s: '\\col{v}{k=' + G.k + ':\\ a_{' + G.k + '}=' + seqSigSub(G, G.k) + (seqSigSub(G, G.k) !== seqSigQ(T.f(G.k)) ? '=' + seqSigQ(T.f(G.k)) : '') + '}', hl: 'k', size: 0.95 }
  ], C, { max: fs * 1.05, oneCol: true });
  const ry = r0.y + Math.min(hdr, r0.h * 0.6), rw = r0.w - fs * 1.2, rh = r0.y + r0.h - ry;
  let z = z0, L1, L2;
  for (;;) { L1 = flow(toks1, z, rw); L2 = flow(toks2, z, rw); if (L1.h + L2.h <= rh || z <= Math.max(8, fs * 0.8)) break; z -= 0.5; }
  let yy = ry;
  [L1, L2].forEach(L => {
    L.lines.forEach(line => {
      const b = yy + L.A;
      line.forEach(({ t, x, w, M }) => {
        const px = r0.x + fs * 0.6 + x;
        S.rich(px, b - M.a, t.s, { size: z, col: 'T', al: 'l', bs: 't', bold: !!t.bold });
        if (t.ids) hot(t.ids, [px - 2, b - M.a - 2, px + w - z * 0.12 + 2, b + M.d + 2]);
      });
      yy += L.lh;
    });
  });
  // ── Balken ──
  const ks = T.all, vals = ks.map(T.f), lo = Math.min(0, ...vals.filter(isFinite)), hi = Math.max(0, ...vals.filter(isFinite));
  const pad = Math.max(0.6, cnt * 0.04), dy = (hi - lo) * 0.12 || 1;
  const w0 = C.win && isFinite(C.win.x0) && C.win.x0 !== null ? C.win : null;
  const win = w0 ? { x0: w0.x0, x1: w0.x1, y0: Math.min(w0.y0, lo - dy), y1: Math.max(w0.y1, hi + dy) } : { x0: G.m - pad - 0.5, x1: G.n + pad + 0.5, y0: lo - (lo < 0 ? dy : dy * 0.4), y1: hi + dy * 1.6 };
  const m = seqFrame(S, R[1], win, C, '\\text{Summanden als Balken über } \\col{v}{k}', '\\col{v}{a_{' + G.m + '}+\\ldots+a_{' + G.k + '}=' + Sq.q(ks.filter(k => k <= G.k).reduce((a, k) => a + T.f(k), 0)) + '}', 'a_k');
  m.win = win; S.maps.main = m;
  const bw = Math.max(1, Math.min(m.X(1) - m.X(0), 80) * 0.7), step = cnt > 400 ? Math.ceil(cnt / 400) : 1;
  ks.forEach((k, i) => {
    if (i % step && k !== G.k && k !== G.m && k !== G.n) return;
    const v = T.f(k); if (!isFinite(v)) return;
    const x = m.X(k), y0 = m.Y(0), y1 = m.Y(v), done = k <= G.k;
    const col = k === G.k ? SQ_K : k === G.m ? SQ_LO : k === G.n ? SQ_HI : SQ_P;
    S.rect(x - bw / 2, Math.min(y0, y1), bw, Math.abs(y1 - y0), { fill: col, a: done ? 0.75 : 0.25, stroke: col, lw: 1 });
    const bb = [x - bw / 2 - 1, Math.min(y0, y1) - 1, x + bw / 2 + 1, Math.max(y0, y1) + 1];
    shlBox(S, 'f', ...bb); if (cnt <= 400) hot(idsOf(k), bb); else idsOf(k).forEach(id => shlBox(S, id, ...bb));
  });
  const yb = m.Y(0) > m.B - 4 ? m.B : Math.min(m.B, m.Y(0));
  [['m', G.m, SQ_LO, '\\col{g}{m=' + G.m + '}'], ['n', G.n, SQ_HI, '\\col{o}{n=' + G.n + '}']].forEach(([id, k, col, lab]) => {
    const px = m.X(k); if (px < m.L - 2 || px > m.R + 2) return;
    S.circ(px, yb, 7, { fill: col, stroke: 'T', lw: 1.2 }); S.pts.push({ id, x: px, y: yb, r: 12 }); shlC(S, id, px, yb, 13);
    difLabel(S, m, px, yb - fs * 1.2, lab, C, { size: 0.9 });
  });
  { const v = T.f(G.k); if (isFinite(v)) { const px = m.X(G.k), py = Math.max(m.T, Math.min(m.B, m.Y(v))); S.circ(px, py, 7, { fill: SQ_K, stroke: 'T', lw: 1.2 }); S.pts.push({ id: 'k', x: px, y: py, r: 12 }); shlC(S, 'k', px, py, 13); difLabel(S, m, px, py + (v >= 0 ? -fs * 1.3 : fs * 1.3), '\\col{v}{k=' + G.k + '}', C, { size: 0.9 }); } }
}
const SEQ_SCENES = { sig: seqSceneSig, def: seqSceneDef, ari: (S, W, H, C) => seqSceneAG(S, W, H, C, false), geo: (S, W, H, C) => seqSceneAG(S, W, H, C, true), sum: seqSceneSum, lim: seqSceneLim, ind: seqSceneInd };
function seqBuildScene(W, H, C) {
  const S = linScene(), fn = SEQ_SCENES[C.view];
  if (fn) fn(S, W, H, C);
  return S;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { seqBuildScene, SEQ_SCENES };
